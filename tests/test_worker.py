import hashlib
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'ai-worker'))
from PIL import Image
from worker import Worker, read_json, write_json, validate_job


class WorkerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.worker = Worker(self.root, sync_timeout=0)

    def tearDown(self):
        self.temp.cleanup()

    def queue(self, job_id='job_test', **changes):
        folder = self.root / 'queue' / job_id
        folder.mkdir()
        Image.new('RGBA', (40, 20), 'red').save(folder/'artwork.png')
        job = dict(job_id=job_id, views=3, size=128, tilt=0, mode='test-preview',
                   state='queued', output_dir=f'output/{job_id}',
                   artwork_sha256=hashlib.sha256((folder/'artwork.png').read_bytes()).hexdigest())
        job.update(changes)
        write_json(folder/'job.json',job)
        return folder, job

    def test_done_and_idempotent(self):
        folder, job = self.queue()
        self.worker.run(once=True)
        out = self.root/'output/job_test'
        m = read_json(out/'manifest.json')
        self.assertEqual(m['state'], 'done')
        self.assertEqual(len(m['views']), 3)
        self.assertTrue(m['is_test'])
        for view in m['views']:
            self.assertEqual(hashlib.sha256((out/view['file']).read_bytes()).hexdigest(),view['sha256'])
            with Image.open(out/view['file']) as image:
                self.assertEqual(image.size,(128,128))
        before = (out/'manifest.json').read_bytes()
        Worker(self.root).run(once=True)
        self.assertEqual(before,(out/'manifest.json').read_bytes())
        self.assertEqual(read_json(out/'progress.json')['completed'],3)
        self.assertEqual(read_json(self.root/'worker-status.json')['state'],'stopped')
        self.assertTrue((folder/'artwork.png').exists())

    def test_sync_wait_then_complete(self):
        folder, job = self.queue()
        original=(folder/'artwork.png').read_bytes()
        (folder/'artwork.png').write_bytes(b'partial')
        self.worker.sync_timeout=120
        self.worker.scan()
        self.assertFalse((self.root/'processing/job_test').exists())
        (folder/'artwork.png').write_bytes(original)
        self.worker.scan()
        self.assertEqual(read_json(self.root/'output/job_test/manifest.json')['state'],'done')

    def test_bad_job_does_not_block_next(self):
        self.queue('job_bad',output_dir='../../escape')
        self.queue('job_good')
        self.worker.scan()
        self.assertEqual(read_json(self.root/'output/job_bad/manifest.json')['state'],'error')
        self.assertEqual(read_json(self.root/'output/job_good/manifest.json')['state'],'done')

    def test_adapter_failure(self):
        self.queue()
        with patch('worker.create_adapter', side_effect=RuntimeError('test failure')):
            self.worker.scan()
        self.assertEqual(read_json(self.root/'output/job_test/progress.json')['state'],'error')

    def test_interrupted_job(self):
        (self.root/'processing/job_interrupted').mkdir()
        self.worker.recover()
        self.assertEqual(read_json(self.root/'output/job_interrupted/manifest.json')['state'],'error')

    def test_missing_publish_marker(self):
        folder,_=self.queue()
        (folder/'job.json').unlink()
        self.worker.scan()
        self.assertFalse((self.root/'processing/job_test').exists())

    def test_bad_parameters(self):
        _,job=self.queue()
        for key,value in [('views',True),('size',99999),('tilt',float('nan')),('mode','shell'),('job_id','../x')]:
            with self.assertRaises(ValueError):
                validate_job({**job,key:value},'job_test')

    def test_active_worker_refused(self):
        self.worker.acquire()
        self.worker.heartbeat()
        try:
            with self.assertRaises((RuntimeError,OSError)):
                Worker(self.root).acquire()
        finally:
            self.worker.lock.close()


if __name__ == '__main__':
    unittest.main()

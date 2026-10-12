"""Single-session Drive queue worker. No uploads, credentials or GitHub writes."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import threading
import time
import uuid

from PIL import Image
from model_adapter import create_adapter

VERSION = "0.1.0"
ID = re.compile(r"job_[A-Za-z0-9_-]{1,100}\Z")


def read_json(path):
    if path.stat().st_size > 65536:
        raise ValueError("JSON exceeds 64 KiB")
    return json.loads(path.read_text(encoding="utf-8-sig"))


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + "." + uuid.uuid4().hex + ".tmp")
    try:
        tmp.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
        os.replace(tmp, path)
    finally:
        tmp.unlink(missing_ok=True)


def validate_job(job, job_id):
    if not ID.fullmatch(job_id) or job.get("job_id") != job_id:
        raise ValueError("Invalid job_id")
    for key, low, high in (("views", 1, 36), ("size", 128, 2048)):
        value = job.get(key)
        if type(value) is not int or not low <= value <= high:
            raise ValueError(f"Invalid {key}")
    tilt = job.get("tilt")
    if type(tilt) not in (int, float) or not -90 <= tilt <= 90:
        raise ValueError("Invalid tilt")
    if job.get("mode") != "test-preview":
        raise ValueError("Only test-preview is installed")
    if job.get("state") != "queued" or job.get("output_dir") != f"output/{job_id}":
        raise ValueError("Invalid state or output_dir")
    if not re.fullmatch(r"[a-f0-9]{64}", job.get("artwork_sha256", "")):
        raise ValueError("Missing artwork_sha256")
    return job


def gpu_name():
    try:
        return subprocess.check_output(
            ["nvidia-smi", "--query-gpu=name", "--format=csv,noheader"],
            timeout=5, text=True, stderr=subprocess.DEVNULL).strip() or None
    except (OSError, subprocess.SubprocessError):
        return None


class Worker:
    def __init__(self, root, sync_timeout=120):
        self.root = Path(root).resolve()
        for name in ("queue", "processing", "output", "logs"):
            (self.root / name).mkdir(parents=True, exist_ok=True)
        self.session = uuid.uuid4().hex
        self.gpu = gpu_name()
        self.current = None
        self.sync_timeout = sync_timeout
        self.waiting = {}
        self.stop = threading.Event()
        self.thread = None
        self.lock = None

    def acquire(self):
        # OS lock protects duplicate launches on this VM. Drive is not a distributed lock.
        key = hashlib.sha256(str(self.root).encode()).hexdigest()
        self.lock = open(Path(tempfile.gettempdir()) / ("pazos-" + key + ".lock"), "a+b")
        try:
            if os.name == "nt":
                import msvcrt
                self.lock.seek(0)
                self.lock.write(b"0")
                self.lock.flush()
                self.lock.seek(0)
                msvcrt.locking(self.lock.fileno(), msvcrt.LK_NBLCK, 1)
            else:
                import fcntl
                fcntl.flock(self.lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            status_path = self.root / "worker-status.json"
            if status_path.exists():
                old = read_json(status_path)
                if old.get("state") != "stopped" and time.time()-old.get("updated_at", 0) < 90:
                    raise RuntimeError("Another worker heartbeat is active. Stop it first.")
        except Exception:
            self.lock.close()
            self.lock = None
            raise

    def heartbeat(self, state="idle"):
        write_json(self.root / "worker-status.json", {
            "version": VERSION, "session_id": self.session,
            "state": "processing" if self.current and state != "stopped" else state,
            "job_id": self.current, "updated_at": time.time(),
            "runtime": "colab" if os.environ.get("COLAB_RELEASE_TAG") else "local",
            "gpu": self.gpu, "adapter": "test-preview", "uses_gpu": False,
            "queued": sum(1 for p in (self.root / "queue").glob("job_*/job.json")
                          if not (self.root / "processing" / p.parent.name).exists()
                          and not (self.root / "output" / p.parent.name / "manifest.json").exists()),
        })

    def _pulse(self):
        while not self.stop.wait(15):
            try:
                self.heartbeat()
            except OSError:
                # Drive can temporarily disappear; foreground loop reports persistent failure.
                pass

    def progress(self, job_id, state, completed, total, **extra):
        write_json(self.root / "output" / job_id / "progress.json", {
            "job_id": job_id, "state": state, "completed": completed,
            "total": total, "updated_at": time.time(), **extra})

    def fail(self, job_id, message, total=0):
        self.progress(job_id, "error", 0, total, error=message)
        write_json(self.root / "output" / job_id / "manifest.json", {
            "job_id": job_id, "state": "error", "error": message, "views": []})
        write_json(self.root / "logs" / (job_id + ".json"), {
            "job_id": job_id, "state": "error", "error": message, "updated_at": time.time()})

    def recover(self):
        # Never silently rerun an interrupted job (expensive real models may come later).
        for folder in (self.root / "processing").glob("job_*"):
            if folder.is_dir() and ID.fullmatch(folder.name):
                manifest = self.root / "output" / folder.name / "manifest.json"
                if not manifest.exists():
                    self.fail(folder.name, "Worker interrupted. Submit a new job from Illustrator.")

    def scan(self):
        for folder in sorted((self.root / "queue").glob("job_*")):
            if not folder.is_dir() or folder.is_symlink() or not ID.fullmatch(folder.name):
                continue
            job_id = folder.name
            output = self.root / "output" / job_id
            if (output / "manifest.json").exists() or (self.root / "processing" / job_id).exists():
                continue
            path = folder / "job.json"
            if not path.exists():
                continue  # job.json is the publish marker; PNG is written first.
            started = self.waiting.setdefault(job_id, time.monotonic())
            try:
                job = validate_job(read_json(path), job_id)
                artwork = folder / "artwork.png"
                if not artwork.exists():
                    raise ValueError("Artwork is still syncing")
                if artwork.is_symlink() or artwork.stat().st_size > 32*1024*1024:
                    raise ValueError("Invalid artwork file")
                digest = hashlib.sha256(artwork.read_bytes()).hexdigest()
                if digest != job["artwork_sha256"]:
                    raise ValueError("Artwork checksum mismatch; wait for Drive sync")
                with Image.open(artwork) as im:
                    if im.format != "PNG" or max(im.size) > 4096:
                        raise ValueError("Invalid PNG dimensions")
                    im.verify()
            except (OSError, ValueError, TypeError, AttributeError, Image.DecompressionBombError) as exc:
                if time.monotonic()-started >= self.sync_timeout:
                    self.fail(job_id, str(exc))
                continue
            processing = self.root / "processing" / job_id
            processing.mkdir()  # Single worker/session per Drive root is required.
            self.current = job_id
            self.heartbeat()
            try:
                # Keep queued input intact: Drive moves can lose data on interruption.
                write_json(processing / "job.json", {**job, "state": "processing"})
                self.progress(job_id, "processing", 0, job["views"])
                adapter = create_adapter(job["mode"])
                views = []
                with tempfile.TemporaryDirectory(prefix="pazos-job-") as staging:
                    local = Path(staging) / "artwork.png"
                    shutil.copyfile(artwork, local)
                    for index, image in adapter.generate(local, job):
                        if index != len(views) or index >= job["views"]:
                            raise ValueError("Adapter returned an invalid view order")
                        name = f"view_{index:03d}.png"
                        temp = output / (name + ".tmp")
                        image.save(temp, format="PNG")
                        os.replace(temp, output / name)
                        views.append({"file": name, "sha256": hashlib.sha256((output/name).read_bytes()).hexdigest()})
                        self.progress(job_id, "processing", len(views), job["views"])
                if len(views) != job["views"]:
                    raise ValueError("Adapter returned too few views")
                write_json(output / "manifest.json", {
                    "job_id": job_id, "state": "done", "version": VERSION,
                    "adapter": adapter.name, "is_test": True, "views": views,
                    "size": job["size"], "tilt": job["tilt"], "completed_at": time.time()})
                self.progress(job_id, "done", len(views), job["views"])
                write_json(processing / "job.json", {**job, "state": "done"})
                write_json(self.root / "logs" / (job_id+".json"), {
                    "job_id": job_id, "state": "done", "views": len(views)})
            except Exception as exc:
                self.fail(job_id, str(exc), job["views"])
                write_json(processing / "job.json", {**job, "state": "error"})
            finally:
                self.current = None
                self.heartbeat()

    def run(self, once=False, interval=5):
        self.acquire()
        try:
            self.recover()
            self.heartbeat()
            self.thread = threading.Thread(target=self._pulse, daemon=True)
            self.thread.start()
            while True:
                self.scan()
                if once or self.stop.wait(max(5, interval)):
                    break
        finally:
            self.stop.set()
            if self.thread:
                self.thread.join(timeout=20)
            try:
                self.heartbeat("stopped")
            finally:
                self.lock.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", required=True, type=Path)
    parser.add_argument("--once", action="store_true")
    parser.add_argument("--interval", type=int, default=5)
    args = parser.parse_args()
    try:
        Worker(args.root).run(args.once, args.interval)
    except KeyboardInterrupt:
        print("Worker stopped. Interrupted jobs can be submitted again from Illustrator.")

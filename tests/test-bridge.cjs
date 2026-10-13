'use strict';
const fs=require('fs'), os=require('os'), path=require('path'), assert=require('assert'), crypto=require('crypto');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'pazos-bridge-test-'));
process.env.APPDATA=path.join(root,'settings');
const bridge=require('../ai-turntable-bridge/js/bridge.cjs');
try {
  const repo=path.join(root,'repo'); fs.mkdirSync(path.join(repo,'.git'),{recursive:true});
  assert.throws(()=>bridge.configure(path.join(repo,'private')),/repositorio/);
  const drive=path.join(root,'Drive');
  bridge.configure(drive);

  const p=bridge.prepare({views:2,size:128,tilt:0});
  assert(!fs.existsSync(p.dir),'queue job directory must not exist before local export succeeds');
  assert(fs.existsSync(p.tempDir),'temporary local directory should exist');
  assert(p.tempArtwork.startsWith(os.tmpdir()),'artwork must export to local temp, not Drive');
  assert.throws(()=>bridge.publish(p),/Exportación local/);
  assert(!fs.existsSync(p.tempDir),'failed publish should clean temporary directory');

  const p2=bridge.prepare({views:2,size:128,tilt:0});
  fs.writeFileSync(p2.tempArtwork,Buffer.from('test image'));
  bridge.publish(p2);
  assert(fs.existsSync(path.join(p2.dir,'artwork.png')),'artwork should be copied to Drive');
  assert(fs.existsSync(path.join(p2.dir,'job.json')),'publish marker should be written last');
  assert(!fs.existsSync(p2.tempDir),'successful publish should clean local temp');
  assert.equal(bridge.status().queued,1);
  assert.equal(bridge.status().alive,false);

  const p3=bridge.prepare({views:1,size:128,tilt:0});
  fs.writeFileSync(p3.tempArtwork,Buffer.from('cancelled'));
  bridge.abort(p3);
  assert(!fs.existsSync(p3.tempDir),'abort should clean local temp');
  assert(!fs.existsSync(p3.dir),'abort should not leave an empty Drive job');

  const output=path.join(drive,'output',p2.job.job_id);fs.mkdirSync(output);
  const bytes=Buffer.from('result');
  const manifest={job_id:p2.job.job_id,state:'done',views:[{file:'view_000.png',sha256:crypto.createHash('sha256').update(bytes).digest('hex')}]};
  fs.writeFileSync(path.join(output,'manifest.json'),JSON.stringify(manifest));
  assert.throws(()=>bridge.importFiles(),/sincronizando/);
  fs.writeFileSync(path.join(output,'view_000.png'),bytes);
  assert.equal(bridge.importFiles().length,1);
  fs.writeFileSync(path.join(output,'view_000.png'),'incomplete');
  assert.throws(()=>bridge.importFiles(),/integridad/);
  manifest.views[0].file='../escape.png';
  fs.writeFileSync(path.join(output,'manifest.json'),JSON.stringify(manifest));
  assert.throws(()=>bridge.importFiles(),/inválido/);
  console.log('Bridge local-temp export, atomic Drive publish, cleanup, sync and import integrity: OK');
} finally { fs.rmSync(root,{recursive:true,force:true}); }

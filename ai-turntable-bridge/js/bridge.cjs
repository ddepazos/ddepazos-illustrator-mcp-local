/* Shared by the CEP panel and Tools Manager. Only local files; no artwork network APIs. */
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const configPath = path.join(process.env.APPDATA || os.homedir(), 'Pazos', 'ai-turntable.json');
const idPattern = /^job_[A-Za-z0-9_-]{1,100}$/;
function read(file) {
  try {
    if (fs.statSync(file).size > 65536) return null;
    return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
  } catch (_) { return null; }
}
function write(file, value) {
  fs.mkdirSync(path.dirname(file), {recursive:true});
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2), 'utf8');
  fs.renameSync(tmp, file);
}
function config() { return read(configPath) || {}; }
function configure(root) {
  root = path.resolve(root);
  let cursor = root;
  while (true) {
    if (fs.existsSync(path.join(cursor, '.git'))) throw Error('Usa una carpeta Drive fuera de cualquier repositorio Git.');
    const parent = path.dirname(cursor);
    if (parent === cursor) break;
    cursor = parent;
  }
  ['queue','processing','output','logs'].forEach(x => fs.mkdirSync(path.join(root,x), {recursive:true}));
  write(configPath, {root:root});
  return root;
}
function jobPath(root, area, id) {
  if (!idPattern.test(id)) throw Error('job_id inválido');
  return path.join(root,area,id);
}
function prepare(params) {
  const cfg = config();
  if (!cfg.root) throw Error('Configura primero la carpeta local de Drive.');
  if (!Number.isInteger(params.views) || params.views < 1 || params.views > 36 ||
      !Number.isInteger(params.size) || params.size < 128 || params.size > 2048 ||
      !Number.isFinite(params.tilt) || Math.abs(params.tilt) > 90) throw Error('Parámetros inválidos');
  const id = 'job_' + Date.now() + '_' + crypto.randomBytes(6).toString('hex');
  const dir = jobPath(cfg.root, 'queue', id);
  fs.mkdirSync(dir);
  return {dir:dir, job:{job_id:id, views:params.views, tilt:params.tilt, size:params.size,
    mode:'test-preview', output_dir:'output/'+id, state:'queued', created_at:Date.now()/1000}};
}
function publish(prepared) {
  const artwork = path.join(prepared.dir,'artwork.png');
  if (!fs.existsSync(artwork) || fs.statSync(artwork).size === 0) throw Error('Falta artwork.png');
  prepared.job.artwork_sha256 = crypto.createHash('sha256').update(fs.readFileSync(artwork)).digest('hex');
  write(path.join(prepared.dir,'job.json'), prepared.job); // publish marker LAST
  write(configPath, Object.assign(config(), {lastJob:prepared.job.job_id}));
  return prepared.job.job_id;
}
function status() {
  const cfg = config(), root = cfg.root;
  if (!root) return {drive:false, message:'Drive sin configurar'};
  const drive = ['queue','processing','output','logs'].every(x => fs.existsSync(path.join(root,x)));
  const worker = read(path.join(root,'worker-status.json'));
  const age = worker ? Date.now()/1000-worker.updated_at : Infinity;
  const alive = !!worker && age >= -30 && age < 90 && worker.state !== 'stopped';
  const out = cfg.lastJob && idPattern.test(cfg.lastJob) ? jobPath(root,'output',cfg.lastJob) : null;
  let queued = 0;
  if (drive) fs.readdirSync(path.join(root,'queue')).forEach(id => {
    if (idPattern.test(id) && fs.existsSync(path.join(root,'queue',id,'job.json')) &&
        !fs.existsSync(path.join(root,'processing',id)) && !fs.existsSync(path.join(root,'output',id,'manifest.json'))) queued++;
  });
  return {root:root, drive:drive, worker:worker, alive:alive, queued:queued, job_id:cfg.lastJob,
    progress:out && read(path.join(out,'progress.json')), manifest:out && read(path.join(out,'manifest.json'))};
}
function importFiles() {
  const s = status(), m = s.manifest;
  if (!m || m.state !== 'done' || m.job_id !== s.job_id || !Array.isArray(m.views) || !m.views.length || m.views.length > 36)
    throw Error('Todavía no hay un manifest terminado.');
  return m.views.map((v,i) => {
    if (v.file !== 'view_'+String(i).padStart(3,'0')+'.png') throw Error('Nombre de vista inválido');
    const file = path.join(jobPath(s.root,'output',s.job_id), v.file);
    if (!fs.existsSync(file)) throw Error('Drive aún está sincronizando las vistas.');
    const stat = fs.lstatSync(file);
    if (stat.isSymbolicLink() || stat.size > 32*1024*1024) throw Error('Archivo de vista inválido');
    if (crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') !== v.sha256)
      throw Error('Drive aún está sincronizando: integridad de vista pendiente.');
    return file;
  });
}
module.exports = {config, configure, prepare, publish, status, importFiles};

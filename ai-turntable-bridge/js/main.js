(function () {
  'use strict';
  var $ = function(id) { return document.getElementById(id); }, bridge, busy=false;
  function message(text) { $('message').textContent=text; }
  try { bridge = require(require('path').join(window.__adobe_cep__.getSystemPath('extension'),'js','bridge.cjs')); } catch(e) { message('No se pudo iniciar CEP Node: '+e); return; }
  function host(fn, args, callback) {
    if (!window.__adobe_cep__) { busy=false; message('Abre este panel desde Illustrator 2023.'); return; }
    window.__adobe_cep__.evalScript(fn+'('+args.map(function(a){return JSON.stringify(a);}).join(',')+')', callback);
  }
  function refresh() {
    if (busy) return;
    try {
      var s=bridge.status(), w=s.worker, p=s.progress, m=s.manifest;
      $('folder').textContent=s.root || 'Sin configurar';
      $('worker').textContent=s.alive ? (w.runtime+' · '+w.state) : 'Detenido o sin señal reciente';
      $('gpu').textContent=w ? (w.gpu || 'Sin GPU')+' · adaptador de prueba usa CPU' : 'Sin datos';
      $('queue').textContent=String(s.queued || 0);
      $('job').textContent=s.job_id || 'Sin trabajo';
      $('state').textContent=(m && m.state) || (p && p.state) || (s.job_id ? 'queued' : '—');
      $('progress').textContent=p ? p.completed+'/'+p.total : '0/0';
      $('import').disabled=!(m && m.state==='done');
      if (m && m.state==='error') message(m.error);
    } catch(e) { message(String(e)); }
  }
  $('configure').onclick=function() {
    host('pazosAIChooseFolder', [], function(folder) {
      if (!folder || folder==='null') return;
      try { bridge.configure(JSON.parse(folder)); refresh(); } catch(e) { message(String(e)); }
    });
  };
  $('colab').onclick=function() {
    window.cep.util.openURLInDefaultBrowser('https://colab.research.google.com/github/ddepazos/ddepazos-illustrator-mcp-local/blob/main/colab/Pazos_AI_Turntable.ipynb');
  };
  $('generate').onclick=function() {
    if (busy) return;
    try {
      var prepared=bridge.prepare({views:Number($('views').value),tilt:Number($('tilt').value),size:Number($('size').value)});
      busy=true; $('generate').disabled=true; message('Exportando selección…');
      host('pazosAIExport', [prepared.dir.replace(/\\/g,'/')+'/artwork.png',prepared.job.size], function(result) {
        busy=false; $('generate').disabled=false;
        try {
          if (result!=='OK') throw Error(result);
          bridge.publish(prepared); message('En cola. Colab procesará el trabajo cuando Drive termine de sincronizar.');
        } catch(e) { message(String(e)); }
        refresh();
      });
    } catch(e) { busy=false; $('generate').disabled=false; message(String(e)); }
  };
  $('import').onclick=function() {
    try {
      var files=bridge.importFiles(); busy=true;
      host('pazosAIImport', [files.map(function(f){return f.replace(/\\/g,'/');}),$('artboards').checked], function(result) {
        busy=false; message(result); refresh();
      });
    } catch(e) { busy=false; message(String(e)); }
  };
  $('refresh').onclick=refresh;
  refresh();
  // No render loop. Sequential polling is suspended when the panel is hidden.
  function tick() { if (!document.hidden) refresh(); window.setTimeout(tick,5000); }
  window.setTimeout(tick,5000);
}());

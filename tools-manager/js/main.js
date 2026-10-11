(function(){
"use strict";
var $=function(id){return document.getElementById(id);};
var REPO="ddepazos/ddepazos-illustrator-mcp-local";
var RAW="https://raw.githubusercontent.com/"+REPO+"/main/suite-version.json";
var API="https://api.github.com/repos/"+REPO;
var localVersion=null,remoteVersion=null;

function setStatus(s){$("status").textContent=s;}
function setOnline(ok){$("netBadge").textContent=ok?"GITHUB":"OFFLINE";$("netBadge").className="badge "+(ok?"online":"offline");}
function compare(a,b){
  var aa=String(a||"0").split(".").map(Number),bb=String(b||"0").split(".").map(Number);
  for(var i=0;i<Math.max(aa.length,bb.length);i++){var x=aa[i]||0,y=bb[i]||0;if(x<y)return -1;if(x>y)return 1;}
  return 0;
}
function evalAI(code,cb){
  if(!window.__adobe_cep__){setStatus("CEP no disponible");return;}
  window.__adobe_cep__.evalScript(code,cb||function(){});
}
function openURL(url){
  try{
    if(window.cep&&window.cep.util&&window.cep.util.openURLInDefaultBrowser){window.cep.util.openURLInDefaultBrowser(url);return;}
  }catch(e){}
  evalAI("openManagerURL('"+url.replace(/'/g,"\\'")+"')");
}
function renderLocalState(state){
  $("repoPath").textContent=state.repoPath||"No detectado";
  var html="";
  (state.modules||[]).forEach(function(m){
    html+='<div class="module"><span>'+m.name+'</span><b class="'+(m.installed?"ok":"missing")+'">'+(m.installed?"✓":"No instalado")+'</b></div>';
  });
  $("modules").innerHTML=html||"Sin datos";
}
function refreshLocal(){
  fetch("version.json",{cache:"no-store"}).then(function(r){return r.json();}).then(function(v){
    localVersion=v.version;$("localVersion").textContent=v.version;updateComparison();
  }).catch(function(){$("localVersion").textContent="0.8.0";localVersion="0.8.0";});
  evalAI("getToolsManagerState()",function(r){
    try{renderLocalState(JSON.parse(r));}catch(e){$("modules").textContent="No se pudo comprobar instalación local";}
  });
}
function updateComparison(){
  if(!localVersion||!remoteVersion)return;
  var c=compare(localVersion,remoteVersion);
  $("updateState").textContent=c<0?"Actualización disponible":(c===0?"Al día":"Local más nueva");
}
function statusText(run){
  if(!run)return "Sin datos";
  if(run.status!=="completed")return run.status;
  return run.conclusion==="success"?"✓ success":"✕ "+run.conclusion;
}
function checkGitHub(){
  setStatus("Consultando GitHub…");
  Promise.all([
    fetch(RAW+"?t="+Date.now(),{cache:"no-store"}).then(function(r){if(!r.ok)throw new Error("version");return r.json();}),
    fetch(API+"/actions/runs?per_page=12",{headers:{"Accept":"application/vnd.github+json"}}).then(function(r){if(!r.ok)throw new Error("actions");return r.json();})
  ]).then(function(data){
    remoteVersion=data[0].version;$("remoteVersion").textContent=remoteVersion;
    var runs=data[1].workflow_runs||[],suite=null,nft=null;
    for(var i=0;i<runs.length;i++){
      if(!suite&&runs[i].name==="Package Pazos Vector Tools")suite=runs[i];
      if(!nft&&runs[i].name==="Validate NFT Contract")nft=runs[i];
    }
    $("buildSuite").textContent=statusText(suite);
    $("buildNFT").textContent=statusText(nft);
    setOnline(true);updateComparison();setStatus("GitHub consultado");
  }).catch(function(){
    setOnline(false);$("remoteVersion").textContent="Sin conexión";setStatus("No se pudo consultar GitHub");
  });
}
$("check").onclick=checkGitHub;
$("repo").onclick=function(){openURL("https://github.com/"+REPO);};
$("actions").onclick=function(){openURL("https://github.com/"+REPO+"/actions");};
$("update").onclick=function(){
  if(!confirm("Se ejecutará git pull y se reinstalará Pazos Vector Tools. Guarda tu trabajo antes de continuar. ¿Actualizar?"))return;
  setStatus("Actualizando desde GitHub…");
  evalAI("updatePazosSuite()",function(r){
    setStatus(r);
    if(String(r).indexOf("OK")===0){$("updateState").textContent="Actualizada · reinicia Illustrator";}
  });
};
refreshLocal();
})();
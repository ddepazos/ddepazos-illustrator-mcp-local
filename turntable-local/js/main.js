(function(){
"use strict";
var $=function(id){return document.getElementById(id);};
var canvas=$("preview"),ctx=canvas.getContext("2d"),selection=null;
function p(){return{angle:Number($("angle").value),tilt:Number($("tilt").value),depth:Number($("depth").value),perspective:Number($("perspective").value),views:Number($("views").value),autoDepth:$("autoDepth").checked,keepOriginal:$("keepOriginal").checked};}
function labels(){$("angleV").textContent=$("angle").value+"°";$("tiltV").textContent=$("tilt").value+"°";$("depthV").textContent=$("depth").value;$("perspectiveV").textContent=$("perspective").value;$("viewsV").textContent=$("views").value;}
function evalAI(code,cb){if(!window.__adobe_cep__){$("status").textContent="CEP no disponible";return;}window.__adobe_cep__.evalScript(code,cb||function(){});}
function render(){
 var q=p(),w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);ctx.fillStyle="#111";ctx.fillRect(0,0,w,h);
 var parts=selection&&selection.parts?selection.parts:[{w:180,h:220,depth:0},{w:120,h:80,depth:.4},{w:90,h:150,depth:-.4}];
 var a=q.angle*Math.PI/180,t=q.tilt*Math.PI/180,ca=Math.cos(a),sa=Math.sin(a),ct=Math.cos(t);
 for(var i=0;i<parts.length;i++){var d=q.autoDepth?parts[i].depth:0,spread=d*q.depth,x=w/2+sa*spread,y=h/2-Math.sin(t)*spread*.7,sx=Math.max(.08,Math.abs(ca)),sy=Math.max(.2,ct),pw=Math.max(12,Math.min(230,parts[i].w*.45))*sx,ph=Math.max(12,Math.min(250,parts[i].h*.45))*sy;ctx.save();ctx.translate(x,y);ctx.scale(ca<0?-1:1,1);ctx.globalAlpha=.85;ctx.strokeStyle=i===0?"#ddd":"#888";ctx.lineWidth=2;ctx.strokeRect(-pw/2,-ph/2,pw,ph);ctx.restore();}
}
["angle","tilt","depth","perspective","views"].forEach(function(id){$(id).oninput=labels;$(id).onchange=function(){labels();render();};});
["autoDepth","keepOriginal"].forEach(function(id){$(id).onchange=render;});
$("read").onclick=function(){evalAI("getTurntableSelectionData()",function(r){if(!r||r.indexOf("ERROR:")===0){$("status").textContent=r||"Sin selección";return;}try{selection=JSON.parse(r);$("status").textContent=selection.parts.length+" partes leídas";render();}catch(e){$("status").textContent="Error leyendo selección";}});};
$("insert").onclick=function(){if(!selection){$("status").textContent="Primero lee la selección";return;}var json=JSON.stringify(p()).replace(/\\/g,"\\\\").replace(/'/g,"\\'");evalAI("insertTurntableView('"+json+"')",function(r){$("status").textContent=r;});};
$("allViews").onclick=function(){if(!selection){$("status").textContent="Primero lee la selección";return;}var json=JSON.stringify(p()).replace(/\\/g,"\\\\").replace(/'/g,"\\'");$("status").textContent="Creando vistas...";evalAI("placeAllTurntableViews('"+json+"')",function(r){$("status").textContent=r;});};
$("githubJob").onclick=function(){if(!selection){$("status").textContent="Primero lee la selección";return;}var json=JSON.stringify(p()).replace(/\\/g,"\\\\").replace(/'/g,"\\'");$("status").textContent="Preparando paquete...";evalAI("exportTurntableGitHubJob('"+json+"')",function(r){$("status").textContent=r;});};
$("reset").onclick=function(){$("angle").value=0;$("tilt").value=0;$("depth").value=50;$("perspective").value=900;$("views").value=12;$("autoDepth").checked=true;$("keepOriginal").checked=true;labels();render();};
labels();render();
})();
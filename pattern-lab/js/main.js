(function(){
"use strict";
var $=function(id){return document.getElementById(id);};
var canvas=$("preview"),ctx=canvas.getContext("2d"),mode="radial",bounds={w:70,h:45},timer=null,hasSelection=false;

function params(){
  return{
    mode:mode,
    count:Number($("count").value),
    radius:Number($("radius").value),
    rotationStep:Number($("rotationStep").value),
    scaleStep:Number($("scaleStep").value)/100,
    gapX:Number($("gapX").value),
    gapY:Number($("gapY").value),
    amplitude:Number($("amplitude").value),
    frequency:Number($("frequency").value),
    keepOriginal:$("keepOriginal").checked,
    rotateToPath:$("rotateToPath").checked
  };
}
function labels(){
  $("countV").textContent=$("count").value;
  $("radiusV").textContent=$("radius").value;
  $("rotationStepV").textContent=$("rotationStep").value+"°";
  $("scaleStepV").textContent=$("scaleStep").value+"%";
  $("gapXV").textContent=$("gapX").value;
  $("gapYV").textContent=$("gapY").value;
  $("amplitudeV").textContent=$("amplitude").value;
  $("frequencyV").textContent=Number($("frequency").value).toFixed(1);
}
function positions(p){
  var arr=[],n=Math.min(p.count,80),i,a,cols,rows,x,y,r,s;
  if(p.mode==="radial"){
    for(i=0;i<n;i++){a=i/n*Math.PI*2;r=p.radius;arr.push({x:350+Math.cos(a)*r,y:210+Math.sin(a)*r,rot:p.rotateToPath?a*180/Math.PI+90:i*p.rotationStep,scale:Math.max(.08,1+i*p.scaleStep)});}
  }else if(p.mode==="spiral"){
    for(i=0;i<n;i++){a=i*.52;r=20+(p.radius/n)*i;arr.push({x:350+Math.cos(a)*r,y:210+Math.sin(a)*r,rot:p.rotateToPath?a*180/Math.PI+90:i*p.rotationStep,scale:Math.max(.08,1+i*p.scaleStep)});}
  }else if(p.mode==="wave"){
    for(i=0;i<n;i++){x=70+i*(560/Math.max(1,n-1));y=210+Math.sin(i/Math.max(1,n-1)*Math.PI*2*p.frequency)*p.amplitude;arr.push({x:x,y:y,rot:p.rotateToPath?Math.cos(i/Math.max(1,n-1)*Math.PI*2*p.frequency)*25:i*p.rotationStep,scale:Math.max(.08,1+i*p.scaleStep)});}
  }else{
    cols=Math.ceil(Math.sqrt(n));rows=Math.ceil(n/cols);
    for(i=0;i<n;i++){x=350+(i%cols-(cols-1)/2)*Math.min(130,p.gapX);y=210+(Math.floor(i/cols)-(rows-1)/2)*Math.min(110,p.gapY);arr.push({x:x,y:y,rot:i*p.rotationStep,scale:Math.max(.08,1+i*p.scaleStep)});}
  }
  return arr;
}
function render(){
  var p=params(),arr=positions(p);
  ctx.clearRect(0,0,700,420);ctx.fillStyle="#111";ctx.fillRect(0,0,700,420);
  ctx.strokeStyle=hasSelection?"#ddd":"#666";ctx.lineWidth=1;
  for(var i=0;i<arr.length;i++){
    var q=arr[i];ctx.save();ctx.translate(q.x,q.y);ctx.rotate(q.rot*Math.PI/180);ctx.scale(q.scale,q.scale);
    ctx.strokeRect(-bounds.w/2,-bounds.h/2,bounds.w,bounds.h);ctx.restore();
  }
  $("perf").textContent=(p.count>80?"Preview 80 / final "+p.count:"Preview "+p.count)+" copias";
}
function schedule(){clearTimeout(timer);timer=setTimeout(render,55);}
function evalAI(code,cb){
  if(!window.__adobe_cep__){$("status").textContent="CEP no disponible";return;}
  window.__adobe_cep__.evalScript(code,cb||function(){});
}

document.querySelectorAll(".mode").forEach(function(b){
  b.onclick=function(){document.querySelectorAll(".mode").forEach(function(x){x.classList.remove("active");});b.classList.add("active");mode=b.getAttribute("data-mode");render();};
});
["count","radius","rotationStep","scaleStep","gapX","gapY","amplitude","frequency"].forEach(function(id){
  $(id).oninput=function(){labels();schedule();};
});
["keepOriginal","rotateToPath"].forEach(function(id){$(id).onchange=schedule;});

$("read").onclick=function(){
  evalAI("getPatternSelectionInfo()",function(r){
    if(!r||r.indexOf("ERROR:")===0){$("status").textContent=r||"Sin selección";hasSelection=false;render();return;}
    try{var d=JSON.parse(r);bounds.w=Math.max(18,Math.min(120,d.width));bounds.h=Math.max(18,Math.min(100,d.height));hasSelection=true;$("status").textContent="Selección lista";render();}
    catch(e){$("status").textContent="Error leyendo selección";}
  });
};
$("apply").onclick=function(){
  if(!hasSelection){$("status").textContent="Primero lee la selección";return;}
  var json=JSON.stringify(params()).replace(/\\/g,"\\\\").replace(/'/g,"\\'");
  $("status").textContent="Generando...";
  evalAI("createPatternCopies('"+json+"')",function(r){$("status").textContent=r;});
};
$("reset").onclick=function(){
  $("count").value=24;$("radius").value=140;$("rotationStep").value=15;$("scaleStep").value=0;$("gapX").value=70;$("gapY").value=70;$("amplitude").value=80;$("frequency").value=2;$("keepOriginal").checked=true;$("rotateToPath").checked=true;labels();render();
};
labels();render();
})();
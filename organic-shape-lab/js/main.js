(function(){
"use strict";
var $=function(id){return document.getElementById(id);};
var canvas=$("preview"),ctx=canvas.getContext("2d"),mode="generate",selectionData=null,currentGeometry=null;

function rng(seed){
  var a=(seed>>>0)||1;
  return function(){
    a|=0;a=(a+0x6D2B79F5)|0;
    var t=Math.imul(a^(a>>>15),1|a);
    t=(t+Math.imul(t^(t>>>7),61|t))^t;
    return ((t^(t>>>14))>>>0)/4294967296;
  };
}
function p(){
  return{
    seed:Number($("seed").value)||0,
    points:Number($("points").value),
    lobes:Number($("lobes").value),
    irregularity:Number($("irregularity").value)/100,
    lobeStrength:Number($("lobeStrength").value)/100,
    smoothness:Number($("smoothness").value)/100,
    noise:Number($("noise").value)/100,
    inflate:Number($("inflate").value)/100,
    rotation:Number($("rotation").value),
    symmetry:$("symmetry").value,
    variations:Number($("variations").value),
    duplicate:$("duplicate").checked,
    outlineOnly:$("outlineOnly").checked
  };
}
function labels(){
  $("seedValue").textContent=$("seed").value;
  $("pointsValue").textContent=$("points").value;
  $("lobesValue").textContent=$("lobes").value;
  $("irregularityValue").textContent=$("irregularity").value+"%";
  $("lobeStrengthValue").textContent=$("lobeStrength").value+"%";
  $("smoothnessValue").textContent=$("smoothness").value+"%";
  $("noiseValue").textContent=$("noise").value+"%";
  $("inflateValue").textContent=$("inflate").value+"%";
  $("rotationValue").textContent=$("rotation").value+"°";
}
function symmetryRadius(i,n,raw,kind){
  if(kind==="none")return raw[i];
  if(kind==="bilateral"){
    var mirror=(n-i)%n;
    return (raw[i]+raw[mirror])/2;
  }
  var sectors=kind==="radial4"?4:kind==="radial6"?6:kind==="radial8"?8:1;
  var bucket=Math.round((i%n)/(n/sectors));
  var base=(bucket*(n/sectors))%n;
  return (raw[i]+raw[Math.round(base)%n])/2;
}
function generated(seedOffset){
  var q=p(),rand=rng(q.seed+seedOffset),n=q.points,raw=[],i;
  var phase=rand()*Math.PI*2;
  for(i=0;i<n;i++){
    var a=i/n*Math.PI*2;
    var harmonic=q.lobes?1+q.lobeStrength*Math.sin(q.lobes*a+phase):1;
    var jitter=1+q.irregularity*(rand()*2-1);
    var nudge=1+q.noise*Math.sin((3+Math.floor(rand()*5))*a+rand()*Math.PI*2);
    raw.push(135*harmonic*jitter*nudge*(1+q.inflate));
  }
  var pts=[];
  for(i=0;i<n;i++){
    var ang=i/n*Math.PI*2+q.rotation*Math.PI/180;
    var r=symmetryRadius(i,n,raw,q.symmetry);
    pts.push({x:350+Math.cos(ang)*r,y:215+Math.sin(ang)*r});
  }
  return pts;
}
function selectionShape(seedOffset){
  if(!selectionData||!selectionData.points||selectionData.points.length<3)return generated(seedOffset);
  var q=p(),rand=rng(q.seed+seedOffset),src=selectionData.points,n=src.length,minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
  src.forEach(function(v){minX=Math.min(minX,v.x);maxX=Math.max(maxX,v.x);minY=Math.min(minY,v.y);maxY=Math.max(maxY,v.y);});
  var cx=(minX+maxX)/2,cy=(minY+maxY)/2,sc=260/Math.max(1,maxX-minX,maxY-minY),pts=[];
  for(var i=0;i<n;i++){
    var x=(src[i].x-cx)*sc,y=(src[i].y-cy)*sc,len=Math.sqrt(x*x+y*y)||1;
    var k=1+q.inflate+q.irregularity*(rand()*2-1)*.55+q.noise*Math.sin(i/n*Math.PI*2*(q.lobes||3)+rand());
    var ang=q.rotation*Math.PI/180,rx=x*k,ry=y*k;
    var tx=rx*Math.cos(ang)-ry*Math.sin(ang),ty=rx*Math.sin(ang)+ry*Math.cos(ang);
    pts.push({x:350+tx,y:215+ty});
  }
  return pts;
}
function bezierHandles(points,smoothness){
  var out=[],n=points.length,s=Math.max(0,Math.min(1,smoothness))/6;
  for(var i=0;i<n;i++){
    var p0=points[(i-1+n)%n],p1=points[i],p2=points[(i+1)%n];
    out.push({
      anchor:[p1.x,p1.y],
      left:[p1.x-(p2.x-p0.x)*s,p1.y-(p2.y-p0.y)*s],
      right:[p1.x+(p2.x-p0.x)*s,p1.y+(p2.y-p0.y)*s]
    });
  }
  return out;
}
function drawPath(points){
  if(!points.length)return;
  var h=bezierHandles(points,p().smoothness),n=h.length;
  ctx.beginPath();ctx.moveTo(h[0].anchor[0],h[0].anchor[1]);
  for(var i=0;i<n;i++){
    var cur=h[i],next=h[(i+1)%n];
    ctx.bezierCurveTo(cur.right[0],cur.right[1],next.left[0],next.left[1],next.anchor[0],next.anchor[1]);
  }
  ctx.closePath();
}
function render(){
  ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle="#111";ctx.fillRect(0,0,canvas.width,canvas.height);
  var q=p(),all=[];
  var cols=Math.ceil(Math.sqrt(q.variations)),rows=Math.ceil(q.variations/cols),cellW=canvas.width/cols,cellH=canvas.height/rows;
  for(var v=0;v<q.variations;v++){
    var pts=mode==="deform"?selectionShape(v):generated(v);
    if(q.variations>1){
      var minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
      pts.forEach(function(pt){minX=Math.min(minX,pt.x);maxX=Math.max(maxX,pt.x);minY=Math.min(minY,pt.y);maxY=Math.max(maxY,pt.y);});
      var sx=(cellW*.72)/Math.max(1,maxX-minX),sy=(cellH*.72)/Math.max(1,maxY-minY),s=Math.min(sx,sy),cx=(minX+maxX)/2,cy=(minY+maxY)/2;
      var ccx=(v%cols+.5)*cellW,ccy=(Math.floor(v/cols)+.5)*cellH;
      pts=pts.map(function(pt){return{x:ccx+(pt.x-cx)*s,y:ccy+(pt.y-cy)*s};});
    }
    drawPath(pts);
    if(q.outlineOnly){ctx.strokeStyle="#ddd";ctx.lineWidth=2;ctx.stroke();}
    else{ctx.fillStyle=v%2===0?"#ddd":"#aaa";ctx.fill();ctx.strokeStyle="#555";ctx.stroke();}
    all.push(bezierHandles(pts,q.smoothness));
  }
  currentGeometry=all;
  $("status").textContent=(mode==="deform"?"Deformación":"Generación")+" · "+q.variations+" forma(s)";
}
function evalAI(code,cb){
  if(!window.__adobe_cep__){$("status").textContent="CEP no disponible";return;}
  window.__adobe_cep__.evalScript(code,cb||function(){});
}

document.querySelectorAll(".tab").forEach(function(b){
  b.onclick=function(){
    document.querySelectorAll(".tab").forEach(function(x){x.classList.remove("active");});
    b.classList.add("active");mode=b.getAttribute("data-mode");
    $("points").disabled=(mode==="deform");
    render();
  };
});
["points","lobes","irregularity","lobeStrength","smoothness","noise","inflate","rotation","seed"].forEach(function(id){
  $(id).oninput=function(){labels();render();};
});
["symmetry","variations","outlineOnly"].forEach(function(id){$(id).onchange=render;});

$("randomSeed").onclick=function(){
  $("seed").value=Math.floor(Math.random()*2147483000);labels();render();
};
$("readSelection").onclick=function(){
  evalAI("getOrganicSelectionData()",function(r){
    if(!r||r.indexOf("ERROR:")===0){$("status").textContent=r||"Sin selección";return;}
    try{selectionData=JSON.parse(r);mode="deform";document.querySelectorAll(".tab").forEach(function(x){x.classList.toggle("active",x.getAttribute("data-mode")==="deform");});$("points").disabled=true;$("status").textContent="Selección leída · "+selectionData.points.length+" anclas";render();}
    catch(e){$("status").textContent="No se pudo leer la selección";}
  });
};
$("apply").onclick=function(){
  if(!currentGeometry||!currentGeometry.length){$("status").textContent="No hay geometría";return;}
  var payload={
    mode:mode,
    paths:currentGeometry,
    duplicate:$("duplicate").checked,
    outlineOnly:$("outlineOnly").checked
  };
  var json=JSON.stringify(payload).replace(/\\/g,"\\\\").replace(/'/g,"\\'");
  evalAI("applyOrganicGeometry('"+json+"')",function(r){$("status").textContent=r;});
};
labels();render();
})();
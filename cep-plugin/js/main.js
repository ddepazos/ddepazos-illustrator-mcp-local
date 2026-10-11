(function(){
"use strict";
var $=function(id){return document.getElementById(id);};
var canvas=$("canvas"),ctx=canvas.getContext("2d");
var mode="3d",vectorData=null,imagePath="",drag=false,lastX=0,lastY=0;
var ids=["extrude","bevel","rx","ry","rz","twist","bend","inflate","taper","perspective","zoom"];
var labels={extrude:"",bevel:"",rx:"°",ry:"°",rz:"°",twist:"°",bend:"",inflate:"",taper:"",perspective:"",zoom:"%"};

function params(){
  var p={mode:mode};
  ids.forEach(function(id){p[id]=Number($(id).value);});
  p.wireframe=$("wireframe").checked;
  p.duplicate=$("duplicate").checked;
  if(mode==="2d")p.extrude=0;
  if(mode==="25d")p.extrude=Math.min(p.extrude,140);
  return p;
}
function updateLabels(){
  ids.forEach(function(id){$(id+"V").textContent=$(id).value+labels[id];});
}
function defaultShape(){
  return [{x:-120,y:-90},{x:120,y:-90},{x:120,y:90},{x:-120,y:90}];
}
function shapePoints(){
  if(vectorData&&vectorData.paths&&vectorData.paths.length){
    var pts=vectorData.paths[0].points.map(function(p){return {x:p.anchor[0],y:-p.anchor[1]};});
    if(pts.length>2){
      var minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
      pts.forEach(function(p){minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);});
      var cx=(minX+maxX)/2,cy=(minY+maxY)/2,scale=260/Math.max(1,maxX-minX,maxY-minY);
      return pts.map(function(p){return {x:(p.x-cx)*scale,y:(p.y-cy)*scale};});
    }
  }
  return defaultShape();
}
function rad(d){return d*Math.PI/180;}
function modify(v,zNorm,p){
  var x=v.x,y=v.y,z=v.z;
  var bevelScale=1-Math.min(.35,p.bevel/220);
  if(zNorm===0||zNorm===1){x*=bevelScale;y*=bevelScale;}
  var taper=1+(p.taper/100)*(zNorm-.5);
  var inflate=1+(p.inflate/100)*.22;
  x*=taper*inflate;y*=taper*inflate;
  var a=rad(p.twist)*(zNorm-.5),ca=Math.cos(a),sa=Math.sin(a);
  var tx=x*ca-y*sa,ty=x*sa+y*ca;x=tx;y=ty;
  x+=Math.sin(y/150)*p.bend*.55*(zNorm-.5);
  return{x:x,y:y,z:z};
}
function rotate(v,p){
  var x=v.x,y=v.y,z=v.z,c,s,t;
  c=Math.cos(rad(p.rx));s=Math.sin(rad(p.rx));t=y*c-z*s;z=y*s+z*c;y=t;
  c=Math.cos(rad(p.ry));s=Math.sin(rad(p.ry));t=x*c+z*s;z=-x*s+z*c;x=t;
  c=Math.cos(rad(p.rz));s=Math.sin(rad(p.rz));t=x*c-y*s;y=x*s+y*c;x=t;
  return{x:x,y:y,z:z};
}
function project(v,p){
  v=rotate(v,p);
  var per=p.perspective, f=per/(per-v.z);
  var zoom=p.zoom/100;
  return{x:canvas.width/2+v.x*f*zoom,y:canvas.height/2+v.y*f*zoom,z:v.z};
}
function buildMesh(p){
  var pts=shapePoints(),d=p.extrude/2,front=[],back=[];
  pts.forEach(function(pt){
    front.push(project(modify({x:pt.x,y:pt.y,z:d},1,p),p));
    back.push(project(modify({x:pt.x,y:pt.y,z:-d},0,p),p));
  });
  return{front:front,back:back};
}
function poly(points,fill,stroke){
  if(!points.length)return;
  ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);
  for(var i=1;i<points.length;i++)ctx.lineTo(points[i].x,points[i].y);
  ctx.closePath();
  if(fill){ctx.fillStyle=fill;ctx.fill();}
  ctx.strokeStyle=stroke||"#777";ctx.lineWidth=1;ctx.stroke();
}
function render(){
  var p=params(),m=buildMesh(p),n=m.front.length;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle="#111";ctx.fillRect(0,0,canvas.width,canvas.height);
  if(p.extrude>0){
    for(var i=0;i<n;i++){
      var j=(i+1)%n;
      poly([m.back[i],m.back[j],m.front[j],m.front[i]],p.wireframe?null:"#252525","#555");
    }
    poly(m.back,p.wireframe?null:"#171717","#444");
  }
  poly(m.front,p.wireframe?null:"#d8d8d8",p.wireframe?"#ddd":"#888");
  requestAnimationFrame(function(){});
}
function evalAI(code,cb){
  if(!window.__adobe_cep__){$("source").textContent="CEP no disponible";return;}
  window.__adobe_cep__.evalScript(code,cb||function(){});
}

document.querySelectorAll(".tab").forEach(function(b){
  b.onclick=function(){
    document.querySelectorAll(".tab").forEach(function(x){x.classList.remove("active");});
    b.classList.add("active");mode=b.getAttribute("data-mode");render();
  };
});
ids.forEach(function(id){$(id).oninput=function(){updateLabels();render();};});
$("wireframe").onchange=render;

$("readVector").onclick=function(){
  evalAI("getSelectionVectorData()",function(r){
    if(!r||r.indexOf("ERROR:")===0){$("source").textContent=r||"Sin selección";return;}
    try{vectorData=JSON.parse(r);imagePath="";$("source").textContent="Vector: "+vectorData.paths.length+" path(s)";render();}
    catch(e){$("source").textContent="Error leyendo vector";}
  });
};
$("loadImage").onclick=function(){
  evalAI("selectLocalImage()",function(r){
    if(!r||r==="CANCEL")return;
    imagePath=r;vectorData=null;$("source").textContent="Imagen local cargada";render();
  });
};
$("apply").onclick=function(){
  var p=JSON.stringify(params()).replace(/\\/g,"\\\\").replace(/'/g,"\\'");
  if(vectorData){evalAI("applyVector3D('"+p+"')",function(r){$("source").textContent=r;});}
  else if(imagePath){
    var path=imagePath.replace(/\\/g,"\\\\").replace(/'/g,"\\'");
    evalAI("placeImage3D('"+path+"','"+p+"')",function(r){$("source").textContent=r;});
  }else{$("source").textContent="Lee un vector o carga una imagen";}
};
$("reset").onclick=function(){
  var defaults={extrude:80,bevel:8,rx:20,ry:-30,rz:0,twist:0,bend:0,inflate:0,taper:0,perspective:900,zoom:100};
  Object.keys(defaults).forEach(function(k){$(k).value=defaults[k];});
  updateLabels();render();
};

canvas.onmousedown=function(e){drag=true;lastX=e.clientX;lastY=e.clientY;};
window.onmouseup=function(){drag=false;};
window.onmousemove=function(e){
  if(!drag)return;
  $("ry").value=Math.max(-180,Math.min(180,Number($("ry").value)+(e.clientX-lastX)));
  $("rx").value=Math.max(-180,Math.min(180,Number($("rx").value)+(e.clientY-lastY)));
  lastX=e.clientX;lastY=e.clientY;updateLabels();render();
};
canvas.onwheel=function(e){e.preventDefault();$("zoom").value=Math.max(35,Math.min(220,Number($("zoom").value)-e.deltaY*.08));updateLabels();render();};

updateLabels();render();
})();
(function(){
"use strict";
var canvas=document.getElementById("preview"),ctx=canvas.getContext("2d"),source=null,samples=[];
var $=function(id){return document.getElementById(id);};

function params(){
  return{
    density:Number($("density").value),
    maxSize:Number($("size").value),
    contrast:Number($("contrast").value)/100,
    threshold:Number($("threshold").value),
    angle:Number($("angle").value),
    shape:$("shape").value,
    invert:$("invert").checked,
    skipWhite:$("skipWhite").checked
  };
}
function labels(){
  $("densityValue").textContent=$("density").value;
  $("sizeValue").textContent=$("size").value;
  $("contrastValue").textContent=$("contrast").value+"%";
  $("thresholdValue").textContent=$("threshold").value;
  $("angleValue").textContent=$("angle").value+"°";
}
function luminance(r,g,b){return .2126*r+.7152*g+.0722*b;}

function analyze(){
  if(!source)return;
  var p=params(),w=canvas.width,h=canvas.height;
  ctx.clearRect(0,0,w,h);
  var scale=Math.min(w/source.width,h/source.height),dw=source.width*scale,dh=source.height*scale,ox=(w-dw)/2,oy=(h-dh)/2;
  ctx.drawImage(source,ox,oy,dw,dh);
  var image=ctx.getImageData(0,0,w,h);
  ctx.clearRect(0,0,w,h);
  samples=[];
  var cols=p.density,cell=w/cols,rows=Math.floor(h/cell),angle=p.angle*Math.PI/180,ca=Math.cos(angle),sa=Math.sin(angle),cx=w/2,cy=h/2;

  for(var row=0;row<rows;row++){
    for(var col=0;col<cols;col++){
      var px=Math.floor(col*cell+cell/2),py=Math.floor(row*cell+cell/2),index=(py*w+px)*4;
      if(image.data[index+3]<10)continue;
      var lum=luminance(image.data[index],image.data[index+1],image.data[index+2]);
      lum=(lum-128)*p.contrast+128+p.threshold;
      lum=Math.max(0,Math.min(255,lum));
      var darkness=1-lum/255;
      if(p.invert)darkness=1-darkness;
      if(p.skipWhite&&darkness<.045)continue;
      var radius=darkness*p.maxSize;
      if(radius<.25)continue;
      var dx=px-cx,dy=py-cy,rx=dx*ca-dy*sa+cx,ry=dx*sa+dy*ca+cy;
      samples.push({x:rx,y:ry,size:radius,shape:p.shape});
    }
  }
  if(samples.length>2200)samples=samples.slice(0,2200);
  drawPreview();
}
function drawPreview(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle="#111";ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle="#eee";
  for(var i=0;i<samples.length;i++){
    var d=samples[i];
    if(d.shape==="circle"){ctx.beginPath();ctx.arc(d.x,d.y,d.size,0,Math.PI*2);ctx.fill();}
    else if(d.shape==="square"){ctx.fillRect(d.x-d.size,d.y-d.size,d.size*2,d.size*2);}
    else{ctx.save();ctx.translate(d.x,d.y);ctx.rotate(Math.PI/4);ctx.fillRect(-d.size,-d.size,d.size*2,d.size*2);ctx.restore();}
  }
  $("status").textContent=samples.length+" puntos";
}

$("file").onchange=function(event){
  var file=event.target.files[0];if(!file)return;
  var reader=new FileReader();
  reader.onload=function(e){
    var img=new Image();
    img.onload=function(){source=img;$("empty").style.display="none";analyze();};
    img.src=e.target.result;
  };
  reader.readAsDataURL(file);
};

["density","size","contrast","threshold","angle"].forEach(function(id){
  $(id).oninput=function(){labels();analyze();};
});
["shape","invert","skipWhite"].forEach(function(id){$(id).onchange=analyze;});

$("generate").onclick=function(){
  if(!samples.length){$("status").textContent="No hay puntos";return;}
  var json=JSON.stringify(samples).replace(/\\/g,"\\\\").replace(/'/g,"\\'");
  $("status").textContent="Creando vectores...";
  window.__adobe_cep__.evalScript("createHalftone('"+json+"')",function(result){$("status").textContent=result;});
};

$("reset").onclick=function(){
  $("density").value=36;$("size").value=10;$("contrast").value=100;$("threshold").value=0;$("angle").value=0;
  $("shape").value="circle";$("invert").checked=false;$("skipWhite").checked=true;labels();analyze();
};

labels();
})();
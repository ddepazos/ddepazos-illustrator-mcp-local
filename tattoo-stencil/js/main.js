(function(){
"use strict";
var $=function(id){return document.getElementById(id);};
var canvas=$("preview"),ctx=canvas.getContext("2d"),source=null,mode="lines",lines=[],dots=[];

function params(){
  return{
    contrast:Number($("contrast").value)/100,
    edge:Number($("edge").value),
    density:Number($("density").value),
    lineWidth:Number($("lineWidth").value),
    lineLength:Number($("lineLength").value),
    shadow:Number($("shadow").value),
    dotSize:Number($("dotSize").value),
    invert:$("invert").checked,
    simplify:$("simplify").checked
  };
}
function labels(){
  $("contrastValue").textContent=$("contrast").value+"%";
  $("edgeValue").textContent=$("edge").value;
  $("densityValue").textContent=$("density").value;
  $("lineWidthValue").textContent=$("lineWidth").value;
  $("lineLengthValue").textContent=$("lineLength").value;
  $("shadowValue").textContent=$("shadow").value;
  $("dotSizeValue").textContent=$("dotSize").value;
}
function gray(r,g,b){return .2126*r+.7152*g+.0722*b;}
function clamp(v){return Math.max(0,Math.min(255,v));}

function analyze(){
  if(!source)return;
  var p=params(),w=canvas.width,h=canvas.height;
  ctx.clearRect(0,0,w,h);
  var sc=Math.min(w/source.width,h/source.height),dw=source.width*sc,dh=source.height*sc,ox=(w-dw)/2,oy=(h-dh)/2;
  ctx.drawImage(source,ox,oy,dw,dh);
  var img=ctx.getImageData(0,0,w,h),g=new Float32Array(w*h),i,x,y;
  for(i=0;i<w*h;i++){
    var idx=i*4,lum=gray(img.data[idx],img.data[idx+1],img.data[idx+2]);
    lum=clamp((lum-128)*p.contrast+128);
    if(p.invert)lum=255-lum;
    g[i]=lum;
  }

  lines=[];dots=[];
  var cols=p.density,step=w/cols,rows=Math.floor(h/step);
  var sxKernel=[-1,0,1,-2,0,2,-1,0,1],syKernel=[-1,-2,-1,0,0,0,1,2,1];

  for(var row=1;row<rows-1;row++){
    for(var col=1;col<cols-1;col++){
      x=Math.floor(col*step+step/2);y=Math.floor(row*step+step/2);
      if(x<2||y<2||x>=w-2||y>=h-2)continue;
      var gx=0,gy=0,k=0;
      for(var yy=-1;yy<=1;yy++){
        for(var xx=-1;xx<=1;xx++){
          var val=g[(y+yy)*w+(x+xx)];
          gx+=val*sxKernel[k];gy+=val*syKernel[k];k++;
        }
      }
      var mag=Math.sqrt(gx*gx+gy*gy);
      if((mode==="lines"||mode==="lines+dots")&&mag>p.edge){
        var theta=Math.atan2(gy,gx)+Math.PI/2;
        var len=step*.46*p.lineLength;
        if(p.simplify && mag<p.edge*1.45)len*=.7;
        lines.push({
          x1:x-Math.cos(theta)*len,y1:y-Math.sin(theta)*len,
          x2:x+Math.cos(theta)*len,y2:y+Math.sin(theta)*len,
          width:p.lineWidth*Math.min(2.2,Math.max(.65,mag/(p.edge*1.4)))
        });
      }
      if(mode==="dots"||mode==="lines+dots"){
        var lum=g[y*w+x];
        if(lum<p.shadow){
          var dark=1-lum/p.shadow;
          if(mode==="lines+dots" && mag>p.edge*1.35) dark*=.45;
          var r=Math.max(.25,dark*p.dotSize);
          if(r>.3)dots.push({x:x,y:y,r:r});
        }
      }
    }
  }
  if(lines.length>2600)lines=lines.slice(0,2600);
  if(dots.length>2200)dots=dots.slice(0,2200);
  draw();
}
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle="#f7f7f7";ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle="#111";ctx.lineCap="round";
  for(var i=0;i<lines.length;i++){
    var l=lines[i];ctx.lineWidth=Math.max(.6,l.width);ctx.beginPath();ctx.moveTo(l.x1,l.y1);ctx.lineTo(l.x2,l.y2);ctx.stroke();
  }
  ctx.fillStyle="#111";
  for(var j=0;j<dots.length;j++){var d=dots[j];ctx.beginPath();ctx.arc(d.x,d.y,d.r,0,Math.PI*2);ctx.fill();}
  $("status").textContent=lines.length+" líneas · "+dots.length+" puntos";
}
$("file").onchange=function(e){
  var f=e.target.files[0];if(!f)return;
  var r=new FileReader();
  r.onload=function(ev){
    var img=new Image();
    img.onload=function(){source=img;$("empty").style.display="none";analyze();};
    img.src=ev.target.result;
  };
  r.readAsDataURL(f);
};
document.querySelectorAll(".mode").forEach(function(b){
  b.onclick=function(){
    document.querySelectorAll(".mode").forEach(function(x){x.classList.remove("active");});
    b.classList.add("active");mode=b.getAttribute("data-mode");analyze();
  };
});
["contrast","edge","density","lineWidth","lineLength","shadow","dotSize"].forEach(function(id){
  $(id).oninput=function(){labels();analyze();};
});
["invert","simplify"].forEach(function(id){$(id).onchange=analyze;});

$("reset").onclick=function(){
  $("contrast").value=130;$("edge").value=70;$("density").value=42;$("lineWidth").value=1.2;
  $("lineLength").value=1;$("shadow").value=145;$("dotSize").value=3;
  $("invert").checked=false;$("simplify").checked=true;labels();analyze();
};

$("generate").onclick=function(){
  if(!lines.length&&!dots.length){$("status").textContent="No hay stencil";return;}
  var payload={lines:lines,dots:dots};
  var json=JSON.stringify(payload).replace(/\\/g,"\\\\").replace(/'/g,"\\'");
  $("status").textContent="Creando vectores...";
  window.__adobe_cep__.evalScript("createTattooStencil('"+json+"')",function(r){$("status").textContent=r;});
};
labels();
})();
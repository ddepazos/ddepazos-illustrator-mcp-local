(function(){
"use strict";
var $=function(id){return document.getElementById(id);};
var canvas=$("preview"),ctx=canvas.getContext("2d"),source=null,analysis=null,timer=null;

function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function lum(r,g,b){return .2126*r+.7152*g+.0722*b;}
function rgbHex(r,g,b){
  function h(v){var s=clamp(Math.round(v),0,255).toString(16);return s.length<2?"0"+s:s;}
  return "#"+h(r)+h(g)+h(b);
}
function p(){
  return{
    mode:$("mode").value,
    sectionSensitivity:Number($("sectionSensitivity").value),
    maxSections:Number($("maxSections").value),
    maxWidth:Number($("maxWidth").value),
    darkDetect:$("darkDetect").checked,
    responsive:$("responsive").checked
  };
}
function labels(){
  $("sectionSensitivityV").textContent=$("sectionSensitivity").value;
  $("maxSectionsV").textContent=$("maxSections").value;
  $("maxWidthV").textContent=$("maxWidth").value+"px";
}

function drawSource(){
  if(!source)return;
  var w=canvas.width,h=canvas.height;
  ctx.clearRect(0,0,w,h);ctx.fillStyle="#111";ctx.fillRect(0,0,w,h);
  var s=Math.min(w/source.width,h/source.height),dw=source.width*s,dh=source.height*s;
  ctx.drawImage(source,(w-dw)/2,(h-dh)/2,dw,dh);
}

function analyzeImage(){
  if(!source){$("status").textContent="Carga una captura";return;}
  var cfg=p(),aw=360,ah=Math.max(120,Math.round(source.height*(aw/source.width)));
  var off=document.createElement("canvas");off.width=aw;off.height=ah;
  var oc=off.getContext("2d");oc.drawImage(source,0,0,aw,ah);
  var img=oc.getImageData(0,0,aw,ah),rows=[],y,x;
  for(y=0;y<ah;y++){
    var sr=0,sg=0,sb=0,edge=0,prev=-1;
    for(x=0;x<aw;x+=3){
      var i=(y*aw+x)*4,r=img.data[i],g=img.data[i+1],b=img.data[i+2],l=lum(r,g,b);
      sr+=r;sg+=g;sb+=b;
      if(prev>=0)edge+=Math.abs(l-prev);
      prev=l;
    }
    var n=Math.ceil(aw/3);
    rows.push({r:sr/n,g:sg/n,b:sb/n,edge:edge/n});
  }

  var cuts=[0],minGap=Math.max(22,Math.round(ah*.08)),last=0;
  for(y=2;y<ah-2;y++){
    var a=rows[y-1],b=rows[y+1],diff=Math.abs(a.r-b.r)+Math.abs(a.g-b.g)+Math.abs(a.b-b.b);
    diff+=Math.abs(rows[y].edge-rows[y-2].edge)*1.4;
    if(diff>cfg.sectionSensitivity && y-last>minGap){
      cuts.push(y);last=y;
      if(cuts.length>=cfg.maxSections)break;
    }
  }
  if(ah-cuts[cuts.length-1]<minGap*.65)cuts.pop();
  cuts.push(ah);

  var sections=[];
  for(var c=0;c<cuts.length-1;c++){
    var y0=cuts[c],y1=cuts[c+1],sr=0,sg=0,sb=0,count=0,leftE=0,midE=0,rightE=0;
    for(y=y0;y<y1;y+=2){
      for(x=0;x<aw;x+=6){
        var ii=(y*aw+x)*4;
        sr+=img.data[ii];sg+=img.data[ii+1];sb+=img.data[ii+2];count++;
        var l0=x>0?lum(img.data[ii-24],img.data[ii-23],img.data[ii-22]):0;
        var l1=lum(img.data[ii],img.data[ii+1],img.data[ii+2]);
        var e=Math.abs(l1-l0);
        if(x<aw/3)leftE+=e;else if(x<aw*2/3)midE+=e;else rightE+=e;
      }
    }
    var avg={r:sr/count,g:sg/count,b:sb/count};
    var edges=[leftE,midE,rightE],emin=Math.min.apply(null,edges),emax=Math.max.apply(null,edges);
    var cols=(emax>emin*1.55)?2:((leftE>0&&midE>0&&rightE>0&&emax<emin*1.25)?3:1);
    var brightness=lum(avg.r,avg.g,avg.b);
    sections.push({
      height:(y1-y0)/ah,
      color:rgbHex(avg.r,avg.g,avg.b),
      dark:brightness<128,
      columns:cols
    });
  }

  analysis={
    width:source.width,
    height:source.height,
    darkOverall:sections.filter(function(s){return s.dark;}).length>sections.length/2,
    sections:sections
  };
  drawAnalysis();
  $("status").textContent="Detectadas "+sections.length+" secciones";
}

function drawAnalysis(){
  drawSource();
  if(!analysis)return;
  var y=0;
  ctx.save();ctx.globalAlpha=.9;ctx.strokeStyle="#00d084";ctx.lineWidth=2;
  analysis.sections.forEach(function(s,idx){
    var h=s.height*canvas.height;
    ctx.strokeRect(2,y+2,canvas.width-4,h-4);
    ctx.fillStyle="rgba(0,0,0,.55)";ctx.fillRect(7,y+7,120,22);
    ctx.fillStyle="#fff";ctx.font="12px Arial";ctx.fillText("S"+(idx+1)+" · "+s.columns+" col · "+s.color,12,y+22);
    y+=h;
  });
  ctx.restore();
}

function generateCode(){
  if(!analysis){analyzeImage();if(!analysis)return;}
  var cfg=p(),html=[],css=[];
  html.push('<!doctype html>','<html lang="es">','<head>','  <meta charset="utf-8">','  <meta name="viewport" content="width=device-width,initial-scale=1">','  <link rel="stylesheet" href="styles.css">','  <title>Recreación desde imagen</title>','</head>','<body>');
  analysis.sections.forEach(function(s,i){
    html.push('  <section class="section section-'+(i+1)+'">','    <div class="container layout-'+s.columns+'">');
    for(var c=0;c<s.columns;c++){
      html.push('      <div class="block block-'+(c+1)+'">','        <h2>Título de sección</h2>','        <p>Contenido editable reconstruido desde la referencia visual.</p>','        <a class="button" href="#">Acción</a>','      </div>');
    }
    html.push('    </div>','  </section>');
  });
  html.push('</body>','</html>');

  var text=analysis.darkOverall&&cfg.darkDetect?"#f4f4f4":"#171717";
  css.push('* { box-sizing: border-box; }',
    'html { scroll-behavior: smooth; }',
    'body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: '+text+'; }',
    '.container { width: min(calc(100% - 40px), '+cfg.maxWidth+'px); margin: 0 auto; }',
    '.section { padding: clamp(48px, 7vw, 110px) 0; }',
    '.layout-1 { display: grid; grid-template-columns: 1fr; gap: 32px; }',
    '.layout-2 { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 40px; }',
    '.layout-3 { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 28px; }',
    '.block { min-width: 0; }',
    '.block h2 { margin: 0 0 16px; font-size: clamp(28px, 4vw, 54px); line-height: 1.05; }',
    '.block p { max-width: 62ch; line-height: 1.6; opacity: .82; }',
    '.button { display: inline-block; margin-top: 12px; padding: 12px 18px; border: 1px solid currentColor; color: inherit; text-decoration: none; }'
  );
  analysis.sections.forEach(function(s,i){
    css.push('.section-'+(i+1)+' { background: '+s.color+'; color: '+(s.dark?"#f4f4f4":"#171717")+'; min-height: '+Math.max(180,Math.round(s.height*900))+'px; }');
  });
  if(cfg.mode==="clean"){
    css.push('.section { min-height: auto; }','.container { align-items: center; }');
  }
  if(cfg.responsive||cfg.mode==="responsive"){
    css.push('@media (max-width: 760px) {',
      '  .container { width: min(calc(100% - 28px), '+cfg.maxWidth+'px); }',
      '  .layout-2, .layout-3 { grid-template-columns: 1fr; gap: 22px; }',
      '  .section { padding: 52px 0; min-height: auto; }',
      '}');
  }
  $("htmlCode").value=html.join("\n");
  $("cssCode").value=css.join("\n");
  $("status").textContent="HTML/CSS generado";
}

function saveProject(){
  if(!$("htmlCode").value.trim())generateCode();
  var h=encodeURIComponent($("htmlCode").value),c=encodeURIComponent($("cssCode").value);
  if(!window.__adobe_cep__){$("status").textContent="CEP no disponible";return;}
  $("status").textContent="Elige carpeta...";
  window.__adobe_cep__.evalScript("saveWebProject('"+h+"','"+c+"')",function(r){$("status").textContent=r;});
}

$("file").onchange=function(e){
  var f=e.target.files[0];if(!f)return;
  var reader=new FileReader();
  reader.onload=function(ev){
    var img=new Image();
    img.onload=function(){source=img;analysis=null;$("empty").style.display="none";drawSource();$("status").textContent="Captura cargada";};
    img.src=ev.target.result;
  };
  reader.readAsDataURL(f);
};
$("analyze").onclick=analyzeImage;
$("generate").onclick=generateCode;
$("save").onclick=saveProject;
$("reset").onclick=function(){source=null;analysis=null;$("htmlCode").value="";$("cssCode").value="";ctx.clearRect(0,0,canvas.width,canvas.height);$("empty").style.display="block";$("status").textContent="Motor listo";};
["sectionSensitivity","maxSections","maxWidth"].forEach(function(id){$(id).oninput=function(){labels();clearTimeout(timer);timer=setTimeout(function(){if(source)analyzeImage();},100);};});
["mode","darkDetect","responsive"].forEach(function(id){$(id).onchange=function(){if(analysis)generateCode();};});
labels();
})();
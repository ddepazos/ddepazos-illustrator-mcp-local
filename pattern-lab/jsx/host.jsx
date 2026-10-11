#target illustrator

function _patternEsc(s){return String(s).replace(/\\/g,"\\\\").replace(/"/g,'\\"');}
function getPatternSelectionInfo(){
  try{
    if(app.documents.length===0)return "ERROR: no hay documento";
    var sel=app.activeDocument.selection;
    if(!sel||sel.length!==1)return "ERROR: selecciona un solo objeto";
    var b=sel[0].geometricBounds,w=Math.abs(b[2]-b[0]),h=Math.abs(b[1]-b[3]);
    return '{"width":'+w+',"height":'+h+'}';
  }catch(e){return "ERROR: "+e;}
}
function createPatternCopies(json){
  try{
    if(app.documents.length===0)return "ERROR: no hay documento";
    var p=eval("("+json+")"),doc=app.activeDocument,sel=doc.selection;
    if(!sel||sel.length!==1)return "ERROR: selecciona un solo objeto";
    var src=sel[0],group=doc.groupItems.add(),count=Math.min(120,Math.max(2,p.count)),i,a,r,x,y,cols,rows,copy,scalePct,rot;
    group.name="Pazos Pattern Lab";
    var cx=(src.geometricBounds[0]+src.geometricBounds[2])/2;
    var cy=(src.geometricBounds[1]+src.geometricBounds[3])/2;

    for(i=0;i<count;i++){
      x=0;y=0;rot=i*p.rotationStep;
      if(p.mode==="radial"){
        a=i/count*Math.PI*2;r=p.radius;x=Math.cos(a)*r;y=Math.sin(a)*r;if(p.rotateToPath)rot=a*180/Math.PI+90;
      }else if(p.mode==="spiral"){
        a=i*.52;r=20+(p.radius/count)*i;x=Math.cos(a)*r;y=Math.sin(a)*r;if(p.rotateToPath)rot=a*180/Math.PI+90;
      }else if(p.mode==="wave"){
        x=(i-(count-1)/2)*p.gapX;y=Math.sin(i/Math.max(1,count-1)*Math.PI*2*p.frequency)*p.amplitude;if(p.rotateToPath)rot=Math.cos(i/Math.max(1,count-1)*Math.PI*2*p.frequency)*25;
      }else{
        cols=Math.ceil(Math.sqrt(count));rows=Math.ceil(count/cols);x=(i%cols-(cols-1)/2)*p.gapX;y=(Math.floor(i/cols)-(rows-1)/2)*p.gapY;
      }

      copy=src.duplicate(group,ElementPlacement.PLACEATEND);
      scalePct=Math.max(8,(1+i*p.scaleStep)*100);
      if(scalePct!==100)copy.resize(scalePct,scalePct,true,true,true,true,100,Transformation.CENTER);
      if(rot)copy.rotate(rot,true,true,true,true,Transformation.CENTER);
      copy.translate(x,y);
    }

    if(!p.keepOriginal)src.remove();
    group.selected=true;app.redraw();
    return "OK · "+count+" copias";
  }catch(e){return "ERROR: "+e;}
}

#target illustrator

function createTattooStencil(json){
  try{
    var data=eval("("+json+")");
    if(app.documents.length===0)app.documents.add();
    var doc=app.activeDocument,group=doc.groupItems.add();
    group.name="Pazos Tattoo Stencil";

    var rect=doc.artboards[doc.artboards.getActiveArtboardIndex()].artboardRect;
    var artW=rect[2]-rect[0],artH=rect[1]-rect[3];
    var outputW=artW*.78,scale=outputW/700,outputH=430*scale;
    var startX=rect[0]+(artW-outputW)/2,startY=rect[1]-(artH-outputH)/2;

    var black=new RGBColor();black.red=0;black.green=0;black.blue=0;
    var lineGroup=group.groupItems.add();lineGroup.name="Lineas";
    var dotGroup=group.groupItems.add();dotGroup.name="Puntillismo";
    var i,l,p;

    for(i=0;i<data.lines.length;i++){
      l=data.lines[i];
      p=lineGroup.pathItems.add();
      p.setEntirePath([
        [startX+l.x1*scale,startY-l.y1*scale],
        [startX+l.x2*scale,startY-l.y2*scale]
      ]);
      p.closed=false;p.filled=false;p.stroked=true;p.strokeColor=black;
      p.strokeWidth=Math.max(.2,l.width*scale);
      try{p.strokeCap=StrokeCap.ROUNDENDCAP;}catch(e){}
    }

    for(i=0;i<data.dots.length;i++){
      var d=data.dots[i],size=d.r*scale*2;
      if(size<.15)continue;
      p=dotGroup.pathItems.ellipse(
        startY-d.y*scale+size/2,
        startX+d.x*scale-size/2,
        size,size
      );
      p.filled=true;p.fillColor=black;p.stroked=false;
    }

    if(data.lines.length===0)lineGroup.remove();
    if(data.dots.length===0)dotGroup.remove();

    group.selected=true;app.redraw();
    return "OK · "+data.lines.length+" líneas · "+data.dots.length+" puntos";
  }catch(e){return "ERROR: "+e;}
}

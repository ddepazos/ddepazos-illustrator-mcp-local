#target illustrator

function createHalftone(json){
  try{
    var data=eval("("+json+")");
    if(app.documents.length===0)app.documents.add();

    var doc=app.activeDocument,group=doc.groupItems.add();
    group.name="Pazos Halftone";

    var artboard=doc.artboards[doc.artboards.getActiveArtboardIndex()].artboardRect;
    var artLeft=artboard[0],artTop=artboard[1],artWidth=artboard[2]-artboard[0],artHeight=artboard[1]-artboard[3];
    var outputWidth=artWidth*.70,scale=outputWidth/700,outputHeight=430*scale;
    var startX=artLeft+(artWidth-outputWidth)/2,startY=artTop-(artHeight-outputHeight)/2;

    var black=new RGBColor();black.red=0;black.green=0;black.blue=0;

    for(var i=0;i<data.length;i++){
      var p=data[i],size=p.size*scale*2;
      if(size<.15)continue;

      var left=startX+p.x*scale-size/2;
      var top=startY-p.y*scale+size/2;
      var item;

      if(p.shape==="circle"){
        item=group.pathItems.ellipse(top,left,size,size);
      }else{
        item=group.pathItems.rectangle(top,left,size,size);
        if(p.shape==="diamond")item.rotate(45);
      }

      item.filled=true;
      item.fillColor=black;
      item.stroked=false;
    }

    group.selected=true;
    app.redraw();
    return "OK · "+data.length+" vectores";
  }catch(e){
    return "ERROR: "+e;
  }
}

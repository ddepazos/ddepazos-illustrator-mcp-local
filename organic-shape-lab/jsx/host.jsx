#target illustrator

function _organicEsc(s){return String(s).replace(/\\/g,"\\\\").replace(/"/g,'\\"').replace(/\r?\n/g,"\\n");}
function _organicJSON(v){
    if(v===null)return "null";
    var t=typeof v,i,k,a=[];
    if(t==="number"||t==="boolean")return String(v);
    if(t==="string")return '"'+_organicEsc(v)+'"';
    if(v instanceof Array){for(i=0;i<v.length;i++)a.push(_organicJSON(v[i]));return "["+a.join(",")+"]";}
    if(t==="object"){for(k in v)if(v.hasOwnProperty(k))a.push('"'+_organicEsc(k)+'":'+_organicJSON(v[k]));return "{"+a.join(",")+"}";}
    return "null";
}
function _firstPath(item){
    var i,p;
    if(!item)return null;
    if(item.typename==="PathItem" && !item.guides && !item.clipping)return item;
    if(item.typename==="CompoundPathItem" && item.pathItems.length)return item.pathItems[0];
    if(item.typename==="GroupItem"){
        for(i=0;i<item.pageItems.length;i++){p=_firstPath(item.pageItems[i]);if(p)return p;}
    }
    return null;
}
function getOrganicSelectionData(){
    try{
        if(app.documents.length===0)return "ERROR: no hay documento";
        var sel=app.activeDocument.selection;
        if(!sel||!sel.length)return "ERROR: selecciona un path";
        var p=_firstPath(sel[0]);
        if(!p)return "ERROR: la selección no contiene un path";
        var pts=[],i,pp;
        for(i=0;i<p.pathPoints.length;i++){
            pp=p.pathPoints[i];
            pts.push({x:pp.anchor[0],y:-pp.anchor[1]});
        }
        return _organicJSON({closed:p.closed,points:pts});
    }catch(e){return "ERROR: "+e;}
}
function _setBlack(path){
    var black=new RGBColor();black.red=0;black.green=0;black.blue=0;
    path.strokeColor=black;path.fillColor=black;
}
function applyOrganicGeometry(json){
    try{
        var data=eval("("+json+")");
        if(app.documents.length===0)app.documents.add();
        var doc=app.activeDocument,group=doc.groupItems.add(),i,j,h,out,pp;
        group.name="Pazos Organic Shape Lab";

        var rect=doc.artboards[doc.artboards.getActiveArtboardIndex()].artboardRect;
        var aw=rect[2]-rect[0],ah=rect[1]-rect[3],scale=Math.min(aw/700,ah/430)*.82;
        var ox=rect[0]+aw/2-350*scale,oy=rect[1]-ah/2+215*scale;

        for(i=0;i<data.paths.length;i++){
            h=data.paths[i];
            out=group.pathItems.add();
            out.closed=true;
            for(j=0;j<h.length;j++){
                pp=out.pathPoints.add();
                pp.anchor=[ox+h[j].anchor[0]*scale,oy-h[j].anchor[1]*scale];
                pp.leftDirection=[ox+h[j].left[0]*scale,oy-h[j].left[1]*scale];
                pp.rightDirection=[ox+h[j].right[0]*scale,oy-h[j].right[1]*scale];
                pp.pointType=PointType.SMOOTH;
            }
            _setBlack(out);
            out.stroked=true;out.strokeWidth=1;
            out.filled=!data.outlineOnly;
            if(data.outlineOnly)out.fillColor=new NoColor();
        }

        if(data.mode==="deform" && !data.duplicate){
            var sel=doc.selection,k;
            if(sel&&sel.length){for(k=sel.length-1;k>=0;k--)try{sel[k].remove();}catch(x){}}
        }

        group.selected=true;app.redraw();
        return "OK · "+data.paths.length+" forma(s) vectoriales";
    }catch(e){return "ERROR: "+e;}
}

#target illustrator

function _esc(s){return String(s).replace(/\\/g,"\\\\").replace(/"/g,'\\"').replace(/\r?\n/g,"\\n");}
function _json(v){
    if(v===null)return "null";
    var t=typeof v,i,k,a=[];
    if(t==="number"||t==="boolean")return String(v);
    if(t==="string")return '"'+_esc(v)+'"';
    if(v instanceof Array){for(i=0;i<v.length;i++)a.push(_json(v[i]));return "["+a.join(",")+"]";}
    if(t==="object"){for(k in v)if(v.hasOwnProperty(k))a.push('"'+_esc(k)+'":'+_json(v[k]));return "{"+a.join(",")+"}";}
    return "null";
}
function _collect(item,out){
    var i;
    if(!item)return;
    if(item.typename==="PathItem" && !item.guides && !item.clipping){out.push(item);return;}
    if(item.typename==="CompoundPathItem"){for(i=0;i<item.pathItems.length;i++)_collect(item.pathItems[i],out);return;}
    if(item.typename==="GroupItem"){for(i=0;i<item.pageItems.length;i++)_collect(item.pageItems[i],out);}
}
function getSelectionVectorData(){
    try{
        if(app.documents.length===0)return "ERROR: no hay documento";
        var sel=app.activeDocument.selection;
        if(!sel||sel.length===0)return "ERROR: selecciona un vector";
        var paths=[],items=[],i,j,p,pp,pts;
        for(i=0;i<sel.length;i++)_collect(sel[i],items);
        if(!items.length)return "ERROR: la selección no contiene paths";
        for(i=0;i<items.length;i++){
            p=items[i];pts=[];
            for(j=0;j<p.pathPoints.length;j++){
                pp=p.pathPoints[j];
                pts.push({anchor:[pp.anchor[0],pp.anchor[1]],left:[pp.leftDirection[0],pp.leftDirection[1]],right:[pp.rightDirection[0],pp.rightDirection[1]],type:String(pp.pointType)});
            }
            paths.push({closed:p.closed,filled:p.filled,stroked:p.stroked,points:pts});
        }
        return _json({paths:paths});
    }catch(e){return "ERROR: "+e;}
}
function selectLocalImage(){
    var f=File.openDialog("Selecciona una imagen","Imágenes:*.jpg;*.jpeg;*.png;*.tif;*.tiff;*.psd;*.bmp");
    return f?f.fsName:"CANCEL";
}
function _parse(s){return eval("("+s+")");}
function _transform3(x,y,z,cx,cy,p,zNorm){
    x-=cx;y-=cy;
    var b=1-Math.min(.35,p.bevel/220);
    if(zNorm===0||zNorm===1){x*=b;y*=b;}
    var tap=1+(p.taper/100)*(zNorm-.5);
    var inf=1+(p.inflate/100)*.22;x*=tap*inf;y*=tap*inf;
    var a=p.twist*Math.PI/180*(zNorm-.5),ca=Math.cos(a),sa=Math.sin(a),tx=x*ca-y*sa,ty=x*sa+y*ca;x=tx;y=ty;
    x+=Math.sin(y/150)*p.bend*.55*(zNorm-.5);
    var c,s,t;
    c=Math.cos(p.rx*Math.PI/180);s=Math.sin(p.rx*Math.PI/180);t=y*c-z*s;z=y*s+z*c;y=t;
    c=Math.cos(p.ry*Math.PI/180);s=Math.sin(p.ry*Math.PI/180);t=x*c+z*s;z=-x*s+z*c;x=t;
    c=Math.cos(p.rz*Math.PI/180);s=Math.sin(p.rz*Math.PI/180);t=x*c-y*s;y=x*s+y*c;x=t;
    var per=p.perspective,f=per/(per-z);
    return [cx+x*f,cy+y*f];
}
function _copyAppearance(src,dst){
    try{dst.filled=src.filled;if(src.filled)dst.fillColor=src.fillColor;}catch(e){}
    try{dst.stroked=src.stroked;if(src.stroked){dst.strokeColor=src.strokeColor;dst.strokeWidth=src.strokeWidth;}}catch(e){}
}
function _makeProjectedPath(doc,src,z,p,cx,cy,zNorm,parent){
    var out=parent.pathItems.add(),i,pp,op,q;
    out.closed=src.closed;
    for(i=0;i<src.pathPoints.length;i++){
        pp=src.pathPoints[i];op=out.pathPoints.add();
        q=_transform3(pp.anchor[0],pp.anchor[1],z,cx,cy,p,zNorm);op.anchor=q;
        q=_transform3(pp.leftDirection[0],pp.leftDirection[1],z,cx,cy,p,zNorm);op.leftDirection=q;
        q=_transform3(pp.rightDirection[0],pp.rightDirection[1],z,cx,cy,p,zNorm);op.rightDirection=q;
        op.pointType=pp.pointType;
    }
    _copyAppearance(src,out);return out;
}
function applyVector3D(json){
    try{
        if(app.documents.length===0)return "ERROR: no hay documento";
        var p=_parse(json),doc=app.activeDocument,sel=doc.selection;
        if(!sel||!sel.length)return "ERROR: selecciona un vector";
        var items=[],i,j,src,g,bounds,cx,cy,d,frontPts,backPts,n,k,side,a,b,c,e;
        for(i=0;i<sel.length;i++)_collect(sel[i],items);
        if(!items.length)return "ERROR: no hay paths";
        g=doc.groupItems.add();
        for(i=0;i<items.length;i++){
            src=items[i];bounds=src.geometricBounds;cx=(bounds[0]+bounds[2])/2;cy=(bounds[1]+bounds[3])/2;d=(p.mode==="2d"?0:p.extrude)/2;
            if(d>0){
                n=src.pathPoints.length;
                for(j=0;j<n;j++){
                    k=(j+1)%n;if(!src.closed&&j===n-1)break;
                    a=_transform3(src.pathPoints[j].anchor[0],src.pathPoints[j].anchor[1],-d,cx,cy,p,0);
                    b=_transform3(src.pathPoints[k].anchor[0],src.pathPoints[k].anchor[1],-d,cx,cy,p,0);
                    c=_transform3(src.pathPoints[k].anchor[0],src.pathPoints[k].anchor[1], d,cx,cy,p,1);
                    e=_transform3(src.pathPoints[j].anchor[0],src.pathPoints[j].anchor[1], d,cx,cy,p,1);
                    side=g.pathItems.add();side.setEntirePath([a,b,c,e]);side.closed=true;
                    try{side.filled=src.filled;if(src.filled)side.fillColor=src.fillColor;side.opacity=55;}catch(x){}
                    side.stroked=false;
                }
                _makeProjectedPath(doc,src,-d,p,cx,cy,0,g).opacity=55;
            }
            _makeProjectedPath(doc,src,d,p,cx,cy,1,g);
        }
        if(!p.duplicate){for(i=sel.length-1;i>=0;i--)try{sel[i].remove();}catch(x){}}
        g.selected=true;app.redraw();return "Vector 3D aplicado";
    }catch(e){return "ERROR: "+e;}
}
function placeImage3D(path,json){
    try{
        var p=_parse(json),doc=app.documents.length?app.activeDocument:app.documents.add(),f=new File(path);
        if(!f.exists)return "ERROR: imagen no encontrada";
        var it=doc.placedItems.add();it.file=f;it.position=[doc.width/4,doc.height*.75];it.selected=true;
        var rx=p.rx*Math.PI/180,ry=p.ry*Math.PI/180,rz=p.rz*Math.PI/180,cx=Math.cos(rx),sx=Math.sin(rx),cy=Math.cos(ry),sy=Math.sin(ry),cz=Math.cos(rz),sz=Math.sin(rz);
        var m=app.getIdentityMatrix();m.mValueA=cz*cy;m.mValueB=sz*cy;m.mValueC=(cz*sy*sx)-(sz*cx);m.mValueD=(sz*sy*sx)+(cz*cx);
        it.transform(m,true,true,true,true,100,Transformation.CENTER);app.redraw();return "Imagen proyectada";
    }catch(e){return "ERROR: "+e;}
}
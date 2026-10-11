#target illustrator

function _nftCopySelectionToTemp(){
    if(app.documents.length===0)throw new Error("No hay documento abierto.");
    var source=app.activeDocument,sel=source.selection;
    if(!sel||sel.length===0)throw new Error("Selecciona una obra antes de exportar.");

    var temp=app.documents.add(DocumentColorSpace.RGB);
    source.activate();
    app.executeMenuCommand("copy");
    temp.activate();
    app.executeMenuCommand("paste");

    if(temp.selection&&temp.selection.length){
        var b=temp.selection[0].visibleBounds;
        var i;
        for(i=1;i<temp.selection.length;i++){
            var q=temp.selection[i].visibleBounds;
            b=[Math.min(b[0],q[0]),Math.max(b[1],q[1]),Math.max(b[2],q[2]),Math.min(b[3],q[3])];
        }
        temp.artboards[0].artboardRect=b;
    }
    return temp;
}

function exportSelectedNFTArtwork(format){
    var temp=null;
    try{
        var folder=Folder.selectDialog("Selecciona carpeta para exportar la obra NFT");
        if(!folder)return "Exportación cancelada";

        temp=_nftCopySelectionToTemp();

        if(format==="png"){
            var pngFile=new File(folder.fsName+"/artwork.png");
            var png=new ExportOptionsPNG24();
            png.antiAliasing=true;png.transparency=true;png.artBoardClipping=true;
            temp.exportFile(pngFile,ExportType.PNG24,png);
        }else{
            var svgFile=new File(folder.fsName+"/artwork.svg");
            var svg=new ExportOptionsSVG();
            svg.embedRasterImages=true;
            svg.fontSubsetting=SVGFontSubsetting.None;
            temp.exportFile(svgFile,ExportType.SVG,svg);
        }

        temp.close(SaveOptions.DONOTSAVECHANGES);
        temp=null;
        return "OK · obra exportada";
    }catch(e){
        try{if(temp)temp.close(SaveOptions.DONOTSAVECHANGES);}catch(x){}
        return "ERROR: "+e;
    }
}

function saveNFTPackage(metadataEncoded,mintEncoded){
    try{
        var folder=Folder.selectDialog("Selecciona carpeta para guardar metadata y mint request");
        if(!folder)return "Guardado cancelado";

        var metadata=decodeURIComponent(metadataEncoded);
        var mint=decodeURIComponent(mintEncoded);

        var mf=new File(folder.fsName+"/metadata.json");
        mf.encoding="UTF-8";
        if(!mf.open("w"))return "ERROR: no se pudo crear metadata.json";
        mf.write(metadata);mf.close();

        var rf=new File(folder.fsName+"/mint-request.json");
        rf.encoding="UTF-8";
        if(!rf.open("w"))return "ERROR: no se pudo crear mint-request.json";
        rf.write(mint);rf.close();

        return "OK · metadata.json + mint-request.json";
    }catch(e){
        return "ERROR: "+e;
    }
}
#target illustrator
function pazosAIChooseFolder() {
    var folder = Folder.selectDialog("Selecciona Pazos_AI_Turntable dentro de Google Drive (fuera del repositorio)");
    if (!folder) return "null";
    return '"' + folder.fsName.replace(/\\/g,"\\\\").replace(/"/g,'\\"') + '"';
}
function pazosAIExport(destination, size) {
    var temp = null, source = null;
    try {
        if (!app.documents.length) throw new Error("Abre un documento y selecciona la ilustración.");
        source = app.activeDocument;
        var selection = source.selection, items = [], i;
        if (!selection || !selection.length) throw new Error("Selecciona uno o más objetos.");
        for (i=0; i<selection.length; i++) items.push(selection[i]);
        temp = app.documents.add(DocumentColorSpace.RGB);
        var group = temp.groupItems.add();
        for (i=0; i<items.length; i++) items[i].duplicate(group, ElementPlacement.PLACEATEND);
        var b = group.visibleBounds, width=b[2]-b[0], height=b[1]-b[3];
        if (width<=0 || height<=0) throw new Error("La selección no tiene área visible.");
        temp.artboards[0].artboardRect=b;
        var opts=new ExportOptionsPNG24();
        opts.transparency=true; opts.antiAliasing=true; opts.artBoardClipping=true;
        opts.horizontalScale=opts.verticalScale=(size/Math.max(width,height))*100;
        temp.exportFile(new File(destination), ExportType.PNG24, opts);
        temp.close(SaveOptions.DONOTSAVECHANGES); temp=null; source.activate();
        return "OK";
    } catch(e) {
        try { if(temp) temp.close(SaveOptions.DONOTSAVECHANGES); if(source) source.activate(); } catch(ignore) {}
        return "ERROR: "+e;
    }
}
function pazosAIImport(files, separateArtboards) {
    var doc=null, added=[], boards=[], layer=null;
    try {
        if (!app.documents.length) throw new Error("Abre un documento para importar.");
        doc=app.activeDocument;
        if (!files.length || files.length>36) throw new Error("Cantidad de vistas inválida.");
        if (separateArtboards && doc.artboards.length+files.length>1000) throw new Error("Demasiadas mesas de trabajo.");
        var i;
        for(i=0;i<files.length;i++) if(!new File(files[i]).exists) throw new Error("Drive aún está sincronizando.");
        var active=doc.artboards[doc.artboards.getActiveArtboardIndex()].artboardRect;
        var cols=Math.ceil(Math.sqrt(files.length)), cell=360, gap=24, x=active[0], y=active[3]-gap;
        layer=doc.layers.add(); layer.name="Pazos AI Turntable · vistas de prueba";
        for(i=0;i<files.length;i++) {
            var item=layer.placedItems.add(); added.push(item); item.file=new File(files[i]);
            var scale=cell/Math.max(item.width,item.height); item.width*=scale; item.height*=scale;
            var left=x+(i%cols)*(cell+gap), top=y-Math.floor(i/cols)*(cell+gap);
            item.position=[left,top]; item.name="AI view "+i;
            if(separateArtboards) { var board=doc.artboards.add([left,top,left+cell,top-cell]); boards.push(board); board.name="AI view "+i; }
            item.embed();
        }
        app.redraw(); return "OK · "+files.length+" vistas importadas y embebidas.";
    } catch(e) {
        try { if(layer) layer.remove(); for(var j=boards.length-1;j>=0;j--) boards[j].remove(); } catch(ignore) {}
        return "ERROR: "+e;
    }
}

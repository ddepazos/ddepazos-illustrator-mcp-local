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
        var selection = source.selection;
        if (!selection || !selection.length) throw new Error("Selecciona uno o más objetos.");

        var out = new File(destination);
        if (!out.parent.exists) throw new Error("La carpeta temporal local no existe: " + out.parent.fsName);

        /*
         * Ruta principal: Illustrator 2023 exporta SOLO la selección a un PNG local.
         * No escribimos directamente en Google Drive para evitar errores PARM/MRAP.
         * El tamaño solicitado se aplica después en el worker; aquí prima la estabilidad.
         */
        try {
            if (source.exportSelectionAsPNG) {
                source.exportSelectionAsPNG(out);
                if (out.exists && out.length > 0) return "OK";
            }
        } catch(primaryError) {
            // Fallback compatible con Illustrator 2023: clipboard -> documento temporal local.
        }

        /*
         * Fallback: copy/paste en vez de duplicate() entre documentos.
         * duplicate() entre documentos es una fuente frecuente de PARM en Illustrator.
         */
        source.activate();
        app.executeMenuCommand("copy");

        temp = app.documents.add(DocumentColorSpace.RGB);
        temp.activate();
        app.executeMenuCommand("paste");

        var pasted = temp.selection;
        if (!pasted || !pasted.length) throw new Error("No se pudo copiar la selección al documento temporal.");

        var i, b, left, top, right, bottom;
        b = pasted[0].visibleBounds;
        left=b[0]; top=b[1]; right=b[2]; bottom=b[3];

        for (i=1; i<pasted.length; i++) {
            b = pasted[i].visibleBounds;
            if (b[0] < left) left = b[0];
            if (b[1] > top) top = b[1];
            if (b[2] > right) right = b[2];
            if (b[3] < bottom) bottom = b[3];
        }

        var width = right-left, height = top-bottom;
        if (width <= 0 || height <= 0) throw new Error("La selección no tiene área visible.");

        temp.artboards[0].artboardRect = [left, top, right, bottom];

        var opts = new ExportOptionsPNG24();
        opts.transparency = true;
        opts.antiAliasing = true;
        opts.artBoardClipping = true;

        var scale = (size / Math.max(width,height)) * 100;
        if (scale < 10) scale = 10;
        if (scale > 5000) scale = 5000;
        opts.horizontalScale = scale;
        opts.verticalScale = scale;

        temp.exportFile(out, ExportType.PNG24, opts);
        temp.close(SaveOptions.DONOTSAVECHANGES);
        temp = null;
        source.activate();

        if (!out.exists || out.length <= 0) throw new Error("Illustrator no generó artwork.png en la carpeta temporal.");
        return "OK";
    } catch(e) {
        try {
            if (temp) temp.close(SaveOptions.DONOTSAVECHANGES);
            if (source) source.activate();
        } catch(ignore) {}
        return "ERROR: " + e;
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

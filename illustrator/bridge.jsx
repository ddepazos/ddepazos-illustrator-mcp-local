/*
  Illustrator MCP Local Bridge v0.1

  Lee comandos desde:
  ~/Documents/illustrator-mcp/command.json

  No usa red.
  No abre sockets.
  No realiza peticiones HTTP.
*/

#target illustrator

(function () {
    var root = new Folder(Folder.myDocuments.fsName + "/illustrator-mcp");
    var commandFile = new File(root.fsName + "/command.json");
    var latestSvg = new File(root.fsName + "/latest.svg");

    if (!commandFile.exists) {
        alert("No hay una orden MCP pendiente.\n\nRuta: " + commandFile.fsName);
        return;
    }

    commandFile.encoding = "UTF-8";

    if (!commandFile.open("r")) {
        alert("No se pudo abrir command.json");
        return;
    }

    var raw = commandFile.read();
    commandFile.close();

    var command;

    try {
        command = eval("(" + raw + ")");
    } catch (e) {
        alert("command.json no es válido:\n" + e);
        return;
    }

    function importLatestSvg() {
        if (!latestSvg.exists) {
            throw new Error("No existe latest.svg en " + latestSvg.fsName);
        }

        var original = app.documents.length > 0 ? app.activeDocument : null;
        var svgDoc = app.open(latestSvg);

        if (!original) {
            app.redraw();
            return;
        }

        svgDoc.activate();
        app.executeMenuCommand("selectall");
        app.executeMenuCommand("copy");

        original.activate();
        app.executeMenuCommand("paste");

        svgDoc.close(SaveOptions.DONOTSAVECHANGES);
        app.redraw();
    }

    function transformSelection(cmd) {
        if (app.documents.length === 0) {
            throw new Error("No hay documento abierto.");
        }

        var doc = app.activeDocument;

        if (!doc.selection || doc.selection.length === 0) {
            throw new Error(
                "Selecciona al menos un objeto antes de ejecutar el bridge."
            );
        }

        if (doc.selection.length > 1) {
            app.executeMenuCommand("group");
        }

        var target = doc.selection[0];

        if (cmd.duplicate) {
            target = target.duplicate();
            doc.selection = null;
            target.selected = true;
        }

        var m = app.getIdentityMatrix();

        m.mValueA = cmd.matrix.a;
        m.mValueB = cmd.matrix.b;
        m.mValueC = cmd.matrix.c;
        m.mValueD = cmd.matrix.d;
        m.mValueTX = cmd.matrix.tx || 0;
        m.mValueTY = cmd.matrix.ty || 0;

        target.transform(
            m,
            true,
            true,
            true,
            true,
            100,
            Transformation.CENTER
        );

        app.redraw();
    }

    try {
        if (command.action === "import_latest_svg") {
            importLatestSvg();
        } else if (command.action === "transform_selection") {
            transformSelection(command);
        } else {
            throw new Error("Acción no soportada: " + command.action);
        }

        commandFile.remove();

    } catch (e) {
        alert("Illustrator MCP Bridge:\n" + e);
    }
})();

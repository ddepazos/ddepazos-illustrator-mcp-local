#target illustrator

function saveWebProject(htmlEncoded, cssEncoded){
    try{
        var folder=Folder.selectDialog("Selecciona la carpeta donde guardar el proyecto web");
        if(!folder)return "Guardado cancelado";

        var html=decodeURIComponent(htmlEncoded);
        var css=decodeURIComponent(cssEncoded);

        var htmlFile=new File(folder.fsName+"/index.html");
        htmlFile.encoding="UTF-8";
        if(!htmlFile.open("w"))return "ERROR: no se pudo crear index.html";
        htmlFile.write(html);
        htmlFile.close();

        var cssFile=new File(folder.fsName+"/styles.css");
        cssFile.encoding="UTF-8";
        if(!cssFile.open("w"))return "ERROR: no se pudo crear styles.css";
        cssFile.write(css);
        cssFile.close();

        return "OK · index.html + styles.css guardados";
    }catch(e){
        return "ERROR: "+e;
    }
}
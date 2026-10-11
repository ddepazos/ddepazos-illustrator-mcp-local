#target illustrator

function _managerEsc(s){return String(s).replace(/\\/g,"\\\\").replace(/"/g,'\\"').replace(/\r?\n/g,"\\n");}
function _managerJSON(v){
    if(v===null)return "null";
    var t=typeof v,i,k,a=[];
    if(t==="number"||t==="boolean")return String(v);
    if(t==="string")return '"'+_managerEsc(v)+'"';
    if(v instanceof Array){for(i=0;i<v.length;i++)a.push(_managerJSON(v[i]));return "["+a.join(",")+"]";}
    if(t==="object"){for(k in v)if(v.hasOwnProperty(k))a.push('"'+_managerEsc(k)+'":'+_managerJSON(v[k]));return "{"+a.join(",")+"}";}
    return "null";
}

function _managerRepo(){
    return new Folder(Folder.myDocuments.fsName + "/ddepazos-illustrator-mcp-local");
}

function getToolsManagerState(){
    try{
        var base=new Folder(Folder.userData.fsName + "/Adobe/CEP/extensions");
        var defs=[
            ["Vector 3D Local","com.ddepazos.vector3dlocal"],
            ["Halftone Pro","com.ddepazos.halftonepro"],
            ["Tattoo Stencil","com.ddepazos.tattoostencil"],
            ["Organic Shape Lab","com.ddepazos.organicshapelab"],
            ["Pattern Lab","com.ddepazos.patternlab"],
            ["Image → Web","com.ddepazos.imagetoweb"],
            ["NFT Publisher","com.ddepazos.nftpublisher"],
            ["Tools Manager","com.ddepazos.toolsmanager"]
        ];
        var mods=[],i;
        for(i=0;i<defs.length;i++){
            mods.push({name:defs[i][0],installed:new Folder(base.fsName+"/"+defs[i][1]).exists});
        }
        var repo=_managerRepo();
        return _managerJSON({repoPath:repo.fsName,repoExists:repo.exists,modules:mods});
    }catch(e){
        return _managerJSON({repoPath:"",repoExists:false,modules:[],error:String(e)});
    }
}

function updatePazosSuite(){
    try{
        var repo=_managerRepo();
        if(!repo.exists)return "ERROR: no existe "+repo.fsName;
        var gitDir=new Folder(repo.fsName+"/.git");
        if(!gitDir.exists)return "ERROR: la carpeta no parece ser un repositorio Git";

        var path=repo.fsName.replace(/'/g,"''");
        var cmd="powershell.exe -NoProfile -ExecutionPolicy Bypass -Command \""+
          "$ErrorActionPreference='Stop';"+
          "Set-Location -LiteralPath '"+path+"';"+
          "git pull --ff-only;"+
          "if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE };"+
          "& powershell.exe -NoProfile -ExecutionPolicy Bypass -File '.\\install-all-panels.ps1'"+
          "\"";

        if(typeof system==="undefined" || !system.callSystem)return "ERROR: system.callSystem no está disponible en esta instalación de Illustrator";
        var result=system.callSystem(cmd);
        if(result&&result.length>600)result=result.substring(result.length-600);
        return "OK · actualización instalada. Reinicia Illustrator. "+String(result||"");
    }catch(e){
        return "ERROR: "+e;
    }
}

function openManagerURL(url){
    try{
        if(typeof system==="undefined" || !system.callSystem)return "ERROR";
        var safe=String(url).replace(/"/g,"");
        system.callSystem('cmd.exe /c start "" "'+safe+'"');
        return "OK";
    }catch(e){
        return "ERROR: "+e;
    }
}
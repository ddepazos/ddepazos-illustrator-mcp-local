(function(){
"use strict";
var $=function(id){return document.getElementById(id);};
function addressOK(v){return /^0x[a-fA-F0-9]{40}$/.test((v||"").trim());}
function ipfsOK(v){return /^ipfs:\/\/.+/.test((v||"").trim());}
function metadata(){
  var m={
    name:$("name").value.trim(),
    description:$("description").value.trim(),
    image:$("imageUri").value.trim(),
    attributes:[
      {trait_type:"Artist",value:$("artist").value.trim()},
      {trait_type:"Edition",value:$("edition").value.trim()},
      {trait_type:"Source",value:"Adobe Illustrator 2023"}
    ]
  };
  var external=$("externalUrl").value.trim();
  if(external)m.external_url=external;
  return m;
}
function mintRequest(){
  return{
    network:"Sepolia",
    chainId:Number($("network").value),
    standard:"ERC-721",
    contract:$("contract").value.trim(),
    method:"mint(address,string)",
    args:{
      recipient:$("recipient").value.trim(),
      tokenURI:$("tokenUri").value.trim()
    },
    signing:"EXTERNAL_WALLET_REQUIRED",
    note:"No private key is stored or requested by Pazos NFT Publisher."
  };
}
function setStatus(s){$("status").textContent=s;}

$("metadata").onclick=function(){
  var m=metadata();
  if(!m.name){setStatus("Falta nombre");return;}
  if(!ipfsOK(m.image)){setStatus("Image URI debe comenzar con ipfs://");return;}
  $("metadataOut").value=JSON.stringify(m,null,2);
  setStatus("Metadata lista");
};

$("mintRequest").onclick=function(){
  var contract=$("contract").value.trim(),recipient=$("recipient").value.trim(),uri=$("tokenUri").value.trim();
  if(!addressOK(contract)){setStatus("Contrato inválido");return;}
  if(!addressOK(recipient)){setStatus("Wallet receptora inválida");return;}
  if(!ipfsOK(uri)){setStatus("Token URI debe comenzar con ipfs://");return;}
  if(!$("metadataOut").value.trim())$("metadata").click();
  var req=mintRequest();
  $("mintOut").value=JSON.stringify(req,null,2);

  if(!window.__adobe_cep__){setStatus("CEP no disponible");return;}
  var meta=encodeURIComponent($("metadataOut").value);
  var mint=encodeURIComponent($("mintOut").value);
  window.__adobe_cep__.evalScript("saveNFTPackage('"+meta+"','"+mint+"')",function(r){setStatus(r);});
};

$("exportArt").onclick=function(){
  if(!window.__adobe_cep__){setStatus("CEP no disponible");return;}
  var fmt=$("format").value;
  setStatus("Selecciona carpeta...");
  window.__adobe_cep__.evalScript("exportSelectedNFTArtwork('"+fmt+"')",function(r){setStatus(r);});
};
})();
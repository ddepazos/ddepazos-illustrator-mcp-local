import fs from "node:fs";
import path from "node:path";

const jobDir=process.argv[2];
const outDir=process.argv[3]||"dist-turntable";
if(!jobDir) throw new Error("Usage: node render.js <jobDir> [outDir]");

const cfg=JSON.parse(fs.readFileSync(path.join(jobDir,"turntable-job.json"),"utf8"));
const svg=fs.readFileSync(path.join(jobDir,cfg.source||"source.svg"),"utf8");

const vbMatch=svg.match(/viewBox=["']\s*([\d.+-]+)\s+([\d.+-]+)\s+([\d.+-]+)\s+([\d.+-]+)\s*["']/i);
const wMatch=svg.match(/width=["']([\d.]+)/i);
const hMatch=svg.match(/height=["']([\d.]+)/i);

let minX=0,minY=0,w=1000,h=1000;
if(vbMatch){
  minX=Number(vbMatch[1]);
  minY=Number(vbMatch[2]);
  w=Number(vbMatch[3]);
  h=Number(vbMatch[4]);
}else{
  if(wMatch) w=Number(wMatch[1]);
  if(hMatch) h=Number(hMatch[1]);
}

const cx=minX+w/2;
const cy=minY+h/2;
const body=svg.replace(/^.*?<svg[^>]*>/is,"").replace(/<\/svg>\s*$/is,"");
const open=(svg.match(/^.*?<svg[^>]*>/is)||[])[0] ||
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="'+minX+' '+minY+' '+w+' '+h+'">';

fs.mkdirSync(outDir,{recursive:true});

const count=Math.max(4,Math.min(36,Number(cfg.views)||12));
const start=Number(cfg.startAngle ?? -180);
const end=Number(cfg.endAngle ?? 180);
const tilt=Number(cfg.tilt||0);
const tiltRad=tilt*Math.PI/180;

for(let i=0;i<count;i++){
  const t=i/count;
  const angle=start+(end-start)*t;
  const a=angle*Math.PI/180;

  let sx=Math.cos(a);
  if(Math.abs(sx)<0.08) sx=sx<0?-0.08:0.08;

  const sy=Math.max(.25,Math.cos(tiltRad));
  const skew=Math.sin(a)*Math.sin(tiltRad)*0.18;
  const e=cx-cx*sx;
  const f=cy-cx*skew-cy*sy;

  const wrapped=open+
    '\n  <g transform="matrix('+sx.toFixed(6)+' '+skew.toFixed(6)+' 0 '+sy.toFixed(6)+' '+e.toFixed(3)+' '+f.toFixed(3)+')">'+
    '\n'+body+
    '\n  </g>'+
    '\n</svg>';

  const name="frame-"+String(i+1).padStart(3,"0")+"-"+Math.round(angle)+"deg.svg";
  fs.writeFileSync(path.join(outDir,name),wrapped);
}

fs.writeFileSync(
  path.join(outDir,"manifest.json"),
  JSON.stringify({
    source:cfg.source,
    views:count,
    startAngle:start,
    endAngle:end,
    tilt,
    renderer:"pazos-turntable-2.5d"
  },null,2)
);

console.log("Generated "+count+" SVG frames in "+outDir);

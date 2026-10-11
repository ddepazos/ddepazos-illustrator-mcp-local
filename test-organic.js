import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  organicPoints,
  closedCatmullRomPath,
  organicSvg
} from "./src/geometry.js";

const outputDir = path.join(os.homedir(), "Documents", "illustrator-mcp");
const latestSvg = path.join(outputDir, "latest.svg");
const commandFile = path.join(outputDir, "command.json");

await mkdir(outputDir, { recursive: true });

const args = {
  points: 28,
  radius: 180,
  irregularity: 0.22,
  lobes: 7,
  lobeStrength: 0.19,
  smoothness: 0.9,
  seed: 1984,
  fill: "#111111",
  stroke: "none",
  strokeWidth: 1,
  copies: 1,
  rotationStep: 0,
  scaleStep: 0
};

const pts = organicPoints(args);
const pathData = closedCatmullRomPath(pts, args.smoothness);
const svg = organicSvg({ ...args, pathData });

await writeFile(latestSvg, svg, "utf8");
await writeFile(
  commandFile,
  JSON.stringify(
    {
      action: "import_latest_svg",
      svg: latestSvg,
      seed: args.seed
    },
    null,
    2
  ),
  "utf8"
);

console.log("OK");
console.log("SVG:", latestSvg);
console.log("COMMAND:", commandFile);
console.log("Ahora ejecuta illustrator/bridge.jsx desde Illustrator 2023.");

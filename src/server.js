import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";

import {
  organicPoints,
  closedCatmullRomPath,
  organicSvg,
  project3DMatrix
} from "./geometry.js";

const outputDir = path.join(os.homedir(), "Documents", "illustrator-mcp");
const latestSvg = path.join(outputDir, "latest.svg");
const commandFile = path.join(outputDir, "command.json");

async function ensureOutputDir() {
  await mkdir(outputDir, { recursive: true });
}

async function queueCommand(command) {
  await ensureOutputDir();
  await writeFile(commandFile, JSON.stringify(command, null, 2), "utf8");
}

function buildServer() {
  const server = new McpServer({
    name: "illustrator-mcp-local",
    version: "0.1.0"
  });

  server.registerTool(
    "create_organic_shape",
    {
      description:
        "Genera una forma orgánica vectorial reproducible, la guarda como SVG local editable y deja una orden para importarla en Illustrator.",
      inputSchema: z.object({
        points: z.number().int().min(6).max(128).default(24),
        radius: z.number().min(10).max(2000).default(160),
        irregularity: z.number().min(0).max(0.9).default(0.25),
        lobes: z.number().int().min(0).max(32).default(6),
        lobeStrength: z.number().min(0).max(0.8).default(0.16),
        smoothness: z.number().min(0).max(1).default(0.82),
        seed: z.number().int().min(0).max(2147483647).default(1),
        fill: z.string().default("#111111"),
        stroke: z.string().default("none"),
        strokeWidth: z.number().min(0).max(100).default(1),
        copies: z.number().int().min(1).max(64).default(1),
        rotationStep: z.number().min(-360).max(360).default(0),
        scaleStep: z.number().min(-0.9).max(2).default(0)
      })
    },
    async (args) => {
      await ensureOutputDir();

      const pts = organicPoints(args);
      const pathData = closedCatmullRomPath(pts, args.smoothness);
      const svg = organicSvg({ ...args, pathData });

      await writeFile(latestSvg, svg, "utf8");
      await queueCommand({
        action: "import_latest_svg",
        svg: latestSvg,
        seed: args.seed
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                ok: true,
                latestSvg,
                commandFile,
                seed: args.seed,
                pathData,
                note:
                  "Ejecuta illustrator/bridge.jsx en Illustrator para importar latest.svg como vectores editables."
              },
              null,
              2
            )
          }
        ]
      };
    }
  );

  server.registerTool(
    "queue_3d_rotation",
    {
      description:
        "Calcula una proyección 3D a matriz 2D y deja una orden local para aplicarla al objeto seleccionado en Illustrator.",
      inputSchema: z.object({
        rotateX: z.number().min(-360).max(360).default(0),
        rotateY: z.number().min(-360).max(360).default(0),
        rotateZ: z.number().min(-360).max(360).default(0),
        scale: z.number().min(0.01).max(10).default(1),
        duplicate: z.boolean().default(true)
      })
    },
    async (args) => {
      const matrix = project3DMatrix(args);

      await queueCommand({
        action: "transform_selection",
        matrix,
        duplicate: args.duplicate,
        source: {
          rotateX: args.rotateX,
          rotateY: args.rotateY,
          rotateZ: args.rotateZ,
          scale: args.scale
        }
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                ok: true,
                matrix,
                commandFile,
                note:
                  "Selecciona el objeto en Illustrator y ejecuta illustrator/bridge.jsx."
              },
              null,
              2
            )
          }
        ]
      };
    }
  );

  server.registerTool(
    "preview_3d_matrix",
    {
      description:
        "Devuelve la matriz afín 2D resultante de una rotación X/Y/Z sin modificar archivos.",
      inputSchema: z.object({
        rotateX: z.number().min(-360).max(360).default(0),
        rotateY: z.number().min(-360).max(360).default(0),
        rotateZ: z.number().min(-360).max(360).default(0),
        scale: z.number().min(0.01).max(10).default(1)
      })
    },
    async (args) => ({
      content: [
        {
          type: "text",
          text: JSON.stringify(project3DMatrix(args), null, 2)
        }
      ]
    })
  );

  return server;
}

serveStdio(() => buildServer());

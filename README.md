# Illustrator MCP Local

Prototipo local para conectar un host MCP con Adobe Illustrator y generar/transformar vectores mediante instrucciones de alto nivel.

Ejemplos de intención:

> Crea una forma orgánica de siete lóbulos, irregular, suave, con semilla 1984.

> Duplica el objeto seleccionado y proyéctalo como una rotación X 30°, Y -35°, Z 15°.

## Objetivo

- Generación procedural de formas 2D orgánicas.
- Salida SVG editable.
- Semillas reproducibles.
- Transformaciones proyectadas X/Y/Z.
- Puente local hacia Illustrator mediante ExtendScript.
- Sin servidor HTTP propio.
- Sin subir el archivo de Illustrator a un servidor.

## Arquitectura

```text
Host MCP / IA
      │
    stdio
      ▼
MCP local (Node.js)
      │
      ├── latest.svg
      └── command.json
              │
              ▼
       Illustrator bridge.jsx
              │
              ▼
      vectores editables
```

## Requisitos

- Node.js 20+ recomendado.
- Adobe Illustrator con soporte para scripts JSX/ExtendScript.
- Un host compatible con MCP por stdio.

El proyecto usa la línea v2 del SDK oficial:

```bash
npm install @modelcontextprotocol/server zod
```

## Instalación

```bash
git clone https://github.com/ddepazos/ddepazos-illustrator-mcp-local.git
cd ddepazos-illustrator-mcp-local
npm install
npm start
```

## Configuración MCP

Usa `mcp-config.example.json` como referencia y cambia la ruta por la ubicación local real del repositorio.

Ejemplo:

```json
{
  "mcpServers": {
    "illustrator-local": {
      "command": "node",
      "args": [
        "C:/RUTA/ddepazos-illustrator-mcp-local/src/server.js"
      ]
    }
  }
}
```

## Carpeta local de intercambio

El MCP crea:

```text
~/Documents/illustrator-mcp/
├── latest.svg
└── command.json
```

No es un servidor de red. Es un buzón local entre Node.js e Illustrator.

## Herramientas MCP v0.1

### create_organic_shape

Genera un contorno Bézier orgánico reproducible.

Parámetros principales:

- `points`
- `radius`
- `irregularity`
- `lobes`
- `lobeStrength`
- `smoothness`
- `seed`
- `fill`
- `stroke`
- `copies`
- `rotationStep`
- `scaleStep`

### queue_3d_rotation

Calcula una proyección de rotación X/Y/Z a una matriz afín 2D y deja una orden para aplicarla al objeto seleccionado en Illustrator.

### preview_3d_matrix

Devuelve la matriz calculada sin escribir una orden.

## Uso en Illustrator

1. Genera una orden con el MCP.
2. Abre Illustrator.
3. Si es una transformación, selecciona el objeto.
4. Ve a **Archivo → Secuencias de comandos → Otra secuencia de comandos…**
5. Ejecuta `illustrator/bridge.jsx`.

## Privacidad / offline

El servidor MCP usa stdio y el bridge se comunica mediante archivos locales.

El bridge no utiliza:

- `fetch`
- `XMLHttpRequest`
- `Socket`
- HTTP
- APIs remotas

La instalación inicial de dependencias mediante npm sí puede requerir Internet. Una vez instaladas, el motor puede ejecutarse localmente.

## Próxima etapa

- metaballs;
- ruido procedural;
- superformula;
- espirales;
- deformación de paths;
- simetrías radiales;
- patrones generativos;
- operaciones booleanas;
- panel CEP/UXP;
- ejecución automática sin lanzar manualmente `bridge.jsx`.

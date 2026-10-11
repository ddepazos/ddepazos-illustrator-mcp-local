# Pazos Vector Tools / Illustrator MCP Local

Suite experimental de herramientas **locales y offline** para Adobe Illustrator 2023, junto con un servidor MCP local opcional.

## Paneles CEP incluidos

### Vector 3D Local

- lectura de vectores seleccionados;
- modos 2D / 2.5D / 3D;
- extrude;
- bevel aproximado;
- rotación X/Y/Z;
- twist;
- bend;
- inflate;
- taper;
- perspectiva;
- wireframe;
- aplicación del resultado como paths y caras vectoriales editables.

Carpeta: `cep-plugin/`

### Pazos Halftone Pro

- convierte imágenes locales en puntos vectoriales;
- densidad;
- tamaño máximo;
- contraste;
- umbral;
- rotación de trama;
- círculo, cuadrado o rombo;
- invertir y eliminar blancos.

Carpeta: `halftone-pro/`

### Pazos Tattoo Stencil

- extracción de líneas mediante Sobel;
- líneas + puntillismo;
- puntillismo tonal;
- contraste;
- sensibilidad de borde;
- grosor y longitud de línea;
- umbral de sombras;
- puntos vectoriales editables.

Carpeta: `tattoo-stencil/`

### Pazos Organic Shape Lab

- blobs y formas Bézier orgánicas;
- seed reproducible;
- lóbulos;
- irregularidad;
- ruido radial;
- inflate/contract;
- simetría bilateral y radial;
- variaciones;
- reinterpretación procedural de un path seleccionado.

Carpeta: `organic-shape-lab/`

## Instalar todos los paneles en Windows

En PowerShell:

```powershell
cd C:\Users\nicol\Documents\ddepazos-illustrator-mcp-local
git pull
powershell.exe -ExecutionPolicy Bypass -File .\install-all-panels.ps1
```

Después cierra Illustrator 2023 por completo y vuelve a abrirlo.

Busca los paneles en:

```text
Ventana → Extensiones (heredadas)
```

No se requieren permisos de administrador porque los paneles se instalan en:

```text
%APPDATA%\Adobe\CEP\extensions
```

## Privacidad / modo local

Los paneles usan HTML/CSS/JavaScript + ExtendScript y declaran una CSP con:

```text
connect-src 'none'
```

No usan Firefly, APIs remotas de Adobe ni un servidor HTTP propio.

La aplicación Adobe Illustrator puede realizar sus conexiones normales de licencia o servicios por separado; estos paneles no las necesitan para procesar imágenes o vectores.

---

# MCP local opcional

El repositorio también incluye un prototipo MCP local para órdenes de alto nivel.

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
```

## Requisitos MCP

- Node.js 20+;
- npm;
- un host compatible con MCP por stdio.

Instalación:

```powershell
npm.cmd install
npm.cmd start
```

Herramientas actuales:

- `create_organic_shape`
- `queue_3d_rotation`
- `preview_3d_matrix`

El MCP usa stdio y no levanta un servidor HTTP.

## Documentación adicional

- `CEP_PANEL.md`
- `HALFTONE_PRO.md`
- `TATTOO_STENCIL.md`
- `ORGANIC_SHAPE_LAB.md`
- `TEST_ILLUSTRATOR_2023.md`

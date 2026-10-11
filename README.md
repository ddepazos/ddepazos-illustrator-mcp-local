# Pazos Vector Tools / Illustrator MCP Local

Suite experimental de herramientas **locales y offline** para Adobe Illustrator 2023, junto con un servidor MCP local opcional.

## Paneles CEP incluidos

### Vector 3D Local
- lectura de vectores;
- modos 2D / 2.5D / 3D;
- extrude, bevel aproximado, X/Y/Z, twist, bend, inflate, taper;
- salida como paths y caras vectoriales editables.

### Pazos Halftone Pro
- imagen local a puntos vectoriales;
- densidad, tamaño, contraste, umbral y rotación de trama;
- círculo, cuadrado o rombo.

### Pazos Tattoo Stencil
- extracción de líneas con Sobel;
- líneas + puntillismo;
- puntillismo tonal editable.

### Pazos Organic Shape Lab
- blobs y formas Bézier;
- seed reproducible;
- lóbulos, ruido, simetría, variaciones;
- deformación procedural de un path seleccionado.


### Pazos Image → Web
- carga una captura de interfaz local;
- análisis reducido para bajo consumo;
- detección aproximada de secciones y columnas;
- extracción de colores;
- HTML semántico básico;
- CSS responsive;
- editor de código dentro del panel;
- exportación de `index.html` + `styles.css`.

### Pazos Pattern Lab
- patrones radial, grid, espiral y onda;
- máximo 120 copias finales;
- preview limitado a 80 siluetas simples;
- rotación, escala progresiva, separación, amplitud y frecuencia;
- cálculo solo al modificar controles, sin render continuo.

## Filosofía de rendimiento

La suite prioriza un PC con recursos limitados:

- previews simplificados;
- límites explícitos de copias/puntos;
- sin render loops innecesarios;
- procesamiento real solo cuando el usuario pulsa Aplicar/Crear;
- código empaquetado en GitHub Actions, no en el PC local.
- Image → Web limita el análisis de capturas a una resolución reducida para ahorrar CPU/RAM.

Para trabajos que involucren imágenes o diseños privados, el procesamiento permanece local.

## Instalar todos los paneles

```powershell
cd C:\Users\nicol\Documents\ddepazos-illustrator-mcp-local
git pull
powershell.exe -ExecutionPolicy Bypass -File .\install-all-panels.ps1
```

Luego reinicia Illustrator 2023 y abre:

```text
Ventana → Extensiones (heredadas)
```

Los paneles se instalan en:

```text
%APPDATA%\Adobe\CEP\extensions
```

No requieren permisos de administrador.

## GitHub Actions

El workflow:

```text
.github/workflows/package-suite.yml
```

crea automáticamente ZIPs de cada panel y un paquete completo de la suite cuando cambia `main`.

Esto permite que GitHub haga el trabajo de empaquetado y evita cargar tu PC con tareas innecesarias.

## Privacidad / offline

Los paneles usan HTML/CSS/JavaScript + ExtendScript y bloquean conexiones salientes con CSP:

```text
connect-src 'none'
```

No usan Firefly, APIs remotas de Adobe ni servidor HTTP propio.

Illustrator puede realizar sus conexiones normales de licencia de forma independiente; las herramientas no necesitan esas conexiones para procesar imágenes o vectores.

---

# MCP local opcional

También existe un servidor MCP local por `stdio`.

Herramientas actuales:

- `create_organic_shape`
- `queue_3d_rotation`
- `preview_3d_matrix`

Instalación:

```powershell
npm.cmd install
npm.cmd start
```

## Documentación

- `CEP_PANEL.md`
- `HALFTONE_PRO.md`
- `TATTOO_STENCIL.md`
- `ORGANIC_SHAPE_LAB.md`
- `PATTERN_LAB.md`
- `IMAGE_TO_WEB.md`
- `TEST_ILLUSTRATOR_2023.md`

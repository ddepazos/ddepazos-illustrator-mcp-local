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


### Pazos NFT Publisher
- prepara una obra seleccionada como SVG o PNG;
- genera `metadata.json` compatible con un flujo ERC-721;
- genera `mint-request.json` para Sepolia;
- preset de Sepolia con chain ID `11155111`;
- valida direcciones `0x...` y URIs `ipfs://`;
- nunca solicita ni almacena claves privadas o seed phrases;
- la firma se realiza con una wallet externa;
- el contrato de ejemplo se compila y valida en GitHub Actions, no en tu PC.

### Pazos Tools Manager
- muestra la versión instalada y la versión de GitHub;
- consulta GitHub solo cuando pulsas un botón;
- muestra el estado de los últimos Actions;
- detecta paneles instalados;
- abre repositorio y Actions;
- puede ejecutar git pull + instalación desde Illustrator;
- nunca sube automáticamente tus obras o archivos .ai.

### Pazos Turntable Local
- rotación 2.5D de -180° a +180°;
- tilt de -30° a +30°;
- auto depth por orden de apilado;
- inserta una vista o genera 4–16 vistas;
- prepara un paquete opcional para GitHub Actions;
- GitHub puede renderizar y empaquetar la secuencia SVG fuera del PC;
- no sube obras automáticamente y no inventa zonas ocultas como Firefly.

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
- el contrato ERC-721 de prueba se compila en GitHub Actions.
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

Esto permite que GitHub haga el trabajo de empaquetado y evita cargar tu PC con tareas innecesarias. El workflow `Turntable Render` también puede generar secuencias SVG desde un job que tú subas voluntariamente.

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
- `NFT_PUBLISHER.md`
- `TOOLS_MANAGER.md`
- `TURNTABLE_LOCAL.md`
- `TEST_ILLUSTRATOR_2023.md`
# Pazos AI Turntable · nuevo en suite 0.10.0

**Instalación sin consola:** descarga el paquete desde [GitHub Actions](https://github.com/ddepazos/ddepazos-illustrator-mcp-local/actions/workflows/package-suite.yml), extrae `pazos-vector-tools-suite.zip` y haz doble clic en **Instalar-Pazos-Tools.cmd**. Cierra Illustrator antes de instalar y vuelve a abrirlo al terminar.

En **Ventana → Extensiones (heredadas) → Pazos AI Turntable**, configura la carpeta de Drive y pulsa **Abrir notebook Colab**. Conecta y ejecuta el notebook una vez por sesión. Luego usa **Generar Turntable IA** e **Importar vistas** desde Illustrator.

El adaptador inicial es una prueba del flujo: produce copias PNG rotuladas, no nuevas vistas con IA. [Guía completa de instalación, privacidad y Colab](AI_TURNTABLE.md). Los módulos anteriores se mantienen disponibles.

# Vector 3D Local v0.2

Panel CEP local para Illustrator 2023.

## Qué añade

- Lectura de paths seleccionados desde Illustrator.
- Representación interna de anclas y manejadores Bézier.
- Modos 2D, 2.5D y 3D.
- Extrude, bevel aproximado, rotación X/Y/Z, twist, bend, inflate y taper.
- Perspectiva, zoom y wireframe.
- Viewport local interactivo con arrastre del mouse.
- Aplicación de la proyección como caras y paths vectoriales editables.
- Carga de imagen local y proyección tipo plano 3D.
- CSP con `connect-src 'none'`: el panel no abre conexiones de red.

## Instalar / actualizar

Desde PowerShell, dentro del repositorio:

```powershell
cd C:\Users\nicol\Documents\ddepazos-illustrator-mcp-local
git pull
powershell.exe -ExecutionPolicy Bypass -File .\install-panel.ps1
```

Cierra Illustrator 2023 y vuelve a abrirlo.

Busca:

**Ventana → Extensiones (heredadas) → Vector 3D Local**

## Alcance real

El viewport usa una malla/proyección interna inspirada en modificadores de Blender. Illustrator no recibe una malla 3D nativa: al aplicar, recibe caras y paths 2D proyectados y editables.

El bevel es una aproximación por escalado de las tapas. Twist, bend, inflate y taper se calculan localmente durante la proyección.

Para vectores complejos, la v0.2 prioriza estabilidad y editabilidad; una futura v0.3 puede incorporar triangulación robusta, subdivisión y mallas más densas.

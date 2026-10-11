# Pazos Image → Web v0.1

Panel CEP local para Illustrator 2023 que toma una captura de interfaz y genera una primera versión de HTML + CSS.

## Qué hace

- carga PNG/JPG/WebP/BMP local;
- reduce el análisis a 360 px de ancho para ahorrar CPU/RAM;
- detecta secciones horizontales por cambios de color/energía;
- estima 1, 2 o 3 columnas por sección;
- extrae colores promedio;
- detecta fondos oscuros;
- genera HTML semántico básico;
- genera CSS responsive;
- permite editar el código dentro del panel;
- guarda `index.html` y `styles.css` en una carpeta elegida por el usuario.

## Limitación v0.1

No realiza OCR pesado ni reconstruye textos exactos. Genera placeholders editables.

## Instalación

```powershell
cd C:\Users\nicol\Documents\ddepazos-illustrator-mcp-local
git pull
powershell.exe -ExecutionPolicy Bypass -File .\install-image-to-web.ps1
```

Después reinicia Illustrator 2023:

**Ventana → Extensiones (heredadas) → Pazos Image → Web**

## Rendimiento / privacidad

- análisis reducido;
- sin render continuo;
- debounce de 100 ms;
- `connect-src 'none'`;
- no usa Firefly ni APIs remotas;
- la captura no sale del PC en modo local.

# Pazos Halftone Pro v0.1

Panel CEP local para Illustrator 2023.

## Funciones

- carga de imagen local;
- análisis tonal mediante Canvas;
- densidad de puntos;
- tamaño máximo;
- contraste;
- umbral;
- rotación de trama;
- círculo, cuadrado o rombo;
- invertir;
- eliminar blancos;
- hasta 2200 elementos por generación para mantener estabilidad.

## Salida

Illustrator crea un grupo llamado:

```text
Pazos Halftone
```

Cada punto es un vector editable.

## Instalar

```powershell
cd C:\Users\nicol\Documents\ddepazos-illustrator-mcp-local
git pull
powershell.exe -ExecutionPolicy Bypass -File .\install-halftone-pro.ps1
```

Luego reinicia Illustrator 2023:

**Ventana → Extensiones (heredadas) → Pazos Halftone Pro**

## Offline

El panel procesa la imagen con FileReader + Canvas y su CSP contiene `connect-src 'none'`.

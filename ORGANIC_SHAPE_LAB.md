# Pazos Organic Shape Lab v0.1

Panel CEP local para Illustrator 2023.

## Funciones

### Generar
Crea formas Bézier orgánicas nuevas a partir de:

- seed reproducible;
- número de puntos;
- lóbulos;
- irregularidad;
- ruido radial;
- suavidad;
- inflate/contract;
- rotación;
- simetría libre, bilateral, radial 4/6/8;
- 1, 3, 6 o 9 variaciones.

### Deformar selección
Lee el primer PathItem de la selección y crea una reinterpretación procedural manteniendo su estructura general.

## Salida

Illustrator crea:

```text
Pazos Organic Shape Lab
├── Forma 1
├── Forma 2
└── ...
```

Cada forma conserva anclas y manejadores Bézier editables.

## Instalar

```powershell
cd C:\Users\nicol\Documents\ddepazos-illustrator-mcp-local
git pull
powershell.exe -ExecutionPolicy Bypass -File .\install-organic-shape-lab.ps1
```

Luego reinicia Illustrator 2023 y abre:

**Ventana → Extensiones (heredadas) → Pazos Organic Shape Lab**

## Offline

El panel usa solo HTML/CSS/JS + ExtendScript local y su CSP contiene `connect-src 'none'`.

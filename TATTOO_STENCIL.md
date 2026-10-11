# Pazos Tattoo Stencil v0.1

Panel CEP local para Illustrator 2023.

## Modos

- **Líneas**: extracción de bordes mediante operador Sobel.
- **Líneas + puntos**: combina contorno y zonas oscuras con puntillismo.
- **Puntillismo**: interpreta sombras como puntos de tamaño variable.

## Controles

- Contraste.
- Sensibilidad del borde.
- Densidad de muestreo.
- Grosor y longitud de línea.
- Umbral de sombras.
- Tamaño máximo del punto.
- Invertir.
- Simplificar.

## Salida

Illustrator crea un grupo:

```text
Pazos Tattoo Stencil
├── Lineas
└── Puntillismo
```

Cada línea es un PathItem editable y cada punto es un círculo vectorial editable.

## Instalar

```powershell
cd C:\Users\nicol\Documents\ddepazos-illustrator-mcp-local
git pull
powershell.exe -ExecutionPolicy Bypass -File .\install-tattoo-stencil.ps1
```

Luego reinicia Illustrator 2023 y abre:

**Ventana → Extensiones (heredadas) → Pazos Tattoo Stencil**

## Privacidad

El panel usa FileReader y Canvas localmente y su CSP contiene `connect-src 'none'`.
No utiliza Firefly, APIs remotas de Adobe ni servidor HTTP propio.

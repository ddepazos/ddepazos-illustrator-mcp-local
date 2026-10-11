# Prueba rápida — Illustrator 2023

Usa esta prueba antes de trabajar con diseños reales.

## 1. Actualizar el repositorio

```powershell
cd C:\Users\nicol\Documents\ddepazos-illustrator-mcp-local
git pull
powershell.exe -ExecutionPolicy Bypass -File .\install-panel.ps1
```

Cierra Illustrator 2023 completamente y vuelve a abrirlo.

## 2. Abrir vector de prueba

Abre:

```text
examples\test-vector.svg
```

Illustrator debe abrir una forma cerrada con curvas Bézier.

## 3. Abrir el panel

Ve a:

```text
Ventana → Extensiones (heredadas) → Vector 3D Local
```

## 4. Seleccionar el vector

Selecciona la forma completa con la herramienta Selección (V).

## 5. Leer geometría

Pulsa:

```text
Leer vector seleccionado
```

El estado debe cambiar de:

```text
Sin geometría
```

a algo parecido a:

```text
Vector: 1 path(s)
```

## 6. Parámetros recomendados de prueba

```text
Modo: 3D
Extrude: 90
Bevel: 8
Rotate X: 20
Rotate Y: -30
Rotate Z: 0
Twist: 0
Bend: 0
Inflate: 0
Taper: 0
Perspective: 900
Zoom: 100%
Wireframe: desactivado
Conservar original: activado
```

## 7. Probar viewport

- Arrastra dentro del viewport para cambiar X/Y.
- Usa la rueda del mouse para zoom.
- Activa Wireframe para verificar la estructura.

## 8. Aplicar

Pulsa:

```text
Aplicar a Illustrator
```

Resultado esperado:

- El original permanece.
- Se crea un grupo nuevo.
- El grupo contiene cara frontal, cara posterior y caras laterales proyectadas.
- Todo sigue siendo vectorial y editable.

## 9. Si falla

Anota el texto exacto que aparece en la barra de estado del panel.

Los fallos más útiles para diagnosticar son:

- `CEP no disponible`
- `ERROR: selecciona un vector`
- `ERROR: la selección no contiene paths`
- `ERROR: ...`

## 10. Importante

La versión 0.2 usa una malla/proyección interna para previsualización. Illustrator recibe vectores 2D proyectados, no una malla 3D nativa.

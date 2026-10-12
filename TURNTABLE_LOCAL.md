# Pazos Turntable Local v0.1

Panel CEP para Illustrator 2023 inspirado en el flujo Turntable.

## Local
- giro horizontal -180° a +180°;
- tilt -30° a +30°;
- auto depth por orden de apilado;
- insertar una vista vectorial;
- colocar 4–16 vistas;
- preview simplificado.

No inventa zonas ocultas como Firefly. La salida es una proyección 2.5D de las partes existentes.

## GitHub
**Preparar GitHub Job** exporta `source.svg` + `turntable-job.json`.
Nada se sube automáticamente. Si decides subir esos archivos a `turntable-jobs/<nombre>/`, el workflow **Turntable Render** genera la secuencia de SVG como artifact.

## Instalación
```powershell
cd C:\Users\nicol\Documents\ddepazos-illustrator-mcp-local
git pull
powershell.exe -ExecutionPolicy Bypass -File .\install-turntable-local.ps1
```

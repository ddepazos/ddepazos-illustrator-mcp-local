# Pazos Tools Manager 0.8.0

Panel CEP para Illustrator 2023 que hace visible el estado de GitHub dentro de Illustrator.

## Funciones

- muestra versión local;
- consulta la versión pública en GitHub solo al pulsar el botón;
- muestra el último estado de **Package Pazos Vector Tools**;
- muestra el último estado de **Validate NFT Contract**;
- detecta qué paneles CEP están instalados;
- abre el repositorio y GitHub Actions;
- puede ejecutar `git pull --ff-only` y `install-all-panels.ps1` desde Illustrator.

## Rendimiento

No hay polling ni consultas periódicas. El panel permanece local hasta pulsar **Buscar actualizaciones**.

## Privacidad

El Manager solo consulta:
- `suite-version.json`;
- la API pública de GitHub Actions del repositorio.

No sube:
- archivos AI;
- SVG de trabajo;
- PNG/JPG;
- documentos;
- ilustraciones.

## Actualizar desde Illustrator

El botón **Actualizar plugins** busca el repositorio en:

`Documents\ddepazos-illustrator-mcp-local`

y ejecuta el instalador general. Guarda tu trabajo antes de usarlo y reinicia Illustrator al terminar.

## Instalación

```powershell
cd C:\Users\nicol\Documents\ddepazos-illustrator-mcp-local
git pull
powershell.exe -ExecutionPolicy Bypass -File .\install-tools-manager.ps1
```

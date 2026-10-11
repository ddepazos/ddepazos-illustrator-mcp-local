# Pazos Pattern Lab v0.1

Panel CEP ligero para Illustrator 2023.

## Patrones

- radial;
- grid;
- espiral;
- onda.

## Controles

- hasta 120 copias finales;
- preview limitado a 80 siluetas;
- radio/distancia;
- rotación por copia;
- escala progresiva;
- separación X/Y;
- amplitud y frecuencia;
- orientar copias;
- conservar original.

## Rendimiento

El panel no usa requestAnimationFrame ni render continuo. El preview se actualiza con un debounce de 55 ms y usa rectángulos simples en vez de duplicar el vector real.

Illustrator solo crea las copias reales al pulsar **Crear patrón**.

## Instalar

```powershell
cd C:\Users\nicol\Documents\ddepazos-illustrator-mcp-local
git pull
powershell.exe -ExecutionPolicy Bypass -File .\install-pattern-lab.ps1
```

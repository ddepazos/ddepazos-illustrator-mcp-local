$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $MyInvocation.MyCommand.Path
$source = Join-Path $repo "halftone-pro"
$dest = Join-Path $env:APPDATA "Adobe\CEP\extensions\com.ddepazos.halftonepro"

if (!(Test-Path $source)) { throw "No se encontró halftone-pro. Ejecuta git pull." }

New-Item -ItemType Directory -Force $dest | Out-Null
Copy-Item (Join-Path $source "*") $dest -Recurse -Force

New-Item -Path "HKCU:\Software\Adobe\CSXS.11" -Force | Out-Null
New-ItemProperty -Path "HKCU:\Software\Adobe\CSXS.11" -Name "PlayerDebugMode" -Value "1" -PropertyType String -Force | Out-Null

Write-Host ""
Write-Host "Pazos Halftone Pro v0.1 instalado."
Write-Host "Ruta: $dest"
Write-Host ""
Write-Host "Cierra Illustrator 2023 por completo y vuelve a abrirlo."
Write-Host "Ventana > Extensiones (heredadas) > Pazos Halftone Pro"

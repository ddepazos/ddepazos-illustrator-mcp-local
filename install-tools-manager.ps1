$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $MyInvocation.MyCommand.Path
$source = Join-Path $repo "tools-manager"
$dest = Join-Path $env:APPDATA "Adobe\CEP\extensions\com.ddepazos.toolsmanager"

if (!(Test-Path $source)) { throw "No se encontró tools-manager. Ejecuta git pull." }

New-Item -ItemType Directory -Force $dest | Out-Null
Copy-Item (Join-Path $source "*") $dest -Recurse -Force

New-Item -Path "HKCU:\Software\Adobe\CSXS.11" -Force | Out-Null
New-ItemProperty -Path "HKCU:\Software\Adobe\CSXS.11" -Name "PlayerDebugMode" -Value "1" -PropertyType String -Force | Out-Null

Write-Host ""
Write-Host "Pazos Tools Manager 0.8.0 instalado."
Write-Host "Cierra Illustrator 2023 y vuelve a abrirlo."
Write-Host "Ventana > Extensiones (heredadas) > Pazos Tools Manager"

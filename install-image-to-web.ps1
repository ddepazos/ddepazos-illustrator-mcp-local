$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $MyInvocation.MyCommand.Path
$source = Join-Path $repo "image-to-web"
$dest = Join-Path $env:APPDATA "Adobe\CEP\extensions\com.ddepazos.imagetoweb"

if (!(Test-Path $source)) { throw "No se encontró image-to-web. Ejecuta git pull." }

New-Item -ItemType Directory -Force $dest | Out-Null
Copy-Item (Join-Path $source "*") $dest -Recurse -Force

New-Item -Path "HKCU:\Software\Adobe\CSXS.11" -Force | Out-Null
New-ItemProperty -Path "HKCU:\Software\Adobe\CSXS.11" -Name "PlayerDebugMode" -Value "1" -PropertyType String -Force | Out-Null

Write-Host ""
Write-Host "Pazos Image -> Web v0.1 instalado."
Write-Host "Cierra Illustrator 2023 y vuelve a abrirlo."
Write-Host "Ventana > Extensiones (heredadas) > Pazos Image -> Web"

$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $MyInvocation.MyCommand.Path
$source = Join-Path $repo "cep-plugin"
$dest = Join-Path $env:APPDATA "Adobe\CEP\extensions\com.ddepazos.vector3dlocal"

if (!(Test-Path $source)) { throw "No se encontró la carpeta cep-plugin. Ejecuta git pull y vuelve a intentar." }

New-Item -ItemType Directory -Force $dest | Out-Null
Copy-Item (Join-Path $source "*") $dest -Recurse -Force

New-Item -Path "HKCU:\Software\Adobe\CSXS.11" -Force | Out-Null
New-ItemProperty -Path "HKCU:\Software\Adobe\CSXS.11" -Name "PlayerDebugMode" -Value "1" -PropertyType String -Force | Out-Null

Write-Host ""
Write-Host "Vector 3D Local v0.2 instalado."
Write-Host "Ruta: $dest"
Write-Host ""
Write-Host "Cierra Illustrator 2023 por completo y vuelve a abrirlo."
Write-Host "Luego busca: Ventana > Extensiones (heredadas) > Vector 3D Local"

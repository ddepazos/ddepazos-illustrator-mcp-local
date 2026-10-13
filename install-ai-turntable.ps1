$ErrorActionPreference = "Stop"

$repo = Split-Path -Parent $MyInvocation.MyCommand.Path
$source = Join-Path $repo "ai-turntable-bridge"

# Real panel files live on Desktop. Adobe CEP only sees a junction in AppData.
$desktopRoot = [Environment]::GetFolderPath("Desktop")
$desktopPanel = Join-Path $desktopRoot "Pazos_AI_Turntable_App"
$cepRoot = Join-Path $env:APPDATA "Adobe\CEP\extensions"
$dest = Join-Path $cepRoot "com.ddepazos.aiturntable"

if (!(Test-Path $source)) {
    throw "No se encontró ai-turntable-bridge. Ejecuta git pull."
}

# Refresh the real Desktop copy.
if (Test-Path $desktopPanel) {
    Remove-Item $desktopPanel -Recurse -Force
}
New-Item -ItemType Directory -Force $desktopPanel | Out-Null
Copy-Item (Join-Path $source "*") $desktopPanel -Recurse -Force

# CEP discovery path stays in AppData, but contains only a junction.
New-Item -ItemType Directory -Force $cepRoot | Out-Null
if (Test-Path $dest) {
    Remove-Item $dest -Recurse -Force
}
New-Item -ItemType Junction -Path $dest -Target $desktopPanel | Out-Null

# Enable unsigned CEP extensions for Illustrator 2023 / CSXS 11.
New-Item -Path "HKCU:\Software\Adobe\CSXS.11" -Force | Out-Null
New-ItemProperty -Path "HKCU:\Software\Adobe\CSXS.11" -Name "PlayerDebugMode" -Value "1" -PropertyType String -Force | Out-Null

Write-Host ""
Write-Host "Pazos AI Turntable instalado."
Write-Host "Archivos reales:"
Write-Host "  $desktopPanel"
Write-Host ""
Write-Host "Adobe CEP apunta mediante junction a:"
Write-Host "  $dest"
Write-Host ""
Write-Host "Cierra Illustrator 2023 y vuelve a abrirlo."
Write-Host "Ventana > Extensiones (heredadas) > Pazos AI Turntable"

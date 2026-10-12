$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $MyInvocation.MyCommand.Path

$extensions = @(
  @{ Source = "cep-plugin";        Dest = "com.ddepazos.vector3dlocal";   Name = "Vector 3D Local" },
  @{ Source = "halftone-pro";      Dest = "com.ddepazos.halftonepro";     Name = "Pazos Halftone Pro" },
  @{ Source = "tattoo-stencil";    Dest = "com.ddepazos.tattoostencil";   Name = "Pazos Tattoo Stencil" },
  @{ Source = "organic-shape-lab"; Dest = "com.ddepazos.organicshapelab"; Name = "Pazos Organic Shape Lab" },
  @{ Source = "pattern-lab";       Dest = "com.ddepazos.patternlab";       Name = "Pazos Pattern Lab" },
  @{ Source = "image-to-web";       Dest = "com.ddepazos.imagetoweb";       Name = "Pazos Image -> Web" },
  @{ Source = "nft-publisher";      Dest = "com.ddepazos.nftpublisher";      Name = "Pazos NFT Publisher" },
  @{ Source = "tools-manager";      Dest = "com.ddepazos.toolsmanager";      Name = "Pazos Tools Manager" },
  @{ Source = "turntable-local";    Dest = "com.ddepazos.turntablelocal";    Name = "Pazos Turntable Local" }
)

$base = Join-Path $env:APPDATA "Adobe\CEP\extensions"
New-Item -ItemType Directory -Force $base | Out-Null

foreach ($ext in $extensions) {
  $source = Join-Path $repo $ext.Source
  if (!(Test-Path $source)) {
    throw "Falta la carpeta $($ext.Source). Ejecuta git pull y vuelve a intentar."
  }

  $dest = Join-Path $base $ext.Dest
  New-Item -ItemType Directory -Force $dest | Out-Null
  Copy-Item (Join-Path $source "*") $dest -Recurse -Force
  Write-Host "Instalado: $($ext.Name)"
}

New-Item -Path "HKCU:\Software\Adobe\CSXS.11" -Force | Out-Null
New-ItemProperty -Path "HKCU:\Software\Adobe\CSXS.11" -Name "PlayerDebugMode" -Value "1" -PropertyType String -Force | Out-Null

Write-Host ""
Write-Host "Pazos Vector Tools instalado."
Write-Host "Cierra Illustrator 2023 completamente y vuelve a abrirlo."
Write-Host ""
Write-Host "Busca los paneles en:"
Write-Host "Ventana > Extensiones (heredadas)"

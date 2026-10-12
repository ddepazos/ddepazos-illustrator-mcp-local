@echo off
setlocal
title Instalar Pazos Vector Tools
echo.
echo Pazos Vector Tools - Instalacion para Illustrator 2023
echo Guarda tu trabajo y cierra Illustrator antes de continuar.
echo.
pause
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-all-panels.ps1"
if errorlevel 1 (
  echo.
  echo No se pudo completar la instalacion. Revisa el mensaje anterior.
  pause
  exit /b 1
)
echo.
echo Listo. Abre Illustrator y entra en Ventana - Extensiones heredadas.
pause

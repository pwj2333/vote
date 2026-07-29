@echo off
setlocal
cd /d "%~dp0"

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy-local.ps1"
if errorlevel 1 (
  echo.
  echo Local test failed. Review the message above.
  pause
  exit /b 1
)

echo.
pause

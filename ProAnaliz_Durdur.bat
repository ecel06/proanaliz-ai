@echo off
title ProAnaliz AI - Sunuculari Durdur
cd /d "%~dp0"

echo ===================================================
echo     PROANALIZ AI - SUNUCULARI DURDUR
echo ===================================================
echo.

echo [1/2] Port 5173 (Frontend Vite) kapaniyor...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr /R /C:":5173 .*LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo [2/2] Port 3001 (Backend API) kapaniyor...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr /R /C:":3001 .*LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo.
echo ✅ Tum ProAnaliz AI sunuculari basariyla durduruldu.
timeout /t 3 >nul
exit /b 0


@echo off
setlocal enabledelayedexpansion
title ProAnaliz AI - Masaustu Baslatici

cd /d "%~dp0"
set "APP_DIR=%~dp0"
if "%APP_DIR:~-1%"=="\" set "APP_DIR=%APP_DIR:~0,-1%"

:: 0. Node binary tespiti
set "NODE_BIN=node"
if exist "C:\Program Files\nodejs\node.exe" (
    set "NODE_BIN=C:\Program Files\nodejs\node.exe"
)

:: 1. Backend & Statik Sunucu (Port 3001) Kontrol ve Sessiz Baslatma
netstat -ano | findstr /R /C:":3001 .*LISTENING" >nul 2>&1
if errorlevel 1 (
    start "" /b "!NODE_BIN!" "%APP_DIR%\server\server.js" >nul 2>&1
    
    :: Sunucunun hazir olmasini bekle (maksimum 8 saniye)
    set /a attempts=0
    :WAIT_SERVER
    timeout /t 1 /nobreak >nul 2>&1
    netstat -ano | findstr /R /C:":3001 .*LISTENING" >nul 2>&1
    if errorlevel 1 (
        set /a attempts+=1
        if !attempts! leq 8 goto WAIT_SERVER
    )
)

:: 2. Hedef URL Belirleme (Vite dev sunucusu calisiyorsa 5173, degilse port 3001)
set "TARGET_URL=http://localhost:3001"
netstat -ano | findstr /R /C:":5173 .*LISTENING" >nul 2>&1
if not errorlevel 1 (
    set "TARGET_URL=http://localhost:5173"
)

:: 3. Tarayiciyi Bagimsiz Masaustu Uygulama Modunda Ac
set BROWSER_EXE=
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    set "BROWSER_EXE=C:\Program Files\Google\Chrome\Application\chrome.exe"
) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    set "BROWSER_EXE=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
) else if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
    set "BROWSER_EXE=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
) else if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    set "BROWSER_EXE=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
) else if exist "C:\Program Files\Microsoft\Edge\Application\msedge.exe" (
    set "BROWSER_EXE=C:\Program Files\Microsoft\Edge\Application\msedge.exe"
)

if defined BROWSER_EXE (
    start "" "!BROWSER_EXE!" --app="!TARGET_URL!" --window-size=1366,860
) else (
    start "" "!TARGET_URL!"
)

exit /b 0

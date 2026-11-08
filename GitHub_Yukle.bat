@echo off
title ProAnaliz AI - GitHub'a Kodlari Gonder

:: Proje dizinine gec
cd /d "C:\Users\BCM\.gemini\antigravity-ide\brain\94cb2a23-73ac-4d20-84e2-7a8667d1a4ff"

echo ===================================================
echo      PROANALIZ AI - GITHUB YUKLEME
echo ===================================================
echo.
echo Proje Dizini: %CD%
echo Kodlar GitHub reponuza gonderiliyor...
echo (Eger tarayici acilirsa 'Sign in with your browser' butonuna tiklayin)
echo.

git push -u origin main

echo.
if %errorlevel% equ 0 (
    echo ===================================================
    echo  TEBRIKLER! Kodlar basariyla GitHub'a yuklendi.
    echo ===================================================
) else (
    echo [!] Bir hata olustu veya giris onaylanmadi.
)
echo.
pause

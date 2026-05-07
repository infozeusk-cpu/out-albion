@echo off
title Albion Event Bot - Kurulum
color 0B
echo.
echo  ╔═══════════════════════════════════════╗
echo  ║         ALBION EVENT BOT KURULUM      ║
echo  ╚═══════════════════════════════════════╝
echo.

cd /d "%~dp0"

echo [1/3] Node.js kontrol ediliyor...
node -v >nul 2>&1
if errorlevel 1 (
    echo [HATA] Node.js bulunamadı! https://nodejs.org adresinden indirin.
    pause
    exit
)
echo [OK] Node.js bulundu.

echo.
echo [2/3] npm paketleri yükleniyor...
npm install
if errorlevel 1 (
    echo [HATA] npm install başarısız!
    pause
    exit
)
echo [OK] Paketler yüklendi.

echo.
echo [3/3] config.json kontrol ediliyor...
if not exist "config.json" (
    echo config.json oluşturuluyor...
    copy config.example.json config.json
)
echo.
echo ════════════════════════════════════════
echo  Kurulum tamamlandı!
echo  config.json dosyasını düzenleyin:
echo  - BOT TOKEN girin
echo  - GUILD ID girin
echo  - CHANNEL ID girin
echo  Sonra start.bat çalıştırın.
echo ════════════════════════════════════════
echo.
pause

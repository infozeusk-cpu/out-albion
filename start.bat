@echo off
title Albion Event Bot
color 0A
echo.
echo  ╔═══════════════════════════════════════╗
echo  ║       ALBION ONLINE EVENT BOT         ║
echo  ║         by Discord Event System       ║
echo  ╚═══════════════════════════════════════╝
echo.

cd /d "%~dp0"

if not exist "node_modules" (
    echo [!] node_modules bulunamadı. install.bat çalıştırın!
    pause
    exit
)

if not exist "config.json" (
    echo [!] config.json bulunamadı!
    pause
    exit
)

echo [*] Bot başlatılıyor...
echo [*] Web panel: http://localhost:3000
echo [*] Durdurmak için CTRL+C
echo.
node src/index.js
pause

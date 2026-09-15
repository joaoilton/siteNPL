@echo off
title Site Posto Neopolis - servidor local
cd /d "%~dp0"

echo.
echo  ===========================================
echo   SITE POSTO NEOPOLIS
echo  ===========================================
echo.
echo   Endereco: http://localhost:8080
echo.
echo   O navegador vai abrir sozinho em instantes.
echo   MANTENHA ESTA JANELA ABERTA enquanto usa o site.
echo   Para encerrar: feche esta janela ou aperte Ctrl+C.
echo.
echo  ===========================================
echo.

start "" http://localhost:8080
node serve.js

echo.
echo  O servidor foi encerrado.
pause

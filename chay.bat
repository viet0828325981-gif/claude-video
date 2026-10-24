@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Xuong Video Bai Giang
if not exist "node_modules\@anthropic-ai\claude-code" (echo Chua cai dat. Chay cai-dat.bat truoc. & pause & exit /b 1)
start "" http://localhost:8790
echo Dang chay tai http://localhost:8790  (dong cua so nay de tat)
node server.mjs
pause

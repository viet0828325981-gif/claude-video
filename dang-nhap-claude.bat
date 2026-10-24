@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Dang nhap Claude Code bang tai khoan Claude cua ban (trinh duyet se mo ra).
"node_modules\@anthropic-ai\claude-code\bin\claude.exe" auth login
echo.
"node_modules\@anthropic-ai\claude-code\bin\claude.exe" auth status
pause

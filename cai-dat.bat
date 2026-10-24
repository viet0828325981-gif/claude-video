@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo === Cai dat Xuong Video Bai Giang (ban local) ===

where node >nul 2>nul || (echo [LOI] Chua co Node.js. Cai tu https://nodejs.org roi chay lai. & pause & exit /b 1)

echo.
echo [1/2] Cai Claude Code CLI vao thu muc nay...
call npm install --cache "%~dp0.cache\npm" --no-audit --no-fund || (echo [LOI] npm install that bai. & pause & exit /b 1)

echo.
echo [2/2] Tao moi truong Python cho giong doc VieNeu...
set "PIP_CACHE_DIR=%~dp0.cache\pip"
if not exist ".venv\Scripts\python.exe" (
  py -3.14 -m venv .venv 2>nul || py -3 -m venv .venv 2>nul || python -m venv .venv || (echo [LOI] Khong tao duoc venv. Cai Python 3.12+ tu python.org. & pause & exit /b 1)
)
".venv\Scripts\python.exe" -m pip install -q --upgrade pip
".venv\Scripts\python.exe" -m pip install -q --no-deps vieneu
".venv\Scripts\python.exe" -m pip install -q onnxruntime "sea-g2p>=0.9.1" numpy soundfile soxr "kaldi-native-fbank>=1.20" "tokenizers>=0.20" huggingface_hub PyYAML || (echo [LOI] Cai thu vien Python that bai. & pause & exit /b 1)

echo.
echo Xong. Neu chua dang nhap Claude, chay dang-nhap-claude.bat. Sau do chay chay.bat.
pause

@echo off
setlocal
set "CODE_EXE=C:\Program Files\Microsoft VS Code\Code.exe"
if not exist "%CODE_EXE%" set "CODE_EXE=%LOCALAPPDATA%\Programs\Microsoft VS Code\Code.exe"
if not exist "%CODE_EXE%" (
  echo Could not find VS Code's Code.exe. Install Node.js 20.19+ and run: npm install ^&^& npm run dev
  exit /b 1
)
set ELECTRON_RUN_AS_NODE=1
"%CODE_EXE%" "%~dp0dev.mjs" %*
exit /b %ERRORLEVEL%

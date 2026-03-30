@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 포트 3001 로 개발 서버를 띄웁니다.
echo 브라우저: http://127.0.0.1:3001/
echo.
if not exist "node_modules\" call npm install
call npm run dev:3001
pause

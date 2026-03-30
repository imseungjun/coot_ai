@echo off
chcp 65001 >nul
REM 서버(run-dev.bat 또는 npm run dev)가 켜져 있을 때만 페이지가 뜹니다.
start "" "http://localhost:3000/"
exit /b 0

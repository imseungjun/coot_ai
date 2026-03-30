@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo [COOT] 로컬 응답 포트 확인 후 AI 바로가기(/)를 엽니다 (3000 → 3001 → 3010)...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\open-local-url.ps1" -Path "/"
if errorlevel 1 pause

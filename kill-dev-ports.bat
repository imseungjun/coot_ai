@echo off
chcp 65001 >nul
echo ========================================
echo   COOT Ai - 개발용 포트 정리
echo ========================================
echo 3000, 3001, 3010 번에서 LISTEN 중인 프로세스를 종료합니다.
echo (여러 Next 서버를 동시에 띄우면 .next 캐시가 꼬일 수 있습니다.)
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\kill-dev-ports-once.ps1"
echo.
echo 완료. 이제 run-dev-clean.bat 또는 run-dev.bat 를 실행하세요.
pause

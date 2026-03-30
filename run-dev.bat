@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ========================================
echo   COOT Ai - 개발 서버
echo ========================================
echo.
echo [안내] 브라우저는 서버가 준비되면 AI 바로가기(/)가 자동으로 열립니다.
echo        안 열리면 서버가 Ready 된 뒤 open-home.bat 더블클릭 또는 주소 직접 입력.
echo        스타일 깨짐·무한 로딩 시: run-dev-clean.bat (포트 정리 + .next 삭제)
echo        EADDRINUSE 시 3001번으로 자동 전환합니다.
echo        수동 종료: kill-port-3000.bat  /  여러 포트: kill-dev-ports.bat
echo.

if not exist "node_modules\" (
  echo [1/2] npm install 실행 중...
  call npm install
  if errorlevel 1 (
    echo npm install 실패
    pause
    exit /b 1
  )
)

echo [2/2] 서버 시작 중...
echo.

netstat -ano 2>nul | findstr ":3000" | findstr "LISTENING" >nul 2>&1
if %errorlevel%==0 (
  echo [자동] 포트 3000 사용 중 → 3001 로 띄웁니다.
  echo        주소: http://127.0.0.1:3001/
  echo.
  call npm run dev:open:3001
) else (
  echo        주소: http://127.0.0.1:3000/
  echo.
  call npm run dev:open
)

echo.
echo 서버가 종료되었습니다.
pause

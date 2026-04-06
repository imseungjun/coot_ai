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
echo        표준 주소: http://localhost:3000/  (3000 사용 중이면 종료 후 다시 실행)
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
  echo [오류] 포트 3000이 이미 사용 중입니다.
  echo        run-dev-clean.bat 로 정리하거나 kill-port-3000.bat 로 종료한 뒤 다시 실행하세요.
  echo        이 프로젝트는 http://localhost:3000 만 개발 기준으로 사용합니다.
  pause
  exit /b 1
)
echo        주소: http://localhost:3000/
echo.
call npm run dev

echo.
echo 서버가 종료되었습니다.
pause

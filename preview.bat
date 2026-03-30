@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ========================================
echo   COOT Ai - 배포 미리보기 (빌드 + 실행)
echo ========================================
echo.

if not exist "node_modules\" (
  call npm install
  if errorlevel 1 (
    echo npm install 실패
    pause
    exit /b 1
  )
)

echo [1/2] next build ...
call npm run build
if errorlevel 1 (
  echo 빌드 실패
  pause
  exit /b 1
)

echo [2/2] 서버 시작 — 준비되면 브라우저가 AI 바로가기(/) 로 열립니다...
echo   http://127.0.0.1:3000/
echo 종료: Ctrl+C
echo ========================================

REM 현재 폴더가 프로젝트 루트인 상태에서 대기 스크립트 실행 (별도 창)
start "COOT-wait-open" cmd /c "node scripts\wait-and-open.mjs --port=3000 --path=/"

call npm run start
pause

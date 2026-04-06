@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ========================================
echo   COOT Ai - 캐시 초기화 후 개발 서버 1대만 실행
echo ========================================
echo.
echo [안내] 스타일이 안 붙거나 로딩만 도는 경우 이 배치를 사용하세요.
echo        브라우저가 자동으로 안 열리면: open-home.bat 또는 주소창에 직접 입력.
echo        브라우저: http://localhost:3000/
echo.

if not exist "node_modules\" (
  echo [준비] npm install ...
  call npm install
  if errorlevel 1 (
    echo npm install 실패
    pause
    exit /b 1
  )
)

echo [1/3] 포트 3000·3001·3010 정리 (기존 Next 프로세스 종료)...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ports = 3000,3001,3010; foreach ($port in $ports) { ^
    $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue; ^
    if (-not $conns) { continue }; ^
    $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique; ^
    foreach ($procId in $pids) { ^
      try { Write-Host ('  포트 ' + $port + ' PID ' + $procId + ' 종료'); Stop-Process -Id $procId -Force -ErrorAction Stop } catch { } ^
    } ^
  }"

echo [2/3] .next 폴더 삭제 (webpack/Tailwind 캐시 초기화)...
if exist ".next\" (
  rmdir /s /q ".next"
  echo       삭제 완료.
) else (
  echo       .next 없음 — 건너뜀.
)

echo [3/3] 개발 서버 시작 — 준비되면 AI 바로가기(/)가 열립니다...
echo.
call npm run dev

echo.
echo 서버가 종료되었습니다.
pause

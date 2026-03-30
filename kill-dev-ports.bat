@echo off
chcp 65001 >nul
echo ========================================
echo   COOT Ai - 개발용 포트 정리
echo ========================================
echo 3000, 3001, 3010 번에서 LISTEN 중인 프로세스를 종료합니다.
echo (여러 Next 서버를 동시에 띄우면 .next 캐시가 꼬일 수 있습니다.)
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ports = 3000,3001,3010; foreach ($port in $ports) { ^
    $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue; ^
    if (-not $conns) { continue }; ^
    $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique; ^
    foreach ($procId in $pids) { ^
      try { Write-Host ('포트 ' + $port + ' PID ' + $procId + ' 종료'); Stop-Process -Id $procId -Force -ErrorAction Stop } catch { } ^
    } ^
  }"
echo.
echo 완료. 이제 run-dev-clean.bat 또는 run-dev.bat 를 실행하세요.
pause

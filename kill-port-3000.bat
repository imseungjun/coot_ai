@echo off
chcp 65001 >nul
echo 포트 3000을 사용 중인 프로세스를 종료합니다...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$p = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue ^| Select-Object -ExpandProperty OwningProcess -Unique; ^
   if (-not $p) { Write-Host '3000번 포트를 쓰는 LISTEN 프로세스가 없습니다.'; exit 0 }; ^
   $p ^| ForEach-Object { Write-Host ('PID ' + $_ + ' 종료'); Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }"
echo.
echo 완료. 이제 run-dev.bat 또는 npm run dev 를 실행하세요.
pause

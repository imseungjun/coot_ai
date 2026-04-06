$ports = 3000, 3001, 3010
foreach ($port in $ports) {
  $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  if (-not $conns) { continue }
  $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
  foreach ($procId in $pids) {
    try {
      Write-Host ("port $($port) PID $($procId) 종료")
      Stop-Process -Id $procId -Force -ErrorAction Stop
    } catch { }
  }
}

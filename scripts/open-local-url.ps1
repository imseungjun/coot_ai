param(
  [string]$Path = "/",
  [int[]]$Ports = @(3000, 3001, 3010)
)

$ErrorActionPreference = "SilentlyContinue"
if (-not $Path.StartsWith("/")) { $Path = "/" + $Path }

foreach ($port in $Ports) {
  $client = $null
  try {
    $client = New-Object System.Net.Sockets.TcpClient
    $iar = $client.BeginConnect("127.0.0.1", $port, $null, $null)
    $ok = $iar.AsyncWaitHandle.WaitOne(600, $false)
    if ($ok -and $client.Connected) {
      $uri = "http://localhost:${port}${Path}"
      Write-Host "Opening $uri"
      Start-Process $uri
      exit 0
    }
  }
  catch { }
  finally {
    if ($client) { try { $client.Close() } catch { } }
  }
}

$fallback = "http://localhost:3000${Path}"
Write-Host "No TCP listener on ports $($Ports -join ', '). Opening fallback: $fallback"
Start-Process $fallback

# ═══════════════════════════════════════════════════════════════════════════════
#  Paisa Rakhna — FULL DEV STARTUP SCRIPT
#  Run after PC reboot:  .\start.ps1
#  Starts ALL services: Laravel, Queue Worker, ADB WiFi, Metro Bundler
# ═══════════════════════════════════════════════════════════════════════════════

$ROOT    = "C:\Users\muham\Downloads\Paisa_Rakhna"
$API_DIR = "$ROOT\paisa-rakhna-api"
$ADB     = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
$CONFIG  = "$ROOT\constants\Config.ts"
$PHONE   = "192.168.10.18:5555"

# ── Set JAVA_HOME (needed for Android builds) ──────────────────────────────
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"

# ── Colours ─────────────────────────────────────────────────────────────────
function Green($msg)  { Write-Host "  [OK]  $msg" -ForegroundColor Green  }
function Yellow($msg) { Write-Host "  [..]  $msg" -ForegroundColor Yellow }
function Red($msg)    { Write-Host "  [!!]  $msg" -ForegroundColor Red    }
function Title($msg)  { Write-Host "`n==  $msg  ==" -ForegroundColor Cyan }

Title "PAISA RAKHNA — Starting All Services"

# ── Kill existing PHP servers (prevent duplicates!) ─────────────────────────
Title "Cleaning up old processes"
$phpProcs = Get-CimInstance Win32_Process -Filter "Name='php.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -match 'artisan (serve|queue)' }
if ($phpProcs) {
    $phpProcs | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
    Green "Killed $($phpProcs.Count) old PHP process(es)"
    Start-Sleep -Seconds 1
} else {
    Green "No old PHP servers found"
}

# ── Kill old node/Metro processes on ports 8081/8082 ────────────────────────
$nodeProcs = netstat -ano | Select-String ":(8081|8082).*LISTEN" | ForEach-Object {
    ($_ -split '\s+')[-1]
} | Sort-Object -Unique
foreach ($pid in $nodeProcs) {
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
}
if ($nodeProcs) { Green "Killed old Metro processes on 8081/8082" }

# ── Detect Local IP ─────────────────────────────────────────────────────────
Title "Detecting WiFi IP Address"
$localIp = (Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object { $_.InterfaceAlias -match 'Wi-Fi|Ethernet|LAN' -and $_.IPAddress -notmatch '^(127\.|169\.254)' } |
    Select-Object -First 1).IPAddress

if ($localIp) {
    Green "Your Local IP: $localIp"
    $content = Get-Content $CONFIG -Raw
    $content = $content -replace "const LOCAL_IP = '[^']*'", "const LOCAL_IP = '$localIp'"
    Set-Content $CONFIG $content -NoNewline
    Green "Config.ts updated with IP: $localIp"
} else {
    Red "Could not detect WiFi IP. Update LOCAL_IP in Config.ts manually."
}

# ── 1. Laravel API Server ──────────────────────────────────────────────────
Title "1 / 5  Laravel API Server"
Yellow "Starting on http://0.0.0.0:8000 ..."
Start-Process powershell -ArgumentList "-NoExit", "-Command",
    "cd '$API_DIR'; Write-Host 'Laravel Server — http://localhost:8000' -ForegroundColor Green; php artisan serve --host=0.0.0.0 --port=8000"
Green "Laravel server window opened"

# ── 2. Laravel Queue Worker (for emails, async jobs) ───────────────────────
Title "2 / 5  Laravel Queue Worker"
Yellow "Starting queue worker (tries=3, timeout=60) ..."
Start-Process powershell -ArgumentList "-NoExit", "-Command",
    "cd '$API_DIR'; Write-Host 'Queue Worker Running' -ForegroundColor Green; php artisan queue:work --tries=3 --timeout=60"
Green "Queue worker window opened"

# ── 3. ADB Connect (WiFi + USB) ────────────────────────────────────────────
Title "3 / 5  ADB Connection"
if (Test-Path $ADB) {
    # Try WiFi ADB first
    Yellow "Connecting to phone over WiFi ($PHONE) ..."
    & $ADB connect $PHONE 2>$null
    Start-Sleep -Seconds 2

    $adbDevices = & $ADB devices 2>$null | Select-String "device$"
    if ($adbDevices) {
        Green "Device connected"

        # Set up reverse tunnels on all connected devices
        & $ADB reverse tcp:8000 tcp:8000 2>$null
        & $ADB reverse tcp:8081 tcp:8081 2>$null
        & $ADB reverse tcp:8082 tcp:8082 2>$null
        Green "Reverse tunnels: 8000 (API), 8081 (Metro), 8082 (Dev)"

        # Also try WiFi-specific tunnels
        & $ADB -s $PHONE reverse tcp:8000 tcp:8000 2>$null
        & $ADB -s $PHONE reverse tcp:8081 tcp:8081 2>$null
        & $ADB -s $PHONE reverse tcp:8082 tcp:8082 2>$null
    } else {
        Yellow "No device found — connect USB or check WiFi ADB"
    }
} else {
    Yellow "ADB not found at expected path"
}

# ── 4. Metro Bundler ───────────────────────────────────────────────────────
Title "4 / 5  Metro Bundler (Expo)"
Yellow "Starting Metro on port 8082 ..."
Start-Process powershell -ArgumentList "-NoExit", "-Command",
    "cd '$ROOT'; Write-Host 'Metro Bundler — port 8082' -ForegroundColor Green; npx expo start --dev-client --port 8082"
Green "Metro bundler window opened"

# ── 5. Open Admin Panel ────────────────────────────────────────────────────
Title "5 / 5  Admin Panel"
Start-Process "http://localhost:8000/admin"
Green "Admin panel opened in browser"

# ── Summary ─────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  PAISA RAKHNA — All Services Running!" -ForegroundColor Green
Write-Host ""
Write-Host "  Laravel API:    http://localhost:8000/api" -ForegroundColor White
Write-Host "  Admin Panel:    http://localhost:8000/admin" -ForegroundColor White
Write-Host "  Metro Bundler:  http://localhost:8082" -ForegroundColor White
Write-Host "  Phone ADB:      $PHONE" -ForegroundColor White
if ($localIp) {
    Write-Host "  Phone WiFi:     http://${localIp}:8000/api" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "  JAVA_HOME:      $env:JAVA_HOME" -ForegroundColor Gray
Write-Host ""
Write-Host "  Admin Login:    admin@paisa.pk / Admin@1234" -ForegroundColor Gray
Write-Host ""
Write-Host "  4 windows opened: Laravel | Queue | Metro | Admin" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  Press any key to close this window..." -ForegroundColor DarkGray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

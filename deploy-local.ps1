param(
    [ValidateRange(1, 65535)]
    [int]$Port = 3000,

    [switch]$Check
)

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCommand) {
    throw 'Node.js is not installed or is not available in PATH.'
}

if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
    throw 'npm is not installed or is not available in PATH.'
}

$nodeMajorVersion = [int]((& node --version).TrimStart('v').Split('.')[0])
if ($nodeMajorVersion -lt 16) {
    throw 'Node.js 16 or newer is required.'
}

if (-not (Test-Path 'node_modules')) {
    Write-Host 'Installing dependencies...'
    & npm.cmd ci
    if ($LASTEXITCODE -ne 0) {
        throw 'npm failed to install the dependencies.'
    }
}

$listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if ($listener) {
    throw "Port $Port is already in use. Run .\deploy-local.ps1 -Port 3001 to use another port."
}

$adminPassword = "local-$([Guid]::NewGuid().ToString('N'))"
$env:ADMIN_PASSWORD = $adminPassword
$env:PORT = [string]$Port
$serverProcess = $null

try {
    $serverProcess = Start-Process -FilePath $nodeCommand.Source -ArgumentList 'server.js' -PassThru -NoNewWindow
    $url = "http://localhost:$Port"
    $ready = $false

    # ponytail: ten seconds is enough for this local app; add a health endpoint before supporting slower startup.
    for ($attempt = 0; $attempt -lt 20; $attempt++) {
        Start-Sleep -Milliseconds 500
        if ($serverProcess.HasExited) {
            break
        }

        try {
            $response = Invoke-WebRequest -UseBasicParsing "$url/api/departments" -TimeoutSec 1
            if ($response.StatusCode -eq 200) {
                $ready = $true
                break
            }
        } catch {}
    }

    if (-not $ready) {
        throw 'The local server did not become ready within 10 seconds.'
    }

    if ($Check) {
        Write-Host "Local startup check passed at $url"
        return
    }

    Write-Host ''
    Write-Host "Vote page:   $url"
    Write-Host "Admin panel: $url/admin"
    Write-Host "Admin password: $adminPassword"
    Write-Host 'Press Ctrl+C to stop the local server.'

    try {
        Start-Process $url
    } catch {
        Write-Warning "Could not open a browser automatically. Open $url manually."
    }

    $serverProcess.WaitForExit()
    if ($serverProcess.ExitCode -ne 0) {
        throw "The local server exited with code $($serverProcess.ExitCode)."
    }
} finally {
    if ($serverProcess -and -not $serverProcess.HasExited) {
        Stop-Process -Id $serverProcess.Id -Force
    }
    Remove-Item Env:ADMIN_PASSWORD -ErrorAction SilentlyContinue
    Remove-Item Env:PORT -ErrorAction SilentlyContinue
    $adminPassword = $null
}

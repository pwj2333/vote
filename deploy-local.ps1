param(
    [ValidateRange(1, 65535)]
    [int]$Port = 3000
)

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw 'Docker is not installed or is not available in PATH.'
}

& docker info *> $null
if ($LASTEXITCODE -ne 0) {
    throw 'Docker is not running. Start Docker Desktop and try again.'
}

& docker compose version *> $null
if ($LASTEXITCODE -ne 0) {
    throw 'Docker Compose is not available.'
}

$securePassword = Read-Host 'Enter an admin password (at least 12 characters)' -AsSecureString
$passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
try {
    $adminPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
}

if ($adminPassword.Length -lt 12) {
    throw 'The admin password must contain at least 12 characters.'
}

$env:ADMIN_PASSWORD = $adminPassword
$env:PORT = [string]$Port

try {
    & docker compose up -d --build
    if ($LASTEXITCODE -ne 0) {
        throw 'Docker Compose failed to start the application.'
    }
} finally {
    Remove-Item Env:ADMIN_PASSWORD -ErrorAction SilentlyContinue
    Remove-Item Env:PORT -ErrorAction SilentlyContinue
    $adminPassword = $null
}

# ponytail: one fixed local Compose instance is enough; use Compose project names for multiple instances.
$runningServices = & docker compose ps --status running --services
if ($LASTEXITCODE -ne 0 -or $runningServices -notcontains 'vote') {
    throw 'The vote service was created but is not running. Run docker compose logs for details.'
}

$url = "http://localhost:$Port"
Write-Host "Vote is running at $url"
Write-Host "Admin panel: $url/admin"

try {
    Start-Process $url
} catch {
    Write-Warning "Could not open a browser automatically. Open $url manually."
}

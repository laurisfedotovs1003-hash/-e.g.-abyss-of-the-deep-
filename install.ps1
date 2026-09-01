# Single-command PowerShell Installer for JARVIS
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host "-------------------------------------------" -ForegroundColor Cyan
Write-Host "⚡ Installiere JARVIS AI Desktop Assistant (Windows)..." -ForegroundColor Cyan
Write-Host "-------------------------------------------" -ForegroundColor Cyan

if (-not (Test-Path "pyproject.toml")) {
    Write-Host "`n❌ FEHLER: pyproject.toml nicht gefunden!" -ForegroundColor Red
    Write-Host "Bitte führen Sie das Skript aus dem JARVIS-Projektordner aus.`n" -ForegroundColor Red
    Read-Host "Drücken Sie Eingabe zum Beenden..."
    exit 1
}

python -m pip install -e .
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ FEHLER bei der Paketinstallation via pip!" -ForegroundColor Red
    Read-Host "Drücken Sie Eingabe zum Beenden..."
    exit $LASTEXITCODE
}

python -m jarvis.installer
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ FEHLER beim Erstellen der Desktop-Verknüpfungen!" -ForegroundColor Red
    Read-Host "Drücken Sie Eingabe zum Beenden..."
    exit $LASTEXITCODE
}

Write-Host "`n-------------------------------------------" -ForegroundColor Green
Write-Host "✅ JARVIS Installation erfolgreich abgeschlossen!" -ForegroundColor Green
Write-Host "Sie können JARVIS nun per Verknüpfung auf dem Desktop oder im Terminal mit 'jarvis-gui' starten." -ForegroundColor Green
Write-Host "-------------------------------------------`n" -ForegroundColor Green

Read-Host "Drücken Sie Eingabe zum Beenden..."

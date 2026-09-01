@echo off
cd /d "%~dp0"

echo -------------------------------------------
echo ⚡ Installiere JARVIS AI Desktop Assistant (Windows)...
echo -------------------------------------------

if not exist "pyproject.toml" (
    echo.
    echo ❌ FEHLER: pyproject.toml wurde im aktuellen Verzeichnis nicht gefunden!
    echo Bitte stellen Sie sicher, dass Sie den GESAMTEN entpackten JARVIS-Ordner ausfuehren.
    echo.
    pause
    exit /b 1
)

python -m pip install -e .
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ FEHLER bei der Paketinstallation via pip!
    echo.
    pause
    exit /b %ERRORLEVEL%
)

python -m jarvis.installer
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ FEHLER beim Erstellen der Desktop-Verknuepfungen!
    echo.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo -------------------------------------------
echo ✅ JARVIS Installation erfolgreich abgeschlossen!
echo Sie können JARVIS nun per Verknüpfung auf dem Desktop oder im Terminal mit 'jarvis-gui' starten.
echo -------------------------------------------
echo.
pause

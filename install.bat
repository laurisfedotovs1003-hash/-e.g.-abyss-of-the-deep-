@echo off
echo -------------------------------------------
echo ⚡ Installiere JARVIS AI Desktop Assistant (Windows)...
echo -------------------------------------------

python -m pip install -e .

python -m jarvis.installer

echo -------------------------------------------
echo ✅ JARVIS Installation abgeschlossen!
echo Sie können JARVIS nun per Verknüpfung auf dem Desktop oder im Terminal mit 'jarvis-gui' starten.
echo -------------------------------------------
pause

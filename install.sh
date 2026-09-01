#!/usr/bin/env bash
# JARVIS Installer Script
set -e

echo "-------------------------------------------"
echo "⚡ Installiere JARVIS AI Desktop Assistant..."
echo "-------------------------------------------"

# Install package in editable mode
python3 -m pip install -e .

# Create Desktop Shortcut
python3 -m jarvis.installer

echo "-------------------------------------------"
echo "✅ JARVIS Installation abgeschlossen!"
echo "Sie können JARVIS im Terminal mit 'jarvis-gui' starten oder über das Desktop-Icon."
echo "-------------------------------------------"

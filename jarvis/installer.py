"""
Installer & Shortcut Creator module for JARVIS Desktop Application.
"""

import os
import sys
import shutil


def create_desktop_shortcut():
    """
    Creates a Linux .desktop file on Desktop/Applications menu or local shortcut.
    """
    home_dir = os.path.expanduser("~")
    desktop_dir = os.path.join(home_dir, "Desktop")
    apps_dir = os.path.join(home_dir, ".local", "share", "applications")

    executable_path = shutil.which("jarvis-gui") or sys.executable + " -m jarvis.gui"

    desktop_entry = f"""[Desktop Entry]
Version=1.0
Type=Application
Name=JARVIS AI Assistant
Comment=Autonomer KI-Assistent & App Builder
Exec={executable_path}
Icon=utilities-terminal
Terminal=false
Categories=Utility;Development;
"""

    created_paths = []
    if os.path.exists(desktop_dir):
        shortcut_file = os.path.join(desktop_dir, "JARVIS.desktop")
        with open(shortcut_file, "w", encoding="utf-8") as f:
            f.write(desktop_entry)
        os.chmod(shortcut_file, 0o755)
        created_paths.append(shortcut_file)

    os.makedirs(apps_dir, exist_ok=True)
    app_entry_file = os.path.join(apps_dir, "JARVIS.desktop")
    with open(app_entry_file, "w", encoding="utf-8") as f:
        f.write(desktop_entry)
    created_paths.append(app_entry_file)

    return created_paths


if __name__ == "__main__":
    shortcuts = create_desktop_shortcut()
    print("Desktop Shortcuts erfolgreich erstellt in:")
    for s in shortcuts:
        print(f" - {s}")

"""
Backup and Rollback (Undo) Engine for JARVIS.
Saves file snapshots before writes/deletions and enables multi-level rollback.
"""

import os
import shutil
import time
import json
from typing import Dict, Any, List, Optional


_global_backup_engine = None

def get_backup_engine(backup_dir: Optional[str] = None):
    global _global_backup_engine
    if _global_backup_engine is None or backup_dir is not None:
        _global_backup_engine = BackupEngine(backup_dir=backup_dir or ".jarvis_backups")
    return _global_backup_engine

class BackupEngine:
    def __init__(self, backup_dir: str = ".jarvis_backups"):
        self.backup_dir = os.path.abspath(backup_dir)
        os.makedirs(self.backup_dir, exist_ok=True)
        self.manifest_file = os.path.join(self.backup_dir, "manifest.json")
        self.history: List[Dict[str, Any]] = self._load_manifest()

    def _load_manifest(self) -> List[Dict[str, Any]]:
        if os.path.exists(self.manifest_file):
            try:
                with open(self.manifest_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                return []
        return []

    def _save_manifest(self):
        with open(self.manifest_file, "w", encoding="utf-8") as f:
            json.dump(self.history, f, indent=2, ensure_ascii=False)

    def backup_file(self, filepath: str, action: str = "modify") -> Optional[str]:
        """
        Creates a snapshot of the target file before modification or deletion.
        """
        abs_path = os.path.abspath(filepath)
        if not os.path.exists(abs_path):
            # File does not exist prior to creation -> action is 'create'
            snapshot_entry = {
                "id": str(int(time.time() * 1000)),
                "timestamp": time.time(),
                "original_path": abs_path,
                "action": "create",
                "backup_path": None
            }
            self.history.append(snapshot_entry)
            self._save_manifest()
            return snapshot_entry["id"]

        snapshot_id = str(int(time.time() * 1000))
        backup_filename = f"{snapshot_id}_{os.path.basename(abs_path)}"
        backup_path = os.path.join(self.backup_dir, backup_filename)

        try:
            shutil.copy2(abs_path, backup_path)
            snapshot_entry = {
                "id": snapshot_id,
                "timestamp": time.time(),
                "original_path": abs_path,
                "action": action,
                "backup_path": backup_path
            }
            self.history.append(snapshot_entry)
            self._save_manifest()
            return snapshot_id
        except Exception as e:
            print(f"Fehler beim Erstellen des Backups: {e}")
            return None

    def rollback_last(self) -> Dict[str, Any]:
        """
        Rolls back the last recorded file modification or creation.
        """
        if not self.history:
            return {"success": False, "message": "Keine Aktionen zum Rückgängigmachen vorhanden."}

        last_entry = self.history.pop()
        original_path = last_entry["original_path"]
        action = last_entry["action"]
        backup_path = last_entry.get("backup_path")

        try:
            if action == "create":
                if os.path.exists(original_path):
                    os.remove(original_path)
                msg = f"Erstellte Datei '{original_path}' wurde entfernt (Undo)."
            else: # modify or delete
                if backup_path and os.path.exists(backup_path):
                    os.makedirs(os.path.dirname(original_path), exist_ok=True)
                    shutil.copy2(backup_path, original_path)
                    os.remove(backup_path)
                    msg = f"Datei '{original_path}' wurde erfolgreich auf vorherigen Stand zurückgesetzt."
                else:
                    msg = f"Backup-Datei für '{original_path}' nicht gefunden."

            self._save_manifest()
            return {"success": True, "message": msg, "path": original_path}
        except Exception as e:
            return {"success": False, "error": str(e)}


BACKUP_TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "rollback_last_action",
            "description": "Macht die letzte Dateiänderung oder Erstellung rückgängig (Undo / Zurückmachen).",
            "parameters": {
                "type": "object",
                "properties": {}
            }
        }
    }
]

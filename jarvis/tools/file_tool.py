"""
File Management Tools for JARVIS.
"""

import os
import glob
from typing import Dict, Any, List


class FileTools:
    @staticmethod
    def read_file(filepath: str) -> Dict[str, Any]:
        """Reads content from a file."""
        try:
            abs_path = os.path.abspath(filepath)
            if not os.path.exists(abs_path):
                return {"success": False, "error": f"Datei '{filepath}' existiert nicht."}
            with open(abs_path, "r", encoding="utf-8", errors="replace") as f:
                content = f.read()
            return {"success": True, "content": content, "filepath": abs_path}
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def write_file(filepath: str, content: str, overwrite: bool = True) -> Dict[str, Any]:
        """Writes content to a file. Creates parent directories if needed."""
        try:
            abs_path = os.path.abspath(filepath)
            os.makedirs(os.path.dirname(abs_path), exist_ok=True)
            if os.path.exists(abs_path) and not overwrite:
                return {"success": False, "error": f"Datei '{filepath}' existiert bereits und overwrite=False."}
            with open(abs_path, "w", encoding="utf-8") as f:
                f.write(content)
            return {"success": True, "message": f"Datei '{abs_path}' erfolgreich geschrieben.", "filepath": abs_path}
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def list_files(directory: str = ".", recursive: bool = False) -> Dict[str, Any]:
        """Lists files in directory."""
        try:
            abs_dir = os.path.abspath(directory)
            if not os.path.exists(abs_dir):
                return {"success": False, "error": f"Verzeichnis '{directory}' existiert nicht."}

            files_list: List[str] = []
            if recursive:
                for root, _, files in os.walk(abs_dir):
                    for file in files:
                        files_list.append(os.path.relpath(os.path.join(root, file), abs_dir))
            else:
                for item in os.listdir(abs_dir):
                    item_path = os.path.join(abs_dir, item)
                    suffix = "/" if os.path.isdir(item_path) else ""
                    files_list.append(f"{item}{suffix}")

            return {"success": True, "directory": abs_dir, "files": files_list}
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def search_files(pattern: str, directory: str = ".") -> Dict[str, Any]:
        """Searches for files matching a glob pattern."""
        try:
            abs_dir = os.path.abspath(directory)
            search_path = os.path.join(abs_dir, "**", pattern)
            matches = glob.glob(search_path, recursive=True)
            rel_matches = [os.path.relpath(m, abs_dir) for m in matches]
            return {"success": True, "matches": rel_matches}
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def delete_file(filepath: str) -> Dict[str, Any]:
        """Deletes a file or empty directory."""
        try:
            abs_path = os.path.abspath(filepath)
            if not os.path.exists(abs_path):
                return {"success": False, "error": f"Pfad '{filepath}' existiert nicht."}
            if os.path.isdir(abs_path):
                os.rmdir(abs_path)
            else:
                os.remove(abs_path)
            return {"success": True, "message": f"'{abs_path}' wurde gelöscht."}
        except Exception as e:
            return {"success": False, "error": str(e)}


FILE_TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "read_file",
            "description": "Liest den Inhalt einer Datei im Dateisystem.",
            "parameters": {
                "type": "object",
                "properties": {
                    "filepath": {"type": "string", "description": "Relativer oder absoluter Pfad zur Datei"}
                },
                "required": ["filepath"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "write_file",
            "description": "Schreibt Inhalt in eine Datei (erstellt/überschreibt diese).",
            "parameters": {
                "type": "object",
                "properties": {
                    "filepath": {"type": "string", "description": "Pfad zur Ziel-Datei"},
                    "content": {"type": "string", "description": "Der zu schreibende Text/Code-Inhalt"}
                },
                "required": ["filepath", "content"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "list_files",
            "description": "Listet Dateien und Ordner in einem Verzeichnis auf.",
            "parameters": {
                "type": "object",
                "properties": {
                    "directory": {"type": "string", "description": "Verzeichnispfad (Standard: '.')"},
                    "recursive": {"type": "boolean", "description": "Rekursiv durchsuchen?"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_files",
            "description": "Sucht nach Dateien basierend auf einem Muster (z.B. '*.py').",
            "parameters": {
                "type": "object",
                "properties": {
                    "pattern": {"type": "string", "description": "Suchmuster, z. B. '*.py' oder 'config.*'"},
                    "directory": {"type": "string", "description": "Startverzeichnis für die Suche"}
                },
                "required": ["pattern"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "delete_file",
            "description": "Löscht eine bestimmte Datei oder ein leeres Verzeichnis.",
            "parameters": {
                "type": "object",
                "properties": {
                    "filepath": {"type": "string", "description": "Pfad der zu löschenden Datei"}
                },
                "required": ["filepath"]
            }
        }
    }
]

"""
App Builder and Code Generator module for JARVIS.
Handles multi-file project creation, dependency installation, and automated test & fix loop.
"""

import os
import json
from typing import Dict, Any, List, Optional
from jarvis.tools.file_tool import FileTools
from jarvis.tools.shell_tool import ShellTools


class AppBuilderTools:
    @staticmethod
    def create_project(
        project_name: str,
        files: Dict[str, str],
        base_dir: str = "."
    ) -> Dict[str, Any]:
        """
        Creates a complete multi-file project structure in one step.
        `files` is a dictionary mapping relative file paths to their file contents.
        """
        project_path = os.path.join(base_dir, project_name)
        created_files = []

        try:
            os.makedirs(project_path, exist_ok=True)
            for rel_path, content in files.items():
                full_file_path = os.path.join(project_path, rel_path)
                res = FileTools.write_file(full_file_path, content, overwrite=True)
                if res["success"]:
                    created_files.append(rel_path)
                else:
                    return {
                        "success": False,
                        "error": f"Fehler beim Erstellen der Datei '{rel_path}': {res.get('error')}",
                        "created_files": created_files
                    }

            return {
                "success": True,
                "project_path": os.path.abspath(project_path),
                "created_files": created_files,
                "message": f"Projekt '{project_name}' erfolgreich mit {len(created_files)} Dateien erstellt."
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def test_and_run_project(
        project_dir: str,
        run_command: str,
        test_command: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Runs and tests a project, reporting stdout, stderr, and execution success.
        """
        results = {}
        abs_proj_dir = os.path.abspath(project_dir)

        if test_command:
            test_res = ShellTools.execute_command(test_command, working_dir=abs_proj_dir)
            results["test_results"] = test_res

        run_res = ShellTools.execute_command(run_command, working_dir=abs_proj_dir)
        results["run_results"] = run_res
        results["success"] = run_res.get("success", False) and (
            test_res.get("success", True) if test_command else True
        )

        return results


APP_BUILDER_TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "create_project",
            "description": "Erstellt ein neues Software-Projekt mit allen erforderlichen Dateien und Ordnerstrukturen.",
            "parameters": {
                "type": "object",
                "properties": {
                    "project_name": {"type": "string", "description": "Name des Projektordners"},
                    "files": {
                        "type": "object",
                        "description": "Schlüssel-Wert-Paare von Dateipfaden und deren Inhalt, z. B. {'main.py': 'print(1)', 'README.md': '# Title'}",
                        "additionalProperties": {"type": "string"}
                    },
                    "base_dir": {"type": "string", "description": "Basisverzeichnis für das Projekt (Standard: '.')"}
                },
                "required": ["project_name", "files"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "test_and_run_project",
            "description": "Testet und führt ein erstelltes Projekt aus und gibt das Ergebnis zurück.",
            "parameters": {
                "type": "object",
                "properties": {
                    "project_dir": {"type": "string", "description": "Pfad zum Projektordner"},
                    "run_command": {"type": "string", "description": "Startbefehl für die Anwendung (z. B. 'python main.py')"},
                    "test_command": {"type": "string", "description": "Optionaler Testbefehl (z. B. 'pytest')"}
                },
                "required": ["project_dir", "run_command"]
            }
        }
    }
]

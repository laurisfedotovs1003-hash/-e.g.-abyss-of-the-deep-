"""
Shell & Command Execution Tool for JARVIS.
Allows running bash/shell commands, executing scripts, installing packages, and querying system state.
"""

import subprocess
import os
from typing import Dict, Any, Optional
from jarvis.safety import SafetyEngine


class ShellTools:
    @staticmethod
    def execute_command(
        command: str,
        working_dir: Optional[str] = None,
        timeout: int = 120,
        ask_user_confirm_func: Optional[Any] = None
    ) -> Dict[str, Any]:
        """
        Executes a shell command safely.
        If a command is flagged as high-risk/irreversible by SafetyEngine,
        it asks the user for explicit confirmation before executing.
        """
        is_high_risk, reason = SafetyEngine.analyze_shell_command(command)

        if is_high_risk:
            if ask_user_confirm_func:
                user_approved = ask_user_confirm_func(f"SICHERHEITSWARNUNG: {reason}\nMöchten Sie diesen Befehl wirklich ausführen?")
                if not user_approved:
                    return {
                        "success": False,
                        "error": "Aktion vom Benutzer abgebrochen (Sicherheitsrisiko).",
                        "command": command
                    }
            else:
                return {
                    "success": False,
                    "error": f"Sicherheitsblockierung: {reason}. Bestätigung erforderlich.",
                    "command": command
                }

        cwd = working_dir if working_dir else os.getcwd()

        try:
            result = subprocess.run(
                command,
                shell=True,
                cwd=cwd,
                capture_output=True,
                text=True,
                timeout=timeout
            )
            return {
                "success": result.returncode == 0,
                "exit_code": result.returncode,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "command": command
            }
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "error": f"Befehl hat Zeitüberschreitung nach {timeout} Sekunden erreicht.",
                "command": command
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "command": command
            }


SHELL_TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "execute_command",
            "description": "Führt einen Terminal-/Shell-Befehl auf dem System aus (z.B. pip install, pytest, git, python script.py, etc.).",
            "parameters": {
                "type": "object",
                "properties": {
                    "command": {"type": "string", "description": "Der auszuführende Shell-Befehl"},
                    "working_dir": {"type": "string", "description": "Arbeitsverzeichnis für den Befehl (optional)"}
                },
                "required": ["command"]
            }
        }
    }
]

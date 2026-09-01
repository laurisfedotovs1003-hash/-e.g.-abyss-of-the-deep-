"""
Core Autonomous Agent Loop for JARVIS.
"""

import json
from typing import List, Dict, Any, Callable, Optional
from jarvis.config import Config
from jarvis.llm import LLMClient
from jarvis.safety import SafetyEngine
from jarvis.tools.file_tool import FileTools, FILE_TOOL_DEFINITIONS
from jarvis.tools.shell_tool import ShellTools, SHELL_TOOL_DEFINITIONS
from jarvis.tools.app_builder import AppBuilderTools, APP_BUILDER_TOOL_DEFINITIONS
from jarvis.history_backup import get_backup_engine, BACKUP_TOOL_DEFINITIONS


SYSTEM_PROMPT = """Du bist JARVIS, ein hochintelligenter, autonomer KI-Assistent für das System des Benutzers.
Du hast vollen Zugriff auf das Dateisystem und das Terminal, um Aufgaben auszuführen, Dateien zu verwalten und selbstständig Software/Apps zu erstellen und zu testen.

Verhaltensregeln:
1. Agiere zielgerichtet, präzise und autonom.
2. Wenn du eine Anwendung oder ein Skript erstellen sollst:
   - Erstelle alle benötigten Dateien und Ordnerstrukturen.
   - Installiere fehlende Abhängigkeiten bei Bedarf.
   - Führe den Code aus und teste ihn, um sicherzustellen, dass er fehlerfrei funktioniert.
3. Frage den Benutzer NUR DANN um Bestätigung, wenn eine wirklich unwiderrufliche/destruktive Aktion bevorsteht (z. B. das Löschen von kritischen Systemdateien oder Festplattenformatierung). Ausführen von Befehlen, Schreiben von Dateien, Testen von Apps etc. soll autonom erfolgen!
4. Deine Antworten sollten klar, höflich und auf Deutsch verfasst sein.
"""


class JarvisAgent:
    def __init__(
        self,
        config: Config,
        user_confirm_callback: Optional[Callable[[str], bool]] = None
    ):
        self.config = config
        self.llm_client = LLMClient(config)
        self.user_confirm_callback = user_confirm_callback
        self.messages: List[Dict[str, Any]] = [
            {"role": "system", "content": SYSTEM_PROMPT}
        ]

        self.backup_engine = get_backup_engine()
        # Combine tools
        self.tools = FILE_TOOL_DEFINITIONS + SHELL_TOOL_DEFINITIONS + APP_BUILDER_TOOL_DEFINITIONS + BACKUP_TOOL_DEFINITIONS
        self.tool_map = {
            "rollback_last_action": lambda **kw: self.backup_engine.rollback_last(),
            "read_file": lambda **kw: FileTools.read_file(**kw),
            "write_file": lambda **kw: FileTools.write_file(**kw),
            "list_files": lambda **kw: FileTools.list_files(**kw),
            "search_files": lambda **kw: FileTools.search_files(**kw),
            "delete_file": lambda **kw: self._safe_delete_file(**kw),
            "execute_command": lambda **kw: ShellTools.execute_command(
                ask_user_confirm_func=self.user_confirm_callback, **kw
            ),
            "create_project": lambda **kw: AppBuilderTools.create_project(**kw),
            "test_and_run_project": lambda **kw: AppBuilderTools.test_and_run_project(**kw)
        }

    def _safe_delete_file(self, filepath: str) -> Dict[str, Any]:
        is_high_risk, reason = SafetyEngine.analyze_file_deletion(filepath)
        if is_high_risk:
            if self.user_confirm_callback:
                if not self.user_confirm_callback(f"SICHERHEITSWARNUNG: {reason}\nMöchten Sie diese Löschung wirklich durchführen?"):
                    return {"success": False, "error": "Löschung vom Benutzer abgebrochen."}
            else:
                return {"success": False, "error": f"Sicherheitsblockierung: {reason}"}
        return FileTools.delete_file(filepath)

    def step(self, user_input: Optional[str] = None) -> str:
        """
        Runs one interaction loop or tool response loop.
        """
        if user_input:
            self.messages.append({"role": "user", "content": user_input})

        max_loops = 10
        loop_count = 0

        while loop_count < max_loops:
            loop_count += 1
            response = self.llm_client.chat_completion(
                messages=self.messages,
                tools=self.tools
            )

            message = response.choices[0].message

            if not message.tool_calls:
                content = message.content or ""
                self.messages.append({"role": "assistant", "content": content})
                return content

            # Handle tool calls
            self.messages.append({
                "role": "assistant",
                "content": message.content,
                "tool_calls": [
                    {
                        "id": tool_call.id,
                        "type": tool_call.type,
                        "function": {
                            "name": tool_call.function.name,
                            "arguments": tool_call.function.arguments
                        }
                    }
                    for tool_call in message.tool_calls
                ]
            })

            for tool_call in message.tool_calls:
                func_name = tool_call.function.name
                try:
                    func_args = json.loads(tool_call.function.arguments)
                except Exception:
                    func_args = {}

                if func_name in self.tool_map:
                    try:
                        tool_result = self.tool_map[func_name](**func_args)
                    except Exception as e:
                        tool_result = {"success": False, "error": f"Fehler beim Ausführen von '{func_name}': {str(e)}"}
                else:
                    tool_result = {"error": f"Tool '{func_name}' nicht gefunden."}

                self.messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "name": func_name,
                    "content": json.dumps(tool_result, ensure_ascii=False)
                })

        return "Maximale Interaktionsschleife erreicht."

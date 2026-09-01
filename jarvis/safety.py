"""
Safety Engine for detecting non-reversible / destructive operations.
Prompting user confirmation ONLY when irreversible damage could occur.
"""

import re
from typing import Tuple


class SafetyEngine:
    # High-risk patterns that permanently delete data or modify critical system settings
    HIGH_RISK_PATTERNS = [
        r"rm\s+(-[a-zA-Z]*r[a-zA-Z]*|-f)*\s+/*$",  # root or root wildcard deletion
        r"rm\s+-[a-zA-Z]*r[a-zA-Z]*\s+~",          # home directory deletion
        r"mkfs.*",                                 # formatting filesystems
        r"dd\s+if=.*of=/dev/sd.*",                 # raw disk writing
        r"chmod\s+-R\s+777\s+/",                  # recursive permission corruption on root
        r"> /dev/sd.*",                            # truncating block devices
        r"del\s+/s\s+/q\s+C:\\*",                 # windows root mass deletion
        r"rd\s+/s\s+/q\s+C:\\*",
    ]

    @classmethod
    def analyze_shell_command(cls, command: str) -> Tuple[bool, str]:
        """
        Analyzes a shell command to check if it's irreversible/destructive.
        Returns (is_high_risk: bool, reason: str).
        """
        cmd_stripped = command.strip()

        for pattern in cls.HIGH_RISK_PATTERNS:
            if re.search(pattern, cmd_stripped, re.IGNORECASE):
                return True, f"Befehl enthält potenziell irreversibles/destruktives Muster: `{cmd_stripped}`"

        return False, ""

    @classmethod
    def analyze_file_deletion(cls, filepath: str) -> Tuple[bool, str]:
        """
        Analyzes file deletion actions.
        Deletion of critical system roots or home folder root is flagged as high risk.
        """
        norm_path = filepath.strip().rstrip("/")
        if norm_path in ["", "/", "/root", "/etc", "/usr", "/var", "C:", "C:\\", "C:\\Windows"]:
            return True, f"Ihre Anfrage versucht, ein kritisches Systemverzeichnis zu löschen: `{filepath}`"

        return False, ""

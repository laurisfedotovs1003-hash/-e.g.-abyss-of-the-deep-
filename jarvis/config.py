"""
Configuration management for JARVIS.
"""

import os
from dataclasses import dataclass, field
from typing import Optional
from dotenv import load_dotenv

load_dotenv()


@dataclass
class Config:
    api_key: Optional[str] = field(
        default_factory=lambda: os.getenv("OPENAI_API_KEY")
    )
    base_url: Optional[str] = field(
        default_factory=lambda: os.getenv("OPENAI_BASE_URL")
    )
    model: str = field(
        default_factory=lambda: os.getenv("JARVIS_MODEL", "gpt-4o")
    )
    temperature: float = 0.2
    max_tokens: int = 4096
    working_dir: str = field(
        default_factory=lambda: os.getcwd()
    )
    system_prompt_language: str = field(
        default_factory=lambda: os.getenv("JARVIS_LANG", "German")
    )

    def validate(self) -> bool:
        if not self.api_key and not self.base_url:
            return False
        return True

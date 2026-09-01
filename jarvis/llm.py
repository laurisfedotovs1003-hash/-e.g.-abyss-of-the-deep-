"""
LLM Provider Abstraction for JARVIS.
Supports OpenAI API and OpenAI-compatible local API endpoints (Ollama, vLLM, LM Studio, etc.).
"""

import json
from typing import Any, Dict, List, Optional
from openai import OpenAI
from jarvis.config import Config


class LLMClient:
    def __init__(self, config: Config):
        self.config = config
        kwargs = {}
        if config.api_key:
            kwargs["api_key"] = config.api_key
        else:
            # Placeholder for local setups without key requirement
            kwargs["api_key"] = "dummy"

        if config.base_url:
            kwargs["base_url"] = config.base_url

        self.client = OpenAI(**kwargs)

    def chat_completion(
        self,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
        tool_choice: str = "auto"
    ) -> Any:
        """
        Sends a chat completion request to the OpenAI-compatible model.
        """
        kwargs: Dict[str, Any] = {
            "model": self.config.model,
            "messages": messages,
            "temperature": self.config.temperature,
            "max_tokens": self.config.max_tokens,
        }

        if tools:
            kwargs["tools"] = tools
            kwargs["tool_choice"] = tool_choice

        response = self.client.chat.completions.create(**kwargs)
        return response

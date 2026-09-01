# JARVIS - Autonomous AI Assistant & System Agent

JARVIS is an autonomous AI assistant capable of system administration, file management, software development, and task execution with full system capabilities.

## Architecture

JARVIS is built with a modular, extensible architecture:

- **Core Agent Loop (`jarvis/agent.py`)**: Manages conversation history, reasoning, tool execution, and self-correction loops.
- **LLM Provider Layer (`jarvis/llm.py`)**: Connects to OpenAI API or local OpenAI-compatible models (e.g. Ollama, vLLM).
- **Tool System (`jarvis/tools/`)**:
  - `file_tool.py`: Read, write, search, list, edit, and delete files on the filesystem.
  - `shell_tool.py`: Execute shell/bash commands, run scripts, install packages, and inspect output.
  - `app_builder.py`: Multi-step software project creation, execution, and testing loop.
- **Safety Engine (`jarvis/safety.py`)**: Inspects commands for non-reversible destructive operations (e.g., `rm -rf /`, formatting drives, overwriting non-backed-up critical system files) and requests confirmation only when necessary.
- **Terminal UI (`jarvis/cli.py` / `jarvis/main.py`)**: Rich interactive CLI interface for seamless interaction.

## Installation & Setup

```bash
pip install -e .
```

Set your OpenAI API Key (or local base URL):

```bash
export OPENAI_API_KEY="your-api-key"
# Optional for local LLMs:
export OPENAI_BASE_URL="http://localhost:11434/v1"
```

## Usage

Start JARVIS in interactive mode:

```bash
jarvis
```

Or pass a single task directly:

```bash
jarvis "Create a Python web scraper for news articles in a new directory"
```

"""
Unit and Integration tests for JARVIS tools, safety engine, and configuration.
"""

import os
import shutil
import pytest
from jarvis.config import Config
from jarvis.safety import SafetyEngine
from jarvis.tools.file_tool import FileTools
from jarvis.tools.shell_tool import ShellTools
from jarvis.tools.app_builder import AppBuilderTools


def test_config():
    config = Config(model="gpt-4o", system_prompt_language="German")
    assert config.model == "gpt-4o"
    assert config.system_prompt_language == "German"


def test_safety_engine():
    # Dangerous commands
    is_risk, reason = SafetyEngine.analyze_shell_command("rm -rf /")
    assert is_risk is True
    assert "reversibel" in reason or "Muster" in reason

    is_risk_del, _ = SafetyEngine.analyze_file_deletion("/")
    assert is_risk_del is True

    # Safe command
    is_safe_cmd, _ = SafetyEngine.analyze_shell_command("ls -la")
    assert is_safe_cmd is False


def test_file_tools(tmp_path):
    test_file = tmp_path / "sample.txt"

    # Write
    res_write = FileTools.write_file(str(test_file), "Hello JARVIS!")
    assert res_write["success"] is True

    # Read
    res_read = FileTools.read_file(str(test_file))
    assert res_read["success"] is True
    assert res_read["content"] == "Hello JARVIS!"

    # List
    res_list = FileTools.list_files(str(tmp_path))
    assert res_list["success"] is True
    assert "sample.txt" in res_list["files"]

    # Delete
    res_del = FileTools.delete_file(str(test_file))
    assert res_del["success"] is True
    assert not os.path.exists(test_file)


def test_shell_tools():
    res = ShellTools.execute_command("echo 'JARVIS Test'")
    assert res["success"] is True
    assert "JARVIS Test" in res["stdout"]


def test_app_builder_tools(tmp_path):
    proj_name = "test_app"
    files = {
        "main.py": "print('App running')",
        "config.json": '{"name": "test"}'
    }

    create_res = AppBuilderTools.create_project(
        project_name=proj_name,
        files=files,
        base_dir=str(tmp_path)
    )

    assert create_res["success"] is True
    proj_dir = create_res["project_path"]
    assert os.path.exists(os.path.join(proj_dir, "main.py"))

    run_res = AppBuilderTools.test_and_run_project(
        project_dir=proj_dir,
        run_command="python main.py"
    )

    assert run_res["success"] is True
    assert "App running" in run_res["run_results"]["stdout"]

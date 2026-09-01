"""
Command Line Interface for JARVIS.
Rich terminal formatting, interactive chat mode, single-task execution.
"""

import sys
import argparse
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Confirm, Prompt
from jarvis.config import Config
from jarvis.agent import JarvisAgent

console = Console()


def user_confirm_callback(prompt_text: str) -> bool:
    console.print(f"\n[bold red]⚠️  {prompt_text}[/bold red]")
    return Confirm.ask("[bold yellow]Bestätigen?[/bold yellow]", default=False)


def run_interactive(agent: JarvisAgent):
    console.print(Panel.fit(
        "[bold cyan]🤖 JARVIS Autonomer KI-Assistent[/bold cyan]\n"
        "[dim]Bereit für Systemsteuerung, Dateiverwaltung & App-Entwicklung.[/dim]\n"
        "[dim]Tippe 'exit' oder 'quit' zum Beenden.[/dim]",
        border_style="cyan"
    ))

    while True:
        try:
            user_input = Prompt.ask("\n[bold green]Sie[/bold green]")
            if not user_input.strip():
                continue
            if user_input.strip().lower() in ["exit", "quit"]:
                console.print("[yellow]JARVIS beendet. Auf Wiedersehen![/yellow]")
                break

            with console.status("[bold cyan]JARVIS arbeitet...[/bold cyan]", spinner="dots"):
                response = agent.step(user_input)

            console.print(f"\n[bold cyan]JARVIS:[/bold cyan]\n{response}")

        except (KeyboardInterrupt, EOFError):
            console.print("\n[yellow]JARVIS beendet.[/yellow]")
            break


def main():
    parser = argparse.ArgumentParser(description="JARVIS - Autonomer KI-Assistent")
    parser.add_argument("prompt", nargs="*", help="Optionale Aufgabe für Einzadausführung")
    args = parser.parse_args()

    config = Config()
    agent = JarvisAgent(config, user_confirm_callback=user_confirm_callback)

    if args.prompt:
        task = " ".join(args.prompt)
        console.print(f"[bold cyan]Aufgabe:[/bold cyan] {task}")
        with console.status("[bold cyan]JARVIS arbeitet...[/bold cyan]", spinner="dots"):
            response = agent.step(task)
        console.print(f"\n[bold cyan]JARVIS:[/bold cyan]\n{response}")
    else:
        run_interactive(agent)


if __name__ == "__main__":
    main()

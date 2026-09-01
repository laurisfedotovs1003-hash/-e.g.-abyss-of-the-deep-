"""
Futuristic Desktop GUI for JARVIS.
Built with tkinter/customtkinter, featuring a cyber-themed UI, prompt inputs, status indicator,
explicit action approvals, and a dedicated Undo / Rollback button.
"""

import threading
import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext
from jarvis.config import Config
from jarvis.agent import JarvisAgent
from jarvis.history_backup import get_backup_engine


class FuturisticJarvisGUI:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("JARVIS - AI Desktop Assistant")
        self.root.geometry("900x650")
        self.root.configure(bg="#0B0F19")  # Deep cyber dark blue/black

        self.config = Config()
        self.agent = JarvisAgent(self.config, user_confirm_callback=self.ask_user_confirmation)
        self.backup_engine = get_backup_engine()

        self._build_ui()

    def _build_ui(self):
        # Header / Status Bar
        header = tk.Frame(self.root, bg="#111827", height=50)
        header.pack(fill=tk.X, side=tk.TOP)

        title_label = tk.Label(
            header, text="⚡ JARVIS AUTONOMOUS AGENT",
            font=("Helvetica", 14, "bold"), fg="#00F0FF", bg="#111827"
        )
        title_label.pack(side=tk.LEFT, padx=15, pady=10)

        self.status_label = tk.Label(
            header, text="● SYSTEM READY",
            font=("Helvetica", 10, "bold"), fg="#00FF66", bg="#111827"
        )
        self.status_label.pack(side=tk.RIGHT, padx=15, pady=10)

        # Main Chat Area
        main_frame = tk.Frame(self.root, bg="#0B0F19")
        main_frame.pack(fill=tk.BOTH, expand=True, padx=15, pady=10)

        self.chat_display = scrolledtext.ScrolledText(
            main_frame, wrap=tk.WORD, font=("Consolas", 10),
            bg="#131B2E", fg="#E2E8F0", insertbackground="#00F0FF",
            bd=0, relief=tk.FLAT
        )
        self.chat_display.pack(fill=tk.BOTH, expand=True)
        self.chat_display.insert(
            tk.END, "JARVIS: Hallo! Ich bin Ihr autonomer KI-Assistent. Wie kann ich Ihnen heute helfen?\n\n"
        )
        self.chat_display.config(state=tk.DISABLED)

        # Control & Input Bar
        input_frame = tk.Frame(self.root, bg="#111827", height=60)
        input_frame.pack(fill=tk.X, side=tk.BOTTOM, padx=15, pady=10)

        self.entry_input = tk.Entry(
            input_frame, font=("Helvetica", 11),
            bg="#1F293D", fg="#FFFFFF", insertbackground="#00F0FF",
            bd=0, relief=tk.FLAT
        )
        self.entry_input.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(10, 5), pady=10)
        self.entry_input.bind("<Return>", lambda e: self.send_message())

        send_btn = tk.Button(
            input_frame, text="Senden ▶", font=("Helvetica", 10, "bold"),
            bg="#00F0FF", fg="#0B0F19", activebackground="#00C0FF",
            bd=0, relief=tk.FLAT, command=self.send_message
        )
        send_btn.pack(side=tk.LEFT, padx=5, pady=10)

        undo_btn = tk.Button(
            input_frame, text="↺ Rückgängig (Undo)", font=("Helvetica", 10, "bold"),
            bg="#FF3366", fg="#FFFFFF", activebackground="#CC0033",
            bd=0, relief=tk.FLAT, command=self.undo_action
        )
        undo_btn.pack(side=tk.RIGHT, padx=(5, 10), pady=10)

    def ask_user_confirmation(self, prompt_text: str) -> bool:
        """Safely called from background worker thread by marshalling to main thread"""
        result = [False]
        event = threading.Event()

        def _ask():
            result[0] = messagebox.askyesno("JARVIS - Sicherheitsbestätigung", prompt_text)
            event.set()

        self.root.after(0, _ask)
        event.wait()
        return result[0]

    def append_chat(self, sender: str, text: str, color: str = "#E2E8F0"):
        self.chat_display.config(state=tk.NORMAL)
        self.chat_display.insert(tk.END, f"{sender}: {text}\n\n")
        self.chat_display.see(tk.END)
        self.chat_display.config(state=tk.DISABLED)

    def send_message(self):
        user_text = self.entry_input.get().strip()
        if not user_text:
            return

        self.entry_input.delete(0, tk.END)
        self.append_chat("Sie", user_text, "#00F0FF")

        self.status_label.config(text="● JARVIS ARBEITET...", fg="#FFCC00")

        def worker():
            try:
                response = self.agent.step(user_text)
                self.root.after(0, lambda: self.append_chat("JARVIS", response))
            except Exception as e:
                self.root.after(0, lambda: self.append_chat("SYSTEM ERROR", str(e), "#FF3366"))
            finally:
                self.root.after(0, lambda: self.status_label.config(text="● SYSTEM READY", fg="#00FF66"))

        threading.Thread(target=worker, daemon=True).start()

    def undo_action(self):
        res = self.backup_engine.rollback_last()
        if res.get("success"):
            self.append_chat("SYSTEM (UNDO)", res.get("message", "Aktion rückgängig gemacht."), "#FFCC00")
            messagebox.showinfo("JARVIS Undo", res.get("message"))
        else:
            messagebox.showwarning("JARVIS Undo", res.get("message", "Keine Aktion zum Rückgängigmachen."))


def main():
    root = tk.Tk()
    app = FuturisticJarvisGUI(root)
    root.mainloop()


if __name__ == "__main__":
    main()

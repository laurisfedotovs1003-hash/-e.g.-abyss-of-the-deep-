/* JARVIS Native Obsidian Plugin compiled main script */
const { Plugin, PluginSettingTab, Setting, ItemView, WorkspaceLeaf } = require('obsidian');

const VIEW_TYPE_JARVIS = 'jarvis-chat-view';

class JarvisView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType() {
    return VIEW_TYPE_JARVIS;
  }

  getDisplayText() {
    return 'JARVIS AI Assistant';
  }

  getIcon() {
    return 'bot';
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    container.createEl('h3', { text: '🤖 JARVIS Second Brain' });

    const statusEl = container.createEl('div', { cls: 'jarvis-status', text: 'Connecting to JARVIS Agent Core...' });

    const chatBox = container.createEl('div', { cls: 'jarvis-chat-box', attr: { style: 'height: 300px; overflow-y: auto; border: 1px solid var(--background-modifier-border); padding: 10px; margin-bottom: 10px; border-radius: 5px;' } });

    const inputContainer = container.createEl('div', { attr: { style: 'display: flex; gap: 5px;' } });
    const inputEl = inputContainer.createEl('input', { attr: { type: 'text', placeholder: 'Ask JARVIS, upgrade notes, create skills...', style: 'flex: 1;' } });
    const sendBtn = inputContainer.createEl('button', { text: 'Send' });

    const actionBtnContainer = container.createEl('div', { attr: { style: 'margin-top: 10px; display: flex; flex-direction: column; gap: 5px;' } });
    const upgradeBtn = actionBtnContainer.createEl('button', { text: '⚡ Upgrade & Link Vault Notes' });
    const skillBtn = actionBtnContainer.createEl('button', { text: '🛠️ Create New Skill / Plugin' });

    const appendMsg = (sender, msg) => {
      const p = chatBox.createEl('p', { attr: { style: 'margin-bottom: 8px;' } });
      p.createEl('strong', { text: `${sender}: ` });
      p.createSpan({ text: msg });
      chatBox.scrollTop = chatBox.scrollHeight;
    };

    appendMsg('JARVIS', 'Hello! I am active inside your Obsidian Vault. How can I manage your notes or generate skills today?');

    sendBtn.onclick = async () => {
      const val = inputEl.value.trim();
      if (!val) return;
      appendMsg('User', val);
      inputEl.value = '';

      try {
        const res = await fetch(`${this.plugin.settings.serverUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: val })
        });
        const data = await res.json();
        appendMsg('JARVIS', data.message);
      } catch (err) {
        appendMsg('JARVIS', 'Could not communicate with JARVIS Server. Make sure JARVIS backend is running.');
      }
    };

    upgradeBtn.onclick = async () => {
      appendMsg('User', 'Requesting Vault Upgrade & Linking...');
      try {
        const res = await fetch(`${this.plugin.settings.serverUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'upgrade vault' })
        });
        const data = await res.json();
        appendMsg('JARVIS', data.message);
      } catch (err) {
        appendMsg('JARVIS', 'Error triggering vault upgrade.');
      }
    };

    skillBtn.onclick = async () => {
      const name = prompt('Skill Name:');
      if (!name) return;
      appendMsg('User', `Create skill: ${name}`);
      try {
        const res = await fetch(`${this.plugin.settings.serverUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: `create skill name: ${name}` })
        });
        const data = await res.json();
        appendMsg('JARVIS', data.message);
      } catch (err) {
        appendMsg('JARVIS', 'Error creating skill.');
      }
    };

    try {
      const res = await fetch(`${this.plugin.settings.serverUrl}/api/status`);
      const statusData = await res.json();
      statusEl.setText(`Status: ${statusData.status} | Notes Indexed: ${statusData.memoryStats.totalNotesIndexed}`);
    } catch (e) {
      statusEl.setText('Status: Offline (Start JARVIS Server on port 3000)');
    }
  }

  async onClose() {}
}

const DEFAULT_SETTINGS = {
  serverUrl: 'http://localhost:3000'
};

module.exports = class JarvisPlugin extends Plugin {
  async onload() {
    await this.loadSettings();

    this.registerView(
      VIEW_TYPE_JARVIS,
      (leaf) => new JarvisView(leaf, this)
    );

    this.addRibbonIcon('bot', 'Open JARVIS AI', () => {
      this.activateView();
    });

    this.addCommand({
      id: 'open-jarvis-view',
      name: 'Open JARVIS AI Assistant',
      callback: () => {
        this.activateView();
      }
    });

    this.addCommand({
      id: 'jarvis-upgrade-vault',
      name: 'JARVIS: Upgrade & Organize Vault Notes',
      callback: async () => {
        try {
          const res = await fetch(`${this.settings.serverUrl}/api/vault/upgrade`, { method: 'POST' });
          const data = await res.json();
          console.log('JARVIS Vault Upgraded:', data);
        } catch (e) {
          console.error('Error upgrading vault via JARVIS command:', e);
        }
      }
    });

    this.addSettingTab(new JarvisSettingTab(this.app, this));
  }

  onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_JARVIS);
  }

  async activateView() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE_JARVIS)[0];

    if (!leaf) {
      const rightLeaf = workspace.getRightLeaf(false);
      if (rightLeaf) {
        leaf = rightLeaf;
        await leaf.setViewState({
          type: VIEW_TYPE_JARVIS,
          active: true,
        });
      }
    }

    if (leaf) {
      workspace.revealLeaf(leaf);
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
};

class JarvisSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl('h2', { text: 'JARVIS Agent Settings' });

    new Setting(containerEl)
      .setName('JARVIS Server URL')
      .setDesc('Endpoint for the JARVIS Core Agent Service')
      .addText(text => text
        .setPlaceholder('http://localhost:3000')
        .setValue(this.plugin.settings.serverUrl)
        .onChange(async (value) => {
          this.plugin.settings.serverUrl = value;
          await this.plugin.saveSettings();
        }));
  }
}

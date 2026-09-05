import { VaultManager } from './memory/VaultManager';
import { MemoryEngine } from './memory/MemoryEngine';
import { SkillManager } from './skills/SkillManager';

export interface AgentRequest {
  userMessage: string;
  autoUpgradeVault?: boolean;
}

export interface AgentResponse {
  message: string;
  actionTaken?: string;
  searchResults?: any[];
  skillOutput?: any;
  vaultStatus?: any;
}

export class JarvisAgent {
  private vaultManager: VaultManager;
  private memoryEngine: MemoryEngine;
  private skillManager: SkillManager;

  constructor(vaultManager: VaultManager, memoryEngine: MemoryEngine, skillManager: SkillManager) {
    this.vaultManager = vaultManager;
    this.memoryEngine = memoryEngine;
    this.skillManager = skillManager;
  }

  public async initialize(): Promise<void> {
    await this.vaultManager.ensureVaultExists();
    await this.memoryEngine.syncMemory();
    await this.skillManager.init();
  }

  public async processRequest(request: AgentRequest): Promise<AgentResponse> {
    const input = request.userMessage.trim();
    const lower = input.toLowerCase();

    // 1. Check if user wants to upgrade/organize vault
    if (lower.includes('upgrade vault') || lower.includes('organize vault') || lower.includes('gehirn udaten') || lower.includes('vault upgraden')) {
      const result = await this.vaultManager.upgradeAndOrganizeVault();
      await this.memoryEngine.syncMemory();
      return {
        message: `JARVIS: Vault upgrade complete! ${result.summary}`,
        actionTaken: 'VAULT_UPGRADE',
        vaultStatus: result,
      };
    }

    // 2. Check if user requests creating a new skill / plugin
    if (lower.includes('create skill') || lower.includes('erstelle skill') || lower.includes('neues plugin')) {
      const nameMatch = input.match(/name:\s*([a-zA-Z0-9_]+)/i) || input.match(/skill\s+([a-zA-Z0-9_]+)/i);
      const skillName = nameMatch ? nameMatch[1] : `custom_skill_${Date.now().toString().slice(-4)}`;

      const createdMeta = await this.skillManager.createDynamicSkill(
        skillName,
        `Dynamically generated skill '${skillName}' by JARVIS.`,
        { input: { type: 'string', description: 'Input value' } },
        `return { status: 'success', inputReceived: args.input, processedBy: '${skillName}' };`
      );

      return {
        message: `JARVIS: Dynamically generated and registered new skill '${createdMeta.name}'. You can now invoke it anytime!`,
        actionTaken: 'CREATE_SKILL',
        skillOutput: createdMeta,
      };
    }

    // 3. Check if user wants to run a specific skill (e.g. calculate 5 * 10)
    if (lower.startsWith('calculate') || lower.startsWith('berechne')) {
      const expr = input.replace(/^(calculate|berechne)/i, '').trim();
      const calcResult = await this.skillManager.executeSkill('calculator', { expression: expr });
      return {
        message: `JARVIS Calculation Result for '${expr}': ${calcResult.result}`,
        actionTaken: 'EXECUTE_SKILL',
        skillOutput: calcResult,
      };
    }

    // 4. Memory retrieval & Query handling from Second Brain
    const memoryContext = this.memoryEngine.searchMemory(input, 3);
    let memorySummary = '';

    if (memoryContext.length > 0) {
      memorySummary = memoryContext.map(m => `• [${m.title}]: ${m.contentChunk}`).join('\n');
    }

    // Auto-organize vault background check
    if (request.autoUpgradeVault) {
      await this.vaultManager.upgradeAndOrganizeVault();
      await this.memoryEngine.syncMemory();
    }

    // 5. Formulate final response
    let responseText = `JARVIS Response:\n`;
    if (memoryContext.length > 0) {
      responseText += `I retrieved the following information from your Second Brain (Obsidian Vault):\n\n${memorySummary}\n\n`;
      responseText += `How would you like to build upon or update this note?`;
    } else {
      responseText += `I have analyzed your query "${input}". No direct note match was found in your vault, but I can create a new note or generate a new skill to handle this for you!`;
    }

    return {
      message: responseText,
      actionTaken: 'MEMORY_SEARCH_AND_REPLY',
      searchResults: memoryContext,
    };
  }

  public getStatus() {
    const memoryStats = this.memoryEngine.getMemoryStats();
    const skills = this.skillManager.getAllSkills();

    return {
      agentName: 'JARVIS Agent',
      status: 'ONLINE',
      memoryStats,
      availableSkillsCount: skills.length,
      skills: skills.map(s => s.name),
    };
  }
}

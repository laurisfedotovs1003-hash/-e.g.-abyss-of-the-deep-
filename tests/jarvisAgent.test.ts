import { VaultManager } from '../src/memory/VaultManager';
import { MemoryEngine } from '../src/memory/MemoryEngine';
import { SkillManager } from '../src/skills/SkillManager';
import { JarvisAgent } from '../src/JarvisAgent';
import path from 'path';
import fs from 'fs-extra';

describe('JARVIS Core AI Agent Pipeline', () => {
  const testDir = path.join(__dirname, 'test-jarvis-agent');
  const vaultPath = path.join(testDir, 'vault');
  const skillsPath = path.join(testDir, 'skills');

  let jarvis: JarvisAgent;

  beforeEach(async () => {
    await fs.remove(testDir);
    const vm = new VaultManager(vaultPath);
    const me = new MemoryEngine(vm);
    const sm = new SkillManager(skillsPath);
    jarvis = new JarvisAgent(vm, me, sm);
    await jarvis.initialize();
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  test('JARVIS initializes and reports ONLINE status', () => {
    const status = jarvis.getStatus();
    expect(status.status).toBe('ONLINE');
    expect(status.availableSkillsCount).toBeGreaterThan(0);
  });

  test('JARVIS handles vault upgrade requests', async () => {
    const res = await jarvis.processRequest({ userMessage: 'Bitte vault upgraden' });
    expect(res.actionTaken).toBe('VAULT_UPGRADE');
    expect(res.message).toContain('Vault upgrade complete');
  });

  test('JARVIS handles dynamic skill creation requests', async () => {
    const res = await jarvis.processRequest({ userMessage: 'Erstelle skill name: translator' });
    expect(res.actionTaken).toBe('CREATE_SKILL');
    expect(res.skillOutput.name).toBe('translator');
  });

  test('JARVIS processes memory queries from second brain', async () => {
    const res = await jarvis.processRequest({ userMessage: 'Welcome to Your Second Brain' });
    expect(res.actionTaken).toBe('MEMORY_SEARCH_AND_REPLY');
    expect(res.searchResults?.length).toBeGreaterThan(0);
  });
});

import { VaultManager } from '../src/memory/VaultManager';
import { MemoryEngine } from '../src/memory/MemoryEngine';
import path from 'path';
import fs from 'fs-extra';

describe('Second Brain & Memory Engine', () => {
  const testVaultPath = path.join(__dirname, 'test-vault');

  beforeEach(async () => {
    await fs.remove(testVaultPath);
  });

  afterEach(async () => {
    await fs.remove(testVaultPath);
  });

  test('VaultManager creates initial notes and reads them', async () => {
    const vaultManager = new VaultManager(testVaultPath);
    await vaultManager.ensureVaultExists();

    const notes = await vaultManager.getAllNotes();
    expect(notes.length).toBeGreaterThanOrEqual(2);
    expect(notes.some(n => n.title.includes('Welcome'))).toBe(true);
  });

  test('VaultManager upgrades and links notes', async () => {
    const vaultManager = new VaultManager(testVaultPath);
    await vaultManager.saveNote('Project Alpha.md', 'Project Alpha', 'This is about Project Alpha.');
    await vaultManager.saveNote('Summary.md', 'Summary', 'Mentioning Project Alpha here without link.');

    const result = await vaultManager.upgradeAndOrganizeVault();
    expect(result.organizedCount).toBeGreaterThanOrEqual(1);

    const updatedSummary = await vaultManager.readNote('Summary.md');
    expect(updatedSummary?.content).toContain('[[Project Alpha]]');
  });

  test('MemoryEngine indexes and searches notes correctly', async () => {
    const vaultManager = new VaultManager(testVaultPath);
    await vaultManager.saveNote('AI.md', 'Artificial Intelligence', 'Neural networks and deep learning are core concepts of AI.');

    const memoryEngine = new MemoryEngine(vaultManager);
    const count = await memoryEngine.syncMemory();
    expect(count).toBeGreaterThan(0);

    const searchResults = memoryEngine.searchMemory('neural networks');
    expect(searchResults.length).toBeGreaterThan(0);
    expect(searchResults[0].title).toBe('Artificial Intelligence');
  });
});

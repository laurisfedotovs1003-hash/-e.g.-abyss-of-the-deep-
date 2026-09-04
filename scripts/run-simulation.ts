import path from 'path';
import fs from 'fs-extra';
import { VaultManager } from '../src/memory/VaultManager';
import { MemoryEngine } from '../src/memory/MemoryEngine';
import { SkillManager } from '../src/skills/SkillManager';
import { JarvisAgent } from '../src/JarvisAgent';

async function runSimulation() {
  console.log('====================================================');
  console.log('🧪 RUNNING END-TO-END OBSIDIAN SIMULATION FOR JARVIS');
  console.log('====================================================\n');

  const vaultPath = path.resolve('./sample-vault');
  const skillsPath = path.resolve('./skills/custom');

  console.log(`[1/5] Initializing Obsidian Vault at: ${vaultPath}`);
  const vaultManager = new VaultManager(vaultPath);
  await vaultManager.ensureVaultExists();

  console.log(`[2/5] Checking native Obsidian Plugin integration...`);
  const pluginManifest = path.join(vaultPath, '.obsidian/plugins/jarvis-obsidian-plugin/manifest.json');
  const pluginMain = path.join(vaultPath, '.obsidian/plugins/jarvis-obsidian-plugin/main.js');
  if (fs.existsSync(pluginManifest) && fs.existsSync(pluginMain)) {
    console.log('  ✅ Native Obsidian Plugin files verified in .obsidian/plugins/jarvis-obsidian-plugin/');
  } else {
    throw new Error('Obsidian plugin files missing!');
  }

  console.log(`[3/5] Syncing Second Brain Vector Memory...`);
  const memoryEngine = new MemoryEngine(vaultManager);
  const skillManager = new SkillManager(skillsPath);
  const jarvis = new JarvisAgent(vaultManager, memoryEngine, skillManager);

  await jarvis.initialize();
  const initialStatus = jarvis.getStatus();
  console.log(`  ✅ Memory synced: ${initialStatus.memoryStats.totalNotesIndexed} notes (${initialStatus.memoryStats.totalChunks} chunks) indexed.`);

  console.log(`[4/5] Simulating JARVIS Vault Auto-Upgrade & Linking...`);
  // Create two unlinked notes
  await vaultManager.saveNote('Deep Learning.md', 'Deep Learning', 'Deep Learning is a subfield of Artificial Intelligence focusing on neural networks.');
  await vaultManager.saveNote('Neural Networks Research.md', 'Neural Networks Research', 'We are researching Deep Learning applications for Obsidian agents.');

  const upgradeResult = await vaultManager.upgradeAndOrganizeVault();
  console.log(`  ✅ ${upgradeResult.summary}`);

  console.log(`[5/5] Simulating Dynamic Skill Creation inside Obsidian Agent...`);
  const skillRes = await jarvis.processRequest({
    userMessage: 'create skill name: obsidian_exporter'
  });
  console.log(`  ✅ ${skillRes.message}`);

  const finalStatus = jarvis.getStatus();
  console.log('\n====================================================');
  console.log('🎉 SIMULATION PASSED SUCCESSFULLY!');
  console.log(`Status: ${finalStatus.status} | Total Indexed Notes: ${finalStatus.memoryStats.totalNotesIndexed} | Active Skills: ${finalStatus.skills.join(', ')}`);
  console.log('====================================================\n');
}

runSimulation().catch(err => {
  console.error('❌ Simulation failed:', err);
  process.exit(1);
});

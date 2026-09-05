import readline from 'readline';
import { config } from '../config';
import { VaultManager } from '../memory/VaultManager';
import { MemoryEngine } from '../memory/MemoryEngine';
import { SkillManager } from '../skills/SkillManager';
import { JarvisAgent } from '../JarvisAgent';

async function runCLI() {
  console.log('----------------------------------------------------');
  console.log('🤖 INITIALIZING JARVIS OBSIDIAN AGENT CLI...');
  console.log('----------------------------------------------------');

  const vaultManager = new VaultManager(config.vaultPath);
  const memoryEngine = new MemoryEngine(vaultManager);
  const skillManager = new SkillManager();

  const jarvis = new JarvisAgent(vaultManager, memoryEngine, skillManager);
  await jarvis.initialize();

  const status = jarvis.getStatus();
  console.log(`[STATUS] Agent ${status.status} | Indexed Chunks: ${status.memoryStats.totalChunks} | Skills: ${status.skills.join(', ')}`);
  console.log('\nType your query or command (e.g., "upgrade vault", "calculate 12 * 4", "create skill name: summarizer", or "exit"):\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'JARVIS> ',
  });

  rl.prompt();

  rl.on('line', async (line) => {
    const input = line.trim();
    if (input.toLowerCase() === 'exit') {
      console.log('Shutting down JARVIS agent CLI...');
      process.exit(0);
    }

    try {
      const response = await jarvis.processRequest({ userMessage: input });
      console.log(`\n${response.message}\n`);
    } catch (err: any) {
      console.error('Error processing request:', err.message);
    }

    rl.prompt();
  });
}

runCLI().catch(console.error);

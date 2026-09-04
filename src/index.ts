import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config';
import { VaultManager } from './memory/VaultManager';
import { MemoryEngine } from './memory/MemoryEngine';
import { SkillManager } from './skills/SkillManager';
import { JarvisAgent } from './JarvisAgent';

async function bootstrap() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '../public')));

  const vaultManager = new VaultManager(config.vaultPath);
  const memoryEngine = new MemoryEngine(vaultManager);
  const skillManager = new SkillManager();

  const jarvis = new JarvisAgent(vaultManager, memoryEngine, skillManager);
  await jarvis.initialize();

  // API Endpoints
  app.get('/api/status', (req, res) => {
    res.json(jarvis.getStatus());
  });

  app.post('/api/chat', async (req, res) => {
    try {
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const agentResponse = await jarvis.processRequest({ userMessage: message });
      res.json(agentResponse);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Internal Agent Error' });
    }
  });

  app.post('/api/vault/upgrade', async (req, res) => {
    try {
      const result = await vaultManager.upgradeAndOrganizeVault();
      await memoryEngine.syncMemory();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.listen(config.port, () => {
    console.log(`[JARVIS SERVER] Running on http://localhost:${config.port}`);
  });
}

if (require.main === module) {
  bootstrap().catch(console.error);
}

export { bootstrap };

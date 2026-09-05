import request from 'supertest';
import express from 'express';
import path from 'path';
import fs from 'fs-extra';
import { VaultManager } from '../src/memory/VaultManager';
import { MemoryEngine } from '../src/memory/MemoryEngine';
import { SkillManager } from '../src/skills/SkillManager';
import { JarvisAgent } from '../src/JarvisAgent';

describe('JARVIS Web API Endpoints', () => {
  const testDir = path.join(__dirname, 'test-server');
  let app: express.Application;

  beforeAll(async () => {
    await fs.remove(testDir);
    const vm = new VaultManager(path.join(testDir, 'vault'));
    const me = new MemoryEngine(vm);
    const sm = new SkillManager(path.join(testDir, 'skills'));
    const jarvis = new JarvisAgent(vm, me, sm);
    await jarvis.initialize();

    app = express();
    app.use(express.json());

    app.get('/api/status', (req, res) => res.json(jarvis.getStatus()));
    app.post('/api/chat', async (req, res) => {
      const response = await jarvis.processRequest({ userMessage: req.body.message });
      res.json(response);
    });
  });

  afterAll(async () => {
    await fs.remove(testDir);
  });

  test('GET /api/status returns ONLINE status and statistics', async () => {
    const res = await request(app).get('/api/status');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ONLINE');
    expect(res.body.memoryStats).toBeDefined();
  });

  test('POST /api/chat processes message and returns response', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'calculate 50 + 50' });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('100');
  });
});

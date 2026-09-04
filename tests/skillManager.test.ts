import { SkillManager } from '../src/skills/SkillManager';
import path from 'path';
import fs from 'fs-extra';

describe('Skill & Plugin System', () => {
  const testSkillsDir = path.join(__dirname, 'test-skills');

  beforeEach(async () => {
    await fs.remove(testSkillsDir);
  });

  afterEach(async () => {
    await fs.remove(testSkillsDir);
  });

  test('SkillManager initializes and includes built-in skills', async () => {
    const manager = new SkillManager(testSkillsDir);
    await manager.init();

    const skills = manager.getAllSkills();
    expect(skills.length).toBeGreaterThanOrEqual(2);
    expect(skills.some(s => s.name === 'calculator')).toBe(true);
    expect(skills.some(s => s.name === 'web_search')).toBe(true);
  });

  test('SkillManager executes builtin skill', async () => {
    const manager = new SkillManager(testSkillsDir);
    await manager.init();

    const res = await manager.executeSkill('calculator', { expression: '10 + 20 * 2' });
    expect(res.result).toBe(50);
  });

  test('SkillManager creates and executes dynamic skill', async () => {
    const manager = new SkillManager(testSkillsDir);
    await manager.init();

    const dynamicSkillMeta = await manager.createDynamicSkill(
      'text_reverser',
      'Reverses a given string input',
      { text: { type: 'string', description: 'String to reverse', required: true } },
      `return { reversed: args.text.split('').reverse().join('') };`
    );

    expect(dynamicSkillMeta.name).toBe('text_reverser');

    const res = await manager.executeSkill('text_reverser', { text: 'JARVIS' });
    expect(res.reversed).toBe('SIVRAJ');
  });
});

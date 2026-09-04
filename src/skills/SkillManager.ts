import fs from 'fs-extra';
import path from 'path';

export interface SkillMetadata {
  name: string;
  description: string;
  parameters: Record<string, { type: string; description: string; required?: boolean }>;
}

export interface Skill {
  metadata: SkillMetadata;
  execute: (args: Record<string, any>, context?: any) => Promise<any>;
}

export class SkillManager {
  private skills: Map<string, Skill> = new Map();
  private skillsDir: string;

  constructor(skillsDir: string = path.join(__dirname, '../skills/custom')) {
    this.skillsDir = skillsDir;
  }

  public async init(): Promise<void> {
    await fs.mkdirp(this.skillsDir);
    this.registerBuiltinSkills();
    await this.loadCustomSkills();
  }

  public registerSkill(skill: Skill): void {
    this.skills.set(skill.metadata.name.toLowerCase(), skill);
  }

  public getSkill(name: string): Skill | undefined {
    return this.skills.get(name.toLowerCase());
  }

  public getAllSkills(): SkillMetadata[] {
    return Array.from(this.skills.values()).map(s => s.metadata);
  }

  public async executeSkill(name: string, args: Record<string, any>, context?: any): Promise<any> {
    const skill = this.getSkill(name);
    if (!skill) {
      throw new Error(`Skill '${name}' not found.`);
    }
    return await skill.execute(args, context);
  }

  public async createDynamicSkill(
    name: string,
    description: string,
    parameters: Record<string, { type: string; description: string; required?: boolean }>,
    codeJs: string
  ): Promise<SkillMetadata> {
    const skillName = name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const skillFilePath = path.join(this.skillsDir, `${skillName}.js`);

    const fileContent = `
module.exports = {
  metadata: ${JSON.stringify({ name: skillName, description, parameters }, null, 2)},
  execute: async function(args, context) {
    ${codeJs}
  }
};
`;

    await fs.writeFile(skillFilePath, fileContent, 'utf-8');

    // Dynamically require and register
    delete require.cache[require.resolve(skillFilePath)];
    const loadedModule = require(skillFilePath);
    this.registerSkill(loadedModule);

    return loadedModule.metadata;
  }

  private registerBuiltinSkills(): void {
    // Built-in Skill 1: Calculator
    this.registerSkill({
      metadata: {
        name: 'calculator',
        description: 'Performs basic mathematical evaluation.',
        parameters: {
          expression: { type: 'string', description: 'Math expression to evaluate, e.g. 15 * 4 + 10', required: true },
        },
      },
      execute: async (args) => {
        const expr = args.expression;
        if (!/^[0-9+\-*/().\s]+$/.test(expr)) {
          throw new Error('Invalid math expression syntax.');
        }
        // eslint-disable-next-line no-eval
        const result = Function(`"use strict"; return (${expr})`)();
        return { result };
      },
    });

    // Built-in Skill 2: Web Search Mock / Summary
    this.registerSkill({
      metadata: {
        name: 'web_search',
        description: 'Searches the web for given query and returns summarized results.',
        parameters: {
          query: { type: 'string', description: 'Search query', required: true },
        },
      },
      execute: async (args) => {
        return {
          query: args.query,
          results: [
            { title: `Latest Insights on ${args.query}`, snippet: `Comprehensive report regarding ${args.query} with latest updates and data.` },
          ],
        };
      },
    });
  }

  private async loadCustomSkills(): Promise<void> {
    if (!fs.existsSync(this.skillsDir)) return;

    const files = await fs.readdir(this.skillsDir);
    for (const file of files) {
      if (file.endsWith('.js')) {
        try {
          const filePath = path.join(this.skillsDir, file);
          delete require.cache[require.resolve(filePath)];
          const loadedModule = require(filePath);
          if (loadedModule && loadedModule.metadata && loadedModule.execute) {
            this.registerSkill(loadedModule);
          }
        } catch (err) {
          console.error(`Failed to load custom skill ${file}:`, err);
        }
      }
    }
  }
}

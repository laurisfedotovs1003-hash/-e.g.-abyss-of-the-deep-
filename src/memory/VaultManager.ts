import fs from 'fs-extra';
import path from 'path';
import matter from 'front-matter';

export interface Note {
  path: string;
  relativePath: string;
  title: string;
  content: string;
  frontmatter: Record<string, any>;
  tags: string[];
  links: string[];
  updatedAt: Date;
}

export class VaultManager {
  private vaultPath: string;

  constructor(vaultPath: string) {
    this.vaultPath = path.resolve(vaultPath);
  }

  public async ensureVaultExists(): Promise<void> {
    if (!fs.existsSync(this.vaultPath)) {
      await fs.mkdirp(this.vaultPath);
      // Create initial sample notes if vault is empty
      await this.createSampleNotes();
    }
  }

  private async createSampleNotes(): Promise<void> {
    const welcomeNote = `---
title: Welcome to JARVIS Brain
tags: [welcome, second-brain, obsidian]
created: ${new Date().toISOString()}
---

# Welcome to Your Second Brain

This is your Obsidian Vault managed by **JARVIS**.

## Features
- Automatic note indexer and vector search
- Vault upgraders & organizers
- Dynamic Skill & Plugin Creation

[[JARVIS System Info]]
`;

    const systemInfoNote = `---
title: JARVIS System Info
tags: [system, jarvis, architecture]
created: ${new Date().toISOString()}
---

# JARVIS System Architecture

JARVIS continuously upgrades your Obsidian vault, maintains long-term memory, and builds new plugins and skills on demand.

- Core LLM Orchestrator
- Dynamic Skill Executor
- Second Brain Vector Memory
`;

    await fs.writeFile(path.join(this.vaultPath, 'Welcome.md'), welcomeNote, 'utf-8');
    await fs.writeFile(path.join(this.vaultPath, 'JARVIS System Info.md'), systemInfoNote, 'utf-8');
  }

  public async getAllNotes(): Promise<Note[]> {
    await this.ensureVaultExists();
    const notes: Note[] = [];

    const walkDir = async (dir: string) => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (!entry.name.startsWith('.')) {
            await walkDir(fullPath);
          }
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          const note = await this.readNote(fullPath);
          if (note) notes.push(note);
        }
      }
    };

    await walkDir(this.vaultPath);
    return notes;
  }

  public async readNote(filePath: string): Promise<Note | null> {
    try {
      const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(this.vaultPath, filePath);
      if (!fs.existsSync(absolutePath)) return null;

      const fileContent = await fs.readFile(absolutePath, 'utf-8');
      const stats = await fs.stat(absolutePath);
      const parsed = matter<Record<string, any>>(fileContent);

      const title = parsed.attributes.title || path.basename(filePath, '.md');
      const tags = this.extractTags(parsed.body, parsed.attributes);
      const links = this.extractLinks(parsed.body);

      return {
        path: absolutePath,
        relativePath: path.relative(this.vaultPath, absolutePath),
        title,
        content: parsed.body,
        frontmatter: parsed.attributes,
        tags,
        links,
        updatedAt: stats.mtime,
      };
    } catch (error) {
      console.error(`Error reading note ${filePath}:`, error);
      return null;
    }
  }

  public async saveNote(relativePath: string, title: string, content: string, frontmatter: Record<string, any> = {}): Promise<Note> {
    await this.ensureVaultExists();
    let cleanRelPath = relativePath.endsWith('.md') ? relativePath : `${relativePath}.md`;
    const fullPath = path.join(this.vaultPath, cleanRelPath);

    await fs.mkdirp(path.dirname(fullPath));

    const fmObj = {
      title,
      updated: new Date().toISOString(),
      ...frontmatter,
    };

    const fmLines = ['---'];
    for (const [k, v] of Object.entries(fmObj)) {
      if (Array.isArray(v)) {
        fmLines.push(`${k}: [${v.join(', ')}]`);
      } else {
        fmLines.push(`${k}: ${v}`);
      }
    }
    fmLines.push('---', '');

    const fileContent = `${fmLines.join('\n')}\n${content.trim()}\n`;
    await fs.writeFile(fullPath, fileContent, 'utf-8');

    const updatedNote = await this.readNote(fullPath);
    return updatedNote!;
  }

  public async upgradeAndOrganizeVault(): Promise<{ organizedCount: number; linksAdded: number; summary: string }> {
    const notes = await this.getAllNotes();
    let organizedCount = 0;
    let linksAdded = 0;

    // Build index of titles
    const noteTitles = notes.map(n => n.title.toLowerCase());

    for (const note of notes) {
      let modified = false;
      let newContent = note.content;

      // Auto-linking: link mentions of other note titles if not already linked
      for (const otherNote of notes) {
        if (otherNote.title.length < 3 || otherNote.path === note.path) continue;

        const regex = new RegExp(`\\b(${otherNote.title})\\b(?![^\\[]*\\]\\])`, 'gi');
        if (regex.test(newContent) && !newContent.includes(`[[${otherNote.title}]]`)) {
          newContent = newContent.replace(regex, `[[$1]]`);
          modified = true;
          linksAdded++;
        }
      }

      if (modified) {
        await this.saveNote(note.relativePath, note.title, newContent, note.frontmatter);
        organizedCount++;
      }
    }

    return {
      organizedCount,
      linksAdded,
      summary: `Upgraded ${notes.length} notes in vault. Organized ${organizedCount} files and auto-created ${linksAdded} wiki links.`,
    };
  }

  private extractTags(content: string, frontmatter: Record<string, any>): string[] {
    const tagsSet = new Set<string>();

    if (frontmatter.tags) {
      if (Array.isArray(frontmatter.tags)) {
        frontmatter.tags.forEach(t => tagsSet.add(t.toString()));
      } else if (typeof frontmatter.tags === 'string') {
        frontmatter.tags.split(',').forEach(t => tagsSet.add(t.trim()));
      }
    }

    const tagRegex = /#([a-zA-Z0-9_\/-]+)/g;
    let match;
    while ((match = tagRegex.exec(content)) !== null) {
      tagsSet.add(match[1]);
    }

    return Array.from(tagsSet);
  }

  private extractLinks(content: string): string[] {
    const linksSet = new Set<string>();
    const linkRegex = /\[\[(.*?)\]\]/g;
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      const rawLink = match[1].split('|')[0].trim();
      if (rawLink) linksSet.add(rawLink);
    }
    return Array.from(linksSet);
  }
}

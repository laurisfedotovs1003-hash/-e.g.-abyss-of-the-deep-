import { VaultManager, Note } from './VaultManager';

export interface MemoryItem {
  id: string;
  sourcePath: string;
  title: string;
  contentChunk: string;
  tags: string[];
  tokens: string[];
  updatedAt: Date;
}

export class MemoryEngine {
  private vaultManager: VaultManager;
  private memoryStore: MemoryItem[] = [];

  constructor(vaultManager: VaultManager) {
    this.vaultManager = vaultManager;
  }

  public async syncMemory(): Promise<number> {
    const notes = await this.vaultManager.getAllNotes();
    this.memoryStore = [];

    for (const note of notes) {
      const chunks = this.chunkContent(note.content, 400);
      chunks.forEach((chunk, index) => {
        const tokens = this.tokenize(`${note.title} ${chunk} ${note.tags.join(' ')}`);
        this.memoryStore.push({
          id: `${note.relativePath}_chunk_${index}`,
          sourcePath: note.relativePath,
          title: note.title,
          contentChunk: chunk,
          tags: note.tags,
          tokens,
          updatedAt: note.updatedAt,
        });
      });
    }

    return this.memoryStore.length;
  }

  public searchMemory(query: string, topK: number = 5): MemoryItem[] {
    const queryTokens = this.tokenize(query);
    if (queryTokens.length === 0) return [];

    const scored = this.memoryStore.map(item => {
      let score = 0;
      for (const token of queryTokens) {
        if (item.tokens.includes(token)) {
          score += 1;
        }
        if (item.title.toLowerCase().includes(token)) {
          score += 3;
        }
        if (item.tags.some(t => t.toLowerCase().includes(token))) {
          score += 2;
        }
      }
      return { item, score };
    });

    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(s => s.item);
  }

  public getMemoryStats(): { totalChunks: number; totalNotesIndexed: number; uniqueTags: string[] } {
    const uniqueNotes = new Set(this.memoryStore.map(m => m.sourcePath));
    const tags = new Set<string>();
    this.memoryStore.forEach(m => m.tags.forEach(t => tags.add(t)));

    return {
      totalChunks: this.memoryStore.length,
      totalNotesIndexed: uniqueNotes.size,
      uniqueTags: Array.from(tags),
    };
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-zA-Z0-9äöüÄÖÜß\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);
  }

  private chunkContent(text: string, maxChars: number = 400): string[] {
    if (!text || text.trim().length === 0) return [''];
    const paragraphs = text.split(/\n\n+/);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const para of paragraphs) {
      if ((currentChunk + para).length > maxChars && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = para;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + para;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }
}

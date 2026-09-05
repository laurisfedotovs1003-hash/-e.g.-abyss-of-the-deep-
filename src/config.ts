import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export interface Config {
  port: number;
  vaultPath: string;
  llmProvider: 'mock' | 'openai' | 'anthropic' | 'ollama';
  openaiApiKey: string;
  anthropicApiKey: string;
  ollamaBaseUrl: string;
  openaiModel: string;
}

export const config: Config = {
  port: parseInt(process.env.PORT || '3000', 10),
  vaultPath: path.resolve(process.env.OBSIDIAN_VAULT_PATH || './sample-vault'),
  llmProvider: (process.env.LLM_PROVIDER as any) || 'mock',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o',
};

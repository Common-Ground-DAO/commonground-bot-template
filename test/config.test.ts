import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.js';

const valid = {
  CG_URL: 'https://cg.example',
  CG_BOT_TOKEN: 'cgb_secret',
  CG_COMMUNITY_ID: '00000000-0000-4000-8000-000000000001',
  CG_CHANNEL_ID: '00000000-0000-4000-8000-000000000002',
};

describe('configuration', () => {
  it('defaults to safe hello mode', () => {
    const config = loadConfig(valid);
    expect(config.mode).toBe('hello');
    expect(config.trigger).toBe('!bot');
    expect(config.cgUrl).toBe('https://cg.example');
  });

  it('requires a key in OpenAI mode', () => {
    expect(() => loadConfig({ ...valid, BOT_MODE: 'openai' })).toThrow('OPENAI_API_KEY');
  });

  it('accepts OpenAI mode with an explicit model', () => {
    const config = loadConfig({
      ...valid,
      BOT_MODE: 'openai',
      OPENAI_API_KEY: 'test-only',
      OPENAI_MODEL: 'gpt-example',
    });
    expect(config.openAiModel).toBe('gpt-example');
  });
});

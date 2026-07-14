import { describe, expect, it } from 'vitest';
import { extractText, isMentioned, matchTrigger, textBody } from '../src/message.js';

describe('message helpers', () => {
  it('extracts only safe textual content', () => {
    expect(
      extractText({
        version: '1',
        content: [
          { type: 'text', value: '!bot first' },
          { type: 'newline' },
          { type: 'mention', userId: 'bot-id', alias: 'Ignored Bot' },
          { type: 'text', value: 'second' },
        ],
      }),
    ).toBe('!bot first\nsecond');
  });

  it('matches selected mentions by immutable user ID', () => {
    const body = {
      version: '1' as const,
      content: [{ type: 'mention', userId: 'bot-id', alias: 'Renamable Bot' }],
    };
    expect(isMentioned(body, 'bot-id')).toBe(true);
    expect(isMentioned(body, 'different-id')).toBe(false);
  });

  it('matches an exact trigger and a trigger with input', () => {
    expect(matchTrigger('!bot', '!bot')).toBe('');
    expect(matchTrigger(' !bot explain this ', '!bot')).toBe('explain this');
    expect(matchTrigger('!botany', '!bot')).toBeNull();
    expect(matchTrigger('hello', '!bot')).toBeNull();
  });

  it('can intentionally match every non-empty message', () => {
    expect(matchTrigger(' hello ', '')).toBe('hello');
    expect(matchTrigger('   ', '')).toBeNull();
  });

  it('creates a v1 text body', () => {
    expect(textBody('hello')).toEqual({ version: '1', content: [{ type: 'text', value: 'hello' }] });
  });
});

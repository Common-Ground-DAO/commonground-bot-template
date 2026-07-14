import { describe, expect, it } from 'vitest';
import { extractText, matchTrigger, textBody } from '../src/message.js';

describe('message helpers', () => {
  it('extracts only safe textual content', () => {
    expect(
      extractText({
        version: '1',
        content: [
          { type: 'text', value: '!bot first' },
          { type: 'newline' },
          { type: 'mention', value: 'ignored' },
          { type: 'text', value: 'second' },
        ],
      }),
    ).toBe('!bot first\nsecond');
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

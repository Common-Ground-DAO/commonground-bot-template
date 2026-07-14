import { describe, expect, it, vi } from 'vitest';
import { resolveInvocation } from '../src/invocation.js';
import type { ApiMessage } from '../src/types.js';

const baseMessage: ApiMessage = {
  id: 'message-id',
  creatorId: 'human-id',
  channelId: 'channel-id',
  body: { version: '1', content: [{ type: 'text', value: 'hello' }] },
  parentMessageId: null,
  createdAt: '2026-07-14T00:00:00.000Z',
  updatedAt: '2026-07-14T00:00:00.000Z',
  creatorIsBot: false,
};

describe('resolveInvocation', () => {
  it('activates only the uniquely mentioned bot and strips the mention from text', async () => {
    const load = vi.fn().mockResolvedValue([]);
    const result = await resolveInvocation({
      ...baseMessage,
      body: {
        version: '1',
        content: [
          { type: 'mention', userId: 'bot-id', alias: 'Bot Lab Assistant' },
          { type: 'text', value: ' explain this' },
        ],
      },
    }, 'bot-id', '!bot', load);

    expect(result).toMatchObject({ mentioned: true, input: 'explain this', shouldRespond: true });
    expect(load).not.toHaveBeenCalled();
  });

  it('activates when the message replies to this bot', async () => {
    const load = vi.fn().mockResolvedValue([{ ...baseMessage, id: 'parent-id', creatorId: 'bot-id' }]);
    const result = await resolveInvocation(
      { ...baseMessage, parentMessageId: 'parent-id' },
      'bot-id',
      '!bot',
      load,
    );

    expect(result).toMatchObject({ replyToBot: true, input: 'hello', shouldRespond: true });
    expect(load).toHaveBeenCalledWith(['parent-id']);
  });

  it('continues to support arbitrary bot-owned text triggers', async () => {
    const result = await resolveInvocation(
      { ...baseMessage, body: { version: '1', content: [{ type: 'text', value: '!yourmom be concise' }] } },
      'bot-id',
      '!yourmom',
      vi.fn().mockResolvedValue([]),
    );
    expect(result).toMatchObject({ triggerMatched: true, input: 'be concise', shouldRespond: true });
  });

  it('ignores messages created by bots to prevent mention and reply loops', async () => {
    const load = vi.fn().mockResolvedValue([{ ...baseMessage, id: 'parent-id', creatorId: 'bot-id' }]);
    const result = await resolveInvocation({
      ...baseMessage,
      creatorId: 'other-bot-id',
      creatorIsBot: true,
      parentMessageId: 'parent-id',
      body: { version: '1', content: [{ type: 'mention', userId: 'bot-id', alias: 'Bot' }] },
    }, 'bot-id', '', load);

    expect(result).toMatchObject({ senderIsBot: true, shouldRespond: false });
    expect(load).not.toHaveBeenCalled();
  });
});

import { describe, expect, it, vi } from 'vitest';
import { CommonGroundApiError, CommonGroundClient } from '../src/cg-client.js';

const communityId = '00000000-0000-4000-8000-000000000001';
const channelId = '00000000-0000-4000-8000-000000000002';

describe('CommonGroundClient', () => {
  it('authenticates without exposing the token in the URL', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({ status: 'OK', data: { protocolVersion: '1', userId: 'u', deviceId: 'd', tokenId: 't' } }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );
    const client = new CommonGroundClient('https://cg.example', 'cgb_secret', communityId, channelId, fetchMock);
    await expect(client.whoami()).resolves.toEqual({ protocolVersion: '1', userId: 'u', deviceId: 'd', tokenId: 't' });

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://cg.example/api/bot/v1/whoami');
    expect(String(url)).not.toContain('cgb_secret');
    expect(new Headers(init?.headers).get('authorization')).toBe('Bearer cgb_secret');
  });

  it('loads reply parents through the versioned bot message surface', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ status: 'OK', data: [] }), { status: 200 }),
    );
    const client = new CommonGroundClient('https://cg.example', 'cgb_secret', communityId, channelId, fetchMock);
    await client.messagesById(['parent-id']);

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://cg.example/api/bot/v1/messages/messagesById');
    expect(JSON.parse(String(init?.body))).toEqual({
      access: { communityId, channelId },
      messageIds: ['parent-id'],
    });
  });

  it('surfaces error envelopes', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ status: 'ERROR', error: 'NOT_ALLOWED' }), { status: 403 }),
    );
    const client = new CommonGroundClient('https://cg.example', 'cgb_secret', communityId, channelId, fetchMock);
    await expect(client.whoami()).rejects.toEqual(
      expect.objectContaining<Partial<CommonGroundApiError>>({ message: expect.stringContaining('NOT_ALLOWED') }),
    );
  });
});

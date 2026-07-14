import type { ApiEnvelope, ApiMessage, BotIdentity } from './types.js';
import { textBody } from './message.js';

export class CommonGroundApiError extends Error {
  constructor(
    message: string,
    readonly httpStatus?: number,
  ) {
    super(message);
    this.name = 'CommonGroundApiError';
  }
}

export class CommonGroundClient {
  constructor(
    private readonly baseUrl: string,
    private readonly token: string,
    private readonly communityId: string,
    private readonly channelId: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async whoami(): Promise<BotIdentity> {
    return this.post<BotIdentity>('/api/bot/v1/whoami', {});
  }

  async messagesById(messageIds: string[]): Promise<ApiMessage[]> {
    return this.post<ApiMessage[]>('/api/bot/v1/messages/messagesById', {
      access: { communityId: this.communityId, channelId: this.channelId },
      messageIds,
    });
  }

  async reply(parentMessageId: string, value: string): Promise<ApiMessage> {
    return this.post<ApiMessage>('/api/bot/v1/messages/createMessage', {
      id: crypto.randomUUID(),
      access: { communityId: this.communityId, channelId: this.channelId },
      body: textBody(value),
      parentMessageId,
      attachments: [],
    });
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${this.token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20_000),
    });

    let envelope: ApiEnvelope<T> | undefined;
    try {
      envelope = (await response.json()) as ApiEnvelope<T>;
    } catch {
      throw new CommonGroundApiError(`Common Ground returned invalid JSON (${response.status})`, response.status);
    }

    if (!response.ok) {
      const detail = envelope.status === 'ERROR' ? `: ${envelope.error}` : '';
      throw new CommonGroundApiError(`Common Ground request failed (${response.status})${detail}`, response.status);
    }
    if (envelope.status !== 'OK') throw new CommonGroundApiError(envelope.error);
    return envelope.data;
  }
}

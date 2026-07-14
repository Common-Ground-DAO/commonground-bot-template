import { io, type Socket } from 'socket.io-client';
import type { Config } from './config.js';
import { CommonGroundClient } from './cg-client.js';
import type { HealthState } from './health.js';
import type { Logger } from './logger.js';
import { extractText, matchTrigger } from './message.js';
import type { MessageEvent } from './types.js';
import type { Responder } from './responder.js';

const MAX_SEEN_MESSAGES = 2_000;

export class CommunityBot {
  private socket?: Socket;
  private botUserId?: string;
  private queue: Promise<void> = Promise.resolve();
  private readonly seen = new Set<string>();

  constructor(
    private readonly config: Config,
    private readonly api: CommonGroundClient,
    private readonly responder: Responder,
    private readonly logger: Logger,
    private readonly health: HealthState,
  ) {}

  async start(): Promise<void> {
    const identity = await this.api.whoami();
    this.botUserId = identity.userId;
    this.health.authenticated = true;
    this.logger.info('Authenticated with Common Ground', { botUserId: identity.userId });

    this.socket = io(this.config.cgUrl, {
      path: '/api/ws/',
      auth: { token: this.config.botToken },
      reconnection: true,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 15_000,
      timeout: 20_000,
    });

    this.socket.on('connect', () => {
      this.health.socketConnected = true;
      this.logger.info('Connected to Common Ground events', { socketId: this.socket?.id });
    });
    this.socket.on('disconnect', (reason) => {
      this.health.socketConnected = false;
      this.logger.warn('Disconnected from Common Ground events', { reason });
      // Socket.IO normally reconnects automatically. A server-initiated
      // disconnect is the exception, so explicitly reactivate the socket after
      // Common Ground restarts or deliberately cycles its WebSocket service.
      if (reason === 'io server disconnect') this.socket?.connect();
    });
    this.socket.on('connect_error', (error) => {
      this.health.socketConnected = false;
      this.health.errors += 1;
      this.logger.error('Common Ground event connection failed', { error });
    });
    this.socket.on('cliMessageEvent', (event: MessageEvent) => {
      this.queue = this.queue.then(() => this.handleEvent(event)).catch((error: unknown) => {
        this.health.errors += 1;
        this.logger.error('Message processing failed', { error });
      });
    });
  }

  async stop(): Promise<void> {
    this.socket?.disconnect();
    await this.queue;
  }

  private async handleEvent(event: MessageEvent): Promise<void> {
    if (event.action !== 'new') return;
    const message = event.data;
    if (message.channelId !== this.config.channelId) return;
    if (message.creatorId === this.botUserId) return;
    if (this.seen.has(message.id)) return;
    this.remember(message.id);
    this.health.processed += 1;

    const input = matchTrigger(extractText(message.body), this.config.trigger);
    if (input === null) return;

    this.logger.info('Matched a community message', { messageId: message.id, channelId: message.channelId });
    const output = await this.responder(input);
    await this.api.reply(message.id, output.slice(0, 8_000));
    this.health.replied += 1;
    this.logger.info('Replied to a community message', { messageId: message.id });
  }

  private remember(id: string): void {
    this.seen.add(id);
    if (this.seen.size <= MAX_SEEN_MESSAGES) return;
    const oldest = this.seen.values().next().value as string | undefined;
    if (oldest) this.seen.delete(oldest);
  }
}

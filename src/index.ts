import { CommunityBot } from './bot.js';
import { CommonGroundClient } from './cg-client.js';
import { loadConfig } from './config.js';
import { startHealthServer, type HealthState } from './health.js';
import { createLogger } from './logger.js';
import { createResponder } from './responder.js';

async function main(): Promise<void> {
  const config = loadConfig();
  const logger = createLogger(config.logLevel);
  const state: HealthState = {
    startedAt: new Date().toISOString(),
    authenticated: false,
    socketConnected: false,
    processed: 0,
    replied: 0,
    errors: 0,
  };
  const healthServer = startHealthServer(config.healthPort, state);
  const api = new CommonGroundClient(
    config.cgUrl,
    config.botToken,
    config.communityId,
    config.channelId,
  );
  const bot = new CommunityBot(config, api, createResponder(config), logger, state);

  const shutdown = async (signal: string) => {
    logger.info('Shutting down', { signal });
    await bot.stop();
    healthServer.close();
    process.exit(0);
  };
  process.once('SIGINT', () => void shutdown('SIGINT'));
  process.once('SIGTERM', () => void shutdown('SIGTERM'));

  await bot.start();
  logger.info('Community bot is running', {
    mode: config.mode,
    communityId: config.communityId,
    channelId: config.channelId,
    trigger: config.trigger || '(every message)',
  });
}

main().catch((error: unknown) => {
  process.stderr.write(
    `${JSON.stringify({ time: new Date().toISOString(), level: 'fatal', message: 'Startup failed', error: error instanceof Error ? error.message : String(error) })}\n`,
  );
  process.exit(1);
});

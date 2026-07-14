export type BotMode = 'hello' | 'openai';

export type Config = {
  cgUrl: string;
  botToken: string;
  communityId: string;
  channelId: string;
  mode: BotMode;
  trigger: string;
  openAiApiKey?: string;
  openAiModel: string;
  systemPrompt: string;
  healthPort: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function required(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const cgUrl = required(env, 'CG_URL').replace(/\/+$/, '');
  const botToken = required(env, 'CG_BOT_TOKEN');
  const communityId = required(env, 'CG_COMMUNITY_ID');
  const channelId = required(env, 'CG_CHANNEL_ID');
  const mode = (env.BOT_MODE?.trim() || 'hello') as BotMode;
  const healthPort = Number.parseInt(env.HEALTH_PORT || '3000', 10);
  const logLevel = (env.LOG_LEVEL?.trim() || 'info') as Config['logLevel'];

  if (!/^https?:\/\//.test(cgUrl)) throw new Error('CG_URL must be an http(s) URL');
  if (!botToken.startsWith('cgb_')) throw new Error('CG_BOT_TOKEN must start with cgb_');
  if (!UUID.test(communityId)) throw new Error('CG_COMMUNITY_ID must be a UUID');
  if (!UUID.test(channelId)) throw new Error('CG_CHANNEL_ID must be a UUID');
  if (mode !== 'hello' && mode !== 'openai') throw new Error('BOT_MODE must be hello or openai');
  if (mode === 'openai' && !env.OPENAI_API_KEY?.trim()) {
    throw new Error('OPENAI_API_KEY is required when BOT_MODE=openai');
  }
  if (!Number.isInteger(healthPort) || healthPort < 1 || healthPort > 65_535) {
    throw new Error('HEALTH_PORT must be a valid TCP port');
  }
  if (!['debug', 'info', 'warn', 'error'].includes(logLevel)) {
    throw new Error('LOG_LEVEL must be debug, info, warn, or error');
  }

  return {
    cgUrl,
    botToken,
    communityId,
    channelId,
    mode,
    trigger: env.BOT_TRIGGER?.trim() ?? '!bot',
    ...(env.OPENAI_API_KEY?.trim() ? { openAiApiKey: env.OPENAI_API_KEY.trim() } : {}),
    openAiModel: env.OPENAI_MODEL?.trim() || 'gpt-5.6-luna',
    systemPrompt:
      env.BOT_SYSTEM_PROMPT?.trim() ||
      'You are a concise, helpful community assistant. Never claim to have taken an action you did not take.',
    healthPort,
    logLevel,
  };
}

const priorities = { debug: 10, info: 20, warn: 30, error: 40 } as const;
type Level = keyof typeof priorities;

export type Logger = {
  debug: (message: string, fields?: Record<string, unknown>) => void;
  info: (message: string, fields?: Record<string, unknown>) => void;
  warn: (message: string, fields?: Record<string, unknown>) => void;
  error: (message: string, fields?: Record<string, unknown>) => void;
};

function safeError(value: unknown): unknown {
  if (value instanceof Error) return { name: value.name, message: value.message };
  return value;
}

export function createLogger(minimumLevel: Level): Logger {
  const write = (level: Level, message: string, fields: Record<string, unknown> = {}) => {
    if (priorities[level] < priorities[minimumLevel]) return;
    const record = Object.fromEntries(
      Object.entries(fields)
        .filter(([key]) => !/(token|authorization|api.?key|cookie)/i.test(key))
        .map(([key, value]) => [key, safeError(value)]),
    );
    const line = JSON.stringify({ time: new Date().toISOString(), level, message, ...record });
    (level === 'error' ? process.stderr : process.stdout).write(`${line}\n`);
  };

  return {
    debug: (message, fields) => write('debug', message, fields),
    info: (message, fields) => write('info', message, fields),
    warn: (message, fields) => write('warn', message, fields),
    error: (message, fields) => write('error', message, fields),
  };
}

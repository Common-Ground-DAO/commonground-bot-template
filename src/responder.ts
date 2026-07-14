import OpenAI from 'openai';
import type { Config } from './config.js';

export type Responder = (input: string) => Promise<string>;

export function createResponder(config: Config): Responder {
  if (config.mode === 'hello') return async () => 'hello';

  const client = new OpenAI({ apiKey: config.openAiApiKey });
  return async (input: string) => {
    const response = await client.responses.create({
      model: config.openAiModel,
      instructions: config.systemPrompt,
      input: input || 'Say hello and briefly ask how you can help.',
    });
    const output = response.output_text.trim();
    if (!output) throw new Error('OpenAI returned an empty response');
    return output;
  };
}

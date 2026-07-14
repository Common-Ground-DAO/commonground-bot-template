import type { MessageBody } from './types.js';

export function extractText(body: MessageBody): string {
  return body.content
    .map((part) => {
      if (part.type === 'text' && typeof part.value === 'string') return part.value;
      if (part.type === 'newline') return '\n';
      return '';
    })
    .join('')
    .trim();
}

export function matchTrigger(text: string, trigger: string): string | null {
  const normalized = text.trim();
  if (!normalized) return null;
  if (!trigger) return normalized;
  if (normalized === trigger) return '';
  if (!normalized.startsWith(`${trigger} `)) return null;
  return normalized.slice(trigger.length).trim();
}

export function textBody(value: string): MessageBody {
  return { version: '1', content: [{ type: 'text', value }] };
}

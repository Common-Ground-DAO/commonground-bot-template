import { extractText, isMentioned, matchTrigger } from './message.js';
import type { ApiMessage, InvocationContext } from './types.js';

type LoadMessagesById = (messageIds: string[]) => Promise<ApiMessage[]>;

export async function resolveInvocation(
  message: ApiMessage,
  botUserId: string,
  trigger: string,
  loadMessagesById: LoadMessagesById,
): Promise<InvocationContext> {
  const text = extractText(message.body);
  const triggerInput = matchTrigger(text, trigger);
  const mentioned = isMentioned(message.body, botUserId);
  const senderIsBot = message.creatorIsBot === true;

  let replyToBot = false;
  if (!senderIsBot && message.parentMessageId) {
    const [parent] = await loadMessagesById([message.parentMessageId]);
    replyToBot = parent?.creatorId === botUserId;
  }

  const triggerMatched = triggerInput !== null;
  return {
    mentioned,
    replyToBot,
    triggerMatched,
    senderIsBot,
    shouldRespond: !senderIsBot && (mentioned || replyToBot || triggerMatched),
    text,
    input: triggerInput ?? text,
  };
}

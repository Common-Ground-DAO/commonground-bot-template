export type MessageBody = {
  version: '1';
  content: MessageBodyPart[];
};

export type MessageBodyPart = Record<string, unknown> & {
  type: string;
  value?: string;
  userId?: string;
  alias?: string;
};

export type ApiMessage = {
  id: string;
  creatorId: string;
  channelId: string;
  body: MessageBody;
  parentMessageId: string | null;
  createdAt: string;
  updatedAt: string;
  // Present on Bot API v1 live `new` events. Optional here because historical
  // message reads return the canonical stored message without delivery metadata.
  creatorIsBot?: boolean;
};

export type MessageEvent =
  | { type?: 'cliMessageEvent'; action: 'new'; data: ApiMessage }
  | {
      type?: 'cliMessageEvent';
      action: 'update';
      data: { id: string; channelId: string; updatedAt: string };
    }
  | {
      type?: 'cliMessageEvent';
      action: 'delete';
      data: { channelId: string; deletedIds: string[] };
    };

export type BotIdentity = {
  protocolVersion: '1';
  userId: string;
  deviceId: string;
  tokenId: string;
};

export type InvocationContext = {
  mentioned: boolean;
  replyToBot: boolean;
  triggerMatched: boolean;
  senderIsBot: boolean;
  shouldRespond: boolean;
  text: string;
  input: string;
};

export type ApiEnvelope<T> =
  | { status: 'OK'; data: T }
  | { status: 'ERROR'; error: string };

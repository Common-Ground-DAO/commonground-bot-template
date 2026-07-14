export type MessageBody = {
  version: '1';
  content: Array<Record<string, unknown> & { type: string }>;
};

export type ApiMessage = {
  id: string;
  creatorId: string;
  channelId: string;
  body: MessageBody;
  parentMessageId: string | null;
  createdAt: string;
  updatedAt: string;
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
  userId: string;
  deviceId: string;
  tokenId: string;
};

export type ApiEnvelope<T> =
  | { status: 'OK'; data: T }
  | { status: 'ERROR'; error: string };

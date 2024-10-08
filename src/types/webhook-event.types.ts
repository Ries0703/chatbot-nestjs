export enum AttachmentType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  FILE = 'file',
  LOCATION = 'location',
  FALLBACK = 'fallback',
}

export type AttachmentPayload = {
  url?: string;
  coordinates?: {
    lat: number;
    long: number;
  };
};

export type Attachment = {
  type: AttachmentType;
  payload: AttachmentPayload;
};

export type Message = {
  mid: string;
  text?: string;
  attachments?: Array<Attachment>;
};

export type MessagingEvent = {
  sender: {
    id: string;
  };
  recipient: {
    id: string;
  };
  timestamp: number;
  message: Message;
};

export type Entry = {
  id: string;
  time: number;
  messaging: Array<MessagingEvent>;
};

export type WebhookMessageEvent = {
  object: string;
  entry: Array<Entry>;
};

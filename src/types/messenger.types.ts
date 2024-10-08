enum AttachmentType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  FILE = 'file',
}

export type SendTextMessageRequest = {
  body: {
    recipient: {
      id: string;
    };
    messaging_type: 'RESPONSE';
    message: {
      text: string;
    };
  };
  params: {
    access_token: string;
  };
};

export type SendAttachmentMessageRequest = {
  body: {
    recipient: {
      id: string;
    };
    messaging_type: 'RESPONSE';
    message: {
      attachment: {
        type: AttachmentType;
        payload: {
          url: string;
        };
      };
      text?: string;
    };
  };
  params: {
    access_token: string;
  };
};

export type SendActionRequest = {
  body: {
    recipient: {
      id: string;
    };
    sender_action: string;
  };
  params: {
    access_token: string;
  };
};

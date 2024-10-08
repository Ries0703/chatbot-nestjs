import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Platform } from '../config/enum';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { SendApiService } from './send-api.service';
import {
  Entry,
  MessagingEvent,
  WebhookMessageEvent,
} from '../types/webhook-event.types';
import { SendTextMessageRequest } from '../types/messenger.types';

@Processor(Platform.MESSENGER)
export class MessengerWorkerService extends WorkerHost {
  private readonly logger = new Logger(MessengerWorkerService.name);

  constructor(private readonly sendApiService: SendApiService) {
    super();
  }

  async process(job: Job, token?: string): Promise<void> {
    const jobData: WebhookMessageEvent = job.data;
    await Promise.all(
      jobData.entry.map(async (entry: Entry) => {
        const messaging: MessagingEvent = entry.messaging[0];
        const textMessageRequest: SendTextMessageRequest = {
          body: {
            recipient: messaging.sender,
            messaging_type: 'RESPONSE',
            message: {
              text: 'hhheeeelllloooo',
            },
          },
          params: {
            access_token: process.env.TEST_TOKEN,
          },
        };
        await this.sendApiService.sendTextMessage(textMessageRequest);
      }),
    );
  }
}

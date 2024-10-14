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
import { DatabaseService } from './database.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SendActionRequest } from '../types/messenger.types';
import OpenAI from 'openai';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { ImageURLContentBlock } from 'openai/resources/beta/threads';
import { AssistantStream } from 'openai/lib/AssistantStream';
import { FacebookParams } from '../types/facebook-params';

@Processor(Platform.MESSENGER)
export class MessengerWorkerService extends WorkerHost {
  private readonly logger = new Logger(MessengerWorkerService.name);

  constructor(
    private readonly sendApiService: SendApiService,
    private readonly databaseService: DatabaseService,
    private readonly eventEmitter: EventEmitter2,
    private readonly openAIClient: OpenAI,
    private readonly redisService: RedisService,
  ) {
    super();
  }

  /*
  TODO: implement response logic
    Step 1: query the database for the assistant_id messaging.recipient.id
      if assistant_id is not null, proceed with the following steps
    Step 2: query the database for the and page_access_token using messaging.recipient.id
    Step 3: send typing-action 'seen' and 'typing'
    Step 4: process messaging.message
  * */
  async process(job: Job, token?: string): Promise<void> {
    const jobData: WebhookMessageEvent = job.data;
    this.logger.log(
      `processing ${JSON.stringify(jobData)} with redis token = ${token}`,
    );
    await Promise.all(
      jobData.entry.map(async (entry: Entry): Promise<void> => {
        const messaging: MessagingEvent = entry.messaging[0];
        const assistantId: string =
          await this.databaseService.findOpenAIIdByPageId(
            messaging.recipient.id,
          );
        if (!assistantId) {
          return this.logger.error(
            `page_id ${messaging.recipient.id} is not associated with any assistant`,
          );
        }
        const pageAccessToken: string =
          await this.databaseService.findPageAccessTokenByPageId(
            messaging.recipient.id,
          );
        if (!pageAccessToken) {
          return this.logger.error(
            `page_id ${messaging.recipient.id} is not associated with any page access token`,
          );
        }
        await this.sendApiService.sendTypingAction({
          body: {
            recipient: {
              id: messaging.sender.id,
            },
            sender_action: 'mark_seen',
          },
          params: {
            access_token: pageAccessToken,
          },
        } as SendActionRequest);

        await this.sendApiService.sendTypingAction({
          body: {
            recipient: {
              id: messaging.sender.id,
            },
            sender_action: 'typing_on',
          },
          params: {
            access_token: pageAccessToken,
          },
        } as SendActionRequest);
        return await this.handleMessage(
          messaging,
          pageAccessToken,
          assistantId,
        );
      }),
    );
  }

  private async handleMessage(
    messageEvent: MessagingEvent,
    pageAccessToken: string,
    assistantId: string,
  ): Promise<void> {
    const threadId = await this.getOrCreateThread(
      messageEvent.sender.id,
      messageEvent.recipient.id,
    );
    if (!threadId) {
      return this.logger.error('error finding or creating thread');
    }

    if (messageEvent.message.text) {
      this.logger.log('received a text message, processing...');
      await this.openAIClient.beta.threads.messages.create(threadId, {
        role: 'user',
        content: messageEvent.message.text,
      });
    } else if (
      messageEvent.message.attachments &&
      messageEvent.message.attachments.length
    ) {
      this.logger.log('received an attachment message, processing...');
      for (const attachment of messageEvent.message.attachments) {
        if (attachment.type === 'image') {
          await this.openAIClient.beta.threads.messages.create(threadId, {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: attachment.payload.url,
                },
              },
            ] as Array<ImageURLContentBlock>,
          });
        } else {
          // TODO: send back a default response indicating that our assistants do not handle attachment
          this.logger.error('not text or image message, do not reply');
        }
      }
    }

    this.logger.log('creating stream...');
    const stream: AssistantStream = this.openAIClient.beta.threads.runs.stream(
      threadId,
      { assistant_id: assistantId },
    );

    for await (const chunk of stream) {
      this.eventEmitter.emit(chunk.event, chunk.data, threadId, {
        pageScopedId: messageEvent.sender.id,
        pageId: messageEvent.recipient.id,
        accessToken: pageAccessToken,
      } as FacebookParams);
    }
  }

  // returns a thread_id string
  private async getOrCreateThread(
    psId: string,
    pageId: string,
  ): Promise<string> {
    try {
      let threadId: string =
        await this.databaseService.findThreadIdByPsIdAndPageId(psId, pageId);
      if (!threadId) {
        this.logger.log(
          `create new thread for the (psId, pageId) pair: (${psId}, ${pageId})`,
        );
        threadId = (
          await this.openAIClient.beta.threads.create({
            metadata: { psId, pageId },
          })
        ).id;
        await this.databaseService.saveThreadId(threadId, psId, pageId);
        return threadId;
      }
      this.logger.log(
        `use existing thread for the (psId, pageId) pair: (${psId}, ${pageId})`,
      );
      return threadId;
    } catch (error) {
      this.logger.error('error fetching thread', error);
      return null;
    }
  }
}

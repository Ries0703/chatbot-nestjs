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
import {
  SendActionRequest,
  SendTextMessageRequest,
} from '../types/messenger.types';
import OpenAI from 'openai';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { ImageURLContentBlock } from 'openai/resources/beta/threads';
import { AssistantStream } from 'openai/lib/AssistantStream';
import { EventMetadata } from '../types/event-metadata';
import Redis from 'ioredis';
import { TextContentBlockParam } from 'openai/src/resources/beta/threads/messages';

@Processor(Platform.MESSENGER)
export class MessengerWorkerService extends WorkerHost {
  private readonly logger = new Logger(MessengerWorkerService.name);
  private readonly redisClient: Redis;
  private readonly isTerminalStatus = {
    queued: false,
    in_progress: false,
    requires_action: false,
    cancelling: false,
    cancelled: true,
    failed: true,
    completed: true,
    incomplete: true,
    expired: true,
  };

  constructor(
    private readonly sendApiService: SendApiService,
    private readonly databaseService: DatabaseService,
    private readonly eventEmitter: EventEmitter2,
    private readonly openAIClient: OpenAI,
    private readonly redisService: RedisService,
  ) {
    super();
    try {
      this.redisClient = redisService.getOrThrow();
    } catch (error) {
      this.logger.error(
        'cannot connect to redis',
        JSON.stringify(error.message),
      );
    }
  }

  async process(job: Job, token?: string): Promise<void> {
    const jobData: WebhookMessageEvent = job.data;
    this.logger.log(`processing job with redis token = ${token}`);
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
    messagingEvent: MessagingEvent,
    pageAccessToken: string,
    assistantId: string,
  ): Promise<void> {
    const threadId = await this.getThread(
      messagingEvent.sender.id,
      messagingEvent.recipient.id,
    );
    if (!threadId) {
      return this.logger.error('error finding thread');
    }
    const latestRun = (
      await this.openAIClient.beta.threads.runs.list(threadId, {
        limit: 1,
      })
    ).data;
    if (messagingEvent.message.text) {
      this.logger.log('received a text message, processing...');
      if (
        !latestRun ||
        !latestRun.length ||
        !this.isTerminalStatus[latestRun[0].status]
      ) {
        this.logger.log('pushing the text message to redis');
        const messageKey = `message-list:${threadId}-${messagingEvent.sender.id}`;
        const textValue: string = JSON.stringify({
          type: 'text',
          text: messagingEvent.message.text,
        } as TextContentBlockParam);
        await this.redisClient.rpush(messageKey, textValue);
        return;
      }
      await this.openAIClient.beta.threads.messages.create(threadId, {
        role: 'user',
        content: messagingEvent.message.text,
      });
    } else if (
      messagingEvent.message.attachments &&
      messagingEvent.message.attachments.length
    ) {
      this.logger.log('received an attachment message, processing...');
      if (
        !latestRun ||
        !latestRun.length ||
        !this.isTerminalStatus[latestRun[0].status]
      ) {
        for (const attachment of messagingEvent.message.attachments) {
          if (attachment.type === 'image') {
            this.logger.log('pushing the image_url message to redis');
            const messageKey = `message-list:${threadId}-${messagingEvent.sender.id}`;
            const imageUrlValue: string = JSON.stringify({
              type: 'image_url',
              image_url: {
                url: attachment.payload.url,
              },
            } as ImageURLContentBlock);
            await this.redisClient.rpush(messageKey, imageUrlValue);
          } else {
            this.logger.error(
              'not text or image message, sending automatic reply',
            );
            await this.sendApiService.sendTextMessage({
              body: {
                recipient: {
                  id: messagingEvent.sender.id,
                },
                message: {
                  text: 'chúng tôi không nhận file do sợ virus',
                },
              },
              params: { access_token: pageAccessToken },
            } as SendTextMessageRequest);
          }
        }
        return;
      } else {
        for (const attachment of messagingEvent.message.attachments) {
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
            this.logger.error(
              'not text or image message, sending automatic reply',
            );
            await this.sendApiService.sendTextMessage({
              body: {
                recipient: {
                  id: messagingEvent.sender.id,
                },
                message: {
                  text: 'chúng tôi không nhận file do sợ virus',
                },
              },
              params: { access_token: pageAccessToken },
            } as SendTextMessageRequest);
          }
        }
      }
    }

    this.logger.log('creating stream...');
    const stream: AssistantStream = this.openAIClient.beta.threads.runs.stream(
      threadId,
      { assistant_id: assistantId },
    );

    const eventMetadata: EventMetadata = {
      pageScopedId: messagingEvent.sender.id,
      pageId: messagingEvent.recipient.id,
      accessToken: pageAccessToken,
      threadId: threadId,
      assistantId: assistantId,
    };

    for await (const chunk of stream) {
      this.eventEmitter.emit(chunk.event, chunk.data, eventMetadata);
    }
  }

  private async getThread(psId: string, pageId: string): Promise<string> {
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

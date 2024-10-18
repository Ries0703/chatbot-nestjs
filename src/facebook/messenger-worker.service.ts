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
import { Threads } from 'openai/resources/beta/threads';
import { AssistantStream } from 'openai/lib/AssistantStream';
import { EventMetadataTypes } from '../types/event-metadata.types';
import Redis from 'ioredis';
import Thread = Threads.Thread;

@Processor(Platform.MESSENGER, { concurrency: 100 })
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
        const pageAccessToken: string =
          await this.databaseService.findPageAccessTokenByPageId(
            messaging.recipient.id,
          );
        if (!pageAccessToken) {
          return this.logger.error(
            `page_id ${messaging.recipient.id} is not associated with any page access token`,
          );
        }
        const typingActionsSent: boolean =
          (await this.sendApiService.sendTypingAction({
            body: {
              recipient: {
                id: messaging.sender.id,
              },
              sender_action: 'mark_seen',
            },
            params: {
              access_token: pageAccessToken,
            },
          } as SendActionRequest)) &&
          (await this.sendApiService.sendTypingAction({
            body: {
              recipient: {
                id: messaging.sender.id,
              },
              sender_action: 'typing_on',
            },
            params: {
              access_token: pageAccessToken,
            },
          } as SendActionRequest));
        if (!typingActionsSent) {
          return this.logger.error(
            'an error occurred while sending typing action',
          );
        }
        const assistantId: string =
          await this.databaseService.findOpenAIIdByPageId(
            messaging.recipient.id,
          );
        if (!assistantId) {
          return this.logger.error(
            `page_id ${messaging.recipient.id} is not associated with any assistant`,
          );
        }
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
      assistantId,
    );
    if (!threadId) {
      this.logger.error('Error finding thread');
      return;
    }
    const latestRunData = await this.openAIClient.beta.threads.runs.list(
      threadId,
      { limit: 1 },
    );
    const latestRun = latestRunData.data[0];

    if (messagingEvent.message?.text) {
      await this.handleTextMessage(messagingEvent, latestRun, threadId);
    } else if (messagingEvent.message?.attachments?.length) {
      await this.handleAttachments(
        messagingEvent,
        latestRun,
        threadId,
        pageAccessToken,
      );
    }

    const eventMetadata: EventMetadataTypes = {
      pageScopedId: messagingEvent.sender.id,
      pageId: messagingEvent.recipient.id,
      accessToken: pageAccessToken,
      threadId,
      assistantId,
    };

    this.logger.log('Creating stream...');

    const stream: AssistantStream = this.openAIClient.beta.threads.runs.stream(
      threadId,
      { assistant_id: assistantId },
    );

    for await (const chunk of stream) {
      this.eventEmitter.emit(chunk.event, chunk.data, eventMetadata);
    }
  }

  private async handleTextMessage(
    messagingEvent: MessagingEvent,
    latestRun: any,
    threadId: string,
  ): Promise<void> {
    this.logger.log('Received a text message, processing...');

    const isRunActive = latestRun && this.isTerminalStatus[latestRun.status];

    if (!isRunActive) {
      this.logger.log('Pushing the text message to Redis');
      const messageKey = `message-list:${threadId}-${messagingEvent.sender.id}`;
      const textValue = JSON.stringify({
        type: 'text',
        text: messagingEvent.message.text,
      });
      await this.redisClient.rpush(messageKey, textValue);
    } else {
      await this.openAIClient.beta.threads.messages.create(threadId, {
        role: 'user',
        content: messagingEvent.message.text,
      });
    }
  }

  private async handleAttachments(
    messagingEvent: MessagingEvent,
    latestRun: any,
    threadId: string,
    pageAccessToken: string,
  ): Promise<void> {
    this.logger.log('Received an attachment message, processing...');

    const isRunActive = latestRun && this.isTerminalStatus[latestRun.status];

    for (const attachment of messagingEvent.message.attachments) {
      if (attachment.type === 'image') {
        const imageUrlValue = JSON.stringify({
          type: 'image_url',
          image_url: { url: attachment.payload.url },
        });

        if (!isRunActive) {
          this.logger.log('Pushing the image_url message to Redis');
          const messageKey = `message-list:${threadId}-${messagingEvent.sender.id}`;
          await this.redisClient.rpush(messageKey, imageUrlValue);
        } else {
          await this.openAIClient.beta.threads.messages.create(threadId, {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: attachment.payload.url } },
            ],
          });
        }
      } else {
        this.logger.error('Not text or image message, sending automatic reply');
        await this.sendApiService.sendTextMessage({
          body: {
            recipient: { id: messagingEvent.sender.id },
            messaging_type: 'RESPONSE',
            message: { text: 'Chúng tôi không nhận file do sợ virus' },
          },
          params: { access_token: pageAccessToken },
        });
      }
    }
  }

  private async getThread(
    psId: string,
    pageId: string,
    assistantId: string,
  ): Promise<string> {
    try {
      // all the threadIds in this list are the same
      const results: Array<{
        threadId: string;
        chatbotOpenAIId: string;
      }> = await this.databaseService.findThreadIdByPsIdAndPageId(psId, pageId);

      if (!results?.length) {
        this.logger.log('Creating new thread');
        const thread: Thread = await this.openAIClient.beta.threads.create();

        await this.databaseService.saveThreadId({
          pageId,
          psId,
          assistantId,
          threadId: thread.id,
        });

        this.logger.log('New thread created');
        return thread.id;
      }

      const assistantExists = results.some(
        (result) => result.chatbotOpenAIId === assistantId,
      );
      const { threadId: oldThread } = results[0];

      if (!assistantExists) {
        this.logger.log('New assistant but old thread');
        await this.databaseService.saveThreadId({
          pageId,
          psId,
          assistantId,
          threadId: oldThread,
        });
      }

      return oldThread;
    } catch (error) {
      this.logger.error('Error fetching thread', error);
      return null;
    }
  }
}

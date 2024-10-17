import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import {
  ImageURLContentBlock,
  Message,
  MessageCreateParams,
  Run,
  TextContentBlock,
} from 'openai/resources/beta/threads';
import { RunStep } from 'openai/resources/beta/threads/runs';
import { OpenAIError } from 'openai/error';
import { DatabaseService } from './database.service';
import { EventMetadataTypes } from '../types/event-metadata.types';
import { SendApiService } from './send-api.service';
import { SendTextMessageRequest } from '../types/messenger.types';
import OpenAI from 'openai';
import Redis from 'ioredis';
import { RedisService } from '@liaoliaots/nestjs-redis';
import {
  MessageContentPartParam,
  TextContentBlockParam,
} from 'openai/src/resources/beta/threads/messages';
import { AssistantStream } from 'openai/lib/AssistantStream';

@Injectable()
export class EventHandler {
  private readonly logger = new Logger(EventHandler.name);
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
    private readonly databaseService: DatabaseService,
    private readonly sendApiService: SendApiService,
    private readonly openAIClient: OpenAI,
    private readonly redisService: RedisService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    try {
      this.redisClient = redisService.getOrThrow();
    } catch (error) {
      this.logger.error('cannot connect to redis', JSON.stringify(error));
    }
  }

  // @OnEvent('thread.created') handleThreadCreatedEvent(thread: Thread) {
  //   // this.logger.log(`thread_id = ${thread.id} created`);
  // }

  // @OnEvent('thread.run.created') handleRunCreatedEvent(run: Run) {
  //   // this.logger.log(`run_id = ${run.id} created`);
  // }
  //
  // @OnEvent('thread.run.queued') handleRunQueuedEvent(run: Run) {
  //   // this.logger.log(`run_id = ${run.id} queued`);
  // }
  //
  // @OnEvent('thread.run.in_progress') handleRunInProgressEvent(run: Run) {
  //   // this.logger.log(`run_id = ${run.id} is in progress`);
  // }

  @OnEvent('thread.run.requires_action') handleRunRequiresActionEvent(
    run: Run,
    eventMetadata: EventMetadataTypes,
  ) {
    this.logger.log(
      `run_id = ${run.id} of thread ${eventMetadata.threadId} needs to call functions, calling with facebookParams = ${JSON.stringify(eventMetadata)}`,
    );
    this.logger.log('calling done, streaming...');
  }

  // TODO: track usage from run
  @OnEvent('thread.run.completed', { async: true })
  async handleRunCompletedEvent(run: Run, eventMetadata: EventMetadataTypes) {
    this.logger.log(`run_id = ${run.id} is completed`);
    const id: number = await this.databaseService.saveAssistantExpense({
      assistantId: eventMetadata.assistantId,
      inputToken: run.usage.prompt_tokens,
      outputToken: run.usage.completion_tokens,
    });
    if (id) {
      this.logger.log(`expense_id = ${id}`);
    }
  }

  @OnEvent('thread.run.incomplete') handleRunIncompleteEvent(run: Run) {
    this.logger.error(`run_id = ${run.id} is not completed`);
  }

  @OnEvent('thread.run.failed') handleRunFailedEvent(run: Run) {
    this.logger.error(`run_id = ${run.id} failed`);
  }

  @OnEvent('thread.run.cancelling') handleRunCancellingEvent(run: Run) {
    this.logger.error(`run_id = ${run.id} is cancelling`);
  }

  @OnEvent('thread.run.cancelled') handleRunCancelledEvent(run: Run) {
    this.logger.error(`run_id = ${run.id} is cancelled`);
  }

  @OnEvent('thread.run.expired') handleRunExpiredEvent(run: Run) {
    this.logger.error(`run_id = ${run.id} is expired`);
  }

  // @OnEvent('thread.run.step.created') handleRunStepCreatedEvent(
  //   runStep: RunStep,
  // ) {
  //   // this.logger.log(`run_step_id = ${runStep.id} created`);
  // }
  //
  // @OnEvent('thread.run.step.in_progress') handleRunStepInProgressEvent(
  //   runStep: RunStep,
  // ) {
  //   // this.logger.log(`run_step_id = ${runStep.id} is in progress`);
  // }
  //
  // @OnEvent('thread.run.step.delta') handleRunStepDeltaEvent(runStep: RunStep) {
  //   // this.logger.log(`run_step_id = ${runStep.id} delta created`);
  // }
  //
  // @OnEvent('thread.run.step.completed') handleRunStepCompletedEvent(
  //   runStep: RunStep,
  // ) {
  //   // this.logger.log(`run_step_id = ${runStep.id} completed`);
  // }

  @OnEvent('thread.run.step.failed') handleRunStepFailedEvent(
    runStep: RunStep,
  ) {
    this.logger.error(`run_step_id = ${runStep.id} failed`);
  }

  @OnEvent('thread.run.step.cancelled') handleRunStepCancelledEvent(
    runStep: RunStep,
  ) {
    this.logger.error(`run_step_id = ${runStep.id} cancelled`);
  }

  @OnEvent('thread.run.step.expired') handleRunStepExpiredEvent(
    runStep: RunStep,
  ) {
    this.logger.error(`run_step_id = ${runStep.id} expired`);
  }

  // @OnEvent('thread.message.created') handleMessageCreatedEvent(
  //   message: Message,
  // ) {
  //   // this.logger.log(`message_id = ${message.id} created`);
  // }
  //
  // @OnEvent('thread.message.in_progress') handleMessageInProgressEvent(
  //   message: Message,
  // ) {
  //   // this.logger.log(`message_id = ${message.id} is in progress`);
  // }

  @OnEvent('thread.message.delta') handleMessageDeltaEvent(message: Message) {
    this.logger.log(`message_id = ${message.id} delta created`);
  }

  @OnEvent('thread.message.completed')
  async handleMessageCompletedEvent(
    message: Message,
    eventMetadata: EventMetadataTypes,
  ) {
    this.logger.log(`message_id = ${message.id} completed, sending it out...`);
    this.logger.log(
      `assistant > ${(message.content[0] as TextContentBlock).text.value}`,
    );
    try {
      const cachedMessageList: string[] = await this.redisClient.lrange(
        `message-list:${eventMetadata.threadId}-${eventMetadata.pageScopedId}`,
        0,
        -1,
      );
      if (!cachedMessageList || !cachedMessageList.length) {
        this.logger.log('message cached is empty');
        await this.sendApiService.sendTextMessage({
          body: {
            recipient: {
              id: eventMetadata.pageScopedId,
            },
            message: {
              text: (message.content[0] as TextContentBlock).text.value,
            },
          },
          params: { access_token: eventMetadata.accessToken },
        } as SendTextMessageRequest);
      } else {
        let latestRun: Run = (
          await this.openAIClient.beta.threads.runs.list(
            eventMetadata.threadId,
            {
              limit: 1,
              order: 'desc',
            },
          )
        ).data[0];
        do {
          this.logger.log(latestRun.status);
          latestRun = await this.openAIClient.beta.threads.runs.poll(
            eventMetadata.threadId,
            latestRun.id,
            {
              pollIntervalMs: 1000,
            },
          );
        } while (!(latestRun || this.isTerminalStatus[latestRun.status]));
        const contentPartArrays: Array<Array<MessageContentPartParam>> = [];
        let contentParts: Array<MessageContentPartParam> = [];
        for (const message of cachedMessageList) {
          const contentPart = JSON.parse(message) as MessageContentPartParam;
          contentParts.push(contentPart);
          if (contentParts.length === 10) {
            contentPartArrays.push(contentParts);
            contentParts = [];
          }
        }
        if (contentParts.length) {
          contentPartArrays.push(contentParts);
        }
        this.logger.log(JSON.stringify(contentPartArrays));
        await Promise.all(
          contentPartArrays.map((contentParts) =>
            this.openAIClient.beta.threads.messages.create(
              eventMetadata.threadId,
              {
                role: 'user',
                content: contentParts,
              },
            ),
          ),
        );
        await this.redisClient.del(
          `message-list:${eventMetadata.threadId}-${eventMetadata.pageScopedId}`,
        );
        const stream: AssistantStream =
          this.openAIClient.beta.threads.runs.stream(eventMetadata.threadId, {
            assistant_id: eventMetadata.assistantId,
          });
        for await (const chunk of stream) {
          this.eventEmitter.emit(chunk.event, chunk.data, eventMetadata);
        }
      }
    } catch (error) {
      this.logger.error(
        'an error occurred while sending the message',
        error.message,
      );
    }
  }

  @OnEvent('thread.message.incomplete') handleMessageIncompleteEvent(
    message: Message,
  ) {
    this.logger.error(`message_id = ${message.id} is not completed`);
  }

  // TODO: implement thread migration
  @OnEvent('error')
  async handleErrorEvent(
    error: OpenAIError,
    eventMetaData: EventMetadataTypes,
  ) {
    this.logger.error('an error occurred, migrating thread', error);
    try {
      const messages: Message[] = (
        await this.openAIClient.beta.threads.messages.list(
          eventMetaData.threadId,
          { limit: 100 },
        )
      ).data;
      const newThread = await this.openAIClient.beta.threads.create();
      const transformedCreateParams: MessageCreateParams[] = messages.map(
        (message) => {
          return {
            role: message.role,
            content: message.content
              .filter((message) => message.type !== 'refusal')
              .map((message) => {
                switch (message.type) {
                  case 'text':
                    return {
                      type: 'text',
                      text: message.text.value,
                    } as TextContentBlockParam;
                  case 'image_url':
                    return message as ImageURLContentBlock;
                }
              }),
          } as MessageCreateParams;
        },
      );
      this.logger.log(JSON.stringify(transformedCreateParams));
      const results = await Promise.all(
        transformedCreateParams.map((transformedCreateParam) =>
          this.openAIClient.beta.threads.messages.create(
            newThread.id,
            transformedCreateParam,
          ),
        ),
      );
      this.logger.log('finish migrating thread');
      this.logger.log(JSON.stringify(results));
      await this.databaseService.saveThreadId({
        pageId: eventMetaData.pageId,
        psId: eventMetaData.pageScopedId,
        threadId: newThread.id,
        assistantId: eventMetaData.assistantId,
      });
      const stream = this.openAIClient.beta.threads.runs.stream(newThread.id, {
        assistant_id: eventMetaData.assistantId,
      });
      const newEventMetaData: EventMetadataTypes = { ...eventMetaData };
      newEventMetaData.threadId = newThread.id;
      for await (const chunk of stream) {
        this.eventEmitter.emit(chunk.event, chunk.data, newEventMetaData);
      }
    } catch (e) {
      this.logger.error(
        'cannot migrate thread, remove thread from database...',
        JSON.stringify(e),
      );
      await this.sendApiService.sendTextMessage({
        body: {
          recipient: {
            id: eventMetaData.pageScopedId,
          },
          message: {
            text: 'loi he thong, xin thu lai',
          },
        },
        params: { access_token: eventMetaData.accessToken },
      } as SendTextMessageRequest);
      const deletedThreadId = await this.databaseService.deleteThreadId(
        eventMetaData.threadId,
      );
      this.logger.log(`threadId deleted = ${deletedThreadId}`);
    }
  }

  @OnEvent('done') handleDoneEvent(payload: any) {
    this.logger.log(`everything is done`, payload);
  }
}

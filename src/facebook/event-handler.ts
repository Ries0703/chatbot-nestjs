import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Thread } from 'openai/resources/beta';
import { Message, Run, TextContentBlock } from 'openai/resources/beta/threads';
import { RunStep } from 'openai/resources/beta/threads/runs';
import { OpenAIError } from 'openai/error';
import { DatabaseService } from './database.service';
import { FacebookParams } from '../types/facebook-params';
import { SendApiService } from './send-api.service';
import { SendTextMessageRequest } from '../types/messenger.types';

@Injectable()
export class EventHandler {
  private readonly logger = new Logger(EventHandler.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly sendApiService: SendApiService,
  ) {}

  @OnEvent('thread.created', { async: true })
  async handleThreadCreatedEvent(thread: Thread) {
    this.logger.log(`thread_id = ${thread.id} created`);
  }

  @OnEvent('thread.run.created', { async: true })
  async handleRunCreatedEvent(run: Run) {
    this.logger.log(`run_id = ${run.id} created`);
  }

  @OnEvent('thread.run.queued', { async: true })
  async handleRunQueuedEvent(run: Run) {
    this.logger.log(`run_id = ${run.id} queued`);
  }

  @OnEvent('thread.run.in_progress', { async: true })
  async handleRunInProgressEvent(run: Run) {
    this.logger.log(`4 run_id = ${run.id} is in progress`);
  }

  @OnEvent('thread.run.requires_action', { async: false })
  async handleRunRequiresActionEvent(
    run: Run,
    threadId: string,
    facebookParams: FacebookParams,
  ) {
    this.logger.log(
      `run_id = ${run.id} of thread ${threadId} needs to call functions, calling with facebookParams = ${JSON.stringify(facebookParams)}`,
    );
    this.logger.log('calling done, streaming...');
  }

  // TODO: track usage from run
  @OnEvent('thread.run.completed', { async: true })
  async handleRunCompletedEvent(run: Run) {
    this.logger.log(`run_id = ${run.id} is completed`);
  }

  @OnEvent('thread.run.incomplete', { async: true })
  async handleRunIncompleteEvent(run: Run) {
    this.logger.error(`run_id = ${run.id} is not completed`);
  }

  @OnEvent('thread.run.failed', { async: true })
  async handleRunFailedEvent(run: Run) {
    this.logger.error(`run_id = ${run.id} failed`);
  }

  @OnEvent('thread.run.cancelling', { async: true })
  async handleRunCancellingEvent(run: Run) {
    this.logger.error(`run_id = ${run.id} is cancelling`);
  }

  @OnEvent('thread.run.cancelled', { async: true })
  async handleRunCancelledEvent(run: Run) {
    this.logger.error(`run_id = ${run.id} is cancelled`);
  }

  @OnEvent('thread.run.expired', { async: true })
  async handleRunExpiredEvent(run: Run) {
    this.logger.error(`run_id = ${run.id} is expired`);
  }

  @OnEvent('thread.run.step.created', { async: true })
  async handleRunStepCreatedEvent(runStep: RunStep) {
    this.logger.log(`run_step_id = ${runStep.id} created`);
  }

  @OnEvent('thread.run.step.in_progress', { async: true })
  async handleRunStepInProgressEvent(runStep: RunStep) {
    this.logger.log(`run_step_id = ${runStep.id} is in progress`);
  }

  @OnEvent('thread.run.step.delta', { async: true })
  async handleRunStepDeltaEvent(runStep: RunStep) {
    this.logger.log(`run_step_id = ${runStep.id} delta created`);
  }

  @OnEvent('thread.run.step.completed', { async: true })
  async handleRunStepCompletedEvent(runStep: RunStep) {
    this.logger.log(`run_step_id = ${runStep.id} completed`);
  }

  @OnEvent('thread.run.step.failed', { async: true })
  async handleRunStepFailedEvent(runStep: RunStep) {
    this.logger.error(`run_step_id = ${runStep.id} failed`);
  }

  @OnEvent('thread.run.step.cancelled', { async: true })
  async handleRunStepCancelledEvent(runStep: RunStep) {
    this.logger.error(`run_step_id = ${runStep.id} cancelled`);
  }

  @OnEvent('thread.run.step.expired', { async: true })
  async handleRunStepExpiredEvent(runStep: RunStep) {
    this.logger.error(`run_step_id = ${runStep.id} expired`);
  }

  @OnEvent('thread.message.created', { async: true })
  async handleMessageCreatedEvent(message: Message) {
    this.logger.log(`message_id = ${message.id} created`);
  }

  @OnEvent('thread.message.in_progress', { async: true })
  async handleMessageInProgressEvent(message: Message) {
    this.logger.log(`message_id = ${message.id} is in progress`);
  }

  @OnEvent('thread.message.delta', { async: true })
  async handleMessageDeltaEvent(message: Message) {
    this.logger.log(`message_id = ${message.id} delta created`);
  }

  // TODO: implement sending message here
  @OnEvent('thread.message.completed', { async: false })
  async handleMessageCompletedEvent(
    message: Message,
    facebookParams: FacebookParams,
  ) {
    this.logger.log(`message_id = ${message.id} completed, sending it out...`);
    try {
      await this.sendApiService.sendTextMessage({
        body: {
          recipient: {
            id: facebookParams.pageScopedId,
          },
          message: {
            text: (message.content[0] as TextContentBlock).text.value,
          },
        },
        params: { access_token: facebookParams.accessToken },
      } as SendTextMessageRequest);
    } catch (error) {
      this.logger.error(
        'an error occurred while sending the message',
        error.message,
      );
    }
  }

  @OnEvent('thread.message.incomplete', { async: true })
  async handleMessageIncompleteEvent(message: Message) {
    this.logger.error(`message_id = ${message.id} is not completed`);
  }

  // TODO: implement thread migration
  @OnEvent('error', { async: true })
  async handleErrorEvent(error: OpenAIError) {
    this.logger.error('an error occurred', error);
  }

  @OnEvent('done', { async: true })
  async handleDoneEvent(payload: any) {
    this.logger.log(`everything is done`, payload);
  }
}

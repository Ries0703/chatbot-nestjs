import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Thread } from 'openai/resources/beta';
import { Message, Run, TextContentBlock } from 'openai/resources/beta/threads';
import { RunStep } from 'openai/resources/beta/threads/runs';
import { OpenAIError } from 'openai/error';
import { DatabaseService } from './database.service';
import { EventMetadata } from '../types/event-metadata';
import { SendApiService } from './send-api.service';
import { SendTextMessageRequest } from '../types/messenger.types';

@Injectable()
export class EventHandler {
  private readonly logger = new Logger(EventHandler.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly sendApiService: SendApiService,
  ) {}

  @OnEvent('thread.created', { async: true }) handleThreadCreatedEvent(
    thread: Thread,
  ) {
    this.logger.log(`thread_id = ${thread.id} created`);
  }

  @OnEvent('thread.run.created', { async: true }) handleRunCreatedEvent(
    run: Run,
  ) {
    this.logger.log(`run_id = ${run.id} created`);
  }

  @OnEvent('thread.run.queued', { async: true }) handleRunQueuedEvent(
    run: Run,
  ) {
    this.logger.log(`run_id = ${run.id} queued`);
  }

  @OnEvent('thread.run.in_progress', { async: true }) handleRunInProgressEvent(
    run: Run,
  ) {
    this.logger.log(`run_id = ${run.id} is in progress`);
  }

  @OnEvent('thread.run.requires_action', { async: false })
  handleRunRequiresActionEvent(run: Run, eventMetadata: EventMetadata) {
    this.logger.log(
      `run_id = ${run.id} of thread ${eventMetadata.threadId} needs to call functions, calling with facebookParams = ${JSON.stringify(eventMetadata)}`,
    );
    this.logger.log('calling done, streaming...');
  }

  // TODO: track usage from run
  @OnEvent('thread.run.completed', { async: true }) handleRunCompletedEvent(
    run: Run,
  ) {
    this.logger.log(`run_id = ${run.id} is completed`);
  }

  @OnEvent('thread.run.incomplete', { async: true }) handleRunIncompleteEvent(
    run: Run,
  ) {
    this.logger.error(`run_id = ${run.id} is not completed`);
  }

  @OnEvent('thread.run.failed', { async: true }) handleRunFailedEvent(
    run: Run,
  ) {
    this.logger.error(`run_id = ${run.id} failed`);
  }

  @OnEvent('thread.run.cancelling', { async: true }) handleRunCancellingEvent(
    run: Run,
  ) {
    this.logger.error(`run_id = ${run.id} is cancelling`);
  }

  @OnEvent('thread.run.cancelled', { async: true }) handleRunCancelledEvent(
    run: Run,
  ) {
    this.logger.error(`run_id = ${run.id} is cancelled`);
  }

  @OnEvent('thread.run.expired', { async: true }) handleRunExpiredEvent(
    run: Run,
  ) {
    this.logger.error(`run_id = ${run.id} is expired`);
  }

  @OnEvent('thread.run.step.created', { async: true })
  handleRunStepCreatedEvent(runStep: RunStep) {
    this.logger.log(`run_step_id = ${runStep.id} created`);
  }

  @OnEvent('thread.run.step.in_progress', { async: true })
  handleRunStepInProgressEvent(runStep: RunStep) {
    this.logger.log(`run_step_id = ${runStep.id} is in progress`);
  }

  @OnEvent('thread.run.step.delta', { async: true }) handleRunStepDeltaEvent(
    runStep: RunStep,
  ) {
    this.logger.log(`run_step_id = ${runStep.id} delta created`);
  }

  @OnEvent('thread.run.step.completed', { async: true })
  handleRunStepCompletedEvent(runStep: RunStep) {
    this.logger.log(`run_step_id = ${runStep.id} completed`);
  }

  @OnEvent('thread.run.step.failed', { async: true }) handleRunStepFailedEvent(
    runStep: RunStep,
  ) {
    this.logger.error(`run_step_id = ${runStep.id} failed`);
  }

  @OnEvent('thread.run.step.cancelled', { async: true })
  handleRunStepCancelledEvent(runStep: RunStep) {
    this.logger.error(`run_step_id = ${runStep.id} cancelled`);
  }

  @OnEvent('thread.run.step.expired', { async: true })
  handleRunStepExpiredEvent(runStep: RunStep) {
    this.logger.error(`run_step_id = ${runStep.id} expired`);
  }

  @OnEvent('thread.message.created', { async: true }) handleMessageCreatedEvent(
    message: Message,
  ) {
    this.logger.log(`message_id = ${message.id} created`);
  }

  @OnEvent('thread.message.in_progress', { async: true })
  handleMessageInProgressEvent(message: Message) {
    this.logger.log(`message_id = ${message.id} is in progress`);
  }

  @OnEvent('thread.message.delta', { async: true }) handleMessageDeltaEvent(
    message: Message,
  ) {
    this.logger.log(`message_id = ${message.id} delta created`);
  }

  // TODO: implement sending message here
  @OnEvent('thread.message.completed', { async: false })
  async handleMessageCompletedEvent(
    message: Message,
    eventMetadata: EventMetadata,
  ) {
    this.logger.log(
      `message_id = ${message.id} completed, sending it out... ${eventMetadata}`,
    );
    this.logger.log(
      `assistant > ${(message.content[0] as TextContentBlock).text.value}`,
    );
    try {
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
    } catch (error) {
      this.logger.error(
        'an error occurred while sending the message',
        error.message,
      );
    }
  }

  @OnEvent('thread.message.incomplete', { async: true })
  handleMessageIncompleteEvent(message: Message) {
    this.logger.error(`message_id = ${message.id} is not completed`);
  }

  // TODO: implement thread migration
  @OnEvent('error', { async: true }) handleErrorEvent(error: OpenAIError) {
    this.logger.error('an error occurred', error);
  }

  @OnEvent('done', { async: true }) handleDoneEvent(payload: any) {
    this.logger.log(`everything is done`, payload);
  }
}

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Platform } from '../config/enum';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { AssistantService } from '../openai/assistant.service';

@Processor(Platform.MESSENGER)
export class MessengerBackgroundService extends WorkerHost {
  private readonly logger = new Logger(MessengerBackgroundService.name);

  constructor(private readonly assistantService: AssistantService) {
    super();
  }

  async process(job: Job, token?: string): Promise<any> {
    this.logger.debug(`Processing job: ${job} with token: ${token}`);
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { Platform } from '../config/enum';
import { Queue } from 'bullmq';
import { QueueStrategy } from './queue.strategy';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(private readonly queueStrategy: QueueStrategy) {}

  async enqueue(platform: Platform, data: any): Promise<void> {
    const queue: Queue = this.queueStrategy.getQueueForPlatform(platform);
    if (!queue) {
      this.logger.error(`platform not supported: ${platform}`);
      return;
    }
    this.logger.log(`enqueuing job for platform ${platform}`);
    await queue.add(platform, data, {
      removeOnComplete: true,
      removeOnFail: true,
    });
  }
}

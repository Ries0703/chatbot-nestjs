import { Queue } from 'bullmq';
import { QueueStrategy } from './queue-strategy.interface';
import { Platform } from '../../config/enum';

export class MessengerQueueStrategy implements QueueStrategy {
  constructor(private readonly queue: Queue) {}

  async addJob(data: any): Promise<void> {
    await this.queue.add(`${Platform.messenger}-webhook-event`, data);
  }
}

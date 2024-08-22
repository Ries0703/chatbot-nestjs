import { Injectable } from '@nestjs/common';
import { QueueStrategy } from './queue-strategy.interface';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { MessengerQueueStrategy } from './messeger.strategy';
import { Platform } from '../../config/enum';

@Injectable()
export class QueueService {
  private readonly strategies: { [key: string]: QueueStrategy };

  constructor(
    @InjectQueue(`${Platform.messenger}_webhook`)
    private readonly messengerQueue: Queue,
  ) {
    this.strategies = {
      messenger: new MessengerQueueStrategy(messengerQueue),
    };
  }

  async addWebhookJob(platform: Platform, data: any): Promise<void> {
    console.log(
      `adding job from platform ${platform} with data ${JSON.stringify(data, null, 2)}`,
    );
    const strategy = this.strategies[platform];
    if (!strategy) {
      throw new Error(`Unsupported platform: ${platform}`);
    }
    await strategy.addJob(data);
  }
}

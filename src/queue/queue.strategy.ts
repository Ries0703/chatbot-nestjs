import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Platform } from '../config/enum';
import { Queue } from 'bullmq';

@Injectable()
export class QueueStrategy {
  private readonly map: { [platform: string]: Queue } = {};

  constructor(@InjectQueue(Platform.MESSENGER) messengerQueue: Queue) {
    this.map[Platform.MESSENGER] = messengerQueue;
  }

  getQueueForPlatform(platform: Platform): Queue {
    return this.map[platform];
  }
}

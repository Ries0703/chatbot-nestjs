import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { WorkerService } from './worker.service';
import { BullModule } from '@nestjs/bullmq';
import { Platform } from '../../config/enum';
import { config } from '../../config/app.config';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: config.redisConfig.REDIS_HOST,
        port: config.redisConfig.REDIS_PORT,
        password: config.redisConfig.REDIS_PASSWORD,
      },
    }),
    BullModule.registerQueue({ name: `${Platform.messenger}_webhook` }),
  ],
  providers: [QueueService, WorkerService],
  exports: [QueueService],
})
export class ServicesModule {}

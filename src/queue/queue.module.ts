import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { config } from '../config/app.config';
import { Platform } from '../config/enum';
import { QueueService } from './queue.service';
import { QueueStrategy } from './queue.strategy';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: config.redisConfig.REDIS_HOST,
        port: config.redisConfig.REDIS_PORT,
        password: config.redisConfig.REDIS_PASSWORD,
      },
    }),
    BullModule.registerQueue({ name: Platform.MESSENGER }),
  ],
  providers: [QueueService, QueueStrategy],
  exports: [QueueService],
})
export class QueueModule {}

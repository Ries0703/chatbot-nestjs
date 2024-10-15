import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { config } from './config/app.config';
import { Platform } from './config/enum';

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
  exports: [BullModule],
})
export class QueueModule {}

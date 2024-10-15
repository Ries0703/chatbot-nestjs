import { Module } from '@nestjs/common';
import { FacebookController } from './facebook.controller';
import { QueueModule } from '../queue.module';
import { FacebookWebhookGuard } from './webhook.guard';
import { APP_GUARD } from '@nestjs/core';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: FacebookWebhookGuard,
    },
  ],
  controllers: [FacebookController],
  imports: [QueueModule],
})
export class WebhookModule {}

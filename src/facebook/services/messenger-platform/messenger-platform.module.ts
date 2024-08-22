import { Module } from '@nestjs/common';
import { SendApiService } from './send-api.service';
import { WebhookService } from './webhook.service';
import { QueueService } from './queue.service';

@Module({
  imports: [],
  providers: [SendApiService, WebhookService, QueueService],
  exports: [SendApiService, WebhookService, QueueService],
})
export class MessengerPlatformModule {}

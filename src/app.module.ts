import { Module } from '@nestjs/common';
import { WebhookModule } from './webhook/webhook.module';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [WebhookModule, QueueModule],
})
export class AppModule {}

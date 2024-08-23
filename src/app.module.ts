import { Module } from '@nestjs/common';
import { WebhookModule } from './webhook/webhook.module';
import { QueueModule } from './queue/queue.module';
import { RepositoryModule } from './repository/repository.module';

@Module({
  imports: [WebhookModule, QueueModule, RepositoryModule],
})
export class AppModule {}

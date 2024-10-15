import { Module } from '@nestjs/common';
import { FacebookController } from './facebook.controller';
import { QueueModule } from '../queue.module';

@Module({
  controllers: [FacebookController],
  imports: [QueueModule],
})
export class WebhookModule {}

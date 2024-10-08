import { Module } from '@nestjs/common';
import { FacebookController } from './facebook.controller';
import { QueueModule } from '../queue/queue.module';
import { WebModule } from '../web/web.module';

@Module({
  controllers: [FacebookController],
  imports: [QueueModule, WebModule],
})
export class WebhookModule {}

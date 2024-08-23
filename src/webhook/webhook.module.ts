import { Module } from '@nestjs/common';
import { FacebookController } from './facebook.controller';

@Module({
  controllers: [FacebookController]
})
export class WebhookModule {}

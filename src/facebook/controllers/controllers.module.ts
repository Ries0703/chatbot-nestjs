import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { ServicesModule } from '../services/services.module';

@Module({
  controllers: [WebhookController],
  imports: [ServicesModule],
})
export class ControllersModule {}

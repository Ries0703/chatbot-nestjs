import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { ServicesModule } from '../services/services.module';
import { ProcessorModule } from '../../processor/processor.module';

@Module({
  controllers: [WebhookController],
  imports: [ServicesModule, ProcessorModule],
})
export class ControllersModule {}

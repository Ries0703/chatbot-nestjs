import { Module } from '@nestjs/common';
import { SendApiService } from './send-api.service';
import { WebhookService } from './webhook.service';
import { ProcessorModule } from '../../../processor/processor.module';

@Module({
  imports: [ProcessorModule],
  providers: [SendApiService, WebhookService],
  exports: [SendApiService, WebhookService],
})
export class MessengerPlatformModule {}

import { Injectable } from '@nestjs/common';
import { QueueService } from '../../../processor/services/queue.service';
import { Platform } from '../../../config/enum';
import { config } from '../../../config/app.config';

@Injectable()
export class WebhookService {
  constructor(private readonly queueService: QueueService) {}

  async receiveWebhookEvent(data: any): Promise<void> {
    await this.queueService.addWebhookJob(Platform.messenger, data);
  }

  isValidWebhookSubscription(query: any): boolean {
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    return mode === 'subscribe' && token === config.facebookConfig.VERIFY_TOKEN;
  }
}

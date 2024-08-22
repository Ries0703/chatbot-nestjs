import { Injectable } from '@nestjs/common';
import * as process from 'node:process';

@Injectable()
export class WebhookService {
  async handleWebhookEvent(): Promise<void> {
    console.log('Webhook service working');
  }
  isValidWebhookSubscription(query: any): boolean {
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    return mode === 'subscribe' && token === process.env.VERIFY_TOKEN;
  }
}

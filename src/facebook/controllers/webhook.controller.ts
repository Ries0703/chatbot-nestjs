import { Controller, Get, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { WebhookService } from '../services/messenger-platform/webhook.service';

@Controller('facebook/webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Get() getWebhook(@Req() request: any, @Res() response: any): void {
    if (!this.webhookService.isValidWebhookSubscription(request.body)) {
      console.log('getWebhook(): not a valid webhook subscription');
      response.status(HttpStatus.FORBIDDEN);
      return;
    }
    console.log('WEBHOOK_VERIFIED');
    response.status(HttpStatus.OK).send(request.query['hub.challenge']);
  }

  @Post()
  async postWebhook(@Req() request: any, @Res() response: any): Promise<void> {
    if (request.body.object !== 'page') {
      console.log('not an event from the page');
      response.status(HttpStatus.NOT_FOUND).send();
      return;
    }
    await this.webhookService.receiveWebhookEvent(request.body);
    response.status(HttpStatus.OK).send('EVENT_RECEIVED');
  }
}

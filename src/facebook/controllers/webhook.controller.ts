import { Controller, Get, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { WebhookService } from '../services/messenger-platform/webhook.service';

@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Get() getWebhook(@Req() request: any, @Res() response: any): void {
    if (!this.webhookService.isValidWebhookSubscription(request.body)) {
      response.status(HttpStatus.FORBIDDEN);
      return;
    }
    console.log('WEBHOOK_VERIFIED');
    response.status(HttpStatus.OK).send(request.query['hub.challenge']);
  }

  @Post() postWebhook(@Req() request: any, @Res() response: any): void {
    if (request.body.object !== 'page') {
      response.status(HttpStatus.NOT_FOUND).send();
      return;
    }
    console.log('adding stuff to queue');
    response.status(HttpStatus.OK).send('EVENT_RECEIVED');
  }
}

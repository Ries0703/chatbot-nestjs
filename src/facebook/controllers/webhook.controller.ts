import { Body, Controller, Get, HttpException, HttpStatus, Post, Query } from '@nestjs/common';
import { WebhookService } from '../services/messenger-platform/webhook.service';

@Controller('facebook/webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  async postWebhook(@Body() body: any): Promise<string> {
    if (body.object !== 'page') {
      throw new HttpException('Not Found', HttpStatus.NOT_FOUND);
    }

    try {
      await this.webhookService.receiveWebhookEvent(body);
      return 'EVENT_RECEIVED';
    } catch (error) {
      console.error('Error handling webhook event:', error.message);
      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get() getWebhook(@Query() query: any): string {
    try {
      const isValid = this.webhookService.isValidWebhookSubscription(query);
      if (!isValid) {
        throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
      }
      console.log('WEBHOOK_VERIFIED');
      return query['hub.challenge'];
    } catch (error) {
      console.error('Error verifying webhook subscription:', error.message);
      throw new HttpException('Bad Request', HttpStatus.BAD_REQUEST);
    }
  }
}

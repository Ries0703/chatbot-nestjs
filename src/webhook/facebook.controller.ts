import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Post,
  Query,
} from '@nestjs/common';
import { QueueService } from '../queue/queue.service';
import { config } from '../config/app.config';
import { Platform } from '../config/enum';

@Controller('facebook')
export class FacebookController {
  private readonly logger = new Logger(FacebookController.name);

  constructor(private readonly queueService: QueueService) {}

  @Get('/webhook') getWebhook(@Query() query: any): string {
    const isValid =
      query['hub.mode'] === 'subscribe' &&
      query['hub.verify_token'] === config.facebookConfig.VERIFY_TOKEN;
    if (!isValid) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
    this.logger.log('WEBHOOK_VERIFIED');
    return query['hub.challenge'];
  }

  @Post('/webhook')
  async postWebhook(@Body() body: any): Promise<string> {
    if (body.object !== 'page') {
      throw new HttpException('Not a page event', HttpStatus.NOT_FOUND);
    }
    try {
      await this.queueService.enqueue(Platform.MESSENGER, body);
      return 'EVENT_RECEIVED';
    } catch (error) {
      this.logger.error('Error adding enqueuing event:', error.message);
      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

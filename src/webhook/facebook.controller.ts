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
import { config } from '../config/app.config';
import { Platform } from '../config/enum';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Controller('facebook')
export class FacebookController {
  private readonly logger = new Logger(FacebookController.name);
  private readonly queue: Queue;

  constructor(@InjectQueue(Platform.MESSENGER) messengerQueue: Queue) {
    this.queue = messengerQueue;
  }

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
      await this.queue.add(Platform.MESSENGER, body, {
        removeOnComplete: true,
        removeOnFail: true,
      });
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

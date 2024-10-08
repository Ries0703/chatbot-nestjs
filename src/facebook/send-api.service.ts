import { Injectable, Logger } from '@nestjs/common';
import { config } from '../config/app.config';
import { HttpService } from '@nestjs/axios';
import {
  SendActionRequest,
  SendAttachmentMessageRequest,
  SendTextMessageRequest,
} from '../types/messenger.types';

@Injectable()
export class SendApiService {
  private readonly logger = new Logger(SendApiService.name);

  constructor(private readonly httpService: HttpService) {}

  public async sendTextMessage(
    request: SendTextMessageRequest,
  ): Promise<boolean> {
    try {
      const facebookResponse = await this.httpService.axiosRef.post(
        config.facebookConfig.FACEBOOK_MESSAGE_URI,
        request.body,
        { params: request.params },
      );
      this.logger.log(
        `Message sent with status ${JSON.stringify(facebookResponse)}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Method: ${this.sendTextMessage.name}, cannot send text message, the response is ${error}`,
      );
      return false;
    }
  }

  public async sendAttachment(
    request: SendAttachmentMessageRequest,
  ): Promise<boolean> {
    try {
      const facebookResponse = await this.httpService.axiosRef.post(
        config.facebookConfig.FACEBOOK_MESSAGE_URI,
        request.body,
        { params: request.params },
      );
      this.logger.log(
        `Attachment sent with status ${JSON.stringify(facebookResponse)}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Method: ${this.sendAttachment.name}, cannot send attachment message, the response is ${error}`,
      );
      return false;
    }
  }

  public async sendTypingAction(request: SendActionRequest): Promise<boolean> {
    try {
      const facebookResponse = await this.httpService.axiosRef.post(
        config.facebookConfig.FACEBOOK_MESSAGE_URI,
        request.body,
        { params: request.params },
      );
      this.logger.log(
        `Sending typing action: ${JSON.stringify(facebookResponse)}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Method: ${this.sendTypingAction.name}, cannot send typing action, the response is ${error}`,
      );
      return false;
    }
  }
}

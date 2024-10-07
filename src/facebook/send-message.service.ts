import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { MessengerRequestText } from '../types/messenger-request.text';
import { AxiosResponse } from 'axios';
import { config } from '../config/app.config';

@Injectable()
export class SendMessageService {
  private readonly logger = new Logger(SendMessageService.name);

  constructor(private readonly httpService: HttpService) {}

  public async sendMessage(
    message: MessengerRequestText,
  ): Promise<AxiosResponse> {
    const requestBody: object = {
      recipient: { id: message.senderId },
      messaging_type: 'RESPONSE',
      message: message.response,
    };
    const params: object = { access_token: message.pageAccessToken };
    const response: AxiosResponse = await this.httpService.axiosRef.post(
      config.facebookConfig.FACEBOOK_MESSAGE_URI,
      requestBody,
      params,
    );
    this.logger.log('text message sent', JSON.stringify(response));
    return response;
  }
}

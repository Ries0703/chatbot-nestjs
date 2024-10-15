import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import * as crypto from 'crypto';
import { config } from '../config/app.config';

@Injectable()
export class FacebookWebhookGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request: Request = context.switchToHttp().getRequest();
    const signature = request.headers['x-hub-signature-256'] as string;
    const body = request.body;

    if (!signature) {
      throw new HttpException(
        'Missing Facebook Webhook Signature',
        HttpStatus.FORBIDDEN,
      );
    }

    if (!this.isValidSignature(signature, body)) {
      throw new HttpException(
        'Invalid Facebook Webhook Signature',
        HttpStatus.FORBIDDEN,
      );
    }

    return true;
  }

  private isValidSignature(signature: string, payload: any): boolean {
    const appSecret = config.facebookConfig.FACEBOOK_APP_SECRET;
    const hmac = crypto.createHmac('sha256', appSecret);
    const payloadString = JSON.stringify(payload);

    const expectedSignature = `sha256=${hmac.update(payloadString).digest('hex')}`;

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature),
    );
  }
}

import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import * as crypto from 'crypto';
import { config } from '../config/app.config';

@Injectable()
export class FacebookWebhookGuard implements CanActivate {
  private readonly logger = new Logger(FacebookWebhookGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request: Request = context.switchToHttp().getRequest();
    const signature = request.headers['x-hub-signature-256'] as string;
    const body = request.body;

    if (!signature) {
      this.logger.error('no facebook signature');
      throw new HttpException('ranh con hack ccjv cut?', HttpStatus.FORBIDDEN);
    }

    if (!this.isValidSignature(signature, body)) {
      this.logger.error('invalid facebook signature');
      throw new HttpException('ranh con hack ccjv cut?', HttpStatus.FORBIDDEN);
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

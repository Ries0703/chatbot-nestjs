import { Module } from '@nestjs/common';
import { MessengerBackgroundService } from './messenger-background.service';

@Module({
  providers: [MessengerBackgroundService],
  exports: [MessengerBackgroundService],
})
export class FacebookModule {}

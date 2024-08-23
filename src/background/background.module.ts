import { Module } from '@nestjs/common';
import { FacebookBackgroundService } from './facebook-background.service';

@Module({
  providers: [FacebookBackgroundService]
})
export class BackgroundModule {}

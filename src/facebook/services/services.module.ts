import { Module } from '@nestjs/common';
import { MessengerPlatformModule } from './messenger-platform/messenger-platform.module';

@Module({
  imports: [MessengerPlatformModule],
  exports: [MessengerPlatformModule],
})
export class ServicesModule {}

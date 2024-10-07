import { Module } from '@nestjs/common';
import { QueueModule } from './queue/queue.module';
import { FacebookModule } from './facebook/facebook.module';

@Module({
  imports: [QueueModule, FacebookModule],
})
export class FacebookWorkerModule {}

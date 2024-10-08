import { Module } from '@nestjs/common';
import { MessengerWorkerService } from './messenger-worker.service';
import { QueueModule } from '../queue/queue.module';
import { SendApiService } from './send-api.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [QueueModule, HttpModule],
  providers: [MessengerWorkerService, SendApiService],
})
export class FacebookModule {}

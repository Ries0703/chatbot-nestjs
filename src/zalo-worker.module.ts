import { Module } from '@nestjs/common';
import { QueueModule } from './queue/queue.module';
import { ZaloModule } from './zalo/zalo.module';

@Module({
  imports: [QueueModule, ZaloModule],
})
export class ZaloWorkerModule {}

import { Module } from '@nestjs/common';
import { QueueModule } from './queue/queue.module';
import { TelegramModule } from './telegram/telegram.module';

@Module({
  imports: [QueueModule, TelegramModule],
})
export class TelegramWorkerModule {}

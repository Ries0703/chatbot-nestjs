import { Module } from '@nestjs/common';
import { OpenaiModule } from './openai/openai.module';
import { FacebookModule } from './facebook/facebook.module';
import { BackgroundModule } from './background/background.module';
import { RepositoryModule } from './repository/repository.module';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [
    QueueModule,
    OpenaiModule,
    FacebookModule,
    BackgroundModule,
    RepositoryModule,
  ],
})
export class WorkerModule {}

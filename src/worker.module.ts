import { Module } from '@nestjs/common';
import { OpenaiModule } from './openai/openai.module';
import { FacebookModule } from './facebook/facebook.module';
import { BackgroundModule } from './background/background.module';

@Module({
  imports: [OpenaiModule, FacebookModule, BackgroundModule],
})
export class WorkerModule {}

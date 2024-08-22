import { Module } from '@nestjs/common';
import { AssistantService } from './assistant.service';
import { OpenaiProvider } from './openai.provider';

@Module({
  providers: [AssistantService, OpenaiProvider],
  exports: [AssistantService, OpenaiProvider],
})
export class OpenaiModule {}

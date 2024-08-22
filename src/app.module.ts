import { Module } from '@nestjs/common';
import { AiModule } from './ai/ai.module';
import { FacebookModule } from './facebook/facebook.module';
import { ProcessorModule } from './processor/processor.module';

@Module({
  imports: [AiModule, FacebookModule, ProcessorModule],
  exports: [AiModule, FacebookModule, ProcessorModule],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { AiModule } from './ai/ai.module';
import { FacebookModule } from './facebook/facebook.module';

@Module({
  imports: [AiModule, FacebookModule],
  exports: [AiModule, FacebookModule],
})
export class AppModule {}

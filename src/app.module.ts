import { Module } from '@nestjs/common';
import { AiModule } from './ai/ai.module';
import { FacebookModule } from './facebook/facebook.module';
import { AppConfigModule } from './config/config.module';

@Module({
  imports: [AiModule, FacebookModule, AppConfigModule],
})
export class AppModule {}

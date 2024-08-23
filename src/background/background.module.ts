import { Module } from '@nestjs/common';
import { MessengerBackgroundService } from './messenger-background.service';
import { OpenaiModule } from '../openai/openai.module';
import { RepositoryModule } from '../repository/repository.module';

@Module({
  imports: [OpenaiModule, RepositoryModule],
  providers: [MessengerBackgroundService],
  exports: [MessengerBackgroundService],
})
export class BackgroundModule {}

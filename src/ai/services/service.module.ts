import { Module } from '@nestjs/common';
import { RepositoriesModule } from '../repositories/repositories.module';
import { OpenaiModule } from './openai/openai.module';

@Module({
  imports: [RepositoriesModule, OpenaiModule],
  exports: [OpenaiModule],
})
export class ServicesModule {}

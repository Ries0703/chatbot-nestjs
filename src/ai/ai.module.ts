import { Module } from '@nestjs/common';
import { ServicesModule } from './services/service.module';
import { RepositoriesModule } from './repositories/repositories.module';

@Module({
  imports: [ServicesModule, RepositoriesModule],
})
export class AiModule {}

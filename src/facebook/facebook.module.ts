import { Module } from '@nestjs/common';
import { ServicesModule } from './services/services.module';
import { ControllersModule } from './controllers/controllers.module';
import { RepositoriesModule } from './repositories/repositories.module';

@Module({
  imports: [ServicesModule, ControllersModule, RepositoriesModule],
})
export class FacebookModule {}

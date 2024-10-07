import { NestFactory } from '@nestjs/core';
import * as process from 'node:process';
import { TelegramWorkerModule } from './telegram-worker.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(TelegramWorkerModule);
  await app.init();
}

bootstrap().catch((err) => {
  console.log('error starting worker', err);
  process.exit(1);
});

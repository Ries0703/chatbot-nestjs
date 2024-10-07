import { NestFactory } from '@nestjs/core';
import { FacebookWorkerModule } from './facebook-worker.module';
import * as process from 'node:process';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(FacebookWorkerModule);
  await app.init();
}

bootstrap().catch((err) => {
  console.log('error starting worker', err);
  process.exit(1);
});

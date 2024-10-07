import { NestFactory } from '@nestjs/core';
import * as process from 'node:process';
import { ZaloWorkerModule } from './zalo-worker.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(ZaloWorkerModule);
  await app.init();
}

bootstrap().catch((err) => {
  console.log('error starting worker', err);
  process.exit(1);
});

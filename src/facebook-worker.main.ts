import { NestFactory } from '@nestjs/core';
import * as process from 'node:process';
import { FacebookModule } from './facebook/facebook.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(FacebookModule);
  await app.init();
}

bootstrap().catch((err) => {
  console.log('error starting worker', err);
  process.exit(1);
});

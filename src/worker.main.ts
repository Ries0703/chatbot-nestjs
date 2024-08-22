import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkerModule);
  await app.init();
}

bootstrap().catch((error) => {
  console.error('Error starting worker:', error);
  process.exit(1);
});

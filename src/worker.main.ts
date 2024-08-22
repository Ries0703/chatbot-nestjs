import { NestFactory } from '@nestjs/core';
import { ProcessorModule } from './processor/processor.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(ProcessorModule);
  await app.init();
}

bootstrap().catch((error) => {
  console.error('Error starting worker:', error);
  process.exit(1);
});

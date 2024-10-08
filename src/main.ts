import { NestFactory } from '@nestjs/core';
import * as process from 'node:process';
import { WebhookModule } from './webhook/webhook.module';

async function bootstrap() {
  const app = await NestFactory.create(WebhookModule);
  await app.listen(process.env.PORT, (): void => {
    console.log('listening at port', process.env.PORT);
  });
}

bootstrap().catch((error) => {
  console.log(error.message);
});

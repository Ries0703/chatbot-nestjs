import { NestFactory } from '@nestjs/core';
import * as process from 'node:process';
import { WebhookModule } from './webhook/webhook.module';

async function bootstrap() {
  const app = await NestFactory.create(WebhookModule);
  await app.listen(process.env.PORT, (): void => {
    console.log('listening at port', 3000);
  });
}

bootstrap().catch((error) => {
  console.log(error.message);
});

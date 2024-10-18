import { Module } from '@nestjs/common';
import { MessengerWorkerService } from './messenger-worker.service';
import { QueueModule } from '../queue.module';
import { SendApiService } from './send-api.service';
import { HttpModule } from '@nestjs/axios';
import { DatabaseService } from './database.service';
import OpenAI from 'openai';
import { config } from '../config/app.config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { EventHandler } from './event-handler';
import { SendAttachmentFunction } from './function-handlers/send-attachment.function';
import { FunctionRegistry } from './function-registry';

@Module({
  imports: [
    QueueModule,
    HttpModule,
    EventEmitterModule.forRoot({
      maxListeners: 100,
      verboseMemoryLeak: true,
    }),
    RedisModule.forRoot({
      config: {
        url: config.redisConfig.REDIS_URL,
      },
    }),
  ],
  providers: [
    MessengerWorkerService,
    EventHandler,
    SendApiService,
    DatabaseService,
    {
      provide: OpenAI,
      useValue: new OpenAI({ apiKey: config.openAIConfig.OPENAI_API_KEY }),
    },
    SendAttachmentFunction,
    FunctionRegistry,
  ],
})
export class FacebookModule {}

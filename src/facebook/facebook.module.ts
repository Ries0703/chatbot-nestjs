import { Module } from '@nestjs/common';
import { MessengerWorkerService } from './messenger-worker.service';
import { QueueModule } from '../queue/queue.module';
import { SendApiService } from './send-api.service';
import { HttpModule } from '@nestjs/axios';
import { DatabaseService } from './database.service';
import OpenAI from 'openai';
import { config } from '../config/app.config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { Utils } from './utils';

@Module({
  imports: [
    QueueModule,
    HttpModule,
    EventEmitterModule,
    RedisModule.forRoot({
      config: {
        url: config.redisConfig.REDIS_URL,
      },
    }),
  ],
  providers: [
    MessengerWorkerService,
    SendApiService,
    DatabaseService,
    Utils,
    {
      provide: OpenAI,
      useValue: new OpenAI({ apiKey: config.openAIConfig.OPENAI_API_KEY }),
    },
  ],
})
export class FacebookModule {}

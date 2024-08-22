import { Provider } from '@nestjs/common';
import OpenAI from 'openai';
import * as process from 'node:process';

export const OpenaiProvider: Provider = {
  provide: OpenAI,
  useFactory: (): OpenAI => {
    return new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  },
};

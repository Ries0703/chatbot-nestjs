import { Provider } from '@nestjs/common';
import OpenAI from 'openai';
import { config } from '../../../config/app.config';

export const OpenaiProvider: Provider = {
  provide: OpenAI,
  useFactory: (): OpenAI => {
    return new OpenAI({
      apiKey: config.openAIConfig.OPENAI_API_KEY,
    });
  },
};

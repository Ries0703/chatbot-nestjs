import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class AssistantService {
  constructor(private readonly client: OpenAI) {}
  async getAssistant(): Promise<object> {
    return this.client.beta.assistants.retrieve(
      'asst_TuMj0W7zbivM27ZIflT65062',
    );
  }
}

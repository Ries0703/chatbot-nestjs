import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Platform } from '../../config/enum';
import { Job } from 'bullmq';
import { sleep } from 'openai/core';

@Processor(`${Platform.messenger}_webhook`)
export class WorkerService extends WorkerHost {
  async process(job: Job, token?: string): Promise<void> {
    await sleep(40000);
    console.log(
      `processing job ${job.name} with token ${token}: ${JSON.stringify(job, null, 2)}`,
    );
  }
}

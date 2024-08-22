import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Platform } from '../../config/enum';
import { Job } from 'bullmq';

@Processor(`${Platform.messenger}_webhook`)
export class WorkerService extends WorkerHost {
  async process(job: Job, token?: string): Promise<void> {
    console.log(
      `processing job ${job.name} with token ${token}: ${JSON.stringify(job, null, 2)}`,
    );
  }
}

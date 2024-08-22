import { Module } from '@nestjs/common';
import { ProcessorModule } from './processor/processor.module';

@Module({
  imports: [ProcessorModule],
})
export class WorkerModule {}

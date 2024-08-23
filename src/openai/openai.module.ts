import { Module } from '@nestjs/common';
import { AssistantService } from './assistant.service';
import { ThreadService } from './thread.service';
import { RunService } from './run.service';
import { FileService } from './file.service';
import { VectorStoreService } from './vector-store.service';

@Module({
  providers: [AssistantService, ThreadService, RunService, FileService, VectorStoreService]
})
export class OpenaiModule {}

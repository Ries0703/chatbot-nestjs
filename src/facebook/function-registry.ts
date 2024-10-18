import { Injectable, Logger } from '@nestjs/common';
import { SendAttachmentFunction } from './function-handlers/send-attachment.function';
import { GenericFunction } from './function-handlers/generic-function';
import { EventMetadataTypes } from '../types/event-metadata.types';

@Injectable()
export class FunctionRegistry {
  private readonly logger = new Logger(FunctionRegistry.name);
  private readonly functionMap: Record<string, GenericFunction<any, any>>;

  constructor(private readonly sendAttachmentFunction: SendAttachmentFunction) {
    this.functionMap = {
      sendAttachment: this.sendAttachmentFunction,
    };
  }

  async triggerFunctionByName(
    functionName: string,
    args: any,
    eventMetadata: EventMetadataTypes,
  ): Promise<any> {
    const funcHandler = this.functionMap[functionName];
    if (funcHandler) {
      this.logger.log(`Invoking function: ${functionName}`);
      return await funcHandler.handler(args, eventMetadata);
    } else {
      throw new Error(`Function ${functionName} not found.`);
    }
  }
}

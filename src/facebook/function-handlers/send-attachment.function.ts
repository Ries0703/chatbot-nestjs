import { Injectable, Logger } from '@nestjs/common';
import { SendApiService } from '../send-api.service';
import { GenericFunction } from './generic-function';
import { SendImageFunctionInput } from '../../types/function.types';
import { EventMetadataTypes } from '../../types/event-metadata.types';

@Injectable()
export class SendAttachmentFunction
  implements GenericFunction<SendImageFunctionInput, string>
{
  private readonly logger = new Logger(SendAttachmentFunction.name);

  constructor(private readonly sendApiService: SendApiService) {}

  async handler(
    input: SendImageFunctionInput,
    eventMetadata: EventMetadataTypes,
  ): Promise<string> {
    const result = this.sendApiService.sendAttachment({
      body: {
        recipient: { id: eventMetadata.pageScopedId },
        messaging_type: 'RESPONSE',
        message: {
          attachment: {
            type: input.attachmentType,
            payload: { url: input.attachmentUrl },
          },
        },
      },
      params: {
        access_token: eventMetadata.accessToken,
      },
    });
    return (await result) ? 'success' : 'fail';
  }
}

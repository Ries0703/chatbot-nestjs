import { EventMetadataTypes } from '../../types/event-metadata.types';

export interface GenericFunction<Input, Output> {
  handler(input: Input, eventMetadata: EventMetadataTypes): Promise<Output>;
}

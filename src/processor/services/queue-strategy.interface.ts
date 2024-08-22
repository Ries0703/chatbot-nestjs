export interface QueueStrategy {
  addJob(data: any): Promise<void>;
}

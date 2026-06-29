import { Job, JobDataMap, JobHandler, JobType, QueueOptions, QueueProvider, WorkerRegistry } from './interfaces';

// Simple in-memory implementation of the Queue architecture
class MemoryQueueProvider implements QueueProvider, WorkerRegistry {
  private jobs: Map<string, Job> = new Map();
  private handlers: Map<JobType, JobHandler<any>> = new Map();

  async enqueue<T extends JobType>(type: T, data: JobDataMap[T], options?: QueueOptions): Promise<Job<T>> {
    const job: Job<T> = {
      id: Math.random().toString(36).substring(7),
      type,
      data,
      status: 'QUEUED',
      progress: 0,
      timestamp: new Date()
    };

    this.jobs.set(job.id, job as Job);

    // In a real queue, this would push to Redis. Here we just process it immediately in the background
    setTimeout(() => this.processJob(job.id), options?.delay || 0);

    return job;
  }

  async getJob(id: string): Promise<Job | null> {
    return this.jobs.get(id) || null;
  }

  async cancelJob(id: string): Promise<boolean> {
    const job = this.jobs.get(id);
    if (!job || job.status === 'COMPLETED' || job.status === 'FAILED') return false;
    this.jobs.delete(id);
    return true;
  }

  register<T extends JobType>(type: T, handler: JobHandler<T>): void {
    this.handlers.set(type, handler);
  }

  startProcessing(): void {
    console.log('[Queue] In-memory queue processor started');
  }

  async stopProcessing(): Promise<void> {
    console.log('[Queue] In-memory queue processor stopped');
  }

  private async processJob(id: string) {
    const job = this.jobs.get(id);
    if (!job) return;

    const handler = this.handlers.get(job.type);
    if (!handler) {
      job.status = 'FAILED';
      job.error = `No handler registered for ${job.type}`;
      return;
    }

    job.status = 'ACTIVE';
    try {
      const result = await handler.handle(job);
      job.status = 'COMPLETED';
      job.result = result;
      if (handler.onCompleted) handler.onCompleted(job, result);
    } catch (error: any) {
      job.status = 'FAILED';
      job.error = error.message;
      if (handler.onFailed) handler.onFailed(job, error);
    }
  }
}

export const queueProvider = new MemoryQueueProvider();

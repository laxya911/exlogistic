// ---------------------------------------------------------------------------
// Background Services Architecture - Core Interfaces
// Designed to be provider-agnostic (BullMQ, RabbitMQ, Redis, etc.)
// ---------------------------------------------------------------------------

export type JobType = 
  | 'EMAIL_SEND'
  | 'NOTIFICATION_PUSH'
  | 'PDF_GENERATE'
  | 'CURRENCY_SYNC'
  | 'DAILY_BACKUP'
  | 'SCHEDULED_REPORT'
  | 'REMINDER_TASK';

// Specific Payloads for Strict Typing
export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
  isHtml?: boolean;
}

export interface PdfPayload {
  documentType: 'QUOTATION' | 'INVOICE' | 'PURCHASE_ORDER';
  entityId: string;
  templateId?: string;
}

export interface SyncPayload {
  provider: string; // e.g., 'openexchangerates'
}

export interface GenericPayload {
  [key: string]: any;
}

// Discriminated Union for Payload
export type JobDataMap = {
  EMAIL_SEND: EmailPayload;
  NOTIFICATION_PUSH: GenericPayload;
  PDF_GENERATE: PdfPayload;
  CURRENCY_SYNC: SyncPayload;
  DAILY_BACKUP: GenericPayload;
  SCHEDULED_REPORT: GenericPayload;
  REMINDER_TASK: GenericPayload;
};

// Queue Options (supports native cron schedules as per best practice)
export interface QueueOptions {
  delay?: number; // Delay execution by X ms
  priority?: number; // Priority 1-10
  attempts?: number; // Retry count
  backoff?: { type: 'fixed' | 'exponential'; delay: number }; // Retry backoff
  repeat?: { cron: string; tz?: string }; // Native cron support
}

// Standard Job Object
export interface Job<T extends JobType = JobType> {
  id: string;
  type: T;
  data: JobDataMap[T];
  status: 'QUEUED' | 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'DELAYED';
  progress: number;
  timestamp: Date;
  error?: string;
  result?: any;
}

// Contract for the Queue Provider (e.g., BullMQ wrapper)
export interface QueueProvider {
  enqueue<T extends JobType>(type: T, data: JobDataMap[T], options?: QueueOptions): Promise<Job<T>>;
  getJob(id: string): Promise<Job | null>;
  cancelJob(id: string): Promise<boolean>;
}

// Contract for Job Processors
export interface JobHandler<T extends JobType> {
  handle(job: Job<T>): Promise<any>;
  onFailed?(job: Job<T>, error: Error): void;
  onCompleted?(job: Job<T>, result: any): void;
}

// Contract for Worker Initialization
export interface WorkerRegistry {
  register<T extends JobType>(type: T, handler: JobHandler<T>): void;
  startProcessing(): void;
  stopProcessing(): Promise<void>;
}

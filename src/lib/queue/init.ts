import { queueProvider } from './memory-provider';
import { WorkflowExecuteHandler } from './handlers/workflow-execute';
import { SendNotificationHandler } from './handlers/send-notification';

let initialized = false;

export function initializeQueue() {
  if (initialized) return;
  
  // Register handlers
  queueProvider.register('WORKFLOW_EXECUTE', new WorkflowExecuteHandler());
  queueProvider.register('SEND_NOTIFICATION', new SendNotificationHandler());
  
  // Add other handlers here in the future
  
  initialized = true;
  console.log('[Queue] Handlers registered.');
}

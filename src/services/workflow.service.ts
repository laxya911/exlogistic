import { prisma } from '@/repositories/prisma.client';
import { queueProvider } from '@/lib/queue/memory-provider';
import { logger } from '@/lib/logger';
import { initializeQueue } from '@/lib/queue/init';

export class WorkflowEngine {
  /**
   * Evaluates active workflow rules for a given entity and trigger condition.
   * If matched, enqueues a background job to execute the workflow action.
   */
  static async evaluateRules(triggerEntity: string, entityId: string, currentStatus: string, oldStatus?: string) {
    initializeQueue();
    
    if (currentStatus === oldStatus) return;

    logger.info(`Evaluating workflows for ${triggerEntity} (ID: ${entityId}, Status: ${currentStatus})`);

    try {
      // Auto-seed rule if missing
      const ruleCount = await prisma.workflowRule.count({ where: { action: 'CREATE_SALES_ORDER' } });
      if (ruleCount === 0) {
        await prisma.workflowRule.create({
          data: {
            name: 'Auto-create Sales Order on Quote Approval',
            description: 'Automatically generate a drafted sales order when a quotation is fully approved.',
            triggerEntity: 'Quotation',
            triggerCondition: { status: 'APPROVED' },
            action: 'CREATE_SALES_ORDER',
            actionPayload: {},
            isActive: true
          }
        });
      }

      const activeRules = await prisma.workflowRule.findMany({
        where: {
          triggerEntity,
          isActive: true
        }
      });

      for (const rule of activeRules) {
        const condition = rule.triggerCondition as { status?: string };
        
        // Simple condition matching
        if (condition.status && condition.status === currentStatus) {
          logger.info(`Rule matched! Enqueueing action: ${rule.action}`);
          
          await queueProvider.enqueue('WORKFLOW_EXECUTE', {
            ruleId: rule.id,
            triggerEntity,
            entityId,
            action: rule.action,
            actionPayload: rule.actionPayload as Record<string, any> | undefined
          });
        }
      }
    } catch (e) {
      logger.error('Failed to evaluate workflow rules', e);
    }
  }
}

import { JobHandler, Job, WorkflowPayload } from '../interfaces';
import { prisma } from '@/repositories/prisma.client';
import { salesOrderRepository } from '@/repositories/repository';
import { logger } from '../../logger';

export class WorkflowExecuteHandler implements JobHandler<'WORKFLOW_EXECUTE'> {
  async handle(job: Job<'WORKFLOW_EXECUTE'>): Promise<any> {
    const { action, entityId, triggerEntity } = job.data;
    
    logger.info(`[WORKFLOW_EXECUTE] Executing action ${action} for ${triggerEntity}:${entityId}`);
    
    try {
      if (action === 'CREATE_SALES_ORDER' && triggerEntity === 'Quotation') {
        const orderNo = `SO-${Math.random().toString(36).substring(7).toUpperCase()}`;

        // Wait, because the UI uses the mock DB, we must add it to the mock DB first
        // so it appears in the frontend when navigating to /sales-orders/SO-XYZ
        const newSo = await salesOrderRepository.create({
          orderNo: orderNo,
          quotationId: entityId,
          customerId: 'CUST-0006', // Mock customer
          date: new Date().toISOString(),
          status: 'PENDING',
          totalValue: 0,
          items: []
        });

        // Also attempt Prisma insert for future-proofing
        try {
          const quote = await prisma.quotation.findUnique({ where: { id: entityId }, include: { items: true } });
          if (quote) {
            await prisma.salesOrder.create({
              data: {
                id: newSo.id,
                orderNo: orderNo,
                customerId: quote.customerId,
                quotationId: quote.id,
                date: new Date(),
                totalValue: quote.totalValue,
                status: 'DRAFT',
                items: {
                  create: quote.items.map(i => ({
                    variantId: i.variantId,
                    quantity: i.quantity,
                    unitPrice: i.unitPrice
                  }))
                }
              }
            });
          }
        } catch (e) {
          logger.warn(`[WORKFLOW] Could not insert to Prisma (expected if mock ID used): ${e}`);
        }
        
        logger.info(`[WORKFLOW] Successfully auto-created Sales Order: ${orderNo} (Mock ID: ${newSo.id})`);
        return { salesOrderId: newSo.id, orderNo };
      }
      
      // More actions can be implemented here (Suggest PO, Goods Receipt, etc)
      
      logger.warn(`[WORKFLOW_EXECUTE] Unhandled action type: ${action}`);
      return { skipped: true, reason: 'Unhandled action type' };

    } catch (error: any) {
      logger.error(`[WORKFLOW_EXECUTE] Failed to execute ${action}`, error);
      throw error;
    }
  }

  onCompleted(job: Job<'WORKFLOW_EXECUTE'>, result: any) {
    logger.info(`[Queue Event] Workflow Job ${job.id} completed.`);
  }

  onFailed(job: Job<'WORKFLOW_EXECUTE'>, error: Error) {
    logger.error(`[Queue Event] Workflow Job ${job.id} failed:`, error);
  }
}

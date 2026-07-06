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
        const quote = await prisma.quotation.findUnique({ 
          where: { id: entityId }, 
          include: { items: true } 
        });

        if (!quote) {
          logger.warn(`[WORKFLOW] Quotation ${entityId} not found. Cannot create Sales Order.`);
          return { skipped: true, reason: 'Quotation not found' };
        }

        const orderNo = `SO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        // Create via the main repository so data is mapped and inserted correctly
        const newSo = await salesOrderRepository.create({
          orderNo: orderNo,
          quotationId: quote.id,
          customerId: quote.customerId,
          date: new Date().toISOString(), // Fix: expected string
          status: 'DRAFT' as any, // Fix: DRAFT is in Prisma but missing in UI types
          totalValue: quote.totalValue,
          incoterm: quote.incoterm || undefined,
          paymentTerms: quote.paymentTerms || undefined,
          currency: quote.currency || undefined,
          marginPercentage: quote.marginPercentage || undefined,
          containerType: quote.container || undefined,
          items: quote.items.map(i => ({
            productId: i.variantId || '',
            variantId: i.variantId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            totalPrice: i.quantity * i.unitPrice
          }))
        });
        
        logger.info(`[WORKFLOW] Successfully auto-created Sales Order: ${orderNo} (ID: ${newSo.id})`);
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

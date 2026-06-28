import { purchaseOrderRepository } from '@/repositories/repository';
import { PurchaseOrder, PurchaseOrderTimelineEvent } from '@/types';

class PurchaseOrderService {
  /**
   * Validate a purchase order payload before create/update.
   */
  async validate(data: Partial<PurchaseOrder>, isUpdate: boolean): Promise<void> {
    const errors: string[] = [];

    if (!data.supplierId) errors.push('Supplier selection is required');
    if (!data.date) errors.push('PO issue date is required');
    if (!data.expectedDeliveryDate) errors.push('Expected delivery date is required');
    if (!data.items || data.items.length === 0) errors.push('At least one procurement line item is required');

    if (data.items) {
      data.items.forEach((item, idx) => {
        if (!item.productId) errors.push(`Item ${idx + 1}: Product is required`);
        if (!item.quantity || item.quantity <= 0) errors.push(`Item ${idx + 1}: Quantity must be > 0`);
        if (!item.unitPrice || item.unitPrice <= 0) errors.push(`Item ${idx + 1}: Unit cost must be > 0`);
      });
    }

    if (data.date && data.expectedDeliveryDate) {
      if (new Date(data.expectedDeliveryDate) <= new Date(data.date)) {
        errors.push('Expected delivery date must be after the PO issue date');
      }
    }

    if (!isUpdate && data.poNo) {
      const all = await purchaseOrderRepository.getAll();
      const duplicate = all.find(po => po.poNo === data.poNo && po.id !== data.id);
      if (duplicate) errors.push(`PO reference '${data.poNo}' already exists`);
    }

    if (errors.length > 0) throw new Error(errors.join(' | '));
  }

  /**
   * Append a timeline event to a PO record.
   */
  logEvent(
    po: PurchaseOrder,
    type: PurchaseOrderTimelineEvent['type'],
    title: string,
    description: string
  ): void {
    if (!po.timeline) po.timeline = [];
    po.timeline.unshift({
      id: `EV-${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString(),
      type,
      title,
      description,
      userId: 'USR-001'
    });
  }

  /**
   * Duplicate a purchase order as a new DRAFT.
   */
  async duplicate(id: string): Promise<PurchaseOrder> {
    const original = await purchaseOrderRepository.getById(id);
    if (!original) throw new Error('Source purchase order not found');

    const all = await purchaseOrderRepository.getAll();
    const now = new Date().toISOString();
    const newPoNo = `PO-${new Date().getFullYear()}-${(all.length + 1).toString().padStart(4, '0')}-COPY`;

    const copy: Partial<PurchaseOrder> = {
      poNo: newPoNo,
      salesOrderId: original.salesOrderId,
      supplierId: original.supplierId,
      date: now,
      expectedDeliveryDate: original.expectedDeliveryDate,
      items: original.items.map(item => ({ ...item })),
      totalValue: original.totalValue,
      currency: original.currency,
      exchangeRate: original.exchangeRate,
      paymentTerms: original.paymentTerms,
      deliveryTerms: original.deliveryTerms,
      qualitySpec: original.qualitySpec,
      packagingSpec: original.packagingSpec,
      status: 'DRAFT',
      remarks: original.remarks ? `[COPIED FROM ${original.poNo}] ${original.remarks}` : undefined,
      timeline: [
        {
          id: `EV-${Math.random().toString(36).substr(2, 9)}`,
          date: now,
          type: 'CREATED',
          title: 'Purchase Order Duplicated',
          description: `Duplicated from ${original.poNo}. Review terms before issuing.`,
          userId: 'USR-001'
        }
      ],
      documents: [],
      entityStatus: 'ACTIVE'
    };

    return purchaseOrderRepository.create(copy);
  }
}

export const purchaseOrderService = new PurchaseOrderService();

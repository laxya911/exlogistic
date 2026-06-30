import { salesOrderRepository } from '@/repositories/repository';
import { SalesOrder, SalesOrderTimelineEvent } from '@/types';

class SalesOrderService {
  /**
   * Validate a sales order payload before create/update.
   * Throws a descriptive error string on validation failure.
   */
  async validate(data: Partial<SalesOrder>, isUpdate: boolean): Promise<void> {
    const errors: string[] = [];

    if (!data.customerId) errors.push('Customer ID is required');
    if (!data.date) errors.push('Order date is required');
    if (!data.expectedShipmentDate) errors.push('Expected shipment date is required');
    if (!data.items || data.items.length === 0) errors.push('At least one line item is required');

    if (data.items) {
      data.items.forEach((item, idx) => {
        if (!item.productId) errors.push(`Item ${idx + 1}: Product SKU is required`);
        if (!item.quantity || item.quantity <= 0) errors.push(`Item ${idx + 1}: Quantity must be greater than zero`);
        if (!item.unitPrice || item.unitPrice <= 0) errors.push(`Item ${idx + 1}: Unit price must be greater than zero`);
      });
    }

    if (data.date && data.expectedShipmentDate) {
      if (new Date(data.expectedShipmentDate) <= new Date(data.date)) {
        errors.push('Expected shipment date must be after the order date');
      }
    }

    if (!isUpdate && data.orderNo) {
      const all = await salesOrderRepository.getAll();
      const duplicate = all.find(so => so.orderNo === data.orderNo && so.id !== data.id);
      if (duplicate) errors.push(`Order reference '${data.orderNo}' is already registered`);
    }

    if (errors.length > 0) {
      throw new Error(errors.join(' | '));
    }
  }

  /**
   * Append a timeline event to an existing sales order.
   */
  logEvent(
    order: SalesOrder,
    type: SalesOrderTimelineEvent['type'],
    title: string,
    description: string
  ): void {
    if (!order.timeline) order.timeline = [];
    order.timeline.unshift({
      id: `EV-${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString(),
      type,
      title,
      description,
      userId: 'USR-001'
    });
  }

  /**
   * Duplicate an existing sales order as a new CONFIRMED draft.
   * The new order gets a fresh reference number.
   */
  async duplicate(id: string): Promise<SalesOrder> {
    const original = await salesOrderRepository.getById(id);
    if (!original) throw new Error('Source sales order not found');

    const all = await salesOrderRepository.getAll();
    const now = new Date().toISOString();
    const counter = all.length + 1;
    const newOrderNo = `SO-${new Date().getFullYear()}-${counter.toString().padStart(4, '0')}-COPY`;

    const copy: Partial<SalesOrder> = {
      orderNo: newOrderNo,
      quotationId: original.quotationId,
      customerId: original.customerId,
      date: now,
      expectedShipmentDate: original.expectedShipmentDate,
      items: original.items.map((item: any) => ({ ...item })),
      totalValue: original.totalValue,
      marginPercentage: original.marginPercentage,
      currency: original.currency,
      exchangeRate: original.exchangeRate,
      incoterm: original.incoterm,
      paymentTerms: original.paymentTerms,
      originPortId: original.originPortId,
      destinationPortId: original.destinationPortId,
      containerType: original.containerType,
      status: 'CONFIRMED',
      remarks: original.remarks ? `[COPIED FROM ${original.orderNo}] ${original.remarks}` : undefined,
      timeline: [
        {
          id: `EV-${Math.random().toString(36).substr(2, 9)}`,
          date: now,
          type: 'CREATED',
          title: 'Sales Order Duplicated',
          description: `Duplicated from source order ${original.orderNo}.`,
          userId: 'USR-001'
        }
      ],
      documents: [],
      entityStatus: 'ACTIVE',
    };

    return salesOrderRepository.create(copy);
  }
}

export const salesOrderService = new SalesOrderService();

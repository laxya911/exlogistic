import { 
  quotationRepository, 
  salesOrderRepository, 
  purchaseOrderRepository, 
  shipmentRepository,
  taskRepository
} from '../repositories/repository';
import { numberingService } from './numbering.service';
import { Quotation, SalesOrder, PurchaseOrder, Shipment } from '../types';

class WorkflowService {
  async approveQuotation(id: string) {
    const quote = await quotationRepository.getById(id);
    if (!quote) throw new Error('Quotation not found');

    await quotationRepository.update(id, { status: 'APPROVED' });

    // Generate Sales Order
    const soData: Partial<SalesOrder> = {
      orderNo: numberingService.getSalesOrderNumber(),
      quotationId: quote.id,
      customerId: quote.customerId,
      date: new Date().toISOString(),
      expectedShipmentDate: new Date(Date.now() + 30 * 86400000).toISOString(),
      items: quote.items,
      totalValue: quote.totalValue,
      status: 'CONFIRMED'
    };

    const so = await salesOrderRepository.create(soData);

    // Create a follow-up task
    await taskRepository.create({
      title: `Procure products for SO: ${so.orderNo}`,
      description: `New Sales Order confirmed. Initiate procurement for ${quote.items.length} items.`,
      dueDate: new Date(Date.now() + 2 * 86400000).toISOString(),
      priority: 'HIGH',
      category: 'FOLLOW_UP',
      relatedId: so.id,
      isCompleted: false
    });

    return so;
  }

  async createShipmentFromOrder(orderId: string) {
    const order = await salesOrderRepository.getById(orderId);
    if (!order) throw new Error('Order not found');

    const shipmentData: Partial<Shipment> = {
      shipmentNo: numberingService.getShipmentNumber(),
      orderId: order.id,
      originPortId: 'TYO',
      destinationPortId: 'LAX',
      etd: new Date(Date.now() + 7 * 86400000).toISOString(),
      eta: new Date(Date.now() + 21 * 86400000).toISOString(),
      containerType: '20GP',
      status: 'BOOKING',
      timeline: [{
        id: `EV-${Math.random().toString(36).substr(2, 9)}`,
        date: new Date().toISOString(),
        type: 'BOOKING' as const,
        title: 'Shipment Booking Created',
        description: 'Initial booking created from Sales Order.',
        userId: 'USR-001'
      }]
    };

    return shipmentRepository.create(shipmentData);
  }
}

export const workflowService = new WorkflowService();

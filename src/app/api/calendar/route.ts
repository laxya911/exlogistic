import { NextResponse } from 'next/server';
import { 
  shipmentRepository,
  quotationRepository,
  salesOrderRepository,
  purchaseOrderRepository,
  taskRepository
} from '@/repositories/repository';
import { CalendarEvent } from '@/types';

export async function GET() {
  try {
    const [shipments, quotations, salesOrders, purchaseOrders, tasks] = await Promise.all([
      shipmentRepository.getAll(),
      quotationRepository.getAll(),
      salesOrderRepository.getAll(),
      purchaseOrderRepository.getAll(),
      taskRepository.getAll()
    ]);

    const events: CalendarEvent[] = [];

    // 1. Shipments (ETD & ETA)
    shipments.filter(s => s.entityStatus !== 'DELETED').forEach(shp => {
      if (shp.etd) {
        events.push({
          id: `etd-${shp.id}`,
          title: `ETD: ${shp.shipmentNo} (${shp.originPortId})`,
          start: shp.etd,
          end: shp.etd,
          type: 'ETD',
          relatedId: shp.id,
          entityStatus: 'ACTIVE',
          createdAt: shp.createdAt,
          updatedAt: shp.updatedAt
        });
      }
      if (shp.eta) {
        events.push({
          id: `eta-${shp.id}`,
          title: `ETA: ${shp.shipmentNo} (${shp.destinationPortId})`,
          start: shp.eta,
          end: shp.eta,
          type: 'ETA',
          relatedId: shp.id,
          entityStatus: 'ACTIVE',
          createdAt: shp.createdAt,
          updatedAt: shp.updatedAt
        });
      }
    });

    // 2. Quotation Expiries
    quotations.filter(q => q.entityStatus !== 'DELETED' && (q.status === 'SENT' || q.status === 'REVISED')).forEach(q => {
      if (q.validityDate) {
        events.push({
          id: `quote-${q.id}`,
          title: `Expiry: ${q.quotationNo}`,
          start: q.validityDate,
          end: q.validityDate,
          type: 'QUOTATION_EXPIRY',
          relatedId: q.id,
          entityStatus: 'ACTIVE',
          createdAt: q.createdAt,
          updatedAt: q.updatedAt
        });
      }
    });

    // 3. Purchase Orders (Expected Delivery)
    purchaseOrders.filter(po => po.entityStatus !== 'DELETED' && po.status !== 'CANCELLED' && po.status !== 'RECEIVED').forEach(po => {
      if (po.expectedDeliveryDate) {
        events.push({
          id: `po-${po.id}`,
          title: `PO Delivery: ${po.poNo}`,
          start: po.expectedDeliveryDate,
          end: po.expectedDeliveryDate,
          type: 'PO_DELIVERY',
          relatedId: po.id,
          entityStatus: 'ACTIVE',
          createdAt: po.createdAt,
          updatedAt: po.updatedAt
        });
      }
    });

    // 4. Tasks (Due Dates)
    tasks.filter(t => t.entityStatus !== 'DELETED' && !t.isCompleted).forEach(t => {
      if (t.dueDate) {
        events.push({
          id: `task-${t.id}`,
          title: `Task: ${t.title}`,
          start: t.dueDate,
          end: t.dueDate,
          type: 'MEETING', // Using meeting as generic task color map for now, or we can use custom
          relatedId: t.relatedId || t.id,
          entityStatus: 'ACTIVE',
          createdAt: t.createdAt,
          updatedAt: t.updatedAt
        });
      }
    });

    return NextResponse.json(events);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { salesOrderRepository } from '@/repositories/repository';
import { salesOrderService } from '@/services/sales-order.service';
import { WorkflowEngine } from '@/services/workflow.service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await salesOrderRepository.getById(id);
    if (!item || item.entityStatus === 'DELETED') {
      return NextResponse.json({ error: 'Sales Order not found' }, { status: 404 });
    }
    return NextResponse.json(item);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const existingOrder = await salesOrderRepository.getById(id);

    if (!existingOrder) {
      return NextResponse.json({ error: 'Sales Order not found' }, { status: 404 });
    }

    const { action, ...data } = body;

    // Custom workflow actions
    if (action) {
      if (action === 'book_shipment') {
        const oldStatus = existingOrder.status;
        existingOrder.status = 'SHIPPED';
        salesOrderService.logEvent(existingOrder, 'SHIPPED', 'Cargo Dispatched — Shipment Booked', `Shipment process initiated.`);
        const updated = await salesOrderRepository.update(id, existingOrder);
        
        // Trigger generic workflow engine
        await WorkflowEngine.evaluateRules('SalesOrder', id, 'SHIPPED', oldStatus);
        
        return NextResponse.json({ message: 'Shipment booking triggered', order: updated });
      }

      if (action === 'confirm') {
        existingOrder.status = 'CONFIRMED';
        salesOrderService.logEvent(existingOrder, 'CONFIRMED', 'Order Confirmed', 'Export contract confirmed. Procurement team notified.');
        const updated = await salesOrderRepository.update(id, existingOrder);
        return NextResponse.json(updated);
      }

      if (action === 'start_production') {
        existingOrder.status = 'PRODUCTION';
        salesOrderService.logEvent(existingOrder, 'PRODUCTION_STARTED', 'Production / Procurement Started', 'Factory notified. Production schedule confirmed.');
        const updated = await salesOrderRepository.update(id, existingOrder);
        return NextResponse.json(updated);
      }

      if (action === 'mark_ready') {
        existingOrder.status = 'READY';
        salesOrderService.logEvent(existingOrder, 'READY_FOR_SHIPMENT', 'Cargo Ready at Warehouse', 'Goods inspected and cleared. Ready for loading.');
        const updated = await salesOrderRepository.update(id, existingOrder);
        return NextResponse.json(updated);
      }

      if (action === 'cancel') {
        existingOrder.status = 'CANCELLED';
        existingOrder.entityStatus = 'INACTIVE';
        salesOrderService.logEvent(existingOrder, 'CANCELLED', 'Order Cancelled', 'Sales order cancelled and deactivated.');
        const updated = await salesOrderRepository.update(id, existingOrder);
        return NextResponse.json(updated);
      }

      if (action === 'duplicate') {
        const copy = await salesOrderService.duplicate(id);
        return NextResponse.json(copy);
      }

      if (action === 'archive') {
        existingOrder.entityStatus = 'ARCHIVED';
        salesOrderService.logEvent(existingOrder, 'ARCHIVED', 'Order Archived', 'Archived to historical records vault.');
        const updated = await salesOrderRepository.update(id, existingOrder);
        return NextResponse.json(updated);
      }

      if (action === 'restore') {
        existingOrder.entityStatus = 'ACTIVE';
        salesOrderService.logEvent(existingOrder, 'RESTORED', 'Order Restored', 'Restored to active contract registry.');
        const updated = await salesOrderRepository.update(id, existingOrder);
        return NextResponse.json(updated);
      }

      if (action === 'add_note') {
        const { note } = data as any;
        if (!note) return NextResponse.json({ error: 'Note text is required' }, { status: 400 });
        salesOrderService.logEvent(existingOrder, 'NOTE_ADDED', 'Field Note Logged', note);
        const updated = await salesOrderRepository.update(id, existingOrder);
        return NextResponse.json(updated);
      }

      return NextResponse.json({ error: 'Invalid custom action specified' }, { status: 400 });
    }

    // Normal field update
    data.id = id;
    salesOrderService.logEvent(existingOrder, 'UPDATED', 'Order Details Updated', 'Contract specifications or terms updated.');

    const updatedOrder = await salesOrderRepository.update(id, {
      ...data,
      timeline: existingOrder.timeline,
      documents: data.documents ?? existingOrder.documents,
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json(updatedOrder);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existingOrder = await salesOrderRepository.getById(id);
    if (!existingOrder) {
      return NextResponse.json({ error: 'Sales Order not found' }, { status: 404 });
    }

    existingOrder.entityStatus = 'DELETED';
    salesOrderService.logEvent(existingOrder, 'ARCHIVED', 'Order Soft-Deleted', 'Removed from active contract registry. Recoverable.');
    await salesOrderRepository.update(id, existingOrder);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

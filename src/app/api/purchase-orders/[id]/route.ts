import { NextResponse } from 'next/server';
import { purchaseOrderRepository } from '@/repositories/repository';
import { purchaseOrderService } from '@/services/purchase-order.service';
import { inventoryService } from '@/services/inventory.service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await purchaseOrderRepository.getById(id);
    if (!item || item.entityStatus === 'DELETED') {
      return NextResponse.json({ error: 'Purchase Order not found' }, { status: 404 });
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
    const existingPO = await purchaseOrderRepository.getById(id);

    if (!existingPO) {
      return NextResponse.json({ error: 'Purchase Order not found' }, { status: 404 });
    }

    const { action, ...data } = body;

    if (action) {
      if (action === 'issue') {
        existingPO.status = 'ISSUED';
        purchaseOrderService.logEvent(existingPO, 'ISSUED', 'PO Issued to Supplier', 'Purchase order formally issued. Supplier notified via registered channel.');
        const updated = await purchaseOrderRepository.update(id, existingPO);
        return NextResponse.json(updated);
      }

      if (action === 'acknowledge') {
        existingPO.status = 'ACKNOWLEDGED';
        purchaseOrderService.logEvent(existingPO, 'ACKNOWLEDGED', 'Supplier Acknowledged PO', 'Supplier confirmed acceptance of PO terms and delivery commitment.');
        const updated = await purchaseOrderRepository.update(id, existingPO);
        return NextResponse.json(updated);
      }

      if (action === 'start_production') {
        existingPO.status = 'IN_PRODUCTION';
        purchaseOrderService.logEvent(existingPO, 'IN_PRODUCTION', 'Production Commenced at Factory', 'Factory production started. Pre-production sample dispatched for approval.');
        const updated = await purchaseOrderRepository.update(id, existingPO);
        return NextResponse.json(updated);
      }

      if (action === 'dispatch') {
        existingPO.status = 'DISPATCHED';
        purchaseOrderService.logEvent(existingPO, 'DISPATCHED', 'Cargo Dispatched from Factory', 'Goods dispatched from factory. Lorry receipt / dispatch note available.');
        const updated = await purchaseOrderRepository.update(id, existingPO);
        return NextResponse.json(updated);
      }

      if (action === 'receive') {
        existingPO.status = 'RECEIVED';
        purchaseOrderService.logEvent(existingPO, 'RECEIVED', 'Goods Received & Quality Cleared', 'Cargo received at warehouse. Quality inspection passed. GRN issued.');
        const updated = await purchaseOrderRepository.update(id, existingPO);

        // Update Inventory Stock for each item
        if (existingPO.items && existingPO.items.length > 0) {
          for (const item of existingPO.items) {
            await inventoryService.adjustStock(
              item.variantId,
              item.quantity,
              'RECEIPT',
              'PURCHASE_ORDER',
              id,
              `GRN Issued for PO ${existingPO.poNo}`
            );
          }
        }

        return NextResponse.json(updated);
      }

      if (action === 'cancel') {
        existingPO.status = 'CANCELLED';
        existingPO.entityStatus = 'INACTIVE';
        purchaseOrderService.logEvent(existingPO, 'CANCELLED', 'Purchase Order Cancelled', 'PO cancelled and deactivated from procurement pipeline.');
        const updated = await purchaseOrderRepository.update(id, existingPO);
        return NextResponse.json(updated);
      }

      if (action === 'duplicate') {
        const copy = await purchaseOrderService.duplicate(id);
        return NextResponse.json(copy);
      }

      if (action === 'archive') {
        existingPO.entityStatus = 'ARCHIVED';
        purchaseOrderService.logEvent(existingPO, 'ARCHIVED', 'PO Archived', 'Archived to historical procurement vault.');
        const updated = await purchaseOrderRepository.update(id, existingPO);
        return NextResponse.json(updated);
      }

      if (action === 'restore') {
        existingPO.entityStatus = 'ACTIVE';
        purchaseOrderService.logEvent(existingPO, 'RESTORED', 'PO Restored', 'Restored to active procurement registry.');
        const updated = await purchaseOrderRepository.update(id, existingPO);
        return NextResponse.json(updated);
      }

      if (action === 'add_note') {
        const { note } = data as any;
        if (!note) return NextResponse.json({ error: 'Note text required' }, { status: 400 });
        purchaseOrderService.logEvent(existingPO, 'NOTE_ADDED', 'Procurement Note Logged', note);
        const updated = await purchaseOrderRepository.update(id, existingPO);
        return NextResponse.json(updated);
      }

      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Standard field update
    data.id = id;
    purchaseOrderService.logEvent(existingPO, 'UPDATED', 'PO Details Updated', 'Procurement specifications or terms updated.');

    const updatedPO = await purchaseOrderRepository.update(id, {
      ...data,
      timeline: existingPO.timeline,
      documents: data.documents ?? existingPO.documents,
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json(updatedPO);
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
    const existingPO = await purchaseOrderRepository.getById(id);
    if (!existingPO) {
      return NextResponse.json({ error: 'Purchase Order not found' }, { status: 404 });
    }

    existingPO.entityStatus = 'DELETED';
    purchaseOrderService.logEvent(existingPO, 'ARCHIVED', 'PO Soft-Deleted', 'Removed from active procurement registry. Recoverable.');
    await purchaseOrderRepository.update(id, existingPO);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

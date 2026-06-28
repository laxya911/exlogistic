import { NextResponse } from 'next/server';
import { shipmentRepository } from '@/repositories/repository';
import { shipmentService } from '@/services/shipment.service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await shipmentRepository.getById(id);
    if (!item || item.entityStatus === 'DELETED') {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
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
    const existing = await shipmentRepository.getById(id);
    if (!existing) return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });

    const { action, ...data } = body;

    if (action) {
      if (action === 'advance') {
        const updated = await shipmentService.advance(id);
        return NextResponse.json(updated);
      }

      if (action === 'cancel') {
        existing.status = 'CANCELLED';
        existing.entityStatus = 'INACTIVE';
        shipmentService.logEvent(existing, 'CANCELLED', 'Shipment Cancelled', 'Shipment cancelled and booking void. Carrier notified.');
        const updated = await shipmentRepository.update(id, existing);
        return NextResponse.json(updated);
      }

      if (action === 'archive') {
        existing.entityStatus = 'ARCHIVED';
        shipmentService.logEvent(existing, 'UPDATED', 'Shipment Archived', 'Archived to logistics history vault.');
        const updated = await shipmentRepository.update(id, existing);
        return NextResponse.json(updated);
      }

      if (action === 'restore') {
        existing.entityStatus = 'ACTIVE';
        shipmentService.logEvent(existing, 'UPDATED', 'Shipment Restored', 'Restored to active logistics registry.');
        const updated = await shipmentRepository.update(id, existing);
        return NextResponse.json(updated);
      }

      if (action === 'add_note') {
        const { note } = data as any;
        if (!note) return NextResponse.json({ error: 'Note text required' }, { status: 400 });
        shipmentService.logEvent(existing, 'NOTE_ADDED', 'Logistics Note Logged', note);
        const updated = await shipmentRepository.update(id, existing);
        return NextResponse.json(updated);
      }

      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Standard update
    shipmentService.logEvent(existing, 'UPDATED', 'Shipment Details Updated', 'Booking or cargo details updated.');
    const updated = await shipmentRepository.update(id, {
      ...data,
      id,
      timeline: existing.timeline,
      documents: data.documents ?? existing.documents,
      updatedAt: new Date().toISOString()
    });
    return NextResponse.json(updated);
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
    const existing = await shipmentRepository.getById(id);
    if (!existing) return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });

    existing.entityStatus = 'DELETED';
    shipmentService.logEvent(existing, 'UPDATED', 'Shipment Soft-Deleted', 'Removed from active logistics registry. Recoverable.');
    await shipmentRepository.update(id, existing);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

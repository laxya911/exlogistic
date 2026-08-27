import { NextResponse } from 'next/server';
import { supplierRepository } from '@/repositories/repository';
import { supplierService } from '@/services/supplier.service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supplier = await supplierRepository.getById(id);
    if (!supplier || supplier.entityStatus === 'DELETED') {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }
    return NextResponse.json(supplier);
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
    const data = await request.json();
    const existingSupplier = await supplierRepository.getById(id);

    if (!existingSupplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    // Handle Custom Actions
    if (data.action) {
      if (data.action === 'ARCHIVE') {
        existingSupplier.entityStatus = 'ARCHIVED';
        supplierService.logEvent(existingSupplier, 'ARCHIVED', 'Vendor Account Archived', 'Marked as archived inside vendor registry.');
        const updated = await supplierRepository.update(id, existingSupplier);
        return NextResponse.json(updated);
      }

      if (data.action === 'RESTORE') {
        existingSupplier.entityStatus = 'ACTIVE';
        supplierService.logEvent(existingSupplier, 'RESTORED', 'Vendor Account Restored', 'Restored to active vendor list.');
        const updated = await supplierRepository.update(id, existingSupplier);
        return NextResponse.json(updated);
      }

      if (data.action === 'DUPLICATE') {
        const copy = await supplierService.duplicate(id);
        return NextResponse.json(copy);
      }

      if (data.action === 'STATUS_UPDATE') {
        const newStatus = data.status; // ACTIVE, INACTIVE, ARCHIVED, DELETED
        existingSupplier.entityStatus = newStatus;
        supplierService.logEvent(existingSupplier, 'STATUS_CHANGED', `Vendor Status Transitioned`, `Status transitioned to ${newStatus}.`);
        const updated = await supplierRepository.update(id, existingSupplier);
        return NextResponse.json(updated);
      }

      return NextResponse.json({ error: 'Invalid custom action specified' }, { status: 400 });
    }

    // Detect partial update — e.g. just saving timeline (communication note)
    const isPartialUpdate = !data.name && !data.email;

    if (isPartialUpdate) {
      // Merge provided fields onto existing and save — no validation needed
      const merged = { ...existingSupplier, ...data };
      const updated = await supplierRepository.update(id, merged);
      return NextResponse.json(updated);
    }

    // Full profile edit — run validation
    data.id = id;
    await supplierService.validate(data, true);

    // Timeline Logs for specific edits
    if (data.performanceRating !== undefined && Number(data.performanceRating) !== existingSupplier.performanceRating) {
      supplierService.logEvent(
        existingSupplier,
        'RATING_CHANGED',
        'Performance Rating Updated',
        `Adjusted rating score from ${existingSupplier.performanceRating} to ${data.performanceRating}.`
      );
    }

    if (data.averageLeadTime !== undefined && Number(data.averageLeadTime) !== existingSupplier.averageLeadTime) {
      supplierService.logEvent(
        existingSupplier,
        'LEAD_TIME_CHANGED',
        'Average Lead Time Adjusted',
        `Adjusted lead time parameter from ${existingSupplier.averageLeadTime} days to ${data.averageLeadTime} days.`
      );
    }

    supplierService.logEvent(existingSupplier, 'UPDATED', 'Vendor Profile Updated', 'Updated vendor coordinates, terms, or certificates.');

    const updatedSupplier = await supplierRepository.update(id, {
      ...data,
      timeline: existingSupplier.timeline
    });

    return NextResponse.json(updatedSupplier);
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
    const existingSupplier = await supplierRepository.getById(id);
    if (!existingSupplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    existingSupplier.entityStatus = 'DELETED';
    supplierService.logEvent(existingSupplier, 'STATUS_CHANGED', 'Vendor Account Soft-Deleted', 'Soft-deleted from main vendor repository.');

    await supplierRepository.update(id, existingSupplier);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

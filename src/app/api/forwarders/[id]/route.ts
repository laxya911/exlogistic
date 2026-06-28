import { NextResponse } from 'next/server';
import { forwarderRepository } from '@/repositories/repository';
import { forwarderService } from '@/services/forwarder.service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const forwarder = await forwarderRepository.getById(id);
    if (!forwarder || forwarder.entityStatus === 'DELETED') {
      return NextResponse.json({ error: 'Forwarder not found' }, { status: 404 });
    }
    return NextResponse.json(forwarder);
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
    const existingForwarder = await forwarderRepository.getById(id);

    if (!existingForwarder) {
      return NextResponse.json({ error: 'Forwarder not found' }, { status: 404 });
    }

    // Handle Custom Actions
    if (data.action) {
      if (data.action === 'ARCHIVE') {
        existingForwarder.entityStatus = 'ARCHIVED';
        forwarderService.logEvent(existingForwarder, 'ARCHIVED', 'Agency Account Archived', 'Marked as archived inside logistics registry.');
        const updated = await forwarderRepository.update(id, existingForwarder);
        return NextResponse.json(updated);
      }

      if (data.action === 'RESTORE') {
        existingForwarder.entityStatus = 'ACTIVE';
        forwarderService.logEvent(existingForwarder, 'RESTORED', 'Agency Account Restored', 'Restored to active logistics matrix.');
        const updated = await forwarderRepository.update(id, existingForwarder);
        return NextResponse.json(updated);
      }

      if (data.action === 'DUPLICATE') {
        const copy = await forwarderService.duplicate(id);
        return NextResponse.json(copy);
      }

      if (data.action === 'STATUS_UPDATE') {
        const newStatus = data.status; // ACTIVE, INACTIVE, ARCHIVED, DELETED
        existingForwarder.entityStatus = newStatus;
        forwarderService.logEvent(existingForwarder, 'STATUS_CHANGED', `Agency Status Transitioned`, `Status transitioned to ${newStatus}.`);
        const updated = await forwarderRepository.update(id, existingForwarder);
        return NextResponse.json(updated);
      }

      return NextResponse.json({ error: 'Invalid custom action specified' }, { status: 400 });
    }

    // Normal Forwarder Edit
    data.id = id;
    await forwarderService.validate(data, true);

    // Timeline Logs for specific edits
    if (data.rating !== undefined && Number(data.rating) !== existingForwarder.rating) {
      forwarderService.logEvent(
        existingForwarder,
        'RATING_CHANGED',
        'Agency Rating Updated',
        `Adjusted rating score from ${existingForwarder.rating} to ${data.rating}.`
      );
    }

    forwarderService.logEvent(existingForwarder, 'UPDATED', 'Agency Profile Updated', 'Updated agency covered ports, coordinates, or contacts.');

    const updatedForwarder = await forwarderRepository.update(id, {
      ...data,
      timeline: existingForwarder.timeline
    });

    return NextResponse.json(updatedForwarder);
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
    const existingForwarder = await forwarderRepository.getById(id);
    if (!existingForwarder) {
      return NextResponse.json({ error: 'Forwarder not found' }, { status: 404 });
    }

    existingForwarder.entityStatus = 'DELETED';
    forwarderService.logEvent(existingForwarder, 'STATUS_CHANGED', 'Agency Account Soft-Deleted', 'Soft-deleted from active logistics matrix.');

    await forwarderRepository.update(id, existingForwarder);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { ForwarderRepository } from '@/repositories/forwarder.repository';
import { forwarderService } from '@/services/forwarder.service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const forwarder = await ForwarderRepository.findById(id);
    if (!forwarder || forwarder.status === 'DELETED' as any) {
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
    const existingForwarder = await ForwarderRepository.findById(id);

    if (!existingForwarder) {
      return NextResponse.json({ error: 'Forwarder not found' }, { status: 404 });
    }

    // Handle Custom Actions
    if (data.action) {
      if (data.action === 'ARCHIVE') {
        existingForwarder.status = 'ARCHIVED' as any;
        forwarderService.logEvent(existingForwarder as any, 'ARCHIVED', 'Agency Account Archived', 'Marked as archived inside logistics registry.');
        const updated = await ForwarderRepository.update(id, existingForwarder as any);
        return NextResponse.json(updated);
      }

      if (data.action === 'RESTORE') {
        existingForwarder.status = 'ACTIVE' as any;
        forwarderService.logEvent(existingForwarder as any, 'RESTORED', 'Agency Account Restored', 'Restored to active logistics matrix.');
        const updated = await ForwarderRepository.update(id, existingForwarder as any);
        return NextResponse.json(updated);
      }

      if (data.action === 'DUPLICATE') {
        const copy = await forwarderService.duplicate(id);
        return NextResponse.json(copy);
      }

      if (data.action === 'STATUS_UPDATE') {
        const newStatus = data.status; // ACTIVE, INACTIVE, ARCHIVED, DELETED
        existingForwarder.status = newStatus as any;
        forwarderService.logEvent(existingForwarder as any, 'STATUS_CHANGED', `Agency Status Transitioned`, `Status transitioned to ${newStatus}.`);
        const updated = await ForwarderRepository.update(id, existingForwarder as any);
        return NextResponse.json(updated);
      }

      if (data.action === 'LOG_NOTE') {
        existingForwarder.timeline = data.timeline as any;
        const updated = await ForwarderRepository.update(id, existingForwarder as any);
        return NextResponse.json(updated);
      }

      return NextResponse.json({ error: 'Invalid custom action specified' }, { status: 400 });
    }

    // Normal Forwarder Edit
    data.id = id;
    await forwarderService.validate(data, true);

    // Timeline Logs for specific edits
    if (data.performanceRating !== undefined && Number(data.performanceRating) !== existingForwarder.performanceRating) {
      forwarderService.logEvent(
        existingForwarder as any,
        'RATING_CHANGED',
        'Agency Rating Updated',
        `Adjusted rating score from ${existingForwarder.performanceRating} to ${data.performanceRating}.`
      );
    }

    forwarderService.logEvent(existingForwarder as any, 'UPDATED', 'Agency Profile Updated', 'Updated agency covered ports, coordinates, or contacts.');

    const updatedForwarder = await ForwarderRepository.update(id, {
      ...data,
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
    const existingForwarder = await ForwarderRepository.findById(id);
    if (!existingForwarder) {
      return NextResponse.json({ error: 'Forwarder not found' }, { status: 404 });
    }

    existingForwarder.status = 'DELETED' as any;
    forwarderService.logEvent(existingForwarder as any, 'STATUS_CHANGED', 'Agency Account Soft-Deleted', 'Soft-deleted from active logistics matrix.');

    await ForwarderRepository.update(id, existingForwarder as any);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

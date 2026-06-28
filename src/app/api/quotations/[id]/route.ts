import { NextResponse } from 'next/server';
import { quotationRepository } from '@/repositories/repository';
import { quotationService } from '@/services/quotation.service';
import { workflowService } from '@/services/workflow.service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await quotationRepository.getById(id);
    if (!item || item.entityStatus === 'DELETED') {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
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
    const existingQuotation = await quotationRepository.getById(id);

    if (!existingQuotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    const { action, ...data } = body;

    // Handle Custom Actions
    if (action) {
      if (action === 'approve') {
        const so = await workflowService.approveQuotation(id);
        
        // Reload quotation to update timeline log
        const updatedQuote = await quotationRepository.getById(id);
        if (updatedQuote) {
          quotationService.logEvent(updatedQuote, 'APPROVED', 'Proposal Approved & Confirmed', `Proposal approved and converted to Sales Order: ${so.orderNo}.`);
          await quotationRepository.update(id, updatedQuote);
        }

        return NextResponse.json({ message: 'Quotation approved and Sales Order created', salesOrder: so });
      }

      if (action === 'reject') {
        existingQuotation.status = 'REJECTED';
        quotationService.logEvent(existingQuotation, 'REJECTED', 'Proposal Rejected', 'Proposal status transitioned to REJECTED.');
        const updated = await quotationRepository.update(id, existingQuotation);
        return NextResponse.json(updated);
      }

      if (action === 'send') {
        existingQuotation.status = 'SENT';
        quotationService.logEvent(existingQuotation, 'SENT', 'Proposal Sent to Client', 'Proposal sent to customer commercial contact.');
        const updated = await quotationRepository.update(id, existingQuotation);
        return NextResponse.json(updated);
      }

      if (action === 'revise') {
        const copy = await quotationService.revise(id);
        return NextResponse.json(copy);
      }

      if (action === 'duplicate') {
        const copy = await quotationService.duplicate(id);
        return NextResponse.json(copy);
      }

      if (action === 'archive') {
        existingQuotation.entityStatus = 'ARCHIVED';
        quotationService.logEvent(existingQuotation, 'ARCHIVED', 'Proposal Archived', 'Proposal archived inside main commercial vault.');
        const updated = await quotationRepository.update(id, existingQuotation);
        return NextResponse.json(updated);
      }

      if (action === 'restore') {
        existingQuotation.entityStatus = 'ACTIVE';
        quotationService.logEvent(existingQuotation, 'RESTORED', 'Proposal Restored', 'Restored to active commercial catalog.');
        const updated = await quotationRepository.update(id, existingQuotation);
        return NextResponse.json(updated);
      }

      return NextResponse.json({ error: 'Invalid custom action specified' }, { status: 400 });
    }

    // Normal Proposal Edit
    data.id = id;
    await quotationService.validate(data, true);

    quotationService.logEvent(existingQuotation, 'UPDATED', 'Proposal Details Updated', 'Updated item lines, ports, incoterms, or cargo specs.');

    const updatedQuotation = await quotationRepository.update(id, {
      ...data,
      timeline: existingQuotation.timeline
    });

    return NextResponse.json(updatedQuotation);
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
    const existingQuotation = await quotationRepository.getById(id);
    if (!existingQuotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    existingQuotation.entityStatus = 'DELETED';
    quotationService.logEvent(existingQuotation, 'STATUS_CHANGED', 'Proposal Soft-Deleted', 'Soft-deleted from main commercial catalog.');

    await quotationRepository.update(id, existingQuotation);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

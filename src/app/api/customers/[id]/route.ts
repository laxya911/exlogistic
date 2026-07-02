import { NextResponse } from 'next/server';
import { customerRepository } from '@/repositories/repository';
import { customerService } from '@/services/customer.service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customer = await customerRepository.getById(id);
    if (!customer || customer.entityStatus === 'DELETED') {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    return NextResponse.json(customer);
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
    const existingCustomer = await customerRepository.getById(id);

    if (!existingCustomer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Handle Custom CRM Actions (ARCHIVE, RESTORE, DUPLICATE, STATUS_UPDATE)
    if (data.action) {
      if (data.action === 'ARCHIVE') {
        existingCustomer.entityStatus = 'ARCHIVED';
        customerService.logEvent(existingCustomer, 'ARCHIVED', 'Customer Account Archived', 'Marked as archived inside CRM repository.');
        const updated = await customerRepository.update(id, existingCustomer);
        return NextResponse.json(updated);
      }

      if (data.action === 'RESTORE') {
        existingCustomer.entityStatus = 'ACTIVE';
        customerService.logEvent(existingCustomer, 'RESTORED', 'Customer Account Restored', 'Restored to active client list.');
        const updated = await customerRepository.update(id, existingCustomer);
        return NextResponse.json(updated);
      }

      if (data.action === 'DUPLICATE') {
        const copy = await customerService.duplicate(id);
        return NextResponse.json(copy);
      }

      if (data.action === 'STATUS_UPDATE') {
        const newStatus = data.status; // ACTIVE, INACTIVE, ARCHIVED, DELETED
        existingCustomer.entityStatus = newStatus;
        customerService.logEvent(existingCustomer, 'STATUS_CHANGED', `Account Status Transitioned`, `Status transitioned to ${newStatus}.`);
        const updated = await customerRepository.update(id, existingCustomer);
        return NextResponse.json(updated);
      }

      return NextResponse.json({ error: 'Invalid custom action requested' }, { status: 400 });
    }

    // Detect partial update — e.g. just saving timeline (communication note)
    // A partial update lacks core profile fields like name/email
    const isPartialUpdate = !data.name && !data.email;

    if (isPartialUpdate) {
      // Just merge the provided fields onto existing record and save — no validation needed
      const merged = {
        ...existingCustomer,
        ...data,
      };
      const updated = await customerRepository.update(id, merged);
      return NextResponse.json(updated);
    }

    // Full profile edit — run validation
    data.id = id;
    await customerService.validate(data, true);

    // Timeline Logs for specific edits
    const existingTimeline = existingCustomer.timeline || [];
    if (data.creditLimit !== undefined && Number(data.creditLimit) !== existingCustomer.creditLimit) {
      customerService.logEvent(
        existingCustomer,
        'CREDIT_LIMIT_CHANGED',
        'Credit Limit Modified',
        `Adjusted credit ceiling from USD ${existingCustomer.creditLimit} to USD ${data.creditLimit}.`
      );
    }
    customerService.logEvent(existingCustomer, 'UPDATED', 'Profile Details Updated', 'Updated general contact coordinates and terms.');

    const updatedCustomer = await customerRepository.update(id, {
      ...data,
      // Preserve accumulated timeline — prepend new events from service calls above
      timeline: existingCustomer.timeline,
    });

    return NextResponse.json(updatedCustomer);
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
    const existingCustomer = await customerRepository.getById(id);
    if (!existingCustomer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    existingCustomer.entityStatus = 'DELETED';
    customerService.logEvent(existingCustomer, 'STATUS_CHANGED', 'Customer Account Deleted', 'Soft-deleted from main matrix index.');

    await customerRepository.update(id, existingCustomer);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

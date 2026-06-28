import { NextResponse } from 'next/server';
import { customerRepository } from '@/repositories/repository';
import { customerService } from '@/services/customer.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeDeleted = searchParams.get('includeDeleted') === 'true';

    let customers = await customerRepository.getAll();
    if (!includeDeleted) {
      customers = customers.filter(c => c.entityStatus !== 'DELETED');
    }

    return NextResponse.json(customers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Validate
    await customerService.validate(data, false);

    const now = new Date().toISOString();
    const customerPayload = {
      ...data,
      contacts: data.contacts || [],
      documents: data.documents || [],
      timeline: [
        {
          id: `EV-${Math.random().toString(36).substr(2, 9)}`,
          date: now,
          type: 'CREATED',
          title: 'Customer Registered',
          description: 'Customer profile onboarded in CRM index.',
          userId: data.accountManagerId || 'USR-001'
        }
      ],
      entityStatus: 'ACTIVE',
      createdAt: now,
      updatedAt: now
    };

    const newCustomer = await customerRepository.create(customerPayload);
    return NextResponse.json(newCustomer, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

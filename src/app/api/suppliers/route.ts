import { NextResponse } from 'next/server';
import { supplierRepository } from '@/repositories/repository';
import { supplierService } from '@/services/supplier.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeDeleted = searchParams.get('includeDeleted') === 'true';

    let suppliers = await supplierRepository.getAll();
    if (!includeDeleted) {
      suppliers = suppliers.filter(s => s.entityStatus !== 'DELETED');
    }

    return NextResponse.json(suppliers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Validate
    await supplierService.validate(data, false);

    const now = new Date().toISOString();
    const supplierPayload = {
      ...data,
      contacts: data.contacts || [],
      certifications: data.certifications || [],
      productsSuppliedIds: data.productsSuppliedIds || [],
      documents: data.documents || [],
      timeline: [
        {
          id: `EV-${Math.random().toString(36).substr(2, 9)}`,
          date: now,
          type: 'CREATED',
          title: 'Vendor Registered',
          description: 'Supplier profile onboarded in Vendor matrix.',
          userId: 'USR-001'
        }
      ],
      entityStatus: 'ACTIVE',
      createdAt: now,
      updatedAt: now
    };

    const newSupplier = await supplierRepository.create(supplierPayload);
    return NextResponse.json(newSupplier, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

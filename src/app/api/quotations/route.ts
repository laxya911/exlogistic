import { NextResponse } from 'next/server';
import { quotationRepository } from '@/repositories/repository';
import { quotationService } from '@/services/quotation.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeDeleted = searchParams.get('includeDeleted') === 'true';

    let quotations = await quotationRepository.getAll();
    if (!includeDeleted) {
      quotations = quotations.filter(q => q.entityStatus !== 'DELETED');
    }

    return NextResponse.json(quotations);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Set default version
    if (data.version === undefined) data.version = 1;

    // Validate
    await quotationService.validate(data, false);

    const now = new Date().toISOString();
    const quotationPayload = {
      ...data,
      items: data.items || [],
      timeline: [
        {
          id: `EV-${Math.random().toString(36).substr(2, 9)}`,
          date: now,
          type: 'CREATED',
          title: 'Commercial Proposal Created',
          description: `Onboarded proposal Ref ${data.quotationNo} version ${data.version}.0.`,
          userId: 'USR-001'
        }
      ],
      documents: data.documents || [
        { id: `DOC-${data.quotationNo}-1`, name: `Quotation_${data.quotationNo}.pdf`, type: 'PDF', url: '#', uploadedAt: now }
      ],
      entityStatus: 'ACTIVE',
      createdAt: now,
      updatedAt: now
    };

    const newQuotation = await quotationRepository.create(quotationPayload);
    return NextResponse.json(newQuotation, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

import { NextResponse } from 'next/server';
import { forwarderRepository } from '@/repositories/repository';
import { forwarderService } from '@/services/forwarder.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeDeleted = searchParams.get('includeDeleted') === 'true';

    let forwarders = await forwarderRepository.getAll();
    if (!includeDeleted) {
      forwarders = forwarders.filter(f => f.entityStatus !== 'DELETED');
    }

    return NextResponse.json(forwarders);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Validate
    await forwarderService.validate(data, false);

    const now = new Date().toISOString();
    const forwarderPayload = {
      ...data,
      contacts: data.contacts || [],
      preferredPorts: data.preferredPorts || [],
      documents: data.documents || [],
      timeline: [
        {
          id: `EV-${Math.random().toString(36).substr(2, 9)}`,
          date: now,
          type: 'CREATED',
          title: 'Agency Registered',
          description: 'Freight forwarding agency onboarded in logistics matrix.',
          userId: 'USR-001'
        }
      ],
      entityStatus: 'ACTIVE',
      createdAt: now,
      updatedAt: now
    };

    const newForwarder = await forwarderRepository.create(forwarderPayload);
    return NextResponse.json(newForwarder, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

import { NextResponse } from 'next/server';
import { shipmentRepository } from '@/repositories/repository';
import { shipmentService } from '@/services/shipment.service';
import { numberingService } from '@/services/numbering.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const statusFilter = searchParams.get('status');

    let shipments = await shipmentRepository.getAll();
    if (!includeInactive) {
      shipments = shipments.filter(s => s.entityStatus !== 'DELETED');
    }
    if (statusFilter) {
      shipments = shipments.filter(s => s.status === statusFilter);
    }

    return NextResponse.json(shipments);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    await shipmentService.validate(data, false);

    const now = new Date().toISOString();
    const shipmentNo = data.shipmentNo || numberingService.getShipmentNumber();

    const payload = {
      ...data,
      shipmentNo,
      timeline: [
        {
          id: `EV-${Math.random().toString(36).substr(2, 9)}`,
          date: now,
          type: 'BOOKING',
          title: 'Shipment Booking Created',
          description: `Shipment ${shipmentNo} created and booking initiated.`,
          userId: 'USR-001'
        }
      ],
      documents: data.documents || [],
      status: data.status || 'BOOKING',
      entityStatus: 'ACTIVE',
      createdAt: now,
      updatedAt: now
    };

    const newShipment = await shipmentRepository.create(payload);
    return NextResponse.json(newShipment, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

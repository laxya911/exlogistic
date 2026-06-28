import { NextResponse } from 'next/server';
import { shipmentRepository } from '@/repositories/repository';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const shipment = await shipmentRepository.getById(params.id);
    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }
    return NextResponse.json(shipment);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

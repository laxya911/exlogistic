import { NextResponse } from 'next/server';
import { purchaseOrderRepository } from '@/repositories/repository';
import { purchaseOrderService } from '@/services/purchase-order.service';
import { numberingService } from '@/services/numbering.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    let orders = await purchaseOrderRepository.getAll();
    if (!includeInactive) {
      orders = orders.filter(po => po.entityStatus !== 'DELETED');
    }

    return NextResponse.json(orders);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    await purchaseOrderService.validate(data, false);

    const now = new Date().toISOString();
    const poNo = data.poNo || numberingService.getPurchaseOrderNumber();

    const payload = {
      ...data,
      poNo,
      items: data.items || [],
      timeline: [
        {
          id: `EV-${Math.random().toString(36).substr(2, 9)}`,
          date: now,
          type: 'CREATED',
          title: 'Purchase Order Drafted',
          description: `Procurement order ${poNo} created.`,
          userId: 'USR-001'
        }
      ],
      documents: data.documents || [],
      status: data.status || 'DRAFT',
      entityStatus: 'ACTIVE',
      createdAt: now,
      updatedAt: now
    };

    const newPO = await purchaseOrderRepository.create(payload);
    return NextResponse.json(newPO, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

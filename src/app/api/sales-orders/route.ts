import { NextResponse } from 'next/server';
import { salesOrderRepository } from '@/repositories/repository';
import { salesOrderService } from '@/services/sales-order.service';
import { numberingService } from '@/services/numbering.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    let orders = await salesOrderRepository.getAll();
    if (!includeInactive) {
      orders = orders.filter(o => o.entityStatus !== 'DELETED');
    }

    return NextResponse.json(orders);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    await salesOrderService.validate(data, false);

    const now = new Date().toISOString();
    const orderNo = data.orderNo || numberingService.getSalesOrderNumber();

    const payload = {
      ...data,
      orderNo,
      items: data.items || [],
      timeline: [
        {
          id: `EV-${Math.random().toString(36).substr(2, 9)}`,
          date: now,
          type: 'CREATED',
          title: 'Sales Order Created',
          description: `Export contract ${orderNo} manually onboarded.`,
          userId: 'USR-001'
        }
      ],
      documents: data.documents || [],
      status: data.status || 'CONFIRMED',
      entityStatus: 'ACTIVE',
      createdAt: now,
      updatedAt: now
    };

    const newOrder = await salesOrderRepository.create(payload);
    return NextResponse.json(newOrder, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

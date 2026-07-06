import { NextResponse } from 'next/server';
import { inventoryService } from '@/services/inventory.service';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { variantId, quantity, type, remarks, userId } = data;

    if (!variantId || !quantity || !type) {
      return NextResponse.json({ error: 'variantId, quantity, and type are required' }, { status: 400 });
    }

    const result = await inventoryService.adjustStock(
      variantId,
      quantity,
      type,
      'MANUAL',
      undefined,
      remarks,
      userId
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const variantId = searchParams.get('variantId');

    if (!variantId) {
      return NextResponse.json({ error: 'variantId is required' }, { status: 400 });
    }

    const result = await inventoryService.getLedgerForVariant(variantId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

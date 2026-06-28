import { NextResponse } from 'next/server';
import { purchaseOrderRepository } from '@/repositories/repository';

export async function GET() {
  try {
    const data = await purchaseOrderRepository.getAll();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

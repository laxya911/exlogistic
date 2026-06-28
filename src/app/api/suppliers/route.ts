import { NextResponse } from 'next/server';
import { supplierRepository } from '@/repositories/repository';

export async function GET() {
  try {
    const suppliers = await supplierRepository.getAll();
    return NextResponse.json(suppliers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

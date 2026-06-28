import { NextResponse } from 'next/server';
import { customerRepository } from '@/repositories/repository';

export async function GET() {
  try {
    const customers = await customerRepository.getAll();
    return NextResponse.json(customers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

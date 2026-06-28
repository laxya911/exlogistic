import { NextResponse } from 'next/server';
import { productRepository } from '@/repositories/repository';

export async function GET() {
  try {
    const products = await productRepository.getAll();
    return NextResponse.json(products);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

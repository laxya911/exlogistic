import { NextResponse } from 'next/server';
import { prismaProductRepository } from '@/repositories/prisma/product.repository';
import { productService } from '@/services/product.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeDeleted = searchParams.get('includeDeleted') === 'true';
    
    let products = await prismaProductRepository.getAll();
    if (!includeDeleted) {
      products = products.filter((p: any) => p.entityStatus !== 'DELETED');
    }
    
    return NextResponse.json(products);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validate
    await productService.validate(data, false);
    
    // Create using Prisma (which handles creating the default variant)
    const newProduct = await prismaProductRepository.create(data);
    return NextResponse.json(newProduct, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

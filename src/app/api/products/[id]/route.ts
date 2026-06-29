import { NextResponse } from 'next/server';
import { prismaProductRepository } from '@/repositories/prisma/product.repository';
import { productService } from '@/services/product.service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await prismaProductRepository.getById(id);
    if (!product || product.entityStatus === 'DELETED') {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    const existingProduct = await prismaProductRepository.getById(id);
    
    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Handle Custom Actions
    if (data.action) {
      if (data.action === 'ARCHIVE') {
        existingProduct.entityStatus = 'ARCHIVED';
        const updated = await prismaProductRepository.update(id, { entityStatus: 'ARCHIVED' });
        return NextResponse.json(updated);
      }
      
      if (data.action === 'RESTORE') {
        existingProduct.entityStatus = 'ACTIVE';
        const updated = await prismaProductRepository.update(id, { entityStatus: 'ACTIVE' });
        return NextResponse.json(updated);
      }
      
      if (data.action === 'DUPLICATE') {
        // Simplified duplication for now
        const copyData = { ...existingProduct, name: `${existingProduct.name} (Copy)` };
        const copy = await prismaProductRepository.create(copyData);
        return NextResponse.json(copy);
      }

      if (data.action === 'STATUS_UPDATE') {
        const newStatus = data.status; // ACTIVE, INACTIVE, ARCHIVED, DELETED
        const updated = await prismaProductRepository.update(id, { entityStatus: newStatus });
        return NextResponse.json(updated);
      }

      return NextResponse.json({ error: 'Invalid custom action specified' }, { status: 400 });
    }

    // Normal Product Modification
    data.id = id;
    await productService.validate(data, true);

    const updatedProduct = await prismaProductRepository.update(id, data);

    return NextResponse.json(updatedProduct);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existingProduct = await prismaProductRepository.getById(id);
    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await prismaProductRepository.delete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

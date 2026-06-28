import { NextResponse } from 'next/server';
import { productRepository } from '@/repositories/repository';
import { productService } from '@/services/product.service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await productRepository.getById(id);
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
    const existingProduct = await productRepository.getById(id);
    
    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Handle Custom Actions
    if (data.action) {
      if (data.action === 'ARCHIVE') {
        existingProduct.entityStatus = 'ARCHIVED';
        productService.logEvent(existingProduct, 'ARCHIVED', 'Product Archived', 'Matrix node marked as archived.');
        const updated = await productRepository.update(id, existingProduct);
        return NextResponse.json(updated);
      }
      
      if (data.action === 'RESTORE') {
        existingProduct.entityStatus = 'ACTIVE';
        productService.logEvent(existingProduct, 'RESTORED', 'Product Restored', 'Matrix node restored to active master list.');
        const updated = await productRepository.update(id, existingProduct);
        return NextResponse.json(updated);
      }
      
      if (data.action === 'DUPLICATE') {
        const copy = await productService.duplicate(id);
        return NextResponse.json(copy);
      }

      if (data.action === 'STATUS_UPDATE') {
        const newStatus = data.status; // ACTIVE, INACTIVE, ARCHIVED, DELETED
        existingProduct.entityStatus = newStatus;
        productService.logEvent(existingProduct, 'UPDATED', `Status Updated to ${newStatus}`, `Entity state transition to ${newStatus}.`);
        const updated = await productRepository.update(id, existingProduct);
        return NextResponse.json(updated);
      }

      return NextResponse.json({ error: 'Invalid custom action specified' }, { status: 400 });
    }

    // Normal Product Modification
    data.id = id;
    await productService.validate(data, true);

    // Track state modifications for Timeline logging
    if (data.sellingPrice !== undefined && Number(data.sellingPrice) !== existingProduct.sellingPrice) {
      productService.logEvent(
        existingProduct, 
        'PRICE_CHANGED', 
        'Selling Price Modified', 
        `Adjusted from ${existingProduct.currency} ${existingProduct.sellingPrice} to ${data.currency || 'USD'} ${data.sellingPrice}.`
      );
      
      // Update pricing history
      if (!existingProduct.pricingHistory) existingProduct.pricingHistory = [];
      existingProduct.pricingHistory.push({
        date: new Date().toISOString(),
        price: Number(data.sellingPrice),
        currency: data.currency || 'USD'
      });
    }

    if (data.supplierId !== undefined && data.supplierId !== existingProduct.supplierId) {
      productService.logEvent(
        existingProduct,
        'SUPPLIER_CHANGED',
        'Default Vendor Changed',
        `Reassigned default supplier node from ${existingProduct.supplierId} to ${data.supplierId}.`
      );
    }

    productService.logEvent(existingProduct, 'UPDATED', 'Product Updated', 'General profile attributes updated.');
    
    const updatedProduct = await productRepository.update(id, {
      ...data,
      timeline: existingProduct.timeline,
      pricingHistory: existingProduct.pricingHistory
    });

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
    const existingProduct = await productRepository.getById(id);
    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    existingProduct.entityStatus = 'DELETED';
    productService.logEvent(existingProduct, 'DELETED' as any, 'Product Soft-Deleted', 'Product soft-deleted by user command.');
    
    await productRepository.update(id, existingProduct);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

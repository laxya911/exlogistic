import { NextResponse } from 'next/server';
import { productRepository } from '@/repositories/repository';
import { productService } from '@/services/product.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeDeleted = searchParams.get('includeDeleted') === 'true';
    
    let products = await productRepository.getAll();
    if (!includeDeleted) {
      products = products.filter(p => p.entityStatus !== 'DELETED');
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
    
    // Build initial timeline
    const now = new Date().toISOString();
    const productPayload = {
      ...data,
      timeline: [
        {
          id: `EV-${Math.random().toString(36).substr(2, 9)}`,
          date: now,
          type: 'CREATED',
          title: 'Product Created',
          description: 'Product registered in ERP master index.',
          userId: 'USR-001'
        }
      ],
      purchaseHistory: data.purchaseHistory || [],
      sellingHistory: data.sellingHistory || [],
      inventorySummary: data.inventorySummary || [
        { location: 'Main Warehouse (Mumbai)', quantity: 0, lastUpdated: now }
      ],
      pricingHistory: data.pricingHistory || [
        { date: now, price: data.sellingPrice, currency: data.currency || 'USD' }
      ],
      entityStatus: 'ACTIVE',
      createdAt: now,
      updatedAt: now
    };

    const newProduct = await productRepository.create(productPayload);
    return NextResponse.json(newProduct, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

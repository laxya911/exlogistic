import { NextResponse } from 'next/server';
import { prisma } from '@/repositories/prisma.client';

export async function GET() {
  try {
    const records = await prisma.warehouse.findMany({
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(records);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch warehouses' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const record = await prisma.warehouse.create({ data });
    return NextResponse.json(record);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create warehouse' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const data = await req.json();
    const { id, ...updateData } = data;
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const record = await prisma.warehouse.update({
      where: { id },
      data: updateData
    });
    return NextResponse.json(record);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update warehouse' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    
    // Check if warehouse has any inventory assigned
    const inventoryCount = await prisma.inventory.count({
      where: { warehouseId: id }
    });

    if (inventoryCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete warehouse because it currently holds ${inventoryCount} inventory record(s). Please transfer stock first.` }, 
        { status: 400 }
      );
    }
    
    await prisma.warehouse.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete warehouse' }, { status: 500 });
  }
}

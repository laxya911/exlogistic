import { NextResponse } from 'next/server';
import { prisma } from '@/repositories/prisma.client';
import { hasPermission } from '@/lib/rbac';

const getModel = (type: string) => {
  switch (type) {
    case 'currencies': return prisma.currency;
    case 'taxes': return prisma.taxSetting;
    case 'containers': return prisma.containerType;
    case 'incoterms': return prisma.incoterm;
    case 'units': return prisma.measurementUnit;
    default: return null;
  }
};

// Next.js 15 requires awaiting params
export async function GET(request: Request, { params }: { params: Promise<{ type: string }> }) {
  try {
    const { type } = await params;
    const model = getModel(type);
    
    if (!model) {
      return NextResponse.json({ error: 'Invalid reference type' }, { status: 400 });
    }

    // @ts-ignore
    const records = await model.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching reference data:', error);
    return NextResponse.json({ error: 'Failed to fetch reference data' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ type: string }> }) {
  try {
    const isAllowed = await hasPermission('settings:manage');
    if (!isAllowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { type } = await params;
    const model = getModel(type);
    
    if (!model) {
      return NextResponse.json({ error: 'Invalid reference type' }, { status: 400 });
    }

    const data = await request.json();
    
    // @ts-ignore
    const record = await model.create({ data });
    return NextResponse.json(record);
  } catch (error) {
    console.error('Error creating reference data:', error);
    return NextResponse.json({ error: 'Failed to create reference data' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ type: string }> }) {
  try {
    const isAllowed = await hasPermission('settings:manage');
    if (!isAllowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { type } = await params;
    const model = getModel(type);
    
    if (!model) {
      return NextResponse.json({ error: 'Invalid reference type' }, { status: 400 });
    }

    const data = await request.json();
    const { id, ...updateData } = data;
    
    if (!id) {
      return NextResponse.json({ error: 'Missing record ID' }, { status: 400 });
    }

    // @ts-ignore
    const record = await model.update({
      where: { id },
      data: updateData
    });
    return NextResponse.json(record);
  } catch (error) {
    console.error('Error updating reference data:', error);
    return NextResponse.json({ error: 'Failed to update reference data' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ type: string }> }) {
  try {
    const isAllowed = await hasPermission('settings:manage');
    if (!isAllowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { type } = await params;
    const model = getModel(type);
    
    if (!model) {
      return NextResponse.json({ error: 'Invalid reference type' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Missing record ID' }, { status: 400 });
    }

    // @ts-ignore
    await model.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting reference data:', error);
    return NextResponse.json({ error: 'Failed to delete reference data' }, { status: 500 });
  }
}

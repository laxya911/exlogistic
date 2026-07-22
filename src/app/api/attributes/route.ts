import { NextResponse } from 'next/server';
import { prisma } from '@/repositories/prisma.client';

export async function GET() {
  try {
    const records = await prisma.attribute.findMany({
      orderBy: { name: 'asc' },
      include: { values: true }
    });
    return NextResponse.json(records);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch attributes' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name } = await req.json();
    if (!name) return NextResponse.json({ error: 'Attribute name is required' }, { status: 400 });
    
    const record = await prisma.attribute.create({ data: { name } });
    return NextResponse.json(record);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'An attribute with this name already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create attribute' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const data = await req.json();
    const { id, name } = data;
    if (!id || !name) return NextResponse.json({ error: 'Missing ID or Name' }, { status: 400 });

    const record = await prisma.attribute.update({
      where: { id },
      data: { name }
    });
    return NextResponse.json(record);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'An attribute with this name already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update attribute' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    
    await prisma.attribute.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete attribute' }, { status: 500 });
  }
}

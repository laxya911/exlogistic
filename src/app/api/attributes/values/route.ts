import { NextResponse } from 'next/server';
import { prisma } from '@/repositories/prisma.client';

export async function POST(req: Request) {
  try {
    const { attributeId, value } = await req.json();
    if (!attributeId || !value) {
      return NextResponse.json({ error: 'Attribute ID and Value are required' }, { status: 400 });
    }
    
    const record = await prisma.attributeValue.create({
      data: { attributeId, value }
    });
    return NextResponse.json(record);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'This value already exists for this attribute' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create attribute value' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    
    await prisma.attributeValue.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete attribute value' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/repositories/prisma.client';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: attributeId } = await params;
    const { value } = await req.json();
    
    if (!value) {
      return NextResponse.json({ error: 'Value is required' }, { status: 400 });
    }

    const record = await prisma.attributeValue.create({
      data: {
        attributeId,
        value
      }
    });
    return NextResponse.json(record);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'This value already exists for this attribute' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to add attribute value' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: attributeId } = await params;
    const url = new URL(req.url);
    const valueId = url.searchParams.get('valueId');
    
    if (!valueId) {
      return NextResponse.json({ error: 'Missing valueId' }, { status: 400 });
    }
    
    await prisma.attributeValue.delete({
      where: {
        id: valueId,
        attributeId: attributeId // Ensure it belongs to this attribute
      }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete attribute value' }, { status: 500 });
  }
}

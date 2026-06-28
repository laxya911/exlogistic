import { NextResponse } from 'next/server';
import { documentRepository } from '@/repositories/repository';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await documentRepository.getById(id);
    if (!item || item.entityStatus === 'DELETED') {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    return NextResponse.json(item);
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
    const body = await request.json();
    const existing = await documentRepository.getById(id);
    if (!existing) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

    const { action, ...data } = body;

    if (action === 'sign') {
      const updated = await documentRepository.update(id, { status: 'SIGNED', updatedAt: new Date().toISOString() });
      return NextResponse.json(updated);
    }
    if (action === 'archive') {
      const updated = await documentRepository.update(id, { status: 'ARCHIVED', entityStatus: 'ARCHIVED', updatedAt: new Date().toISOString() });
      return NextResponse.json(updated);
    }
    if (action === 'restore') {
      const updated = await documentRepository.update(id, { status: 'DRAFT', entityStatus: 'ACTIVE', updatedAt: new Date().toISOString() });
      return NextResponse.json(updated);
    }

    // Standard field update
    const updated = await documentRepository.update(id, { ...data, updatedAt: new Date().toISOString() });
    return NextResponse.json(updated);
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
    const existing = await documentRepository.getById(id);
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await documentRepository.update(id, { entityStatus: 'DELETED', updatedAt: new Date().toISOString() });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

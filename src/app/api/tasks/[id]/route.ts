import { NextResponse } from 'next/server';
import { taskRepository } from '@/repositories/repository';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await taskRepository.getById(id);
    if (!item || item.entityStatus === 'DELETED') {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
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
    const existing = await taskRepository.getById(id);
    
    if (!existing || existing.entityStatus === 'DELETED') {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const updated = await taskRepository.update(id, { 
      ...body, 
      updatedAt: new Date().toISOString() 
    });
    
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
    const existing = await taskRepository.getById(id);
    
    if (!existing || existing.entityStatus === 'DELETED') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    
    await taskRepository.update(id, { 
      entityStatus: 'DELETED', 
      updatedAt: new Date().toISOString() 
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

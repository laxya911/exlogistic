import { NextResponse } from 'next/server';
import { notificationRepository } from '@/repositories/repository';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const existing = await notificationRepository.getById(id);
    
    if (!existing) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    const updated = await notificationRepository.update(id, { 
      ...body, 
      updatedAt: new Date().toISOString() 
    });
    
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

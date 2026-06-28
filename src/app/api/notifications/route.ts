import { NextResponse } from 'next/server';
import { notificationRepository } from '@/repositories/repository';

export async function GET() {
  try {
    let data = await notificationRepository.getAll();
    data = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Mark all as read
export async function PUT(request: Request) {
  try {
    const data = await notificationRepository.getAll();
    
    // Batch update simulation
    const updates = data
      .filter(n => !n.isRead)
      .map(n => notificationRepository.update(n.id, { isRead: true, updatedAt: new Date().toISOString() }));
      
    await Promise.all(updates);
    
    return NextResponse.json({ success: true, count: updates.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

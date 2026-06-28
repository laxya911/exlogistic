import { NextResponse } from 'next/server';
import { notificationRepository } from '@/repositories/repository';

export async function GET() {
  try {
    const notifications = await notificationRepository.getAll();
    return NextResponse.json(notifications);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

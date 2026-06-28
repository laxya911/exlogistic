import { NextResponse } from 'next/server';
import { calendarEventRepository } from '@/repositories/repository';

export async function GET() {
  try {
    const data = await calendarEventRepository.getAll();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { taskRepository } from '@/repositories/repository';

export async function GET() {
  try {
    const data = await taskRepository.getAll();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const item = await taskRepository.create(data);
    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { positionRepository } from '@/repositories/prisma/position.repository';

export async function GET() {
  try {
    const positions = await positionRepository.findAll();
    return NextResponse.json(positions);
  } catch (error) {
    console.error('Error fetching positions:', error);
    return NextResponse.json({ error: 'Failed to fetch positions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const newPosition = await positionRepository.create(data);
    return NextResponse.json(newPosition, { status: 201 });
  } catch (error) {
    console.error('Error creating position:', error);
    return NextResponse.json({ error: 'Failed to create position' }, { status: 500 });
  }
}

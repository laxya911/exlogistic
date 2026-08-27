import { NextResponse } from 'next/server';
import { teamRepository } from '@/repositories/prisma/team.repository';

export async function GET() {
  try {
    const teams = await teamRepository.findAll();
    return NextResponse.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const newTeam = await teamRepository.create(data);
    return NextResponse.json(newTeam, { status: 201 });
  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const data = await req.json();
    const { id, ...updateData } = data;
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const record = await teamRepository.update(id, updateData);
    return NextResponse.json(record);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update team' }, { status: 500 });
  }
}

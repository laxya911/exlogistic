import { NextResponse } from 'next/server';
import { costingScenarioRepository } from '@/repositories/repository';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const scenario = await costingScenarioRepository.getById(id);
    if (!scenario || scenario.entityStatus === 'DELETED') {
      return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });
    }
    return NextResponse.json(scenario);
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
    const existing = await costingScenarioRepository.getById(id);
    if (!existing) return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });

    const { action, ...data } = body;

    if (action === 'toggle_favourite') {
      const updated = await costingScenarioRepository.update(id, { isFavourite: !existing.isFavourite });
      return NextResponse.json(updated);
    }

    const updated = await costingScenarioRepository.update(id, {
      ...data,
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
    const existing = await costingScenarioRepository.getById(id);
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await costingScenarioRepository.update(id, { entityStatus: 'DELETED' });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

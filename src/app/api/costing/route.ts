import { NextResponse } from 'next/server';
import { costingScenarioRepository } from '@/repositories/repository';

export async function GET() {
  try {
    const scenarios = await costingScenarioRepository.getAll();
    return NextResponse.json(scenarios.filter(s => s.entityStatus !== 'DELETED'));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    if (!data.scenarioName) {
      return NextResponse.json({ error: 'Scenario name is required' }, { status: 400 });
    }
    const now = new Date().toISOString();
    const scenario = await costingScenarioRepository.create({
      ...data,
      entityStatus: 'ACTIVE',
      createdAt: now,
      updatedAt: now
    });
    return NextResponse.json(scenario, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

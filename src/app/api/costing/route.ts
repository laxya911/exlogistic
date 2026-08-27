import { NextResponse } from 'next/server';
import { CostingScenarioRepository } from '@/repositories/costing-scenario.repository';

export async function GET() {
  try {
    const scenarios = await CostingScenarioRepository.findAll();
    const mappedScenarios = scenarios.map((sc: any) => ({
      ...sc,
      scenarioName: sc.name,
      freight: {
        oceanFreightPerContainer: sc.freightSettings?.oceanFreightPerContainer || sc.freightSettings?.oceanFrt || 2800,
        containerCount: sc.freightSettings?.containerCount || 1,
        containerType: sc.freightSettings?.containerType || '20GP',
        originHandling: sc.freightSettings?.originHandling || 280,
        destinationHandling: sc.freightSettings?.destinationHandling || 420,
        originPort: sc.freightSettings?.originPort || 'INNHV',
        destinationPort: sc.freightSettings?.destinationPort || 'JPTYO',
        ...sc.freightSettings
      },
      costs: {
        inspection: 180,
        miscCharges: 120,
        ...sc.costs
      },
      rates: sc.costs?.rates || { insuranceRate: 0.5, customsRate: 5.0, targetMargin: 22, bankingRate: 0.25 },
      currency: sc.costs?.currency || sc.freightSettings?.targetCurrency || 'USD',
      exchangeRate: sc.costs?.exchangeRate || 1,
      result: sc.metrics || {}
    }));
    return NextResponse.json(mappedScenarios);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const scenario = await CostingScenarioRepository.create({
      name: data.scenarioName || data.name,
      description: data.description || '',
      items: data.items || [],
      freightSettings: data.freight || data.freightSettings || {},
      costs: data.costs || {},
      metrics: data.result || data.metrics || {}
    });
    return NextResponse.json(scenario);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

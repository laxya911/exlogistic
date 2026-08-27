import { NextResponse } from 'next/server';
import { dashboardService, Timeframe } from '@/services/dashboard.service';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const timeframe = (searchParams.get('timeframe') as Timeframe) || 'MONTH';
    const customStart = searchParams.get('customStart') || undefined;
    const customEnd = searchParams.get('customEnd') || undefined;

    const data = await dashboardService.getDashboardData(timeframe, customStart, customEnd);
    
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

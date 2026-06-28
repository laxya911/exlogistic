import { NextResponse } from 'next/server';
import { auditLogRepository } from '@/repositories/repository';

export async function GET() {
  try {
    const logs = await auditLogRepository.getAll();
    // Return latest 5 logs
    return NextResponse.json(logs.slice(0, 5));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

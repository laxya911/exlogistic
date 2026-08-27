import { NextResponse } from 'next/server';
import { ForwarderRepository } from '@/repositories/forwarder.repository';

export async function GET() {
  try {
    const forwarders = await ForwarderRepository.findAll();
    return NextResponse.json(forwarders);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const forwarder = await ForwarderRepository.create(data);
    return NextResponse.json(forwarder);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

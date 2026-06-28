import { NextResponse } from 'next/server';
import { prisma } from '@/repositories/prisma.client';

export async function GET(request: Request) {
  try {
    const brands = await prisma.brand.findMany({
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(brands);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

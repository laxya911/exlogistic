import { NextResponse } from 'next/server';
import { prisma } from '@/repositories/prisma.client';

export async function GET() {
  const users = await prisma.user.findMany({
    include: { roles: { include: { permissions: true } } }
  });
  return NextResponse.json(users);
}

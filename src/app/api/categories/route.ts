import { NextResponse } from 'next/server';
import { prismaCategoryRepository } from '@/repositories/prisma/category.repository';

export async function GET(request: Request) {
  try {
    const categories = await prismaCategoryRepository.getAll();
    return NextResponse.json(categories);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

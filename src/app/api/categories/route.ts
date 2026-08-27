import { NextResponse } from 'next/server';
import { prismaCategoryRepository } from '@/repositories/prisma/category.repository';
import { prisma } from '@/repositories/prisma.client';

export async function GET(request: Request) {
  try {
    const categories = await prismaCategoryRepository.getAll();
    return NextResponse.json(categories);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const newCategory = await prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      }
    });
    return NextResponse.json(newCategory, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { documentRepository } from '@/repositories/repository';
import { numberingService } from '@/services/numbering.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get('type');
    const statusFilter = searchParams.get('status');
    const relTypeFilter = searchParams.get('relatedType');

    let docs = await documentRepository.getAll();
    docs = docs.filter(d => d.entityStatus !== 'DELETED');

    if (typeFilter) docs = docs.filter(d => d.type === typeFilter);
    if (statusFilter) docs = docs.filter(d => d.status === statusFilter);
    if (relTypeFilter) docs = docs.filter(d => (d as any).relatedType === relTypeFilter);

    // Sort newest first
    docs = docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(docs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    if (!data.type) {
      return NextResponse.json({ error: 'Document type is required' }, { status: 400 });
    }
    const now = new Date().toISOString();
    const item = await documentRepository.create({
      ...data,
      status: data.status || 'DRAFT',
      entityStatus: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

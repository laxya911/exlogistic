import { NextResponse } from 'next/server';
import { companyRepository } from '@/repositories/prisma/company.repository';
import { hasPermission } from '@/lib/rbac';

export async function GET() {
  try {
    const isAllowed = await hasPermission('settings:manage');
    if (!isAllowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const company = await companyRepository.get();
    return NextResponse.json(company);
  } catch (error) {
    console.error('Error fetching company:', error);
    return NextResponse.json({ error: 'Failed to fetch company' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const isAllowed = await hasPermission('settings:manage');
    if (!isAllowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await request.json();
    const id = data.id;
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const updatedCompany = await companyRepository.update(id, data);
    return NextResponse.json(updatedCompany);
  } catch (error) {
    console.error('Error updating company:', error);
    return NextResponse.json({ error: 'Failed to update company' }, { status: 500 });
  }
}

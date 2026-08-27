import { NextResponse } from 'next/server';
import { roleRepository } from '@/repositories/prisma/role.repository';
import { hasPermission } from '@/lib/rbac';

export async function GET() {
  try {
    const isAllowed = await hasPermission('roles:manage');
    if (!isAllowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const roles = await roleRepository.findAll();
    return NextResponse.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const isAllowed = await hasPermission('roles:manage');
    if (!isAllowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await request.json();
    const newRole = await roleRepository.create(data);
    return NextResponse.json(newRole, { status: 201 });
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const isAllowed = await hasPermission('roles:manage');
    if (!isAllowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await req.json();
    const { id, ...updateData } = data;
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const record = await roleRepository.update(id, updateData);
    return NextResponse.json(record);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}


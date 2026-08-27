import { NextResponse } from 'next/server';
import { permissionRepository } from '@/repositories/prisma/permission.repository';
import { hasPermission } from '@/lib/rbac';
import { prisma } from '@/repositories/prisma.client';

export async function GET() {
  try {
    const isAllowed = await hasPermission('roles:manage');
    if (!isAllowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const permissions = await permissionRepository.findAll();
    return NextResponse.json(permissions);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const isAllowed = await hasPermission('roles:manage');
    if (!isAllowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await request.json();
    const newPermission = await permissionRepository.create(data);
    return NextResponse.json(newPermission, { status: 201 });
  } catch (error) {
    console.error('Error creating permission:', error);
    return NextResponse.json({ error: 'Failed to create permission' }, { status: 500 });
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

    const record = await prisma.permission.update({
      where: { id },
      data: updateData
    });
    return NextResponse.json(record);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update permission' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const isAllowed = await hasPermission('roles:manage');
    if (!isAllowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    await permissionRepository.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete permission' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { permissionRepository } from '@/repositories/prisma/permission.repository';
import { hasPermission } from '@/lib/rbac';

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

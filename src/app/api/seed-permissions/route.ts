import { NextResponse } from 'next/server';
import { prisma } from '@/repositories/prisma.client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Not logged in' });

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { roles: true }
    });

    if (!user) return NextResponse.json({ error: 'User not found' });

    // Create Super Admin role if it doesn't exist
    let superAdminRole = await prisma.role.findFirst({ where: { name: 'Super Admin' } });
    if (!superAdminRole) {
      superAdminRole = await prisma.role.create({
        data: { name: 'Super Admin', description: 'System Administrator' }
      });
    }

    // Assign to user
    const hasRole = user.roles.some(r => r.id === superAdminRole!.id);
    if (!hasRole) {
      await prisma.user.update({
        where: { id: user.id },
        data: { roles: { connect: { id: superAdminRole.id } } }
      });
    }

    return NextResponse.json({ success: true, message: 'Super Admin role assigned' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}

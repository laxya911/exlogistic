import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { prisma } from '@/repositories/prisma.client';

export async function hasPermission(requiredPermission: string): Promise<boolean> {
  // Temporary bypass during development since the Roles UI is not yet fully implemented
  if (process.env.NODE_ENV !== 'production') return true;

  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return false;
  }

  const email = session.user.email as string;

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      roles: {
        include: {
          permissions: true,
        },
      },
    },
  });

  if (!user) return false;

  // Check if any of the user's roles have the required permission
  for (const role of user.roles) {
    // Super Admin has all permissions automatically by convention (or by explicitly linking them)
    if (role.name === 'Super Admin') return true;
    
    for (const permission of role.permissions) {
      if (permission.action === requiredPermission || permission.action === '*') {
        return true;
      }
    }
  }

  return false;
}

export async function requirePermission(permission: string) {
  const allowed = await hasPermission(permission);
  if (!allowed) {
    throw new Error(`Forbidden: Requires ${permission} permission`);
  }
  return true;
}

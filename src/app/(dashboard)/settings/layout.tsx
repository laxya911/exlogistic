import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { userRepository } from '@/repositories/prisma/user.repository';
import { ReactNode } from 'react';

export default async function SettingsLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect('/login');
  }

  const currentUser = await userRepository.findByEmail(session.user.email);
  const isAdmin = currentUser?.roles?.some(r => r.name === 'SUPERADMIN' || r.name === 'ADMIN');
  
  if (!isAdmin) {
    redirect('/launcher'); // Redirect non-admins to a safe page
  }

  return <>{children}</>;
}

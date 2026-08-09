import { PageHeaderUpdater } from '@/components/layout/page-context';
import { User, Mail, Building2, Shield, Calendar } from 'lucide-react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/repositories/prisma.client';
import { redirect } from 'next/navigation';
import ProfileEditor from './ProfileEditor';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      roles: true,
      department: true,
    }
  });

  if (!user) {
    redirect('/login');
  }

  return (
    <>
      <PageHeaderUpdater title="My Profile" subtitle="Manage your personal account settings" />
      
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile Card */}
        <div className="glass p-8 rounded-4xl border border-border relative overflow-hidden">
          <div className="flex flex-col sm:flex-row gap-8 items-start">
            <div className="w-32 h-32 rounded-3xl bg-linear-to-tr from-blue-500 to-indigo-600 p-1 shadow-2xl shrink-0">
              <div className="w-full h-full bg-background rounded-[1.3rem] flex items-center justify-center text-4xl font-mono font-bold text-foreground">
                {user.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
              </div>
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex gap-2 items-center mb-2">
                  <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-mono font-bold uppercase tracking-widest">
                    {user.status}
                  </span>
                  {user.roles.map(role => (
                    <span key={role.id} className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold uppercase tracking-widest">
                      {role.name}
                    </span>
                  ))}
                </div>
                <h2 className="text-3xl font-display font-medium text-foreground">{user.name || 'Anonymous User'}</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border">
                <div className="flex items-center gap-3 text-sm font-mono text-muted-foreground">
                  <Mail size={16} className="text-blue-400" />
                  {user.email}
                </div>
                <div className="flex items-center gap-3 text-sm font-mono text-muted-foreground">
                  <Building2 size={16} className="text-indigo-400" />
                  {user.department?.name || 'No Department'}
                </div>
                <div className="flex items-center gap-3 text-sm font-mono text-muted-foreground">
                  <Shield size={16} className="text-emerald-400" />
                  {user.roles.length} Role(s) Assigned
                </div>
                <div className="flex items-center gap-3 text-sm font-mono text-muted-foreground">
                  <Calendar size={16} className="text-amber-400" />
                  Joined {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        <ProfileEditor user={user} />
      </div>
    </>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { MasterPage } from '@/components/layout/master-page';
import { Users, Shield, Plus, Building2, Briefcase, Mail, Phone } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, deptRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/departments')
      ]);
      const usersData = await usersRes.json();
      const deptData = await deptRes.json();
      setUsers(usersData);
      setDepartments(deptData);
    } catch (error) {
      toast.error('Failed to load organizational data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MasterPage 
      title="User Management" 
      subtitle="Organization & Identity Access"
      loading={loading}
    >
      <div className="space-y-8 pb-20">
        
        {/* Header Actions */}
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-display font-medium">Directory</h2>
            <p className="text-white/50 text-sm mt-1">Manage platform access and organizational hierarchy.</p>
          </div>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_30px_rgba(37,99,235,0.4)]">
            <Plus size={16} /> Invite User
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass p-6 rounded-3xl border border-white/5 bg-white/5 flex flex-col justify-between h-32">
            <div className="flex items-center gap-3 text-white/50">
              <Users size={16} /> <span className="text-[10px] font-mono uppercase tracking-widest">Total Users</span>
            </div>
            <div className="text-4xl font-display">{users.length}</div>
          </div>
          <div className="glass p-6 rounded-3xl border border-white/5 bg-white/5 flex flex-col justify-between h-32">
            <div className="flex items-center gap-3 text-blue-400">
              <Building2 size={16} /> <span className="text-[10px] font-mono uppercase tracking-widest text-blue-400/70">Departments</span>
            </div>
            <div className="text-4xl font-display">{departments.length}</div>
          </div>
        </div>

        {/* Data Table */}
        <div className="glass rounded-4xl border border-white/5 overflow-hidden bg-black/40">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/5 bg-white/2">
                <tr>
                  <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-white/40">User</th>
                  <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-white/40">Contact</th>
                  <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-white/40">Department</th>
                  <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-white/40">Position</th>
                  <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-white/40">Status</th>
                  <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-white/40 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((user, idx) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={user.id} 
                    className="hover:bg-white/2 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-mono text-xs border border-blue-500/20">
                          {user.name ? user.name.substring(0, 2).toUpperCase() : 'U'}
                        </div>
                        <div className="font-medium">{user.name || 'Unknown'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white/60">
                      <div className="flex items-center gap-2"><Mail size={12}/> {user.email}</div>
                      {user.phone && <div className="flex items-center gap-2 mt-1 text-xs"><Phone size={12}/> {user.phone}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs">
                        <Building2 size={12} className="text-white/40"/> {user.department?.name || 'Unassigned'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs">
                        <Briefcase size={12} className="text-white/40"/> {user.position?.title || 'Unassigned'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-blue-400 hover:text-blue-300 text-xs font-medium">Edit</button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            
            {users.length === 0 && !loading && (
              <div className="p-12 text-center text-white/40 font-mono text-sm">
                No users found in the matrix.
              </div>
            )}
          </div>
        </div>

      </div>
    </MasterPage>
  );
}

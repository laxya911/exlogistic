'use client';

import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Plus,
  Shield,
  Building2,
  Mail,
  MoreVertical,
  Check,
  X,
  Edit3,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PageHeaderUpdater } from '@/components/layout/page-context';
import { useUsers } from '@/hooks/useUsers';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function UsersManagementPage() {
  const { users, roles, departments, isLoading, createUser, updateUser } = useUsers();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeUser, setActiveUser] = useState<any | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    departmentId: '',
    status: 'ACTIVE',
    roleIds: [] as string[]
  });

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const handleRoleToggle = (roleId: string) => {
    setFormData(prev => ({
      ...prev,
      // Single role selection
      roleIds: [roleId]
    }));
  };

  const handleSaveUser = async () => {
    if (!formData.name || !formData.email) {
      toast.error('Name and Email are required');
      return;
    }
    
    if (activeUser) {
      await updateUser(activeUser.id, formData);
    } else {
      await createUser(formData);
    }
    setIsCreateModalOpen(false);
    setActiveUser(null);
  };

  const openEditModal = (user: any) => {
    setActiveUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '', // Blank for edit
      departmentId: user.departmentId || '',
      status: user.status || 'ACTIVE',
      roleIds: user.roles?.map((r: any) => r.id) || []
    });
    setIsCreateModalOpen(true);
  };

  const openCreateModal = () => {
    setActiveUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      departmentId: '',
      status: 'ACTIVE',
      roleIds: []
    });
    setIsCreateModalOpen(true);
  };

  return (
    <>
      <PageHeaderUpdater title="User Administration" subtitle="Manage system access, roles, and permissions" />
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
        <div className="relative w-full sm:w-96">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search users..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-foreground transition-all"
          />
        </div>
        <button 
          onClick={openCreateModal}
          className="w-full sm:w-auto px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer border-none"
        >
          <Plus size={16} /> New User
        </button>
      </div>

      {/* Users Table */}
      <div className="glass rounded-3xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-border text-xs font-mono text-muted-foreground uppercase tracking-wider">
                <th className="p-4 font-medium pl-6">User</th>
                <th className="p-4 font-medium">Department</th>
                <th className="p-4 font-medium">Roles</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground font-mono text-sm">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground font-mono text-sm">
                    No users found matching "{searchTerm}"
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <motion.tr 
                    key={user.id} 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-white/5 transition-colors group"
                  >
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-linear-to-tr from-blue-500/20 to-indigo-500/20 border border-blue-500/30 flex items-center justify-center font-mono font-bold text-blue-400">
                          {user.name ? user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{user.name}</p>
                          <p className="text-xs font-mono text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Mail size={10} /> {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <Building2 size={14} className="text-indigo-400" />
                        {user.department?.name || 'Unassigned'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1.5">
                        {user.roles?.map((role: any) => (
                          <span key={role.id} className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold uppercase">
                            {role.name}
                          </span>
                        )) || <span className="text-xs text-muted-foreground">None</span>}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider border",
                        user.status === 'ACTIVE' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                      )}>
                        {user.status}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <button 
                        onClick={() => openEditModal(user)}
                        className="p-2 rounded-lg hover:bg-blue-500/20 text-blue-400 transition-colors cursor-pointer border-none bg-transparent"
                      >
                        <Edit3 size={16} />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setIsCreateModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-background border border-border rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-border flex justify-between items-center bg-white/5 shrink-0">
                <h2 className="text-xl font-display font-medium text-foreground">
                  {activeUser ? 'Edit User' : 'Create New User'}
                </h2>
                <button onClick={() => setIsCreateModalOpen(false)} className="p-2 rounded-xl hover:bg-white/10 text-muted-foreground cursor-pointer border-none bg-transparent">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Full Name</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Email Address</label>
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Password {activeUser && '(Leave blank to keep)'}</label>
                    <input 
                      type="password" 
                      value={formData.password}
                      onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Department</label>
                    <select 
                      value={formData.departmentId}
                      onChange={e => setFormData(prev => ({ ...prev, departmentId: e.target.value }))}
                      className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-foreground"
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Role Assignments</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {roles.map(role => {
                      const isSelected = formData.roleIds.includes(role.id);
                      return (
                        <div 
                          key={role.id}
                          onClick={() => handleRoleToggle(role.id)}
                          className={cn(
                            "p-4 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all",
                            isSelected 
                              ? "bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
                              : "bg-white/5 border-border hover:bg-white/10"
                          )}
                        >
                          <div className={cn(
                            "w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                            isSelected ? "bg-emerald-500 text-white" : "border border-muted-foreground/30"
                          )}>
                            {isSelected && <Check size={14} />}
                          </div>
                          <div>
                            <p className={cn("text-sm font-semibold", isSelected ? "text-emerald-400" : "text-foreground")}>
                              {role.name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                              {role.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Status</label>
                  <select 
                    value={formData.status}
                    onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-foreground"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="p-6 border-t border-border flex justify-end gap-3 bg-white/5 shrink-0">
                <button 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/10 text-foreground transition-colors cursor-pointer border-none bg-transparent"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveUser}
                  className="px-6 py-2.5 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/20 transition-all cursor-pointer border-none flex items-center gap-2"
                >
                  <Check size={16} /> {activeUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

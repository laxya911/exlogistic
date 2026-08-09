'use client';

import React, { useState, useEffect } from 'react';
import { PageHeaderUpdater } from '@/components/layout/page-context';
import { Users, Plus, Edit2, Trash2, Shield, X, Mail, Phone, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    status: 'ACTIVE'
  });

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openModal = (user?: any) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '',
        phone: user.phone || '',
        status: user.status || 'ACTIVE'
      });
    } else {
      setEditingUser(null);
      setFormData({ name: '', email: '', password: '', phone: '', status: 'ACTIVE' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const url = '/api/users';
      const method = editingUser ? 'PUT' : 'POST';
      const body = editingUser ? { id: editingUser.id, ...formData } : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        toast.success(editingUser ? 'User updated' : 'User created');
        closeModal();
        fetchUsers();
      } else {
        const err = await res.json().catch(() => null);
        toast.error(err?.error || 'Operation failed');
      }
    } catch (error) {
      toast.error('Network error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this user?')) return;
    try {
      const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('User deleted');
        fetchUsers();
      } else {
        toast.error('Failed to delete user');
      }
    } catch (e) {
      toast.error('Network error');
    }
  };

  return (
    <>
      <PageHeaderUpdater title="User Directory" subtitle="Access & Identity Management" />
      
      <div className="space-y-8 pb-20">
        <div className="glass p-8 lg:p-10 rounded-[2.5rem] border border-border min-h-[60vh]">
          
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-display font-medium flex items-center gap-3">
              <Users className="text-blue-500/80" size={24} />
              Identity Roster
            </h3>
            
            <button 
              onClick={() => openModal()}
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] flex items-center gap-2 cursor-pointer border-none"
            >
              <Plus size={16} />
              Add User
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center p-12"><div className="animate-spin text-2xl text-blue-500">⟳</div></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-muted-foreground border-separate border-spacing-y-2">
                <thead className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50 bg-muted">
                  <tr>
                    <th className="px-6 py-4 rounded-l-xl">User</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Roles</th>
                    <th className="px-6 py-4 text-right rounded-r-xl">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="bg-white/2 hover:bg-muted transition-colors group">
                      <td className="px-6 py-4 rounded-l-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold shrink-0">
                            {user.name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{user.name}</p>
                            <p className="text-[10px] font-mono text-muted-foreground/40">{user.id.substring(0,8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
                            <Mail size={12} /> {user.email || '-'}
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
                              <Phone size={12} /> {user.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider ${
                          user.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                          'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.roles?.length > 0 ? (
                          <div className="flex gap-1 flex-wrap">
                            {user.roles.map((r: any) => (
                              <span key={r.id} className="px-2 py-0.5 rounded text-[9px] bg-accent text-muted-foreground/60 uppercase">{r.name}</span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-white/30 italic">No roles assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 rounded-r-xl text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openModal(user)} className="p-2 hover:bg-blue-500/20 rounded-lg text-blue-400 transition-colors border-none cursor-pointer bg-transparent">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDelete(user.id)} className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors border-none cursor-pointer bg-transparent">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-muted-foreground/40 italic">
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">{editingUser ? 'Edit Identity' : 'New Identity'}</h3>
              <button onClick={closeModal} className="text-muted-foreground/50 hover:text-foreground cursor-pointer border-none bg-transparent"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest px-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full mt-1 bg-muted border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-blue-500/50 text-foreground" 
                />
              </div>
              
              <div>
                <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest px-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full mt-1 bg-muted border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-blue-500/50 text-foreground" 
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest px-1">
                  Password {editingUser && '(Leave blank to keep)'}
                </label>
                <input 
                  type="password" 
                  required={!editingUser}
                  value={formData.password} 
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full mt-1 bg-muted border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-blue-500/50 text-foreground" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest px-1">Phone</label>
                  <input 
                    type="text" 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full mt-1 bg-muted border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-blue-500/50 text-foreground" 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest px-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                    className="w-full mt-1 bg-muted border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-blue-500/50 text-foreground appearance-none cursor-pointer"
                  >
                    <option value="ACTIVE" className="bg-background">ACTIVE</option>
                    <option value="INACTIVE" className="bg-background">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm text-muted-foreground/60 hover:text-foreground cursor-pointer border-none bg-transparent">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-all cursor-pointer border-none">
                  {editingUser ? 'Update Identity' : 'Create Identity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

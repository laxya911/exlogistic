'use client';

import React, { useState, useEffect } from 'react';
import { PageHeaderUpdater } from '@/components/layout/page-context';
import { ShieldCheck, Plus, Edit2, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

export default function RolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const fetchRoles = async () => {
    try {
      const res = await fetch('/api/roles');
      if (res.ok) {
        setRoles(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const openModal = (role?: any) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        name: role.name || '',
        description: role.description || ''
      });
    } else {
      setEditingRole(null);
      setFormData({ name: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRole(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const url = '/api/roles';
      const method = editingRole ? 'PUT' : 'POST';
      const body = editingRole ? { id: editingRole.id, ...formData } : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        toast.success(editingRole ? 'Role updated' : 'Role created');
        closeModal();
        fetchRoles();
      } else {
        const err = await res.json().catch(() => null);
        toast.error(err?.error || 'Operation failed');
      }
    } catch (error) {
      toast.error('Network error');
    }
  };

  return (
    <>
      <PageHeaderUpdater title="Roles & Security" subtitle="Access Control Matrix" />
      
      <div className="space-y-8 pb-20">
        <div className="glass p-8 lg:p-10 rounded-[2.5rem] border border-border min-h-[60vh]">
          
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-display font-medium flex items-center gap-3">
              <ShieldCheck className="text-emerald-500/80" size={24} />
              Security Roles
            </h3>
            
            <button 
              onClick={() => openModal()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] flex items-center gap-2 cursor-pointer border-none"
            >
              <Plus size={16} />
              Add Role
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center p-12"><div className="animate-spin text-2xl text-emerald-500">⟳</div></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {roles.map((role) => (
                <div key={role.id} className="p-6 rounded-2xl bg-white/2 hover:bg-muted border border-border transition-all group flex flex-col justify-between h-40">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-foreground text-lg flex items-center gap-2">
                        <ShieldCheck size={16} className="text-emerald-400" />
                        {role.name}
                      </h4>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openModal(role)} className="text-blue-400 hover:text-blue-300 cursor-pointer border-none bg-transparent">
                          <Edit2 size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground/60 line-clamp-2">{role.description || 'No description provided.'}</p>
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/40 pt-4 border-t border-border">
                    {role.permissions?.length || 0} Permissions Attached
                  </div>
                </div>
              ))}
              {roles.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground/40 italic border-2 border-dashed border-border rounded-2xl">
                  No roles defined
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">{editingRole ? 'Edit Role' : 'New Role'}</h3>
              <button onClick={closeModal} className="text-muted-foreground/50 hover:text-foreground cursor-pointer border-none bg-transparent"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest px-1">Role Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full mt-1 bg-muted border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-emerald-500/50 text-foreground" 
                />
              </div>
              
              <div>
                <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest px-1">Description</label>
                <textarea 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full mt-1 bg-muted border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-emerald-500/50 text-foreground h-24 resize-none" 
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm text-muted-foreground/60 hover:text-foreground cursor-pointer border-none bg-transparent">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-all cursor-pointer border-none">
                  {editingRole ? 'Update Role' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

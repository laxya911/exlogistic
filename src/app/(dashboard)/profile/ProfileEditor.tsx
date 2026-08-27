'use client';

import React, { useState } from 'react';
import { User, Shield, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function ProfileEditor({ user }: { user: any }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user.name || '',
    phone: user.phone || '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    if (!formData.name) {
      return toast.error('Name cannot be empty');
    }
    
    if (formData.password && formData.password !== formData.confirmPassword) {
      return toast.error('Passwords do not match');
    }

    try {
      setIsSaving(true);
      
      const payload: any = {
        id: user.id,
        name: formData.name,
        phone: formData.phone
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');
      
      toast.success('Profile updated successfully');
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
      router.refresh(); // Refresh server component
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="glass p-6 rounded-3xl border border-border">
        <h3 className="text-lg font-display font-medium mb-4 flex items-center gap-2">
          <User size={18} className="text-blue-500" /> Personal Details
        </h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Full Name</label>
            <input 
              type="text" 
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-foreground"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Phone Number</label>
            <input 
              type="tel" 
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-foreground"
            />
          </div>
        </div>
      </div>

      <div className="glass p-6 rounded-3xl border border-border">
        <h3 className="text-lg font-display font-medium mb-4 flex items-center gap-2">
          <Shield size={18} className="text-emerald-500" /> Security Settings
        </h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">New Password</label>
            <input 
              type="password"
              name="password"
              placeholder="Leave blank to keep current"
              value={formData.password}
              onChange={handleChange}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-foreground"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Confirm Password</label>
            <input 
              type="password"
              name="confirmPassword" 
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-foreground"
            />
          </div>
        </div>
      </div>
      
      <div className="md:col-span-2 flex justify-end">
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="px-8 py-3 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all disabled:opacity-50 border-none cursor-pointer"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} 
          Save Changes
        </button>
      </div>
    </div>
  );
}

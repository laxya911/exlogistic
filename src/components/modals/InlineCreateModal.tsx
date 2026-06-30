import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export type EntityType = 'brand' | 'category' | 'supplier' | 'forwarder';

interface InlineCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: EntityType;
  initialValue?: string;
  onSuccess: (newEntity: any) => void;
}

export function InlineCreateModal({ isOpen, onClose, entityType, initialValue = '', onSuccess }: InlineCreateModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>({
    name: initialValue,
    email: '',
    phone: '',
    address: '',
    country: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Determine endpoint
      let endpoint = '';
      if (entityType === 'brand') endpoint = '/api/brands';
      if (entityType === 'category') endpoint = '/api/categories';
      if (entityType === 'supplier') endpoint = '/api/suppliers';
      if (entityType === 'forwarder') endpoint = '/api/forwarders';

      // Prepare payload
      let payload = { ...formData };
      if (entityType === 'category') {
        payload.slug = payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      }
      if (entityType === 'brand') {
        payload.slug = payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to create ${entityType}`);

      toast.success(`Successfully created ${entityType}`);
      onSuccess(data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="p-5 border-b border-white/5 flex justify-between items-center">
            <h3 className="font-display font-medium text-lg capitalize">Add New {entityType}</h3>
            <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-[11px] font-mono text-white/80 uppercase">Name *</label>
              <input
                required
                autoFocus
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full bg-[#111] border border-white/10 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-blue-500/50"
              />
            </div>

            {(entityType === 'supplier' || entityType === 'forwarder') && (
              <>
                <div className="space-y-2">
                  <label className="text-[11px] font-mono text-white/80 uppercase">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full bg-[#111] border border-white/10 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-mono text-white/80 uppercase">Phone *</label>
                    <input
                      required
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="w-full bg-[#111] border border-white/10 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-mono text-white/80 uppercase">Country *</label>
                    <input
                      required
                      value={formData.country}
                      onChange={(e) => handleChange('country', e.target.value)}
                      className="w-full bg-[#111] border border-white/10 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                </div>
                {entityType === 'supplier' && (
                  <div className="space-y-2">
                    <label className="text-[11px] font-mono text-white/80 uppercase">Address *</label>
                    <input
                      required
                      value={formData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      className="w-full bg-[#111] border border-white/10 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                )}
              </>
            )}

            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white/70 hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-2"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Create'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

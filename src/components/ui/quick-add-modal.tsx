import React, { useState } from 'react';
import { X, Save } from 'lucide-react';

interface QuickAddModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
  placeholder?: string;
}

export function QuickAddModal({ title, isOpen, onClose, onSave, placeholder = 'Name' }: QuickAddModalProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onSave(name.trim());
      setName('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-white font-mono font-bold">{title}</h3>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-mono text-white/80 uppercase tracking-wider block mb-2">{placeholder}</label>
            <input 
              autoFocus
              className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-white focus:border-blue-500 focus:outline-none transition-colors"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>
          
          {error && <div className="text-red-400 text-xs font-mono">{error}</div>}
          
          <div className="flex justify-end pt-4">
            <button 
              onClick={handleSave} 
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-black font-bold text-sm rounded-lg hover:bg-blue-400 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Save size={16} /> {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

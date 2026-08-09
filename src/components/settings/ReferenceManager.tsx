'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface ReferenceManagerProps {
  title: string;
  type: string; // 'currencies', 'taxes', 'containers', 'incoterms', 'units'
  icon: React.ElementType;
  fields: { key: string, label: string, type: 'text' | 'number' | 'boolean' }[];
}

export function ReferenceManager({ title, type, icon: Icon, fields }: ReferenceManagerProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState<any>({});
  
  const fetchItems = async () => {
    try {
      const res = await fetch(`/api/reference/${type}`);
      if (res.ok) {
        setItems(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [type]);

  const handleCreate = async () => {
    try {
      const res = await fetch(`/api/reference/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });
      if (res.ok) {
        toast.success(`${title} added successfully`);
        setIsAdding(false);
        setNewItem({});
        fetchItems();
      } else {
        toast.error(`Failed to add ${title}`);
      }
    } catch (e) {
      toast.error('Error occurred');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      const res = await fetch(`/api/reference/${type}?id=${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success(`${title} deleted`);
        fetchItems();
      }
    } catch (e) {
      toast.error('Error deleting item');
    }
  };

  return (
    <div className="bg-(--surface) p-8 lg:p-10 rounded-[2.5rem] border border-(--surface-border) flex flex-col h-full shadow-sm">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-xl font-display font-medium flex items-center gap-3">
          <Icon className="text-blue-500/80" size={24} />
          {title}
        </h3>
        <button 
          onClick={() => setIsAdding(true)}
          className="text-[9px] font-mono uppercase tracking-widest text-emerald-400 border border-emerald-400/20 px-3 py-1 rounded-lg hover:bg-emerald-400/10 transition-colors bg-transparent flex items-center gap-1 cursor-pointer"
        >
          <Plus size={12} /> Add
        </button>
      </div>

      <div className="space-y-4 flex-1">
        {loading ? (
          <div className="text-sm text-muted-foreground/40 animate-pulse">Loading {title.toLowerCase()}...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isAdding && (
              <div className="p-4 rounded-xl bg-(--background) border border-emerald-500/30 space-y-3 shadow-inner">
                {fields.map(f => (
                  <div key={f.key}>
                    <label className="text-[10px] font-mono text-muted-foreground/50 uppercase">{f.label}</label>
                    {f.type === 'boolean' ? (
                      <input 
                        type="checkbox"
                        checked={newItem[f.key] || false}
                        onChange={e => setNewItem({...newItem, [f.key]: e.target.checked})}
                        className="ml-2"
                      />
                    ) : (
                      <input 
                        type={f.type === 'number' ? 'number' : 'text'}
                        value={newItem[f.key] || ''}
                        onChange={e => {
                          const val = e.target.value;
                          const parsed = f.type === 'number' ? (val === '' ? undefined : parseFloat(val)) : val;
                          setNewItem({...newItem, [f.key]: parsed});
                        }}
                        className="w-full bg-(--surface-hover) border border-(--border) rounded-lg p-2 text-xs text-(--text-primary) focus:outline-none focus:border-blue-500/50 mt-1"
                      />
                    )}
                  </div>
                ))}
                <div className="flex gap-2 pt-2">
                  <button onClick={handleCreate} className="flex-1 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 py-2 rounded-lg text-xs flex justify-center items-center cursor-pointer">
                    <Check size={14} /> Save
                  </button>
                  <button onClick={() => setIsAdding(false)} className="px-3 bg-red-500/20 text-red-400 hover:bg-red-500/30 py-2 rounded-lg text-xs flex justify-center items-center cursor-pointer">
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}
            
            {items.map(item => (
              <div key={item.id} className="group relative p-4 rounded-xl bg-(--background) border border-(--surface-border) hover:border-blue-500/30 transition-colors shadow-sm">
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:bg-red-500/20 rounded cursor-pointer transition-all"
                >
                  <Trash2 size={12} />
                </button>
                {fields.map(f => (
                  <div key={f.key} className="mb-1 last:mb-0">
                    <span className="text-[10px] font-mono text-muted-foreground/40 uppercase mr-2">{f.label}:</span>
                    <span className="text-xs text-foreground/90">
                      {f.type === 'boolean' ? (item[f.key] ? 'Yes' : 'No') : item[f.key]}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

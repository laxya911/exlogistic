'use client';

import { useState, useEffect, ElementType } from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface Field {
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select';
  options?: { label: string; value: string }[];
}

interface CrudManagerProps {
  title: string;
  endpoint: string;
  icon: ElementType;
  fields: Field[];
}

export function CrudManager({ title, endpoint, icon: Icon, fields }: CrudManagerProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState<any>({});

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<any>({});
  
  const fetchItems = async () => {
    try {
      const res = await fetch(endpoint);
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
  }, [endpoint]);

  const handleCreate = async () => {
    try {
      const res = await fetch(endpoint, {
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
        const err = await res.json().catch(() => null);
        toast.error(err?.error || `Failed to add ${title}`);
      }
    } catch (e) {
      toast.error('Error occurred');
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...editItem })
      });
      if (res.ok) {
        toast.success(`${title} updated successfully`);
        setEditingId(null);
        setEditItem({});
        fetchItems();
      } else {
        const err = await res.json().catch(() => null);
        toast.error(err?.error || `Failed to update ${title}`);
      }
    } catch (e) {
      toast.error('Error occurred');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      const res = await fetch(`${endpoint}?id=${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success(`${title} deleted`);
        fetchItems();
      } else {
        const errData = await res.json().catch(() => null);
        toast.error(errData?.error || `Failed to delete ${title}`);
      }
    } catch (e) {
      toast.error('Error deleting item');
    }
  };

  return (
    <div className="glass p-8 lg:p-10 rounded-[2.5rem] border border-border flex flex-col h-full">
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
              <div className="p-4 rounded-xl bg-(--background) shadow-inner border border-emerald-500/30 space-y-3">
                {fields.map(f => (
                  <div key={f.key}>
                    <label className="text-[10px] font-mono text-muted-foreground/50 uppercase">{f.label}</label>
                    {f.type === 'boolean' ? (
                      <input 
                        type="checkbox"
                        checked={newItem[f.key] || false}
                        onChange={e => setNewItem({...newItem, [f.key]: e.target.checked})}
                        className="ml-2 accent-emerald-500"
                      />
                    ) : f.type === 'select' ? (
                      <select
                        value={newItem[f.key] || ''}
                        onChange={e => setNewItem({...newItem, [f.key]: e.target.value})}
                        className="w-full bg-(--surface-hover) border border-(--border) rounded-lg py-1.5 px-3 text-sm text-(--text-primary) focus:outline-none focus:border-emerald-500/50 mt-1"
                      >
                        <option value="">Select...</option>
                        {f.options?.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    ) : (
                      <input 
                        type={f.type === 'number' ? 'number' : 'text'}
                        value={newItem[f.key] || ''}
                        onChange={e => setNewItem({...newItem, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value})}
                        className="w-full bg-(--surface-hover) border border-(--border) rounded-lg py-1.5 px-3 text-sm text-(--text-primary) focus:outline-none focus:border-emerald-500/50 mt-1"
                        placeholder={`Enter ${f.label.toLowerCase()}`}
                      />
                    )}
                  </div>
                ))}
                <div className="flex gap-2 pt-2">
                  <button onClick={handleCreate} className="flex-1 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 py-1.5 rounded-lg text-xs font-medium flex justify-center items-center gap-1 transition-colors">
                    <Check size={14} /> Save
                  </button>
                  <button onClick={() => setIsAdding(false)} className="flex-1 bg-muted hover:bg-accent text-muted-foreground py-1.5 rounded-lg text-xs font-medium flex justify-center items-center gap-1 transition-colors">
                    <X size={14} /> Cancel
                  </button>
                </div>
              </div>
            )}

            {items.map(item => (
              <div key={item.id} className="p-4 rounded-xl bg-(--background) shadow-sm border border-(--border) hover:bg-(--surface-hover) transition-colors group relative">
                
                {editingId === item.id ? (
                  <div className="space-y-3">
                    {fields.map(f => (
                      <div key={f.key}>
                        <label className="text-[10px] font-mono text-muted-foreground/50 uppercase">{f.label}</label>
                        {f.type === 'boolean' ? (
                          <input 
                            type="checkbox"
                            checked={editItem[f.key] || false}
                            onChange={e => setEditItem({...editItem, [f.key]: e.target.checked})}
                            className="ml-3 rounded border-border bg-muted text-blue-500 focus:ring-blue-500/20"
                          />
                        ) : f.type === 'select' ? (
                          <select
                            value={editItem[f.key] || ''}
                            onChange={e => setEditItem({...editItem, [f.key]: e.target.value})}
                            className="w-full bg-(--surface-hover) border border-(--border) rounded-lg py-1.5 px-3 text-sm text-(--text-primary) focus:outline-none focus:border-blue-500/50 mt-1 appearance-none"
                          >
                            <option value="">Select...</option>
                            {f.options?.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        ) : (
                          <input 
                            type={f.type === 'number' ? 'number' : 'text'}
                            value={editItem[f.key] || ''}
                            onChange={e => setEditItem({...editItem, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value})}
                            className="w-full bg-(--surface-hover) border border-(--border) rounded-lg py-1.5 px-3 text-sm text-(--text-primary) focus:outline-none focus:border-blue-500/50 mt-1"
                            placeholder={`Enter ${f.label.toLowerCase()}`}
                          />
                        )}
                      </div>
                    ))}
                    <div className="flex gap-2 pt-2">
                      <button onClick={() => handleUpdate(item.id)} className="flex-1 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 py-1.5 rounded-lg text-xs font-medium flex justify-center items-center gap-1 transition-colors">
                        <Check size={14} /> Save
                      </button>
                      <button onClick={() => { setEditingId(null); setEditItem({}); }} className="flex-1 bg-muted hover:bg-accent text-muted-foreground py-1.5 rounded-lg text-xs font-medium flex justify-center items-center gap-1 transition-colors">
                        <X size={14} /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => { setEditingId(item.id); setEditItem(item); }}
                        className="text-muted-foreground/40 hover:text-blue-500 transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="text-muted-foreground/40 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="space-y-1">
                      {fields.map((f, i) => (
                        <div key={f.key} className={i === 0 ? "font-medium text-blue-400" : "text-sm text-muted-foreground/60"}>
                          {i !== 0 && <span className="text-[10px] uppercase font-mono mr-2 text-muted-foreground/50">{f.label}:</span>}
                          {f.type === 'boolean' 
                            ? (item[f.key] ? 'Yes' : 'No')
                            : f.type === 'select'
                              ? (f.options?.find(o => o.value === item[f.key])?.label || item[f.key] || '-')
                              : (item[f.key]?.toString() || '-')}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { PageHeaderUpdater } from '@/components/layout/page-context';
import { Settings2, Plus, Trash2, Check, X, Tags, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AttributesPage() {
  const [attributes, setAttributes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingAttr, setIsAddingAttr] = useState(false);
  const [newAttrName, setNewAttrName] = useState('');
  
  // Value Management State
  const [expandedAttrId, setExpandedAttrId] = useState<string | null>(null);
  const [newValueMap, setNewValueMap] = useState<Record<string, string>>({});
  
  // Edit State
  const [editingAttrId, setEditingAttrId] = useState<string | null>(null);
  const [editAttrName, setEditAttrName] = useState('');

  const fetchAttributes = async () => {
    try {
      const res = await fetch('/api/attributes');
      if (res.ok) {
        setAttributes(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttributes();
  }, []);

  const handleCreateAttribute = async () => {
    if (!newAttrName.trim()) return;
    try {
      const res = await fetch('/api/attributes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newAttrName })
      });
      if (res.ok) {
        toast.success('Attribute created');
        setIsAddingAttr(false);
        setNewAttrName('');
        fetchAttributes();
      } else {
        const err = await res.json().catch(() => null);
        toast.error(err?.error || 'Failed to create attribute');
      }
    } catch (e) {
      toast.error('Error occurred');
    }
  };

  const handleUpdateAttribute = async (id: string) => {
    if (!editAttrName.trim()) return;
    try {
      const res = await fetch(`/api/attributes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: editAttrName })
      });
      if (res.ok) {
        toast.success('Attribute renamed');
        setEditingAttrId(null);
        fetchAttributes();
      } else {
        const err = await res.json().catch(() => null);
        toast.error(err?.error || 'Failed to rename attribute');
      }
    } catch (e) {
      toast.error('Error occurred');
    }
  };

  const handleDeleteAttribute = async (id: string) => {
    if (!confirm('Are you sure you want to delete this attribute and all its values?')) return;
    try {
      const res = await fetch(`/api/attributes?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Attribute deleted');
        if (expandedAttrId === id) setExpandedAttrId(null);
        fetchAttributes();
      } else {
        const err = await res.json().catch(() => null);
        toast.error(err?.error || 'Failed to delete attribute');
      }
    } catch (e) {
      toast.error('Error occurred');
    }
  };

  const handleAddValue = async (attrId: string) => {
    const val = newValueMap[attrId];
    if (!val || !val.trim()) return;
    
    try {
      const res = await fetch('/api/attributes/values', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attributeId: attrId, value: val.trim() })
      });
      if (res.ok) {
        toast.success('Value added');
        setNewValueMap(prev => ({ ...prev, [attrId]: '' }));
        fetchAttributes();
      } else {
        const err = await res.json().catch(() => null);
        toast.error(err?.error || 'Failed to add value');
      }
    } catch (e) {
      toast.error('Error occurred');
    }
  };

  const handleDeleteValue = async (attrId: string, valueId: string) => {
    try {
      const res = await fetch(`/api/attributes/values?id=${valueId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Value deleted');
        fetchAttributes();
      } else {
        const err = await res.json().catch(() => null);
        toast.error(err?.error || 'Failed to delete value');
      }
    } catch (e) {
      toast.error('Error occurred');
    }
  };

  return (
    <>
      <PageHeaderUpdater title="Attributes" subtitle="Product Variations and Attributes" />
      
      <div className="space-y-8 pb-20">
        <div className="glass p-8 lg:p-10 rounded-[2.5rem] border border-border flex flex-col h-full min-h-[60vh]">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-display font-medium flex items-center gap-3">
              <Settings2 className="text-blue-500/80" size={24} />
              Product Attributes
            </h3>
            <button 
              onClick={() => setIsAddingAttr(true)}
              className="text-[9px] font-mono uppercase tracking-widest text-emerald-400 border border-emerald-400/20 px-3 py-1.5 rounded-lg hover:bg-emerald-400/10 transition-colors bg-transparent flex items-center gap-1 cursor-pointer"
            >
              <Plus size={12} /> Add Attribute
            </button>
          </div>

          <div className="flex-1">
            {loading ? (
              <div className="text-sm text-muted-foreground/40 animate-pulse">Loading attributes...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                
                {isAddingAttr && (
                  <div className="p-5 rounded-2xl bg-black/40 border border-emerald-500/30 space-y-4 shadow-lg shadow-emerald-500/5">
                    <div>
                      <label className="text-[10px] font-mono text-muted-foreground/50 uppercase mb-2 block">Attribute Name</label>
                      <input 
                        type="text"
                        autoFocus
                        value={newAttrName}
                        onChange={e => setNewAttrName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleCreateAttribute()}
                        className="w-full bg-muted border border-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-emerald-500/50"
                        placeholder="e.g. Color, Size, Material"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleCreateAttribute} className="flex-1 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 py-2 rounded-xl text-xs font-medium flex justify-center items-center gap-1 transition-colors cursor-pointer">
                        <Check size={14} /> Create
                      </button>
                      <button onClick={() => setIsAddingAttr(false)} className="flex-1 bg-muted hover:bg-accent text-muted-foreground py-2 rounded-xl text-xs font-medium flex justify-center items-center gap-1 transition-colors cursor-pointer">
                        <X size={14} /> Cancel
                      </button>
                    </div>
                  </div>
                )}

                {attributes.map(attr => (
                  <div key={attr.id} className="rounded-2xl bg-white/2 border border-border overflow-hidden flex flex-col group relative">
                    {/* Header */}
                    <div 
                      className="p-5 flex justify-between items-center cursor-pointer hover:bg-white/2 transition-colors border-b border-border h-20"
                      onClick={() => {
                        if (editingAttrId !== attr.id) setExpandedAttrId(expandedAttrId === attr.id ? null : attr.id)
                      }}
                    >
                      {editingAttrId === attr.id ? (
                        <div className="flex-1 flex gap-2 pr-2" onClick={e => e.stopPropagation()}>
                          <input 
                            type="text"
                            autoFocus
                            value={editAttrName}
                            onChange={e => setEditAttrName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleUpdateAttribute(attr.id)}
                            className="flex-1 bg-muted border border-border rounded-lg py-1 px-2 text-sm focus:outline-none focus:border-blue-500/50"
                          />
                          <button onClick={() => handleUpdateAttribute(attr.id)} className="px-2 text-blue-400 hover:bg-blue-400/10 rounded-lg">
                            <Check size={14} />
                          </button>
                          <button onClick={() => setEditingAttrId(null)} className="px-2 text-muted-foreground/40 hover:text-foreground rounded-lg">
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div>
                            <h4 className="font-medium text-blue-400 flex items-center gap-2">
                              <Tags size={14} className="text-white/30" />
                              {attr.name}
                            </h4>
                            <p className="text-xs text-muted-foreground/50 mt-1 font-mono">{attr.values?.length || 0} values</p>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={(e) => { e.stopPropagation(); setEditingAttrId(attr.id); setEditAttrName(attr.name); }}
                              className="p-2 text-white/20 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all cursor-pointer"
                              title="Rename Attribute"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteAttribute(attr.id); }}
                              className="p-2 text-white/20 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all cursor-pointer"
                              title="Delete Attribute"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Values Area */}
                    <div className="flex-1 p-5 bg-black/20 flex flex-col gap-4">
                      {attr.values?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {attr.values.map((v: any) => (
                            <div key={v.id} className="px-2.5 py-1 rounded-md bg-muted border border-border text-xs text-muted-foreground flex items-center gap-2 group/val">
                              <span>{v.value}</span>
                              <button 
                                onClick={() => handleDeleteValue(attr.id, v.id)}
                                className="opacity-0 group-hover/val:opacity-100 text-white/30 hover:text-red-400 transition-opacity cursor-pointer"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-white/30 italic">No values defined yet.</div>
                      )}
                      
                      {/* Add Value Input */}
                      <div className="mt-auto pt-2 flex gap-2">
                        <input 
                          type="text"
                          placeholder="Add new value..."
                          value={newValueMap[attr.id] || ''}
                          onChange={e => setNewValueMap(prev => ({ ...prev, [attr.id]: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && handleAddValue(attr.id)}
                          className="flex-1 bg-muted border border-border rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-blue-500/50"
                        />
                        <button 
                          onClick={() => handleAddValue(attr.id)}
                          className="px-3 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors cursor-pointer"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

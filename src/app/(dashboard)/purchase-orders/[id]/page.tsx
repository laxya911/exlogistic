'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeaderUpdater } from '@/components/layout/page-context';
import {
  ArrowLeft, Package, Send, CheckCircle2, Play, Truck,
  PackageCheck, XCircle, Trash2, Copy, FileText, DollarSign,
  Calendar, Activity, MessageSquare, ExternalLink, User, Building
} from 'lucide-react';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';
import { PurchaseOrder, Supplier, Product } from '@/types';
import { PurchaseOrderMetadataCard } from '@/components/purchase/purchase-order-metadata-card';
import { LineItemsTable } from '@/components/sales/line-items-table';

const STATUS_FLOW = ['DRAFT', 'ISSUED', 'ACKNOWLEDGED', 'IN_PRODUCTION', 'DISPATCHED', 'RECEIVED'] as const;

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState('');

  // Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (id) fetchData(); }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/purchase-orders/${id}`);
      if (!res.ok) throw new Error('Purchase order not found');
      const poData: PurchaseOrder = await res.json();
      setPo(poData);

      const [sRes, pRes] = await Promise.all([
        fetch(`/api/suppliers/${poData.supplierId}`).then(r => r.ok ? r.json() : null),
        fetch('/api/products').then(r => r.json())
      ]);
      setSupplier(sRes);
      setProducts(pRes);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load PO');
      router.push('/purchase-orders');
    } finally {
      setLoading(false);
    }
  };

  const callAction = async (action: string, extra?: Record<string, any>) => {
    const res = await fetch(`/api/purchase-orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...extra })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Action failed');
    return data;
  };

  const handleAction = async (action: string, label: string, extra?: Record<string, any>) => {
    try {
      await callAction(action, extra);
      toast.success(label);
      await fetchData();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleSaveNote = async () => {
    if (!noteText.trim()) return;
    try {
      const updated = await callAction('add_note', { note: noteText.trim() });
      setPo(updated);
      setNoteText('');
      toast.success('Note logged to timeline');
    } catch (e: any) { toast.error(e.message); }
  };

  const handleDelete = async () => {
    if (!confirm('Soft-delete this PO?')) return;
    const res = await fetch(`/api/purchase-orders/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('PO soft-deleted'); router.push('/purchase-orders'); }
    else toast.error('Delete failed');
  };

  const handleEditToggle = () => {
    if (!isEditing) {
      setFormState({
        currency: po?.currency || 'USD',
        incoterm: po?.incoterm || '',
        expectedDeliveryDate: po?.expectedDeliveryDate || '',
        paymentTerms: po?.paymentTerms || '',
        items: po?.items?.map(i => ({
          ...i,
          name: products.find(p => p.id === i.productId)?.name || '',
          sku: products.find(p => p.id === i.productId)?.sku || '',
          uom: products.find(p => p.id === i.productId)?.uom || 'MT',
          total: (i.quantity || 0) * (i.unitPrice || 0)
        })) || []
      });
    }
    setIsEditing(!isEditing);
  };

  const handleSaveEdit = async () => {
    try {
      setSaving(true);
      
      const itemsToSave = formState.items.map((i: any) => {
        const product = products.find(p => p.id === i.productId);
        const variant = product?.variants?.find((v: any) => v.id === i.variantId);
        return {
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.total
        };
      });
      const totalValue = itemsToSave.reduce((sum: number, i: any) => sum + (i.totalPrice || 0), 0);

      const payload = {
        ...po,
        ...formState,
        items: itemsToSave,
        totalValue
      };

      const res = await fetch(`/api/purchase-orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      setPo(data);
      setIsEditing(false);
      toast.success('Purchase Order updated successfully');
      await fetchData();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const updateFormState = (field: string, value: any) => {
    setFormState((prev: any) => ({ ...prev, [field]: value }));
  };

  const updateItem = (idx: number, field: string, value: any) => {
    const newItems = [...formState.items];
    const item = { ...newItems[idx], [field]: value };
    
    if (field === 'variantId') {
      for (const p of products) {
        const v = p.variants?.find((v: any) => v.id === value);
        if (v) {
          item.productId = p.id;
          item.name = p.name;
          item.sku = v.sku;
          item.uom = p.uom || 'MT';
          item.unitPrice = v.purchasePrice || p.purchasePrice || v.sellingPrice || p.sellingPrice || 0;
          break;
        }
      }
      item.total = (item.quantity || 0) * item.unitPrice;
    }
    
    if (field === 'quantity' || field === 'unitPrice') {
      item.total = (item.quantity || 0) * (item.unitPrice || 0);
    }
    
    newItems[idx] = item;
    updateFormState('items', newItems);
  };

  const removeItem = (idx: number) => {
    const newItems = [...formState.items];
    newItems.splice(idx, 1);
    updateFormState('items', newItems);
  };

  const addItem = () => {
    updateFormState('items', [
      ...formState.items,
      { productId: '', variantId: '', quantity: 1, unitPrice: 0, total: 0 }
    ]);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'text-white/70 bg-white/5 border-white/10';
      case 'ISSUED': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'ACKNOWLEDGED': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
      case 'IN_PRODUCTION': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'DISPATCHED': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'RECEIVED': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'CANCELLED': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      default: return 'text-white/80 bg-white/5 border-white/10';
    }
  };

  const getProductName = (productId: string) => {
    const p = products.find(x => x.id === productId);
    return p ? `${p.name} (${p.sku})` : productId;
  };

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case 'CREATED': return <FileText size={10} />;
      case 'ISSUED': return <Send size={10} className="text-blue-400" />;
      case 'ACKNOWLEDGED': return <CheckCircle2 size={10} className="text-cyan-400" />;
      case 'IN_PRODUCTION': return <Play size={10} className="text-amber-400" />;
      case 'DISPATCHED': return <Truck size={10} className="text-purple-400" />;
      case 'RECEIVED': return <PackageCheck size={10} className="text-emerald-400" />;
      case 'CANCELLED': return <XCircle size={10} className="text-rose-400" />;
      case 'NOTE_ADDED': return <MessageSquare size={10} />;
      default: return <Activity size={10} />;
    }
  };

  if (!po) return null;

  const statusIdx = STATUS_FLOW.indexOf(po.status as any);
  const isCancelled = po.status === 'CANCELLED';

  return (
    <>
      <PageHeaderUpdater title={po.poNo} subtitle="Procurement Order — Supplier Pipeline Dashboard"  />
      <div className="space-y-8">

        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button onClick={() => router.push('/purchase-orders')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-mono uppercase text-white/90 hover:bg-white/10 cursor-pointer">
            <ArrowLeft size={12} /> Back to ledger
          </button>

          <div className="flex flex-wrap items-center gap-2.5">
            {isEditing ? (
              <>
                <button onClick={() => setIsEditing(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-mono uppercase tracking-widest text-white/70 hover:bg-white/5 border border-white/10 transition-colors bg-transparent cursor-pointer">
                  Cancel
                </button>
                <button onClick={handleSaveEdit} disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 text-black hover:bg-blue-400 disabled:opacity-50 rounded-xl text-xs font-mono font-bold uppercase tracking-widest transition-all border-none cursor-pointer">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <>
                <button onClick={handleDelete}
                  className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-white/70 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer" title="Soft delete">
                  <Trash2 size={14} />
                </button>

                {(po.status === 'DRAFT' || po.status === 'ISSUED') && (
                  <button onClick={handleEditToggle}
                    className="flex items-center gap-1.5 px-5 py-3 border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/25 rounded-2xl text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer">
                    <FileText size={12} /> Edit PO
                  </button>
                )}

            {!isCancelled && po.status !== 'RECEIVED' && (
              <button onClick={() => handleAction('cancel', 'PO cancelled')}
                className="flex items-center gap-1.5 px-5 py-3 border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/25 rounded-2xl text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer">
                <XCircle size={12} /> Cancel PO
              </button>
            )}
            {po.status === 'DRAFT' && (
              <button onClick={() => handleAction('issue', 'PO issued to supplier')}
                className="flex items-center gap-1.5 px-5 py-3 border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/25 rounded-2xl text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer">
                <Send size={12} /> Issue to Supplier
              </button>
            )}
            {po.status === 'ISSUED' && (
              <button onClick={() => handleAction('acknowledge', 'Supplier acknowledged')}
                className="flex items-center gap-1.5 px-5 py-3 border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/25 rounded-2xl text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer">
                <CheckCircle2 size={12} /> Mark Acknowledged
              </button>
            )}
            {po.status === 'ACKNOWLEDGED' && (
              <button onClick={() => handleAction('start_production', 'Production started')}
                className="flex items-center gap-1.5 px-5 py-3 border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/25 rounded-2xl text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer">
                <Play size={12} /> Start Production
              </button>
            )}
            {po.status === 'IN_PRODUCTION' && (
              <button onClick={() => handleAction('dispatch', 'Cargo dispatched')}
                className="flex items-center gap-1.5 px-5 py-3 border border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/25 rounded-2xl text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer">
                <Truck size={12} /> Mark Dispatched
              </button>
            )}
            {po.status === 'DISPATCHED' && (
              <button onClick={() => handleAction('receive', 'Goods received — GRN issued')}
                className="flex items-center gap-1.5 px-6 py-3 bg-emerald-500 text-black hover:bg-emerald-400 rounded-2xl text-[10px] font-mono font-bold uppercase tracking-widest transition-all border-none cursor-pointer">
                <PackageCheck size={12} /> Receive Goods & Issue GRN →
              </button>
            )}
            {po.status === 'RECEIVED' && (
              <span className="px-5 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-[10px] font-mono font-bold uppercase tracking-widest">
                ✓ GOODS RECEIVED
              </span>
            )}
              </>
            )}
          </div>
        </div>

        {/* Progress Stepper */}
        {!isCancelled && (
          <div className="glass p-6 rounded-3xl border border-white/5">
            <div className="flex items-center gap-2 overflow-x-auto">
              {STATUS_FLOW.map((step, i) => (
                <React.Fragment key={step}>
                  <div className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-xl text-[9px] font-mono uppercase tracking-widest whitespace-nowrap transition-all',
                    i < statusIdx ? 'text-white/80 bg-white/3' :
                    i === statusIdx ? 'text-black bg-amber-400 font-bold' :
                    'text-white/70 bg-white/2'
                  )}>
                    {i < statusIdx && <CheckCircle2 size={9} />}
                    {step.replace('_', ' ')}
                  </div>
                  {i < STATUS_FLOW.length - 1 && (
                    <div className={cn('h-px flex-1 min-w-[12px]', i < statusIdx ? 'bg-amber-400/30' : 'bg-white/5')} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left sidebar */}
          <div className="lg:col-span-4 space-y-6">

            {/* PO Parameters */}
            <PurchaseOrderMetadataCard 
              isEditing={isEditing} 
              po={po} 
              formState={formState} 
              onChange={updateFormState} 
              getStatusStyle={getStatusStyle} 
            />

            {/* Supplier Card */}
            {supplier && (
              <div className="glass p-8 rounded-4xl border border-white/5 space-y-4">
                <h4 className="text-[10px] font-mono text-white/70 uppercase tracking-widest pb-3 border-b border-white/5 flex items-center gap-2">
                  <User size={12} className="text-amber-400" /> Vendor / Supplier Node
                </h4>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/80">
                    <Building size={20} />
                  </div>
                  <div className="flex-1 min-w-0 font-mono">
                    <p className="font-sans font-bold text-sm text-white/90 truncate">{supplier.name}</p>
                    <p className="text-[9px] text-white/80 uppercase">{supplier.country}</p>
                    <p className="text-[10px] text-amber-400 truncate mt-1.5">{supplier.email}</p>
                    <p className="text-[10px] text-white/70">{supplier.phone}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Quality & Packaging Specs */}
            {(po.qualitySpec || po.packagingSpec) && (
              <div className="glass p-8 rounded-4xl border border-white/5 space-y-4">
                <h4 className="text-[10px] font-mono text-white/70 uppercase tracking-widest pb-2 border-b border-white/5">
                  Quality & Packaging Spec
                </h4>
                {po.qualitySpec && (
                  <div>
                    <p className="text-[9px] font-mono text-white/70 uppercase mb-1">Quality</p>
                    <p className="text-[11px] font-mono text-white/70 leading-relaxed">{po.qualitySpec}</p>
                  </div>
                )}
                {po.packagingSpec && (
                  <div className="pt-2 border-t border-white/5">
                    <p className="text-[9px] font-mono text-white/70 uppercase mb-1">Packaging</p>
                    <p className="text-[11px] font-mono text-white/70 leading-relaxed">{po.packagingSpec}</p>
                  </div>
                )}
              </div>
            )}

            {/* Documents */}
            <div className="glass p-8 rounded-4xl border border-white/5 space-y-4">
              <h4 className="text-[10px] font-mono text-white/70 uppercase tracking-widest pb-2 border-b border-white/5">
                PO Documents
              </h4>
              {(po.documents || []).length > 0 ? (
                (po.documents || []).map(doc => (
                  <div key={doc.id} className="flex justify-between items-center p-3 bg-white/2 border border-white/5 rounded-xl text-[11px] font-mono">
                    <div className="flex items-center gap-2">
                      <FileText size={13} className="text-amber-400 shrink-0" />
                      <span className="text-white/80 truncate max-w-[140px]">{doc.name}</span>
                    </div>
                    <a href={doc.url} className="text-white/80 hover:text-white transition-colors shrink-0">
                      <ExternalLink size={12} />
                    </a>
                  </div>
                ))
              ) : (
                <p className="text-center py-4 text-white/10 text-[9px] font-mono uppercase">No documents uploaded</p>
              )}
            </div>
          </div>

          {/* Right main panel */}
          <div className="lg:col-span-8 space-y-8">

            {/* Line Items */}
            <LineItemsTable 
              isEditing={isEditing}
              items={isEditing ? formState.items : po.items}
              updateItem={updateItem}
              removeItem={removeItem}
              addItem={addItem}
              variantOptions={products.flatMap(p => p.variants?.map((v: any) => ({
                value: v.id,
                label: `${p.name} (${v.sku})`,
                description: `Stock: ${v.inventory || 0} ${p.uom || 'MT'} | Cost: ${formatCurrency(v.purchasePrice || p.purchasePrice || 0)}`
              })) || [])}
              formatCurrency={formatCurrency}
              getProductName={getProductName}
              marginPercentage={0}
              setMarginPercentage={() => {}}
              costOfGoods={isEditing ? formState.items.reduce((s: number, i: any) => s + (i.total || 0), 0) : po.totalValue}
              grossProfit={0}
              totalValue={isEditing ? formState.items.reduce((s: number, i: any) => s + (i.total || 0), 0) : po.totalValue}
              isPurchaseOrder={true}
            />

            {/* Remarks */}
            {po.remarks && (
              <div className="glass p-8 rounded-4xl border border-white/5 space-y-3">
                <h4 className="text-[10px] font-mono text-white/70 uppercase tracking-widest pb-2 border-b border-white/5">Special Remarks & Instructions</h4>
                <p className="text-[11px] font-mono text-white/70 whitespace-pre-wrap leading-relaxed">{po.remarks}</p>
              </div>
            )}

            {/* Timeline & Notes */}
            <div className="glass p-8 rounded-4xl border border-white/5 space-y-6">
              <h3 className="text-sm font-mono text-white/70 uppercase tracking-widest flex items-center gap-2 pb-4 border-b border-white/5">
                <Activity size={14} className="text-amber-400" /> Procurement Timeline
              </h3>

              {/* Note logger */}
              <div className="p-4 rounded-2xl bg-white/2 border border-white/5 space-y-3">
                <p className="text-[8px] font-mono text-white/70 uppercase tracking-wider">Log Procurement Note</p>
                <textarea
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder="Record supplier communications, quality hold notifications, or delivery updates..."
                  className="w-full bg-[#070707] border border-white/10 rounded-xl p-3 text-[11px] font-mono text-white focus:outline-none focus:border-amber-500/50 min-h-[56px]"
                />
                <div className="flex justify-end">
                  <button onClick={handleSaveNote} disabled={!noteText.trim()}
                    className="px-4 py-2 bg-amber-500 text-black text-[9px] font-mono font-bold uppercase rounded-lg hover:bg-amber-400 disabled:opacity-40 border-none cursor-pointer">
                    Save Note
                  </button>
                </div>
              </div>

              {/* Events list */}
              <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-2 space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-white/5">
                {(po.timeline || []).map((ev, idx) => (
                  <div key={ev.id || idx} className="relative pl-8">
                    <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-[#0a0a0a] border border-white/15 flex items-center justify-center z-10 text-amber-400">
                      {getTimelineIcon(ev.type)}
                    </div>
                    <p className="text-[8px] font-mono text-white/70 uppercase mb-0.5">{formatDate(ev.date)}</p>
                    <p className="text-xs font-bold text-white/90 mb-0.5">{ev.title}</p>
                    <p className="text-[10px] text-white/70 leading-relaxed font-sans">{ev.description}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

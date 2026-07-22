'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PageHeaderUpdater } from '@/components/layout/page-context';
import { 
  ArrowLeft, FileText, CheckCircle, XCircle, RefreshCcw, Send, Trash2, 
  DollarSign, Calendar, Anchor, Clock, Layers, Globe, User, TrendingUp, 
  Activity, MapPin, FileDown, ExternalLink, MessageSquare, Building, Save, X
} from 'lucide-react';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Quotation, Customer, Product, Port } from '@/types';
import { QuotationMetadataCard } from '@/components/sales/quotation-metadata-card';
import { LineItemsTable } from '@/components/sales/line-items-table';

export default function QuotationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [ports, setPorts] = useState<Port[]>([]);
  const [taxes, setTaxes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [communicationNote, setCommunicationNote] = useState('');

  // Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) fetchDetails();
  }, [id]);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const qRes = await fetch(`/api/quotations/${id}`);
      if (!qRes.ok) throw new Error('Quotation profile not found');
      const qData = await qRes.json();
      setQuotation(qData);

      const cRes = await fetch(`/api/customers/${qData.customerId}`);
      if (cRes.ok) {
        const cData = await cRes.json();
        setCustomer(cData);
      }

      const [pRes, tRes] = await Promise.all([
        fetch('/api/products').then(r => r.json()),
        fetch('/api/reference/taxes').then(r => r.json())
      ]);
      setProducts(pRes);
      setTaxes(tRes);
      
      setPorts([
        { id: 'TYO', name: 'Tokyo Port', code: 'JP TYO', country: 'Japan', type: 'SEA', entityStatus: 'ACTIVE', createdAt: '', updatedAt: '' },
        { id: 'OSA', name: 'Osaka Port', code: 'JP OSA', country: 'Japan', type: 'SEA', entityStatus: 'ACTIVE', createdAt: '', updatedAt: '' },
        { id: 'LAX', name: 'Los Angeles Port', code: 'US LAX', country: 'USA', type: 'SEA', entityStatus: 'ACTIVE', createdAt: '', updatedAt: '' },
        { id: 'SIN', name: 'Singapore Port', code: 'SG SIN', country: 'Singapore', type: 'SEA', entityStatus: 'ACTIVE', createdAt: '', updatedAt: '' }
      ]);
    } catch (e: any) {
      toast.error(e.message || 'Failed loading proposal details');
      router.push('/quotations');
    } finally {
      setLoading(false);
    }
  };

  const updateFormState = (field: string, value: any) => {
    setFormState((prev: any) => ({ ...prev, [field]: value }));
  };

  const updateItem = (idx: number, field: string, value: any) => {
    setFormState((prev: any) => {
      const newItems = [...prev.items];
      const item = { ...newItems[idx], [field]: value };
      
      if (field === 'variantId') {
        let sellingPrice = 0;
        for (const p of products) {
          const v = p.variants?.find((v: any) => v.id === value);
          if (v) {
            item.productId = p.id;
            item.name = p.name;
            item.sku = v.sku;
            item.uom = p.uom || 'MT';
            sellingPrice = v.sellingPrice || p.sellingPrice || 0;
            break;
          }
        }
        
        const margin = prev.marginPercentage || 0;
        const factor = margin > 0 ? 1 - (margin / 100) : 1;
        
        item.basePrice = sellingPrice; 
        item.unitPrice = factor > 0 ? Number((item.basePrice / factor).toFixed(2)) : item.basePrice;
        
        // Auto-assign sales tax from variant
        const variant = products.find((p: any) => p.id === item.productId)?.variants?.find((v: any) => v.id === value);
        if (variant && variant.salesTaxId) {
          item.taxId = variant.salesTaxId;
        }
      }
      
      if (field === 'quantity') {
        item.total = (item.quantity || 0) * (item.unitPrice || 0);
      }
      
      if (field === 'unitPrice') {
        const margin = prev.marginPercentage || 0;
        const factor = margin > 0 ? 1 - (margin / 100) : 1;
        item.basePrice = factor > 0 ? Number((value * factor).toFixed(2)) : value;
      }
      
      newItems[idx] = item;
      return { ...prev, items: newItems };
    });
  };

  const removeItem = (idx: number) => {
    setFormState((prev: any) => {
      const newItems = [...prev.items];
      newItems.splice(idx, 1);
      return { ...prev, items: newItems };
    });
  };

  const addItem = () => {
    setFormState((prev: any) => ({
      ...prev,
      items: [...prev.items, { variantId: '', productId: '', quantity: 1, unitPrice: 0, total: 0, uom: 'MT' }]
    }));
  };

  const computedItems = useMemo(() => {
    return (formState.items || []).map((item: any) => {
      const tax = taxes.find(t => t.id === item.taxId);
      const qty = item.quantity || 0;
      const price = item.unitPrice || 0;
      
      let untaxed = price;
      let taxAmount = 0;
      
      if (tax) {
        if (tax.includedInPrice) {
          untaxed = price / (1 + (tax.ratePercentage / 100));
          taxAmount = price - untaxed;
        } else {
          taxAmount = price * (tax.ratePercentage / 100);
        }
      }
      
      return {
        ...item,
        taxAmount: Number((taxAmount * qty).toFixed(2)),
        taxRate: tax?.ratePercentage || 0,
        totalPrice: Number(((untaxed + taxAmount) * qty).toFixed(2)),
        untaxedTotal: Number((untaxed * qty).toFixed(2))
      };
    });
  }, [formState.items, taxes]);

  const untaxedAmount = computedItems.reduce((sum: number, item: any) => sum + (item.untaxedTotal || 0), 0);
  const totalTaxAmount = computedItems.reduce((sum: number, item: any) => sum + (item.taxAmount || 0), 0);
  const totalValue = computedItems.reduce((sum: number, item: any) => sum + (item.totalPrice || 0), 0);
  
  const costOfGoods = (formState.items || []).reduce((sum: number, item: any) => sum + ((item.basePrice || 0) * (item.quantity || 0)), 0);
  const grossProfit = untaxedAmount - costOfGoods;

  const handleEditToggle = () => {
    if (!isEditing) {
      setFormState({
        originPortId: quotation?.originPortId || 'TYO',
        destinationPortId: quotation?.destinationPortId || 'LAX',
        incoterm: quotation?.incoterm || 'FOB',
        containerType: quotation?.containerType || '20GP',
        paymentTerms: quotation?.paymentTerms || '30 Days Net',
        currency: quotation?.currency || 'USD',
        remarks: quotation?.remarks || '',
        marginPercentage: quotation?.marginPercentage || 25,
        validityDays: quotation?.validityDate && quotation?.date 
            ? Math.max(1, Math.round((new Date(quotation.validityDate).getTime() - new Date(quotation.date).getTime()) / 86400000))
            : 30,
        items: quotation?.items?.map((i: any) => {
          const margin = quotation?.marginPercentage || 0;
          const factor = margin > 0 ? 1 - (margin / 100) : 1;
          const basePrice = factor > 0 ? Number((i.unitPrice * factor).toFixed(2)) : i.unitPrice;
          return {
            ...i,
            name: products.find(p => p.id === i.productId)?.name || '',
            sku: products.find(p => p.id === i.productId)?.sku || '',
            uom: products.find(p => p.id === i.productId)?.uom || 'MT',
            basePrice
          };
        }) || []
      });
    }
    setIsEditing(!isEditing);
  };

  const handleMarginChange = (margin: number) => {
    const factor = margin > 0 ? 1 - (margin / 100) : 1;
    const newItems = (formState.items || []).map((item: any) => {
      const base = item.basePrice || item.unitPrice;
      const newPrice = factor > 0 ? Number((base / factor).toFixed(2)) : base;
      return { ...item, unitPrice: newPrice };
    });
    setFormState({ ...formState, marginPercentage: margin, items: newItems });
  };

  const handleSaveEdit = async () => {
    if (!quotation) return;
    setSaving(true);
    try {
      const finalItems = computedItems.map((item: any) => ({
        variantId: item.variantId,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxId: item.taxId || null,
        taxRate: item.taxRate || 0,
        taxAmount: item.taxAmount || 0,
        totalPrice: item.totalPrice || 0
      }));

      const payload = {
        ...quotation,
        ...formState,
        validityDate: new Date(Date.now() + (formState.validityDays || 30) * 86400000).toISOString(),
        totalValue,
        untaxedAmount,
        totalTaxAmount,
        items: finalItems
      };
      delete payload.validityDays;

      const res = await fetch(`/api/quotations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update quotation');
      
      toast.success('Quotation updated successfully');
      setQuotation(data);
      setIsEditing(false);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const getProductName = (prodId: string) => {
    const prod = products.find(p => p.id === prodId);
    return prod ? `${prod.name} (${prod.sku})` : prodId;
  };

  const getPortName = (portId: string) => {
    const port = ports.find(p => p.id === portId);
    return port ? `${port.name} (${port.code})` : portId;
  };

  const handleApprove = async () => {
    try {
      const res = await fetch(`/api/quotations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Approval failed');

      toast.success(data.message || 'Proposal approved! Workflows triggered.');
      await fetchDetails();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleReject = async () => {
    try {
      const res = await fetch(`/api/quotations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' })
      });
      if (!res.ok) throw new Error('Rejection failed');
      toast.success('Proposal status updated to REJECTED');
      await fetchDetails();
    } catch (e) { toast.error('Failed to reject proposal'); }
  };

  const handleSend = async () => {
    try {
      const res = await fetch(`/api/quotations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send' })
      });
      if (!res.ok) throw new Error('Sending failed');
      toast.success('Proposal sent to customer contact');
      await fetchDetails();
    } catch (e) { toast.error('Failed to dispatch proposal'); }
  };

  const handleRevise = async () => {
    try {
      const res = await fetch(`/api/quotations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revise' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Revision failed');
      
      toast.success(`Generated revised version draft: ${data.quotationNo} (v${data.version}.0)`);
      router.push(`/quotations/${data.id}`);
    } catch (e: any) { toast.error(e.message || 'Revision failed'); }
  };

  const handleSaveNote = async () => {
    if (!communicationNote.trim() || !quotation) return;

    const timelineEvent = {
      id: `EV-${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString(),
      type: 'COMMUNICATION_LOGGED' as const,
      title: 'Negotiation Note Saved',
      description: communicationNote.trim(),
      userId: 'USR-001'
    };

    const updatedTimeline = [timelineEvent, ...(Array.isArray(quotation.timeline) ? quotation.timeline : [])];

    try {
      const res = await fetch(`/api/quotations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'log_note', timeline: updatedTimeline })
      });
      if (!res.ok) throw new Error('Note logger failed');
      const updated = await res.json();
      
      toast.success('Negotiation log note recorded');
      setCommunicationNote('');
      setQuotation(updated);
    } catch (e) { toast.error('Failed to log note'); }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to soft-delete this proposal?')) {
      try {
        const res = await fetch(`/api/quotations/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Delete failed');
        toast.success('Proposal soft-deleted');
        router.push('/quotations');
      } catch (e) { toast.error('Failed to delete quotation'); }
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'REJECTED': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'SENT': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'DRAFT': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'REVISED': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'EXPIRED': return 'text-white/80 bg-white/5 border-white/10';
      default: return 'text-white/70 bg-white/5';
    }
  };

  const variantOptions = products.flatMap(p => 
    (p.variants || []).map(v => ({
      value: v.id,
      label: `${p.name} - ${v.sku}`,
      description: `Stock: ${v.inventory || 0} ${p.uom}`
    }))
  );

  if (!quotation) return null;

  return (
    <>
      <PageHeaderUpdater title={quotation.quotationNo} subtitle={`Commercial proposal version v${quotation.version || 1}.0`} />
      <div className="space-y-8">
        
        {/* Top bar control actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button onClick={() => router.push('/quotations')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-mono uppercase text-white/90 hover:bg-white/10 hover:text-white cursor-pointer">
            <ArrowLeft size={12} /> Back to vault
          </button>

          {isEditing ? (
            <div className="flex items-center gap-3">
              <button onClick={handleEditToggle} disabled={saving} className="flex items-center gap-1.5 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer">
                <X size={12} /> Discard
              </button>
              <button onClick={handleSaveEdit} disabled={saving} className="flex items-center gap-1.5 px-6 py-3 bg-blue-500 text-black hover:bg-blue-400 rounded-2xl text-[10px] font-mono font-bold uppercase tracking-widest transition-all border-none cursor-pointer">
                <Save size={12} /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2.5">
              <button onClick={handleDelete} className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-white/70 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer" title="Soft delete proposal">
                <Trash2 size={14} />
              </button>

              {quotation.status === 'DRAFT' && (
                <button onClick={handleEditToggle} className="flex items-center gap-1.5 px-5 py-3 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/25 rounded-2xl text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer">
                  <FileText size={12} /> Edit Proposal
                </button>
              )}

              {quotation.status !== 'APPROVED' && quotation.status !== 'REVISED' && (
                <button onClick={handleRevise} className="flex items-center gap-1.5 px-5 py-3 border border-[#9b5de5]/30 bg-[#9b5de5]/10 text-[#9b5de5] hover:bg-[#9b5de5]/25 rounded-2xl text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer">
                  <RefreshCcw size={12} /> Revise Version
                </button>
              )}

              {quotation.status === 'DRAFT' && (
                <button onClick={handleSend} className="flex items-center gap-1.5 px-5 py-3 border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/25 rounded-2xl text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer">
                  <Send size={12} /> Send Proposal
                </button>
              )}

              {(quotation.status === 'SENT' || quotation.status === 'DRAFT') && (
                <button onClick={handleReject} className="flex items-center gap-1.5 px-5 py-3 border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/25 rounded-2xl text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer">
                  <XCircle size={12} /> Reject Proposal
                </button>
              )}

              {(quotation.status === 'SENT' || quotation.status === 'DRAFT') && (
                <button onClick={handleApprove} className="flex items-center gap-1.5 px-6 py-3 bg-emerald-500 text-black hover:bg-emerald-400 rounded-2xl text-[10px] font-mono font-bold uppercase tracking-widest transition-all border-none cursor-pointer">
                  <CheckCircle size={12} /> Approve & Convert SO
                </button>
              )}

              <a href={`/documents/quotation/${id}`} target="_blank" className="flex items-center gap-1.5 px-5 py-3 border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/25 rounded-2xl text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer no-underline">
                Print / PDF
              </a>
            </div>
          )}
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <div className="lg:col-span-4 space-y-6">
            <QuotationMetadataCard 
              isEditing={isEditing}
              quotation={quotation}
              formState={formState}
              onChange={updateFormState}
              getStatusStyle={getStatusBadgeColor}
              ports={ports}
            />

            {/* Remarks in Edit Mode */}
            {isEditing && (
              <div className="glass p-8 rounded-4xl border border-white/5 space-y-3">
                <label className="text-[10px] font-mono text-white/70 uppercase tracking-widest">Remarks</label>
                <textarea 
                  value={formState.remarks || ''} onChange={e => updateFormState('remarks', e.target.value)}
                  placeholder="Special clauses..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/90 outline-none focus:border-blue-500/50 transition-all h-32 resize-none"
                />
              </div>
            )}

            {/* Customer CRM Profile Card */}
            {customer && !isEditing && (
              <div className="glass p-8 rounded-4xl border border-white/5 space-y-6">
                <h4 className="text-[10px] font-mono text-white/70 uppercase tracking-widest pb-4 border-b border-white/5 flex items-center gap-2">
                  <User size={14} className="text-blue-400" /> Customer CRM Node
                </h4>
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/80">
                    <Building size={20} />
                  </div>
                  <div className="flex-1 min-w-0 font-mono">
                    <h5 className="font-sans font-bold text-sm text-white/90 truncate">{customer.name}</h5>
                    <p className="text-[9px] text-white/80 uppercase mt-0.5">{customer.segment} CLIENT • {customer.country}</p>
                    <p className="text-[10px] text-blue-400 truncate mt-2">{customer.email}</p>
                    <p className="text-[10px] text-white/70 truncate">{customer.phone}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Document Vault PDF Reference */}
            {!isEditing && (
              <div className="glass p-8 rounded-4xl border border-white/5 space-y-4">
                <h4 className="text-[10px] font-mono text-white/70 uppercase tracking-widest pb-2 border-b border-white/5">
                  Proposal Vault Documents
                </h4>
                {(Array.isArray(quotation.documents) ? quotation.documents : []).length > 0 ? (
                  (Array.isArray(quotation.documents) ? quotation.documents : []).map(doc => (
                    <div key={doc.id} className="flex justify-between items-center p-3.5 bg-white/2 border border-white/5 rounded-xl text-[11px] font-mono">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-blue-400" />
                        <span className="text-white/80 font-bold truncate max-w-37.5">{doc.name}</span>
                      </div>
                      <a href={doc.url} className="text-white/80 hover:text-white transition-colors" title="Download Vault PDF">
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-4 text-white/10 text-[9px] uppercase font-mono">No Vault documents generated</p>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-8 space-y-8">
            {isEditing ? (
              <LineItemsTable 
                isEditing={isEditing}
                items={isEditing ? computedItems : quotation.items}
                updateItem={updateItem}
                removeItem={removeItem}
                addItem={addItem}
                products={products}
                formatCurrency={formatCurrency}
                getProductName={getProductName}
                marginPercentage={formState.marginPercentage || 0}
                setMarginPercentage={handleMarginChange}
                costOfGoods={costOfGoods}
                grossProfit={grossProfit}
                totalValue={totalValue}
                untaxedAmount={untaxedAmount}
                totalTaxAmount={totalTaxAmount}
                taxes={taxes}
              />
            ) : (
              <div className="glass p-8 rounded-4xl border border-white/5 space-y-6">
                <h3 className="text-sm font-mono text-white/70 uppercase tracking-widest flex items-center gap-2 pb-4 border-b border-white/5">
                  <Layers size={14} className="text-blue-400" /> Itemized Commodities List
                </h3>
                
                <div className="overflow-x-auto font-mono">
                  <table className="w-full text-left text-xs">
                    <thead className="text-white/70 uppercase tracking-wider border-b border-white/5">
                      <tr>
                        <th className="pb-4">Commodity SKU</th>
                        <th className="pb-4 text-right">Quantity</th>
                        <th className="pb-4 text-right">Unit Price</th>
                        <th className="pb-4 text-right">Tax</th>
                        <th className="pb-4 text-right">Total Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {quotation.items.map((item, idx) => (
                        <tr key={idx} className="text-white/80">
                          <td className="py-4">
                            <p className="font-sans font-bold text-white/95">
                              {item.variant ? `${item.variant.product?.name || item.variant.title} (${item.variant.sku})` : getProductName(item.productId || item.variantId || '')}
                            </p>
                          </td>
                          <td className="py-4 text-right font-bold">{item.quantity} MT</td>
                          <td className="py-4 text-right font-bold">{formatCurrency(item.unitPrice)}</td>
                          <td className="py-4 text-right font-bold text-white/70">
                            {item.tax ? item.tax.name : (item.taxId ? (taxes.find(t => t.id === item.taxId)?.name || 'Tax') : '-')}
                            {item.taxAmount ? ` (${formatCurrency(item.taxAmount)})` : ''}
                          </td>
                          <td className="py-4 text-right font-bold text-white">{formatCurrency(item.totalPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="border-t border-white/5 pt-6 flex justify-end font-mono text-xs">
                  <div className="w-full max-w-sm space-y-2.5">
                    <div className="flex justify-between text-white/70">
                      <span>Proposed Margin Percentage</span>
                      <span>{quotation.marginPercentage || 0}%</span>
                    </div>
                    <div className="flex justify-between text-white/70 pt-2">
                      <span>Untaxed Amount</span>
                      <span className="font-bold text-white">{formatCurrency(quotation.untaxedAmount || 0)}</span>
                    </div>
                    <div className="flex justify-between text-white/70 pt-2">
                      <span>Total Tax Amount</span>
                      <span className="font-bold text-white">{formatCurrency(quotation.totalTaxAmount || 0)}</span>
                    </div>
                    <div className="h-px bg-white/5 my-3" />
                    <div className="flex justify-between text-base font-bold text-white">
                      <span>Total Proposal Value (Gross)</span>
                      <span className="text-blue-400">{formatCurrency(quotation.totalValue)}</span>
                    </div>
                  </div>
                </div>

                {quotation.remarks && (
                  <div className="mt-8 p-5 bg-white/5 rounded-2xl border border-white/10 text-xs text-white/70 font-mono">
                    <span className="font-bold text-white/90 uppercase mb-2 block">Special Clauses & Remarks</span>
                    {quotation.remarks}
                  </div>
                )}
              </div>
            )}

            {/* Negotiation / Communication Logger */}
            {!isEditing && (
              <div className="glass p-8 rounded-4xl border border-white/5 space-y-6">
                <h3 className="text-sm font-mono text-white/70 uppercase tracking-widest flex items-center gap-2 pb-4 border-b border-white/5">
                  <MessageSquare size={14} className="text-blue-400" /> Negotiation Timeline
                </h3>
                
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={communicationNote}
                    onChange={(e) => setCommunicationNote(e.target.value)}
                    placeholder="Log a call, email, or counter-offer detail..."
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/90 outline-none focus:border-blue-500/50 transition-all font-mono"
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveNote()}
                  />
                  <button 
                    onClick={handleSaveNote}
                    className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-mono uppercase text-[10px] tracking-widest rounded-xl transition-all cursor-pointer"
                  >
                    Log Note
                  </button>
                </div>

                <div className="space-y-4 pt-4">
                  {(Array.isArray(quotation.timeline) ? quotation.timeline : []).map((event: any, i: number) => (
                    <div key={event.id || i} className="flex gap-4 p-4 rounded-2xl bg-white/2 border border-white/5">
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                        <User size={12} className="text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0 font-mono">
                        <div className="flex justify-between items-start mb-1">
                          <h5 className="font-bold text-xs text-white/90">{event.title}</h5>
                          <span className="text-[9px] text-white/50 whitespace-nowrap ml-4">
                            {new Date(event.date).toLocaleDateString()} {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[10px] text-white/70">{event.description}</p>
                      </div>
                    </div>
                  ))}
                  {(Array.isArray(quotation.timeline) ? quotation.timeline : []).length === 0 && (
                    <p className="text-center py-6 text-[10px] uppercase font-mono text-white/20 border border-dashed border-white/10 rounded-2xl">
                      No negotiation history logged
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PageHeaderUpdater } from '@/components/layout/page-context';
import { 
  ArrowLeft, 
  FileText, 
  CheckCircle, 
  XCircle, 
  RefreshCcw, 
  Send, 
  Trash2, 
  DollarSign, 
  Calendar, 
  Anchor, 
  Clock, 
  Layers, 
  Globe, 
  User, 
  TrendingUp, 
  Activity, 
  MapPin, 
  FileDown, 
  ExternalLink,
  MessageSquare,
  Building
} from 'lucide-react';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Quotation, Customer, Product, Port } from '@/types';

export default function QuotationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  // States
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [ports, setPorts] = useState<Port[]>([]);
  const [loading, setLoading] = useState(true);

  // Note logging form
  const [communicationNote, setCommunicationNote] = useState('');

  useEffect(() => {
    if (id) {
      fetchDetails();
    }
  }, [id]);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const qRes = await fetch(`/api/quotations/${id}`);
      if (!qRes.ok) throw new Error('Quotation profile not found');
      const qData = await qRes.json();
      setQuotation(qData);

      // Fetch customer
      const cRes = await fetch(`/api/customers/${qData.customerId}`);
      if (cRes.ok) {
        const cData = await cRes.json();
        setCustomer(cData);
      }

      // Fetch products and ports
      const [pRes] = await Promise.all([
        fetch('/api/products').then(r => r.json())
      ]);
      setProducts(pRes);
      
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

  const getProductName = (prodId: string) => {
    const prod = products.find(p => p.id === prodId);
    return prod ? `${prod.name} (${prod.sku})` : prodId;
  };

  const getPortName = (portId: string) => {
    const port = ports.find(p => p.id === portId);
    return port ? `${port.name} (${port.code})` : portId;
  };

  // Actions
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
    } catch (e: any) {
      toast.error(e.message);
    }
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
    } catch (e) {
      toast.error('Failed to reject proposal');
    }
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
    } catch (e) {
      toast.error('Failed to dispatch proposal');
    }
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
    } catch (e: any) {
      toast.error(e.message || 'Revision failed');
    }
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
        body: JSON.stringify({ timeline: updatedTimeline })
      });
      if (!res.ok) throw new Error('Note logger failed');
      const updated = await res.json();
      
      toast.success('Negotiation log note recorded');
      setCommunicationNote('');
      setQuotation(updated);
    } catch (e) {
      toast.error('Failed to log note');
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to soft-delete this proposal?')) {
      try {
        const res = await fetch(`/api/quotations/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Delete failed');
        toast.success('Proposal soft-deleted');
        router.push('/quotations');
      } catch (e) {
        toast.error('Failed to delete quotation');
      }
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

  if (!quotation) return null;

  return (
    <>
      <PageHeaderUpdater title={quotation.quotationNo} subtitle={`Commercial proposal version v${quotation.version || 1}.0`} />
      <div className="space-y-8">
        {/* Top bar control actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button 
            onClick={() => router.push('/quotations')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-mono uppercase text-white/90 hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <ArrowLeft size={12} /> Back to vault
          </button>

          {/* Workflow operations buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Soft Delete */}
            <button 
              onClick={handleDelete}
              className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-white/70 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
              title="Soft delete proposal"
            >
              <Trash2 size={14} />
            </button>

            {/* Revise version */}
            {quotation.status !== 'APPROVED' && quotation.status !== 'REVISED' && (
              <button 
                onClick={handleRevise}
                className="flex items-center gap-1.5 px-5 py-3 border border-[#9b5de5]/30 bg-[#9b5de5]/10 text-[#9b5de5] hover:bg-[#9b5de5]/25 rounded-2xl text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer"
              >
                <RefreshCcw size={12} /> Revise Version
              </button>
            )}

            {/* Send to client */}
            {quotation.status === 'DRAFT' && (
              <button 
                onClick={handleSend}
                className="flex items-center gap-1.5 px-5 py-3 border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/25 rounded-2xl text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer"
              >
                <Send size={12} /> Send Proposal
              </button>
            )}

            {/* Reject */}
            {(quotation.status === 'SENT' || quotation.status === 'DRAFT') && (
              <button 
                onClick={handleReject}
                className="flex items-center gap-1.5 px-5 py-3 border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/25 rounded-2xl text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer"
              >
                <XCircle size={12} /> Reject Proposal
              </button>
            )}

            {/* Approve (Convert to SO) */}
            {(quotation.status === 'SENT' || quotation.status === 'DRAFT') && (
              <button 
                onClick={handleApprove}
                className="flex items-center gap-1.5 px-6 py-3 bg-emerald-500 text-black hover:bg-emerald-400 rounded-2xl text-[10px] font-mono font-bold uppercase tracking-widest transition-all border-none cursor-pointer"
              >
                <CheckCircle size={12} /> Approve & Convert SO
              </button>
            )}

            {/* Print / PDF Document */}
            <a 
              href={`/documents/quotation/${id}`}
              target="_blank"
              className="flex items-center gap-1.5 px-5 py-3 border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/25 rounded-2xl text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer no-underline"
            >
              Print / PDF
            </a>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left panel: Customer profile & shipping parameters */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Incoterms & Status Card */}
            <div className="glass p-8 rounded-4xl border border-white/5 space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-white/5">
                <span className="text-[10px] font-mono text-white/70 uppercase tracking-widest">Proposal Status</span>
                <span className={cn("px-3 py-1 rounded text-[9px] font-mono font-bold uppercase border", getStatusBadgeColor(quotation.status))}>
                  {quotation.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <p className="text-[9px] text-white/70 uppercase mb-1">Incoterm Rule</p>
                  <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 font-bold text-white/80">{quotation.incoterm}</span>
                </div>
                <div>
                  <p className="text-[9px] text-white/70 uppercase mb-1">Exchange Rate</p>
                  <p className="font-bold text-white/80">1 {quotation.currency} = {quotation.exchangeRate}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <p className="text-[9px] text-white/70 uppercase mb-1">Origin Port</p>
                  <p className="font-bold text-white/80 truncate">{getPortName(quotation.originPortId)}</p>
                </div>
                <div>
                  <p className="text-[9px] text-white/70 uppercase mb-1">Discharge Port</p>
                  <p className="font-bold text-white/80 truncate">{getPortName(quotation.destinationPortId)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <p className="text-[9px] text-white/70 uppercase mb-1">Container Spec</p>
                  <p className="font-bold text-white/80">{quotation.containerType}</p>
                </div>
                <div>
                  <p className="text-[9px] text-white/70 uppercase mb-1">Payment terms</p>
                  <p className="font-bold text-white/80">{quotation.paymentTerms}</p>
                </div>
              </div>

              <div className="text-xs font-mono space-y-1">
                <p className="text-[9px] text-white/70 uppercase">Validity expiry date</p>
                <p className="font-bold text-white/80 flex items-center gap-1.5"><Calendar size={12} className="text-blue-400" /> {formatDate(quotation.validityDate)}</p>
              </div>
            </div>

            {/* Customer CRM Profile Card */}
            {customer && (
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
            <div className="glass p-8 rounded-4xl border border-white/5 space-y-4">
              <h4 className="text-[10px] font-mono text-white/70 uppercase tracking-widest pb-2 border-b border-white/5">
                Proposal Vault Documents
              </h4>
              {(Array.isArray(quotation.documents) ? quotation.documents : []).length > 0 ? (
                (Array.isArray(quotation.documents) ? quotation.documents : []).map(doc => (
                  <div key={doc.id} className="flex justify-between items-center p-3.5 bg-white/2 border border-white/5 rounded-xl text-[11px] font-mono">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-blue-400" />
                      <span className="text-white/80 font-bold truncate max-w-[150px]">{doc.name}</span>
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

          </div>

          {/* Right panel: Line items table & cost sheet ledger & timelines */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Commodity Grid */}
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
                      <th className="pb-4 text-right">Selling Price</th>
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
                        <td className="py-4 text-right font-bold text-white">{formatCurrency(item.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Summary Cost Sheet */}
              <div className="border-t border-white/5 pt-6 flex justify-end font-mono text-xs">
                <div className="w-full max-w-sm space-y-2.5">
                  <div className="flex justify-between text-white/70">
                    <span>Proposed Margin Percentage</span>
                    <span>{quotation.marginPercentage}%</span>
                  </div>
                  <div className="h-px bg-white/5 my-1" />
                  <div className="flex justify-between text-base font-bold text-white">
                    <span>Total Proposal Value</span>
                    <span className="text-blue-400 font-sans text-lg">{formatCurrency(quotation.totalValue)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Remarks */}
            {quotation.remarks && (
              <div className="glass p-8 rounded-4xl border border-white/5 space-y-3">
                <h4 className="text-[10px] font-mono text-white/70 uppercase tracking-widest pb-2 border-b border-white/5">
                  Negotiation Remarks / Special Clauses
                </h4>
                <p className="text-[11px] font-mono text-white/70 whitespace-pre-wrap leading-relaxed">{quotation.remarks}</p>
              </div>
            )}

            {/* Timelines and Negotiation logs */}
            <div className="glass p-8 rounded-4xl border border-white/5 space-y-6">
              <h3 className="text-sm font-mono text-white/70 uppercase tracking-widest flex items-center gap-2 pb-4 border-b border-white/5">
                <Activity size={14} className="text-blue-400" /> Timeline & Negotiation Notes
              </h3>

              {/* Live communication logger */}
              <div className="p-4 rounded-2xl bg-white/2 border border-white/5 space-y-3">
                <p className="text-[8px] font-mono text-white/70 uppercase tracking-wider">Log Negotiation Milestone Note</p>
                <textarea
                  value={communicationNote}
                  onChange={(e) => setCommunicationNote(e.target.value)}
                  placeholder="Record pricing concessions, volume discount approvals, or custom inspection agreements..."
                  className="w-full bg-[#070707] border border-white/10 rounded-xl p-3 text-[11px] font-mono text-white focus:outline-none focus:border-blue-500/50 min-h-[60px]"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveNote}
                    disabled={!communicationNote.trim()}
                    className="px-4 py-2 bg-blue-500 text-black text-[9px] font-mono font-bold uppercase rounded-lg hover:bg-blue-400 disabled:opacity-40 disabled:hover:bg-blue-500 border-none cursor-pointer"
                  >
                    Save Log Note
                  </button>
                </div>
              </div>

              {/* Timeline List */}
              <div className="max-h-[250px] overflow-y-auto custom-scrollbar pr-2 space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-white/5">
                {(Array.isArray(quotation.timeline) ? quotation.timeline : []).map((item, idx) => (
                  <div key={item.id || idx} className="relative pl-8">
                    <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-[#0a0a0a] border border-white/15 flex items-center justify-center z-10 text-blue-400">
                      {item.type === 'CREATED' && <FileText size={10} />}
                      {item.type === 'UPDATED' && <FileText size={10} />}
                      {item.type === 'SENT' && <Send size={10} />}
                      {item.type === 'REVISED' && <RefreshCcw size={10} />}
                      {item.type === 'APPROVED' && <CheckCircle size={10} className="text-emerald-400" />}
                      {item.type === 'REJECTED' && <XCircle size={10} className="text-rose-400" />}
                      {item.type === 'STATUS_CHANGED' && <Activity size={10} />}
                      {item.type === 'COMMUNICATION_LOGGED' && <MessageSquare size={10} />}
                    </div>
                    <p className="text-[8px] font-mono text-white/70 uppercase mb-0.5">{formatDate(item.date)}</p>
                    <p className="text-xs font-bold text-white/90 mb-0.5">{item.title}</p>
                    <p className="text-[10px] text-white/70 leading-relaxed font-sans">{item.description}</p>
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

'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MasterPage } from '@/components/layout/master-page';
import {
  ArrowLeft, FileText, Ship, Box, CheckCircle2, XCircle, Play,
  PackageCheck, Copy, Trash2, DollarSign, Calendar, Anchor,
  User, Building, Activity, MessageSquare, ExternalLink, AlertCircle
} from 'lucide-react';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';
import { SalesOrder, Customer, Product } from '@/types';

const STATUS_FLOW = ['CONFIRMED', 'PRODUCTION', 'READY', 'SHIPPED'] as const;

export default function SalesOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [order, setOrder] = useState<SalesOrder | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sales-orders/${id}`);
      if (!res.ok) throw new Error('Sales order not found');
      const orderData: SalesOrder = await res.json();
      setOrder(orderData);

      const [cRes, pRes] = await Promise.all([
        fetch(`/api/customers/${orderData.customerId}`).then(r => r.ok ? r.json() : null),
        fetch('/api/products').then(r => r.json())
      ]);
      setCustomer(cRes);
      setProducts(pRes);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load order');
      router.push('/sales-orders');
    } finally {
      setLoading(false);
    }
  };

  const performAction = async (action: string, extra?: Record<string, any>) => {
    const res = await fetch(`/api/sales-orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...extra })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Action failed');
    return data;
  };

  const handleBookShipment = async () => {
    try {
      const data = await performAction('book_shipment');
      toast.success(`Shipment ${data.shipment?.shipmentNo} booked!`);
      if (data.shipment?.id) router.push(`/shipments/${data.shipment.id}`);
      else await fetchData();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleConfirm = async () => {
    try { await performAction('confirm'); toast.success('Order confirmed'); await fetchData(); }
    catch (e: any) { toast.error(e.message); }
  };

  const handleStartProduction = async () => {
    try { await performAction('start_production'); toast.success('Production started'); await fetchData(); }
    catch (e: any) { toast.error(e.message); }
  };

  const handleMarkReady = async () => {
    try { await performAction('mark_ready'); toast.success('Cargo marked ready'); await fetchData(); }
    catch (e: any) { toast.error(e.message); }
  };

  const handleCancel = async () => {
    if (!confirm('Cancel this sales order?')) return;
    try { await performAction('cancel'); toast.success('Order cancelled'); await fetchData(); }
    catch (e: any) { toast.error(e.message); }
  };

  const handleGenerateDocument = async (type: 'Commercial Invoice' | 'Packing List') => {
    if (!order) return;
    try {
      const prefix = type === 'Commercial Invoice' ? 'INV' : 'PL';
      const docNo = `${prefix}-${order.orderNo.split('-').pop()}`;
      await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${type} #${docNo}`, type, url: '#', size: '1.2 MB',
          status: 'SIGNED', relatedId: order.id, relatedType: 'SALES_ORDER',
          shipper: 'ExLogis Industrial Solutions', consignee: customer?.name || order.customerId,
          items: order.items, totalValue: order.totalValue,
          currency: order.currency || 'USD', incoterm: order.incoterm || 'FOB',
          paymentTerms: order.paymentTerms || '30 Days Net',
          containerType: order.containerType || '20GP', entityStatus: 'ACTIVE'
        })
      });
      toast.success(`${type} generated: ${docNo}`);
    } catch { toast.error('Document generation failed'); }
  };

  const handleSaveNote = async () => {
    if (!noteText.trim()) return;
    try {
      const updated = await performAction('add_note', { note: noteText.trim() });
      setOrder(updated);
      setNoteText('');
      toast.success('Note logged to timeline');
    } catch (e: any) { toast.error(e.message); }
  };

  const handleDelete = async () => {
    if (!confirm('Soft-delete this order?')) return;
    const res = await fetch(`/api/sales-orders/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Order soft-deleted'); router.push('/sales-orders'); }
    else toast.error('Delete failed');
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'PRODUCTION': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'READY': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'SHIPPED': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
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
      case 'CONFIRMED': return <CheckCircle2 size={10} className="text-blue-400" />;
      case 'PRODUCTION_STARTED': return <Play size={10} className="text-amber-400" />;
      case 'READY_FOR_SHIPMENT': return <PackageCheck size={10} className="text-purple-400" />;
      case 'SHIPPED': return <Ship size={10} className="text-emerald-400" />;
      case 'CANCELLED': return <XCircle size={10} className="text-rose-400" />;
      case 'NOTE_ADDED': return <MessageSquare size={10} />;
      default: return <Activity size={10} />;
    }
  };

  if (!order) return null;

  const statusIdx = STATUS_FLOW.indexOf(order.status as any);

  return (
    <MasterPage title={order.orderNo} subtitle="Export Contract — Fulfilment Dashboard" loading={loading}>
      <div className="space-y-8">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button onClick={() => router.push('/sales-orders')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-mono uppercase text-white/90 hover:bg-white/10 cursor-pointer">
            <ArrowLeft size={12} /> Back to registry
          </button>

          <div className="flex flex-wrap items-center gap-2.5">
            <button onClick={handleDelete} className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-white/70 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer" title="Soft delete">
              <Trash2 size={14} />
            </button>
            <button onClick={() => handleGenerateDocument('Packing List')}
              className="flex items-center gap-1.5 px-5 py-3 border border-white/10 bg-white/5 text-white/90 hover:bg-white/10 rounded-2xl text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer">
              <Box size={12} /> Packing List
            </button>
            <button onClick={() => handleGenerateDocument('Commercial Invoice')}
              className="flex items-center gap-1.5 px-5 py-3 border border-white/10 bg-white/5 text-white/90 hover:bg-white/10 rounded-2xl text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer">
              <FileText size={12} /> Invoice
            </button>

            {order.status === 'CONFIRMED' && (
              <button onClick={handleStartProduction}
                className="flex items-center gap-1.5 px-5 py-3 border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 rounded-2xl text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer">
                <Play size={12} /> Start Production
              </button>
            )}
            {order.status === 'PRODUCTION' && (
              <button onClick={handleMarkReady}
                className="flex items-center gap-1.5 px-5 py-3 border border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 rounded-2xl text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer">
                <PackageCheck size={12} /> Mark Ready
              </button>
            )}
            {order.status !== 'SHIPPED' && order.status !== 'CANCELLED' && (
              <button onClick={handleCancel}
                className="flex items-center gap-1.5 px-5 py-3 border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/25 rounded-2xl text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer">
                <XCircle size={12} /> Cancel
              </button>
            )}
            {(order.status === 'READY') && (
              <button onClick={handleBookShipment}
                className="flex items-center gap-1.5 px-6 py-3 bg-emerald-500 text-black hover:bg-emerald-400 rounded-2xl text-[10px] font-mono font-bold uppercase tracking-widest transition-all border-none cursor-pointer">
                <Ship size={12} /> Book Shipment →
              </button>
            )}
            {order.status === 'SHIPPED' && (
              <span className="px-5 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-[10px] font-mono font-bold uppercase tracking-widest">
                ✓ SHIPPED
              </span>
            )}
          </div>
        </div>

        {/* Progress pipeline stepper */}
        {order.status !== 'CANCELLED' && (
          <div className="glass p-6 rounded-3xl border border-white/5">
            <div className="flex items-center gap-2 overflow-x-auto">
              {STATUS_FLOW.map((step, i) => (
                <React.Fragment key={step}>
                  <div className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-mono uppercase tracking-widest whitespace-nowrap transition-all',
                    i < statusIdx ? 'text-white/80 bg-white/3' :
                    i === statusIdx ? 'text-black bg-blue-400 font-bold' :
                    'text-white/70 bg-white/2'
                  )}>
                    {i < statusIdx && <CheckCircle2 size={10} />}
                    {step.replace('_', ' ')}
                  </div>
                  {i < STATUS_FLOW.length - 1 && (
                    <div className={cn('h-px flex-1 min-w-[20px]', i < statusIdx ? 'bg-blue-400/30' : 'bg-white/5')} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Main Detail Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left sidebar */}
          <div className="lg:col-span-4 space-y-6">

            {/* Contract Parameters */}
            <div className="glass p-8 rounded-4xl border border-white/5 space-y-5">
              <div className="flex justify-between items-center pb-4 border-b border-white/5">
                <span className="text-[10px] font-mono text-white/70 uppercase tracking-widest">Contract Status</span>
                <span className={cn('px-3 py-1 rounded text-[9px] font-mono font-bold uppercase border', getStatusStyle(order.status))}>
                  {order.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                {[
                  ['Incoterm', order.incoterm || '—'],
                  ['Container', order.containerType || '—'],
                  ['Currency', order.currency || 'USD'],
                  ['Margin', `${order.marginPercentage || 0}%`],
                ].map(([label, val]) => (
                  <div key={label}>
                    <p className="text-[9px] text-white/70 uppercase mb-1">{label}</p>
                    <p className="font-bold text-white/80">{val}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <p className="text-[9px] text-white/70 uppercase mb-1">Order Date</p>
                  <p className="font-bold text-white/80">{formatDate(order.date)}</p>
                </div>
                <div>
                  <p className="text-[9px] text-white/70 uppercase mb-1">Expected Shipment</p>
                  <p className="font-bold text-white/80">{formatDate(order.expectedShipmentDate)}</p>
                </div>
              </div>
              <div className="text-xs font-mono">
                <p className="text-[9px] text-white/70 uppercase mb-1">Payment Terms</p>
                <p className="font-bold text-white/80">{order.paymentTerms || '—'}</p>
              </div>
              {order.quotationId && (
                <div className="pt-3 border-t border-white/5 text-xs font-mono">
                  <p className="text-[9px] text-white/70 uppercase mb-1">Source Quotation</p>
                  <Link href={`/quotations/${order.quotationId}`} className="text-blue-400 hover:underline flex items-center gap-1">
                    View Quotation <ExternalLink size={10} />
                  </Link>
                </div>
              )}
            </div>

            {/* Customer Card */}
            {customer && (
              <div className="glass p-8 rounded-4xl border border-white/5 space-y-4">
                <h4 className="text-[10px] font-mono text-white/70 uppercase tracking-widest pb-3 border-b border-white/5 flex items-center gap-2">
                  <User size={12} className="text-blue-400" /> Buyer CRM Node
                </h4>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/80">
                    <Building size={20} />
                  </div>
                  <div className="flex-1 min-w-0 font-mono">
                    <p className="font-sans font-bold text-sm text-white/90 truncate">{customer.name}</p>
                    <p className="text-[9px] text-white/80 uppercase">{customer.segment} • {customer.country}</p>
                    <p className="text-[10px] text-blue-400 truncate mt-1.5">{customer.email}</p>
                    <p className="text-[10px] text-white/70">{customer.phone}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Documents Vault */}
            <div className="glass p-8 rounded-4xl border border-white/5 space-y-4">
              <h4 className="text-[10px] font-mono text-white/70 uppercase tracking-widest pb-2 border-b border-white/5">
                Contract Documents
              </h4>
              {(order.documents || []).length > 0 ? (
                (order.documents || []).map(doc => (
                  <div key={doc.id} className="flex justify-between items-center p-3 bg-white/2 border border-white/5 rounded-xl text-[11px] font-mono">
                    <div className="flex items-center gap-2">
                      <FileText size={13} className="text-blue-400 shrink-0" />
                      <span className="text-white/80 truncate max-w-[140px]">{doc.name}</span>
                    </div>
                    <a href={doc.url} className="text-white/80 hover:text-white transition-colors shrink-0" title="Open">
                      <ExternalLink size={12} />
                    </a>
                  </div>
                ))
              ) : (
                <p className="text-center py-4 text-white/10 text-[9px] font-mono uppercase">No documents generated yet</p>
              )}
            </div>
          </div>

          {/* Right main panel */}
          <div className="lg:col-span-8 space-y-8">

            {/* Line Items table */}
            <div className="glass p-8 rounded-4xl border border-white/5 space-y-6">
              <h3 className="text-sm font-mono text-white/70 uppercase tracking-widest flex items-center gap-2 pb-4 border-b border-white/5">
                <Box size={14} className="text-blue-400" /> Itemised Cargo Manifest
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="text-white/70 uppercase tracking-wider border-b border-white/5">
                    <tr>
                      <th className="pb-4">Product SKU</th>
                      <th className="pb-4 text-right">Qty</th>
                      <th className="pb-4 text-right">Unit Price</th>
                      <th className="pb-4 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {order.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-4">
                          <p className="font-sans font-bold text-white/90">{getProductName(item.productId)}</p>
                        </td>
                        <td className="py-4 text-right text-white/90 font-bold">{item.quantity} MT</td>
                        <td className="py-4 text-right text-white/90 font-bold">{formatCurrency(item.unitPrice)}</td>
                        <td className="py-4 text-right text-white font-bold">{formatCurrency(item.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-white/5 pt-6 flex justify-end">
                <div className="w-full max-w-xs space-y-2 font-mono text-xs">
                  {order.marginPercentage && (
                    <div className="flex justify-between text-white/70">
                      <span>Margin</span><span>{order.marginPercentage}%</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base border-t border-white/5 pt-2">
                    <span className="text-white/80">Contract Value</span>
                    <span className="text-blue-400 font-sans text-lg">{formatCurrency(order.totalValue)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Remarks */}
            {order.remarks && (
              <div className="glass p-8 rounded-4xl border border-white/5 space-y-3">
                <h4 className="text-[10px] font-mono text-white/70 uppercase tracking-widest pb-2 border-b border-white/5">Special Clauses & Remarks</h4>
                <p className="text-[11px] font-mono text-white/70 whitespace-pre-wrap leading-relaxed">{order.remarks}</p>
              </div>
            )}

            {/* Timeline & Notes */}
            <div className="glass p-8 rounded-4xl border border-white/5 space-y-6">
              <h3 className="text-sm font-mono text-white/70 uppercase tracking-widest flex items-center gap-2 pb-4 border-b border-white/5">
                <Activity size={14} className="text-blue-400" /> Fulfilment Timeline
              </h3>

              {/* Note logger */}
              <div className="p-4 rounded-2xl bg-white/2 border border-white/5 space-y-3">
                <p className="text-[8px] font-mono text-white/70 uppercase tracking-wider">Log Operational Note</p>
                <textarea
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder="Record buyer communications, production updates, or shipment alerts..."
                  className="w-full bg-[#070707] border border-white/10 rounded-xl p-3 text-[11px] font-mono text-white focus:outline-none focus:border-blue-500/50 min-h-[56px]"
                />
                <div className="flex justify-end">
                  <button onClick={handleSaveNote} disabled={!noteText.trim()}
                    className="px-4 py-2 bg-blue-500 text-black text-[9px] font-mono font-bold uppercase rounded-lg hover:bg-blue-400 disabled:opacity-40 border-none cursor-pointer">
                    Save Note
                  </button>
                </div>
              </div>

              {/* Events list */}
              <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-2 space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-white/5">
                {(order.timeline || []).map((ev, idx) => (
                  <div key={ev.id || idx} className="relative pl-8">
                    <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-[#0a0a0a] border border-white/15 flex items-center justify-center z-10 text-blue-400">
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
    </MasterPage>
  );
}

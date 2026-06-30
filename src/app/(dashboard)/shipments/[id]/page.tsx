'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeaderUpdater } from '@/components/layout/page-context';
import {
  ArrowLeft, Ship, Anchor, Box, FileText, DollarSign,
  CheckCircle2, XCircle, FastForward, Trash2, Activity,
  MessageSquare, ExternalLink, Package, Building, Globe
} from 'lucide-react';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Shipment, SalesOrder } from '@/types';

const STATUS_FLOW = ['BOOKING', 'STUFFING', 'CUSTOMS', 'ON_VESSEL', 'TRANSIT', 'ARRIVED', 'DELIVERED', 'COMPLETED'] as const;

const STATUS_PROGRESS: Record<string, number> = {
  BOOKING: 10, STUFFING: 25, CUSTOMS: 40, ON_VESSEL: 55,
  TRANSIT: 70, ARRIVED: 85, DELIVERED: 95, COMPLETED: 100, CANCELLED: 0
};

export default function ShipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [order, setOrder] = useState<SalesOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'cargo' | 'documents' | 'financials'>('overview');
  const [noteText, setNoteText] = useState('');

  useEffect(() => { if (id) fetchData(); }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/shipments/${id}`);
      if (!res.ok) throw new Error('Shipment not found');
      const shpData: Shipment = await res.json();
      setShipment(shpData);

      if (shpData.orderId) {
        const oRes = await fetch(`/api/sales-orders/${shpData.orderId}`);
        if (oRes.ok) setOrder(await oRes.json());
      }
    } catch (e: any) {
      toast.error(e.message);
      router.push('/shipments');
    } finally {
      setLoading(false);
    }
  };

  const callAction = async (action: string, extra?: Record<string, any>) => {
    const res = await fetch(`/api/shipments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...extra })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Action failed');
    return data;
  };

  const handleAdvance = async () => {
    try {
      const updated = await callAction('advance');
      toast.success(`Advanced to ${updated.status.replace('_', ' ')}`);
      await fetchData();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleCancel = async () => {
    if (!confirm('Cancel this shipment?')) return;
    try { await callAction('cancel'); toast.success('Shipment cancelled'); await fetchData(); }
    catch (e: any) { toast.error(e.message); }
  };

  const handleDelete = async () => {
    if (!confirm('Soft-delete this shipment?')) return;
    const res = await fetch(`/api/shipments/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Shipment soft-deleted'); router.push('/shipments'); }
    else toast.error('Delete failed');
  };

  const handleSaveNote = async () => {
    if (!noteText.trim()) return;
    try {
      const updated = await callAction('add_note', { note: noteText.trim() });
      setShipment(updated);
      setNoteText('');
      toast.success('Note logged to timeline');
    } catch (e: any) { toast.error(e.message); }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'BOOKING': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'STUFFING': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'CUSTOMS': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'ON_VESSEL': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
      case 'TRANSIT': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'ARRIVED': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'DELIVERED': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'COMPLETED': return 'text-emerald-300 bg-emerald-500/15 border-emerald-400/30';
      case 'CANCELLED': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      default: return 'text-white/80 bg-white/5 border-white/10';
    }
  };

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case 'BOOKING': return <Anchor size={10} className="text-amber-400" />;
      case 'STUFFING': return <Box size={10} className="text-orange-400" />;
      case 'CUSTOMS': return <CheckCircle2 size={10} className="text-yellow-400" />;
      case 'ON_VESSEL': return <Ship size={10} className="text-cyan-400" />;
      case 'TRANSIT': return <Ship size={10} className="text-blue-400" />;
      case 'ARRIVED': return <Globe size={10} className="text-purple-400" />;
      case 'DELIVERED': return <Package size={10} className="text-emerald-400" />;
      case 'COMPLETED': return <CheckCircle2 size={10} className="text-emerald-300" />;
      case 'CANCELLED': return <XCircle size={10} className="text-rose-400" />;
      case 'NOTE_ADDED': return <MessageSquare size={10} />;
      default: return <Activity size={10} />;
    }
  };

  if (!shipment) return null;

  const statusIdx = STATUS_FLOW.indexOf(shipment.status as any);
  const isCancelled = shipment.status === 'CANCELLED';
  const progress = STATUS_PROGRESS[shipment.status] || 0;
  const fc = shipment.freightCost;

  return (
    <>
      <PageHeaderUpdater title={shipment.shipmentNo} subtitle={`${shipment.originPortId} → ${shipment.destinationPortId} · ${shipment.vesselName || 'Vessel TBC'}`} />
      <div className="space-y-8">

        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button onClick={() => router.push('/shipments')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-mono uppercase text-white/90 hover:bg-white/10 cursor-pointer">
            <ArrowLeft size={12} /> Back to Hub
          </button>
          <div className="flex flex-wrap items-center gap-2.5">
            <button onClick={handleDelete} className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-white/70 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer" title="Soft delete">
              <Trash2 size={14} />
            </button>
            {!isCancelled && shipment.status !== 'COMPLETED' && (
              <button onClick={handleCancel} className="flex items-center gap-1.5 px-5 py-3 border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/25 rounded-2xl text-[10px] font-mono uppercase tracking-widest cursor-pointer">
                <XCircle size={12} /> Cancel
              </button>
            )}
            {!isCancelled && shipment.status !== 'COMPLETED' && (
              <button onClick={handleAdvance} className="flex items-center gap-1.5 px-6 py-3 bg-blue-500 text-black hover:bg-blue-400 rounded-2xl text-[10px] font-mono font-bold uppercase tracking-widest border-none cursor-pointer">
                <FastForward size={12} /> Advance Stage →
              </button>
            )}
            {shipment.status === 'COMPLETED' && (
              <span className="px-5 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-[10px] font-mono font-bold uppercase tracking-widest">
                ✓ COMPLETED
              </span>
            )}
          </div>
        </div>

        {/* Route Hero */}
        <div className="glass p-8 rounded-4xl border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none"><Ship size={120} /></div>
          <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-8 relative z-10">
            <div>
              <p className="text-[9px] font-mono text-white/70 uppercase tracking-widest mb-1">Port of Loading (POL)</p>
              <h2 className="text-3xl font-bold tracking-tight text-white font-mono">{shipment.originPortId}</h2>
              <p className="text-xs text-white/70 font-mono mt-1">ETD: {formatDate(shipment.etd)}</p>
              {shipment.atd && <p className="text-[10px] text-emerald-400 font-mono mt-0.5">ATD: {formatDate(shipment.atd)}</p>}
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="w-full relative">
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    className={cn('h-full rounded-full', isCancelled ? 'bg-rose-500/40' : 'bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.5)]')}
                  />
                </div>
                <motion.div
                  animate={!isCancelled && !['COMPLETED', 'DELIVERED'].includes(shipment.status) ? { x: [-4, 4, -4] } : {}}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ left: `${progress}%` }}
                  className="absolute -top-3.5 -translate-x-1/2 p-1.5 rounded-full bg-[#0a0a0a] border border-blue-500/60 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                >
                  <Ship size={14} />
                </motion.div>
              </div>
              <span className={cn('px-3 py-1 rounded text-[9px] font-mono font-bold uppercase border mt-2', getStatusStyle(shipment.status))}>
                {shipment.status.replace('_', ' ')}
              </span>
              {shipment.vesselName && (
                <p className="text-[8px] font-mono text-white/70 uppercase tracking-widest">{shipment.vesselName} / V.{shipment.voyageNo}</p>
              )}
            </div>

            <div className="text-right">
              <p className="text-[9px] font-mono text-white/70 uppercase tracking-widest mb-1">Port of Discharge (POD)</p>
              <h2 className="text-3xl font-bold tracking-tight text-white font-mono">{shipment.destinationPortId}</h2>
              <p className="text-xs text-white/70 font-mono mt-1">ETA: {formatDate(shipment.eta)}</p>
              {shipment.ata && <p className="text-[10px] text-emerald-400 font-mono mt-0.5">ATA: {formatDate(shipment.ata)}</p>}
            </div>
          </div>
        </div>

        {/* Pipeline Stepper */}
        {!isCancelled && (
          <div className="glass p-5 rounded-3xl border border-white/5 overflow-x-auto">
            <div className="flex items-center gap-1.5 min-w-max">
              {STATUS_FLOW.map((step, i) => (
                <React.Fragment key={step}>
                  <div className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[8px] font-mono uppercase tracking-wider whitespace-nowrap transition-all',
                    i < statusIdx ? 'text-white/80 bg-white/3' :
                    i === statusIdx ? 'text-black bg-blue-400 font-bold' :
                    'text-white/15 bg-white/2'
                  )}>
                    {i < statusIdx && <CheckCircle2 size={8} />}
                    {step.replace('_', ' ')}
                  </div>
                  {i < STATUS_FLOW.length - 1 && (
                    <div className={cn('h-px w-4 shrink-0', i < statusIdx ? 'bg-blue-400/30' : 'bg-white/5')} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-6 border-b border-white/5">
          {([
            { id: 'overview', label: 'Overview', icon: Ship },
            { id: 'cargo', label: 'Cargo Details', icon: Box },
            { id: 'documents', label: 'Documents', icon: FileText },
            { id: 'financials', label: 'Freight Costs', icon: DollarSign },
          ] as const).map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn('flex items-center gap-2 pb-4 text-[10px] font-mono font-bold uppercase tracking-widest transition-all relative cursor-pointer border-none bg-transparent',
                activeTab === tab.id ? 'text-blue-400' : 'text-white/70 hover:text-white/70')}>
              <tab.icon size={13} /> {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="shpTab" className="absolute bottom-0 left-0 right-0 h-px bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                {/* Timeline */}
                <div className="glass p-8 rounded-4xl border border-white/5 space-y-6">
                  <h3 className="text-sm font-mono text-white/70 uppercase tracking-widest flex items-center gap-2 pb-4 border-b border-white/5">
                    <Activity size={14} className="text-blue-400" /> Shipment Timeline
                  </h3>

                  <div className="p-4 rounded-2xl bg-white/2 border border-white/5 space-y-3">
                    <p className="text-[8px] font-mono text-white/70 uppercase tracking-wider">Log Logistics Note</p>
                    <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
                      placeholder="Port congestion alerts, custom holds, buyer notifications..."
                      className="w-full bg-[#070707] border border-white/10 rounded-xl p-3 text-[11px] font-mono text-white focus:outline-none focus:border-blue-500/50 min-h-[50px]" />
                    <div className="flex justify-end">
                      <button onClick={handleSaveNote} disabled={!noteText.trim()}
                        className="px-4 py-2 bg-blue-500 text-black text-[9px] font-mono font-bold uppercase rounded-lg hover:bg-blue-400 disabled:opacity-40 border-none cursor-pointer">
                        Save Note
                      </button>
                    </div>
                  </div>

                  <div className="max-h-[350px] overflow-y-auto custom-scrollbar pr-2 space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-white/5">
                    {(shipment.timeline || []).map((ev, idx) => (
                      <div key={ev.id || idx} className="relative pl-8">
                        <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-[#0a0a0a] border border-white/15 flex items-center justify-center z-10 text-blue-400">
                          {getTimelineIcon(ev.type)}
                        </div>
                        <p className="text-[8px] font-mono text-white/70 uppercase mb-0.5">{formatDate(ev.date)}</p>
                        <p className="text-xs font-bold text-white/90 mb-0.5">{ev.title}</p>
                        <p className="text-[10px] text-white/70 leading-relaxed">{ev.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* Booking Details */}
                <div className="glass p-8 rounded-4xl border border-white/5 space-y-4">
                  <h4 className="text-[10px] font-mono text-white/70 uppercase tracking-widest pb-3 border-b border-white/5">
                    Booking Details
                  </h4>
                  {[
                    ['Shipping Line', shipment.shippingLineId],
                    ['Vessel', shipment.vesselName || '—'],
                    ['Voyage No', shipment.voyageNo || '—'],
                    ['MBL No', shipment.mbl || '—'],
                    ['HBL No', shipment.hbl || '—'],
                    ['Booking Ref', shipment.bookingNo || '—'],
                    ['Container No', shipment.containerNo || '—'],
                    ['Seal No', shipment.sealNo || '—'],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between items-center text-xs font-mono">
                      <span className="text-white/70 uppercase text-[9px]">{label}</span>
                      <span className="text-white/70 font-bold text-right max-w-[140px] truncate">{val}</span>
                    </div>
                  ))}
                </div>

                {/* Linked SO */}
                {order && (
                  <div className="glass p-8 rounded-4xl border border-white/5 space-y-3">
                    <h4 className="text-[10px] font-mono text-white/70 uppercase tracking-widest pb-2 border-b border-white/5">Linked Sales Order</h4>
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-white/70 text-[9px] uppercase">Order Ref</span>
                      <Link href={`/sales-orders/${order.id}`} className="text-blue-400 hover:underline flex items-center gap-1 text-[10px]">
                        {order.orderNo} <ExternalLink size={10} />
                      </Link>
                    </div>
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-white/70 text-[9px] uppercase">Contract Value</span>
                      <span className="text-white/70 font-bold">{formatCurrency(order.totalValue)}</span>
                    </div>
                  </div>
                )}

                {/* Remarks */}
                {shipment.remarks && (
                  <div className="glass p-6 rounded-4xl border border-white/5 space-y-2">
                    <h4 className="text-[9px] font-mono text-white/70 uppercase tracking-widest">Special Instructions</h4>
                    <p className="text-[11px] font-mono text-white/90 leading-relaxed">{shipment.remarks}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'cargo' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {[
                { label: 'Container Type', value: shipment.containerType },
                { label: 'Gross Weight', value: `${shipment.grossWeight?.toLocaleString()} KG` },
                { label: 'Net Weight', value: `${shipment.netWeight?.toLocaleString()} KG` },
                { label: 'Volume (CBM)', value: `${shipment.cbm} CBM` },
                { label: 'Package Count', value: shipment.packageCount ? `${shipment.packageCount} PCS` : '—' },
                { label: 'Hazmat', value: shipment.hazmat ? 'YES — HAZARDOUS' : 'NON-HAZARDOUS' },
                { label: 'Seal Number', value: shipment.sealNo || '—' },
                { label: 'Container No', value: shipment.containerNo || '—' },
              ].map((item, i) => (
                <div key={i} className="glass p-6 rounded-3xl border border-white/5">
                  <p className="text-[9px] font-mono text-white/70 uppercase tracking-widest mb-2">{item.label}</p>
                  <p className="font-sans font-bold text-white/90 text-lg">{item.value}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="glass p-8 rounded-4xl border border-white/5 space-y-4">
              <h3 className="text-sm font-mono text-white/70 uppercase tracking-widest pb-4 border-b border-white/5">Shipping Documents Vault</h3>
              {(shipment.documents || []).length > 0 ? (
                (shipment.documents || []).map(doc => (
                  <div key={doc.id} className="flex justify-between items-center p-4 bg-white/2 border border-white/5 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <FileText size={14} className="text-blue-400 shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-white/90">{doc.name}</p>
                        <p className="text-[9px] font-mono text-white/70 uppercase">{doc.type} · {formatDate(doc.uploadedAt)}</p>
                      </div>
                    </div>
                    <a href={doc.url} className="p-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-all">
                      <ExternalLink size={14} />
                    </a>
                  </div>
                ))
              ) : (
                <p className="text-center py-12 text-white/10 font-mono text-xs uppercase tracking-widest">No documents uploaded</p>
              )}
            </div>
          )}

          {activeTab === 'financials' && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { label: 'Ocean Freight', value: fc?.oceanFreight || 0, color: 'text-blue-400' },
                  { label: 'Origin Charges', value: fc?.originCharges || 0, color: 'text-amber-400' },
                  { label: 'Destination Charges', value: fc?.destinationCharges || 0, color: 'text-purple-400' },
                  { label: 'Insurance', value: fc?.insurance || 0, color: 'text-rose-400' },
                ].map((item, i) => (
                  <div key={i} className="glass p-6 rounded-3xl border border-white/5">
                    <p className="text-[9px] font-mono text-white/70 uppercase tracking-widest mb-2">{item.label}</p>
                    <p className={cn('text-xl font-bold font-sans', item.color)}>{formatCurrency(item.value)}</p>
                  </div>
                ))}
              </div>

              <div className="glass p-8 rounded-4xl border border-white/5 space-y-4">
                <h3 className="text-sm font-mono text-white/70 uppercase tracking-widest pb-4 border-b border-white/5">Freight Cost Breakdown</h3>
                <div className="space-y-3 text-xs font-mono">
                  {[
                    ['Ocean Freight (POL → POD)', fc?.oceanFreight || 0],
                    ['Origin Port Charges (CFS/Stuffing)', fc?.originCharges || 0],
                    ['Destination THC & Port Fees', fc?.destinationCharges || 0],
                    ['Marine Cargo Insurance', fc?.insurance || 0],
                    ...(fc?.customsBrokerage ? [['Customs Brokerage', fc.customsBrokerage] as [string, number]] : []),
                    ...(fc?.miscCharges ? [['Miscellaneous Charges', fc.miscCharges] as [string, number]] : []),
                  ].map(([label, val]) => (
                    <div key={label as string} className="flex justify-between items-center text-white/70 py-1 border-b border-white/3">
                      <span className="uppercase text-[9px] tracking-widest">{label as string}</span>
                      <span className="font-sans font-bold">{formatCurrency(val as number)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 text-white font-bold text-base">
                    <span className="text-[10px] font-mono uppercase tracking-wider">Total Freight Cost</span>
                    <span className="font-sans text-blue-400 text-lg">{formatCurrency(shipment.totalFreightCost || 0)}</span>
                  </div>
                </div>
                {order && (
                  <div className="pt-4 border-t border-white/5 flex justify-between items-center text-xs font-mono">
                    <span className="text-white/70 uppercase text-[9px]">Contract Revenue (SO)</span>
                    <span className="font-sans font-bold text-emerald-400">{formatCurrency(order.totalValue)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

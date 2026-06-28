'use client';

import React, { useState } from 'react';
import { MasterPage } from '@/components/layout/master-page';
import {
  Ship, Search, Filter, Trash2, Archive, FileDown, X,
  ChevronDown, ChevronUp, Eye, ArrowRight, AlertCircle,
  CheckCircle2, Clock, Anchor, Package, DollarSign, XCircle, FastForward
} from 'lucide-react';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { useShipments, ShipmentSortField } from '@/hooks/useShipments';

const STATUS_PROGRESS: Record<string, number> = {
  BOOKING: 10, STUFFING: 25, CUSTOMS: 40, ON_VESSEL: 55,
  TRANSIT: 70, ARRIVED: 85, DELIVERED: 95, COMPLETED: 100, CANCELLED: 0
};

export default function ShipmentsPage() {
  const hook = useShipments();
  const {
    shipments, loading, kpis,
    searchQuery, setSearchQuery,
    filters, setFilters, filterOptions,
    sortBy, setSortBy, sortOrder, setSortOrder,
    selectedIds, toggleSelect, selectAll,
    advance, cancelShipment, softDelete
  } = hook;

  const [showFilters, setShowFilters] = useState(false);

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

  const sortHeader = (field: ShipmentSortField, label: string) => (
    <button onClick={() => { setSortBy(field); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}
      className="flex items-center gap-1.5 hover:text-white transition-colors bg-transparent border-none cursor-pointer text-white/70 text-xs font-mono uppercase">
      {label}
      {sortBy === field && (sortOrder === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
    </button>
  );

  return (
    <MasterPage title="Global Logistics Hub" subtitle="Real-time Shipment Matrix & Freight Pipeline" loading={loading}>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'In Transit', value: kpis.inTransit, icon: Ship, color: 'text-blue-400', pulse: true },
          { label: 'Pending Booking', value: kpis.pendingBooking, icon: Clock, color: 'text-amber-400', pulse: false },
          { label: 'Arrived / Delivered', value: kpis.arrived, icon: Package, color: 'text-purple-400', pulse: false },
          { label: 'Completed', value: kpis.completed, icon: CheckCircle2, color: 'text-emerald-400', pulse: false },
          { label: 'Total Freight Cost', value: formatCurrency(kpis.totalFreight), icon: DollarSign, color: 'text-rose-400', pulse: false },
        ].map((item, i) => (
          <div key={i} className="glass p-5 rounded-3xl border border-white/5 flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center shrink-0">
              <item.icon size={18} className={cn(item.color, item.pulse && 'animate-pulse')} />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-mono text-white/70 uppercase tracking-widest mb-0.5 truncate">{item.label}</p>
              <p className="font-sans font-bold text-base text-white">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        {/* Controls */}
        <div className="glass p-6 rounded-3xl border border-white/5 space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full max-w-lg flex items-center bg-white/5 border border-white/10 rounded-2xl overflow-hidden focus-within:border-blue-500/50 transition-all">
              <Search className="absolute left-4 text-white/70" size={16} />
              <input type="text" placeholder="Search by Shipment No, MBL, Vessel, Port..."
                className="w-full bg-transparent py-3 pl-12 pr-4 text-xs focus:outline-none text-white font-mono h-12"
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="p-2 text-white/80 hover:text-white/90 cursor-pointer bg-transparent border-none"><X size={14} /></button>
              )}
            </div>
            <button onClick={() => setShowFilters(!showFilters)}
              className={cn('flex items-center gap-2 px-6 py-3 border rounded-2xl text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer',
                Object.values(filters).some(a => a.length > 0)
                  ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                  : 'bg-white/5 border-white/10 text-white/90 hover:bg-white/10')}>
              <Filter size={14} /> Filters
            </button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-white/5 pt-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-[10px] font-mono">
                  <div className="space-y-2">
                    <p className="text-white/70 uppercase tracking-wider">Status</p>
                    <div className="flex flex-wrap gap-1.5">
                      {filterOptions.statuses.map(s => (
                        <button key={s} onClick={() => setFilters(f => ({ ...f, statuses: f.statuses.includes(s) ? f.statuses.filter(x => x !== s) : [...f.statuses, s] }))}
                          className={cn('px-2.5 py-1 rounded bg-[#101010] border text-[9px]', filters.statuses.includes(s) ? 'border-blue-500 text-blue-400' : 'border-white/5 text-white/70')}>
                          {s.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-white/70 uppercase tracking-wider">Shipping Line</p>
                    <div className="flex flex-wrap gap-1.5">
                      {filterOptions.shippingLines.map(l => (
                        <button key={l} onClick={() => setFilters(f => ({ ...f, shippingLines: f.shippingLines.includes(l) ? f.shippingLines.filter(x => x !== l) : [...f.shippingLines, l] }))}
                          className={cn('px-2.5 py-1 rounded bg-[#101010] border text-[9px]', filters.shippingLines.includes(l) ? 'border-blue-500 text-blue-400' : 'border-white/5 text-white/70')}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-end">
                    <button onClick={() => setFilters({ statuses: [], shippingLines: [], containerTypes: [] })}
                      className="px-4 py-2 rounded bg-white/5 text-[9px] font-mono text-white/70 hover:bg-white/10 cursor-pointer border-none">
                      Clear Filters
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bulk Toolbar */}
        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="flex flex-wrap items-center justify-between p-4 bg-blue-500 text-black rounded-2xl gap-3">
              <span className="text-xs font-mono font-bold flex items-center gap-2">
                <Ship size={16} /> {selectedIds.length} Shipments Selected
              </span>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => hook.bulkArchive(selectedIds)} className="flex items-center gap-1.5 px-3 py-1.5 bg-black/10 hover:bg-black/20 rounded-lg text-[9px] font-mono font-bold uppercase cursor-pointer border-none text-black">
                  <Archive size={12} /> Archive
                </button>
                <button onClick={() => hook.bulkDelete(selectedIds)} className="flex items-center gap-1.5 px-3 py-1.5 bg-black/10 hover:bg-black/20 rounded-lg text-[9px] font-mono font-bold uppercase cursor-pointer border-none text-black">
                  <Trash2 size={12} /> Delete
                </button>
                <button onClick={() => hook.bulkExportCSV(selectedIds)} className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white hover:bg-black/90 rounded-lg text-[9px] font-mono font-bold uppercase cursor-pointer border-none">
                  <FileDown size={12} /> Export CSV
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Shipment Cards */}
        <div className="space-y-4">
          {shipments.map(shp => (
            <div key={shp.id} className="glass rounded-3xl border border-white/5 hover:border-white/10 transition-all group overflow-hidden">
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  {/* Checkbox + ID */}
                  <div className="lg:col-span-3 flex items-center gap-3">
                    <input type="checkbox" checked={selectedIds.includes(shp.id)} onChange={() => toggleSelect(shp.id)}
                      className="rounded accent-blue-500 cursor-pointer shrink-0" />
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                      <Ship size={16} className="text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <Link href={`/shipments/${shp.id}`}>
                        <p className="font-sans font-bold text-white/90 group-hover:text-blue-400 transition-colors text-sm">{shp.shipmentNo}</p>
                      </Link>
                      <p className="text-[9px] font-mono text-white/70 truncate">{shp.containerType} · {shp.shippingLineId}</p>
                    </div>
                  </div>

                  {/* Route Visualization */}
                  <div className="lg:col-span-5 flex items-center gap-4">
                    <div className="text-right min-w-[80px]">
                      <p className="text-[9px] font-mono text-white/70 uppercase">Origin</p>
                      <p className="font-bold text-white/80 text-sm font-mono">{shp.originPortId}</p>
                      <p className="text-[9px] text-white/80 font-mono">{formatDate(shp.etd)}</p>
                    </div>
                    <div className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full relative h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${STATUS_PROGRESS[shp.status] || 0}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className={cn('h-full rounded-full', shp.status === 'CANCELLED' ? 'bg-rose-500/50' : 'bg-blue-500')}
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <motion.div animate={{ x: [-2, 2, -2] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                          className={cn("text-[10px]", ['TRANSIT', 'ON_VESSEL'].includes(shp.status) ? 'text-blue-400' : 'text-white/70')}>
                          <Ship size={12} />
                        </motion.div>
                        <span className={cn('text-[8px] font-mono uppercase tracking-widest', getStatusStyle(shp.status).split(' ')[0])}>
                          {shp.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <div className="min-w-[80px]">
                      <p className="text-[9px] font-mono text-white/70 uppercase">Destination</p>
                      <p className="font-bold text-white/80 text-sm font-mono">{shp.destinationPortId}</p>
                      <p className="text-[9px] text-white/80 font-mono">{formatDate(shp.eta)}</p>
                    </div>
                  </div>

                  {/* Vessel & Freight */}
                  <div className="lg:col-span-2 text-xs font-mono">
                    <p className="text-[9px] text-white/70 uppercase mb-0.5">Vessel</p>
                    <p className="text-white/90 truncate text-[10px]">{shp.vesselName || '—'}</p>
                    <p className="text-[9px] text-white/70 mt-1">{shp.voyageNo || ''}</p>
                  </div>

                  {/* Actions */}
                  <div className="lg:col-span-2 flex justify-end items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/shipments/${shp.id}`}>
                      <button className="p-2.5 rounded-xl hover:bg-white/10 text-white/70 hover:text-white bg-transparent border-none cursor-pointer" title="View detail"><Eye size={14} /></button>
                    </Link>
                    {!['COMPLETED', 'CANCELLED'].includes(shp.status) && (
                      <button onClick={() => advance(shp.id)}
                        className="p-2.5 rounded-xl hover:bg-blue-500/10 text-white/70 hover:text-blue-400 bg-transparent border-none cursor-pointer" title="Advance to next stage">
                        <FastForward size={14} />
                      </button>
                    )}
                    {!['COMPLETED', 'CANCELLED'].includes(shp.status) && (
                      <button onClick={() => cancelShipment(shp.id)}
                        className="p-2.5 rounded-xl hover:bg-rose-500/10 text-white/70 hover:text-rose-400 bg-transparent border-none cursor-pointer" title="Cancel">
                        <XCircle size={14} />
                      </button>
                    )}
                    <button onClick={() => softDelete(shp.id)}
                      className="p-2.5 rounded-xl hover:bg-white/10 text-white/70 hover:text-rose-400 bg-transparent border-none cursor-pointer" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Progress bar bottom */}
                <div className="mt-4 w-full h-px bg-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${STATUS_PROGRESS[shp.status] || 0}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    className={cn('h-px', shp.status === 'COMPLETED' ? 'bg-emerald-400' : shp.status === 'CANCELLED' ? 'bg-rose-500/30' : 'bg-blue-500/40')}
                  />
                </div>
              </div>
            </div>
          ))}
          {shipments.length === 0 && (
            <div className="glass rounded-3xl border border-white/5 py-16 text-center text-white/70 font-mono text-xs uppercase tracking-widest">
              No Shipments Match Filters
            </div>
          )}
        </div>
      </div>
    </MasterPage>
  );
}

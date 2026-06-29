'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { MasterPage } from '@/components/layout/master-page';
import {
  Package, Search, Filter, Trash2, Archive, Copy, FileDown,
  X, ChevronDown, ChevronUp, Eye, DollarSign, Truck,
  CheckCircle2, XCircle, Play, PackageCheck, Send, ReceiptText
} from 'lucide-react';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { usePurchaseOrders, POSortField } from '@/hooks/usePurchaseOrders';
import { Supplier } from '@/types';
import { Pagination } from '@/components/ui/pagination';

export default function PurchaseOrdersPage() {
  const hook = usePurchaseOrders();
  const {
    orders, rawOrders, loading,
    currentPage, setCurrentPage, totalPages,
    searchQuery, setSearchQuery,
    filters, setFilters, filterOptions,
    sortBy, setSortBy, sortOrder, setSortOrder,
    selectedIds, toggleSelect, selectAll,
    issuePO, acknowledgePO, startProduction, dispatchPO, receivePO, cancelPO, duplicatePO, softDelete
  } = hook;

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetch('/api/suppliers').then(r => r.json()).then(setSuppliers).catch(() => {});
  }, []);

  const getSupplierName = (id: string) => suppliers.find(s => s.id === id)?.name ?? id;

  // KPI stats
  const stats = useMemo(() => {
    const active = rawOrders.filter(o => o.entityStatus === 'ACTIVE');
    return {
      total: active.length,
      pendingValue: active.filter(o => ['ISSUED', 'ACKNOWLEDGED', 'IN_PRODUCTION', 'DISPATCHED'].includes(o.status)).reduce((s, o) => s + o.totalValue, 0),
      receivedValue: active.filter(o => o.status === 'RECEIVED').reduce((s, o) => s + o.totalValue, 0),
      inProduction: active.filter(o => o.status === 'IN_PRODUCTION').length,
    };
  }, [rawOrders]);

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

  const sortHeader = (field: POSortField, label: string) => (
    <button
      onClick={() => { setSortBy(field); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}
      className="flex items-center gap-1.5 hover:text-white transition-colors bg-transparent border-none cursor-pointer text-white/70 text-xs font-mono uppercase"
    >
      {label}
      {sortBy === field && (sortOrder === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
    </button>
  );

  const nextActionButton = (o: typeof orders[0]) => {
    if (o.status === 'DRAFT') return (
      <button onClick={() => issuePO(o.id)} className="p-2 rounded hover:bg-blue-500/10 text-white/70 hover:text-blue-400 bg-transparent border-none cursor-pointer" title="Issue to Supplier"><Send size={14} /></button>
    );
    if (o.status === 'ISSUED') return (
      <button onClick={() => acknowledgePO(o.id)} className="p-2 rounded hover:bg-cyan-500/10 text-white/70 hover:text-cyan-400 bg-transparent border-none cursor-pointer" title="Mark Acknowledged"><CheckCircle2 size={14} /></button>
    );
    if (o.status === 'ACKNOWLEDGED') return (
      <button onClick={() => startProduction(o.id)} className="p-2 rounded hover:bg-amber-500/10 text-white/70 hover:text-amber-400 bg-transparent border-none cursor-pointer" title="Start Production"><Play size={14} /></button>
    );
    if (o.status === 'IN_PRODUCTION') return (
      <button onClick={() => dispatchPO(o.id)} className="p-2 rounded hover:bg-purple-500/10 text-white/70 hover:text-purple-400 bg-transparent border-none cursor-pointer" title="Mark Dispatched"><Truck size={14} /></button>
    );
    if (o.status === 'DISPATCHED') return (
      <button onClick={() => receivePO(o.id)} className="p-2 rounded hover:bg-emerald-500/10 text-white/70 hover:text-emerald-400 bg-transparent border-none cursor-pointer" title="Mark Received"><PackageCheck size={14} /></button>
    );
    return null;
  };

  return (
    <MasterPage title="Purchase Ledger" subtitle="Supplier Procurement Orders & Supply Pipeline" loading={loading}>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Active POs', value: stats.total, icon: Package, color: 'text-amber-400' },
          { label: 'Procurement Pipeline', value: formatCurrency(stats.pendingValue), icon: DollarSign, color: 'text-blue-400' },
          { label: 'Goods Received', value: formatCurrency(stats.receivedValue), icon: PackageCheck, color: 'text-emerald-400' },
          { label: 'In Production', value: stats.inProduction, icon: Play, color: 'text-purple-400' },
        ].map((item, i) => (
          <div key={i} className="glass p-6 rounded-3xl border border-white/5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
              <item.icon size={20} className={item.color} />
            </div>
            <div>
              <p className="text-[10px] font-mono text-white/70 uppercase tracking-widest mb-0.5">{item.label}</p>
              <p className="font-sans font-bold text-lg text-white">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        {/* Controls */}
        <div className="glass p-6 rounded-3xl border border-white/5 space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full max-w-lg flex items-center bg-white/5 border border-white/10 rounded-2xl overflow-hidden focus-within:border-amber-500/50 transition-all">
              <Search className="absolute left-4 text-white/70" size={16} />
              <input
                type="text"
                placeholder="Search by PO No or Supplier..."
                className="w-full bg-transparent py-3 pl-12 pr-4 text-xs focus:outline-none text-white font-mono h-12"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="p-2 text-white/80 hover:text-white/90 cursor-pointer bg-transparent border-none"><X size={14} /></button>
              )}
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'flex items-center gap-2 px-6 py-3 border rounded-2xl text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer',
                Object.values(filters).some(a => a.length > 0)
                  ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                  : 'bg-white/5 border-white/10 text-white/90 hover:bg-white/10'
              )}
            >
              <Filter size={14} /> Filters
            </button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-white/5 pt-4"
              >
                <div className="grid grid-cols-2 gap-6 text-[10px] font-mono">
                  <div className="space-y-2">
                    <p className="text-white/70 uppercase tracking-wider">PO Status</p>
                    <div className="flex flex-wrap gap-1.5">
                      {filterOptions.statuses.map(s => (
                        <button key={s}
                          onClick={() => setFilters(f => ({ ...f, statuses: f.statuses.includes(s) ? f.statuses.filter(x => x !== s) : [...f.statuses, s] }))}
                          className={cn('px-2.5 py-1 rounded bg-[#101010] border text-[9px]', filters.statuses.includes(s) ? 'border-amber-500 text-amber-400' : 'border-white/5 text-white/70')}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-end">
                    <button onClick={() => setFilters({ statuses: [], supplierIds: [] })}
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
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="flex flex-wrap items-center justify-between p-4 bg-amber-500 text-black rounded-2xl gap-3"
            >
              <span className="text-xs font-mono font-bold flex items-center gap-2">
                <Package size={16} /> {selectedIds.length} POs Selected
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

        {/* Table */}
        <div className="glass rounded-3xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-white/2 text-white/70 uppercase tracking-[0.15em] border-b border-white/5">
                <tr>
                  <th className="py-5 px-6 w-8">
                    <input type="checkbox"
                      checked={orders.length > 0 && selectedIds.length === orders.length}
                      onChange={() => selectAll(orders.map(o => o.id))}
                      className="rounded accent-amber-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-5 px-6">{sortHeader('poNo', 'PO Reference')}</th>
                  <th className="py-5 px-6">Supplier</th>
                  <th className="py-5 px-6">{sortHeader('date', 'Issue Date')}</th>
                  <th className="py-5 px-6">{sortHeader('expectedDeliveryDate', 'Expected Delivery')}</th>
                  <th className="py-5 px-6 text-right">{sortHeader('totalValue', 'Value')}</th>
                  <th className="py-5 px-6">Currency</th>
                  <th className="py-5 px-6 text-right">{sortHeader('status', 'Status')}</th>
                  <th className="py-5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-white/2 group transition-colors">
                    <td className="py-4 px-6" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedIds.includes(o.id)} onChange={() => toggleSelect(o.id)} className="rounded accent-amber-500 cursor-pointer" />
                    </td>
                    <td className="py-4 px-6">
                      <Link href={`/purchase-orders/${o.id}`} className="font-sans font-bold text-sm text-white/90 group-hover:text-amber-400 transition-colors block">
                        {o.poNo}
                      </Link>
                    </td>
                    <td className="py-4 px-6 text-white/70 truncate max-w-[180px]">{getSupplierName(o.supplierId)}</td>
                    <td className="py-4 px-6 text-white/70">{formatDate(o.date)}</td>
                    <td className="py-4 px-6 text-white/70">{formatDate(o.expectedDeliveryDate)}</td>
                    <td className="py-4 px-6 text-right font-bold text-white/80">{formatCurrency(o.totalValue)}</td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-0.5 rounded border border-white/5 text-[9px] text-white/70">{o.currency || 'INR'}</span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className={cn('px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase border', getStatusStyle(o.status))}>
                        {o.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/purchase-orders/${o.id}`}>
                          <button className="p-2 rounded hover:bg-white/10 text-white/70 hover:text-white bg-transparent border-none cursor-pointer" title="View"><Eye size={14} /></button>
                        </Link>
                        {nextActionButton(o)}
                        <button onClick={() => duplicatePO(o.id)} className="p-2 rounded hover:bg-white/10 text-white/70 hover:text-white bg-transparent border-none cursor-pointer" title="Duplicate"><Copy size={14} /></button>
                        {o.status !== 'RECEIVED' && o.status !== 'CANCELLED' && (
                          <button onClick={() => cancelPO(o.id)} className="p-2 rounded hover:bg-rose-500/10 text-white/70 hover:text-rose-400 bg-transparent border-none cursor-pointer" title="Cancel"><XCircle size={14} /></button>
                        )}
                        <button onClick={() => softDelete(o.id)} className="p-2 rounded hover:bg-white/10 text-white/70 hover:text-rose-400 bg-transparent border-none cursor-pointer" title="Delete"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-16 text-center text-white/70 font-mono text-xs uppercase tracking-widest">
                      No Purchase Orders Match Filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </MasterPage>
  );
}

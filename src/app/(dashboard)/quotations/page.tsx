'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PageHeaderUpdater } from '@/components/layout/page-context';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Archive, 
  Copy, 
  RefreshCcw, 
  FileDown, 
  X, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Eye, 
  DollarSign, 
  Percent, 
  Calendar, 
  Anchor, 
  ArrowUpRight, 
  Clock, 
  User, 
  AlertCircle
} from 'lucide-react';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { useQuotations, QuotationSortField, SortOrder } from '@/hooks/useQuotations';
import { Customer } from '@/types';
import { Pagination } from '@/components/ui/pagination';

export default function QuotationsPage() {
  const hook = useQuotations();
  const {
    quotations,
    rawQuotations,
    loading,
    currentPage,
    setCurrentPage,
    totalPages,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    filterOptions,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    selectedIds,
    toggleSelect,
    selectAll,
    approveQuotation,
    rejectQuotation,
    sendQuotation,
    reviseQuotation,
    duplicateQuotation,
    softDeleteQuotation
  } = hook;

  // UI States
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Fetch customer metadata to display names instead of IDs
  useEffect(() => {
    fetch('/api/customers')
      .then(res => res.json())
      .then(data => setCustomers(data))
      .catch(() => console.error('Failed to retrieve customer names mapping'));
  }, []);

  const getCustomerName = (custId: string) => {
    const found = customers.find(c => c.id === custId);
    return found ? found.name : custId;
  };

  // Compute Metrics Dashboard
  const dashboardStats = useMemo(() => {
    const active = rawQuotations.filter(q => (!q.entityStatus || q.entityStatus === 'ACTIVE'));
    const totalCount = active.length;
    const approvedVal = active.filter(q => q.status === 'APPROVED').reduce((acc, q) => acc + q.totalValue, 0);
    const pendingSentVal = active.filter(q => q.status === 'SENT').reduce((acc, q) => acc + q.totalValue, 0);
    const avgMargin = totalCount > 0 
      ? Math.round(active.reduce((acc, q) => acc + q.marginPercentage, 0) / totalCount)
      : 0;

    return { totalCount, approvedVal, pendingSentVal, avgMargin };
  }, [rawQuotations]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'REJECTED': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'SENT': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'DRAFT': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'REVISED': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'EXPIRED': return 'text-muted-foreground bg-muted border-border';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    await duplicateQuotation(id);
  };

  const handleRevise = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    await reviseQuotation(id);
  };

  return (
    <>
      <PageHeaderUpdater title="Commercial Proposals" subtitle="Quotation Configurator & Pricing Negotiation Matrix" />
      {/* Top Stat Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Active Proposals', value: dashboardStats.totalCount, icon: FileText, color: 'text-blue-400' },
          { label: 'Approved Value', value: formatCurrency(dashboardStats.approvedVal), icon: DollarSign, color: 'text-emerald-400' },
          { label: 'Pending Negotiation', value: formatCurrency(dashboardStats.pendingSentVal), icon: Clock, color: 'text-amber-400' },
          { label: 'Avg Configured Margin', value: `${dashboardStats.avgMargin}%`, icon: Percent, color: 'text-rose-400' },
        ].map((item, i) => (
          <div key={i} className="glass p-6 rounded-3xl border border-border flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
              <item.icon size={20} className={item.color} />
            </div>
            <div>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-0.5">{item.label}</p>
              <p className="font-sans font-bold text-lg text-foreground">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        {/* Main Controls Panel */}
        <div className="glass p-6 rounded-3xl border border-border space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Search Input */}
            <div className="relative w-full max-w-lg flex items-center bg-muted border border-border rounded-2xl overflow-hidden focus-within:border-blue-500/50 transition-all font-mono">
              <Search className="absolute left-4 text-muted-foreground" size={16} />
              <input 
                type="text" 
                placeholder="Identify Proposal Ref No..." 
                className="w-full bg-transparent py-3 pl-12 pr-4 text-xs focus:outline-none text-foreground font-mono h-12"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="p-2 text-muted-foreground hover:text-foreground/90 bg-transparent border-none cursor-pointer">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Toolbar Buttons */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button 
                onClick={() => setShowFilterDrawer(!showFilterDrawer)}
                className={cn(
                  "flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 border rounded-2xl text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer",
                  Object.values(filters).some(arr => arr.length > 0)
                    ? "bg-blue-500/10 border-blue-500 text-blue-400"
                    : "bg-muted border-border text-foreground/90 hover:bg-accent"
                )}
              >
                <Filter size={14} /> Filters
              </button>
              
              <Link href="/quotations/new" className="flex-1 md:flex-none">
                <button 
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-black rounded-2xl text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-blue-400 transition-all border-none cursor-pointer"
                >
                  <Plus size={14} /> New Quotation
                </button>
              </Link>
            </div>
          </div>

          {/* Filter Drawer */}
          <AnimatePresence>
            {showFilterDrawer && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-border pt-4"
              >
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-[10px] font-mono">
                  {/* Customer Filter */}
                  <div className="space-y-2">
                    <p className="text-muted-foreground uppercase tracking-wider">Customer</p>
                    <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto custom-scrollbar">
                      {filterOptions.customerIds.map(id => (
                        <button
                          key={id}
                          onClick={() => setFilters(prev => ({
                            ...prev,
                            customerIds: prev.customerIds.includes(id) ? prev.customerIds.filter(x => x !== id) : [...prev.customerIds, id]
                          }))}
                          className={cn(
                            "px-2.5 py-1 rounded bg-card border text-[9px]",
                            filters.customerIds.includes(id) ? "border-blue-500 text-blue-400 bg-blue-500/5" : "border-border text-muted-foreground"
                          )}
                        >
                          {getCustomerName(id)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div className="space-y-2">
                    <p className="text-muted-foreground uppercase tracking-wider">Proposal Status</p>
                    <div className="flex flex-wrap gap-1.5">
                      {filterOptions.statuses.map(s => (
                        <button
                          key={s}
                          onClick={() => setFilters(prev => ({
                            ...prev,
                            statuses: prev.statuses.includes(s) ? prev.statuses.filter(x => x !== s) : [...prev.statuses, s]
                          }))}
                          className={cn(
                            "px-2.5 py-1 rounded bg-card border text-[9px]",
                            filters.statuses.includes(s) ? "border-blue-500 text-blue-400 bg-blue-500/5" : "border-border text-muted-foreground"
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Incoterms Filter */}
                  <div className="space-y-2">
                    <p className="text-muted-foreground uppercase tracking-wider">Incoterm Rule</p>
                    <div className="flex flex-wrap gap-1.5">
                      {filterOptions.incoterms.map(inc => (
                        <button
                          key={inc}
                          onClick={() => setFilters(prev => ({
                            ...prev,
                            incoterms: prev.incoterms.includes(inc) ? prev.incoterms.filter(x => x !== inc) : [...prev.incoterms, inc]
                          }))}
                          className={cn(
                            "px-2.5 py-1 rounded bg-card border text-[9px]",
                            filters.incoterms.includes(inc) ? "border-blue-500 text-blue-400 bg-blue-500/5" : "border-border text-muted-foreground"
                          )}
                        >
                          {inc}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6 border-t border-border pt-4">
                  <button 
                    onClick={() => setFilters({ customerIds: [], statuses: [], incoterms: [] })}
                    className="px-4 py-2 rounded bg-muted text-[9px] font-mono text-muted-foreground hover:bg-accent cursor-pointer border-none"
                  >
                    Clear Proposal Filters
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bulk Action Header Toolbar */}
        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-wrap items-center justify-between p-4 bg-blue-500 text-black rounded-2xl gap-3"
            >
              <div className="flex items-center gap-3 text-xs font-mono font-bold">
                <FileText size={16} />
                <span>{selectedIds.length} Proposals Checked</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button 
                  onClick={() => hook.bulkArchive(selectedIds)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-black/10 hover:bg-black/20 rounded-lg text-[9px] font-mono font-bold uppercase border-none cursor-pointer text-black"
                >
                  <Archive size={12} /> Archive
                </button>
                <button 
                  onClick={() => hook.bulkRestore(selectedIds)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-black/10 hover:bg-black/20 rounded-lg text-[9px] font-mono font-bold uppercase border-none cursor-pointer text-black"
                >
                  <RefreshCcw size={12} /> Restore
                </button>
                <button 
                  onClick={() => hook.bulkDelete(selectedIds)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-black/10 hover:bg-black/20 rounded-lg text-[9px] font-mono font-bold uppercase border-none cursor-pointer text-black"
                >
                  <Trash2 size={12} /> Delete
                </button>
                <button 
                  onClick={() => hook.bulkExportCSV(selectedIds)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-foreground hover:bg-black/90 rounded-lg text-[9px] font-mono font-bold uppercase border-none cursor-pointer"
                >
                  <FileDown size={12} /> Export CSV
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quotations Grid Listing */}
        <div className="glass rounded-3xl border border-border overflow-hidden">
          <div className="overflow-x-auto font-mono">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-white/2 text-muted-foreground uppercase tracking-[0.2em] border-b border-border">
                <tr>
                  <th className="py-5 px-6 w-8 text-center">
                    <input 
                      type="checkbox"
                      checked={quotations.length > 0 && selectedIds.length === quotations.length}
                      onChange={() => selectAll(quotations.map(q => q.id))}
                      className="rounded accent-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-5 px-6">
                    <button 
                      onClick={() => {
                        setSortBy('quotationNo');
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      }}
                      className="flex items-center gap-2 hover:text-foreground transition-colors bg-transparent border-none cursor-pointer text-muted-foreground text-xs font-mono uppercase"
                    >
                      Proposal Ref {sortBy === 'quotationNo' && (sortOrder === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                    </button>
                  </th>
                  <th className="py-5 px-6">Customer</th>
                  <th className="py-5 px-6">
                    <button 
                      onClick={() => {
                        setSortBy('date');
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      }}
                      className="flex items-center gap-2 hover:text-foreground transition-colors bg-transparent border-none cursor-pointer text-muted-foreground text-xs font-mono uppercase"
                    >
                      Issue Date {sortBy === 'date' && (sortOrder === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                    </button>
                  </th>
                  <th className="py-5 px-6">
                    <button 
                      onClick={() => {
                        setSortBy('totalValue');
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      }}
                      className="flex items-center justify-end gap-2 hover:text-foreground transition-colors w-full bg-transparent border-none cursor-pointer text-muted-foreground text-xs font-mono uppercase"
                    >
                      Value {sortBy === 'totalValue' && (sortOrder === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                    </button>
                  </th>
                  <th className="py-5 px-6">Incoterm</th>
                  <th className="py-5 px-6 text-right">Status</th>
                  <th className="py-5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {quotations.map((q, idx) => (
                  <tr 
                    key={q.id} 
                    className="hover:bg-white/2 group cursor-pointer transition-colors"
                  >
                    <td className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(q.id)}
                        onChange={() => toggleSelect(q.id)}
                        className="rounded accent-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="py-4 px-6">
                      <Link href={`/quotations/${q.id}`} className="block">
                        <div className="flex items-center gap-2">
                          <p className="font-sans font-bold text-sm text-foreground/90 group-hover:text-blue-400 transition-colors">{q.quotationNo}</p>
                          <span className="px-1.5 py-0.5 rounded bg-muted border border-border text-[8px] text-muted-foreground">V{q.version || 1}.0</span>
                        </div>
                      </Link>
                    </td>
                    <td className="py-4 px-6 text-muted-foreground truncate max-w-[200px]">{getCustomerName(q.customerId)}</td>
                    <td className="py-4 px-6 text-muted-foreground">{formatDate(q.date)}</td>
                    <td className="py-4 px-6 text-right font-bold text-muted-foreground">
                      {formatCurrency(q.totalValue)}
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-0.5 rounded border border-border text-[9px] font-mono text-muted-foreground">{q.incoterm}</span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase border",
                        getStatusColor(q.status)
                      )}>{q.status}</span>
                    </td>
                    <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/quotations/${q.id}`}>
                          <button className="p-2 rounded hover:bg-accent text-muted-foreground hover:text-foreground bg-transparent border-none cursor-pointer" title="View details">
                            <Eye size={14} />
                          </button>
                        </Link>
                        <button 
                          onClick={(e) => handleDuplicate(q.id, e)}
                          className="p-2 rounded hover:bg-accent text-muted-foreground hover:text-foreground bg-transparent border-none cursor-pointer" 
                          title="Duplicate Proposal"
                        >
                          <Copy size={14} />
                        </button>
                        {q.status !== 'APPROVED' && q.status !== 'REVISED' && (
                          <button 
                            onClick={(e) => handleRevise(q.id, e)}
                            className="p-2 rounded hover:bg-accent text-muted-foreground hover:text-purple-400 bg-transparent border-none cursor-pointer" 
                            title="Revise version"
                          >
                            <RefreshCcw size={14} />
                          </button>
                        )}
                        <button 
                          onClick={() => softDeleteQuotation(q.id)}
                          className="p-2 rounded hover:bg-accent text-muted-foreground hover:text-rose-400 bg-transparent border-none cursor-pointer" 
                          title="Soft Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {quotations.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-muted-foreground font-mono text-xs uppercase tracking-widest">
                      No Proposal Records Matched Filters
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
    </>
  );
}

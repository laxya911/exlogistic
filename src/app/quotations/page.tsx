'use client';

import React, { useState, useEffect } from 'react';
import { MasterPage } from '@/components/layout/master-page';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Edit3, 
  Copy, 
  CheckCircle, 
  XCircle,
  FileDown,
  Printer,
  History,
  ArrowUpRight
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved'>('all');

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      const res = await fetch('/api/quotations');
      const data = await res.json();
      setQuotations(data);
    } catch (e) {
      toast.error('Failed to load quotations');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'text-emerald-400 bg-emerald-500/10';
      case 'REJECTED': return 'text-rose-400 bg-rose-500/10';
      case 'SENT': return 'text-blue-400 bg-blue-500/10';
      case 'DRAFT': return 'text-amber-400 bg-amber-500/10';
      default: return 'text-white/40 bg-white/5';
    }
  };

  const filtered = quotations.filter(q => {
    const matchesSearch = q.quotationNo.toLowerCase().includes(search.toLowerCase()) || 
                          q.customerId.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === 'all' || 
                       (activeTab === 'pending' && q.status === 'SENT') || 
                       (activeTab === 'approved' && q.status === 'APPROVED');
    return matchesSearch && matchesTab;
  });

  return (
    <MasterPage 
      title="Quotation Registry" 
      subtitle="Commercial Export Proposals"
      searchValue={search}
      onSearchChange={setSearch}
      loading={loading}
      onExport={() => toast.success('Exporting quotation matrix...')}
    >
      <div className="space-y-8">
        {/* Actions Bar */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/5">
            {['all', 'pending', 'approved'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={cn(
                  "px-6 py-2 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all",
                  activeTab === tab 
                    ? "bg-white text-black font-bold shadow-xl" 
                    : "text-white/30 hover:text-white"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
          <Link href="/quotations/new">
            <button className="flex items-center gap-2 px-6 py-2.5 bg-white text-black rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-white/90 transition-all">
              <Plus size={16} /> New Quotation
            </button>
          </Link>
        </div>

        {/* Table Container */}
        <div className="glass rounded-3xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-white/[0.02] text-white/20 uppercase tracking-widest">
                <tr>
                  <th className="px-8 py-6">Ref No.</th>
                  <th className="px-8 py-6">Customer</th>
                  <th className="px-8 py-6">Date</th>
                  <th className="px-8 py-6">Total Value</th>
                  <th className="px-8 py-6">Incoterm</th>
                  <th className="px-8 py-6">Status</th>
                  <th className="px-8 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((q, i) => (
                  <motion.tr 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={q.id} 
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded bg-white/5 text-white/40 group-hover:text-blue-400 transition-colors">
                          <FileText size={14} />
                        </div>
                        <div>
                          <p className="font-sans font-medium text-white/80 group-hover:text-white">{q.quotationNo}</p>
                          <p className="text-[9px] text-white/20 uppercase">v{q.version || 1}.0</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-white/40">{q.customerId}</td>
                    <td className="px-8 py-6 text-white/40">{formatDate(new Date(q.date))}</td>
                    <td className="px-8 py-6 font-sans font-medium">{formatCurrency(q.totalValue)}</td>
                    <td className="px-8 py-6">
                      <span className="px-2 py-0.5 rounded border border-white/10 text-[9px] font-mono text-white/40">
                        {q.incoterm}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <span className={cn("px-2.5 py-1 rounded text-[9px] font-mono font-bold tracking-widest uppercase", getStatusColor(q.status))}>
                        {q.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/quotations/${q.id}`}>
                          <button className="p-2 rounded hover:bg-white/10 text-white/40 hover:text-white" title="View Details">
                            <Eye size={16} />
                          </button>
                        </Link>
                        <button className="p-2 rounded hover:bg-white/10 text-white/40 hover:text-white" title="Duplicate">
                          <Copy size={16} />
                        </button>
                        <button className="p-2 rounded hover:bg-white/10 text-white/40 hover:text-rose-400" title="Revise">
                          <History size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filtered.length === 0 && (
            <div className="p-20 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6 text-white/10">
                <Search size={32} />
              </div>
              <p className="text-sm font-display text-white/40 italic">No quotation records match your filter criteria.</p>
            </div>
          )}
        </div>
      </div>
    </MasterPage>
  );
}

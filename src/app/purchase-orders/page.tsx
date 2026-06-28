'use client';

import React, { useState, useEffect } from 'react';
import { MasterPage } from '@/components/layout/master-page';
import { Package, FileText, Search, Plus, Filter, MoreHorizontal, Eye, ArrowUpRight } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import Link from 'next/link';

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/purchase-orders');
      const data = await res.json();
      setOrders(data);
    } catch (e) {
      toast.error('Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MasterPage 
      title="Purchase Ledger" 
      subtitle="Supplier Acquisition Control"
      searchValue={search}
      onSearchChange={setSearch}
      loading={loading}
    >
      <div className="glass rounded-3xl border border-white/5 overflow-hidden">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-white/[0.02] text-white/20 uppercase tracking-widest">
            <tr>
              <th className="px-8 py-6">PO Number</th>
              <th className="px-8 py-6">Supplier</th>
              <th className="px-8 py-6">Expected Delivery</th>
              <th className="px-8 py-6">Value</th>
              <th className="px-8 py-6">Status</th>
              <th className="px-8 py-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {orders.filter(o => o.poNo.toLowerCase().includes(search.toLowerCase())).map((o, i) => (
              <tr key={o.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <Package size={14} className="text-amber-500" />
                    <span className="font-sans font-medium text-white/80">{o.poNo}</span>
                  </div>
                </td>
                <td className="px-8 py-6 text-white/40">{o.supplierId}</td>
                <td className="px-8 py-6 text-white/40">{formatDate(new Date(o.expectedDeliveryDate))}</td>
                <td className="px-8 py-6 font-sans font-medium">{formatCurrency(o.totalValue)}</td>
                <td className="px-8 py-6">
                  <span className="px-2.5 py-1 rounded text-[9px] font-mono font-bold tracking-widest uppercase bg-amber-500/10 text-amber-400">
                    {o.status}
                  </span>
                </td>
                <td className="px-8 py-6 text-right">
                  <button className="p-2 rounded hover:bg-white/10 text-white/40 hover:text-white">
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {orders.length === 0 && (
          <div className="p-20 text-center text-white/10 italic">
            No procurement records synchronized.
          </div>
        )}
      </div>
    </MasterPage>
  );
}

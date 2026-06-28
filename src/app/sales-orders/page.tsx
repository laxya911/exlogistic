'use client';

import React, { useState, useEffect } from 'react';
import { MasterPage } from '@/components/layout/master-page';
import { CheckCircle2, FileText, Search, Plus, Filter, MoreHorizontal, Eye, ArrowUpRight } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import Link from 'next/link';

export default function SalesOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/sales-orders');
      const data = await res.json();
      setOrders(data);
    } catch (e) {
      toast.error('Failed to load sales orders');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MasterPage 
      title="Sales Order Matrix" 
      subtitle="Confirmed Export Contracts"
      searchValue={search}
      onSearchChange={setSearch}
      loading={loading}
    >
      <div className="glass rounded-3xl border border-white/5 overflow-hidden">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-white/[0.02] text-white/20 uppercase tracking-widest">
            <tr>
              <th className="px-8 py-6">Order ID</th>
              <th className="px-8 py-6">Customer</th>
              <th className="px-8 py-6">Shipment Date</th>
              <th className="px-8 py-6">Value</th>
              <th className="px-8 py-6">Status</th>
              <th className="px-8 py-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {orders.filter(o => o.orderNo.toLowerCase().includes(search.toLowerCase())).map((o, i) => (
              <tr key={o.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={14} className="text-blue-500" />
                    <span className="font-sans font-medium text-white/80">{o.orderNo}</span>
                  </div>
                </td>
                <td className="px-8 py-6 text-white/40">{o.customerId}</td>
                <td className="px-8 py-6 text-white/40">{formatDate(new Date(o.expectedShipmentDate))}</td>
                <td className="px-8 py-6 font-sans font-medium">{formatCurrency(o.totalValue)}</td>
                <td className="px-8 py-6">
                  <span className="px-2.5 py-1 rounded text-[9px] font-mono font-bold tracking-widest uppercase bg-blue-500/10 text-blue-400">
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
      </div>
    </MasterPage>
  );
}

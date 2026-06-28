'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Search, 
  Plus, 
  Filter, 
  Star, 
  Clock, 
  ShieldCheck, 
  Mail, 
  Phone, 
  FileText,
  Package,
  History,
  TrendingUp,
  Download,
  MoreVertical,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MasterPage } from '@/components/layout/master-page';
import { Supplier } from '@/types';
import { formatCurrency, cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function SupplierMasterPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('/api/suppliers');
      const data = await res.json();
      setSuppliers(data);
    } catch (e) {
      toast.error('Failed to sync vendor matrix');
    } finally {
      setLoading(false);
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.country.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MasterPage 
      title="Vendor Hub" 
      subtitle="Strategic Supply Chain Node Management"
      loading={loading}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Supplier List */}
        <div className={cn(
          "transition-all duration-500",
          selectedSupplier ? "lg:col-span-4" : "lg:col-span-12"
        )}>
          <div className="glass rounded-[2.5rem] border border-white/5 overflow-hidden">
            <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <input 
                  type="text" 
                  placeholder="Query Vendor, Region, Speciality..." 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-blue-500/50 transition-all font-mono"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button className="flex items-center justify-center gap-2 px-8 py-3 bg-blue-500 text-black rounded-2xl text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-blue-400 transition-all">
                <Plus size={16} /> New Vendor
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="text-white/20 uppercase tracking-[0.2em] border-b border-white/5">
                  <tr>
                    <th className="py-6 px-8">Vendor Node</th>
                    <th className="py-6 px-8">Origin</th>
                    <th className="py-6 px-8">Rating</th>
                    {!selectedSupplier && <th className="py-6 px-8">Avg. Lead Time</th>}
                    <th className="py-6 px-8 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredSuppliers.map((s) => (
                    <tr 
                      key={s.id} 
                      className={cn(
                        "group cursor-pointer transition-all",
                        selectedSupplier?.id === s.id ? "bg-blue-500/10" : "hover:bg-white/[0.02]"
                      )}
                      onClick={() => setSelectedSupplier(selectedSupplier?.id === s.id ? null : s)}
                    >
                      <td className="py-6 px-8">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-blue-500/40">
                            <Building2 size={20} />
                          </div>
                          <div>
                            <p className="font-sans font-bold text-sm text-white/90">{s.name}</p>
                            <p className="text-[10px] text-white/20 uppercase tracking-tighter">{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-6 px-8 text-white/40">{s.country}</td>
                      <td className="py-6 px-8">
                        <div className="flex items-center gap-1.5">
                          <Star size={12} className="text-amber-400" fill="currentColor" />
                          <span className="font-bold">{s.performanceRating}</span>
                        </div>
                      </td>
                      {!selectedSupplier && (
                        <td className="py-6 px-8 text-white/30">
                          {s.averageLeadTime} Days
                        </td>
                      )}
                      <td className="py-6 px-8 text-right">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[8px] font-bold uppercase tracking-widest">VERIFIED</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Supplier Detail View */}
        <AnimatePresence>
          {selectedSupplier && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="lg:col-span-8 space-y-8"
            >
              {/* Profile Card */}
              <div className="glass p-10 rounded-[3rem] border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8">
                  <button className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors" onClick={() => setSelectedSupplier(null)}>
                    <MoreVertical size={18} className="text-white/40" />
                  </button>
                </div>

                <div className="flex items-center gap-8 mb-12">
                  <div className="w-24 h-24 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center text-3xl font-bold text-white/10">
                    <Building2 size={48} />
                  </div>
                  <div>
                    <h2 className="text-4xl font-display font-medium tracking-tight mb-3">{selectedSupplier.name}</h2>
                    <div className="flex items-center gap-4 text-[10px] font-mono text-white/40 uppercase tracking-widest">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={14} className="text-blue-500" /> Authorized Vendor
                      </div>
                      <div className="flex items-center gap-2">
                        <Star size={14} className="text-amber-500" /> {selectedSupplier.performanceRating} Rating
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[
                    { label: 'Avg Lead Time', value: `${selectedSupplier.averageLeadTime} Days`, icon: Clock },
                    { label: 'Payment Terms', value: selectedSupplier.paymentTerms, icon: FileText },
                    { label: 'Certifications', value: selectedSupplier.certifications.join(', '), icon: ShieldCheck },
                    { label: 'Node Status', value: 'OPTIMAL', icon: TrendingUp },
                  ].map((stat, i) => (
                    <div key={i} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                      <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-1">{stat.label}</p>
                      <p className="font-sans font-bold text-sm">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance & Products */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Performance Profile */}
                <div className="glass p-10 rounded-[2.5rem] border border-white/5">
                  <h3 className="text-xl font-display font-medium mb-8">Performance Metrics</h3>
                  <div className="space-y-8">
                    {[
                      { label: 'Quality Compliance', value: 98 },
                      { label: 'Delivery Timeliness', value: 92 },
                      { label: 'Price Competitiveness', value: 85 },
                      { label: 'Communication Velocity', value: 95 },
                    ].map((metric, i) => (
                      <div key={i}>
                        <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-widest mb-3">
                          <span className="text-white/40">{metric.label}</span>
                          <span className="text-white font-bold">{metric.value}%</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 transition-all duration-1000" 
                            style={{ width: `${metric.value}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Primary Contacts */}
                <div className="glass p-10 rounded-[2.5rem] border border-white/5">
                  <h3 className="text-xl font-display font-medium mb-8">Key Personnel</h3>
                  <div className="space-y-6">
                    {selectedSupplier.contacts.map((contact, i) => (
                      <div key={i} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] transition-all">
                        <div className="flex justify-between items-center mb-4">
                          <p className="font-sans font-bold text-sm">{contact.name}</p>
                          <span className="text-[10px] font-mono text-white/20 uppercase tracking-tighter">{contact.role}</span>
                        </div>
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-3 text-[10px] font-mono text-white/40">
                            <Mail size={12} /> {contact.email}
                          </div>
                          <div className="flex items-center gap-3 text-[10px] font-mono text-white/40">
                            <Phone size={12} /> {contact.phone}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Purchase History */}
              <div className="glass p-10 rounded-[2.5rem] border border-white/5">
                <div className="flex justify-between items-center mb-10 px-4">
                  <h3 className="text-xl font-display font-medium">Acquisition History</h3>
                  <button className="flex items-center gap-2 text-[10px] font-mono uppercase text-blue-500">
                    <Download size={14} /> Full Ledger
                  </button>
                </div>
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-6 rounded-2xl bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] transition-all">
                      <div className="flex items-center gap-6">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20 group-hover:text-blue-500 transition-colors">
                          <Package size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white/90">PO-2025-00{80-i}</p>
                          <p className="text-[10px] font-mono text-white/20 uppercase">VAL: {formatCurrency(25000 + i*1500)} • IN-TRANSIT</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-mono text-white/20 uppercase mb-1">ETA</p>
                        <p className="text-sm font-bold text-blue-400">12 JUL 2025</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MasterPage>
  );
}

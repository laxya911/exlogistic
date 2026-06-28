'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Filter, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  CreditCard,
  MessageSquare,
  FileText,
  TrendingUp,
  History,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal,
  ChevronRight,
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MasterPage } from '@/components/layout/master-page';
import { Customer } from '@/types';
import { formatCurrency, cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function CustomerCRMPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      setCustomers(data);
    } catch (e) {
      toast.error('Failed to sync client matrix');
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.country.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MasterPage 
      title="Client Matrix" 
      subtitle="CRM & Relationship Intelligence"
      loading={loading}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Customer List */}
        <div className={cn(
          "transition-all duration-500",
          selectedCustomer ? "lg:col-span-4" : "lg:col-span-12"
        )}>
          <div className="glass rounded-[2.5rem] border border-white/5 overflow-hidden">
            <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <input 
                  type="text" 
                  placeholder="Identify Customer, Region, Email..." 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-blue-500/50 transition-all font-mono"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-mono uppercase tracking-widest hover:bg-white/10 transition-all">
                  <Filter size={16} /> Filter
                </button>
                <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-black rounded-2xl text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-blue-400 transition-all">
                  <UserPlus size={16} /> Onboard Client
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="text-white/20 uppercase tracking-[0.2em] border-b border-white/5">
                  <tr>
                    <th className="py-6 px-8">Client Identity</th>
                    <th className="py-6 px-8">Regional Hub</th>
                    {!selectedCustomer && <th className="py-6 px-8">Contact Node</th>}
                    <th className="py-6 px-8">Status</th>
                    <th className="py-6 px-8 text-right">Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredCustomers.map((c) => (
                    <tr 
                      key={c.id} 
                      className={cn(
                        "group cursor-pointer transition-all",
                        selectedCustomer?.id === c.id ? "bg-blue-500/10" : "hover:bg-white/[0.02]"
                      )}
                      onClick={() => setSelectedCustomer(selectedCustomer?.id === c.id ? null : c)}
                    >
                      <td className="py-6 px-8">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-white/10 flex items-center justify-center font-bold text-blue-400">
                            {c.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-sans font-bold text-sm text-white/90">{c.name}</p>
                            <p className="text-[10px] text-white/20 uppercase tracking-tighter">{c.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-6 px-8">
                        <div className="flex items-center gap-2 text-white/60">
                          <Globe size={12} className="text-blue-400/40" />
                          <span>{c.country}</span>
                        </div>
                      </td>
                      {!selectedCustomer && (
                        <td className="py-6 px-8 text-white/40">
                          {c.phone}
                        </td>
                      )}
                      <td className="py-6 px-8">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                          <span className="text-[10px] font-bold text-emerald-500/80 uppercase">TRUSTED</span>
                        </div>
                      </td>
                      <td className="py-6 px-8 text-right text-white/20">
                        {c.id}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Customer Detail View */}
        <AnimatePresence mode="wait">
          {selectedCustomer && (
            <motion.div 
              key={selectedCustomer.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="lg:col-span-8 space-y-8"
            >
              {/* Profile Header */}
              <div className="glass p-10 rounded-[3rem] border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 flex gap-3">
                  <button className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                    <MessageSquare size={18} className="text-white/40" />
                  </button>
                  <button className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors" onClick={() => setSelectedCustomer(null)}>
                    <MoreHorizontal size={18} className="text-white/40" />
                  </button>
                </div>

                <div className="flex items-center gap-8 mb-12">
                  <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-3xl font-bold text-white shadow-2xl shadow-blue-500/20">
                    {selectedCustomer.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-4xl font-display font-medium tracking-tight">{selectedCustomer.name}</h2>
                      <CheckCircle2 size={20} className="text-blue-500" />
                    </div>
                    <div className="flex items-center gap-6 text-[10px] font-mono text-white/40 uppercase tracking-widest">
                      <div className="flex items-center gap-2">
                        <MapPin size={12} /> {selectedCustomer.country}
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe size={12} /> {selectedCustomer.website || 'globaltrade.com'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Credit Limit', value: formatCurrency(selectedCustomer.creditLimit), icon: CreditCard, color: 'text-emerald-400' },
                    { label: 'Payment Terms', value: selectedCustomer.paymentTerms, icon: Clock, color: 'text-blue-400' },
                    { label: 'Open Quotations', value: '12', icon: FileText, color: 'text-amber-400' },
                    { label: 'Shipment Velocity', value: 'HIGH', icon: TrendingUp, color: 'text-violet-400' },
                  ].map((stat, i) => (
                    <div key={i} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] transition-all">
                      <stat.icon size={14} className={cn("mb-3 opacity-40", stat.color)} />
                      <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-1">{stat.label}</p>
                      <p className="font-sans font-bold text-sm">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Contacts */}
                <div className="glass p-10 rounded-[2.5rem] border border-white/5">
                  <h3 className="text-xl font-display font-medium mb-8">Node Contacts</h3>
                  <div className="space-y-6">
                    {selectedCustomer.contacts.map((contact, i) => (
                      <div key={i} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 group hover:border-blue-500/20 transition-all">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="font-sans font-bold text-sm mb-1">{contact.name}</p>
                            <p className="text-[10px] font-mono text-white/20 uppercase">{contact.role}</p>
                          </div>
                          {contact.isPrimary && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[8px] font-bold uppercase">Primary</span>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-3 text-[10px] font-mono text-white/40">
                            <Mail size={12} className="opacity-40" /> {contact.email}
                          </div>
                          <div className="flex items-center gap-3 text-[10px] font-mono text-white/40">
                            <Phone size={12} className="opacity-40" /> {contact.phone}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Communication Timeline */}
                <div className="glass p-10 rounded-[2.5rem] border border-white/5">
                  <h3 className="text-xl font-display font-medium mb-8">Intelligence Feed</h3>
                  <div className="relative space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-white/5">
                    {selectedCustomer.communicationTimeline.map((item, i) => (
                      <div key={i} className="relative pl-10">
                        <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-[#0a0a0a] border border-white/10 flex items-center justify-center z-10 text-blue-500">
                          {item.type === 'EMAIL' ? <Mail size={12} /> : <MessageSquare size={12} />}
                        </div>
                        <p className="text-[10px] font-mono text-white/20 uppercase mb-1">{new Date(item.date).toLocaleDateString()}</p>
                        <p className="text-sm font-bold text-white/90 mb-1">{item.title}</p>
                        <p className="text-xs text-white/40 leading-relaxed">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* History Table */}
              <div className="glass p-10 rounded-[2.5rem] border border-white/5">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-xl font-display font-medium">Transaction Log</h3>
                  <div className="flex gap-4">
                    <button className="text-[10px] font-mono uppercase text-blue-500">Quotations</button>
                    <button className="text-[10px] font-mono uppercase text-white/20">Shipments</button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-6 rounded-2xl bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] transition-all">
                      <div className="flex items-center gap-6">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20">
                          <FileText size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white/90">QT-2025-00{150-i}</p>
                          <p className="text-[10px] font-mono text-white/20 uppercase">VAL: {formatCurrency(12500 + i*500)} • 20GP CONTAINER</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-8">
                        <div>
                          <p className="text-[10px] font-mono text-white/20 uppercase mb-1">Status</p>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[8px] font-bold uppercase">APPROVED</span>
                        </div>
                        <button className="p-2 rounded-lg bg-white/5 group-hover:bg-blue-500 group-hover:text-black transition-all">
                          <ChevronRight size={14} />
                        </button>
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

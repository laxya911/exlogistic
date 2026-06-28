'use client';

import React, { useState, useEffect } from 'react';
import { MasterPage } from '@/components/layout/master-page';
import { 
  Ship, 
  MapPin, 
  Calendar, 
  ArrowRight, 
  Search, 
  Filter, 
  Maximize2, 
  Anchor,
  Box,
  Truck,
  CheckCircle2,
  AlertCircle,
  Clock,
  MoreVertical,
  Layers,
  Container
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import Link from 'next/link';

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      const res = await fetch('/api/shipments');
      const data = await res.json();
      setShipments(data);
    } catch (e) {
      toast.error('Failed to load shipments');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'TRANSIT': return <Ship size={16} className="text-blue-500 animate-pulse" />;
      case 'BOOKING': return <Clock size={16} className="text-amber-500" />;
      default: return <Anchor size={16} className="text-white/20" />;
    }
  };

  return (
    <MasterPage 
      title="Global Logistics Hub" 
      subtitle="Real-time Shipment Matrix"
      searchValue={search}
      onSearchChange={setSearch}
      loading={loading}
      onExport={() => toast.success('Generating freight report...')}
    >
      <div className="space-y-12">
        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'In Transit', value: '18', icon: Ship, color: 'text-blue-400' },
            { label: 'Pending Booking', value: '4', icon: Clock, color: 'text-amber-400' },
            { label: 'Cleared Customs', value: '12', icon: CheckCircle2, color: 'text-emerald-400' },
            { label: 'ETA Conflicts', value: '2', icon: AlertCircle, color: 'text-rose-400' },
          ].map((kpi, i) => (
            <div key={i} className="glass p-6 rounded-2xl border border-white/5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mb-2">{kpi.label}</p>
                <p className="text-2xl font-display font-medium">{kpi.value}</p>
              </div>
              <div className={cn("p-2 rounded-lg bg-white/5", kpi.color)}>
                <kpi.icon size={20} />
              </div>
            </div>
          ))}
        </div>

        {/* Shipment Cards */}
        <div className="grid grid-cols-1 gap-6">
          {shipments.filter(s => s.shipmentNo.toLowerCase().includes(search.toLowerCase())).map((shp, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={shp.id} 
              className="glass p-8 rounded-3xl border border-white/5 hover:border-white/10 transition-all group overflow-hidden relative"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
                {/* ID and Basic Info */}
                <div className="lg:col-span-3">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-blue-400">
                      <Container size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Shipment Ref</p>
                      <p className="font-sans font-bold text-lg">{shp.shipmentNo}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-white/5 text-[9px] font-mono text-white/40 border border-white/5">
                      20' GP
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-[9px] font-mono text-blue-400 border border-blue-500/10">
                      MAERSK LINE
                    </span>
                  </div>
                </div>

                {/* Route Visualization */}
                <div className="lg:col-span-5 flex items-center gap-6">
                  <div className="text-right flex-1">
                    <p className="text-[10px] font-mono text-white/20 uppercase">Origin</p>
                    <p className="font-display font-medium text-white/80">{shp.originPortId}</p>
                    <p className="text-[10px] font-mono text-white/40">{formatDate(new Date(shp.etd))}</p>
                  </div>
                  
                  <div className="relative flex-1 flex flex-col items-center">
                    <div className="w-full h-[1px] bg-white/10 relative">
                      <motion.div 
                        initial={{ left: '0%' }}
                        animate={{ left: shp.status === 'TRANSIT' ? '60%' : '20%' }}
                        transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
                        className="absolute -top-1.5 p-1 rounded-full bg-[#080808] border border-blue-500/40 text-blue-400"
                      >
                        <Ship size={12} />
                      </motion.div>
                    </div>
                    <p className="text-[8px] font-mono uppercase tracking-[0.2em] text-white/10 mt-3">{shp.status}</p>
                  </div>

                  <div className="flex-1">
                    <p className="text-[10px] font-mono text-white/20 uppercase">Destination</p>
                    <p className="font-display font-medium text-white/80">{shp.destinationPortId}</p>
                    <p className="text-[10px] font-mono text-white/40">{formatDate(new Date(shp.eta))}</p>
                  </div>
                </div>

                {/* Status and Progress */}
                <div className="lg:col-span-2">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(shp.status)}
                    <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-white/60">
                      {shp.status}
                    </span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-1000" 
                      style={{ width: shp.status === 'TRANSIT' ? '65%' : '20%' }}
                    ></div>
                  </div>
                </div>

                {/* Actions */}
                <div className="lg:col-span-2 flex justify-end gap-2">
                  <Link href={`/shipments/${shp.id}`}>
                    <button className="p-3 rounded-xl bg-white/5 border border-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all">
                      <Maximize2 size={18} />
                    </button>
                  </Link>
                  <button className="p-3 rounded-xl bg-white/5 border border-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all">
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>

              {/* Background Decoration */}
              <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-500/[0.02] to-transparent pointer-events-none"></div>
            </motion.div>
          ))}
        </div>
      </div>
    </MasterPage>
  );
}

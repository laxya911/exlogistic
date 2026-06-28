'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { MasterPage } from '@/components/layout/master-page';
import { 
  Ship, 
  MapPin, 
  Calendar, 
  ArrowLeft, 
  Anchor,
  Box,
  Truck,
  CheckCircle2,
  AlertCircle,
  Clock,
  MoreVertical,
  Layers,
  Container,
  FileText,
  DollarSign,
  TrendingUp,
  Download,
  Info,
  History
} from 'lucide-react';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ShipmentDetailPage() {
  const params = useParams();
  const [shipment, setShipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchShipment();
  }, [params.id]);

  const fetchShipment = async () => {
    try {
      const res = await fetch(`/api/shipments/${params.id}`);
      const data = await res.json();
      setShipment(data);
    } catch (e) {
      toast.error('Failed to resolve shipment node');
    } finally {
      setLoading(false);
    }
  };

  if (!shipment && !loading) return (
    <MasterPage title="Access Denied" subtitle="Shipment Node Not Found">
      <div className="py-24 text-center">
        <AlertCircle size={48} className="mx-auto mb-6 text-rose-500/20" />
        <p className="text-white/40 font-mono text-sm uppercase tracking-widest">Invalid Matrix Coordinate</p>
        <Link href="/shipments" className="mt-8 inline-block text-blue-500 underline">Return to Logistics Hub</Link>
      </div>
    </MasterPage>
  );

  return (
    <MasterPage 
      title={shipment?.shipmentNo || 'Shipment Node'} 
      subtitle={`Tracking ID: ${params.id}`}
      loading={loading}
    >
      <div className="space-y-12">
        {/* Navigation & Header */}
        <div className="flex justify-between items-center">
          <Link href="/shipments">
            <button className="flex items-center gap-2 text-[10px] font-mono text-white/40 uppercase tracking-widest hover:text-white transition-colors">
              <ArrowLeft size={14} /> Back to Hub
            </button>
          </Link>
          <div className="flex gap-4">
            <button className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-mono uppercase tracking-widest hover:bg-white/10">
              <Download size={14} className="inline mr-2" /> BL Copy
            </button>
            <button className="px-6 py-2 bg-blue-500 text-black rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-blue-400">
              Update Status
            </button>
          </div>
        </div>

        {/* Global Route Status */}
        <div className="glass p-12 rounded-[3rem] border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-[0.02]">
            <Ship size={120} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-12 relative z-10">
            <div className="text-center md:text-left">
              <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest mb-2">Port of Loading (POL)</p>
              <h3 className="text-4xl font-display font-bold tracking-tight mb-4">{shipment?.originPortId}</h3>
              <div className="flex items-center justify-center md:justify-start gap-4">
                <div className="text-xs text-white/40">
                  <p className="font-mono uppercase text-[9px] mb-1">ETD Date</p>
                  <p className="font-bold text-white/60">{formatDate(new Date(shipment?.etd))}</p>
                </div>
                <div className="w-[1px] h-8 bg-white/5"></div>
                <div className="text-xs text-white/40">
                  <p className="font-mono uppercase text-[9px] mb-1">Status</p>
                  <p className="font-bold text-emerald-500">DEPARTED</p>
                </div>
              </div>
            </div>

            <div className="relative flex flex-col items-center">
              <div className="w-full h-[2px] bg-white/5 relative">
                <motion.div 
                  initial={{ left: '0%' }}
                  animate={{ left: '65%' }}
                  transition={{ duration: 2.5, ease: "easeOut" }}
                  className="absolute -top-4 -translate-x-1/2 p-2 rounded-full bg-[#080808] border border-blue-500 text-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                >
                  <Ship size={20} />
                </motion.div>
              </div>
              <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-blue-400 mt-10 font-bold">In Transit</p>
              <p className="text-[8px] font-mono text-white/10 mt-2 uppercase tracking-widest">MV ATLANTIC MARINER / V.24N</p>
            </div>

            <div className="text-center md:text-right">
              <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest mb-2">Port of Discharge (POD)</p>
              <h3 className="text-4xl font-display font-bold tracking-tight mb-4">{shipment?.destinationPortId}</h3>
              <div className="flex items-center justify-center md:justify-end gap-4">
                <div className="text-xs text-white/40">
                  <p className="font-mono uppercase text-[9px] mb-1">ETA Date</p>
                  <p className="font-bold text-white/60">{formatDate(new Date(shipment?.eta))}</p>
                </div>
                <div className="w-[1px] h-8 bg-white/5"></div>
                <div className="text-xs text-white/40">
                  <p className="font-mono uppercase text-[9px] mb-1">Time Remaining</p>
                  <p className="font-bold text-amber-500">12 DAYS</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-8 border-b border-white/5">
          {[
            { id: 'overview', label: 'Matrix Overview', icon: Layers },
            { id: 'cargo', label: 'Container Load', icon: Box },
            { id: 'documents', label: 'Digital Assets', icon: FileText },
            { id: 'financials', label: 'Yield Analytics', icon: DollarSign },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 pb-6 text-[10px] font-mono font-bold uppercase tracking-[0.2em] transition-all relative",
                activeTab === tab.id ? "text-blue-500" : "text-white/20 hover:text-white/40"
              )}
            >
              <tab.icon size={14} />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
              )}
            </button>
          ))}
        </div>

        {/* Dynamic Content Area */}
        <div className="min-h-[500px]">
          {activeTab === 'overview' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {/* Timeline */}
                <div className="glass p-10 rounded-[2.5rem] border border-white/5">
                  <h3 className="text-xl font-display font-medium mb-10">Event Intelligence</h3>
                  <div className="space-y-10 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-white/5">
                    {[
                      { date: 'JUN 24, 2025', title: 'Vessel Departed Origin', desc: 'MV Atlantic Mariner has cleared Tokyo Port. AIS tracking active.', status: 'COMPLETED' },
                      { date: 'JUN 22, 2025', title: 'Container Loaded', desc: 'Verified gross mass recorded at 18,400 KG.', status: 'COMPLETED' },
                      { date: 'JUN 20, 2025', title: 'Customs Clearance', desc: 'Export declaration approved by Japan Customs.', status: 'COMPLETED' },
                      { date: 'JUL 06, 2025', title: 'Estimated Arrival', desc: 'Anticipated port clearance at Los Angeles Terminal 4.', status: 'PENDING' },
                    ].map((event, i) => (
                      <div key={i} className="relative pl-10">
                        <div className={cn(
                          "absolute left-0 top-1 w-6 h-6 rounded-full bg-[#080808] border flex items-center justify-center z-10 transition-colors",
                          event.status === 'COMPLETED' ? "border-emerald-500 text-emerald-500" : "border-white/10 text-white/10"
                        )}>
                          {event.status === 'COMPLETED' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                        </div>
                        <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-1">{event.date}</p>
                        <p className="text-sm font-bold mb-1">{event.title}</p>
                        <p className="text-xs text-white/40 leading-relaxed">{event.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="glass p-8 rounded-[2rem] border border-white/5">
                  <h3 className="text-lg font-display font-medium mb-6">Booking Details</h3>
                  <div className="space-y-6">
                    {[
                      { label: 'Carrier SCAC', value: 'MAEU (Maersk Line)' },
                      { label: 'Vessel Name', value: 'MV ATLANTIC MARINER' },
                      { label: 'Voyage No', value: '2406N' },
                      { label: 'MBL Number', value: 'MAEU667788990' },
                      { label: 'HBL Number', value: 'EXL-2025-7722' },
                    ].map((detail, i) => (
                      <div key={i}>
                        <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-1">{detail.label}</p>
                        <p className="text-sm font-medium">{detail.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass p-8 rounded-[2rem] border border-white/5 bg-blue-500/5">
                  <div className="flex items-center gap-4 mb-6">
                    <Info size={20} className="text-blue-500" />
                    <h3 className="text-lg font-display font-medium">System Alert</h3>
                  </div>
                  <p className="text-xs text-white/40 leading-relaxed">
                    Port congestion reported at destination. Potential 2-day delay for terminal berthing. 
                    Neural engine has updated ETA automatically.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'cargo' && (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="glass p-12 rounded-[3rem] border border-white/5 text-center py-24">
              <Box size={48} className="mx-auto mb-8 text-white/10" />
              <h3 className="text-2xl font-display font-medium mb-4">Container Load Matrix</h3>
              <p className="text-sm text-white/20 font-mono uppercase tracking-[0.2em] mb-12">Visual Stowage Plan Unavailable in Preview</p>
              <div className="max-w-2xl mx-auto grid grid-cols-2 gap-6 text-left">
                {[
                  { label: 'Gross Weight', value: '18,450.00 KG' },
                  { label: 'Net Weight', value: '17,200.00 KG' },
                  { label: 'Total Volume', value: '28.50 CBM' },
                  { label: 'Package Count', value: '42 Pallets' },
                  { label: 'Hazmat Status', value: 'NON-HAZARDOUS' },
                  { label: 'Seal Number', value: 'ABC-77665544' },
                ].map((item, i) => (
                  <div key={i} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                    <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-1">{item.label}</p>
                    <p className="font-sans font-bold text-lg">{item.value}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </MasterPage>
  );
}

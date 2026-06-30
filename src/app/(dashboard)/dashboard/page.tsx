'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart3, Package, Ship, Calculator, TrendingUp, Box, Truck,
  CheckCircle2, ListTodo, FileText, Clock, ArrowUpRight, ChevronRight,
  History, RefreshCw, Calendar as CalendarIcon, Filter
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { PageHeaderUpdater } from '@/components/layout/page-context';
import { formatCurrency, cn } from '@/lib/utils';
import { toast } from 'sonner';

type Timeframe = 'MONTH' | 'QUARTER' | 'YEAR' | 'CUSTOM';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [activeTab, setActiveTab] = useState('Overview');
  const [timeframe, setTimeframe] = useState<Timeframe>('MONTH');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setShowCustomPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tabs = ['Overview', 'Sales & Pipeline', 'Logistics', 'Financials'];
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#8b5cf6'];

  useEffect(() => {
    if (timeframe !== 'CUSTOM' || (timeframe === 'CUSTOM' && customStart && customEnd)) {
      fetchDashboardData();
    }
  }, [timeframe, customStart, customEnd]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      let url = `/api/dashboard/operational?timeframe=${timeframe}`;
      if (timeframe === 'CUSTOM' && customStart && customEnd) {
        url += `&customStart=${customStart}&customEnd=${customEnd}`;
      }
      
      const res = await fetch(url);
      const json = await res.json();
      setData(json);
    } catch (e) {
      toast.error('Failed to sync with matrix');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDashboardData();
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/70">Aggregating Matrix Data...</p>
        </div>
      </div>
    );
  }

  const kpis = [
    { label: 'Total Revenue', value: formatCurrency(data.stats.revenue), icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-500/10', link: '/reports' },
    { label: 'Total Profit', value: formatCurrency(data.stats.profit), icon: BarChart3, color: 'text-emerald-500', bg: 'bg-emerald-500/10', link: '/reports' },
    { label: 'Active Shipments', value: data.stats.shipmentsInProgress, icon: Ship, color: 'text-indigo-500', bg: 'bg-indigo-500/10', link: '/shipments' },
    { label: 'Total Containers', value: data.stats.containers, icon: Box, color: 'text-violet-500', bg: 'bg-violet-500/10', link: '/shipments' },
  ];

  return (
    <>
      <PageHeaderUpdater title="ExLogis Executive" subtitle="Matrix Command Center" />
      <div className="space-y-8 pb-20">
        {/* Controls Row */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          {/* Tabs */}
          <div className="flex p-1 bg-white/5 rounded-2xl border border-white/5">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-xs font-medium transition-all",
                  activeTab === tab ? "bg-white/10 text-white shadow-md" : "text-white/50 hover:text-white/80 hover:bg-white/5"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Timeframe & Actions */}
          <div className="flex items-center gap-3">
            <div ref={datePickerRef} className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1 relative">
              {(['MONTH', 'QUARTER', 'YEAR', 'CUSTOM'] as Timeframe[]).map((tf) => (
                <button
                  key={tf}
                  onClick={() => {
                    setTimeframe(tf);
                    if (tf === 'CUSTOM') setShowCustomPicker(true);
                    else setShowCustomPicker(false);
                  }}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest transition-colors",
                    timeframe === tf ? "bg-blue-500 text-white" : "text-white/50 hover:text-white/90 hover:bg-white/5"
                  )}
                >
                  {tf === 'CUSTOM' ? <Filter size={12} className="inline mr-1" /> : null}
                  {tf}
                </button>
              ))}
              
              {/* Custom Date Picker Dropdown */}
              <AnimatePresence>
                {showCustomPicker && timeframe === 'CUSTOM' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full right-0 mt-2 p-4 bg-[#0a0a0a]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl z-50 w-64"
                  >
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-mono text-white/50 uppercase tracking-widest block mb-1">Start Date</label>
                        <input 
                          type="date" 
                          value={customStart}
                          onChange={e => setCustomStart(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs font-mono text-white focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-white/50 uppercase tracking-widest block mb-1">End Date</label>
                        <input 
                          type="date" 
                          value={customEnd}
                          onChange={e => setCustomEnd(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs font-mono text-white focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <button 
                        onClick={() => setShowCustomPicker(false)}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white text-[10px] font-mono font-bold uppercase tracking-widest py-2 rounded-lg transition-colors mt-2"
                      >
                        Apply Filter
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} className={cn(isRefreshing && "animate-spin text-blue-500")} />
            </button>
          </div>
        </div>

        {/* Tab Content Routing */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'Overview' && <OverviewTab data={data} kpis={kpis} COLORS={COLORS} />}
            {activeTab === 'Sales & Pipeline' && <SalesPipelineTab data={data} />}
            {activeTab === 'Logistics' && <LogisticsTab data={data} COLORS={COLORS} />}
            {activeTab === 'Financials' && <FinancialsTab data={data} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}

// -------------------------------------------------------------
// TAB COMPONENTS
// -------------------------------------------------------------

function OverviewTab({ data, kpis, COLORS }: { data: any, kpis: any[], COLORS: string[] }) {
  return (
    <div className="space-y-8">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <Link href={kpi.link} key={i}>
            <div className="glass p-8 rounded-4xl border border-white/5 relative overflow-hidden group hover:border-white/20 hover:bg-white/5 transition-all cursor-pointer h-full">
              <div className="flex justify-between items-start mb-6">
                <div className={`p-3 rounded-xl ${kpi.bg} ${kpi.color}`}>
                  <kpi.icon size={22} />
                </div>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight size={14} className="text-white/90" />
                </div>
              </div>
              <p className="text-3xl font-display font-medium tracking-tight mb-2 text-white">{kpi.value}</p>
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/70">{kpi.label}</p>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-white/10 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 glass p-8 lg:p-10 rounded-[2.5rem] border border-white/5">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-xl font-display font-medium mb-1">Revenue Trend</h3>
              <p className="text-[10px] font-mono text-white/70 uppercase tracking-widest">Financial Performance Index</p>
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.charts.revenueTrend}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                <XAxis dataKey="month" stroke="#555" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#555" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #222', borderRadius: '12px', fontSize: '12px' }} formatter={(value: any) => formatCurrency(Number(value))} />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 glass p-8 lg:p-10 rounded-[2.5rem] border border-white/5">
          <h3 className="text-xl font-display font-medium mb-1">System Health</h3>
          <p className="text-[10px] font-mono text-white/70 uppercase tracking-widest mb-8">Matrix Audit Log</p>
          
          <div className="space-y-6">
            {data.auditLogs?.length > 0 ? data.auditLogs.map((log: any, i: number) => (
              <div key={i} className="flex gap-4 relative group">
                <div className="absolute left-[15px] top-8 bottom-[-24px] w-px bg-white/5 group-last:hidden"></div>
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-white/70 z-10">
                  <History size={14} />
                </div>
                <div className="pb-2">
                  <p className="text-[9px] font-mono text-white/80 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                    <Clock size={10} /> {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {log.userName}
                  </p>
                  <p className="text-xs text-white/80 leading-relaxed">
                    <span className="uppercase font-mono text-[9px] mr-2 px-1.5 py-0.5 rounded border text-blue-400 bg-blue-500/10 border-blue-500/20">[{log.action}]</span>
                    {log.details}
                  </p>
                </div>
              </div>
            )) : (
              <div className="py-12 text-center text-white/70"><p className="text-[10px] font-mono uppercase tracking-widest">No recent audit logs</p></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SalesPipelineTab({ data }: { data: any }) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales Pipeline */}
        <div className="glass p-8 lg:p-10 rounded-[2.5rem] border border-white/5">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-display font-medium">Sales Pipeline</h3>
            <Link href="/sales-orders" className="text-[10px] font-mono uppercase text-blue-500 hover:underline">All Sales</Link>
          </div>
          <div className="space-y-4">
            {data.pipeline.sales.length > 0 ? data.pipeline.sales.slice(0, 10).map((so: any) => (
              <div key={so.id} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl"><CheckCircle2 size={16} /></div>
                  <div>
                    <p className="font-bold text-sm text-white">{so.no}</p>
                    <p className="text-[10px] font-mono uppercase text-white/50">{so.status}</p>
                  </div>
                </div>
                <p className="font-mono text-sm font-bold text-emerald-400">{formatCurrency(so.value)}</p>
              </div>
            )) : <div className="p-8 text-center text-white/50 text-sm">No sales data in timeframe.</div>}
          </div>
        </div>

        {/* Purchase Pipeline */}
        <div className="glass p-8 lg:p-10 rounded-[2.5rem] border border-white/5">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-display font-medium">Purchase Pipeline</h3>
            <Link href="/purchase-orders" className="text-[10px] font-mono uppercase text-blue-500 hover:underline">All Purchases</Link>
          </div>
          <div className="space-y-4">
            {data.pipeline.purchases.length > 0 ? data.pipeline.purchases.slice(0, 10).map((po: any) => (
              <div key={po.id} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl"><Package size={16} /></div>
                  <div>
                    <p className="font-bold text-sm text-white">{po.no}</p>
                    <p className="text-[10px] font-mono uppercase text-white/50">{po.status}</p>
                  </div>
                </div>
                <p className="font-mono text-sm font-bold text-rose-400">-{formatCurrency(po.value)}</p>
              </div>
            )) : <div className="p-8 text-center text-white/50 text-sm">No purchase data in timeframe.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function LogisticsTab({ data, COLORS }: { data: any, COLORS: string[] }) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Shipment Status Distribution */}
        <div className="lg:col-span-4 glass p-8 lg:p-10 rounded-[2.5rem] border border-white/5">
          <h3 className="text-xl font-display font-medium mb-1">Status Distribution</h3>
          <p className="text-[10px] font-mono text-white/70 uppercase tracking-widest mb-10">Current Freight Status</p>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.charts.shipmentStatus} innerRadius={70} outerRadius={90} paddingAngle={5} dataKey="value">
                  {data.charts.shipmentStatus.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #222', borderRadius: '12px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4 mt-6">
            {data.charts.shipmentStatus.map((s: any, i: number) => (
              <div key={i} className="flex justify-between items-center text-[10px] font-mono uppercase tracking-tighter">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                  <span className="text-white/90">{s.name}</span>
                </div>
                <span className="text-white font-bold bg-white/5 px-2 py-0.5 rounded">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Global Shipment Log */}
        <div className="lg:col-span-8 glass p-8 lg:p-10 rounded-[2.5rem] border border-white/5">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-display font-medium">Global Shipment Log</h3>
            <Link href="/shipments" className="text-[10px] font-mono uppercase text-blue-500 hover:underline">All Freight</Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono whitespace-nowrap">
              <thead className="text-white/70 uppercase tracking-widest border-b border-white/10">
                <tr>
                  <th className="pb-4 px-4 font-normal">Tracking ID</th>
                  <th className="pb-4 px-4 font-normal">Transit Route</th>
                  <th className="pb-4 px-4 font-normal">Status</th>
                  <th className="pb-4 px-4 text-right font-normal">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.recentShipments.length > 0 ? data.recentShipments.map((shp: any, i: number) => (
                  <tr key={i} className="group hover:bg-white/2 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/70 group-hover:text-blue-400 group-hover:border-blue-400/30 transition-colors">
                          <Box size={14} />
                        </div>
                        <span className="font-sans font-bold text-sm text-white/90">{shp.shipmentNo}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2 text-white/90">
                        <span className="px-2 py-0.5 rounded bg-white/5">{shp.originPortId}</span>
                        <ChevronRight size={10} className="text-white/70" />
                        <span className="px-2 py-0.5 rounded bg-white/5">{shp.destinationPortId}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={cn(
                        "px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest border",
                        shp.status === 'DELIVERED' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        shp.status === 'TRANSIT' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                        "bg-white/5 text-white/90 border-white/10"
                      )}>{shp.status}</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link href={`/shipments/${shp.id}`}>
                        <button className="p-2.5 rounded-lg bg-white/5 hover:bg-blue-500/10 hover:text-blue-400 text-white/70 transition-colors border-none cursor-pointer">
                          <ArrowUpRight size={14} />
                        </button>
                      </Link>
                    </td>
                  </tr>
                )) : <tr><td colSpan={4} className="py-8 text-center text-white/50 text-sm">No shipments in this timeframe.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function FinancialsTab({ data }: { data: any }) {
  return (
    <div className="glass p-8 lg:p-10 rounded-[2.5rem] border border-white/5">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h3 className="text-xl font-display font-medium mb-1">Detailed Revenue & Profit Margin Analysis</h3>
          <p className="text-[10px] font-mono text-white/70 uppercase tracking-widest">Financial Performance Index</p>
        </div>
      </div>
      <div className="h-[450px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.charts.revenueTrend}>
            <defs>
              <linearGradient id="colorRev2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorProf2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
            <XAxis dataKey="month" stroke="#555" fontSize={12} axisLine={false} tickLine={false} />
            <YAxis stroke="#555" fontSize={12} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value/1000}k`} />
            <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #222', borderRadius: '12px', fontSize: '12px' }} formatter={(value: any) => formatCurrency(Number(value))} />
            <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev2)" name="Total Revenue" />
            <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorProf2)" name="Gross Profit" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

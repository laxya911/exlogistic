'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Package, 
  Ship, 
  Anchor, 
  Calculator, 
  TrendingUp,
  Box,
  Truck,
  Globe,
  Bell,
  CheckCircle2,
  ListTodo,
  FileText,
  Clock,
  ArrowUpRight,
  ChevronRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { motion } from 'motion/react';
import Link from 'next/link';
import { MasterPage } from '@/components/layout/master-page';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/dashboard/operational');
      const json = await res.json();
      setData(json);
    } catch (e) {
      toast.error('Failed to sync with matrix');
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#8b5cf6'];

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/20">Initiating Neural Uplink...</p>
        </div>
      </div>
    );
  }

  const kpis = [
    { label: 'Total Revenue', value: formatCurrency(data.stats.revenue), icon: TrendingUp, color: 'text-blue-500' },
    { label: 'Total Profit', value: formatCurrency(data.stats.profit), icon: BarChart3, color: 'text-emerald-500' },
    { label: 'Shipments', value: data.stats.shipmentsInProgress, icon: Ship, color: 'text-indigo-500' },
    { label: 'Containers', value: data.stats.containers, icon: Box, color: 'text-violet-500' },
  ];

  return (
    <MasterPage 
      title="ExLogis Executive" 
      subtitle="Matrix Command Center"
      loading={loading}
    >
      <div className="space-y-12">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.map((kpi, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass p-8 rounded-3xl border border-white/5 relative overflow-hidden group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className={`p-2.5 rounded-xl bg-white/5 ${kpi.color}`}>
                  <kpi.icon size={22} />
                </div>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight size={14} className="text-white/40" />
                </div>
              </div>
              <p className="text-3xl font-display font-medium tracking-tight mb-2">{kpi.value}</p>
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40">{kpi.label}</p>
              
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/5 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Revenue Trend */}
          <div className="lg:col-span-8 glass p-10 rounded-[2.5rem] border border-white/5">
            <div className="flex justify-between items-center mb-12">
              <div>
                <h3 className="text-xl font-display font-medium mb-1">Revenue & Profit Trend</h3>
                <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Financial Performance Index</p>
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
                    <linearGradient id="colorProf" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                  <XAxis dataKey="month" stroke="#333" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="#333" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#000', border: '1px solid #222', borderRadius: '12px', fontSize: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                  <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorProf)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Shipment Pipeline */}
          <div className="lg:col-span-4 glass p-10 rounded-[2.5rem] border border-white/5">
            <h3 className="text-xl font-display font-medium mb-1">Pipeline Distribution</h3>
            <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest mb-10">Current Freight Status</p>
            
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.charts.shipmentStatus}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.charts.shipmentStatus.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#000', border: '1px solid #222', borderRadius: '12px', fontSize: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-4 mt-6">
              {data.charts.shipmentStatus.map((s: any, i: number) => (
                <div key={i} className="flex justify-between items-center text-[10px] font-mono uppercase tracking-tighter">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                    <span className="text-white/40">{s.name}</span>
                  </div>
                  <span className="text-white font-bold">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Secondary Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pending Tasks */}
          <div className="glass p-10 rounded-[2.5rem] border border-white/5">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-xl font-display font-medium">Pending Directives</h3>
              <Link href="/tasks" className="text-[10px] font-mono uppercase text-blue-500 hover:underline">All Tasks</Link>
            </div>
            <div className="space-y-6">
              {data.pendingTasks.map((task: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 group hover:border-white/20 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20 group-hover:text-blue-500 transition-colors">
                      <ListTodo size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{task.title}</p>
                      <p className="text-[10px] font-mono text-white/20 uppercase">{task.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-mono text-rose-400/60 uppercase">Due {new Date(task.dueDate).toLocaleDateString()}</p>
                    <span className={`text-[8px] font-bold px-2 py-0.5 rounded bg-white/5 border border-white/10 ${
                      task.priority === 'HIGH' ? 'text-rose-400' : 'text-amber-400'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Country Distribution */}
          <div className="glass p-10 rounded-[2.5rem] border border-white/5">
            <h3 className="text-xl font-display font-medium mb-10">Global Distribution</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.charts.countryDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" horizontal={false} />
                  <XAxis type="number" stroke="#333" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#fff" fontSize={10} axisLine={false} tickLine={false} width={80} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: '#000', border: '1px solid #222', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Audit Log and Recent Shipments */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Recent Shipments */}
          <div className="lg:col-span-8 glass p-10 rounded-[2.5rem] border border-white/5 overflow-hidden">
            <div className="flex justify-between items-center mb-10 px-4">
              <h3 className="text-xl font-display font-medium">Global Shipment Log</h3>
              <Link href="/shipments" className="text-[10px] font-mono uppercase text-blue-500 hover:underline">Full Analytics</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="text-white/20 uppercase tracking-widest border-b border-white/5">
                  <tr>
                    <th className="pb-6 px-4">Container ID</th>
                    <th className="pb-6 px-4">Route</th>
                    <th className="pb-6 px-4">Status</th>
                    <th className="pb-6 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.recentShipments.slice(0, 5).map((shp: any, i: number) => (
                    <tr key={i} className="group hover:bg-white/[0.01] transition-colors">
                      <td className="py-6 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/20 group-hover:text-blue-500 transition-colors">
                            <Box size={14} />
                          </div>
                          <span className="font-sans font-bold text-sm text-white/80">{shp.shipmentNo}</span>
                        </div>
                      </td>
                      <td className="py-6 px-4">
                        <div className="flex items-center gap-2 text-white/40">
                          <span>{shp.originPortId}</span>
                          <ChevronRight size={10} />
                          <span>{shp.destinationPortId}</span>
                        </div>
                      </td>
                      <td className="py-6 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/10 text-[9px] font-bold uppercase tracking-widest">
                          {shp.status}
                        </span>
                      </td>
                      <td className="py-6 px-4 text-right">
                        <Link href={`/shipments/${shp.id}`}>
                          <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                            <ArrowUpRight size={14} className="text-white/40" />
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit Log */}
          <div className="lg:col-span-4 glass p-10 rounded-[2.5rem] border border-white/5">
            <h3 className="text-xl font-display font-medium mb-10 text-amber-500/80">Security Audit Matrix</h3>
            <div className="space-y-6">
              {data.auditLogs?.map((log: any, i: number) => (
                <div key={i} className="flex gap-4 relative pb-6 border-b border-white/5 last:border-0 last:pb-0">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 text-white/20">
                    <History size={14} />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-white/20 uppercase tracking-tighter mb-1">
                      {new Date(log.createdAt).toLocaleTimeString()} • {log.user}
                    </p>
                    <p className="text-xs text-white/60 font-medium leading-relaxed">
                      <span className="text-blue-400 uppercase font-mono text-[9px] mr-1">[{log.action}]</span>
                      {log.details}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MasterPage>
  );
}


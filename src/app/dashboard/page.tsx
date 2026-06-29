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
  ChevronRight,
  History,
  RefreshCw
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
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { MasterPage } from '@/components/layout/master-page';
import { formatCurrency, cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDashboardData();
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#8b5cf6'];

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/70">Initiating Neural Uplink...</p>
        </div>
      </div>
    );
  }

  const kpis = [
    { label: 'Total Revenue', value: formatCurrency(data.stats.revenue), icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Total Profit', value: formatCurrency(data.stats.profit), icon: BarChart3, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Active Shipments', value: data.stats.shipmentsInProgress, icon: Ship, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { label: 'Total Containers', value: data.stats.containers, icon: Box, color: 'text-violet-500', bg: 'bg-violet-500/10' },
  ];

  return (
    <MasterPage 
      title="ExLogis Executive" 
      subtitle="Matrix Command Center"
      loading={loading}
    >
      <div className="space-y-8 pb-20">
        {/* Top Header Actions */}
        <div className="flex justify-end mb-4">
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={cn(isRefreshing && "animate-spin text-blue-500")} /> 
            {isRefreshing ? 'Syncing...' : 'Sync Matrix'}
          </button>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.map((kpi, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass p-8 rounded-4xl border border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors"
            >
              <div className="flex justify-between items-start mb-6">
                <div className={`p-3 rounded-xl ${kpi.bg} ${kpi.color}`}>
                  <kpi.icon size={22} />
                </div>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight size={14} className="text-white/70" />
                </div>
              </div>
              <p className="text-3xl font-display font-medium tracking-tight mb-2 text-white">{kpi.value}</p>
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/70">{kpi.label}</p>
              
              <div className="absolute bottom-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-white/5 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Revenue Trend */}
          <div className="lg:col-span-8 glass p-8 lg:p-10 rounded-[2.5rem] border border-white/5">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="text-xl font-display font-medium mb-1">Revenue & Profit Trend</h3>
                <p className="text-[10px] font-mono text-white/70 uppercase tracking-widest">Financial Performance Index</p>
              </div>
              <Link href="/reports" className="text-[10px] font-mono uppercase text-blue-500 hover:underline">Full Analytics</Link>
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
                  <XAxis dataKey="month" stroke="#555" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="#555" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#000', border: '1px solid #222', borderRadius: '12px', fontSize: '12px' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value: any) => formatCurrency(Number(value))}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                  <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorProf)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Shipment Pipeline */}
          <div className="lg:col-span-4 glass p-8 lg:p-10 rounded-[2.5rem] border border-white/5">
            <h3 className="text-xl font-display font-medium mb-1">Pipeline Distribution</h3>
            <p className="text-[10px] font-mono text-white/70 uppercase tracking-widest mb-10">Current Freight Status</p>
            
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.charts.shipmentStatus}
                    innerRadius={70}
                    outerRadius={90}
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
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                    <span className="text-white/90">{s.name}</span>
                  </div>
                  <span className="text-white font-bold bg-white/5 px-2 py-0.5 rounded">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Secondary Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pending Tasks */}
          <div className="glass p-8 lg:p-10 rounded-[2.5rem] border border-white/5">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-display font-medium">Pending Directives</h3>
              <Link href="/tasks" className="text-[10px] font-mono uppercase text-blue-500 hover:underline">All Tasks</Link>
            </div>
            
            {data.pendingTasks.length === 0 ? (
              <div className="py-12 text-center text-white/70">
                <CheckCircle2 size={32} className="mx-auto mb-4" />
                <p className="text-[10px] font-mono uppercase tracking-widest">All caught up</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.pendingTasks.map((task: any, i: number) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl bg-white/2 border border-white/5 group hover:border-white/20 hover:bg-white/4 transition-all gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/70 group-hover:text-blue-400 group-hover:border-blue-400/30 transition-colors shrink-0">
                        <ListTodo size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">{task.title}</p>
                        <p className="text-[10px] font-mono text-white/80 uppercase tracking-widest">{task.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-2">
                      <span className={cn(
                        "text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest border",
                        task.priority === 'HIGH' ? 'text-rose-400 bg-rose-400/10 border-rose-400/20' : 
                        task.priority === 'MEDIUM' ? 'text-amber-400 bg-amber-400/10 border-amber-400/20' : 
                        'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
                      )}>
                        {task.priority}
                      </span>
                      <p className="text-[9px] font-mono text-white/80 uppercase tracking-widest">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Country Distribution */}
          <div className="glass p-8 lg:p-10 rounded-[2.5rem] border border-white/5">
            <h3 className="text-xl font-display font-medium mb-1">Global Trade Routes</h3>
            <p className="text-[10px] font-mono text-white/70 uppercase tracking-widest mb-10">Destination Country Density</p>
            
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.charts.countryDistribution} layout="vertical" margin={{ left: 0, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" horizontal={false} />
                  <XAxis type="number" stroke="#555" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#fff" fontSize={10} axisLine={false} tickLine={false} width={80} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: '#000', border: '1px solid #222', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                    {data.charts.countryDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Audit Log and Recent Shipments */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Recent Shipments */}
          <div className="lg:col-span-8 glass p-8 lg:p-10 rounded-[2.5rem] border border-white/5 overflow-hidden">
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
                  {data.recentShipments.map((shp: any, i: number) => (
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
                        )}>
                          {shp.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Link href={`/shipments/${shp.id}`}>
                          <button className="p-2.5 rounded-lg bg-white/5 hover:bg-blue-500/10 hover:text-blue-400 text-white/70 transition-colors border-none cursor-pointer">
                            <ArrowUpRight size={14} />
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
          <div className="lg:col-span-4 glass p-8 lg:p-10 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl -z-10 rounded-full"></div>
            
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-display font-medium text-amber-500/90">Audit Matrix</h3>
              <Link href="/dashboard/audit-logs" className="text-[10px] font-mono uppercase text-amber-500/50 hover:text-amber-500 hover:underline">Full Logs</Link>
            </div>
            
            <div className="space-y-6">
              {data.auditLogs?.length > 0 ? data.auditLogs.map((log: any, i: number) => (
                <div key={i} className="flex gap-4 relative group">
                  <div className="absolute left-[15px] top-8 bottom-[-24px] w-px bg-white/5 group-last:hidden"></div>
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-white/70 z-10">
                    <History size={14} />
                  </div>
                  <div className="pb-2">
                    <p className="text-[9px] font-mono text-white/80 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                      <Clock size={10} /> {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} • {log.userName}
                    </p>
                    <p className="text-xs text-white/80 leading-relaxed">
                      <span className={cn(
                        "uppercase font-mono text-[9px] mr-2 px-1.5 py-0.5 rounded border",
                        log.action === 'CREATE' ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
                        log.action === 'UPDATE' ? "text-blue-400 bg-blue-500/10 border-blue-500/20" :
                        log.action === 'DELETE' ? "text-rose-400 bg-rose-500/10 border-rose-500/20" :
                        "text-white/90 bg-white/5 border-white/10"
                      )}>[{log.action}]</span>
                      {log.details}
                    </p>
                  </div>
                </div>
              )) : (
                <div className="py-12 text-center text-white/70">
                  <p className="text-[10px] font-mono uppercase tracking-widest">No recent audit logs</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MasterPage>
  );
}

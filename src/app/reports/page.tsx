'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, PieChart as PieIcon, Download, Filter, 
  Calendar, Ship, DollarSign, Search, ChevronDown, Printer, AlertCircle
} from 'lucide-react';
import { MasterPage } from '@/components/layout/master-page';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { cn, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function ReportCenterPage() {
  const [activeReport, setActiveReport] = useState('sales');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports');
      if (!res.ok) throw new Error('Failed to load BI data');
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const reports = [
    { id: 'sales', label: 'Sales Matrix', icon: DollarSign },
    { id: 'shipments', label: 'Logistic Flows', icon: Ship },
    { id: 'margins', label: 'Profit Yields', icon: TrendingUp },
    { id: 'exposure', label: 'Financial Exposure', icon: AlertCircle },
  ];

  const handleExport = () => {
    toast.success('Matrix data exported to CSV');
  };

  if (!data && !loading) {
    return <MasterPage title="Business Intelligence" subtitle="System offline" loading={false}><div>Error loading BI matrix</div></MasterPage>;
  }

  return (
    <MasterPage 
      title="Business Intelligence" 
      subtitle="Strategic Yield & Throughput Analytics"
      loading={loading}
    >
      {data && (
        <div className="space-y-8">
          
          {/* Report Selector & Filters */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex gap-2 p-1.5 glass rounded-3xl border border-white/5 overflow-x-auto max-w-full custom-scrollbar">
              {reports.map((report) => (
                <button
                  key={report.id}
                  onClick={() => setActiveReport(report.id)}
                  className={cn(
                    "flex items-center gap-2.5 px-6 py-2.5 rounded-2xl text-[9px] font-mono font-bold uppercase tracking-widest transition-all whitespace-nowrap border-none cursor-pointer",
                    activeReport === report.id 
                      ? "bg-blue-500 text-black shadow-lg shadow-blue-500/20" 
                      : "bg-transparent text-white/70 hover:text-white hover:bg-white/5"
                  )}
                >
                  <report.icon size={14} />
                  {report.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                <Calendar size={14} className="text-white/70" />
                <span className="text-[9px] font-mono uppercase text-white/90 tracking-widest">Last 6 Months</span>
                <ChevronDown size={12} className="text-white/70" />
              </div>
              <button className="flex items-center gap-2 p-2.5 bg-white/5 border border-white/10 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer" title="Print Report">
                <Printer size={16} />
              </button>
              <button onClick={handleExport} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 rounded-xl text-[9px] font-mono uppercase tracking-widest hover:bg-emerald-500/20 transition-colors cursor-pointer">
                <Download size={14} /> Export CSV
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div 
              key={activeReport}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Tab 1: Sales */}
              {activeReport === 'sales' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-8 glass p-8 lg:p-10 rounded-[2.5rem] border border-white/5 flex flex-col">
                    <div className="flex justify-between items-end mb-8">
                      <div>
                        <h3 className="text-xl font-display font-medium mb-1">Revenue Trajectory</h3>
                        <p className="text-[10px] font-mono text-white/70 uppercase tracking-widest">Last 6 Months Gross Revenue</p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-display font-medium text-blue-400">{formatCurrency(data.summary.totalRevenue)}</p>
                        <p className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">+12.4% vs Prev 6M</p>
                      </div>
                    </div>
                    <div className="h-[350px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.charts.salesOverTime}>
                          <defs>
                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                          <XAxis dataKey="name" stroke="#666" fontSize={10} axisLine={false} tickLine={false} dy={10} />
                          <YAxis 
                            stroke="#666" 
                            fontSize={10} 
                            axisLine={false} 
                            tickLine={false} 
                            tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`}
                            width={60}
                          />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #ffffff1a', borderRadius: '12px' }}
                            itemStyle={{ color: '#fff', fontSize: '12px', fontFamily: 'monospace' }}
                            formatter={(value: any) => formatCurrency(value)}
                            labelStyle={{ color: '#666', fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}
                          />
                          <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="lg:col-span-4 glass p-8 lg:p-10 rounded-[2.5rem] border border-white/5 flex flex-col">
                    <h3 className="text-xl font-display font-medium mb-8">Yield Snapshot</h3>
                    <div className="space-y-6 flex-1 flex flex-col justify-center">
                      {[
                        { label: 'Total Revenue', value: formatCurrency(data.summary.totalRevenue), trend: '+12.5%', color: 'text-blue-400' },
                        { label: 'Avg Order Value', value: formatCurrency(data.summary.avgOrderValue), trend: '+4.2%', color: 'text-emerald-400' },
                        { label: 'Gross Margin (Avg)', value: `${data.summary.avgMargin.toFixed(1)}%`, trend: '+1.1%', color: 'text-amber-400' },
                      ].map((kpi, i) => (
                        <div key={i} className="flex justify-between items-end border-b border-white/5 pb-6 last:border-0 last:pb-0">
                          <div>
                            <p className="text-[10px] font-mono text-white/70 uppercase tracking-widest mb-1">{kpi.label}</p>
                            <p className={cn("text-2xl font-display font-medium tracking-tight", kpi.color)}>{kpi.value}</p>
                          </div>
                          <span className={cn("text-[10px] font-mono", kpi.trend.startsWith('+') ? "text-emerald-400" : "text-rose-400")}>
                            {kpi.trend}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Logistics */}
              {activeReport === 'shipments' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="glass p-8 lg:p-10 rounded-[2.5rem] border border-white/5">
                    <h3 className="text-xl font-display font-medium mb-2">Shipment Distribution</h3>
                    <p className="text-[10px] font-mono text-white/70 uppercase tracking-widest mb-8">Active Pipeline by Status</p>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={data.charts.shipmentStatuses}
                            cx="50%" cy="50%"
                            innerRadius={80} outerRadius={110}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {data.charts.shipmentStatuses.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #ffffff1a', borderRadius: '12px' }}
                            itemStyle={{ color: '#fff', fontSize: '12px', fontFamily: 'monospace' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      {data.charts.shipmentStatuses.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                          <span className="text-[10px] font-mono text-white/90 uppercase tracking-widest">{entry.name}: {entry.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="glass p-8 lg:p-10 rounded-[2.5rem] border border-white/5">
                    <h3 className="text-xl font-display font-medium mb-2">Top Destinations</h3>
                    <p className="text-[10px] font-mono text-white/70 uppercase tracking-widest mb-8">Shipment Count by Country</p>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.charts.topDestinations} layout="vertical" margin={{ left: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" horizontal={true} vertical={false} />
                          <XAxis type="number" stroke="#666" fontSize={10} axisLine={false} tickLine={false} />
                          <YAxis dataKey="name" type="category" stroke="#666" fontSize={10} axisLine={false} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #ffffff1a', borderRadius: '12px' }}
                            itemStyle={{ color: '#fff', fontSize: '12px', fontFamily: 'monospace' }}
                            cursor={{ fill: '#ffffff0a' }}
                          />
                          <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={24} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Profit Yields */}
              {activeReport === 'margins' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-8 glass p-8 lg:p-10 rounded-[2.5rem] border border-white/5">
                    <h3 className="text-xl font-display font-medium mb-2">Costing Scenarios Profitability</h3>
                    <p className="text-[10px] font-mono text-white/70 uppercase tracking-widest mb-8">Top 5 Highly Profitable Trade Scenarios</p>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.charts.topScenarios}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                          <XAxis dataKey="name" stroke="#666" fontSize={10} axisLine={false} tickLine={false} dy={10} />
                          <YAxis yAxisId="left" stroke="#666" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} width={60} />
                          <YAxis yAxisId="right" orientation="right" stroke="#666" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} width={40} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #ffffff1a', borderRadius: '12px' }}
                            labelStyle={{ color: '#666', fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}
                            formatter={(value: any, name: any) => [name === 'profit' ? formatCurrency(value) : `${value}%`, String(name).toUpperCase()]}
                            cursor={{ fill: '#ffffff0a' }}
                          />
                          <Bar yAxisId="left" dataKey="profit" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={40} />
                          <Bar yAxisId="right" dataKey="margin" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="lg:col-span-4 glass p-8 lg:p-10 rounded-[2.5rem] border border-white/5 flex flex-col justify-center text-center">
                    <TrendingUp size={48} className="mx-auto text-amber-400 mb-6 opacity-80" />
                    <p className="text-[10px] font-mono text-white/70 uppercase tracking-widest mb-2">Average Scenario Margin</p>
                    <p className="text-5xl font-display font-medium text-amber-400 mb-4">{data.summary.avgMargin.toFixed(1)}%</p>
                    <p className="text-xs font-mono text-white/90 leading-relaxed">Costing Engine data indicates healthy margins across active FCL lanes.</p>
                  </div>
                </div>
              )}

              {/* Tab 4: Financial Exposure */}
              {activeReport === 'exposure' && (
                <div className="glass p-10 rounded-[2.5rem] border border-rose-500/20 bg-rose-500/5 text-center py-20">
                  <AlertCircle size={48} className="mx-auto text-rose-400 mb-6" />
                  <h3 className="text-2xl font-display font-medium text-white mb-2">Purchase Exposure</h3>
                  <p className="text-[10px] font-mono text-white/70 uppercase tracking-widest mb-8">Value of uncompleted Purchase Orders</p>
                  <p className="text-6xl font-display font-medium text-rose-400">{formatCurrency(data.summary.outstandingPOValue)}</p>
                </div>
              )}

            </motion.div>
          </AnimatePresence>

          {/* Granular Matrix Table (Global) */}
          <div className="glass p-8 lg:p-10 rounded-[2.5rem] border border-white/5 overflow-hidden mt-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <div>
                <h3 className="text-xl font-display font-medium mb-1">Granular Data Matrix</h3>
                <p className="text-[10px] font-mono text-white/70 uppercase tracking-widest">Recent High-Value Transactons</p>
              </div>
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/80" size={14} />
                <input 
                  type="text" 
                  placeholder="Search Matrix..." 
                  className="w-full sm:w-64 bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-[10px] font-mono focus:outline-none focus:border-blue-500/50 text-white" 
                />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="text-white/80 uppercase text-[9px] tracking-widest border-b border-white/5">
                  <tr>
                    <th className="pb-4 px-4 font-normal">Date</th>
                    <th className="pb-4 px-4 font-normal">Ref ID</th>
                    <th className="pb-4 px-4 font-normal">Entity</th>
                    <th className="pb-4 px-4 font-normal text-right">Throughput Value</th>
                    <th className="pb-4 px-4 font-normal text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.matrix.map((row: any, i: number) => (
                    <tr key={i} className="hover:bg-white/2 transition-colors">
                      <td className="py-4 px-4 text-white/90">{new Date(row.date).toISOString().split('T')[0]}</td>
                      <td className="py-4 px-4 text-blue-400/80">{row.id}</td>
                      <td className="py-4 px-4 font-bold text-white/90">{row.entity}</td>
                      <td className="py-4 px-4 text-emerald-400 font-bold text-right">{formatCurrency(row.value)}</td>
                      <td className="py-4 px-4 text-right">
                        <span className="px-2 py-0.5 rounded bg-white/5 text-[9px] font-bold uppercase tracking-widest">
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {data.matrix.length === 0 && (
                    <tr><td colSpan={5} className="py-8 text-center text-white/80 uppercase text-[9px]">No data available</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </MasterPage>
  );
}

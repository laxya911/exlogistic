'use client';

import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart as PieIcon, 
  Download, 
  Filter, 
  Calendar,
  FileText,
  Ship,
  Users,
  Building2,
  DollarSign,
  Search,
  ChevronDown,
  Printer
} from 'lucide-react';
import { motion } from 'motion/react';
import { MasterPage } from '@/components/layout/master-page';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { cn, formatCurrency } from '@/lib/utils';

export default function ReportCenterPage() {
  const [activeReport, setActiveReport] = useState('sales');

  const reports = [
    { id: 'sales', label: 'Sales Matrix', icon: DollarSign },
    { id: 'shipments', label: 'Logistic Flows', icon: Ship },
    { id: 'margins', label: 'Profit Yields', icon: TrendingUp },
    { id: 'inventory', label: 'Inventory Aging', icon: BarChart3 },
  ];

  const salesData = [
    { name: 'Jan', value: 450000 },
    { name: 'Feb', value: 520000 },
    { name: 'Mar', value: 480000 },
    { name: 'Apr', value: 610000 },
    { name: 'May', value: 590000 },
    { name: 'Jun', value: 720000 },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <MasterPage 
      title="Intelligence Reports" 
      subtitle="Strategic Yield & Throughput Analytics"
    >
      <div className="space-y-8">
        {/* Report Selector */}
        <div className="flex gap-4 p-2 glass rounded-3xl border border-white/5 w-fit">
          {reports.map((report) => (
            <button
              key={report.id}
              onClick={() => setActiveReport(report.id)}
              className={cn(
                "flex items-center gap-3 px-8 py-3 rounded-2xl text-[10px] font-mono font-bold uppercase tracking-widest transition-all",
                activeReport === report.id 
                  ? "bg-blue-500 text-black shadow-lg shadow-blue-500/20" 
                  : "text-white/40 hover:text-white hover:bg-white/5"
              )}
            >
              <report.icon size={16} />
              {report.label}
            </button>
          ))}
        </div>

        {/* Filters & Actions */}
        <div className="glass p-6 rounded-[2rem] border border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
              <Calendar size={14} className="text-white/20" />
              <span className="text-[10px] font-mono uppercase text-white/60 tracking-widest">Last 6 Months</span>
              <ChevronDown size={12} className="text-white/20" />
            </div>
            <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
              <Filter size={14} className="text-white/20" />
              <span className="text-[10px] font-mono uppercase text-white/60 tracking-widest">Global Hubs</span>
              <ChevronDown size={12} className="text-white/20" />
            </div>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-mono uppercase tracking-widest hover:bg-white/10">
              <Printer size={14} /> Print
            </button>
            <button className="flex items-center gap-2 px-6 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 rounded-xl text-[10px] font-mono uppercase tracking-widest hover:bg-emerald-500/20">
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>

        {/* Main Report Visualization */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 glass p-10 rounded-[2.5rem] border border-white/5">
            <h3 className="text-xl font-display font-medium mb-12">Performance Vector</h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="colorReport" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                  <XAxis dataKey="name" stroke="#333" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="#333" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#000', border: '1px solid #222', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorReport)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-4 glass p-10 rounded-[2.5rem] border border-white/5">
            <h3 className="text-xl font-display font-medium mb-12">Yield Snapshot</h3>
            <div className="space-y-8">
              {[
                { label: 'Total Revenue', value: '$3.4M', trend: '+12.5%', color: 'text-blue-400' },
                { label: 'Avg Order Value', value: '$12.4K', trend: '+4.2%', color: 'text-emerald-400' },
                { label: 'Profit Margin', value: '22.4%', trend: '-1.1%', color: 'text-amber-400' },
                { label: 'Customer Churn', value: '0.8%', trend: '-0.2%', color: 'text-rose-400' },
              ].map((kpi, i) => (
                <div key={i} className="flex justify-between items-end border-b border-white/5 pb-6">
                  <div>
                    <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest mb-1">{kpi.label}</p>
                    <p className="text-2xl font-display font-medium tracking-tight">{kpi.value}</p>
                  </div>
                  <span className={cn("text-[10px] font-mono", kpi.trend.startsWith('+') ? "text-emerald-400" : "text-rose-400")}>
                    {kpi.trend}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Data Matrix */}
        <div className="glass p-10 rounded-[2.5rem] border border-white/5 overflow-hidden">
          <div className="flex justify-between items-center mb-10 px-4">
            <h3 className="text-xl font-display font-medium">Granular Data Matrix</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
              <input type="text" placeholder="Search Matrix..." className="bg-white/5 border border-white/10 rounded-lg py-1.5 pl-9 pr-4 text-[10px] font-mono focus:outline-none" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px] font-mono">
              <thead className="text-white/20 uppercase tracking-[0.2em] border-b border-white/5">
                <tr>
                  <th className="pb-6 px-4">Period</th>
                  <th className="pb-6 px-4">Entity</th>
                  <th className="pb-6 px-4">Throughput</th>
                  <th className="pb-6 px-4">Yield</th>
                  <th className="pb-6 px-4 text-right">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="hover:bg-white/[0.01] transition-colors">
                    <td className="py-6 px-4">2025-0{6-i}</td>
                    <td className="py-6 px-4 text-white/60">Global Hub {i+1}</td>
                    <td className="py-6 px-4">1,250 Units</td>
                    <td className="py-6 px-4 text-emerald-400">{formatCurrency(120000 + i*15000)}</td>
                    <td className="py-6 px-4 text-right text-white/20">+4.5%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MasterPage>
  );
}

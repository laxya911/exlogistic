'use client';

import React, { useState } from 'react';
import { MasterPage } from '@/components/layout/master-page';
import { Calculator, TrendingUp, DollarSign, Percent, ArrowRight, ShieldCheck } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { motion } from 'motion/react';

export default function CostingPage() {
  const [baseValue, setBaseValue] = useState(25000);
  const [freight, setFreight] = useState(1200);
  const [insuranceRate, setInsuranceRate] = useState(0.5);
  const [customsRate, setCustomsRate] = useState(12);
  const [logisticsRate, setLogisticsRate] = useState(2);
  const [targetMargin, setTargetMargin] = useState(25);

  const insurance = baseValue * (insuranceRate / 100);
  const customs = baseValue * (customsRate / 100);
  const logistics = baseValue * (logisticsRate / 100);
  const totalLandedCost = baseValue + freight + insurance + customs + logistics;
  
  const sellingPrice = totalLandedCost / (1 - (targetMargin / 100));
  const grossProfit = sellingPrice - totalLandedCost;

  return (
    <MasterPage 
      title="Landed Cost Engine" 
      subtitle="Precision Financial Simulation"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="glass p-10 rounded-[2.5rem] border border-white/5 space-y-10">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-display font-medium">Scenario Parameters</h3>
              <button className="text-[10px] font-mono text-blue-500 uppercase tracking-widest hover:underline">Reset Matrix</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-mono text-white/20 uppercase tracking-[0.2em] px-1">Base Product Value (FOB)</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 font-mono">$</span>
                  <input 
                    type="number" 
                    value={baseValue} 
                    onChange={(e) => setBaseValue(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-12 pr-6 text-xl font-display focus:outline-none focus:border-blue-500/50 transition-all" 
                  />
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-mono text-white/20 uppercase tracking-[0.2em] px-1">Freight Estimate</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 font-mono">$</span>
                  <input 
                    type="number" 
                    value={freight} 
                    onChange={(e) => setFreight(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-12 pr-6 text-xl font-display focus:outline-none focus:border-blue-500/50 transition-all" 
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Insurance (%)', value: insuranceRate, setter: setInsuranceRate, calc: insurance },
                { label: 'Customs (%)', value: customsRate, setter: setCustomsRate, calc: customs },
                { label: 'Logistics (%)', value: logisticsRate, setter: setLogisticsRate, calc: logistics },
              ].map((item, i) => (
                <div key={i} className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] transition-all">
                  <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest mb-4">{item.label}</p>
                  <div className="flex items-center gap-3 mb-4">
                    <input 
                      type="number" 
                      value={item.value} 
                      onChange={(e) => item.setter(Number(e.target.value))}
                      className="w-16 bg-white/5 border border-white/10 rounded-lg py-1 px-2 text-xs font-mono focus:outline-none" 
                    />
                    <span className="text-white/10 font-mono text-xs">➔</span>
                    <span className="text-sm font-bold text-white/80">{formatCurrency(item.calc)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-10 border-t border-white/5 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest mb-1">Estimated Landed Cost</p>
                <p className="text-4xl font-display font-medium text-white tracking-tighter">{formatCurrency(totalLandedCost)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest mb-1">Unit Precision</p>
                <p className="text-sm font-mono text-white/40">CALCULATION VERIFIED</p>
              </div>
            </div>
          </div>

          <div className="glass p-10 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10">
              <Percent size={40} className="text-white/[0.02]" />
            </div>
            
            <div className="flex justify-between items-center mb-12">
              <div>
                <h3 className="text-xl font-display font-medium mb-2">Yield Matrix</h3>
                <p className="text-xs text-white/20 font-mono uppercase tracking-widest">Profitability Simulation</p>
              </div>
              <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10">
                <span className="text-[10px] font-mono text-white/40 uppercase pl-3">Target Margin %</span>
                <input 
                  type="number" 
                  value={targetMargin} 
                  onChange={(e) => setTargetMargin(Number(e.target.value))}
                  className="w-16 bg-blue-500 text-black border-none rounded-xl py-2 px-3 text-xs font-bold focus:outline-none text-center" 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                  <p className="text-[10px] font-mono text-emerald-500/60 uppercase tracking-widest mb-2">Required Selling Price</p>
                  <p className="text-4xl font-display font-medium text-emerald-400 tracking-tighter">{formatCurrency(sellingPrice)}</p>
                </div>
                <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                  <p className="text-[10px] font-mono text-blue-500/60 uppercase tracking-widest mb-2">Net Profit Per Scenario</p>
                  <p className="text-4xl font-display font-medium text-blue-400 tracking-tighter">{formatCurrency(grossProfit)}</p>
                </div>
              </div>
              
              <div className="flex flex-col justify-center">
                <div className="relative h-48 w-48 mx-auto">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-white/5" />
                    <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={552} strokeDashoffset={552 - (552 * targetMargin) / 100} className="text-blue-500 transition-all duration-1000 ease-out" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-display font-bold">{targetMargin}%</span>
                    <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Yield</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar info */}
        <div className="space-y-6">
          <div className="p-8 rounded-[2rem] bg-blue-500 text-black">
            <ShieldCheck size={32} className="mb-6" />
            <h4 className="text-xl font-display font-bold leading-tight mb-4">Landed Cost Precision</h4>
            <p className="text-sm font-medium opacity-80 leading-relaxed mb-8">
              System calculates all underlying variables including ocean freight, port charges, and insurance premiums automatically.
            </p>
            <button className="w-full py-4 bg-black text-white rounded-2xl text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-black/90 transition-all flex items-center justify-center gap-2">
              Generate Costing Sheet <ArrowRight size={14} />
            </button>
          </div>

          <div className="glass p-8 rounded-[2rem] border border-white/5">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-amber-400">
                <TrendingUp size={20} />
              </div>
              <h4 className="font-display font-medium">Historical Trends</h4>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Freight (Asia - US)', trend: '+12.4%', value: '$2,400' },
                { label: 'Avg Margin (Q2)', trend: '-1.2%', value: '24.1%' },
                { label: 'Insurance Index', trend: '+0.1%', value: '0.45%' },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-[10px] font-mono text-white/40 uppercase">{item.label}</p>
                    <p className="text-sm font-medium">{item.value}</p>
                  </div>
                  <span className={cn("text-[9px] font-mono", item.trend.startsWith('+') ? 'text-rose-400' : 'text-emerald-400')}>
                    {item.trend}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MasterPage>
  );
}

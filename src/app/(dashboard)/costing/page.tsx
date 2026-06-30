'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PageHeaderUpdater } from '@/components/layout/page-context';
import {
  Calculator, TrendingUp, DollarSign, Percent, ArrowRight,
  ShieldCheck, Package, Warehouse, Truck, Star, StarOff,
  Trash2, Save, RefreshCw, FileDown, Copy, ChevronDown, ChevronUp,
  BarChart3, Target, CheckCircle2, PlusCircle, X
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { CostingScenario } from '@/types';

// ──────────────────────────────────────────
// Costing calculation helper
// ──────────────────────────────────────────
function calcScenario(params: {
  qty: number; unitPrice: number;
  oceanFrtPerContainer: number; containerCount: number;
  originH: number; destH: number;
  insuranceRate: number; customsRate: number;
  inspection: number; banking: number; misc: number;
  targetMargin: number;
}) {
  const { qty, unitPrice, oceanFrtPerContainer, containerCount, originH, destH,
    insuranceRate, customsRate, inspection, banking, misc, targetMargin } = params;

  const productCost = qty * unitPrice;
  const totalFreight = oceanFrtPerContainer * containerCount + originH + destH;
  const cifValue = productCost + totalFreight;
  const insuranceAmt = productCost * (insuranceRate / 100);
  const customsAmt = cifValue * (customsRate / 100);
  const totalLanded = productCost + totalFreight + insuranceAmt + customsAmt + inspection + banking + misc;
  const costPerUnit = qty > 0 ? totalLanded / qty : 0;
  const sellingPerUnit = targetMargin < 100 ? costPerUnit / (1 - targetMargin / 100) : 0;
  const profitPerUnit = sellingPerUnit - costPerUnit;
  const totalRevenue = sellingPerUnit * qty;
  const totalProfit = profitPerUnit * qty;
  const breakEven = sellingPerUnit > 0 ? Math.ceil(totalLanded / sellingPerUnit) : 0;

  return {
    productCost, totalFreight, insuranceAmt, customsAmt, totalLanded,
    costPerUnit, sellingPerUnit, profitPerUnit, totalRevenue, totalProfit, breakEven
  };
}

// ──────────────────────────────────────────
// Gauge component
// ──────────────────────────────────────────
function MarginGauge({ value, max = 50 }: { value: number; max?: number }) {
  const pct = Math.min(value / max, 1);
  const r = 80;
  const circ = 2 * Math.PI * r;
  const dash = circ * 0.75; // 270 deg arc
  const offset = dash - dash * pct;
  const color = value < 15 ? '#f43f5e' : value < 22 ? '#f59e0b' : '#10b981';

  return (
    <div className="relative w-44 h-44 mx-auto">
      <svg className="w-full h-full" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r={r} stroke="rgba(255,255,255,0.05)" strokeWidth="16" fill="none"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform="rotate(135 100 100)" />
        <motion.circle cx="100" cy="100" r={r} stroke={color} strokeWidth="16" fill="none"
          strokeDasharray={`${dash} ${circ}`}
          initial={{ strokeDashoffset: dash }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          strokeLinecap="round" transform="rotate(135 100 100)" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span key={value} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          className="text-3xl font-bold font-mono" style={{ color }}>
          {value.toFixed(1)}%
        </motion.span>
        <span className="text-[8px] font-mono text-white/70 uppercase tracking-widest mt-1">Gross Margin</span>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────
// Main page
// ──────────────────────────────────────────
export default function CostingPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [savedScenarios, setSavedScenarios] = useState<CostingScenario[]>([]);
  const [loading, setLoading] = useState(true);

  // — Live Builder State —
  const [productId, setProductId] = useState('');
  const [qty, setQty] = useState(600);
  const [unitPrice, setUnitPrice] = useState(42);
  const [containerType, setContainerType] = useState('20GP');
  const [containerCount, setContainerCount] = useState(1);
  const [oceanFrt, setOceanFrt] = useState(2800);
  const [originH, setOriginH] = useState(280);
  const [destH, setDestH] = useState(420);
  const [insuranceRate, setInsuranceRate] = useState(0.5);
  const [customsRate, setCustomsRate] = useState(5.0);
  const [inspection, setInspection] = useState(180);
  const [banking, setBanking] = useState(0);
  const [misc, setMisc] = useState(120);
  const [targetMargin, setTargetMargin] = useState(22);
  const [scenarioName, setScenarioName] = useState('');
  const [originPort, setOriginPort] = useState('INNHV');
  const [destPort, setDestPort] = useState('JPTYO');

  // — UI State —
  const [showSaved, setShowSaved] = useState(true);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [savingScenario, setSavingScenario] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pRes, sRes, scRes] = await Promise.all([
        fetch('/api/products').then(r => r.json()),
        fetch('/api/suppliers').then(r => r.json()),
        fetch('/api/costing').then(r => r.json())
      ]);
      setProducts(pRes);
      setSuppliers(sRes);
      setSavedScenarios(scRes);
      if (pRes.length > 0) {
        setProductId(pRes[0].id);
        setUnitPrice(pRes[0].purchasePrice || 42);
      }
    } catch { toast.error('Failed to load costing data'); }
    finally { setLoading(false); }
  };

  // Update unit price when product changes
  useEffect(() => {
    const p = products.find(x => x.id === productId);
    if (p) setUnitPrice(p.purchasePrice || 42);
  }, [productId, products]);

  // Update banking rate calculation
  const bankingAmt = useMemo(() => {
    const p = qty * unitPrice;
    return Math.round(p * 0.0025 * 100) / 100;
  }, [qty, unitPrice]);

  const live = useMemo(() => calcScenario({
    qty, unitPrice, oceanFrtPerContainer: oceanFrt, containerCount,
    originH, destH, insuranceRate, customsRate,
    inspection, banking: bankingAmt, misc, targetMargin
  }), [qty, unitPrice, oceanFrt, containerCount, originH, destH,
    insuranceRate, customsRate, inspection, bankingAmt, misc, targetMargin]);

  const selectedProduct = products.find(p => p.id === productId);
  const selectedSupplier = suppliers.find(s => s.id === selectedProduct?.supplierId);

  const handleReset = () => {
    setQty(600); setUnitPrice(42); setOceanFrt(2800); setContainerCount(1);
    setOriginH(280); setDestH(420); setInsuranceRate(0.5); setCustomsRate(5.0);
    setInspection(180); setMisc(120); setTargetMargin(22); setScenarioName('');
    toast.success('Scenario reset to defaults');
  };

  const handleSave = async () => {
    if (!scenarioName.trim()) { toast.error('Enter a scenario name to save'); return; }
    setSavingScenario(true);
    try {
      const payload: Partial<CostingScenario> = {
        scenarioName: scenarioName.trim(),
        items: [{ productId, quantity: qty, unitPurchasePrice: unitPrice, totalProductCost: live.productCost }],
        freight: { originPort, destinationPort: destPort, containerType, containerCount, oceanFreightPerContainer: oceanFrt, originHandling: originH, destinationHandling: destH, totalFreight: live.totalFreight },
        costs: { productCost: live.productCost, freightCost: live.totalFreight, insuranceAmount: live.insuranceAmt, customsDuty: live.customsAmt, inspection, bankingCharges: bankingAmt, miscCharges: misc, totalLandedCost: live.totalLanded },
        rates: { insuranceRate, customsRate, targetMargin, bankingRate: 0.25 },
        result: { costPerUnit: live.costPerUnit, targetSellingPricePerUnit: live.sellingPerUnit, grossProfitPerUnit: live.profitPerUnit, totalRevenue: live.totalRevenue, totalGrossProfit: live.totalProfit, grossMarginPct: targetMargin, breakEvenQty: live.breakEven },
        currency: 'USD', exchangeRate: 83.5, isFavourite: false
      };
      const res = await fetch('/api/costing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Save failed');
      const saved = await res.json();
      setSavedScenarios(prev => [saved, ...prev]);
      setScenarioName('');
      toast.success(`"${saved.scenarioName}" saved to ledger`);
    } catch (e: any) { toast.error(e.message); }
    finally { setSavingScenario(false); }
  };

  const handleToggleFav = async (id: string) => {
    try {
      const res = await fetch(`/api/costing/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'toggle_favourite' }) });
      const updated = await res.json();
      setSavedScenarios(prev => prev.map(s => s.id === id ? updated : s));
    } catch { toast.error('Failed to update'); }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/costing/${id}`, { method: 'DELETE' });
      setSavedScenarios(prev => prev.filter(s => s.id !== id));
      setCompareIds(prev => prev.filter(x => x !== id));
      toast.success('Scenario removed');
    } catch { toast.error('Delete failed'); }
  };

  const loadScenario = (sc: CostingScenario) => {
    const item = sc.items[0];
    if (item) { setProductId(item.productId); setQty(item.quantity); setUnitPrice(item.unitPurchasePrice); }
    setOceanFrt(sc.freight.oceanFreightPerContainer);
    setContainerCount(sc.freight.containerCount);
    setContainerType(sc.freight.containerType);
    setOriginH(sc.freight.originHandling);
    setDestH(sc.freight.destinationHandling);
    setOriginPort(sc.freight.originPort);
    setDestPort(sc.freight.destinationPort);
    setInsuranceRate(sc.rates.insuranceRate);
    setCustomsRate(sc.rates.customsRate);
    setTargetMargin(sc.rates.targetMargin);
    setInspection(sc.costs.inspection);
    setMisc(sc.costs.miscCharges);
    setScenarioName(sc.scenarioName + ' (Copy)');
    toast.success(`Loaded: ${sc.scenarioName}`);
  };

  const toggleCompare = (id: string) => {
    setCompareIds(prev => prev.includes(id)
      ? prev.filter(x => x !== id)
      : prev.length < 4 ? [...prev, id] : (toast.error('Max 4 scenarios for comparison'), prev));
  };

  const exportCSV = () => {
    const row = [
      scenarioName || 'Draft Scenario', qty, unitPrice, live.productCost,
      live.totalFreight, live.insuranceAmt, live.customsAmt, inspection, misc,
      live.totalLanded, live.costPerUnit, live.sellingPerUnit, live.profitPerUnit,
      live.totalRevenue, live.totalProfit, targetMargin
    ];
    const headers = ['Scenario', 'Qty', 'Unit Cost', 'Product Cost', 'Freight', 'Insurance', 'Customs', 'Inspection', 'Misc', 'Total Landed', 'Cost/Unit', 'Selling/Unit', 'Profit/Unit', 'Total Revenue', 'Total Profit', 'Margin%'];
    const csv = [headers.join(','), row.join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'CostingScenario.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    toast.success('Costing sheet exported');
  };

  const compareScenarios = savedScenarios.filter(s => compareIds.includes(s.id));

  const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm font-mono focus:outline-none focus:border-emerald-500/50 transition-all text-white";
  const labelCls = "text-[9px] font-mono text-white/70 uppercase tracking-widest";

  return (
    <>
      <PageHeaderUpdater title="Landed Cost Engine" subtitle="Precision Financial Simulation & Profitability Analysis" />
      <div className="space-y-8">

        {/* Live KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Landed Cost', value: formatCurrency(live.totalLanded), color: 'text-blue-400', icon: DollarSign },
            { label: 'Cost Per Unit', value: formatCurrency(live.costPerUnit), color: 'text-amber-400', icon: Package },
            { label: 'Selling Price / Unit', value: formatCurrency(live.sellingPerUnit), color: 'text-emerald-400', icon: Target },
            { label: 'Total Profit', value: formatCurrency(live.totalProfit), color: 'text-purple-400', icon: TrendingUp },
          ].map((k, i) => (
            <motion.div key={i} animate={{ opacity: 1 }} className="glass p-5 rounded-3xl border border-white/5">
              <div className="flex justify-between items-start mb-2">
                <p className={labelCls}>{k.label}</p>
                <k.icon size={14} className={k.color} />
              </div>
              <motion.p key={k.value} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                className={cn('font-sans font-bold text-xl', k.color)}>
                {k.value}
              </motion.p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">

          {/* ── LEFT: Parameter Builder ── */}
          <div className="xl:col-span-2 space-y-6">

            {/* Product & Volume */}
            <div className="glass p-8 rounded-4xl border border-white/5 space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-white/5">
                <h3 className="text-xs font-mono text-white/70 uppercase tracking-widest flex items-center gap-2">
                  <Package size={14} className="text-emerald-400" /> Commodity & Volume
                </h3>
                <button onClick={handleReset} className="flex items-center gap-1.5 text-[9px] font-mono text-white/80 hover:text-white uppercase cursor-pointer bg-transparent border-none">
                  <RefreshCw size={11} /> Reset
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <label className={labelCls}>Product (Commodity)</label>
                  <select value={productId} onChange={e => setProductId(e.target.value)}
                    className={inputCls + ' cursor-pointer'}>
                    {products.map(p => <option key={p.id} value={p.id} className="bg-[#0c0c0c]">{p.name} ({p.sku})</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>Unit Purchase Price (USD)</label>
                  <input type="number" value={unitPrice} min={0.01} step={0.5} onChange={e => setUnitPrice(Number(e.target.value))} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <label className={labelCls}>Quantity (Units / Bags / MT)</label>
                  <input type="number" value={qty} min={1} onChange={e => setQty(Number(e.target.value))} className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>Container Type</label>
                  <select value={containerType} onChange={e => setContainerType(e.target.value)} className={inputCls + ' cursor-pointer'}>
                    {['20GP', '40GP', '40HQ', '20RF'].map(t => <option key={t} value={t} className="bg-[#0c0c0c]">{t}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>Container Count</label>
                  <input type="number" value={containerCount} min={1} max={20} onChange={e => setContainerCount(Number(e.target.value))} className={inputCls} />
                </div>
              </div>
            </div>

            {/* Freight Parameters */}
            <div className="glass p-8 rounded-4xl border border-white/5 space-y-6">
              <h3 className="text-xs font-mono text-white/70 uppercase tracking-widest flex items-center gap-2 pb-4 border-b border-white/5">
                <Truck size={14} className="text-blue-400" /> Freight & Port Parameters
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className={labelCls}>Origin Port</label>
                  <input type="text" value={originPort} onChange={e => setOriginPort(e.target.value.toUpperCase())} className={inputCls} placeholder="INNHV" />
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>Destination Port</label>
                  <input type="text" value={destPort} onChange={e => setDestPort(e.target.value.toUpperCase())} className={inputCls} placeholder="USLAX" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className={labelCls}>Ocean Freight per Container (USD)</label>
                  <input type="number" value={oceanFrt} step={50} onChange={e => setOceanFrt(Number(e.target.value))} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelCls}>Origin Handling (CFS + Stuffing) USD</label>
                  <input type="number" value={originH} step={10} onChange={e => setOriginH(Number(e.target.value))} className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>Destination THC + Port Fees USD</label>
                  <input type="number" value={destH} step={10} onChange={e => setDestH(Number(e.target.value))} className={inputCls} />
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex justify-between items-center text-xs font-mono">
                <span className="text-white/80 uppercase text-[9px]">Total Freight Cost ({containerCount}x {containerType})</span>
                <span className="text-blue-400 font-bold font-sans">{formatCurrency(live.totalFreight)}</span>
              </div>
            </div>

            {/* Rate Parameters */}
            <div className="glass p-8 rounded-4xl border border-white/5 space-y-6">
              <h3 className="text-xs font-mono text-white/70 uppercase tracking-widest flex items-center gap-2 pb-4 border-b border-white/5">
                <Percent size={14} className="text-amber-400" /> Duty, Insurance & Additional Charges
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: 'Customs Duty Rate %', value: customsRate, setter: setCustomsRate, step: 0.5, computed: live.customsAmt },
                  { label: 'Marine Insurance %', value: insuranceRate, setter: setInsuranceRate, step: 0.1, computed: live.insuranceAmt },
                  { label: 'Pre-Shipment Inspection (USD)', value: inspection, setter: setInspection, step: 50, computed: null },
                  { label: 'Banking / LC Charges (USD)', value: bankingAmt, setter: null, step: 0, computed: null },
                  { label: 'Misc / Agency Charges (USD)', value: misc, setter: setMisc, step: 10, computed: null },
                  { label: 'Target Gross Margin %', value: targetMargin, setter: setTargetMargin, step: 1, computed: null, highlight: true },
                ].map((item, i) => (
                  <div key={i} className={cn('p-4 rounded-2xl border space-y-2', item.highlight ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/5 bg-white/2')}>
                    <p className={cn(labelCls, item.highlight && 'text-emerald-400/60')}>{item.label}</p>
                    <input
                      type="number" value={item.value} step={item.step}
                      readOnly={!item.setter}
                      onChange={item.setter ? e => item.setter!(Number(e.target.value)) : undefined}
                      className={cn('w-full bg-transparent border-none text-xl font-bold font-sans focus:outline-none', item.highlight ? 'text-emerald-400' : 'text-white/90', !item.setter && 'opacity-40')}
                    />
                    {item.computed !== null && (
                      <p className="text-[9px] font-mono text-white/70">= {formatCurrency(item.computed)}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Landed Cost Breakdown Table */}
            <div className="glass p-8 rounded-4xl border border-white/5 space-y-4">
              <h3 className="text-xs font-mono text-white/70 uppercase tracking-widest flex items-center gap-2 pb-4 border-b border-white/5">
                <BarChart3 size={14} className="text-purple-400" /> Full Landed Cost Breakdown
              </h3>
              <div className="space-y-2 text-xs font-mono">
                {[
                  { label: 'Product / FOB Cost', value: live.productCost, pct: live.totalLanded > 0 ? (live.productCost / live.totalLanded) * 100 : 0, color: 'bg-blue-500' },
                  { label: `Ocean Freight (${containerCount}x ${containerType} @ ${formatCurrency(oceanFrt)}/CTR)`, value: live.totalFreight, pct: live.totalLanded > 0 ? (live.totalFreight / live.totalLanded) * 100 : 0, color: 'bg-purple-500' },
                  { label: `Customs Duty (${customsRate}% CIF)`, value: live.customsAmt, pct: live.totalLanded > 0 ? (live.customsAmt / live.totalLanded) * 100 : 0, color: 'bg-amber-500' },
                  { label: `Marine Insurance (${insuranceRate}%)`, value: live.insuranceAmt, pct: live.totalLanded > 0 ? (live.insuranceAmt / live.totalLanded) * 100 : 0, color: 'bg-cyan-500' },
                  { label: 'Inspection + Banking + Misc', value: inspection + bankingAmt + misc, pct: live.totalLanded > 0 ? ((inspection + bankingAmt + misc) / live.totalLanded) * 100 : 0, color: 'bg-rose-500' },
                ].map((row, i) => (
                  <div key={i} className="flex items-center gap-4 py-2 border-b border-white/3">
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-white/70 text-[9px] uppercase truncate">{row.label}</span>
                        <span className="text-white/80 font-bold ml-3 shrink-0">{formatCurrency(row.value)}</span>
                      </div>
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${row.pct}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className={cn('h-full rounded-full', row.color)}
                        />
                      </div>
                    </div>
                    <span className="text-[9px] text-white/70 w-8 text-right shrink-0">{row.pct.toFixed(0)}%</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-3 text-sm font-bold border-t border-white/10">
                  <span className="text-white/90 font-mono text-xs uppercase">Total Landed Cost</span>
                  <span className="text-blue-400 font-sans text-xl">{formatCurrency(live.totalLanded)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Results + Saved Scenarios ── */}
          <div className="space-y-6">

            {/* Margin Gauge */}
            <div className="glass p-8 rounded-4xl border border-white/5 space-y-5">
              <MarginGauge value={targetMargin} />
              <div className="space-y-3 text-xs font-mono border-t border-white/5 pt-5">
                {[
                  { label: 'Break-even Quantity', value: `${live.breakEven.toLocaleString()} units` },
                  { label: 'Gross Profit / Unit', value: formatCurrency(live.profitPerUnit) },
                  { label: 'Target Selling Price', value: formatCurrency(live.sellingPerUnit) },
                  { label: 'Total Revenue', value: formatCurrency(live.totalRevenue) },
                  { label: 'Total Gross Profit', value: formatCurrency(live.totalProfit) },
                ].map(item => (
                  <div key={item.label} className="flex justify-between items-center">
                    <span className="text-white/70 uppercase text-[9px]">{item.label}</span>
                    <span className="font-bold text-white/80">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Supplier Card */}
            {selectedSupplier && (
              <div className="glass p-6 rounded-4xl border border-white/5 space-y-3">
                <h4 className="text-[9px] font-mono text-white/70 uppercase tracking-widest pb-2 border-b border-white/5 flex items-center gap-1.5">
                  <Warehouse size={11} className="text-emerald-400" /> Supplier Intelligence
                </h4>
                <p className="font-bold text-white/90 text-sm">{selectedSupplier.name}</p>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-white/70">
                  <div><p className="text-[8px] uppercase mb-0.5">Lead Time</p><p className="font-bold text-white/70">{selectedSupplier.averageLeadTime}d</p></div>
                  <div><p className="text-[8px] uppercase mb-0.5">Rating</p><p className="font-bold text-amber-400">{selectedSupplier.performanceRating}/5</p></div>
                  <div><p className="text-[8px] uppercase mb-0.5">Country</p><p className="font-bold text-white/70">{selectedSupplier.country}</p></div>
                  <div><p className="text-[8px] uppercase mb-0.5">Payment</p><p className="font-bold text-white/70 truncate">{selectedSupplier.paymentTerms}</p></div>
                </div>
              </div>
            )}

            {/* Save Scenario */}
            <div className="glass p-6 rounded-4xl border border-emerald-500/15 space-y-3 bg-emerald-500/3">
              <h4 className="text-[9px] font-mono text-emerald-400/60 uppercase tracking-widest">Save Current Scenario</h4>
              <input type="text" value={scenarioName} onChange={e => setScenarioName(e.target.value)}
                placeholder="e.g. Basmati Japan Q4 2025"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs font-mono focus:outline-none focus:border-emerald-500/50 text-white" />
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={savingScenario || !scenarioName.trim()}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-emerald-500 text-black text-[9px] font-mono font-bold uppercase rounded-xl hover:bg-emerald-400 disabled:opacity-40 cursor-pointer border-none">
                  <Save size={12} /> {savingScenario ? 'Saving...' : 'Save to Ledger'}
                </button>
                <button onClick={exportCSV}
                  className="p-3 bg-white/5 border border-white/10 rounded-xl text-white/70 hover:text-white cursor-pointer">
                  <FileDown size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Saved Scenarios Ledger ── */}
        <div className="glass rounded-4xl border border-white/5 overflow-hidden">
          <button onClick={() => setShowSaved(!showSaved)}
            className="w-full flex justify-between items-center p-6 border-b border-white/5 bg-transparent cursor-pointer">
            <div className="flex items-center gap-3">
              <ShieldCheck size={16} className="text-emerald-400" />
              <span className="text-xs font-mono text-white/70 uppercase tracking-widest">Scenario Ledger</span>
              <span className="px-2 py-0.5 bg-white/5 rounded text-[9px] font-mono text-white/80">{savedScenarios.length} saved</span>
            </div>
            {showSaved ? <ChevronUp size={16} className="text-white/70" /> : <ChevronDown size={16} className="text-white/70" />}
          </button>

          <AnimatePresence>
            {showSaved && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono text-left">
                    <thead className="text-white/15 uppercase text-[9px] tracking-widest border-b border-white/5 bg-white/2">
                      <tr>
                        <th className="py-4 px-5">Scenario</th>
                        <th className="py-4 px-5 text-right">Product Cost</th>
                        <th className="py-4 px-5 text-right">Freight</th>
                        <th className="py-4 px-5 text-right">Total Landed</th>
                        <th className="py-4 px-5 text-right">Selling / Unit</th>
                        <th className="py-4 px-5 text-right">Margin</th>
                        <th className="py-4 px-5 text-right">Total Profit</th>
                        <th className="py-4 px-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {savedScenarios.map(sc => (
                        <tr key={sc.id} className={cn('hover:bg-white/2 transition-colors group', compareIds.includes(sc.id) && 'bg-emerald-500/5')}>
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-2">
                              {sc.isFavourite && <Star size={10} className="text-amber-400 shrink-0" fill="currentColor" />}
                              <div>
                                <p className="font-bold text-white/80">{sc.scenarioName}</p>
                                <p className="text-[9px] text-white/70">{sc.freight.containerCount}x {sc.freight.containerType} · {sc.freight.originPort}→{sc.freight.destinationPort}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-5 text-right text-white/70">{formatCurrency(sc.costs.productCost)}</td>
                          <td className="py-4 px-5 text-right text-white/70">{formatCurrency(sc.costs.freightCost)}</td>
                          <td className="py-4 px-5 text-right font-bold text-white/80">{formatCurrency(sc.costs.totalLandedCost)}</td>
                          <td className="py-4 px-5 text-right text-emerald-400 font-bold">{formatCurrency(sc.result.targetSellingPricePerUnit)}</td>
                          <td className="py-4 px-5 text-right">
                            <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded border',
                              sc.result.grossMarginPct >= 25 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                              sc.result.grossMarginPct >= 18 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                              'text-rose-400 bg-rose-500/10 border-rose-500/20')}>
                              {sc.result.grossMarginPct}%
                            </span>
                          </td>
                          <td className="py-4 px-5 text-right text-purple-400 font-bold">{formatCurrency(sc.result.totalGrossProfit)}</td>
                          <td className="py-4 px-5 text-right">
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => loadScenario(sc)} title="Load into builder" className="p-1.5 rounded hover:bg-white/10 text-white/80 hover:text-white cursor-pointer bg-transparent border-none"><Copy size={11} /></button>
                              <button onClick={() => handleToggleFav(sc.id)} title="Toggle favourite" className="p-1.5 rounded hover:bg-amber-500/10 text-white/80 hover:text-amber-400 cursor-pointer bg-transparent border-none">{sc.isFavourite ? <StarOff size={11} /> : <Star size={11} />}</button>
                              <button onClick={() => toggleCompare(sc.id)} title="Compare" className={cn('p-1.5 rounded cursor-pointer bg-transparent border-none', compareIds.includes(sc.id) ? 'text-emerald-400 bg-emerald-500/10' : 'text-white/80 hover:text-emerald-400 hover:bg-emerald-500/10')}><BarChart3 size={11} /></button>
                              <button onClick={() => handleDelete(sc.id)} title="Delete" className="p-1.5 rounded hover:bg-rose-500/10 text-white/80 hover:text-rose-400 cursor-pointer bg-transparent border-none"><Trash2 size={11} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {savedScenarios.length === 0 && (
                        <tr><td colSpan={8} className="py-12 text-center text-white/10 uppercase text-[9px] tracking-widest">No scenarios saved yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Scenario Comparison Table ── */}
        <AnimatePresence>
          {compareScenarios.length >= 2 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="glass rounded-4xl border border-emerald-500/20 overflow-hidden">
              <div className="p-6 border-b border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <BarChart3 size={16} className="text-emerald-400" />
                  <span className="text-xs font-mono text-white/70 uppercase tracking-widest">Scenario Comparison ({compareScenarios.length} selected)</span>
                </div>
                <button onClick={() => setCompareIds([])} className="text-white/70 hover:text-white cursor-pointer bg-transparent border-none"><X size={14} /></button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono text-left">
                  <thead className="border-b border-white/5 text-[9px] text-white/15 uppercase tracking-widest bg-white/2">
                    <tr>
                      <th className="py-3 px-5">Metric</th>
                      {compareScenarios.map(sc => <th key={sc.id} className="py-3 px-5 text-right">{sc.scenarioName.split('—')[0].trim()}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {[
                      { label: 'Quantity', key: (s: CostingScenario) => `${s.items[0]?.quantity.toLocaleString()} units` },
                      { label: 'Product Cost', key: (s: CostingScenario) => formatCurrency(s.costs.productCost) },
                      { label: 'Total Freight', key: (s: CostingScenario) => formatCurrency(s.costs.freightCost) },
                      { label: 'Customs Duty', key: (s: CostingScenario) => formatCurrency(s.costs.customsDuty) },
                      { label: 'Total Landed Cost', key: (s: CostingScenario) => formatCurrency(s.costs.totalLandedCost) },
                      { label: 'Cost / Unit', key: (s: CostingScenario) => formatCurrency(s.result.costPerUnit) },
                      { label: 'Selling Price / Unit', key: (s: CostingScenario) => formatCurrency(s.result.targetSellingPricePerUnit) },
                      { label: 'Gross Margin', key: (s: CostingScenario) => `${s.result.grossMarginPct}%` },
                      { label: 'Total Gross Profit', key: (s: CostingScenario) => formatCurrency(s.result.totalGrossProfit) },
                      { label: 'Break-even Qty', key: (s: CostingScenario) => `${s.result.breakEvenQty.toLocaleString()}` },
                    ].map(row => (
                      <tr key={row.label} className="hover:bg-white/2">
                        <td className="py-3 px-5 text-white/70 uppercase text-[9px]">{row.label}</td>
                        {compareScenarios.map(sc => <td key={sc.id} className="py-3 px-5 text-right text-white/70 font-bold">{row.key(sc)}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </>
  );
}

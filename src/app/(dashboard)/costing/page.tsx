'use client';

import { useRouter } from 'next/navigation';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PageHeaderUpdater } from '@/components/layout/page-context';
import {
  Calculator, TrendingUp, DollarSign, Percent, ArrowRight,
  ShieldCheck, Package, Warehouse, Truck, Star, StarOff,
  Trash2, Save, RefreshCw, FileDown, Copy, ChevronDown, ChevronUp,
  BarChart3, Target, CheckCircle2, PlusCircle, X, FileText
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { CostingScenario } from '@/types';
import { SearchableSelect } from '@/components/ui/searchable-select';

const MOCK_FX_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 1.09,
  GBP: 1.27,
  CNY: 0.14,
  JPY: 0.0065,
  INR: 0.012,
  AED: 0.27,
};

const CONTAINER_CAPACITIES: Record<string, { maxWeight: number, maxCBM: number }> = {
  '20GP': { maxWeight: 28000, maxCBM: 33 },
  '40GP': { maxWeight: 28800, maxCBM: 67 },
  '40HQ': { maxWeight: 28600, maxCBM: 76 },
  '20RF': { maxWeight: 27000, maxCBM: 28 },
};

// ──────────────────────────────────────────
// Costing calculation helper
// ──────────────────────────────────────────
function calcScenario(params: {
  items: { qty: number; unitPrice: number; weight: number; cbm: number; productId: string; _meta?: { name: string, sku: string } }[];
  fxRate: number; // Purchase Currency to Target Currency
  oceanFrtPerContainer: number; containerCount: number;
  originH: number; destH: number;
  insuranceRate: number; customsRate: number;
  inspection: number; banking: number; misc: number;
  targetMargin: number;
}) {
  const { items, fxRate, oceanFrtPerContainer, containerCount, originH, destH,
    insuranceRate, customsRate, inspection, banking, misc, targetMargin } = params;

  // Total product cost in Target Currency
  const totalProductCost = items.reduce((sum, item) => sum + (item.qty * item.unitPrice * fxRate), 0);
  
  const totalWeight = items.reduce((sum, item) => sum + (item.qty * item.weight), 0);
  const totalCBM = items.reduce((sum, item) => sum + (item.qty * item.cbm), 0);
  const totalItemsCount = items.reduce((sum, item) => sum + item.qty, 0);

  const totalFreight = (oceanFrtPerContainer * containerCount) + originH + destH; // Target Currency
  const cifValue = totalProductCost + totalFreight;
  const insuranceAmt = totalProductCost * (insuranceRate / 100);
  const customsAmt = cifValue * (customsRate / 100);
  const totalLanded = totalProductCost + totalFreight + insuranceAmt + customsAmt + inspection + banking + misc;
  
  let totalRevenue = 0;
  let totalProfit = 0;

  // Apportion costs back to items (by value proportion)
  const computedItems = items.map(item => {
    const itemTotalProductCost = (item.qty * item.unitPrice * fxRate);
    const valueProportion = totalProductCost > 0 ? (itemTotalProductCost / totalProductCost) : (items.length > 0 ? 1 / items.length : 0);
    const itemTotalLanded = totalLanded * valueProportion;
    
    const landedCostPerUnit = item.qty > 0 ? itemTotalLanded / item.qty : 0;
    const targetSellingPricePerUnit = targetMargin < 100 ? landedCostPerUnit / (1 - targetMargin / 100) : 0;
    const grossProfitPerUnit = targetSellingPricePerUnit - landedCostPerUnit;
    
    totalRevenue += (targetSellingPricePerUnit * item.qty);
    totalProfit += (grossProfitPerUnit * item.qty);

    return {
      ...item,
      totalProductCost: itemTotalProductCost,
      landedCostPerUnit,
      targetSellingPricePerUnit,
      grossProfitPerUnit
    };
  });

  const breakEven = totalRevenue > 0 ? Math.ceil(totalLanded / (totalRevenue / totalItemsCount)) : 0;
  
  // Averages for generic comparison display
  const avgCostPerUnit = totalItemsCount > 0 ? totalLanded / totalItemsCount : 0;
  const avgSellingPerUnit = totalItemsCount > 0 ? totalRevenue / totalItemsCount : 0;
  const avgProfitPerUnit = totalItemsCount > 0 ? totalProfit / totalItemsCount : 0;

  return {
    totalProductCost, totalFreight, insuranceAmt, customsAmt, totalLanded,
    computedItems, totalWeight, totalCBM, totalItemsCount,
    avgCostPerUnit, avgSellingPerUnit, avgProfitPerUnit,
    totalRevenue, totalProfit, breakEven
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
        <span className="text-[8px] font-mono text-muted-foreground uppercase tracking-widest mt-1">Gross Margin</span>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────
// Variant Selector Modal
// ──────────────────────────────────────────
function VariantSelectorModal({ product, isOpen, onClose, onSelect, addedVariantIds }: { product: any, isOpen: boolean, onClose: () => void, onSelect: (id: string) => void, addedVariantIds: string[] }) {
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) setSelectedAttrs({});
  }, [isOpen]);

  if (!isOpen || !product) return null;

  // Extract attributes if available
  const attributeMap: Record<string, Set<string>> = {};
  let hasAttributes = false;
  product.variants.forEach((v: any) => {
    if (v.attributes && v.attributes.length > 0) {
      hasAttributes = true;
      v.attributes.forEach((attrOpt: any) => {
        const attrName = attrOpt.attributeValue.attribute.name;
        const attrVal = attrOpt.attributeValue.value;
        if (!attributeMap[attrName]) attributeMap[attrName] = new Set();
        attributeMap[attrName].add(attrVal);
      });
    }
  });

  // Find matching variant based on selected attributes
  let matchedVariant: any = null;
  if (hasAttributes) {
    matchedVariant = product.variants.find((v: any) => {
      if (!v.attributes) return false;
      const vAttrs = v.attributes.map((a: any) => ({ name: a.attributeValue.attribute.name, val: a.attributeValue.value }));
      return Object.keys(attributeMap).every(attrName => 
        vAttrs.some((a: any) => a.name === attrName && a.val === selectedAttrs[attrName])
      );
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-background border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-foreground font-mono font-bold">Select Variant: {product.name}</h3>
          <button onClick={onClose} className="text-muted-foreground/50 hover:text-foreground transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {hasAttributes ? (
          <div className="space-y-6">
            {Object.keys(attributeMap).map(attrName => (
              <div key={attrName} className="space-y-2">
                <label className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest">{attrName}</label>
                <div className="flex flex-wrap gap-2">
                  {Array.from(attributeMap[attrName]).map(val => (
                    <button
                      key={val}
                      onClick={() => setSelectedAttrs(prev => ({ ...prev, [attrName]: val }))}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-bold border transition-colors cursor-pointer",
                        selectedAttrs[attrName] === val
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                          : "bg-muted border-border text-muted-foreground hover:bg-accent"
                      )}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div className="pt-4 border-t border-border">
              {matchedVariant ? (
                addedVariantIds.includes(matchedVariant.id) ? (
                  <button disabled className="w-full py-3 rounded-xl bg-muted text-muted-foreground/40 font-bold cursor-not-allowed">
                    Variant Already Added
                  </button>
                ) : (
                  <button
                    onClick={() => onSelect(matchedVariant.id)}
                    className="w-full py-3 rounded-xl bg-emerald-500 text-black font-bold uppercase tracking-wide hover:bg-emerald-400 transition-colors cursor-pointer flex justify-between px-6"
                  >
                    <span>Add {matchedVariant.sku}</span>
                    <span>{formatCurrency(matchedVariant.purchasePrice, matchedVariant.currency || 'USD')}</span>
                  </button>
                )
              ) : (
                <button disabled className="w-full py-3 rounded-xl bg-muted text-muted-foreground/40 font-bold cursor-not-allowed">
                  {Object.keys(selectedAttrs).length === Object.keys(attributeMap).length 
                    ? "Combination Unavailable" 
                    : "Select all options"}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
            {product.variants.map((v: any) => {
              const isAdded = addedVariantIds.includes(v.id);
              return (
                <button
                  key={v.id}
                  disabled={isAdded}
                  onClick={() => onSelect(v.id)}
                  className={cn(
                    "w-full flex justify-between items-center p-4 rounded-xl border text-left transition-colors",
                    isAdded 
                      ? "bg-muted border-border opacity-50 cursor-not-allowed" 
                      : "bg-white/2 border-border hover:border-emerald-500/50 hover:bg-emerald-500/5 cursor-pointer"
                  )}
                >
                  <div>
                    <p className="text-sm font-bold text-foreground/90">{v.title || v.sku}</p>
                    <p className="text-[10px] font-mono text-muted-foreground/50">{v.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-sans text-emerald-400 font-bold">{formatCurrency(v.purchasePrice, v.currency || 'USD')}</p>
                    <p className="text-[10px] font-mono text-muted-foreground/50">{v.grossWeight}kg | {v.volumeCBM}m³</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────
// Container Blueprint Component
// ──────────────────────────────────────────
const ITEM_COLORS = [
  'bg-blue-400', 'bg-amber-400', 'bg-emerald-400', 'bg-purple-400',
  'bg-rose-400', 'bg-cyan-400', 'bg-fuchsia-400', 'bg-lime-400'
];

function ContainerBlueprint({ items, totalCBM, maxCBM }: { items: any[], totalCBM: number, maxCBM: number }) {
  // Calculate width percentages for each item relative to the max capacity
  const segments = items.map((item, idx) => {
    const itemTotalCBM = item.qty * item.cbm;
    const widthPct = Math.min(100, (itemTotalCBM / maxCBM) * 100);
    return {
      ...item,
      color: ITEM_COLORS[idx % ITEM_COLORS.length],
      widthPct
    };
  });

  const remainingPct = Math.max(0, 100 - (totalCBM / maxCBM) * 100);
  const isOverloaded = totalCBM > maxCBM;

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center text-[9px] font-mono text-muted-foreground/50 uppercase tracking-widest mb-3">
        <span>[ Rear Doors ]</span>
        <span>Container Blueprint ({maxCBM} CBM)</span>
        <span>[ Nose / Front ]</span>
      </div>
      
      {/* Container Box */}
      <div className="relative w-full h-24 border-[3px] border-border rounded-sm p-1 bg-background shadow-inner flex flex-row-reverse overflow-hidden">
        {/* Draw Segments (Loaded back-to-front so flex-row-reverse pushes them to the Nose first) */}
        {segments.map((seg, i) => (
          <motion.div
            key={i}
            initial={{ width: 0 }}
            animate={{ width: `${seg.widthPct}%` }}
            className={cn('h-full border-r border-black/20 flex items-center justify-center overflow-hidden', seg.color)}
            title={`${seg._meta?.name || 'Item'} - ${seg.qty * seg.cbm} CBM`}
          >
            {seg.widthPct > 5 && (
              <span className="text-black/60 font-bold text-[10px] font-mono truncate px-1">
                {seg._meta?.sku || 'Item'}
              </span>
            )}
          </motion.div>
        ))}
        {/* Free Space Indicator */}
        {!isOverloaded && remainingPct > 0 && (
          <div className="h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiPjxwb2x5Z29uIHBvaW50cz0iMCA0MCA0MCAwIi8+PC9nPjwvc3ZnPg==')] flex items-center justify-center grow">
            <span className="text-white/20 text-[10px] font-mono uppercase">Free Space</span>
          </div>
        )}
        {/* Overload Indicator */}
        {isOverloaded && (
          <div className="absolute inset-y-0 left-0 w-8 bg-rose-500/80 backdrop-blur-sm flex items-center justify-center border-l-4 border-rose-600 shadow-[0_0_15px_rgba(244,63,94,0.5)] z-10">
            <span className="text-foreground text-[9px] font-bold rotate-180" style={{ writingMode: 'vertical-rl' }}>OVERLOAD</span>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 justify-center">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className={cn('w-2 h-2 rounded-sm', seg.color)} />
            <span className="text-[10px] font-mono text-muted-foreground">
              {seg._meta?.name || 'Item'} ({(seg.qty * seg.cbm).toFixed(1)} CBM)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────
// Main page
// ──────────────────────────────────────────
export default function CostingPage() {
  const router = useRouter();
  
  // — Global Data State —
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [savedScenarios, setSavedScenarios] = useState<CostingScenario[]>([]);
  const [loading, setLoading] = useState(true);

  // — Live Builder State —
  const [items, setItems] = useState<{ productId: string, qty: number, unitPrice: number, weight: number, cbm: number, _meta?: { name: string, sku: string } }[]>([]);
  const [purchaseCurrency, setPurchaseCurrency] = useState('USD');
  const [targetCurrency, setTargetCurrency] = useState('USD');
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
  const [pendingVariantProduct, setPendingVariantProduct] = useState<any | null>(null);
  const [pendingVariantRowIdx, setPendingVariantRowIdx] = useState<number | null>(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pRes, sRes, scRes] = await Promise.all([
        fetch('/api/products').then(r => r.json()),
        fetch('/api/suppliers').then(r => r.json()),
        fetch('/api/costing').then(r => r.json())
      ]);
      setProducts(Array.isArray(pRes) ? pRes : []);
      setSuppliers(Array.isArray(sRes) ? sRes : []);
      setSavedScenarios(Array.isArray(scRes) ? scRes : []);
      if (pRes.length > 0) {
        // Start with an empty list for a clean view
      }
    } catch { toast.error('Failed to load costing data'); }
    finally { setLoading(false); }
  };

  // Update FX Rate based on selected currencies
  const fxRate = useMemo(() => {
    const pRate = MOCK_FX_RATES[purchaseCurrency] || 1;
    const tRate = MOCK_FX_RATES[targetCurrency] || 1;
    return pRate / tRate;
  }, [purchaseCurrency, targetCurrency]);

  // Update banking rate calculation based on Total Product Cost
  const bankingAmt = useMemo(() => {
    const totalProductVal = items.reduce((sum, item) => sum + (item.qty * item.unitPrice * fxRate), 0);
    return Math.round(totalProductVal * 0.0025 * 100) / 100;
  }, [items, fxRate]);

  const live = useMemo(() => calcScenario({
    items, fxRate, oceanFrtPerContainer: oceanFrt, containerCount,
    originH, destH, insuranceRate, customsRate,
    inspection, banking: bankingAmt, misc, targetMargin
  }), [items, fxRate, oceanFrt, containerCount, originH, destH,
    insuranceRate, customsRate, inspection, bankingAmt, misc, targetMargin]);

  // Selected supplier can just be the supplier of the first item
  const selectedSupplier = suppliers.find(s => s.id === products.find(p => p.id === items[0]?.productId)?.supplierId);

  const handleReset = () => {
    setItems([]);
    setPurchaseCurrency('USD'); setTargetCurrency('USD');
    setOceanFrt(2800); setContainerCount(1);
    setOriginH(280); setDestH(420); setInsuranceRate(0.5); setCustomsRate(5.0);
    setInspection(180); setMisc(120); setTargetMargin(22); setScenarioName('');
    toast.success('Scenario reset to defaults');
  };

  const draftQuote = (sc: CostingScenario) => {
    toast.info('Drafting quote from scenario...');
    router.push(`/quotations/new?scenarioId=${sc.id}`);
  };

  const handleSave = async () => {
    if (!scenarioName.trim()) { toast.error('Enter a scenario name to save'); return; }
    setSavingScenario(true);
    try {
      const payload: Partial<CostingScenario> = {
        scenarioName: scenarioName.trim(),
        items: items.map((item, idx) => ({
          productId: item.productId,
          quantity: item.qty,
          unitPurchasePrice: item.unitPrice,
          totalProductCost: live.computedItems[idx].totalProductCost,
          volumeCBM: item.cbm,
          grossWeight: item.weight,
          landedCostPerUnit: live.computedItems[idx].landedCostPerUnit,
          targetSellingPricePerUnit: live.computedItems[idx].targetSellingPricePerUnit,
          grossProfitPerUnit: live.computedItems[idx].grossProfitPerUnit
        })),
        freight: { originPort, destinationPort: destPort, containerType, containerCount, oceanFreightPerContainer: oceanFrt, originHandling: originH, destinationHandling: destH, totalFreight: live.totalFreight, totalVolumeCBM: live.totalCBM, totalWeightKG: live.totalWeight },
        costs: { productCost: live.totalProductCost, freightCost: live.totalFreight, insuranceAmount: live.insuranceAmt, customsDuty: live.customsAmt, inspection, bankingCharges: bankingAmt, miscCharges: misc, totalLandedCost: live.totalLanded },
        rates: { insuranceRate, customsRate, targetMargin, bankingRate: 0.25 },
        result: { costPerUnit: live.avgCostPerUnit, targetSellingPricePerUnit: live.avgSellingPerUnit, grossProfitPerUnit: live.avgProfitPerUnit, totalRevenue: live.totalRevenue, totalGrossProfit: live.totalProfit, grossMarginPct: targetMargin, breakEvenQty: live.breakEven },
        currency: targetCurrency, exchangeRate: fxRate, isFavourite: false
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

  const handleProductSelect = (productId: string, idx: number) => {
    const p = products.find(x => x.id === productId);
    if (!p) return;
    
    // Check if product has variants
    if (p.variants && p.variants.length > 1) {
      setPendingVariantProduct(p);
      setPendingVariantRowIdx(idx);
    } else {
      // Add default or single variant
      const v = p.variants?.[0];
      const newItems = [...items];
      newItems[idx] = { 
        ...newItems[idx], 
        productId: v ? v.id : p.id, 
        unitPrice: v ? v.purchasePrice : (p.purchasePrice || 0), 
        weight: v ? (v.grossWeight || 1) : (p.grossWeight || 1), 
        cbm: v ? (v.volumeCBM || 0.1) : (p.cbm || 0.1),
        _meta: { name: p.name, sku: v ? v.sku : p.sku }
      };
      setItems(newItems);
    }
  };

  const handleVariantSelect = (variantId: string) => {
    if (!pendingVariantProduct || pendingVariantRowIdx === null) return;
    const v = pendingVariantProduct.variants.find((x: any) => x.id === variantId);
    if (v) {
      const newItems = [...items];
      newItems[pendingVariantRowIdx] = {
        ...newItems[pendingVariantRowIdx],
        productId: v.id,
        unitPrice: v.purchasePrice || 0,
        weight: v.grossWeight || 1,
        cbm: v.volumeCBM || 0.1,
        _meta: { name: pendingVariantProduct.name, sku: v.sku }
      };
      setItems(newItems);
    }
    setPendingVariantProduct(null);
    setPendingVariantRowIdx(null);
  };

  const loadScenario = (sc: CostingScenario) => {
    if (sc.items && sc.items.length > 0) {
      setItems(sc.items.map((item: any) => ({
        productId: item.productId,
        qty: item.quantity,
        unitPrice: item.unitPrice || item.unitPurchasePrice || 0,
        weight: item.grossWeight || item.weight || 25,
        cbm: item.volumeCBM || item.cbm || 0.04
      })));
    }
    setPurchaseCurrency('USD'); // Defaulting since it wasn't saved in old model
    setTargetCurrency(sc.currency || 'USD');
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
      scenarioName || 'Draft Scenario', live.totalItemsCount, items.length, live.totalProductCost,
      live.totalFreight, live.insuranceAmt, live.customsAmt, inspection, misc,
      live.totalLanded, live.avgCostPerUnit, live.avgSellingPerUnit, live.avgProfitPerUnit,
      live.totalRevenue, live.totalProfit, targetMargin
    ];
    const headers = ['Scenario', 'Total Qty', 'Unique Items', 'Product Cost', 'Freight', 'Insurance', 'Customs', 'Inspection', 'Misc', 'Total Landed', 'Avg Cost/Unit', 'Avg Selling/Unit', 'Avg Profit/Unit', 'Total Revenue', 'Total Profit', 'Margin%'];
    const csv = [headers.join(','), row.join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'CostingScenario.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    toast.success('Costing sheet exported');
  };

  const compareScenarios = savedScenarios.filter(s => compareIds.includes(s.id));

  const inputCls = "w-full bg-muted border border-border rounded-xl py-3 px-4 text-sm font-mono focus:outline-none focus:border-emerald-500/50 transition-all text-foreground";
  const labelCls = "text-[9px] font-mono text-muted-foreground uppercase tracking-widest";

  return (
    <>
      <PageHeaderUpdater title="Landed Cost Engine" subtitle="Precision Financial Simulation & Profitability Analysis" />
      <div className="space-y-8">

        {/* Live KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Landed Cost', value: formatCurrency(live.totalLanded, targetCurrency), color: 'text-blue-400', icon: DollarSign },
            { label: 'Avg Cost Per Unit', value: formatCurrency(live.avgCostPerUnit, targetCurrency), color: 'text-amber-400', icon: Package },
            { label: 'Avg Selling / Unit', value: formatCurrency(live.avgSellingPerUnit, targetCurrency), color: 'text-emerald-400', icon: Target },
            { label: 'Total Profit', value: formatCurrency(live.totalProfit, targetCurrency), color: 'text-purple-400', icon: TrendingUp },
          ].map((k, i) => (
            <motion.div key={i} animate={{ opacity: 1 }} className="glass p-5 rounded-3xl border border-border">
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

            {/* Currency & Logistics Profile */}
            <div className="glass p-8 rounded-4xl border border-border space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-border">
                <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Calculator size={14} className="text-blue-400" /> Currency & Logistics Profile
                </h3>
                <button onClick={handleReset} className="flex items-center gap-1.5 text-[9px] font-mono text-muted-foreground hover:text-foreground uppercase cursor-pointer bg-transparent border-none">
                  <RefreshCw size={11} /> Reset
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className={labelCls}>Purchase Currency</label>
                  <select value={purchaseCurrency} onChange={e => setPurchaseCurrency(e.target.value)} className={inputCls + ' cursor-pointer'}>
                    {Object.keys(MOCK_FX_RATES).map(c => <option key={c} value={c} className="bg-background">{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>Target Currency</label>
                  <select value={targetCurrency} onChange={e => setTargetCurrency(e.target.value)} className={inputCls + ' cursor-pointer'}>
                    {Object.keys(MOCK_FX_RATES).map(c => <option key={c} value={c} className="bg-background">{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>Container Type</label>
                  <select value={containerType} onChange={e => setContainerType(e.target.value)} className={inputCls + ' cursor-pointer'}>
                    {Object.keys(CONTAINER_CAPACITIES).map(t => <option key={t} value={t} className="bg-background">{t}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>Container Count</label>
                  <input type="number" value={containerCount} min={1} max={20} onChange={e => setContainerCount(Number(e.target.value))} className={inputCls} />
                </div>
              </div>
            </div>

            {/* Commodity Items */}
            <div className="glass p-8 rounded-4xl border border-border space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-border">
                <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Package size={14} className="text-emerald-400" /> Commodity Line Items
                </h3>
              </div>
              
              <div className="space-y-3">
                {items.length === 0 && (
                  <div className="p-6 rounded-2xl border border-border bg-white/2 text-center">
                    <p className="text-[11px] font-mono text-muted-foreground/40 uppercase tracking-widest">No line items added yet</p>
                    <p className="text-[10px] font-mono text-white/30 mt-1">Start by adding a product to this container.</p>
                  </div>
                )}
                {items.map((item, idx) => (
                  <div key={idx} className="flex flex-wrap md:flex-nowrap items-end gap-3 p-4 rounded-2xl bg-white/2 border border-border relative group">
                    <div className="w-full md:w-2/5 space-y-1.5">
                       <label className={labelCls}>Product</label>
                      <SearchableSelect
                        options={products.map(p => {
                          const addedVariantIds = items.map(i => i.productId);
                          const hasAvailableVariants = p.variants?.some((v: any) => !addedVariantIds.includes(v.id)) ?? true;
                          const isAlreadyAdded = !p.variants?.length ? addedVariantIds.includes(p.id) : !hasAvailableVariants;
                          return {
                            label: `${p.name}` + (isAlreadyAdded ? ' [Added]' : ''),
                            value: isAlreadyAdded ? '' : p.id
                          };
                        }).concat(
                          item._meta ? [{ label: `${item._meta.name} - ${item._meta.sku}`, value: item.productId }] : []
                        ).filter(o => o.value !== '')}
                        value={item.productId}
                        onChange={(val) => val && handleProductSelect(val, idx)}
                        placeholder="Search product..."
                        className="bg-muted border border-border"
                      />
                      {item._meta && <p className="text-[9px] text-emerald-400/80 mt-1 uppercase font-mono">{item._meta.name} - {item._meta.sku}</p>}
                    </div>
                    <div className="w-full md:w-1/5 space-y-1.5">
                      <label className={labelCls}>Qty</label>
                      <input type="number" value={item.qty} min={1} onChange={e => {
                        const newItems = [...items]; newItems[idx].qty = Number(e.target.value); setItems(newItems);
                      }} className={inputCls} />
                    </div>
                    <div className="w-full md:w-1/5 space-y-1.5">
                      <label className={labelCls}>Unit Cost ({purchaseCurrency})</label>
                      <input type="number" value={item.unitPrice} min={0.01} step={0.5} onChange={e => {
                        const newItems = [...items]; newItems[idx].unitPrice = Number(e.target.value); setItems(newItems);
                      }} className={inputCls} />
                    </div>
                    <div className="w-full md:w-1/5 pb-2 text-right">
                      <p className="text-[9px] text-muted-foreground/50 uppercase font-mono mb-1">Total ({targetCurrency})</p>
                      <p className="font-bold font-sans text-foreground/90">{formatCurrency(item.qty * item.unitPrice * fxRate)}</p>
                    </div>
                    <button onClick={() => setItems(items.filter((_, i) => i !== idx))}
                      className="absolute -right-2 -top-2 p-1.5 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-lg z-10">
                      <X size={12} />
                    </button>
                  </div>
                ))}
                
                {/* Temporary Add Button */}
                <button onClick={() => setItems([...items, { productId: '', qty: 100, unitPrice: 0, weight: 1, cbm: 0.1 }])} 
                  className="w-full flex items-center justify-center gap-2 text-[10px] font-mono text-emerald-400 hover:text-emerald-300 uppercase cursor-pointer bg-emerald-500/5 hover:bg-emerald-500/10 py-3 rounded-xl border border-emerald-500/10 transition-colors mt-4">
                  <PlusCircle size={12} /> Add Line Item
                </button>
              </div>
            </div>

            <div className="glass p-8 rounded-4xl border border-border space-y-4">

            {/* Freight Parameters */}
              <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-2 pb-4 border-b border-border">
                <Truck size={14} className="text-blue-400" /> Container Utilization
              </h3>
              
              {/* Capacity Utilization Progress */}
              <div className="p-5 rounded-2xl bg-white/2 border border-border space-y-4">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-muted-foreground uppercase">Capacity Utilization ({containerCount}x {containerType})</span>
                  <div className="flex gap-4">
                    <span><span className="text-blue-400">Vol:</span> {live.totalCBM.toFixed(1)} / {(CONTAINER_CAPACITIES[containerType].maxCBM * containerCount).toFixed(1)} CBM</span>
                    <span><span className="text-amber-400">Wt:</span> {live.totalWeight.toLocaleString()} / {(CONTAINER_CAPACITIES[containerType].maxWeight * containerCount).toLocaleString()} KG</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="relative h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (live.totalCBM / (CONTAINER_CAPACITIES[containerType].maxCBM * containerCount)) * 100)}%` }}
                      className={cn('absolute left-0 top-0 bottom-0', (live.totalCBM > CONTAINER_CAPACITIES[containerType].maxCBM * containerCount) ? 'bg-rose-500' : 'bg-blue-400')} />
                  </div>
                  <div className="relative h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (live.totalWeight / (CONTAINER_CAPACITIES[containerType].maxWeight * containerCount)) * 100)}%` }}
                      className={cn('absolute left-0 top-0 bottom-0', (live.totalWeight > CONTAINER_CAPACITIES[containerType].maxWeight * containerCount) ? 'bg-rose-500' : 'bg-amber-400')} />
                  </div>
                </div>
                {(live.totalCBM > CONTAINER_CAPACITIES[containerType].maxCBM * containerCount || live.totalWeight > CONTAINER_CAPACITIES[containerType].maxWeight * containerCount) && (
                  <p className="text-[10px] text-rose-400 font-mono uppercase mt-2 text-center">Warning: Cargo exceeds container capacity!</p>
                )}
                
                {/* Visual Blueprint */}
                <ContainerBlueprint 
                  items={items} 
                  totalCBM={live.totalCBM} 
                  maxCBM={CONTAINER_CAPACITIES[containerType].maxCBM * containerCount} 
                />
              </div>
            </div>

            {/* Freight Parameters */}
            <div className="glass p-8 rounded-4xl border border-border space-y-6">
              <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-2 pb-4 border-b border-border">
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
                <span className="text-muted-foreground uppercase text-[9px]">Total Freight Cost ({containerCount}x {containerType})</span>
                <span className="text-blue-400 font-bold font-sans">{formatCurrency(live.totalFreight, targetCurrency)}</span>
              </div>
            </div>

            {/* Rate Parameters */}
            <div className="glass p-8 rounded-4xl border border-border space-y-6">
              <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-2 pb-4 border-b border-border">
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
                  <div key={i} className={cn('p-4 rounded-2xl border space-y-2', item.highlight ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border bg-white/2')}>
                    <p className={cn(labelCls, item.highlight && 'text-emerald-400/60')}>{item.label}</p>
                    <input
                      type="number" value={item.value} step={item.step}
                      readOnly={!item.setter}
                      onChange={item.setter ? e => item.setter!(Number(e.target.value)) : undefined}
                      className={cn('w-full bg-transparent border-none text-xl font-bold font-sans focus:outline-none', item.highlight ? 'text-emerald-400' : 'text-foreground/90', !item.setter && 'opacity-40')}
                    />
                    {item.computed !== null && (
                      <p className="text-[9px] font-mono text-muted-foreground">= {formatCurrency(item.computed)}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Landed Cost Breakdown Table */}
            <div className="glass p-8 rounded-4xl border border-border space-y-4">
              <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-2 pb-4 border-b border-border">
                <BarChart3 size={14} className="text-purple-400" /> Full Landed Cost Breakdown
              </h3>
              <div className="space-y-2 text-xs font-mono">
                {[
                  { label: 'Product / FOB Cost', value: live.totalProductCost, pct: live.totalLanded > 0 ? (live.totalProductCost / live.totalLanded) * 100 : 0, color: 'bg-blue-500' },
                  { label: `Ocean Freight (${containerCount}x ${containerType} @ ${formatCurrency(oceanFrt, purchaseCurrency)}/CTR)`, value: live.totalFreight, pct: live.totalLanded > 0 ? (live.totalFreight / live.totalLanded) * 100 : 0, color: 'bg-purple-500' },
                  { label: `Customs Duty (${customsRate}% CIF)`, value: live.customsAmt, pct: live.totalLanded > 0 ? (live.customsAmt / live.totalLanded) * 100 : 0, color: 'bg-amber-500' },
                  { label: `Marine Insurance (${insuranceRate}%)`, value: live.insuranceAmt, pct: live.totalLanded > 0 ? (live.insuranceAmt / live.totalLanded) * 100 : 0, color: 'bg-cyan-500' },
                  { label: 'Inspection + Banking + Misc', value: inspection + bankingAmt + misc, pct: live.totalLanded > 0 ? ((inspection + bankingAmt + misc) / live.totalLanded) * 100 : 0, color: 'bg-rose-500' },
                ].map((row, i) => (
                  <div key={i} className="flex items-center gap-4 py-2 border-b border-white/3">
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-muted-foreground text-[9px] uppercase truncate">{row.label}</span>
                        <span className="text-muted-foreground font-bold ml-3 shrink-0">{formatCurrency(row.value, targetCurrency)}</span>
                      </div>
                      <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${row.pct}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className={cn('h-full rounded-full', row.color)}
                        />
                      </div>
                    </div>
                    <span className="text-[9px] text-muted-foreground w-8 text-right shrink-0">{row.pct.toFixed(0)}%</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-3 text-sm font-bold border-t border-border">
                  <span className="text-foreground/90 font-mono text-xs uppercase">Total Landed Cost</span>
                  <span className="text-blue-400 font-sans text-xl">{formatCurrency(live.totalLanded, targetCurrency)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Results + Saved Scenarios ── */}
          <div className="space-y-6 xl:col-span-1 sticky top-6 h-fit">

            {/* Margin Gauge */}
            <div className="glass p-8 rounded-4xl border border-border space-y-5">
              <MarginGauge value={targetMargin} />
              <div className="space-y-3 text-xs font-mono border-t border-border pt-5">
                {[
                  { label: 'Break-even Quantity', value: `${live.breakEven.toLocaleString()} units` },
                  { label: 'Avg Gross Profit / Unit', value: formatCurrency(live.avgProfitPerUnit, targetCurrency) },
                  { label: 'Avg Target Selling Price', value: formatCurrency(live.avgSellingPerUnit, targetCurrency) },
                  { label: 'Total Revenue', value: formatCurrency(live.totalRevenue, targetCurrency) },
                  { label: 'Total Gross Profit', value: formatCurrency(live.totalProfit, targetCurrency) },
                ].map(item => (
                  <div key={item.label} className="flex justify-between items-center">
                    <span className="text-muted-foreground uppercase text-[9px]">{item.label}</span>
                    <span className="font-bold text-muted-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Supplier Card */}
            {selectedSupplier && (
              <div className="glass p-6 rounded-4xl border border-border space-y-3">
                <h4 className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest pb-2 border-b border-border flex items-center gap-1.5">
                  <Warehouse size={11} className="text-emerald-400" /> Supplier Intelligence
                </h4>
                <p className="font-bold text-foreground/90 text-sm">{selectedSupplier.name}</p>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-muted-foreground">
                  <div><p className="text-[8px] uppercase mb-0.5">Lead Time</p><p className="font-bold text-muted-foreground">{selectedSupplier.averageLeadTime}d</p></div>
                  <div><p className="text-[8px] uppercase mb-0.5">Rating</p><p className="font-bold text-amber-400">{selectedSupplier.performanceRating}/5</p></div>
                  <div><p className="text-[8px] uppercase mb-0.5">Country</p><p className="font-bold text-muted-foreground">{selectedSupplier.country}</p></div>
                  <div><p className="text-[8px] uppercase mb-0.5">Payment</p><p className="font-bold text-muted-foreground truncate">{selectedSupplier.paymentTerms}</p></div>
                </div>
              </div>
            )}

            {/* Save Scenario */}
            <div className="glass p-6 rounded-4xl border border-emerald-500/15 space-y-3 bg-emerald-500/3">
              <h4 className="text-[9px] font-mono text-emerald-400/60 uppercase tracking-widest">Save Current Scenario</h4>
              <input type="text" value={scenarioName} onChange={e => setScenarioName(e.target.value)}
                placeholder="e.g. Basmati Japan Q4 2025"
                className="w-full bg-muted border border-border rounded-xl py-3 px-4 text-xs font-mono focus:outline-none focus:border-emerald-500/50 text-foreground" />
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={savingScenario || !scenarioName.trim()}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-emerald-500 text-black text-[9px] font-mono font-bold uppercase rounded-xl hover:bg-emerald-400 disabled:opacity-40 cursor-pointer border-none">
                  <Save size={12} /> {savingScenario ? 'Saving...' : 'Save to Ledger'}
                </button>
                <button onClick={exportCSV}
                  className="p-3 bg-muted border border-border rounded-xl text-muted-foreground hover:text-foreground cursor-pointer">
                  <FileDown size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Saved Scenarios Ledger ── */}
        <div className="glass rounded-4xl border border-border overflow-hidden">
          <button onClick={() => setShowSaved(!showSaved)}
            className="w-full flex justify-between items-center p-6 border-b border-border bg-transparent cursor-pointer">
            <div className="flex items-center gap-3">
              <ShieldCheck size={16} className="text-emerald-400" />
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Scenario Ledger</span>
              <span className="px-2 py-0.5 bg-muted rounded text-[9px] font-mono text-muted-foreground">{savedScenarios.length} saved</span>
            </div>
            {showSaved ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
          </button>

          <AnimatePresence>
            {showSaved && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono text-left">
                    <thead className="text-white/15 uppercase text-[9px] tracking-widest border-b border-border bg-white/2">
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
                                <p className="font-bold text-muted-foreground">{sc.scenarioName}</p>
                                <p className="text-[9px] text-muted-foreground">{sc.freight.containerCount}x {sc.freight.containerType} · {sc.freight.originPort}→{sc.freight.destinationPort}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-5 text-right text-muted-foreground">{formatCurrency(sc.costs.productCost, sc.currency || 'USD')}</td>
                          <td className="py-4 px-5 text-right text-muted-foreground">{formatCurrency(sc.costs.freightCost, sc.currency || 'USD')}</td>
                          <td className="py-4 px-5 text-right font-bold text-muted-foreground">{formatCurrency(sc.costs.totalLandedCost, sc.currency || 'USD')}</td>
                          <td className="py-4 px-5 text-right text-emerald-400 font-bold">{formatCurrency(sc.result.targetSellingPricePerUnit, sc.currency || 'USD')}</td>
                          <td className="py-4 px-5 text-right">
                            <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded border',
                              sc.result.grossMarginPct >= 25 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                              sc.result.grossMarginPct >= 18 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                              'text-rose-400 bg-rose-500/10 border-rose-500/20')}>
                              {sc.result.grossMarginPct}%
                            </span>
                          </td>
                          <td className="py-4 px-5 text-right text-purple-400 font-bold">{formatCurrency(sc.result.totalGrossProfit, sc.currency || 'USD')}</td>
                          <td className="py-4 px-5 text-right">
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => draftQuote(sc)} title="Draft Quote from Scenario" className="p-1.5 rounded hover:bg-blue-500/10 text-muted-foreground hover:text-blue-400 cursor-pointer bg-transparent border-none"><FileText size={11} /></button>
                              <button onClick={() => loadScenario(sc)} title="Load into builder" className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-none"><Copy size={11} /></button>
                              <button onClick={() => handleToggleFav(sc.id)} title="Toggle favourite" className="p-1.5 rounded hover:bg-amber-500/10 text-muted-foreground hover:text-amber-400 cursor-pointer bg-transparent border-none">{sc.isFavourite ? <StarOff size={11} /> : <Star size={11} />}</button>
                              <button onClick={() => toggleCompare(sc.id)} title="Compare" className={cn('p-1.5 rounded cursor-pointer bg-transparent border-none', compareIds.includes(sc.id) ? 'text-emerald-400 bg-emerald-500/10' : 'text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10')}><BarChart3 size={11} /></button>
                              <button onClick={() => handleDelete(sc.id)} title="Delete" className="p-1.5 rounded hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400 cursor-pointer bg-transparent border-none"><Trash2 size={11} /></button>
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
              <div className="p-6 border-b border-border flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <BarChart3 size={16} className="text-emerald-400" />
                  <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Scenario Comparison ({compareScenarios.length} selected)</span>
                </div>
                <button onClick={() => setCompareIds([])} className="text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-none"><X size={14} /></button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono text-left">
                  <thead className="border-b border-border text-[9px] text-white/15 uppercase tracking-widest bg-white/2">
                    <tr>
                      <th className="py-3 px-5">Metric</th>
                      {compareScenarios.map(sc => <th key={sc.id} className="py-3 px-5 text-right">{sc.scenarioName.split('—')[0].trim()}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {[
                      { label: 'Total Qty', key: (s: CostingScenario) => `${s.items.reduce((sum, i) => sum + i.quantity, 0).toLocaleString()} units` },
                      { label: 'Product Cost', key: (s: CostingScenario) => formatCurrency(s.costs.productCost, s.currency || 'USD') },
                      { label: 'Total Freight', key: (s: CostingScenario) => formatCurrency(s.costs.freightCost, s.currency || 'USD') },
                      { label: 'Customs Duty', key: (s: CostingScenario) => formatCurrency(s.costs.customsDuty, s.currency || 'USD') },
                      { label: 'Total Landed Cost', key: (s: CostingScenario) => formatCurrency(s.costs.totalLandedCost, s.currency || 'USD') },
                      { label: 'Avg Cost / Unit', key: (s: CostingScenario) => formatCurrency(s.result.costPerUnit, s.currency || 'USD') },
                      { label: 'Avg Selling / Unit', key: (s: CostingScenario) => formatCurrency(s.result.targetSellingPricePerUnit, s.currency || 'USD') },
                      { label: 'Gross Margin', key: (s: CostingScenario) => `${s.result.grossMarginPct}%` },
                      { label: 'Total Gross Profit', key: (s: CostingScenario) => formatCurrency(s.result.totalGrossProfit, s.currency || 'USD') },
                      { label: 'Break-even Qty', key: (s: CostingScenario) => `${s.result.breakEvenQty.toLocaleString()}` },
                    ].map(row => (
                      <tr key={row.label} className="hover:bg-white/2">
                        <td className="py-3 px-5 text-muted-foreground uppercase text-[9px]">{row.label}</td>
                        {compareScenarios.map(sc => <td key={sc.id} className="py-3 px-5 text-right text-muted-foreground font-bold">{row.key(sc)}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Variant Selection Modal */}
        <VariantSelectorModal
          isOpen={!!pendingVariantProduct}
          product={pendingVariantProduct}
          onClose={() => { setPendingVariantProduct(null); setPendingVariantRowIdx(null); }}
          onSelect={handleVariantSelect}
          addedVariantIds={items.map(i => i.productId)}
        />
      </div>
    </>
  );
}

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PageHeaderUpdater } from '@/components/layout/page-context';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Calculator, 
  TrendingUp, 
  AlertCircle,
  Layers
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Customer, Product, Port } from '@/types';
import { SearchableSelect } from '@/components/ui/searchable-select';

export default function EditSalesOrderPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  // Master Data State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [ports, setPorts] = useState<Port[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [orderNo, setOrderNo] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [originPortId, setOriginPortId] = useState('TYO');
  const [destinationPortId, setDestinationPortId] = useState('LAX');
  const [incoterm, setIncoterm] = useState<'FOB' | 'CFR' | 'CIF' | 'DDP' | 'EXW'>('FOB');
  const [containerType, setContainerType] = useState<'20GP' | '40GP' | '40HQ'>('20GP');
  const [paymentTerms, setPaymentTerms] = useState('30 Days Net');
  const [currency, setCurrency] = useState('USD');
  const [expectedShipment, setExpectedShipment] = useState('');
  const [remarks, setRemarks] = useState('');
  const [marginPercentage, setMarginPercentage] = useState(0);
  
  // Quotation Items State
  const [items, setItems] = useState<Array<{ variantId: string; productId: string; quantity: number; unitPrice: number }>>([
    { variantId: '', productId: '', quantity: 100, unitPrice: 0 }
  ]);

  // Form errors
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [custRes, prodRes, portRes, soRes] = await Promise.all([
          fetch('/api/customers'),
          fetch('/api/products'),
          fetch('/api/ports'),
          fetch(`/api/sales-orders/${id}`)
        ]);

        if (!custRes.ok || !prodRes.ok || !portRes.ok || !soRes.ok) throw new Error('Failed to load required data');

        const custData = await custRes.json();
        const prodData = await prodRes.json();
        const portData = await portRes.json();
        const soData = await soRes.json();

        if (soData.status !== 'DRAFT' && soData.status !== 'PENDING') {
            toast.error('Only Draft or Pending sales orders can be edited.');
            router.push(`/sales-orders/${id}`);
            return;
        }

        setCustomers(custData);
        setProducts(prodData);
        setPorts(portData);

        // Pre-fill form
        setOrderNo(soData.orderNo || '');
        setCustomerId(soData.customerId || '');
        setOriginPortId(soData.originPortId || 'TYO');
        setDestinationPortId(soData.destinationPortId || 'LAX');
        setIncoterm(soData.incoterm || 'FOB');
        setContainerType(soData.container || '20GP');
        setPaymentTerms(soData.paymentTerms || '30 Days Net');
        setCurrency(soData.currency || 'USD');
        setMarginPercentage(soData.marginPercentage || 0);
        setRemarks(soData.remarks || '');
        if (soData.expectedShipment) {
          setExpectedShipment(new Date(soData.expectedShipment).toISOString().substring(0, 10));
        }

        if (soData.items && soData.items.length > 0) {
            setItems(soData.items.map((i: any) => ({
                variantId: i.variantId || '',
                productId: i.productId || '',
                quantity: i.quantity || 0,
                unitPrice: i.unitPrice || 0
            })));
        }

      } catch (e: any) {
        toast.error(e.message);
        router.push(`/sales-orders/${id}`);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchMasterData();
  }, [id, router]);

  const handleAddItem = () => {
    setItems(prev => [...prev, { variantId: '', productId: '', quantity: 100, unitPrice: 0 }]);
  };

  const updateItem = (index: number, field: string, value: any) => {
    setItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      
      // Auto-fill price if variant is selected
      if (field === 'variantId' && value) {
        for (const p of products) {
          const v = p.variants?.find(vx => vx.id === value);
          if (v) {
            next[index].productId = p.id;
            next[index].unitPrice = p.sellingPrice; // Set cost price
            break;
          }
        }
      }
      return next;
    });
  };

  const removeItem = (index: number) => {
    if (items.length === 1) {
      toast.error('Sales order must contain at least one item');
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Live Calculations
  const calculatedItems = useMemo(() => {
    return items.map(item => {
      const prod = products.find(p => p.id === item.productId);
      const total = item.quantity * item.unitPrice;
      return {
        ...item,
        name: prod?.name || 'Select Product...',
        sku: prod?.sku || 'N/A',
        uom: prod?.uom || 'MT',
        total
      };
    });
  }, [items, products]);

  const costOfGoods = useMemo(() => {
    return calculatedItems.reduce((acc, item) => acc + item.total, 0);
  }, [calculatedItems]);

  const totalValue = useMemo(() => {
    if (marginPercentage === 0) return costOfGoods;
    const factor = 1 - (marginPercentage / 100);
    if (factor <= 0) return costOfGoods; // prevent division by zero
    return Math.round(costOfGoods / factor);
  }, [costOfGoods, marginPercentage]);

  const grossProfit = useMemo(() => {
    return totalValue - costOfGoods;
  }, [totalValue, costOfGoods]);

  const finalItems = useMemo(() => {
    if (marginPercentage === 0) return items;
    const factor = 1 - (marginPercentage / 100);
    return items.map(item => {
      const markupPrice = factor > 0 ? Number((item.unitPrice / factor).toFixed(2)) : item.unitPrice;
      return {
        variantId: item.variantId,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: markupPrice,
        totalPrice: Number((markupPrice * item.quantity).toFixed(2))
      };
    });
  }, [items, marginPercentage]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setValidationErrors([]);

    if (!customerId) {
      setValidationErrors(['Please select a valid customer node']);
      return;
    }

    const invalidRow = items.find(item => !item.variantId || item.quantity <= 0 || item.unitPrice <= 0);
    if (invalidRow) {
      setValidationErrors(['Please verify product quantities and pricing in all rows']);
      return;
    }

    const payload = {
      customerId,
      expectedShipment: expectedShipment ? new Date(expectedShipment).toISOString() : null,
      currency,
      incoterm,
      paymentTerms,
      originPortId,
      destinationPortId,
      container: containerType,
      items: finalItems,
      totalValue,
      marginPercentage,
      remarks,
    };

    try {
      const res = await fetch(`/api/sales-orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to update sales order');
      toast.success('Sales order updated successfully');
      router.push(`/sales-orders/${id}`);
    } catch (err: any) {
      setValidationErrors([err.message]);
    }
  };

  if (loading) {
    return <div className="p-8 text-muted-foreground/50 text-xs font-mono uppercase tracking-widest">Loading order data...</div>;
  }

  // Generate options for dropdowns
  const customerOptions = customers.map(c => ({ value: c.id, label: c.name, description: c.country }));
  const portOptions = ports.map(p => ({ value: p.id, label: `${p.code} - ${p.name}`, description: p.country }));
  const variantOptions = products.flatMap(p => 
    (p.variants || []).map(v => ({
      value: v.id,
      label: `${p.name} - ${v.sku}`,
      description: `Stock: ${v.inventory || 0} ${p.uom}`
    }))
  );

  return (
    <>
      <PageHeaderUpdater title={`Edit ${orderNo || 'Sales Order'}`} subtitle="Modify contract terms and items" />
      <div className="max-w-5xl mx-auto space-y-6">
        
        {validationErrors.length > 0 && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <div className="flex items-center gap-2 mb-2 font-bold text-xs uppercase tracking-widest">
              <AlertCircle size={14} /> Validation Failed
            </div>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="glass p-6 rounded-3xl border border-border space-y-6">
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-2">
              <Layers size={14} /> Contract Metadata
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50">Buyer / Consignee</label>
                <SearchableSelect
                  options={customerOptions}
                  value={customerId}
                  onChange={setCustomerId}
                  placeholder="Select counterparty node..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50">Origin Port</label>
                  <select value={originPortId} onChange={e => setOriginPortId(e.target.value)} className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground/90 outline-none focus:border-blue-500/50 transition-all">
                    {ports.map(p => <option key={p.id} value={p.id}>{p.code}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50">Destination Port</label>
                  <select value={destinationPortId} onChange={e => setDestinationPortId(e.target.value)} className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground/90 outline-none focus:border-blue-500/50 transition-all">
                    {ports.map(p => <option key={p.id} value={p.id}>{p.code}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50">Incoterm</label>
                  <select value={incoterm} onChange={e => setIncoterm(e.target.value as any)} className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground/90 outline-none focus:border-blue-500/50 transition-all">
                    <option value="FOB">FOB</option>
                    <option value="CFR">CFR</option>
                    <option value="CIF">CIF</option>
                    <option value="DDP">DDP</option>
                    <option value="EXW">EXW</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50">Currency</label>
                  <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground/90 outline-none focus:border-blue-500/50 transition-all">
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="JPY">JPY</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50">Container Type</label>
                  <select value={containerType} onChange={e => setContainerType(e.target.value as any)} className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground/90 outline-none focus:border-blue-500/50 transition-all">
                    <option value="20GP">20' GP</option>
                    <option value="40GP">40' GP</option>
                    <option value="40HQ">40' HQ</option>
                    <option value="LCL">LCL</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50">Payment Terms</label>
                  <input type="text" value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground/90 outline-none focus:border-blue-500/50 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50">Expected Shipment Date</label>
                  <input type="date" value={expectedShipment} onChange={e => setExpectedShipment(e.target.value)} className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground/90 outline-none focus:border-blue-500/50 transition-all scheme-dark" />
                </div>
              </div>
            </div>
          </div>

          <div className="glass rounded-3xl border border-border overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between bg-black/20">
              <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-blue-400 flex items-center gap-2">
                <Calculator size={14} /> Line Items
              </h2>
              <button type="button" onClick={handleAddItem} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-[10px] font-mono uppercase hover:bg-blue-500/20 transition-all">
                <Plus size={12} /> Add Row
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-200">
                <thead>
                  <tr className="border-b border-border bg-white/2">
                    <th className="py-3 px-6 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/40 w-12">#</th>
                    <th className="py-3 px-6 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/40 min-w-62.5">SKU / Variant</th>
                    <th className="py-3 px-6 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/40 w-32">Qty</th>
                    <th className="py-3 px-6 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/40 w-32">Base Unit Px</th>
                    <th className="py-3 px-6 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/40 w-40">Base Total</th>
                    <th className="py-3 px-6 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {calculatedItems.map((item, i) => (
                    <tr key={i} className="hover:bg-white/2 transition-colors">
                      <td className="py-3 px-6 text-xs text-white/30 font-mono">{String(i + 1).padStart(2, '0')}</td>
                      <td className="py-3 px-6">
                        <SearchableSelect
                          options={variantOptions}
                          value={item.variantId}
                          onChange={(val) => updateItem(i, 'variantId', val)}
                          placeholder="Search products..."
                        />
                      </td>
                      <td className="py-3 px-6">
                        <div className="flex items-center bg-muted border border-border rounded-xl px-2 focus-within:border-blue-500/50 transition-all">
                          <input 
                            type="number" min="1" 
                            value={item.quantity} onChange={e => updateItem(i, 'quantity', parseInt(e.target.value) || 0)}
                            className="w-full bg-transparent py-2.5 text-sm text-foreground/90 outline-none font-mono"
                          />
                          <span className="text-xs text-white/30 font-mono ml-2">{item.uom}</span>
                        </div>
                      </td>
                      <td className="py-3 px-6">
                        <div className="flex items-center gap-2">
                          <span className="text-white/30 text-xs">$</span>
                          <input 
                            type="number" min="0" step="0.01"
                            value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground/90 outline-none focus:border-blue-500/50 transition-all font-mono"
                          />
                        </div>
                      </td>
                      <td className="py-3 px-6 text-sm text-muted-foreground font-mono">
                        {formatCurrency(item.total)}
                      </td>
                      <td className="py-3 px-6 text-right">
                        <button type="button" onClick={() => removeItem(i)} className="p-2 text-white/30 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50">Logistics / Compliance Remarks</label>
              <textarea 
                value={remarks} onChange={e => setRemarks(e.target.value)}
                placeholder="Include special packaging instructions, pallet requirements, or customs declarations..."
                className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground/90 outline-none focus:border-blue-500/50 transition-all h-32 resize-none"
              />
            </div>
            
            <div className="glass p-6 rounded-3xl border border-border space-y-4">
              <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50 flex items-center gap-2 mb-4">
                <TrendingUp size={12} /> Pricing Engine
              </h3>
              
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/40">Apply Markup Margin (%)</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="range" min="0" max="60" step="1"
                    value={marginPercentage} onChange={e => setMarginPercentage(parseInt(e.target.value))}
                    className="flex-1 accent-emerald-500"
                  />
                  <span className="text-emerald-400 font-mono font-bold w-12 text-right">{marginPercentage}%</span>
                </div>
                <p className="text-[9px] text-white/30 mt-1">Pricing applied automatically to unit cost</p>
              </div>

              <div className="pt-4 mt-4 border-t border-border space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground/40">Cost of Goods:</span>
                  <span className="font-mono text-muted-foreground">{formatCurrency(costOfGoods)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-emerald-400/70">Est. Gross Profit:</span>
                  <span className="font-mono text-emerald-400">+{formatCurrency(grossProfit)}</span>
                </div>
                <div className="flex justify-between text-lg pt-2 mt-2 border-t border-border">
                  <span className="text-muted-foreground font-bold">Total Sales:</span>
                  <span className="font-mono text-foreground font-bold">{formatCurrency(totalValue)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6">
            <button type="button" onClick={() => router.back()} className="px-6 py-3 rounded-2xl border border-border text-muted-foreground hover:bg-muted text-xs font-bold uppercase tracking-widest transition-all">
              Discard Changes
            </button>
            <button type="submit" className="px-8 py-3 rounded-2xl bg-blue-500 text-black hover:bg-blue-400 text-xs font-bold uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]">
              Save Contract Updates
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

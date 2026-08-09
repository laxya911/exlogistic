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

export default function EditQuotationPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  // Master Data State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [ports, setPorts] = useState<Port[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [customerId, setCustomerId] = useState('');
  const [originPortId, setOriginPortId] = useState('TYO');
  const [destinationPortId, setDestinationPortId] = useState('LAX');
  const [incoterm, setIncoterm] = useState<'FOB' | 'CFR' | 'CIF' | 'DDP' | 'EXW'>('FOB');
  const [containerType, setContainerType] = useState<'20GP' | '40GP' | '40HQ'>('20GP');
  const [paymentTerms, setPaymentTerms] = useState('30 Days Net');
  const [currency, setCurrency] = useState('USD');
  const [validityDays, setValidityDays] = useState(30);
  const [remarks, setRemarks] = useState('');
  const [marginPercentage, setMarginPercentage] = useState(25);
  
  // Quotation Items State
  const [items, setItems] = useState<Array<{ variantId: string; productId: string; quantity: number; unitPrice: number }>>([
    { variantId: '', productId: '', quantity: 100, unitPrice: 0 }
  ]);

  // Form errors
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    if (id) {
      fetchMetadata();
    }
  }, [id]);

  const fetchMetadata = async () => {
    try {
      const [cRes, pRes, qRes] = await Promise.all([
        fetch('/api/customers').then(r => r.json()),
        fetch('/api/products').then(r => r.json()),
        fetch(`/api/quotations/${id}`).then(r => {
          if (!r.ok) throw new Error('Quotation not found');
          return r.json();
        })
      ]);
      setCustomers(cRes);
      setProducts(pRes);
      
      setPorts([
        { id: 'TYO', name: 'Tokyo', code: 'JP TYO', country: 'Japan', type: 'SEA', entityStatus: 'ACTIVE', createdAt: '', updatedAt: '' },
        { id: 'OSA', name: 'Osaka', code: 'JP OSA', country: 'Japan', type: 'SEA', entityStatus: 'ACTIVE', createdAt: '', updatedAt: '' },
        { id: 'LAX', name: 'Los Angeles', code: 'US LAX', country: 'USA', type: 'SEA', entityStatus: 'ACTIVE', createdAt: '', updatedAt: '' },
        { id: 'SIN', name: 'Singapore', code: 'SG SIN', country: 'Singapore', type: 'SEA', entityStatus: 'ACTIVE', createdAt: '', updatedAt: '' }
      ]);

      if (qRes) {
        setCustomerId(qRes.customerId || '');
        setOriginPortId(qRes.originPortId || 'TYO');
        setDestinationPortId(qRes.destinationPortId || 'LAX');
        setIncoterm(qRes.incoterm || 'FOB');
        setContainerType(qRes.containerType || '20GP');
        setPaymentTerms(qRes.paymentTerms || '30 Days Net');
        setCurrency(qRes.currency || 'USD');
        setRemarks(qRes.remarks || '');
        const margin = qRes.marginPercentage || 25;
        setMarginPercentage(margin);
        
        // Reverse calculate validity days from date and validityDate
        if (qRes.date && qRes.validityDate) {
          const diff = new Date(qRes.validityDate).getTime() - new Date(qRes.date).getTime();
          setValidityDays(Math.max(1, Math.round(diff / 86400000)));
        }

        const loadedItems = (qRes.items || []).map((i: any) => ({
          variantId: i.variantId || '',
          productId: i.productId || '',
          quantity: i.quantity,
          // Calculate cost price (unitPrice in DB is the selling price)
          unitPrice: margin === 100 ? 0 : Number((i.unitPrice * (1 - (margin / 100))).toFixed(2))
        }));
        
        if (loadedItems.length > 0) {
          setItems(loadedItems);
        }
      }
    } catch (e) {
      toast.error('Failed to load quotation data');
      router.push('/quotations');
    } finally {
      setLoading(false);
    }
  };

  const handleProductChange = (index: number, variantId: string) => {
    let standardPrice = 0;
    let parentProductId = '';
    for (const p of products) {
      const v = p.variants?.find((x: any) => x.id === variantId);
      if (v) {
        standardPrice = v.sellingPrice || 0;
        parentProductId = p.id;
        break;
      }
    }
    
    setItems(prev => prev.map((item, i) => i === index ? {
      ...item,
      variantId,
      productId: parentProductId,
      unitPrice: standardPrice
    } : item));
  };

  const updateItemField = (index: number, field: 'quantity' | 'unitPrice', value: number) => {
    setItems(prev => prev.map((item, i) => i === index ? {
      ...item,
      [field]: value
    } : item));
  };

  const addItemRow = () => {
    const defaultProduct = products[0]?.id || '';
    const defaultVariant = products[0]?.variants?.[0]?.id || '';
    const defaultPrice = products[0]?.variants?.[0]?.sellingPrice || products[0]?.sellingPrice || 120;
    setItems(prev => [...prev, { variantId: defaultVariant, productId: defaultProduct, quantity: 100, unitPrice: defaultPrice }]);
  };

  const removeItemRow = (index: number) => {
    if (items.length === 1) {
      toast.error('Quotation must contain at least one item');
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

  // Margin calculation: totalValue = costOfGoods / (1 - marginPercentage/100)
  const totalValue = useMemo(() => {
    const factor = 1 - (marginPercentage / 100);
    if (factor <= 0) return costOfGoods; // prevent division by zero
    return Math.round(costOfGoods / factor);
  }, [costOfGoods, marginPercentage]);

  const grossProfit = useMemo(() => {
    return totalValue - costOfGoods;
  }, [totalValue, costOfGoods]);

  // Adjust unitPrice in items payload to include margin before submission
  // so that totalPrice = unitPrice * qty reflects the proposal price!
  const finalItems = useMemo(() => {
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
      validityDate: new Date(Date.now() + validityDays * 86400000).toISOString(),
      currency,
      exchangeRate: currency === 'USD' ? 1 : currency === 'JPY' ? 158.5 : 83.5,
      incoterm,
      paymentTerms,
      originPortId,
      destinationPortId,
      containerType,
      items: finalItems,
      totalValue,
      marginPercentage,
      remarks,
    };

    try {
      const res = await fetch(`/api/quotations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to update quotation');
      toast.success('Proposal updated successfully');
      router.push(`/quotations/${id}`);
    } catch (err: any) {
      setValidationErrors([err.message]);
    }
  };

  if (loading) {
    return <div className="p-8 text-muted-foreground/50 text-xs font-mono uppercase tracking-widest">Loading proposal data...</div>;
  }

  return (
    <>
      <PageHeaderUpdater title="Edit Proposal" subtitle="Quotation Configurator & Profit Margin Simulator" />
      <div className="space-y-6">
        {/* Back navigation */}
        <div className="flex justify-between items-center">
          <button 
            onClick={() => router.push(`/quotations/${id}`)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted border border-border text-[10px] font-mono uppercase text-foreground/90 hover:bg-accent hover:text-foreground cursor-pointer"
          >
            <ArrowLeft size={12} /> Cancel Editing
          </button>
        </div>

        {/* Validation constraints */}
        {validationErrors.length > 0 && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl mb-6 space-y-1">
            <p className="text-xs font-mono font-bold text-rose-400 flex items-center gap-2">
              <AlertCircle size={14} /> Proposal constraints violated:
            </p>
            <ul className="list-disc list-inside text-[10px] font-mono text-rose-300">
              {validationErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left panel: Parameters Configuration */}
          <div className="lg:col-span-4 glass p-8 rounded-4xl border border-border space-y-6">
            <h3 className="text-sm font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-2 pb-4 border-b border-border">
              <Calculator size={14} className="text-blue-400" /> Commercial Parameters
            </h3>

            <div className="space-y-4 font-mono text-xs">
              {/* Customer */}
              <div className="space-y-1.5">
                <label className="text-[9px] text-muted-foreground uppercase">Customer CRM Node</label>
                <SearchableSelect
                  options={customers.map(c => ({ value: c.id, label: `${c.name} (${c.country})` }))}
                  value={customerId}
                  onChange={setCustomerId}
                  placeholder="Select Customer..."
                />
              </div>

              {/* Incoterms & Container */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] text-muted-foreground uppercase">Incoterm Rule</label>
                  <SearchableSelect
                    options={[
                      { value: 'FOB', label: 'FOB' },
                      { value: 'CFR', label: 'CFR' },
                      { value: 'CIF', label: 'CIF' },
                      { value: 'DDP', label: 'DDP' },
                      { value: 'EXW', label: 'EXW' }
                    ]}
                    value={incoterm}
                    onChange={setIncoterm}
                    placeholder="Select Incoterm..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] text-muted-foreground uppercase">Container Allocation</label>
                  <SearchableSelect
                    options={[
                      { value: '20GP', label: "20' Dry Container (20GP)" },
                      { value: '40GP', label: "40' Dry Container (40GP)" },
                      { value: '40HQ', label: "40' High Cube (40HQ)" }
                    ]}
                    value={containerType}
                    onChange={setContainerType}
                    placeholder="Select Container..."
                  />
                </div>
              </div>

              {/* Ports selection */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] text-muted-foreground uppercase">Origin Port</label>
                  <SearchableSelect
                    options={ports.map(p => ({ value: p.id, label: p.name }))}
                    value={originPortId}
                    onChange={setOriginPortId}
                    placeholder="Select Port..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] text-muted-foreground uppercase">Discharge Port</label>
                  <SearchableSelect
                    options={ports.map(p => ({ value: p.id, label: p.name }))}
                    value={destinationPortId}
                    onChange={setDestinationPortId}
                    placeholder="Select Port..."
                  />
                </div>
              </div>

              {/* Currency & Payment Terms */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] text-muted-foreground uppercase">Currency</label>
                  <SearchableSelect
                    options={[
                      { value: 'USD', label: 'USD ($)' },
                      { value: 'JPY', label: 'JPY (¥)' },
                      { value: 'INR', label: 'INR (₹)' }
                    ]}
                    value={currency}
                    onChange={setCurrency}
                    placeholder="Select Currency..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] text-muted-foreground uppercase">Validity Period (Days)</label>
                  <input 
                    type="number" 
                    value={validityDays}
                    onChange={(e) => setValidityDays(Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-xl py-3 px-4 text-xs font-mono text-foreground focus:outline-none"
                    min={1}
                  />
                </div>
              </div>

              {/* Payment Terms */}
              <div className="space-y-1.5">
                <label className="text-[9px] text-muted-foreground uppercase">Invoicing Payment Terms</label>
                <SearchableSelect
                  options={[
                    { value: '30 Days Net', label: '30 Days Net' },
                    { value: '15 Days Advance', label: '15 Days Advance' },
                    { value: 'LC at Sight', label: 'LC at Sight' }
                  ]}
                  value={paymentTerms}
                  onChange={setPaymentTerms}
                  placeholder="Select Payment Terms..."
                />
              </div>

              {/* Remarks */}
              <div className="space-y-1.5">
                <label className="text-[9px] text-muted-foreground uppercase">Negotiation Remarks / Clauses</label>
                <textarea 
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Insert special cargo parameters or quality inspection requirements..."
                  className="w-full bg-background border border-border rounded-xl p-3 text-xs font-mono text-foreground focus:outline-none min-h-20"
                />
              </div>
            </div>
          </div>

          {/* Right Panel: Items Configurator Grid */}
          <div className="lg:col-span-8 space-y-8">
            <div className="glass p-8 rounded-4xl border border-border space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-border">
                <h3 className="text-sm font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Layers size={14} className="text-blue-400" /> Commodity Line Items
                </h3>
                <button 
                  type="button" 
                  onClick={addItemRow}
                  className="flex items-center gap-1 px-3 py-1.5 bg-muted hover:bg-accent text-foreground/90 hover:text-foreground rounded-lg text-[9px] font-mono uppercase cursor-pointer border-none"
                >
                  <Plus size={12} /> Add Commodity
                </button>
              </div>

              {/* Items Table Form */}
              <div className="space-y-4">
                {items.map((item, idx) => (
                  <div key={idx} className="flex flex-wrap gap-4 items-center p-4 bg-white/2 rounded-2xl border border-border relative group">
                    {/* Commodity selector */}
                    <div className="flex-1 min-w-50 space-y-1">
                      <label className="text-[8px] font-mono text-muted-foreground uppercase">Commodity / SKU</label>
                      <SearchableSelect
                        options={products.flatMap(p => (p.variants || []).map((v: any) => ({
                          value: v.id, 
                          label: `${p.name} - ${v.sku}`
                        })))}
                        value={item.variantId}
                        onChange={(val) => handleProductChange(idx, val)}
                        placeholder="Select Commodity..."
                        className="text-xs"
                      />
                    </div>

                    {/* Quantity */}
                    <div className="w-24 space-y-1">
                      <label className="text-[8px] font-mono text-muted-foreground uppercase">Quantity (MT)</label>
                      <input 
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItemField(idx, 'quantity', Number(e.target.value))}
                        className="w-full bg-background border border-border rounded-lg p-2.5 text-xs text-foreground font-mono focus:outline-none text-right"
                        min={1}
                      />
                    </div>

                    {/* Cost price */}
                    <div className="w-28 space-y-1">
                      <label className="text-[8px] font-mono text-muted-foreground uppercase">FOB Cost / Unit</label>
                      <input 
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateItemField(idx, 'unitPrice', Number(e.target.value))}
                        className="w-full bg-background border border-border rounded-lg p-2.5 text-xs text-foreground font-mono focus:outline-none text-right"
                        min={0.01}
                        step="0.01"
                      />
                    </div>

                    {/* Total cost */}
                    <div className="w-28 text-right pr-4 space-y-1">
                      <p className="text-[8px] font-mono text-muted-foreground uppercase">Total FOB Cost</p>
                      <p className="font-sans font-bold text-xs text-muted-foreground py-2.5">{formatCurrency(item.quantity * item.unitPrice)}</p>
                    </div>

                    {/* Remove row */}
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        className="p-2 rounded bg-transparent border-none text-white/25 group-hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer self-end"
                        title="Remove Commodity Row"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Profit Margin Simulator cost sheet */}
            <div className="glass p-8 rounded-4xl border border-border space-y-6">
              <h3 className="text-sm font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-2 pb-4 border-b border-border">
                <TrendingUp size={14} className="text-emerald-400" /> Margin & Cost Sheet Simulator
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Margin slider */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-muted-foreground">Target Profit Margin</span>
                    <span className="text-emerald-400 font-bold">{marginPercentage}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="5" 
                    max="60" 
                    value={marginPercentage}
                    onChange={(e) => setMarginPercentage(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer bg-accent rounded-lg h-2"
                  />
                  <div className="flex justify-between text-[9px] text-muted-foreground font-mono">
                    <span>5% Minimum</span>
                    <span>30% Standard</span>
                    <span>60% Aggressive</span>
                  </div>
                </div>

                {/* Final calculations ledger */}
                <div className="space-y-3 font-mono text-xs border-l border-border pl-8">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total FOB Cargo Cost</span>
                    <span>{formatCurrency(costOfGoods)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Configured Profit ({marginPercentage}%)</span>
                    <span>+ {formatCurrency(grossProfit)}</span>
                  </div>
                  <div className="h-px bg-muted my-2" />
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-muted-foreground">Proposed Contract Value</span>
                    <span className="text-blue-400 font-sans text-base">{formatCurrency(totalValue)}</span>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-4 pt-6 border-t border-border">
                <button
                  type="button"
                  onClick={() => router.push(`/quotations/${id}`)}
                  className="px-6 py-3 bg-muted border border-border rounded-xl text-[10px] font-mono uppercase tracking-widest hover:bg-accent cursor-pointer border-none text-foreground"
                >
                  Discard Changes
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-[#9b5de5] text-foreground font-bold rounded-xl text-[10px] font-mono uppercase tracking-widest hover:bg-[#8b4de5] cursor-pointer border-none"
                >
                  Save Proposal Edits
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}

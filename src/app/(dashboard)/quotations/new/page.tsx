'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeaderUpdater } from '@/components/layout/page-context';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Calculator, 
  TrendingUp, 
  Percent, 
  DollarSign, 
  Layers, 
  Clock, 
  Anchor, 
  AlertCircle,
  HelpCircle,
  FileText
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Customer, Product, Port } from '@/types';
import { useQuotations } from '@/hooks/useQuotations';

export default function NewQuotationPage() {
  const router = useRouter();
  const { createQuotation } = useQuotations();

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
  const [items, setItems] = useState<Array<{ productId: string; quantity: number; unitPrice: number }>>([
    { productId: '', quantity: 100, unitPrice: 0 }
  ]);

  // Form errors
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    fetchMetadata();
  }, []);

  const fetchMetadata = async () => {
    try {
      const [cRes, pRes] = await Promise.all([
        fetch('/api/customers').then(r => r.json()),
        fetch('/api/products').then(r => r.json())
      ]);
      setCustomers(cRes);
      setProducts(pRes);
      
      setPorts([
        { id: 'TYO', name: 'Tokyo', code: 'JP TYO', country: 'Japan', type: 'SEA', entityStatus: 'ACTIVE', createdAt: '', updatedAt: '' },
        { id: 'OSA', name: 'Osaka', code: 'JP OSA', country: 'Japan', type: 'SEA', entityStatus: 'ACTIVE', createdAt: '', updatedAt: '' },
        { id: 'LAX', name: 'Los Angeles', code: 'US LAX', country: 'USA', type: 'SEA', entityStatus: 'ACTIVE', createdAt: '', updatedAt: '' },
        { id: 'SIN', name: 'Singapore', code: 'SG SIN', country: 'Singapore', type: 'SEA', entityStatus: 'ACTIVE', createdAt: '', updatedAt: '' }
      ]);

      if (cRes.length > 0) setCustomerId(cRes[0].id);
      if (pRes.length > 0) {
        // Set first product as default
        setItems([{ productId: pRes[0].id, quantity: 100, unitPrice: pRes[0].sellingPrice || 120 }]);
      }
    } catch (e) {
      toast.error('Failed to sync master matrix metadata');
    } finally {
      setLoading(false);
    }
  };

  const handleProductChange = (index: number, productId: string) => {
    const prod = products.find(p => p.id === productId);
    const standardPrice = prod ? prod.sellingPrice : 0;
    
    setItems(prev => prev.map((item, i) => i === index ? {
      ...item,
      productId,
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
    const defaultPrice = products[0]?.sellingPrice || 120;
    setItems(prev => [...prev, { productId: defaultProduct, quantity: 100, unitPrice: defaultPrice }]);
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
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: markupPrice,
        totalPrice: Number((markupPrice * item.quantity).toFixed(2))
      };
    });
  }, [items, marginPercentage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);

    if (!customerId) {
      setValidationErrors(['Please select a valid customer node']);
      return;
    }

    const invalidRow = items.find(item => !item.productId || item.quantity <= 0 || item.unitPrice <= 0);
    if (invalidRow) {
      setValidationErrors(['Please verify product quantities and pricing in all rows']);
      return;
    }

    const quotationNo = `QT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const payload = {
      quotationNo,
      customerId,
      date: new Date().toISOString(),
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
      status: 'DRAFT' as const,
      version: 1,
      remarks,
      documents: [],
      timeline: []
    };

    const result = await createQuotation(payload);
    if (result.success) {
      router.push('/quotations');
    } else if (result.error) {
      setValidationErrors(result.error.split(' | '));
    }
  };

  return (
    <>
      <PageHeaderUpdater title="Create Proposal" subtitle="Quotation Configurator & Profit Margin Simulator" />
      <div className="space-y-6">
        {/* Back navigation */}
        <div className="flex justify-between items-center">
          <button 
            onClick={() => router.push('/quotations')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-mono uppercase text-white/90 hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <ArrowLeft size={12} /> Back to Vault
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
          <div className="lg:col-span-4 glass p-8 rounded-4xl border border-white/5 space-y-6">
            <h3 className="text-sm font-mono text-white/70 uppercase tracking-widest flex items-center gap-2 pb-4 border-b border-white/5">
              <Calculator size={14} className="text-blue-400" /> Commercial Parameters
            </h3>

            <div className="space-y-4 font-mono text-xs">
              {/* Customer */}
              <div className="space-y-1.5">
                <label className="text-[9px] text-white/80 uppercase">Customer CRM Node</label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-xs font-mono text-white focus:outline-none focus:border-blue-500/50"
                  required
                >
                  <option value="" disabled>Select Customer...</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id} className="bg-[#0b0b0b]">{c.name} ({c.country})</option>
                  ))}
                </select>
              </div>

              {/* Incoterms & Container */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] text-white/80 uppercase">Incoterm Rule</label>
                  <select
                    value={incoterm}
                    onChange={(e) => setIncoterm(e.target.value as any)}
                    className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-xs font-mono text-white focus:outline-none"
                  >
                    <option value="FOB">FOB</option>
                    <option value="CFR">CFR</option>
                    <option value="CIF">CIF</option>
                    <option value="DDP">DDP</option>
                    <option value="EXW">EXW</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] text-white/80 uppercase">Container Allocation</label>
                  <select
                    value={containerType}
                    onChange={(e) => setContainerType(e.target.value as any)}
                    className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-xs font-mono text-white focus:outline-none"
                  >
                    <option value="20GP">20' Dry Container (20GP)</option>
                    <option value="40GP">40' Dry Container (40GP)</option>
                    <option value="40HQ">40' High Cube (40HQ)</option>
                  </select>
                </div>
              </div>

              {/* Ports selection */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] text-white/80 uppercase">Origin Port</label>
                  <select
                    value={originPortId}
                    onChange={(e) => setOriginPortId(e.target.value)}
                    className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-xs font-mono text-white focus:outline-none"
                  >
                    {ports.map(p => (
                      <option key={p.id} value={p.id} className="bg-[#0b0b0b]">{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] text-white/80 uppercase">Discharge Port</label>
                  <select
                    value={destinationPortId}
                    onChange={(e) => setDestinationPortId(e.target.value)}
                    className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-xs font-mono text-white focus:outline-none"
                  >
                    {ports.map(p => (
                      <option key={p.id} value={p.id} className="bg-[#0b0b0b]">{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Currency & Payment Terms */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] text-white/80 uppercase">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-xs font-mono text-white focus:outline-none"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="JPY">JPY (¥)</option>
                    <option value="INR">INR (₹)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] text-white/80 uppercase">Validity Period (Days)</label>
                  <input 
                    type="number" 
                    value={validityDays}
                    onChange={(e) => setValidityDays(Number(e.target.value))}
                    className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-xs font-mono text-white focus:outline-none"
                    min={1}
                  />
                </div>
              </div>

              {/* Payment Terms */}
              <div className="space-y-1.5">
                <label className="text-[9px] text-white/80 uppercase">Invoicing Payment Terms</label>
                <select 
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-xs font-mono text-white focus:outline-none"
                >
                  <option value="30 Days Net">30 Days Net</option>
                  <option value="15 Days Advance">15 Days Advance</option>
                  <option value="LC at Sight">LC at Sight</option>
                </select>
              </div>

              {/* Remarks */}
              <div className="space-y-1.5">
                <label className="text-[9px] text-white/80 uppercase">Negotiation Remarks / Clauses</label>
                <textarea 
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Insert special cargo parameters or quality inspection requirements..."
                  className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl p-3 text-xs font-mono text-white focus:outline-none min-h-[80px]"
                />
              </div>
            </div>
          </div>

          {/* Right Panel: Items Configurator Grid */}
          <div className="lg:col-span-8 space-y-8">
            <div className="glass p-8 rounded-4xl border border-white/5 space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-white/5">
                <h3 className="text-sm font-mono text-white/70 uppercase tracking-widest flex items-center gap-2">
                  <Layers size={14} className="text-blue-400" /> Commodity Line Items
                </h3>
                <button 
                  type="button" 
                  onClick={addItemRow}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/90 hover:text-white rounded-lg text-[9px] font-mono uppercase cursor-pointer border-none"
                >
                  <Plus size={12} /> Add Commodity
                </button>
              </div>

              {/* Items Table Form */}
              <div className="space-y-4">
                {items.map((item, idx) => (
                  <div key={idx} className="flex flex-wrap gap-4 items-center p-4 bg-white/2 rounded-2xl border border-white/5 relative group">
                    {/* Commodity selector */}
                    <div className="flex-1 min-w-[200px] space-y-1">
                      <label className="text-[8px] font-mono text-white/70 uppercase">Commodity / SKU</label>
                      <select
                        value={item.productId}
                        onChange={(e) => handleProductChange(idx, e.target.value)}
                        className="w-full bg-[#0b0b0b] border border-white/10 rounded-lg p-2.5 text-xs text-white font-mono focus:outline-none"
                      >
                        <option value="" disabled>Select Commodity...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div className="w-24 space-y-1">
                      <label className="text-[8px] font-mono text-white/70 uppercase">Quantity (MT)</label>
                      <input 
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItemField(idx, 'quantity', Number(e.target.value))}
                        className="w-full bg-[#0b0b0b] border border-white/10 rounded-lg p-2.5 text-xs text-white font-mono focus:outline-none text-right"
                        min={1}
                      />
                    </div>

                    {/* Cost price */}
                    <div className="w-28 space-y-1">
                      <label className="text-[8px] font-mono text-white/70 uppercase">FOB Cost / Unit</label>
                      <input 
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateItemField(idx, 'unitPrice', Number(e.target.value))}
                        className="w-full bg-[#0b0b0b] border border-white/10 rounded-lg p-2.5 text-xs text-white font-mono focus:outline-none text-right"
                        min={0.01}
                        step="0.01"
                      />
                    </div>

                    {/* Total cost */}
                    <div className="w-28 text-right pr-4 space-y-1">
                      <p className="text-[8px] font-mono text-white/70 uppercase">Total FOB Cost</p>
                      <p className="font-sans font-bold text-xs text-white/80 py-2.5">{formatCurrency(item.quantity * item.unitPrice)}</p>
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
            <div className="glass p-8 rounded-4xl border border-white/5 space-y-6">
              <h3 className="text-sm font-mono text-white/70 uppercase tracking-widest flex items-center gap-2 pb-4 border-b border-white/5">
                <TrendingUp size={14} className="text-emerald-400" /> Margin & Cost Sheet Simulator
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Margin slider */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-white/70">Target Profit Margin</span>
                    <span className="text-emerald-400 font-bold">{marginPercentage}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="5" 
                    max="60" 
                    value={marginPercentage}
                    onChange={(e) => setMarginPercentage(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer bg-white/10 rounded-lg h-2"
                  />
                  <div className="flex justify-between text-[9px] text-white/70 font-mono">
                    <span>5% Minimum</span>
                    <span>30% Standard</span>
                    <span>60% Aggressive</span>
                  </div>
                </div>

                {/* Final calculations ledger */}
                <div className="space-y-3 font-mono text-xs border-l border-white/5 pl-8">
                  <div className="flex justify-between">
                    <span className="text-white/80">Total FOB Cargo Cost</span>
                    <span>{formatCurrency(costOfGoods)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Configured Profit ({marginPercentage}%)</span>
                    <span>+ {formatCurrency(grossProfit)}</span>
                  </div>
                  <div className="h-px bg-white/5 my-2" />
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-white/80">Proposed Contract Value</span>
                    <span className="text-blue-400 font-sans text-base">{formatCurrency(totalValue)}</span>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-4 pt-6 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => router.push('/quotations')}
                  className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-mono uppercase tracking-widest hover:bg-white/10 cursor-pointer border-none text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-blue-500 text-black font-bold rounded-xl text-[10px] font-mono uppercase tracking-widest hover:bg-blue-400 cursor-pointer border-none"
                >
                  Generate Draft Proposal
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}

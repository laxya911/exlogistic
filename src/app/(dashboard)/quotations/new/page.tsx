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
import { SearchableSelect } from '@/components/ui/searchable-select';
import { VariantSelectionModal } from '@/components/sales/variant-selection-modal';

export default function NewQuotationPage() {
  const router = useRouter();
  const { createQuotation } = useQuotations();

  // Master Data State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [ports, setPorts] = useState<Port[]>([]);
  const [taxes, setTaxes] = useState<any[]>([]);
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
  const [items, setItems] = useState<Array<{ variantId: string; productId: string; quantity: number; unitPrice: number; taxId?: string; basePrice?: number }>>([
    { variantId: '', productId: '', quantity: 100, unitPrice: 0 }
  ]);

  // Form errors
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Modal State
  const [activeModalRow, setActiveModalRow] = useState<number | null>(null);
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);

  useEffect(() => {
    fetchMetadata();
  }, []);

  const fetchMetadata = async () => {
    try {
      const [cRes, pRes, tRes] = await Promise.all([
        fetch('/api/customers').then(r => r.json()),
        fetch('/api/products').then(r => r.json()),
        fetch('/api/reference/taxes').then(r => r.json())
      ]);
      setCustomers(cRes);
      setProducts(pRes);
      setTaxes(tRes);
      
      setPorts([
        { id: 'TYO', name: 'Tokyo', code: 'JP TYO', country: 'Japan', type: 'SEA', entityStatus: 'ACTIVE', createdAt: '', updatedAt: '' },
        { id: 'OSA', name: 'Osaka', code: 'JP OSA', country: 'Japan', type: 'SEA', entityStatus: 'ACTIVE', createdAt: '', updatedAt: '' },
        { id: 'LAX', name: 'Los Angeles', code: 'US LAX', country: 'USA', type: 'SEA', entityStatus: 'ACTIVE', createdAt: '', updatedAt: '' },
        { id: 'SIN', name: 'Singapore', code: 'SG SIN', country: 'Singapore', type: 'SEA', entityStatus: 'ACTIVE', createdAt: '', updatedAt: '' }
      ]);

      if (cRes.length > 0) setCustomerId(cRes[0].id);
      if (pRes.length > 0) {
        // Initial empty state
        setItems([{ variantId: '', productId: '', quantity: 100, unitPrice: 0, taxId: '', basePrice: 0 }]);
      }
    } catch (e) {
      toast.error('Failed to sync master matrix metadata');
    } finally {
      setLoading(false);
    }
  };

  const handleProductChange = (index: number, productId: string) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    if (!prod.variants || prod.variants.length <= 1) {
      // Auto select the only variant
      const variant = prod.variants?.[0];
      if (variant && items.some((item, i) => i !== index && item.variantId === variant.id)) {
        toast.error('This product is already added to the quotation.');
        return;
      }

      const standardPrice = variant?.sellingPrice || prod.sellingPrice || 0;
      const salesTaxId = variant?.salesTaxId || '';
      
      setItems(prev => prev.map((item, i) => i === index ? {
        ...item,
        variantId: variant?.id || '',
        productId: prod.id,
        unitPrice: standardPrice,
        basePrice: standardPrice,
        taxId: salesTaxId
      } : item));
    } else {
      // Open modal
      setSelectedProductForModal(prod);
      setActiveModalRow(index);
    }
  };

  const handleVariantSelect = (variantId: string) => {
    if (activeModalRow === null || !selectedProductForModal) return;
    
    const variant = selectedProductForModal.variants?.find((v: any) => v.id === variantId);
    if (!variant) return;

    const standardPrice = variant.sellingPrice || selectedProductForModal.sellingPrice || 0;
    const salesTaxId = variant.salesTaxId || '';

    setItems(prev => prev.map((item, i) => i === activeModalRow ? {
      ...item,
      variantId,
      productId: selectedProductForModal.id,
      unitPrice: standardPrice,
      basePrice: standardPrice,
      taxId: salesTaxId
    } : item));

    setActiveModalRow(null);
    setSelectedProductForModal(null);
  };

  const updateItemField = (index: number, field: string, value: any) => {
    setItems(prev => prev.map((item, i) => {
      if (i === index) {
        const newItem = { ...item, [field]: value };
        if (field === 'unitPrice') {
          const margin = marginPercentage || 0;
          const factor = margin > 0 ? 1 - (margin / 100) : 1;
          newItem.basePrice = factor > 0 ? Number((value * factor).toFixed(2)) : value;
        }
        return newItem;
      }
      return item;
    }));
  };

  const addItemRow = () => {
    setItems(prev => [...prev, { variantId: '', productId: '', quantity: 100, unitPrice: 0, taxId: '', basePrice: 0 }]);
  };

  const removeItemRow = (index: number) => {
    if (items.length === 1) {
      toast.error('Quotation must contain at least one item');
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Live Calculations
  const computedItems = useMemo(() => {
    return items.map((item: any) => {
      const prod = products.find(p => p.id === item.productId);
      const tax = taxes.find(t => t.id === item.taxId);
      const qty = item.quantity || 0;
      const price = item.unitPrice || 0;
      
      let untaxed = price;
      let taxAmount = 0;
      
      if (tax) {
        if (tax.includedInPrice) {
          untaxed = price / (1 + (tax.ratePercentage / 100));
          taxAmount = price - untaxed;
        } else {
          taxAmount = price * (tax.ratePercentage / 100);
        }
      }

      return {
        ...item,
        name: prod?.name || 'Select Product...',
        sku: prod?.sku || 'N/A',
        uom: prod?.uom || 'MT',
        taxAmount: Number((taxAmount * qty).toFixed(2)),
        taxRate: tax?.ratePercentage || 0,
        totalPrice: Number(((untaxed + taxAmount) * qty).toFixed(2)),
        untaxedTotal: Number((untaxed * qty).toFixed(2))
      };
    });
  }, [items, products, taxes]);

  const untaxedAmount = computedItems.reduce((sum: number, item: any) => sum + (item.untaxedTotal || 0), 0);
  const totalTaxAmount = computedItems.reduce((sum: number, item: any) => sum + (item.taxAmount || 0), 0);
  const totalValue = computedItems.reduce((sum: number, item: any) => sum + (item.totalPrice || 0), 0);
  
  const costOfGoods = items.reduce((sum: number, item: any) => sum + ((item.basePrice || 0) * (item.quantity || 0)), 0);
  const grossProfit = untaxedAmount - costOfGoods;

  const handleMarginChange = (margin: number) => {
    const factor = margin > 0 ? 1 - (margin / 100) : 1;
    const newItems = items.map((item: any) => {
      const base = item.basePrice || item.unitPrice;
      const newPrice = factor > 0 ? Number((base / factor).toFixed(2)) : base;
      return { ...item, unitPrice: newPrice };
    });
    setMarginPercentage(margin);
    setItems(newItems);
  };

  // Adjust unitPrice in items payload to include margin before submission
  // so that totalPrice = unitPrice * qty reflects the proposal price!
  const finalItems = useMemo(() => {
    return computedItems.map((item: any) => ({
      variantId: item.variantId,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxId: item.taxId || null,
      taxRate: item.taxRate || 0,
      taxAmount: item.taxAmount || 0,
      totalPrice: item.totalPrice || 0
    }));
  }, [computedItems]);

  const handleSubmit = async (e: React.FormEvent) => {
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
      untaxedAmount,
      totalTaxAmount,
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
                  <label className="text-[9px] text-white/80 uppercase">Incoterm Rule</label>
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
                  <label className="text-[9px] text-white/80 uppercase">Container Allocation</label>
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
                  <label className="text-[9px] text-white/80 uppercase">Origin Port</label>
                  <SearchableSelect
                    options={ports.map(p => ({ value: p.id, label: p.name }))}
                    value={originPortId}
                    onChange={setOriginPortId}
                    placeholder="Select Port..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] text-white/80 uppercase">Discharge Port</label>
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
                  <label className="text-[9px] text-white/80 uppercase">Currency</label>
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
                      <label className="text-[8px] font-mono text-white/70 uppercase">Commodity Product</label>
                      <SearchableSelect
                        options={products.map(p => ({
                          value: p.id, 
                          label: p.name
                        }))}
                        value={item.productId}
                        onChange={(val) => handleProductChange(idx, val)}
                        placeholder="Select Product..."
                        className="text-xs"
                      />
                      {item.variantId && item.productId && (
                        <p className="text-[10px] text-white/50 mt-1 pl-1">
                          SKU: {computedItems[idx]?.sku}
                        </p>
                      )}
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

                    {/* Tax Dropdown */}
                    <div className="w-32 space-y-1">
                      <label className="text-[8px] font-mono text-white/70 uppercase">Tax</label>
                      <select
                        value={item.taxId || ''}
                        onChange={(e) => updateItemField(idx, 'taxId', e.target.value)}
                        className="w-full bg-[#0b0b0b] border border-white/10 rounded-lg p-2.5 text-xs text-white font-mono focus:outline-none"
                      >
                        <option value="">No Tax</option>
                        {taxes.map(t => (
                          <option key={t.id} value={t.id}>{t.name} ({t.ratePercentage}%)</option>
                        ))}
                      </select>
                    </div>

                    {/* Cost price */}
                    <div className="w-28 space-y-1">
                      <label className="text-[8px] font-mono text-white/70 uppercase">Unit Price</label>
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
                      <p className="text-[8px] font-mono text-white/70 uppercase">Gross Total</p>
                      <p className="font-sans font-bold text-xs text-white py-2.5">{formatCurrency(computedItems[idx]?.totalPrice || 0)}</p>
                      {computedItems[idx]?.taxAmount > 0 && (
                        <p className="text-[9px] text-white/40 mt-[-8px]">Tax: {formatCurrency(computedItems[idx]?.taxAmount)}</p>
                      )}
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
                    onChange={(e) => handleMarginChange(Number(e.target.value))}
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
                    <span className="text-white/80">Base Freight/Cargo Cost</span>
                    <span>{formatCurrency(costOfGoods)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Configured Profit ({marginPercentage}%)</span>
                    <span>+ {formatCurrency(grossProfit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80">Untaxed Amount</span>
                    <span>{formatCurrency(untaxedAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80">Total Tax Amount</span>
                    <span>{formatCurrency(totalTaxAmount)}</span>
                  </div>
                  <div className="h-px bg-white/5 my-2" />
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-white/80">Proposed Contract Value (Gross)</span>
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

      {selectedProductForModal && (
        <VariantSelectionModal
          product={selectedProductForModal}
          isOpen={activeModalRow !== null}
          onClose={() => {
            setActiveModalRow(null);
            setSelectedProductForModal(null);
          }}
          onSelect={handleVariantSelect}
          selectedVariantIds={items.map(i => i.variantId).filter(Boolean)}
        />
      )}
    </>
  );
}

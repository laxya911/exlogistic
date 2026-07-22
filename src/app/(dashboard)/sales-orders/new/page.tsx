'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeaderUpdater } from '@/components/layout/page-context';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Customer, Product } from '@/types';
import { ContractMetadataCard } from '@/components/sales/contract-metadata-card';
import { LineItemsTable } from '@/components/sales/line-items-table';
import { formatCurrency } from '@/lib/utils';
import { SearchableSelect } from '@/components/ui/searchable-select';

export default function NewSalesOrderPage() {
  const router = useRouter();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [taxes, setTaxes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formState, setFormState] = useState<any>({
    customerId: '',
    currency: 'USD',
    incoterm: '',
    expectedShipmentDate: '',
    paymentTerms: '',
    marginPercentage: 0,
    items: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [cRes, pRes, tRes] = await Promise.all([
        fetch('/api/customers').then(r => r.json()),
        fetch('/api/products').then(r => r.json()),
        fetch('/api/reference/taxes').then(r => r.json())
      ]);
      setCustomers(cRes);
      setProducts(pRes);
      setTaxes(tRes);
    } catch (e: any) {
      toast.error('Failed to load required data');
    } finally {
      setLoading(false);
    }
  };

  const updateFormState = (field: string, value: any) => {
    setFormState((prev: any) => ({ ...prev, [field]: value }));
  };

  const updateItem = (idx: number, field: string, value: any) => {
    setFormState((prev: any) => {
      const newItems = [...prev.items];
      const item = { ...newItems[idx], [field]: value };
      
      if (field === 'variantId') {
        let sellingPrice = 0;
        for (const p of products) {
          const v = p.variants?.find((v: any) => v.id === value);
          if (v) {
            item.productId = p.id;
            item.name = p.name;
            item.sku = v.sku;
            item.uom = p.uom || 'MT';
            sellingPrice = v.sellingPrice || p.sellingPrice || 0;
            break;
          }
        }
        
        const margin = prev.marginPercentage || 0;
        const factor = margin > 0 ? 1 - (margin / 100) : 1;
        
        item.basePrice = sellingPrice; 
        item.unitPrice = factor > 0 ? Number((item.basePrice / factor).toFixed(2)) : item.basePrice;
        
        // Auto-assign sales tax from variant
        const variant = products.find((p: any) => p.id === item.productId)?.variants?.find((v: any) => v.id === value);
        if (variant && variant.salesTaxId) {
          item.taxId = variant.salesTaxId;
        }
      }
      
      if (field === 'quantity') {
        item.total = (item.quantity || 0) * (item.unitPrice || 0);
      }
      
      if (field === 'unitPrice') {
        const margin = prev.marginPercentage || 0;
        const factor = margin > 0 ? 1 - (margin / 100) : 1;
        item.basePrice = factor > 0 ? Number((value * factor).toFixed(2)) : value;
      }
      
      newItems[idx] = item;
      return { ...prev, items: newItems };
    });
  };


  const removeItem = (idx: number) => {
    setFormState((prev: any) => {
      const newItems = [...prev.items];
      newItems.splice(idx, 1);
      return { ...prev, items: newItems };
    });
  };

  const addItem = () => {
    setFormState((prev: any) => ({
      ...prev,
      items: [
        ...prev.items,
        { productId: '', variantId: '', quantity: 1, unitPrice: 0, total: 0 }
      ]
    }));
  };
  
  const handleMarginChange = (margin: number) => {
    setFormState((prev: any) => {
      const factor = margin > 0 ? 1 - (margin / 100) : 1;
      const newItems = (prev.items || []).map((item: any) => {
        const base = item.basePrice || item.unitPrice;
        const newPrice = factor > 0 ? Number((base / factor).toFixed(2)) : base;
        return { ...item, unitPrice: newPrice };
      });
      return { ...prev, marginPercentage: margin, items: newItems };
    });
  };

  const computedItems = React.useMemo(() => {
    return (formState.items || []).map((item: any) => {
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
        taxAmount: Number((taxAmount * qty).toFixed(2)),
        taxRate: tax?.ratePercentage || 0,
        totalPrice: Number(((untaxed + taxAmount) * qty).toFixed(2)),
        untaxedTotal: Number((untaxed * qty).toFixed(2))
      };
    });
  }, [formState.items, taxes]);

  const untaxedAmount = computedItems.reduce((sum: number, item: any) => sum + (item.untaxedTotal || 0), 0);
  const totalTaxAmount = computedItems.reduce((sum: number, item: any) => sum + (item.taxAmount || 0), 0);
  const totalValue = computedItems.reduce((sum: number, item: any) => sum + (item.totalPrice || 0), 0);
  
  const costOfGoods = (formState.items || []).reduce((sum: number, item: any) => sum + ((item.basePrice || 0) * (item.quantity || 0)), 0);
  const grossProfit = untaxedAmount - costOfGoods;

  const handleSave = async () => {
    if (!formState.customerId) return toast.error('Please select a customer');
    if (formState.items.length === 0) return toast.error('Add at least one item');
    
    try {
      setSaving(true);
      
      const itemsToSave = computedItems.map((i: any) => {
        return {
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          taxId: i.taxId || null,
          taxRate: i.taxRate || 0,
          taxAmount: i.taxAmount || 0,
          totalPrice: i.totalPrice || 0
        };
      });

      const payload = {
        customerId: formState.customerId,
        date: new Date().toISOString(),
        currency: formState.currency,
        incoterm: formState.incoterm,
        expectedShipmentDate: formState.expectedShipmentDate ? new Date(formState.expectedShipmentDate).toISOString() : null,
        paymentTerms: formState.paymentTerms,
        marginPercentage: formState.marginPercentage,
        items: itemsToSave,
        totalValue,
        untaxedAmount,
        totalTaxAmount,
        status: 'DRAFT'
      };

      const res = await fetch('/api/sales-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create Sales Order');

      toast.success('Sales Order created successfully');
      router.push(`/sales-orders/${data.id}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const getProductName = (productId: string) => {
    const p = products.find(x => x.id === productId);
    return p ? `${p.name} (${p.sku})` : productId;
  };

  if (loading) return null;

  return (
    <>
      <PageHeaderUpdater title="Draft New Sales Order" subtitle="Create a new export contract from scratch" />
      <div className="space-y-8">
        
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button onClick={() => router.push('/sales-orders')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-mono uppercase text-white/90 hover:bg-white/10 cursor-pointer border-none">
            <ArrowLeft size={12} /> Back to Matrix
          </button>
          
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 text-black hover:bg-blue-400 disabled:opacity-50 rounded-xl text-xs font-mono font-bold uppercase tracking-widest transition-all border-none cursor-pointer">
            <Save size={14} /> {saving ? 'Creating...' : 'Create Sales Order'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="glass p-8 rounded-4xl border border-white/5 space-y-5">
              <h4 className="text-[10px] font-mono text-white/70 uppercase tracking-widest pb-3 border-b border-white/5">
                Client Details
              </h4>
              <div className="space-y-1">
                <label className="text-[9px] text-white/70 uppercase mb-1 block">Customer</label>
                <SearchableSelect
                  value={formState.customerId}
                  onChange={(val) => updateFormState('customerId', val)}
                  options={customers.map(c => ({ value: c.id, label: `${c.name} (${c.country})` }))}
                  placeholder="-- Select Customer --"
                />
              </div>
            </div>

            <ContractMetadataCard 
              isEditing={true} 
              order={{}} 
              formState={formState} 
              onChange={updateFormState} 
              getStatusStyle={() => ''} 
            />
          </div>

          {/* Right main panel */}
          <div className="lg:col-span-8 space-y-8">
            <LineItemsTable 
              isEditing={true}
              items={computedItems}
              updateItem={updateItem}
              removeItem={removeItem}
              addItem={addItem}
              products={products}
              formatCurrency={formatCurrency}
              getProductName={getProductName}
              marginPercentage={formState.marginPercentage}
              setMarginPercentage={handleMarginChange}
              costOfGoods={costOfGoods}
              grossProfit={grossProfit}
              totalValue={totalValue}
              untaxedAmount={untaxedAmount}
              totalTaxAmount={totalTaxAmount}
              taxes={taxes}
              isPurchaseOrder={false}
            />
          </div>
        </div>
      </div>
    </>
  );
}

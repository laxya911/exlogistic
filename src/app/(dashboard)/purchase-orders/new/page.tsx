'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeaderUpdater } from '@/components/layout/page-context';
import { ArrowLeft, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Supplier, Product } from '@/types';
import { PurchaseOrderMetadataCard } from '@/components/purchase/purchase-order-metadata-card';
import { LineItemsTable } from '@/components/sales/line-items-table';
import { formatCurrency } from '@/lib/utils';
import { SearchableSelect } from '@/components/ui/searchable-select';

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formState, setFormState] = useState<any>({
    supplierId: '',
    currency: 'USD',
    incoterm: '',
    expectedDeliveryDate: '',
    paymentTerms: '',
    items: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sRes, pRes] = await Promise.all([
        fetch('/api/suppliers').then(r => r.json()),
        fetch('/api/products').then(r => r.json())
      ]);
      setSuppliers(sRes);
      setProducts(pRes);
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
    const newItems = [...formState.items];
    const item = { ...newItems[idx], [field]: value };
    
    if (field === 'variantId') {
      for (const p of products) {
        const v = p.variants?.find((v: any) => v.id === value);
        if (v) {
          item.productId = p.id;
          item.name = p.name;
          item.sku = v.sku;
          item.uom = p.uom || 'MT';
          item.unitPrice = v.purchasePrice || p.purchasePrice || v.sellingPrice || p.sellingPrice || 0;
          break;
        }
      }
      item.total = (item.quantity || 0) * item.unitPrice;
    }
    
    if (field === 'quantity' || field === 'unitPrice') {
      item.total = (item.quantity || 0) * (item.unitPrice || 0);
    }
    
    newItems[idx] = item;
    updateFormState('items', newItems);
  };

  const removeItem = (idx: number) => {
    const newItems = [...formState.items];
    newItems.splice(idx, 1);
    updateFormState('items', newItems);
  };

  const addItem = () => {
    updateFormState('items', [
      ...formState.items,
      { productId: '', variantId: '', quantity: 1, unitPrice: 0, total: 0 }
    ]);
  };

  const handleSave = async () => {
    if (!formState.supplierId) return toast.error('Please select a supplier');
    if (formState.items.length === 0) return toast.error('Add at least one item');
    
    try {
      setSaving(true);
      
      const itemsToSave = formState.items.map((i: any) => {
        return {
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.total
        };
      });
      const totalValue = itemsToSave.reduce((sum: number, i: any) => sum + (i.totalPrice || 0), 0);

      const payload = {
        supplierId: formState.supplierId,
        date: new Date().toISOString(),
        currency: formState.currency,
        incoterm: formState.incoterm,
        expectedDeliveryDate: formState.expectedDeliveryDate ? new Date(formState.expectedDeliveryDate).toISOString() : null,
        paymentTerms: formState.paymentTerms,
        items: itemsToSave,
        totalValue,
        status: 'DRAFT'
      };

      const res = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create PO');

      toast.success('Purchase Order created successfully');
      router.push(`/purchase-orders/${data.id}`);
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
      <PageHeaderUpdater title="Draft New Purchase Order" subtitle="Create a new procurement order from scratch" />
      <div className="space-y-8">
        
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button onClick={() => router.push('/purchase-orders')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-mono uppercase text-white/90 hover:bg-white/10 cursor-pointer border-none">
            <ArrowLeft size={12} /> Back to ledger
          </button>
          
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 text-black hover:bg-blue-400 disabled:opacity-50 rounded-xl text-xs font-mono font-bold uppercase tracking-widest transition-all border-none cursor-pointer">
            <Send size={14} /> {saving ? 'Creating...' : 'Create Purchase Order'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="glass p-8 rounded-4xl border border-white/5 space-y-5">
              <h4 className="text-[10px] font-mono text-white/70 uppercase tracking-widest pb-3 border-b border-white/5">
                Vendor Details
              </h4>
              <div className="space-y-1">
                <label className="text-[9px] text-white/70 uppercase mb-1 block">Supplier</label>
                <SearchableSelect
                  value={formState.supplierId}
                  onChange={(val) => updateFormState('supplierId', val)}
                  options={suppliers.map(s => ({ value: s.id, label: `${s.name} (${s.country})` }))}
                  placeholder="-- Select Supplier --"
                />
              </div>
            </div>

            <PurchaseOrderMetadataCard 
              isEditing={true} 
              po={{}} 
              formState={formState} 
              onChange={updateFormState} 
              getStatusStyle={() => ''} 
            />
          </div>

          {/* Right main panel */}
          <div className="lg:col-span-8 space-y-8">
            <LineItemsTable 
              isEditing={true}
              items={formState.items}
              updateItem={updateItem}
              removeItem={removeItem}
              addItem={addItem}
              variantOptions={products.flatMap(p => p.variants?.map((v: any) => ({
                value: v.id,
                label: `${p.name} (${v.sku})`,
                description: `Stock: ${v.inventory || 0} ${p.uom || 'MT'} | Cost: ${formatCurrency(v.purchasePrice || p.purchasePrice || 0)}`
              })) || [])}
              formatCurrency={formatCurrency}
              getProductName={getProductName}
              marginPercentage={0}
              setMarginPercentage={() => {}}
              costOfGoods={formState.items.reduce((s: number, i: any) => s + (i.total || 0), 0)}
              grossProfit={0}
              totalValue={formState.items.reduce((s: number, i: any) => s + (i.total || 0), 0)}
              isPurchaseOrder={true}
            />
          </div>
        </div>
      </div>
    </>
  );
}

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
import { VariantSelectionModal } from '@/components/sales/variant-selection-modal';

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [taxes, setTaxes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal State
  const [activeModalRow, setActiveModalRow] = useState<number | null>(null);
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);

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
      const [sRes, pRes, tRes] = await Promise.all([
        fetch('/api/suppliers').then(r => r.json()),
        fetch('/api/products').then(r => r.json()),
        fetch('/api/reference/taxes').then(r => r.json())
      ]);
      setSuppliers(sRes);
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
      newItems[idx] = { ...newItems[idx], [field]: value };
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

  const handleSave = async () => {
    if (!formState.supplierId) return toast.error('Please select a supplier');
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
        supplierId: formState.supplierId,
        date: new Date().toISOString(),
        currency: formState.currency,
        incoterm: formState.incoterm,
        expectedDeliveryDate: formState.expectedDeliveryDate ? new Date(formState.expectedDeliveryDate).toISOString() : null,
        paymentTerms: formState.paymentTerms,
        items: itemsToSave,
        totalValue,
        untaxedAmount,
        totalTaxAmount,
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
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted border border-border text-[10px] font-mono uppercase text-foreground/90 hover:bg-accent cursor-pointer border-none">
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
            <div className="glass p-8 rounded-4xl border border-border space-y-5">
              <h4 className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest pb-3 border-b border-border">
                Vendor Details
              </h4>
              <div className="space-y-1">
                <label className="text-[9px] text-muted-foreground uppercase mb-1 block">Supplier</label>
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
              items={computedItems}
              updateItem={updateItem}
              removeItem={removeItem}
              addItem={addItem}
              products={products}
              formatCurrency={formatCurrency}
              getProductName={getProductName}
              marginPercentage={0}
              setMarginPercentage={() => {}}
              costOfGoods={untaxedAmount}
              grossProfit={0}
              totalValue={totalValue}
              untaxedAmount={untaxedAmount}
              totalTaxAmount={totalTaxAmount}
              taxes={taxes}
              isPurchaseOrder={true}
            />
          </div>
        </div>
      </div>
    </>
  );
}

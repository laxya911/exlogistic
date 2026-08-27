'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeaderUpdater } from '@/components/layout/page-context';
import {
  ArrowLeft, FileText, Ship, Box, CheckCircle2, XCircle, Play, PackageCheck, Trash2, Activity, MessageSquare, ExternalLink, RefreshCcw, Save, X, User, Building, AlertTriangle
} from 'lucide-react';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';
import { SalesOrder, Customer, Product } from '@/types';
import { ContractMetadataCard } from '@/components/sales/contract-metadata-card';
import { LineItemsTable } from '@/components/sales/line-items-table';

const STATUS_FLOW = ['DRAFT', 'CONFIRMED', 'PRODUCTION', 'READY', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED'] as const;

export default function SalesOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [order, setOrder] = useState<SalesOrder | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [orderDocuments, setOrderDocuments] = useState<any[]>([]);
  const [taxes, setTaxes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState('');

  // Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [showPOModal, setShowPOModal] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sales-orders/${id}`);
      if (!res.ok) throw new Error('Sales order not found');
      const orderData: SalesOrder = await res.json();
      setOrder(orderData);

      const [cRes, pRes, dRes, sRes, tRes] = await Promise.all([
        fetch(`/api/customers/${orderData.customerId}`).then(r => r.ok ? r.json() : null),
        fetch('/api/products').then(r => r.json()),
        fetch(`/api/documents?relatedId=${id}`).then(r => r.ok ? r.json() : []),
        fetch('/api/suppliers').then(r => r.ok ? r.json() : []),
        fetch('/api/reference/taxes').then(r => r.json())
      ]);
      setCustomer(cRes);
      setProducts(pRes);
      setOrderDocuments(dRes);
      setSuppliers(sRes);
      setTaxes(tRes);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load order');
      router.push('/sales-orders');
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    if (!isEditing) {
      // Enter edit mode, initialize form state
      setFormState({
        incoterm: order?.incoterm || '',
        containerType: order?.containerType || '',
        currency: order?.currency || 'USD',
        marginPercentage: order?.marginPercentage || 0,
        expectedShipmentDate: order?.expectedShipmentDate || '',
        paymentTerms: order?.paymentTerms || '',
        remarks: order?.remarks || '',
        items: order?.items?.map(i => {
          const factor = order.marginPercentage ? 1 - (order.marginPercentage / 100) : 1;
          const basePrice = factor > 0 ? Number((i.unitPrice * factor).toFixed(2)) : i.unitPrice;
          return {
            ...i,
            name: products.find(p => p.id === i.productId)?.name || '',
            sku: products.find(p => p.id === i.productId)?.sku || '',
            uom: products.find(p => p.id === i.productId)?.uom || 'MT',
            basePrice,
            total: (i.quantity || 0) * (i.unitPrice || 0)
          };
        }) || []
      });
    }
    setIsEditing(!isEditing);
  };

  const handleMarginChange = (margin: number) => {
    const factor = margin > 0 ? 1 - (margin / 100) : 1;
    const newItems = (formState.items || []).map((item: any) => {
      const base = item.basePrice || item.unitPrice;
      const newPrice = factor > 0 ? Number((base / factor).toFixed(2)) : base;
      return { ...item, unitPrice: newPrice };
    });
    setFormState({ ...formState, marginPercentage: margin, items: newItems });
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
      items: [...prev.items, { variantId: '', productId: '', quantity: 1, unitPrice: 0, total: 0, uom: 'MT' }]
    }));
  };

  const computedItems = useMemo(() => {
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

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const finalItems = computedItems.map((item: any) => ({
        variantId: item.variantId,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxId: item.taxId || null,
        taxRate: item.taxRate || 0,
        taxAmount: item.taxAmount || 0,
        totalPrice: item.totalPrice || 0
      }));

      const payload = {
        ...formState,
        expectedShipment: formState.expectedShipmentDate ? new Date(formState.expectedShipmentDate).toISOString() : null,
        totalValue,
        untaxedAmount,
        totalTaxAmount,
        items: finalItems
      };

      const res = await fetch(`/api/sales-orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update order');
      
      toast.success('Sales order updated successfully');
      setOrder(data);
      setIsEditing(false);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const performAction = async (action: string, extra?: Record<string, any>) => {
    const res = await fetch(`/api/sales-orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...extra })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Action failed');
    return data;
  };

  const handleBookShipment = async () => {
    try {
      const data = await performAction('book_shipment');
      toast.success(`Shipment ${data.shipment?.shipmentNo} booked!`);
      if (data.shipment?.id) router.push(`/shipments/${data.shipment.id}`);
      else await fetchData();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleAction = async (actionStr: string, successMsg: string) => {
    try { await performAction(actionStr); toast.success(successMsg); await fetchData(); }
    catch (e: any) { toast.error(e.message); }
  };

  const handleCancel = async () => {
    if (!confirm('Cancel this sales order?')) return;
    try { await performAction('cancel'); toast.success('Order cancelled'); await fetchData(); }
    catch (e: any) { toast.error(e.message); }
  };

  const handleRevertToDraft = async () => {
    if (!confirm('Revert this order to DRAFT?')) return;
    try { await performAction('revert_to_draft'); toast.success('Order reverted to Draft'); await fetchData(); }
    catch (e: any) { toast.error(e.message); }
  };

  const handleDelete = async () => {
    if (!confirm('Soft-delete this order?')) return;
    const res = await fetch(`/api/sales-orders/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Order soft-deleted'); router.push('/sales-orders'); }
    else toast.error('Delete failed');
  };

  const handleGenerateDocument = async (type: 'Commercial Invoice' | 'Packing List') => {
    if (!order) return;
    try {
      const prefix = type === 'Commercial Invoice' ? 'INV' : 'PL';
      const docNo = `${prefix}-${order.orderNo.split('-').pop()}`;
      
      const mappedItems = order.items.map(item => {
        const prod = products.find(p => p.id === item.productId);
        const name = prod ? `${prod.name} (${prod.sku})` : item.productId;
        return {
          description: name,
          qty: item.quantity,
          unit: 'MT',
          hsn: (prod as any)?.hsn || '1101.00.00',
          origin: (prod as any)?.originCountry || 'India',
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice || (item.quantity * item.unitPrice)
        };
      });

      const consigneeAddress = customer ? `${customer.address || ''}, ${customer.country || ''}` : 'Address on file';

      await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${type} #${docNo}`, type, url: '#', size: '1.2 MB',
          status: 'SIGNED', relatedId: order.id, relatedType: 'SALES_ORDER',
          shipper: 'ExLogis Industrial Solutions', consignee: customer?.name || order.customerId,
          consigneeAddress,
          items: mappedItems, totalValue: order.totalValue,
          currency: order.currency || 'USD', incoterm: order.incoterm || 'FOB',
          paymentTerms: order.paymentTerms || '30 Days Net',
          containerType: order.containerType || '20GP', entityStatus: 'ACTIVE'
        })
      });
      toast.success(`${type} generated: ${docNo}`);
      await fetchData();
    } catch { toast.error('Document generation failed'); }
  };

  const handleCreatePO = async () => {
    if (!selectedSupplierId) return toast.error('Please select a supplier');
    setSaving(true);
    try {
      const res = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: selectedSupplierId,
          salesOrderId: id,
          date: new Date().toISOString(),
          expectedDeliveryDate: new Date(Date.now() + 15 * 86400000).toISOString(),
          items: order?.items,
          totalValue: order?.totalValue,
          currency: order?.currency || 'USD'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create PO');
      
      toast.success('Purchase Order created successfully');
      setShowPOModal(false);
      router.push(`/purchase-orders/${data.id}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNote = async () => {
    if (!noteText.trim()) return;
    try {
      const updated = await performAction('add_note', { note: noteText.trim() });
      setOrder(updated);
      setNoteText('');
      toast.success('Note logged to timeline');
    } catch (e: any) { toast.error(e.message); }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'PRODUCTION': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'READY': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'SHIPPED': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'CANCELLED': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      default: return 'text-muted-foreground bg-muted border-border';
    }
  };

  const getProductName = (productId: string) => {
    const p = products.find(x => x.id === productId);
    return p ? `${p.name} (${p.sku})` : productId;
  };

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case 'CREATED': return <FileText size={10} />;
      case 'CONFIRMED': return <CheckCircle2 size={10} className="text-blue-400" />;
      case 'PRODUCTION_STARTED': return <Play size={10} className="text-amber-400" />;
      case 'READY_FOR_SHIPMENT': return <PackageCheck size={10} className="text-purple-400" />;
      case 'SHIPPED': return <Ship size={10} className="text-emerald-400" />;
      case 'CANCELLED': return <XCircle size={10} className="text-rose-400" />;
      case 'NOTE_ADDED': return <MessageSquare size={10} />;
      default: return <Activity size={10} />;
    }
  };

  if (!order) return null;

  const statusIdx = STATUS_FLOW.indexOf(order.status as any);
  const packingListDoc = orderDocuments.find(d => d.type === 'Packing List' && d.status !== 'OBSOLETE');
  const invoiceDoc = orderDocuments.find(d => d.type === 'Commercial Invoice' && d.status !== 'OBSOLETE');
  
  const isDocOutdated = (doc: any) => {
    if (!doc || !order || !order.updatedAt) return false;
    return new Date(doc.createdAt).getTime() < new Date(order.updatedAt).getTime();
  };

  const packingListOutdated = isDocOutdated(packingListDoc);
  const invoiceOutdated = isDocOutdated(invoiceDoc);
  
  const variantOptions = products.flatMap(p => 
    (p.variants || []).map(v => ({
      value: v.id,
      label: `${p.name} - ${v.sku}`,
      description: `Stock: ${v.inventory || 0} ${p.uom}`
    }))
  );

  return (
    <>
      <PageHeaderUpdater title={order.orderNo} subtitle="Export Contract — Fulfilment Dashboard"  />
      <div className="space-y-8">
        
        {/* Top Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button onClick={() => router.push('/sales-orders')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted border border-border text-[10px] font-mono uppercase text-foreground/90 hover:bg-accent cursor-pointer">
            <ArrowLeft size={12} /> Back
          </button>

          {isEditing ? (
            <div className="flex items-center gap-3">
              <button onClick={handleEditToggle} disabled={saving} className="flex items-center gap-1.5 px-5 py-3 rounded-2xl bg-muted border border-border text-muted-foreground hover:bg-accent text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer">
                <X size={12} /> Discard
              </button>
              <button onClick={handleSaveEdit} disabled={saving} className="flex items-center gap-1.5 px-6 py-3 bg-blue-500 text-black hover:bg-blue-400 rounded-2xl text-[10px] font-mono font-bold uppercase tracking-widest transition-all border-none cursor-pointer">
                <Save size={12} /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2.5">
              <button onClick={handleDelete} className="p-3.5 rounded-2xl bg-muted border border-border text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer" title="Soft delete">
                <Trash2 size={14} />
              </button>
              {(order.status === 'DRAFT' || order.status === 'PENDING') && (
                <button onClick={handleEditToggle} className="flex items-center gap-1.5 px-5 py-3 rounded-2xl bg-muted border border-border text-foreground/90 hover:bg-accent text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer">
                  <FileText size={12} /> Edit Contract
                </button>
              )}
              {packingListDoc ? (
                <div className="flex items-center gap-2">
                  <Link href={`/documents?selectedId=${packingListDoc.id}`} className={cn("flex items-center gap-1.5 px-5 py-3 border rounded-2xl text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer", packingListOutdated ? "border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/25" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/25")}>
                    {packingListOutdated ? <AlertTriangle size={12} /> : <Box size={12} />} 
                    View Packing List {packingListOutdated && "(Outdated)"}
                  </Link>
                  {packingListOutdated && (
                    <button onClick={() => handleGenerateDocument('Packing List')} className="px-3 py-3 rounded-2xl bg-muted hover:bg-accent text-muted-foreground border border-border transition-all cursor-pointer" title="Regenerate Packing List">
                      <RefreshCcw size={14} />
                    </button>
                  )}
                </div>
              ) : (
                <button onClick={() => handleGenerateDocument('Packing List')} className="flex items-center gap-1.5 px-5 py-3 border border-border bg-muted text-foreground/90 hover:bg-accent rounded-2xl text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer">
                  <Box size={12} /> Packing List
                </button>
              )}
              {invoiceDoc ? (
                <div className="flex items-center gap-2">
                  <Link href={`/documents?selectedId=${invoiceDoc.id}`} className={cn("flex items-center gap-1.5 px-5 py-3 border rounded-2xl text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer", invoiceOutdated ? "border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/25" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/25")}>
                    {invoiceOutdated ? <AlertTriangle size={12} /> : <FileText size={12} />} 
                    View Invoice {invoiceOutdated && "(Outdated)"}
                  </Link>
                  {invoiceOutdated && (
                    <button onClick={() => handleGenerateDocument('Commercial Invoice')} className="px-3 py-3 rounded-2xl bg-muted hover:bg-accent text-muted-foreground border border-border transition-all cursor-pointer" title="Regenerate Invoice">
                      <RefreshCcw size={14} />
                    </button>
                  )}
                </div>
              ) : (
                <button onClick={() => handleGenerateDocument('Commercial Invoice')} className="flex items-center gap-1.5 px-5 py-3 border border-border bg-muted text-foreground/90 hover:bg-accent rounded-2xl text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer">
                  <FileText size={12} /> Invoice
                </button>
              )}
              {(order.status === 'DRAFT' || order.status === 'PENDING') && (
                <button onClick={() => handleAction('confirm', 'Order confirmed')} className="flex items-center gap-1.5 px-5 py-3 border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-2xl text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer">
                  <CheckCircle2 size={12} /> Confirm Order
                </button>
              )}
              {order.status === 'CONFIRMED' && (
                <button onClick={() => handleAction('start_production', 'Production started')} className="flex items-center gap-1.5 px-5 py-3 border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 rounded-2xl text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer">
                  <Play size={12} /> Start Production
                </button>
              )}
              {order.status === 'PRODUCTION' && (
                <button onClick={() => handleAction('mark_ready', 'Cargo marked ready')} className="flex items-center gap-1.5 px-5 py-3 border border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 rounded-2xl text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer">
                  <PackageCheck size={12} /> Mark Ready
                </button>
              )}
              {order.status !== 'SHIPPED' && order.status !== 'CANCELLED' && (
                <button onClick={handleCancel} className="flex items-center gap-1.5 px-5 py-3 border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/25 rounded-2xl text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer">
                  <XCircle size={12} /> Cancel
                </button>
              )}
              {order.status !== 'DRAFT' && order.status !== 'SHIPPED' && order.status !== 'CANCELLED' && (
                <button onClick={handleRevertToDraft} className="flex items-center gap-1.5 px-5 py-3 border border-border bg-muted text-muted-foreground hover:bg-accent rounded-2xl text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer">
                  <RefreshCcw size={12} /> Revert to Draft
                </button>
              )}
              {order.status === 'READY' && (
                <button onClick={handleBookShipment} className="flex items-center gap-1.5 px-6 py-3 bg-emerald-500 text-black hover:bg-emerald-400 rounded-2xl text-[10px] font-mono font-bold uppercase tracking-widest transition-all border-none cursor-pointer">
                  <Ship size={12} /> Book Shipment →
                </button>
              )}
              {(order.status === 'CONFIRMED' || order.status === 'PRODUCTION' || order.status === 'READY') && (
                <button onClick={() => setShowPOModal(true)} className="flex items-center gap-1.5 px-5 py-3 border border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-400 hover:bg-fuchsia-500/25 rounded-2xl text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer">
                  <Box size={12} /> Create PO
                </button>
              )}
              {order.status === 'SHIPPED' && (
                <button onClick={() => handleAction('in_transit', 'Order marked as In Transit')} className="flex items-center gap-1.5 px-6 py-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 rounded-2xl text-[10px] font-mono font-bold uppercase tracking-widest transition-all cursor-pointer">
                  <Ship size={12} /> Mark In Transit
                </button>
              )}
              {order.status === 'IN_TRANSIT' && (
                <button onClick={() => handleAction('delivered', 'Order marked as Delivered')} className="flex items-center gap-1.5 px-6 py-3 bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 rounded-2xl text-[10px] font-mono font-bold uppercase tracking-widest transition-all cursor-pointer">
                  <CheckCircle2 size={12} /> Mark Delivered
                </button>
              )}
            </div>
          )}
        </div>

        {/* Progress Pipeline */}
        {!isEditing && order.status !== 'CANCELLED' && (
          <div className="glass p-6 rounded-3xl border border-border">
            <div className="flex items-center gap-2 overflow-x-auto">
              {STATUS_FLOW.map((step, i) => (
                <React.Fragment key={step}>
                  <div className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-mono uppercase tracking-widest whitespace-nowrap transition-all',
                    i < statusIdx ? 'text-muted-foreground bg-white/3' :
                    i === statusIdx ? 'text-black bg-blue-400 font-bold' :
                    'text-muted-foreground bg-white/2'
                  )}>
                    {i < statusIdx && <CheckCircle2 size={10} />}
                    {step.replace('_', ' ')}
                  </div>
                  {i < STATUS_FLOW.length - 1 && (
                    <div className={cn('h-px flex-1 min-w-[20px]', i < statusIdx ? 'bg-blue-400/30' : 'bg-muted')} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4 space-y-6">
            <ContractMetadataCard 
              isEditing={isEditing}
              order={order}
              formState={formState}
              onChange={updateFormState}
              getStatusStyle={getStatusStyle}
            />
            
            {/* Remarks in Edit Mode */}
            {isEditing && (
              <div className="glass p-8 rounded-4xl border border-border space-y-3">
                <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Remarks</label>
                <textarea 
                  value={formState.remarks || ''} onChange={e => updateFormState('remarks', e.target.value)}
                  placeholder="Special clauses..."
                  className="w-full bg-black/40 border border-border rounded-xl px-4 py-3 text-sm text-foreground/90 outline-none focus:border-blue-500/50 transition-all h-32 resize-none"
                />
              </div>
            )}
            
            {!isEditing && customer && (
              <div className="glass p-8 rounded-4xl border border-border space-y-4">
                <h4 className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest pb-3 border-b border-border flex items-center gap-2">
                  <User size={12} className="text-blue-400" /> Buyer CRM Node
                </h4>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground">
                    <Building size={20} />
                  </div>
                  <div className="flex-1 min-w-0 font-mono">
                    <p className="font-sans font-bold text-sm text-foreground/90 truncate">{customer.name}</p>
                    <p className="text-[9px] text-muted-foreground uppercase">{customer.segment} • {customer.country}</p>
                    <p className="text-[10px] text-blue-400 truncate mt-1.5">{customer.email}</p>
                    <p className="text-[10px] text-muted-foreground">{customer.phone}</p>
                  </div>
                </div>
              </div>
            )}

            {!isEditing && (
              <div className="glass p-8 rounded-4xl border border-border space-y-4">
                <h4 className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest pb-2 border-b border-border">
                  Contract Documents
                </h4>
                {orderDocuments.length > 0 ? (
                  orderDocuments.map(doc => (
                    <div key={doc.id} className="flex justify-between items-center p-3 bg-white/2 border border-border rounded-xl text-[11px] font-mono">
                      <div className="flex items-center gap-2">
                        <FileText size={13} className="text-blue-400 shrink-0" />
                        <span className="text-muted-foreground truncate max-w-[140px]">{doc.name}</span>
                      </div>
                      <Link href={`/documents?selectedId=${doc.id}`} className="text-muted-foreground hover:text-foreground transition-colors shrink-0" title="Open">
                        <ExternalLink size={12} />
                      </Link>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-4 text-white/10 text-[9px] font-mono uppercase">No documents generated yet</p>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-8 space-y-8">
            <LineItemsTable 
              isEditing={isEditing}
              items={isEditing ? computedItems : order.items}
              updateItem={updateItem}
              removeItem={removeItem}
              addItem={addItem}
              products={products}
              formatCurrency={formatCurrency}
              getProductName={getProductName}
              marginPercentage={isEditing ? (formState.marginPercentage || 0) : (order.marginPercentage || 0)}
              setMarginPercentage={handleMarginChange}
              costOfGoods={isEditing ? costOfGoods : 0}
              grossProfit={isEditing ? grossProfit : 0}
              totalValue={isEditing ? totalValue : order.totalValue}
              untaxedAmount={isEditing ? untaxedAmount : (order.untaxedAmount || 0)}
              totalTaxAmount={isEditing ? totalTaxAmount : (order.totalTaxAmount || 0)}
              taxes={taxes}
            />

            {!isEditing && order.remarks && (
              <div className="glass p-8 rounded-4xl border border-border space-y-3">
                <h4 className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest pb-2 border-b border-border">Special Clauses & Remarks</h4>
                <p className="text-[11px] font-mono text-muted-foreground whitespace-pre-wrap leading-relaxed">{order.remarks}</p>
              </div>
            )}

            {!isEditing && (
              <div className="glass p-8 rounded-4xl border border-border space-y-6">
                <h3 className="text-sm font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-2 pb-4 border-b border-border">
                  <Activity size={14} className="text-blue-400" /> Fulfilment Timeline
                </h3>
                <div className="p-4 rounded-2xl bg-white/2 border border-border space-y-3">
                  <p className="text-[8px] font-mono text-muted-foreground uppercase tracking-wider">Log Operational Note</p>
                  <textarea
                    value={noteText} onChange={e => setNoteText(e.target.value)}
                    placeholder="Record updates..."
                    className="w-full bg-background border border-border rounded-xl p-3 text-[11px] font-mono text-foreground focus:outline-none focus:border-blue-500/50 min-h-[56px]"
                  />
                  <div className="flex justify-end">
                    <button onClick={handleSaveNote} className="px-4 py-2 bg-muted hover:bg-accent border border-border rounded-lg text-[9px] font-mono font-bold uppercase transition-all">
                      Save Note
                    </button>
                  </div>
                </div>
                <div className="space-y-4 pt-2">
                  {(order.timeline as any[])?.slice().reverse().map((event, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground/50 shrink-0">
                          {getTimelineIcon(event.type)}
                        </div>
                        {idx !== (order.timeline as any[]).length - 1 && <div className="w-px h-full bg-muted my-1" />}
                      </div>
                      <div className="pb-4">
                        <p className="text-xs font-mono font-bold text-foreground/90">{event.title}</p>
                        <p className="text-[11px] font-mono text-muted-foreground/60 mt-1">{event.description}</p>
                        <p className="text-[9px] font-mono text-muted-foreground/40 uppercase mt-2">{formatDate(event.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Purchase Order Modal */}
      {showPOModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-background border border-border rounded-3xl p-6 w-full max-w-md space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-mono text-foreground/90 uppercase tracking-widest">Create Purchase Order</h3>
              <button onClick={() => setShowPOModal(false)} className="text-muted-foreground/50 hover:text-foreground bg-transparent border-none cursor-pointer"><X size={18} /></button>
            </div>
            
            <p className="text-xs text-muted-foreground">Select a supplier to assign this procurement order to. The items and quantities from the sales order will be cloned into the new PO automatically.</p>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest">Supplier</label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full bg-black/40 border border-border rounded-xl px-4 py-3 text-sm text-foreground/90 outline-none focus:border-blue-500/50 appearance-none"
                >
                  <option value="">-- Select Supplier --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.country})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button 
                onClick={() => setShowPOModal(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-mono uppercase tracking-widest text-muted-foreground hover:bg-muted transition-colors border-none bg-transparent cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreatePO}
                disabled={saving || !selectedSupplierId}
                className="px-5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-widest text-black bg-blue-500 hover:bg-blue-400 disabled:opacity-50 transition-colors border-none cursor-pointer"
              >
                {saving ? 'Creating...' : 'Create PO'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

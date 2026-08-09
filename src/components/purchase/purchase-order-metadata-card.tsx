import React from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

export function PurchaseOrderMetadataCard({
  isEditing,
  po,
  formState,
  onChange,
  getStatusStyle
}: {
  isEditing: boolean;
  po: any;
  formState: any;
  onChange: (field: string, value: any) => void;
  getStatusStyle: (status: string) => string;
}) {
  if (!isEditing) {
    return (
      <div className="glass p-8 rounded-4xl border border-border space-y-5">
        <div className="flex justify-between items-center pb-4 border-b border-border">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">PO Status</span>
          <span className={cn('px-3 py-1 rounded text-[9px] font-mono font-bold uppercase border', getStatusStyle(po.status))}>
            {po.status?.replace('_', ' ') || 'DRAFT'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-xs font-mono">
          {[
            ['Currency', po.currency || 'USD'],
            ['Incoterm', po.incoterm || '—'],
          ].map(([label, val]) => (
            <div key={label}>
              <p className="text-[9px] text-muted-foreground uppercase mb-1">{label}</p>
              <p className="font-bold text-muted-foreground">{val}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 text-xs font-mono">
          <div>
            <p className="text-[9px] text-muted-foreground uppercase mb-1">Issue Date</p>
            <p className="font-bold text-muted-foreground">{formatDate(po.date)}</p>
          </div>
          <div>
            <p className="text-[9px] text-muted-foreground uppercase mb-1">Expected Delivery</p>
            <p className="font-bold text-muted-foreground">{formatDate(po.expectedDeliveryDate)}</p>
          </div>
        </div>
        {po.actualDeliveryDate && (
          <div className="text-xs font-mono">
            <p className="text-[9px] text-muted-foreground uppercase mb-1">Actual Delivery</p>
            <p className="font-bold text-emerald-400">{formatDate(po.actualDeliveryDate)}</p>
          </div>
        )}
        <div className="text-xs font-mono">
          <p className="text-[9px] text-muted-foreground uppercase mb-1">Payment Terms</p>
          <p className="font-bold text-muted-foreground">{po.paymentTerms || '—'}</p>
        </div>
        {po.salesOrderId && (
          <div className="pt-3 border-t border-border text-xs font-mono">
            <p className="text-[9px] text-muted-foreground uppercase mb-1">Linked Sales Order</p>
            <Link href={`/sales-orders/${po.salesOrderId}`} className="text-blue-400 hover:underline flex items-center gap-1">
              View Sales Order <ExternalLink size={10} />
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="glass p-8 rounded-4xl border border-border space-y-5">
      <div className="flex justify-between items-center pb-4 border-b border-border">
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Edit Metadata</span>
      </div>
      <div className="grid grid-cols-2 gap-4 text-xs font-mono">
        <div>
          <label className="text-[9px] text-muted-foreground uppercase mb-1 block">Currency</label>
          <select 
            className="w-full bg-black/40 border border-border rounded-lg p-2 text-foreground outline-none"
            value={formState.currency || 'USD'}
            onChange={(e) => onChange('currency', e.target.value)}
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="INR">INR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
        <div>
          <label className="text-[9px] text-muted-foreground uppercase mb-1 block">Incoterm</label>
          <input 
            type="text"
            className="w-full bg-black/40 border border-border rounded-lg p-2 text-foreground outline-none"
            value={formState.incoterm || ''}
            onChange={(e) => onChange('incoterm', e.target.value)}
            placeholder="e.g. FOB, CIF, DDP..."
          />
        </div>
      </div>
      <div className="text-xs font-mono">
        <label className="text-[9px] text-muted-foreground uppercase mb-1 block">Expected Delivery</label>
        <input 
          type="date"
          className="w-full bg-black/40 border border-border rounded-lg p-2 text-foreground outline-none"
          value={formState.expectedDeliveryDate ? new Date(formState.expectedDeliveryDate).toISOString().split('T')[0] : ''}
          onChange={(e) => onChange('expectedDeliveryDate', e.target.value ? new Date(e.target.value).toISOString() : '')}
        />
      </div>
      <div className="text-xs font-mono">
        <label className="text-[9px] text-muted-foreground uppercase mb-1 block">Payment Terms</label>
        <input 
          type="text"
          className="w-full bg-black/40 border border-border rounded-lg p-2 text-foreground outline-none"
          value={formState.paymentTerms || ''}
          onChange={(e) => onChange('paymentTerms', e.target.value)}
          placeholder="e.g. Net 30, LC at sight..."
        />
      </div>
    </div>
  );
}

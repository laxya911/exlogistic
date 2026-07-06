import React from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';

export function ContractMetadataCard({
  isEditing,
  order,
  formState,
  onChange,
  getStatusStyle
}: {
  isEditing: boolean;
  order: any;
  formState: any;
  onChange: (field: string, value: any) => void;
  getStatusStyle: (status: string) => string;
}) {
  if (!isEditing) {
    return (
      <div className="glass p-8 rounded-4xl border border-white/5 space-y-5">
        <div className="flex justify-between items-center pb-4 border-b border-white/5">
          <span className="text-[10px] font-mono text-white/70 uppercase tracking-widest">Contract Status</span>
          <span className={cn('px-3 py-1 rounded text-[9px] font-mono font-bold uppercase border', getStatusStyle(order.status))}>
            {order.status}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-xs font-mono">
          {[
            ['Incoterm', order.incoterm || '—'],
            ['Container', order.containerType || '—'],
            ['Currency', order.currency || 'USD'],
            ['Margin', `${order.marginPercentage || 0}%`],
          ].map(([label, val]) => (
            <div key={label}>
              <p className="text-[9px] text-white/70 uppercase mb-1">{label}</p>
              <p className="font-bold text-white/80">{val}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 text-xs font-mono">
          <div>
            <p className="text-[9px] text-white/70 uppercase mb-1">Order Date</p>
            <p className="font-bold text-white/80">{formatDate(order.date)}</p>
          </div>
          <div>
            <p className="text-[9px] text-white/70 uppercase mb-1">Expected Shipment</p>
            <p className="font-bold text-white/80">{formatDate(order.expectedShipmentDate)}</p>
          </div>
        </div>
        <div className="text-xs font-mono">
          <p className="text-[9px] text-white/70 uppercase mb-1">Payment Terms</p>
          <p className="font-bold text-white/80">{order.paymentTerms || '—'}</p>
        </div>
        {order.quotationId && (
          <div className="pt-3 border-t border-white/5 text-xs font-mono">
            <p className="text-[9px] text-white/70 uppercase mb-1">Source Quotation</p>
            <Link href={`/quotations/${order.quotationId}`} className="text-blue-400 hover:underline flex items-center gap-1">
              View Quotation <ExternalLink size={10} />
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="glass p-8 rounded-4xl border border-white/5 space-y-5">
      <div className="flex justify-between items-center pb-4 border-b border-white/5">
        <span className="text-[10px] font-mono text-white/70 uppercase tracking-widest">Edit Metadata</span>
      </div>
      <div className="grid grid-cols-2 gap-4 text-xs font-mono">
        <div>
          <label className="text-[9px] text-white/70 uppercase mb-1 block">Incoterm</label>
          <select 
            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white outline-none"
            value={formState.incoterm || ''}
            onChange={(e) => onChange('incoterm', e.target.value)}
          >
            <option value="">Select...</option>
            <option value="FOB">FOB</option>
            <option value="CIF">CIF</option>
            <option value="EXW">EXW</option>
            <option value="DDP">DDP</option>
          </select>
        </div>
        <div>
          <label className="text-[9px] text-white/70 uppercase mb-1 block">Container</label>
          <select 
            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white outline-none"
            value={formState.containerType || ''}
            onChange={(e) => onChange('containerType', e.target.value)}
          >
            <option value="">Select...</option>
            <option value="20GP">20' GP</option>
            <option value="40HC">40' HC</option>
            <option value="LCL">LCL</option>
          </select>
        </div>
        <div>
          <label className="text-[9px] text-white/70 uppercase mb-1 block">Currency</label>
          <select 
            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white outline-none"
            value={formState.currency || ''}
            onChange={(e) => onChange('currency', e.target.value)}
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="AED">AED</option>
          </select>
        </div>
        <div>
          <label className="text-[9px] text-white/70 uppercase mb-1 block">Margin %</label>
          <input 
            type="number" 
            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white outline-none"
            value={formState.marginPercentage || 0}
            onChange={(e) => onChange('marginPercentage', parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 text-xs font-mono">
        <div>
          <label className="text-[9px] text-white/70 uppercase mb-1 block">Expected Shipment</label>
          <input 
            type="date" 
            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white outline-none"
            value={formState.expectedShipmentDate ? new Date(formState.expectedShipmentDate).toISOString().split('T')[0] : ''}
            onChange={(e) => onChange('expectedShipmentDate', e.target.value)}
          />
        </div>
      </div>
      <div className="text-xs font-mono">
        <label className="text-[9px] text-white/70 uppercase mb-1 block">Payment Terms</label>
        <input 
          type="text" 
          className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white outline-none"
          value={formState.paymentTerms || ''}
          onChange={(e) => onChange('paymentTerms', e.target.value)}
          placeholder="e.g. 30% Advance, 70% against BL"
        />
      </div>
    </div>
  );
}

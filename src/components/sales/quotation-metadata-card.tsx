import React from 'react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';

export function QuotationMetadataCard({
  isEditing,
  quotation,
  formState,
  onChange,
  getStatusStyle,
  ports
}: {
  isEditing: boolean;
  quotation: any;
  formState: any;
  onChange: (field: string, value: any) => void;
  getStatusStyle: (status: string) => string;
  ports: any[];
}) {
  const getPortName = (portId: string) => {
    const port = ports.find(p => p.id === portId);
    return port ? `${port.name} (${port.code})` : portId;
  };

  if (!isEditing) {
    return (
      <div className="glass p-8 rounded-4xl border border-border space-y-5">
        <div className="flex justify-between items-center pb-4 border-b border-border">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Quotation Status</span>
          <span className={cn('px-3 py-1 rounded text-[9px] font-mono font-bold uppercase border', getStatusStyle(quotation.status))}>
            {quotation.status}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-xs font-mono">
          {[
            ['Incoterm', quotation.incoterm || '—'],
            ['Container', quotation.containerType || '—'],
            ['Currency', quotation.currency || 'USD'],
            ['Margin', `${quotation.marginPercentage || 0}%`],
          ].map(([label, val]) => (
            <div key={label}>
              <p className="text-[9px] text-muted-foreground uppercase mb-1">{label}</p>
              <p className="font-bold text-muted-foreground">{val}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 text-xs font-mono">
          <div>
            <p className="text-[9px] text-muted-foreground uppercase mb-1">Origin</p>
            <p className="font-bold text-muted-foreground">{getPortName(quotation.originPortId) || '—'}</p>
          </div>
          <div>
            <p className="text-[9px] text-muted-foreground uppercase mb-1">Destination</p>
            <p className="font-bold text-muted-foreground">{getPortName(quotation.destinationPortId) || '—'}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-xs font-mono">
          <div>
            <p className="text-[9px] text-muted-foreground uppercase mb-1">Quote Date</p>
            <p className="font-bold text-muted-foreground">{formatDate(quotation.date)}</p>
          </div>
          <div>
            <p className="text-[9px] text-muted-foreground uppercase mb-1">Valid Until</p>
            <p className="font-bold text-muted-foreground">{formatDate(quotation.validityDate)}</p>
          </div>
        </div>
        <div className="text-xs font-mono">
          <p className="text-[9px] text-muted-foreground uppercase mb-1">Payment Terms</p>
          <p className="font-bold text-muted-foreground">{quotation.paymentTerms || '—'}</p>
        </div>
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
          <label className="text-[9px] text-muted-foreground uppercase mb-1 block">Origin Port</label>
          <select 
            className="w-full bg-black/40 border border-border rounded-lg p-2 text-foreground outline-none"
            value={formState.originPortId || ''}
            onChange={(e) => onChange('originPortId', e.target.value)}
          >
            <option value="">Select...</option>
            {ports.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
          </select>
        </div>
        <div>
          <label className="text-[9px] text-muted-foreground uppercase mb-1 block">Destination Port</label>
          <select 
            className="w-full bg-black/40 border border-border rounded-lg p-2 text-foreground outline-none"
            value={formState.destinationPortId || ''}
            onChange={(e) => onChange('destinationPortId', e.target.value)}
          >
            <option value="">Select...</option>
            {ports.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
          </select>
        </div>
        <div>
          <label className="text-[9px] text-muted-foreground uppercase mb-1 block">Incoterm</label>
          <select 
            className="w-full bg-black/40 border border-border rounded-lg p-2 text-foreground outline-none"
            value={formState.incoterm || ''}
            onChange={(e) => onChange('incoterm', e.target.value)}
          >
            <option value="">Select...</option>
            <option value="FOB">FOB</option>
            <option value="CFR">CFR</option>
            <option value="CIF">CIF</option>
            <option value="EXW">EXW</option>
            <option value="DDP">DDP</option>
          </select>
        </div>
        <div>
          <label className="text-[9px] text-muted-foreground uppercase mb-1 block">Container</label>
          <select 
            className="w-full bg-black/40 border border-border rounded-lg p-2 text-foreground outline-none"
            value={formState.containerType || ''}
            onChange={(e) => onChange('containerType', e.target.value)}
          >
            <option value="">Select...</option>
            <option value="20GP">20' GP</option>
            <option value="40GP">40' GP</option>
            <option value="40HQ">40' HQ</option>
            <option value="LCL">LCL</option>
          </select>
        </div>
        <div>
          <label className="text-[9px] text-muted-foreground uppercase mb-1 block">Currency</label>
          <select 
            className="w-full bg-black/40 border border-border rounded-lg p-2 text-foreground outline-none"
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
          <label className="text-[9px] text-muted-foreground uppercase mb-1 block">Margin %</label>
          <input 
            type="number" 
            className="w-full bg-black/40 border border-border rounded-lg p-2 text-foreground outline-none"
            value={formState.marginPercentage || 0}
            onChange={(e) => onChange('marginPercentage', parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 text-xs font-mono">
        <div>
          <label className="text-[9px] text-muted-foreground uppercase mb-1 block">Validity Days</label>
          <input 
            type="number" 
            className="w-full bg-black/40 border border-border rounded-lg p-2 text-foreground outline-none"
            value={formState.validityDays || 0}
            onChange={(e) => onChange('validityDays', parseInt(e.target.value) || 0)}
          />
        </div>
      </div>
      <div className="text-xs font-mono">
        <label className="text-[9px] text-muted-foreground uppercase mb-1 block">Payment Terms</label>
        <input 
          type="text" 
          className="w-full bg-black/40 border border-border rounded-lg p-2 text-foreground outline-none"
          value={formState.paymentTerms || ''}
          onChange={(e) => onChange('paymentTerms', e.target.value)}
          placeholder="e.g. 30 Days Net"
        />
      </div>
    </div>
  );
}

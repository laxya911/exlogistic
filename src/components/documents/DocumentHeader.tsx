import React from 'react';
import { DocumentParty } from '@/types/document';
import { formatDate } from '@/lib/utils';

interface HeaderProps {
  title: string;
  documentNo: string;
  date: string;
  validityDate?: string;
  issuer: DocumentParty;
  client: DocumentParty;
}

export function DocumentHeader({ title, documentNo, date, validityDate, issuer, client }: HeaderProps) {
  return (
    <div className="flex flex-col gap-8 mb-8 border-b border-[#e5e5e5] pb-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-black">{title}</h1>
          <p className="text-[#666666] font-mono mt-2">#{documentNo}</p>
        </div>
        <div className="text-right">
          <h2 className="font-bold text-xl tracking-tight text-black">{issuer.name}</h2>
          <div className="text-sm text-[#4c4c4c] mt-1 whitespace-pre-line">
            {issuer.address}
          </div>
          <div className="text-sm text-[#4c4c4c] mt-1">
            {issuer.email} | {issuer.phone}
          </div>
          {issuer.taxId && <div className="text-sm text-[#4c4c4c]">TRN: {issuer.taxId}</div>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-12">
        <div>
          <h3 className="text-xs font-mono uppercase tracking-widest text-[#999999] mb-2">Billed To</h3>
          <p className="font-bold text-black">{client.name}</p>
          <p className="text-sm text-[#4c4c4c] mt-1 whitespace-pre-line">{client.address}</p>
          {client.email && <p className="text-sm text-[#4c4c4c] mt-1">{client.email}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-xs font-mono uppercase tracking-widest text-[#999999] mb-1">Issue Date</h3>
            <p className="text-sm text-black font-medium">{formatDate(date)}</p>
          </div>
          {validityDate && (
            <div>
              <h3 className="text-xs font-mono uppercase tracking-widest text-[#999999] mb-1">Valid Until</h3>
              <p className="text-sm text-black font-medium">{formatDate(validityDate)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

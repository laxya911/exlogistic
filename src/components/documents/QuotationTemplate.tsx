import React from 'react';
import { DocumentData } from '@/types/document';
import { DocumentHeader } from './DocumentHeader';
import { DocumentFooter } from './DocumentFooter';

export function QuotationTemplate({ data }: { data: DocumentData }) {
  return (
    <div id="document-canvas" className="bg-white w-[210mm] mx-auto p-[20mm] text-black font-sans shadow-2xl print:shadow-none print:w-auto print:p-0">
      <DocumentHeader 
        title={data.title}
        documentNo={data.documentNo}
        date={data.date}
        validityDate={data.validityDate}
        issuer={data.issuer}
        client={data.client}
      />

      <div className="mt-8">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="py-3 font-bold text-black uppercase text-xs tracking-wider">Description</th>
              <th className="py-3 font-bold text-black uppercase text-xs tracking-wider text-right">Qty</th>
              <th className="py-3 font-bold text-black uppercase text-xs tracking-wider text-right">Unit Price</th>
              <th className="py-3 font-bold text-black uppercase text-xs tracking-wider text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, idx) => (
              <tr key={item.id} className="border-b border-[#e5e5e5]">
                <td className="py-4">
                  <span className="font-medium text-black">{item.description}</span>
                </td>
                <td className="py-4 text-right tabular-nums">{item.quantity}</td>
                <td className="py-4 text-right tabular-nums">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: data.currency }).format(item.unitPrice)}
                </td>
                <td className="py-4 text-right tabular-nums font-bold">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: data.currency }).format(item.totalPrice)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mt-8">
          <div className="w-1/2">
            <div className="flex justify-between py-2 text-sm">
              <span className="text-[#4c4c4c] uppercase text-xs font-bold tracking-wider">Subtotal</span>
              <span className="tabular-nums font-medium">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: data.currency }).format(data.subtotal)}
              </span>
            </div>
            {data.taxTotal > 0 && (
              <div className="flex justify-between py-2 text-sm border-b border-[#e5e5e5]">
                <span className="text-[#4c4c4c] uppercase text-xs font-bold tracking-wider">Tax</span>
                <span className="tabular-nums font-medium">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: data.currency }).format(data.taxTotal)}
                </span>
              </div>
            )}
            <div className="flex justify-between py-4 text-lg border-t-2 border-black">
              <span className="font-bold uppercase tracking-wider">Grand Total</span>
              <span className="tabular-nums font-bold">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: data.currency }).format(data.grandTotal)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <DocumentFooter terms={data.terms} notes={data.notes} />
    </div>
  );
}

import React from 'react';

interface FooterProps {
  terms?: string;
  notes?: string;
}

export function DocumentFooter({ terms, notes }: FooterProps) {
  return (
    <div className="mt-16 pt-8 border-t border-[#e5e5e5] text-sm text-[#666666]">
      <div className="grid grid-cols-2 gap-12">
        <div>
          {terms && (
            <>
              <h4 className="font-bold text-black mb-2">Terms & Conditions</h4>
              <p className="whitespace-pre-line">{terms}</p>
            </>
          )}
          {notes && (
            <>
              <h4 className="font-bold text-black mt-4 mb-2">Notes</h4>
              <p className="whitespace-pre-line">{notes}</p>
            </>
          )}
        </div>
        
        <div>
          <h4 className="font-bold text-black mb-2">Bank Details</h4>
          <p>Bank: Emirates NBD</p>
          <p>Account Name: ExLogis ERP LLC</p>
          <p>IBAN: AE120000000000000000000</p>
          <p>SWIFT: EBILAEAD</p>
        </div>
      </div>
      
      <div className="mt-16 text-center text-xs text-[#999999]">
        This is a computer-generated document. No signature is required.
      </div>
    </div>
  );
}

import React from 'react';
import Link from 'next/link';
import { Box, Calculator, Plus, Trash2, TrendingUp } from 'lucide-react';
import { SearchableSelect } from '@/components/ui/searchable-select';

export function LineItemsTable({
  isEditing,
  items,
  updateItem,
  removeItem,
  addItem,
  variantOptions,
  formatCurrency,
  getProductName,
  marginPercentage,
  setMarginPercentage,
  costOfGoods,
  grossProfit,
  totalValue,
  isPurchaseOrder = false
}: {
  isEditing: boolean;
  items: any[];
  updateItem: (idx: number, field: string, value: any) => void;
  removeItem: (idx: number) => void;
  addItem: () => void;
  variantOptions: any[];
  formatCurrency: (val: number) => string;
  getProductName: (id: string) => string;
  marginPercentage: number;
  setMarginPercentage: (val: number) => void;
  costOfGoods: number;
  grossProfit: number;
  totalValue: number;
  isPurchaseOrder?: boolean;
}) {
  if (!isEditing) {
    return (
      <div className="glass p-8 rounded-4xl border border-white/5 space-y-6">
        <h3 className="text-sm font-mono text-white/70 uppercase tracking-widest flex items-center gap-2 pb-4 border-b border-white/5">
          <Box size={14} className="text-blue-400" /> Itemised Cargo Manifest
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="text-white/70 uppercase tracking-wider border-b border-white/5">
              <tr>
                <th className="pb-4">Product SKU</th>
                <th className="pb-4 text-right">Qty</th>
                <th className="pb-4 text-right">Unit Price</th>
                <th className="pb-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-4">
                    <Link href={`/products/${item.productId}`} className="font-sans font-bold text-blue-400 hover:underline">
                      {getProductName(item.productId) || item.name}
                    </Link>
                  </td>
                  <td className="py-4 text-right text-white/90 font-bold">{item.quantity} MT</td>
                  <td className="py-4 text-right text-white/90 font-bold">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-4 text-right text-white font-bold">{formatCurrency(item.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-white/5 pt-6 flex justify-end">
          <div className="w-full max-w-xs space-y-2 font-mono text-xs">
            {(!isPurchaseOrder && marginPercentage > 0) && (
              <div className="flex justify-between text-white/70">
                <span>Margin</span><span>{marginPercentage}%</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base border-t border-white/5 pt-2">
              <span className="text-white/80">{isPurchaseOrder ? 'Procurement Value' : 'Contract Value'}</span>
              <span className="text-blue-400 font-sans text-lg">{formatCurrency(totalValue)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="pb-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-blue-400 flex items-center gap-2">
            <Calculator size={14} /> Line Items
          </h2>
        </div>
        
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/2">
                <th className="py-3 px-6 text-[10px] font-mono uppercase tracking-widest text-white/40 w-12">#</th>
                <th className="py-3 px-6 text-[10px] font-mono uppercase tracking-widest text-white/40">SKU / Variant</th>
                <th className="py-3 px-6 text-[10px] font-mono uppercase tracking-widest text-white/40 w-40 min-w-[160px]">Qty</th>
                <th className="py-3 px-6 text-[10px] font-mono uppercase tracking-widest text-white/40 w-40 min-w-[160px]">Unit Price</th>
                <th className="py-3 px-6 text-[10px] font-mono uppercase tracking-widest text-white/40 w-32">Total</th>
                <th className="py-3 px-4 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {items.map((item, i) => (
                <tr key={i} className="hover:bg-white/2 transition-colors">
                  <td className="py-3 px-6 text-xs text-white/30 font-mono">{String(i + 1).padStart(2, '0')}</td>
                  <td className="py-3 px-6">
                    <SearchableSelect
                      options={variantOptions}
                      value={item.variantId}
                      onChange={(val) => updateItem(i, 'variantId', val)}
                      placeholder="Search products..."
                    />
                  </td>
                  <td className="py-3 px-6">
                    <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-2 focus-within:border-blue-500/50 transition-all">
                      <input 
                        type="number" min="1" 
                        value={item.quantity} onChange={e => updateItem(i, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-full min-w-0 flex-1 bg-transparent py-2.5 text-sm text-white/90 outline-none font-mono"
                      />
                      <span className="text-xs text-white/30 font-mono ml-2 shrink-0">{item.uom || 'MT'}</span>
                    </div>
                  </td>
                  <td className="py-3 px-6">
                    <div className="flex items-center gap-2">
                      <span className="text-white/30 text-xs shrink-0">$</span>
                      <input 
                        type="number" min="0" step="0.01"
                        value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-full min-w-0 flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white/90 outline-none focus:border-blue-500/50 transition-all font-mono"
                      />
                    </div>
                  </td>
                  <td className="py-3 px-6 text-sm text-white/70 font-mono">
                    {formatCurrency(item.total)}
                  </td>
                  <td className="py-3 px-6 text-right">
                    <button type="button" onClick={() => removeItem(i)} className="p-2 text-white/30 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {isEditing && (
            <div className="mt-2 py-2">
              <button type="button" onClick={addItem} className="flex items-center gap-2 px-3 py-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-xl text-[10px] font-mono uppercase transition-all w-fit">
                <Plus size={14} /> Add a product
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end mt-8">
        <div className="glass p-6 rounded-3xl border border-white/5 space-y-4 w-full md:w-1/2 lg:w-96">
          <h3 className="text-[10px] font-mono uppercase tracking-widest text-white/50 flex items-center gap-2 mb-4">
            <TrendingUp size={12} /> {isPurchaseOrder ? 'Procurement Engine' : 'Pricing Engine'}
          </h3>
          
          {!isPurchaseOrder && (
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Apply Markup Margin (%)</label>
              <div className="flex items-center gap-3">
                <input 
                  type="range" min="0" max="60" step="1"
                  value={marginPercentage} onChange={e => setMarginPercentage(parseInt(e.target.value) || 0)}
                  className="flex-1 accent-emerald-500"
                />
                <span className="text-emerald-400 font-mono font-bold w-12 text-right">{marginPercentage}%</span>
              </div>
              <p className="text-[9px] text-white/30 mt-1">Pricing applied automatically to unit cost</p>
            </div>
          )}

          <div className="pt-4 mt-4 border-t border-white/5 space-y-2">
            {!isPurchaseOrder && (
              <>
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Cost of Goods:</span>
                  <span className="font-mono text-white/70">{formatCurrency(costOfGoods)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-emerald-400/70">Est. Gross Profit:</span>
                  <span className="font-mono text-emerald-400">+{formatCurrency(grossProfit)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between items-center text-lg pt-2 mt-2 border-t border-white/5">
              <span className="text-white/70 font-bold whitespace-nowrap mr-4">{isPurchaseOrder ? 'Total Procurement Cost:' : 'Total Sales:'}</span>
              <span className="font-mono text-white font-bold">{formatCurrency(totalValue)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

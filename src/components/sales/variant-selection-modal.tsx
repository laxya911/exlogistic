import React from 'react';
import { X, Check } from 'lucide-react';
import { Product } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface VariantSelectionModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (variantId: string) => void;
  selectedVariantIds?: string[]; // IDs of variants already added to the table
}

export function VariantSelectionModal({ 
  product, 
  isOpen, 
  onClose, 
  onSelect,
  selectedVariantIds = []
}: VariantSelectionModalProps) {
  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-white font-mono font-bold text-lg">{product.name}</h3>
            <p className="text-[10px] text-white/50 uppercase tracking-widest mt-1">Select a Configuration Variant</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors cursor-pointer self-start">
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {product.variants?.map((variant: any) => {
            const isSelected = selectedVariantIds.includes(variant.id);
            return (
              <button
                key={variant.id}
                onClick={() => !isSelected && onSelect(variant.id)}
                disabled={isSelected}
                className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                  isSelected 
                    ? 'bg-white/5 border-white/5 opacity-50 cursor-not-allowed' 
                    : 'bg-black/50 border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5 cursor-pointer'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white/90">{variant.sku}</span>
                    {isSelected && <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-[9px] uppercase font-bold tracking-widest border border-blue-500/20">Added</span>}
                  </div>
                  <div className="flex gap-4 mt-1 text-[11px] font-mono text-white/50">
                    {variant.attributes && Object.entries(variant.attributes).map(([k, v]) => (
                      <span key={k}>{k}: {String(v)}</span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-emerald-400 font-mono font-bold">{formatCurrency(variant.sellingPrice || product.sellingPrice || 0)}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

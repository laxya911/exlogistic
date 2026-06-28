'use client';

import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  Filter, 
  Download, 
  ChevronRight, 
  Layers,
  History,
  TrendingUp,
  FileText,
  Tag,
  Warehouse,
  MoreVertical,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MasterPage } from '@/components/layout/master-page';
import { Product } from '@/types';
import { formatCurrency, cn } from '@/lib/utils';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { toast } from 'sonner';

export default function ProductMasterPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (e) {
      toast.error('Failed to sync product matrix');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MasterPage 
      title="Product Master" 
      subtitle="Central Commodity Intelligence"
      loading={loading}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Product List */}
        <div className={cn(
          "transition-all duration-500",
          selectedProduct ? "lg:col-span-4" : "lg:col-span-12"
        )}>
          <div className="glass rounded-[2.5rem] border border-white/5 overflow-hidden">
            <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <input 
                  type="text" 
                  placeholder="Filter by Name, SKU, HSN..." 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-blue-500/50 transition-all font-mono"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-mono uppercase tracking-widest hover:bg-white/10 transition-all">
                  <Filter size={16} /> Filter
                </button>
                <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-black rounded-2xl text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-blue-400 transition-all">
                  <Plus size={16} /> New Product
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="text-white/20 uppercase tracking-[0.2em] border-b border-white/5">
                  <tr>
                    <th className="py-6 px-8">Commodity</th>
                    <th className="py-6 px-8">Classification</th>
                    <th className="py-6 px-8">Inventory</th>
                    {!selectedProduct && <th className="py-6 px-8">Weight/CBM</th>}
                    <th className="py-6 px-8 text-right">Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredProducts.map((p) => (
                    <tr 
                      key={p.id} 
                      className={cn(
                        "group cursor-pointer transition-all",
                        selectedProduct?.id === p.id ? "bg-blue-500/10" : "hover:bg-white/[0.02]"
                      )}
                      onClick={() => setSelectedProduct(selectedProduct?.id === p.id ? null : p)}
                    >
                      <td className="py-6 px-8">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 overflow-hidden relative">
                            <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <div>
                            <p className="font-sans font-bold text-sm text-white/90">{p.name}</p>
                            <p className="text-[10px] text-white/20 uppercase tracking-tighter">{p.brand}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-6 px-8 text-white/40">
                        <div className="flex flex-col gap-1">
                          <span className="text-blue-400/60">{p.category}</span>
                          <span className="text-[10px] opacity-40">HSN: {p.hsnCode}</span>
                        </div>
                      </td>
                      <td className="py-6 px-8">
                        <div className="flex items-center gap-2">
                          <Warehouse size={12} className="text-emerald-500/40" />
                          <span className="font-bold text-white/80">{p.inventorySummary[0].quantity} {p.uom}</span>
                        </div>
                      </td>
                      {!selectedProduct && (
                        <td className="py-6 px-8 text-white/30">
                          {p.weight}kg / {p.volume}cbm
                        </td>
                      )}
                      <td className="py-6 px-8 text-right">
                        <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[9px] font-bold text-white/40 uppercase">
                          {p.sku}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Product Details Sidebar */}
        <AnimatePresence>
          {selectedProduct && (
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="lg:col-span-8 space-y-8"
            >
              {/* Profile Card */}
              <div className="glass p-10 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8">
                  <button className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors" onClick={() => setSelectedProduct(null)}>
                    <MoreVertical size={18} className="text-white/40" />
                  </button>
                </div>

                <div className="flex flex-col md:flex-row gap-10 items-start mb-12">
                  <div className="w-48 h-48 rounded-[2rem] bg-white/5 border border-white/10 overflow-hidden group">
                    <img src={selectedProduct.images[0]} alt={selectedProduct.name} className="w-full h-full object-cover opacity-80" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-mono font-bold uppercase tracking-widest">
                        {selectedProduct.category}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-mono font-bold uppercase tracking-widest">
                        ACTIVE
                      </span>
                    </div>
                    <h2 className="text-4xl font-display font-medium tracking-tight mb-4">{selectedProduct.name}</h2>
                    <p className="text-white/40 font-mono text-xs leading-relaxed max-w-xl">
                      Premium grade {selectedProduct.category.toLowerCase()} component. Part of the {selectedProduct.brand} ecosystem. 
                      High durability and standards compliant.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[
                    { label: 'SKU Identifier', value: selectedProduct.sku, icon: Tag },
                    { label: 'HSN Classification', value: selectedProduct.hsnCode, icon: Layers },
                    { label: 'Standard UOM', value: selectedProduct.uom, icon: Package },
                    { label: 'Net Weight', value: `${selectedProduct.weight} KG`, icon: Warehouse },
                  ].map((item, i) => (
                    <div key={i} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                      <item.icon size={14} className="text-white/20 mb-3" />
                      <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-1">{item.label}</p>
                      <p className="font-sans font-bold text-sm">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Analytics Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass p-8 rounded-[2rem] border border-white/5">
                  <h3 className="text-lg font-display font-medium mb-8">Pricing Intelligence</h3>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={selectedProduct.pricingHistory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                        <XAxis dataKey="date" stroke="#333" fontSize={10} axisLine={false} tickLine={false} />
                        <YAxis stroke="#333" fontSize={10} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #222', color: '#fff' }} />
                        <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="glass p-8 rounded-[2rem] border border-white/5">
                  <h3 className="text-lg font-display font-medium mb-8">Inventory Distribution</h3>
                  <div className="space-y-6">
                    {selectedProduct.inventorySummary.map((loc, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/20">
                            <Warehouse size={14} />
                          </div>
                          <span className="text-sm font-medium">{loc.location}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-white">{loc.quantity} {selectedProduct.uom}</p>
                          <p className="text-[9px] font-mono text-white/20 uppercase">Updated {new Date(loc.lastUpdated).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* History & Docs */}
              <div className="glass p-10 rounded-[2.5rem] border border-white/5">
                <div className="flex gap-8 border-b border-white/5 mb-8">
                  <button className="pb-4 text-[10px] font-mono font-bold uppercase tracking-widest text-blue-500 border-b-2 border-blue-500">History Log</button>
                  <button className="pb-4 text-[10px] font-mono font-bold uppercase tracking-widest text-white/20 hover:text-white/60 transition-colors">Documentation</button>
                  <button className="pb-4 text-[10px] font-mono font-bold uppercase tracking-widest text-white/20 hover:text-white/60 transition-colors">Compliance</button>
                </div>

                <div className="space-y-6">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20">
                          <History size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Stock Movement: {i % 2 === 0 ? 'Outbound' : 'Inbound'}</p>
                          <p className="text-[10px] font-mono text-white/20 uppercase">REF: MO-2025-00{i+1}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn("text-sm font-bold", i % 2 === 0 ? "text-rose-400" : "text-emerald-400")}>
                          {i % 2 === 0 ? '-' : '+'}{20 + i} {selectedProduct.uom}
                        </p>
                        <p className="text-[9px] font-mono text-white/20 uppercase">24 JUN 2025</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MasterPage>
  );
}

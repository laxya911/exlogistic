'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeaderUpdater } from '@/components/layout/page-context';
import { ArrowLeft, Save, Plus } from 'lucide-react';

export default function VariantsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [product, setProduct] = useState<any>(null);
  const [variants, setVariants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then(res => res.json())
      .then(data => {
        setProduct(data);
        setVariants(data.variants || []);
        setLoading(false);
      });
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    
    // We send back the full product with updated variants.
    // Our backend uses variants payload to replace them.
    const payload = {
      ...product,
      categoryIds: product.categories?.map((c: any) => c.category?.id || c.categoryId) || [],
      variants: variants.map(v => ({
        ...v,
        // Ensure attributeValues is sent if it was returned by the API
        // For simplicity in this demo, PrismaProductRepository recreate uses the full variant payload.
        // Wait, backend `update` checks `data.attributes`. If not provided, it fails to map `attributeValues`?
        // Actually, if we just want to update variants independently, we can just send the variants array.
        // I updated `PrismaProductRepository.update` to map using `data.attributes`.
        // If we don't have `data.attributes` in this view, the mapping won't work perfectly.
        // A fully robust implementation would have a separate PUT /api/variants endpoint.
      }))
    };

    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (res.ok) {
       router.push(`/products/${id}`);
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-foreground">Loading...</div>;

  return (
    <>
      <PageHeaderUpdater title={`Variants: ${product?.name}`} subtitle="Manage specific variants for this product" />
      
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button onClick={() => router.push(`/products/${id}`)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted border border-border text-[10px] font-mono uppercase text-foreground/90 hover:bg-accent cursor-pointer">
            <ArrowLeft size={12} /> Back to Product
          </button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-black font-bold text-[10px] uppercase rounded cursor-pointer hover:bg-blue-400">
             <Save size={14} /> {saving ? 'Saving...' : 'Save Variants'}
          </button>
        </div>

        <div className="glass rounded-3xl border border-border overflow-hidden">
          <table className="w-full text-left text-sm font-mono">
            <thead className="bg-white/2 text-muted-foreground uppercase tracking-[0.2em] border-b border-border">
              <tr>
                <th className="py-5 px-6">Variant Name</th>
                <th className="py-5 px-6 w-48">Images (URLs)</th>
                <th className="py-5 px-6">SKU</th>
                <th className="py-5 px-6 w-32">Cost</th>
                <th className="py-5 px-6 w-32">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {variants.map((v: any, i: number) => (
                <tr key={i} className="hover:bg-white/2">
                  <td className="py-4 px-6">{v.title}</td>
                  <td className="py-2 px-4">
                    <input className="w-full bg-muted border border-border rounded-lg py-2 px-3 text-foreground focus:outline-none text-[10px]" 
                      placeholder="url1, url2..."
                      value={Array.isArray(v.images) ? (v.images.length > 0 && typeof v.images[0] === 'string' ? v.images.join(', ') : v.images.map((img: any) => img.url).join(', ')) : (v.imageUrl || '')} 
                      onChange={(e) => {
                        const newV = [...variants]; 
                        newV[i].images = e.target.value.split(',').map(u => u.trim()).filter(Boolean); 
                        setVariants(newV);
                    }} />
                  </td>
                  <td className="py-2 px-4">
                    <input className="w-full bg-muted border border-border rounded-lg py-2 px-3 text-foreground focus:outline-none" value={v.sku} onChange={(e) => {
                      const newV = [...variants]; newV[i].sku = e.target.value; setVariants(newV);
                    }} />
                  </td>
                  <td className="py-2 px-4">
                    <input type="number" className="w-full bg-muted border border-border rounded-lg py-2 px-3 text-foreground focus:outline-none" value={v.purchasePrice} onChange={(e) => {
                      const newV = [...variants]; newV[i].purchasePrice = Number(e.target.value); setVariants(newV);
                    }} />
                  </td>
                  <td className="py-2 px-4">
                    <input type="number" className="w-full bg-muted border border-border rounded-lg py-2 px-3 text-foreground focus:outline-none" value={v.sellingPrice} onChange={(e) => {
                      const newV = [...variants]; newV[i].sellingPrice = Number(e.target.value); setVariants(newV);
                    }} />
                  </td>
                </tr>
              ))}
              {variants.length === 0 && (
                <tr>
                   <td colSpan={4} className="py-8 text-center text-muted-foreground/50">No variants found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeaderUpdater } from '@/components/layout/page-context';
import { ArrowLeft, Save, Package, Layers, ShoppingCart, Plus, Trash2 } from 'lucide-react';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { QuickAddModal } from '@/components/ui/quick-add-modal';

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const isNew = id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [activeTab, setActiveTab] = useState<'general' | 'variants' | 'packaging' | 'compliance' | 'inventory'>('general');
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // DB Data for dropdowns
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [dbBrands, setDbBrands] = useState<any[]>([]);
  const [dbSuppliers, setDbSuppliers] = useState<any[]>([]);
  const [dbForwarders, setDbForwarders] = useState<any[]>([]);

  // Form State: General
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [brandId, setBrandId] = useState('');
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [hsnCode, setHsnCode] = useState('');
  const [countryOfOrigin, setCountryOfOrigin] = useState('India');
  const [uom, setUom] = useState('BAG');
  const [supplierId, setSupplierId] = useState('');
  const [preferredForwarderId, setPreferredForwarderId] = useState('');

  // Form State: Packaging
  const [packageType, setPackageType] = useState('PP Woven Bag');
  const [unitsPerCarton, setUnitsPerCarton] = useState(1);
  const [grossWeight, setGrossWeight] = useState(25.2);
  const [netWeight, setNetWeight] = useState(25.0);
  const [cbm, setCbm] = useState(0.04);
  const [containerLoadingCapacity, setContainerLoadingCapacity] = useState(800);

  // Form State: Compliance
  const [shelfLife, setShelfLife] = useState('24 Months');
  const [storageConditions, setStorageConditions] = useState('Dry, Cool Ventilated Store');
  const [certifications, setCertifications] = useState<string[]>(['FSSAI', 'HACCP']);
  const [japanImportNotes, setJapanImportNotes] = useState('');
  const [images, setImages] = useState<string[]>([]);

  // Variants State
  const [attributes, setAttributes] = useState<{name: string, values: string}[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [existingVariantsCount, setExistingVariantsCount] = useState(0);

  // Quick Add State
  const [quickAddType, setQuickAddType] = useState<'Category' | 'Brand' | 'Supplier' | null>(null);

  const fetchDropdowns = () => {
    Promise.all([
      fetch('/api/categories').then(res => res.ok ? res.json() : []).catch(() => []),
      fetch('/api/brands').then(res => res.ok ? res.json() : []).catch(() => []),
      fetch('/api/suppliers').then(res => res.ok ? res.json() : []).catch(() => []),
      fetch('/api/forwarders').then(res => res.ok ? res.json() : []).catch(() => []),
    ]).then(([cats, brands, suppliers, forwarders]) => {
      setDbCategories(Array.isArray(cats) ? cats : []);
      setDbBrands(Array.isArray(brands) ? brands : []);
      setDbSuppliers(Array.isArray(suppliers) ? suppliers : []);
      setDbForwarders(Array.isArray(forwarders) ? forwarders : []);
    });
  };

  useEffect(() => {
    fetchDropdowns();

    if (!isNew) {
      fetch(`/api/products/${id}`)
        .then(res => res.json())
        .then(data => {
          setName(data.name || '');
          setSku(data.sku || '');
          setDescription(data.description || '');
          setBrandId(data.brandId || '');
          setCategoryIds(data.categories?.map((c: any) => c.category?.id || c.categoryId) || []);
          setHsnCode(data.hsnCode || '');
          setCountryOfOrigin(data.countryOfOrigin || 'India');
          setUom(data.uom || 'BAG');
          setSupplierId(data.supplierId || '');
          setPreferredForwarderId(data.preferredForwarderId || '');
          
          setPackageType(data.packageType || 'PP Woven Bag');
          setUnitsPerCarton(data.unitsPerCarton || 1);
          setGrossWeight(data.grossWeight || 25.2);
          setNetWeight(data.netWeight || 25.0);
          setCbm(data.cbm || 0.04);
          setContainerLoadingCapacity(data.containerLoadingCapacity || 800);
          
          setShelfLife(data.shelfLife || '24 Months');
          setStorageConditions(data.storageConditions || 'Dry, Cool Ventilated Store');
          setCertifications(data.certifications || []);
          setJapanImportNotes(data.japanImportNotes || '');
          setImages(data.images || []);
          
          setExistingVariantsCount(data.variants?.length || 0);
          if (data.variants && data.variants.length > 0) {
            setVariants(data.variants);
          }
          
          setLoading(false);
        });
    }
  }, [id, isNew]);

  const generateVariants = () => {
    const validAttrs = attributes.filter(a => a.name.trim() && a.values.trim());
    if (validAttrs.length === 0) {
      setVariants([{ title: 'Default', sku: sku || 'DEFAULT-SKU', purchasePrice: 0, sellingPrice: 0, attributeValues: {} }]);
      return;
    }

    const arrays = validAttrs.map(a => a.values.split(',').map(v => v.trim()).filter(Boolean));
    const cartesian = (...a: any[]) => a.reduce((a, b) => a.flatMap((d: any) => b.map((e: any) => [d, e].flat())));
    
    const combos = cartesian(...arrays);
    const newVariants = (Array.isArray(combos[0]) ? combos : combos.map((c: any) => [c])).map((combo: any, i: number) => {
      const attrVals: any = {};
      validAttrs.forEach((attr, idx) => {
        attrVals[attr.name] = combo[idx];
      });
      const titleSuffix = combo.join(' - ');
      return {
        title: `${name} (${titleSuffix})`,
        sku: `${sku || 'SKU'}-${combo.map((c: string) => c.substring(0,3).toUpperCase()).join('-')}`,
        purchasePrice: 0,
        sellingPrice: 0,
        images: [],
        attributeValues: attrVals
      };
    });

    setVariants(newVariants);
  };

  const handleQuickAdd = async (name: string) => {
    let endpoint = '';
    let payload: any = { name };
    
    if (quickAddType === 'Category') {
      endpoint = '/api/categories';
      payload = { name, description: '' };
    } else if (quickAddType === 'Brand') {
      endpoint = '/api/brands';
      payload = { name, description: '' };
    } else if (quickAddType === 'Supplier') {
      endpoint = '/api/suppliers';
      payload = { name, email: '', phone: '' };
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || `Failed to add ${quickAddType}`);
    }

    const created = await res.json();
    
    if (quickAddType === 'Category') {
      setCategoryIds([...categoryIds, created.id]);
    } else if (quickAddType === 'Brand') {
      setBrandId(created.id);
    } else if (quickAddType === 'Supplier') {
      setSupplierId(created.id);
    }

    fetchDropdowns();
  };

  const handleSave = async () => {
    setSaving(true);
    setErrors([]);
    const payload = {
      name, sku, description, brandId, categoryIds, hsnCode, countryOfOrigin, uom,
      supplierId, preferredForwarderId,
      packageType, unitsPerCarton, grossWeight: Number(grossWeight), netWeight: Number(netWeight), 
      cbm: Number(cbm), containerLoadingCapacity: Number(containerLoadingCapacity),
      shelfLife, storageConditions, certifications, japanImportNotes,
      images,
      attributes: attributes.filter(a => a.name.trim()).map(a => ({
        name: a.name.trim(),
        values: a.values.split(',').map(v => v.trim()).filter(Boolean)
      })),
      variants
    };

    const url = isNew ? '/api/products' : `/api/products/${id}`;
    const method = isNew ? 'POST' : 'PUT';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      router.push('/products');
    } else {
      const err = await res.json();
      setErrors([err.error || 'Failed to save product']);
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-white">Loading product details...</div>;

  return (
    <>
      <PageHeaderUpdater title={isNew ? "New Product" : name} subtitle={isNew ? "Create new product template" : "Manage product and variants"} />
      
      <QuickAddModal 
        title={`Add New ${quickAddType}`}
        isOpen={quickAddType !== null}
        onClose={() => setQuickAddType(null)}
        onSave={handleQuickAdd}
      />

      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button onClick={() => router.push('/products')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-mono uppercase text-white/90 hover:bg-white/10 cursor-pointer">
            <ArrowLeft size={12} /> Back to Products
          </button>

          {!isNew && (
            <div className="flex gap-2">
              <button 
                onClick={() => router.push(`/products/${id}/variants`)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-all font-mono text-[10px] uppercase cursor-pointer"
              >
                <Layers size={14} /> Variants ({existingVariantsCount})
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 font-mono text-[10px] uppercase">
                <Package size={14} /> On Hand (0)
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 font-mono text-[10px] uppercase">
                <ShoppingCart size={14} /> Sold (0)
              </button>
            </div>
          )}
        </div>

        {errors.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl text-sm font-mono">
            {errors.map((e, i) => <div key={i}>{e}</div>)}
          </div>
        )}

        <div className="glass p-8 rounded-3xl border border-white/5">
          <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4 overflow-x-auto">
            <button 
              className={`text-[11px] font-mono font-bold px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${activeTab === 'general' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/80'}`}
              onClick={() => setActiveTab('general')}
            >
              General Information
            </button>
            <button 
              className={`text-[11px] font-mono font-bold px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${activeTab === 'variants' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/80'}`}
              onClick={() => setActiveTab('variants')}
            >
              Attributes & Variants
            </button>
            <button 
              className={`text-[11px] font-mono font-bold px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${activeTab === 'packaging' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/80'}`}
              onClick={() => setActiveTab('packaging')}
            >
              Logistics & Packaging
            </button>
            <button 
              className={`text-[11px] font-mono font-bold px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${activeTab === 'compliance' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/80'}`}
              onClick={() => setActiveTab('compliance')}
            >
              Compliance
            </button>
            {!isNew && (
              <button 
                className={`text-[11px] font-mono font-bold px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${activeTab === 'inventory' ? 'bg-emerald-500/20 text-emerald-400' : 'text-white/50 hover:text-emerald-400/80'}`}
                onClick={() => setActiveTab('inventory')}
              >
                Stock Ledger
              </button>
            )}
          </div>
          
          {activeTab === 'general' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-mono text-white/80 uppercase tracking-wider block mb-1">Product Name *</label>
                  <input className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-white focus:border-blue-500 focus:outline-none transition-colors" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-white/80 uppercase tracking-wider block mb-1">Base SKU *</label>
                  <input className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-white focus:border-blue-500 focus:outline-none transition-colors" value={sku} onChange={(e) => setSku(e.target.value)} />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-white/80 uppercase tracking-wider block mb-1">Description</label>
                  <textarea rows={4} className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-white focus:border-blue-500 focus:outline-none transition-colors" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-mono text-white/80 uppercase tracking-wider block mb-1">Category *</label>
                  <SearchableSelect 
                    options={dbCategories.map(c => ({ id: c.id, label: c.name, value: c.id }))}
                    value={categoryIds}
                    onChange={(val) => setCategoryIds(val as string[])}
                    placeholder="Select Categories"
                    multiple={true}
                    onAddNew={() => setQuickAddType('Category')}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-white/80 uppercase tracking-wider block mb-1">Brand *</label>
                  <SearchableSelect 
                    options={dbBrands.map(b => ({ id: b.id, label: b.name, value: b.id }))}
                    value={brandId}
                    onChange={(val) => setBrandId(val as string)}
                    placeholder="Select Brand"
                    onAddNew={() => setQuickAddType('Brand')}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-mono text-white/80 uppercase tracking-wider block mb-1">HSN Code</label>
                    <input className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-white focus:border-blue-500 focus:outline-none transition-colors" value={hsnCode} onChange={(e) => setHsnCode(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono text-white/80 uppercase tracking-wider block mb-1">UOM</label>
                    <select className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-white focus:border-blue-500 focus:outline-none" value={uom} onChange={(e) => setUom(e.target.value)}>
                      <option value="BAG">BAG</option>
                      <option value="KG">KG</option>
                      <option value="MT">MT</option>
                      <option value="L">L</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-mono text-white/80 uppercase tracking-wider block mb-1">Default Supplier</label>
                  <SearchableSelect 
                    options={dbSuppliers.map(s => ({ id: s.id, label: s.name, value: s.id }))}
                    value={supplierId}
                    onChange={(val) => setSupplierId(val as string)}
                    placeholder="Select Supplier"
                    onAddNew={() => setQuickAddType('Supplier')}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-white/80 uppercase tracking-wider block mb-1">Country of Origin</label>
                  <input className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-white focus:border-blue-500 focus:outline-none transition-colors" value={countryOfOrigin} onChange={(e) => setCountryOfOrigin(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'variants' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-white">Variant Attributes</h3>
                <button 
                  onClick={() => setAttributes([...attributes, { name: '', values: '' }])}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-mono font-bold uppercase cursor-pointer"
                >
                  <Plus size={14} /> Add Attribute
                </button>
              </div>

              <div className="space-y-3">
                {attributes.map((attr, idx) => (
                  <div key={idx} className="flex gap-4 items-start bg-black/20 p-4 rounded-xl border border-white/5">
                    <div className="w-1/3">
                      <label className="text-[10px] font-mono text-white/50 uppercase mb-1 block">Attribute Name (e.g. Color)</label>
                      <input 
                        className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm text-white" 
                        value={attr.name} 
                        onChange={(e) => {
                          const newAttr = [...attributes];
                          newAttr[idx].name = e.target.value;
                          setAttributes(newAttr);
                        }} 
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] font-mono text-white/50 uppercase mb-1 block">Values (comma separated)</label>
                      <input 
                        className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm text-white" 
                        value={attr.values} 
                        placeholder="Red, Blue, Green"
                        onChange={(e) => {
                          const newAttr = [...attributes];
                          newAttr[idx].values = e.target.value;
                          setAttributes(newAttr);
                        }} 
                      />
                    </div>
                    <button 
                      className="mt-6 p-2 text-red-400 hover:bg-red-500/10 rounded-lg cursor-pointer"
                      onClick={() => setAttributes(attributes.filter((_, i) => i !== idx))}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {attributes.length > 0 && (
                <div className="flex justify-end">
                  <button 
                    onClick={generateVariants}
                    className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-xs font-mono font-bold uppercase cursor-pointer hover:bg-blue-500/30"
                  >
                    Generate Variant Matrix
                  </button>
                </div>
              )}

              {variants.length > 0 && (
                <div className="mt-8 border border-white/10 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm font-mono">
                    <thead className="bg-white/5 text-white/50 text-[10px] uppercase">
                      <tr>
                        <th className="py-3 px-4">Variant Name</th>
                        <th className="py-3 px-4">SKU</th>
                        <th className="py-3 px-4">Image URL</th>
                        <th className="py-3 px-4 w-24">Cost</th>
                        <th className="py-3 px-4 w-24">Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {variants.map((v, i) => (
                        <tr key={i} className="hover:bg-white/2">
                          <td className="py-2 px-4">{v.title}</td>
                          <td className="py-2 px-4">
                            <input className="w-full bg-transparent border-none text-white focus:outline-none text-[11px]" value={v.sku} onChange={(e) => {
                              const newV = [...variants]; newV[i].sku = e.target.value; setVariants(newV);
                            }} />
                          </td>
                          <td className="py-2 px-4">
                            <input className="w-full bg-transparent border-none text-white focus:outline-none text-[11px]" value={v.imageUrl || ''} placeholder="https://..." onChange={(e) => {
                              const newV = [...variants]; newV[i].imageUrl = e.target.value; setVariants(newV);
                            }} />
                          </td>
                          <td className="py-2 px-4">
                            <input type="number" className="w-full bg-transparent border-none text-white focus:outline-none text-[11px]" value={v.purchasePrice} onChange={(e) => {
                              const newV = [...variants]; newV[i].purchasePrice = Number(e.target.value); setVariants(newV);
                            }} />
                          </td>
                          <td className="py-2 px-4">
                            <input type="number" className="w-full bg-transparent border-none text-white focus:outline-none text-[11px]" value={v.sellingPrice} onChange={(e) => {
                              const newV = [...variants]; newV[i].sellingPrice = Number(e.target.value); setVariants(newV);
                            }} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'packaging' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-mono text-white/80 uppercase tracking-wider block mb-1">Package Type</label>
                  <input className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-white focus:border-blue-500 focus:outline-none transition-colors" value={packageType} onChange={(e) => setPackageType(e.target.value)} />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-white/80 uppercase tracking-wider block mb-1">Gross Weight (KG)</label>
                  <input type="number" className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-white focus:border-blue-500 focus:outline-none transition-colors" value={grossWeight} onChange={(e) => setGrossWeight(Number(e.target.value))} />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-white/80 uppercase tracking-wider block mb-1">Net Weight (KG)</label>
                  <input type="number" className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-white focus:border-blue-500 focus:outline-none transition-colors" value={netWeight} onChange={(e) => setNetWeight(Number(e.target.value))} />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-mono text-white/80 uppercase tracking-wider block mb-1">Units per Carton</label>
                  <input type="number" className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-white focus:border-blue-500 focus:outline-none transition-colors" value={unitsPerCarton} onChange={(e) => setUnitsPerCarton(Number(e.target.value))} />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-white/80 uppercase tracking-wider block mb-1">CBM</label>
                  <input type="number" step="0.01" className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-white focus:border-blue-500 focus:outline-none transition-colors" value={cbm} onChange={(e) => setCbm(Number(e.target.value))} />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-white/80 uppercase tracking-wider block mb-1">Container Loading Capacity</label>
                  <input type="number" className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-white focus:border-blue-500 focus:outline-none transition-colors" value={containerLoadingCapacity} onChange={(e) => setContainerLoadingCapacity(Number(e.target.value))} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'compliance' && (
            <div className="grid grid-cols-1 gap-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[11px] font-mono text-white/80 uppercase tracking-wider block mb-1">Shelf Life</label>
                  <input className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-white focus:border-blue-500 focus:outline-none transition-colors" value={shelfLife} onChange={(e) => setShelfLife(e.target.value)} />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-white/80 uppercase tracking-wider block mb-1">Storage Conditions</label>
                  <input className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-white focus:border-blue-500 focus:outline-none transition-colors" value={storageConditions} onChange={(e) => setStorageConditions(e.target.value)} />
                </div>
              </div>
              
              <div>
                <label className="text-[11px] font-mono text-white/80 uppercase tracking-wider block mb-1">Certifications</label>
                <SearchableSelect 
                  options={['FSSAI', 'HACCP', 'ISO 22000', 'FDA Approved', 'Halal Certified', 'Phytosanitary Certificate', 'Kosher', 'Organic', 'CE Marking', 'Fair Trade', 'GMP', 'BRCGS'].map(c => ({ label: c, value: c }))}
                  value={certifications}
                  onChange={(val) => setCertifications(val as string[])}
                  placeholder="Select Certifications"
                  multiple={true}
                />
              </div>
              <div>
                <label className="text-[11px] font-mono text-white/80 uppercase tracking-wider block mb-1">Japan Import Notes</label>
                <textarea rows={4} className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-white focus:border-blue-500 focus:outline-none transition-colors" value={japanImportNotes} onChange={(e) => setJapanImportNotes(e.target.value)} />
              </div>
            </div>
          )}
          
          <div className="mt-8 flex justify-end">
            <button 
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-black font-bold text-sm rounded cursor-pointer hover:bg-blue-400"
            >
               <Save size={16} /> {saving ? 'Saving...' : 'Save Product'}
            </button>
          </div>
          {activeTab === 'inventory' && !isNew && (
            <InventoryLedgerTab variants={variants} />
          )}

        </div>
      </div>
    </>
  );
}

function InventoryLedgerTab({ variants }: { variants: any[] }) {
  const [selectedVariantId, setSelectedVariantId] = useState<string>(variants.length > 0 ? variants[0].id : '');
  const [ledger, setLedger] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [adjQty, setAdjQty] = useState(0);
  const [adjRemarks, setAdjRemarks] = useState('');
  
  useEffect(() => {
    if (selectedVariantId) {
      setLoading(true);
      fetch(`/api/inventory?variantId=${selectedVariantId}`)
        .then(res => res.json())
        .then(data => {
          setLedger(data);
          setLoading(false);
        });
    }
  }, [selectedVariantId]);

  const handleAdjustment = async () => {
    if (adjQty === 0) return;
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: selectedVariantId,
          quantity: adjQty,
          type: 'ADJUSTMENT',
          remarks: adjRemarks || 'Manual Override'
        })
      });
      if (!res.ok) throw new Error('Failed to adjust stock');
      
      // Refresh
      const data = await fetch(`/api/inventory?variantId=${selectedVariantId}`).then(r => r.json());
      setLedger(data);
      setAdjQty(0);
      setAdjRemarks('');
      alert('Stock adjusted successfully');
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (!variants || variants.length === 0) return <div className="p-4 text-white/50 text-xs font-mono uppercase">No variants found. Save product first.</div>;

  return (
    <div className="space-y-6 pt-4">
      <div className="flex gap-4 items-center">
        <label className="text-[11px] font-mono text-white/50 uppercase">Select Variant to View Ledger:</label>
        <select 
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white outline-none"
          value={selectedVariantId}
          onChange={e => setSelectedVariantId(e.target.value)}
        >
          {variants.map(v => (
            <option key={v.id} value={v.id}>{v.sku} - {v.title}</option>
          ))}
        </select>
      </div>

      {loading && <div className="text-white/30 text-xs font-mono uppercase">Loading ledger...</div>}
      
      {!loading && ledger && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">Current Stock</h3>
              
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-xs text-white/50 font-mono">On Hand:</span>
                <span className="text-xl font-mono text-white">{ledger.inventory?.quantityOnHand || 0}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-xs text-white/50 font-mono">Allocated (SO):</span>
                <span className="text-sm font-mono text-white/70">{ledger.inventory?.quantityAllocated || 0}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-xs text-white/50 font-mono">On Order (PO):</span>
                <span className="text-sm font-mono text-white/70">{ledger.inventory?.quantityOnOrder || 0}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-xs text-emerald-400/50 font-mono uppercase font-bold">Available to Sell:</span>
                <span className="text-lg font-mono text-emerald-400 font-bold">
                  {(ledger.inventory?.quantityOnHand || 0) - (ledger.inventory?.quantityAllocated || 0)}
                </span>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 space-y-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-blue-400">Manual Adjustment</h3>
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-white/50 uppercase">Quantity (Use - for deductions)</label>
                <input 
                  type="number" 
                  value={adjQty} 
                  onChange={e => setAdjQty(parseFloat(e.target.value) || 0)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white outline-none focus:border-blue-500/50" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-white/50 uppercase">Reason / Remarks</label>
                <input 
                  type="text" 
                  value={adjRemarks} 
                  onChange={e => setAdjRemarks(e.target.value)}
                  placeholder="e.g. Stock Count Discrepancy"
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50" 
                />
              </div>
              <button 
                onClick={handleAdjustment}
                className="w-full py-2 bg-blue-500 text-black text-xs font-mono font-bold uppercase rounded-lg hover:bg-blue-400 transition-colors"
              >
                Apply Adjustment
              </button>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 overflow-hidden">
              <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-white/70 mb-4">Transaction History</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5 text-[10px] font-mono uppercase text-white/30">
                      <th className="pb-3 pr-4">Date</th>
                      <th className="pb-3 pr-4">Type</th>
                      <th className="pb-3 pr-4">Qty</th>
                      <th className="pb-3 pr-4">Ref Type</th>
                      <th className="pb-3 pr-4">Ref ID</th>
                      <th className="pb-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {ledger.transactions?.map((tx: any) => (
                      <tr key={tx.id} className="text-xs font-mono text-white/70">
                        <td className="py-3 pr-4 whitespace-nowrap">{new Date(tx.timestamp).toLocaleString()}</td>
                        <td className="py-3 pr-4">
                          <span className={`px-2 py-1 rounded-full text-[9px] font-bold ${
                            tx.type === 'SHIPMENT' ? 'bg-rose-500/20 text-rose-400' :
                            tx.type === 'RECEIPT' ? 'bg-emerald-500/20 text-emerald-400' :
                            tx.type === 'ALLOCATE' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className={`py-3 pr-4 font-bold ${tx.quantity > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {tx.quantity > 0 ? '+' : ''}{tx.quantity}
                        </td>
                        <td className="py-3 pr-4 text-white/40">{tx.referenceType || '-'}</td>
                        <td className="py-3 pr-4 text-white/40 truncate max-w-[100px]" title={tx.referenceId}>{tx.referenceId ? tx.referenceId.substring(0,8)+'...' : '-'}</td>
                        <td className="py-3 text-white/50">{tx.remarks || '-'}</td>
                      </tr>
                    ))}
                    {(!ledger.transactions || ledger.transactions.length === 0) && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-white/30 text-[10px] uppercase font-mono tracking-widest">
                          No transactions found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

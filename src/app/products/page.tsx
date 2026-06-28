'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Archive, 
  Copy, 
  RefreshCcw, 
  FileDown, 
  X, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  MoreVertical, 
  Calendar, 
  DollarSign, 
  Package, 
  Warehouse, 
  History, 
  TrendingUp, 
  FileText, 
  Tag, 
  Layers, 
  Globe, 
  ShieldAlert, 
  Edit3, 
  Clock, 
  ArrowLeftRight, 
  Compass,
  AlertCircle,
  Download,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MasterPage } from '@/components/layout/master-page';
import { Product, Supplier, Forwarder, Quotation, SalesOrder, PurchaseOrder, Shipment } from '@/types';
import { formatCurrency, cn, formatDate } from '@/lib/utils';
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
import { useProducts, FilterState, ProductSortField, SortOrder } from '@/hooks/useProducts';
import { Pagination } from '@/components/ui/pagination';

export default function ProductMasterPage() {
  const hook = useProducts();
  const {
    products,
    loading,
    currentPage,
    setCurrentPage,
    totalPages,
    searchQuery,
    setSearchQuery,
    searchField,
    setSearchField,
    filters,
    setFilters,
    filterOptions,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    selectedIds,
    toggleSelect,
    selectAll,
    createProduct,
    updateProduct,
    archiveProduct,
    restoreProduct,
    duplicateProduct,
    softDeleteProduct,
    bulkArchive,
    bulkDelete,
    bulkRestore,
    bulkStatusUpdate,
    bulkExportCSV
  } = hook;

  // UI States
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showFormDrawer, setShowFormDrawer] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [formTab, setFormTab] = useState<'general' | 'commercial' | 'packaging' | 'compliance' | 'relationships'>('general');
  const [detailTab, setDetailTab] = useState<'relationships' | 'history' | 'yield' | 'timeline'>('relationships');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Dynamic Options
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [forwarders, setForwarders] = useState<Forwarder[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [dbBrands, setDbBrands] = useState<any[]>([]);

  // Search input ref
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Form Field State
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Rice');
  const [brand, setBrand] = useState('ExLogis Select');
  const [countryOfOrigin, setCountryOfOrigin] = useState('India');
  const [hsnCode, setHsnCode] = useState('');
  const [uom, setUom] = useState('BAG');
  
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [currency, setCurrency] = useState('USD');
  const [moq, setMoq] = useState(500);
  const [leadTime, setLeadTime] = useState(15);

  const [packageType, setPackageType] = useState('PP Woven Bag');
  const [unitsPerCarton, setUnitsPerCarton] = useState(1);
  const [grossWeight, setGrossWeight] = useState(25.2);
  const [netWeight, setNetWeight] = useState(25.0);
  const [cbm, setCbm] = useState(0.04);
  const [containerLoadingCapacity, setContainerLoadingCapacity] = useState(800);

  const [shelfLife, setShelfLife] = useState('24 Months');
  const [storageConditions, setStorageConditions] = useState('Dry, Cool Ventilated Store');
  const [certifications, setCertifications] = useState<string[]>(['FSSAI', 'HACCP']);
  const [japanImportNotes, setJapanImportNotes] = useState('');

  const [supplierId, setSupplierId] = useState('');
  const [preferredForwarderId, setPreferredForwarderId] = useState('');
  const [defaultPackagingType, setDefaultPackagingType] = useState('25KG PP Woven Bag');

  // Load supporting metrics
  useEffect(() => {
    const loadSupportData = async () => {
      try {
        const [suppData, fwdData, quoteData, soData, poData, shpData, catData, brandData] = await Promise.all([
          fetch('/api/suppliers').then(r => r.json()),
          fetch('/api/forwarders').then(r => r?.json().catch(() => []) || []),
          fetch('/api/quotations').then(r => r.json()),
          fetch('/api/sales-orders').then(r => r.json()),
          fetch('/api/purchase-orders').then(r => r.json()),
          fetch('/api/shipments').then(r => r.json()),
          fetch('/api/categories').then(r => r.json()),
          fetch('/api/brands').then(r => r.json())
        ]);
        setSuppliers(suppData);
        setForwarders(fwdData);
        setQuotations(quoteData);
        setSalesOrders(soData);
        setPurchaseOrders(poData);
        setShipments(shpData);
        setDbCategories(catData || []);
        setDbBrands(brandData || []);
      } catch (err) {
        console.error('Failed loading related matrices data');
      }
    };
    loadSupportData();
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + N -> New Product
      if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        openCreateForm();
      }
      // Esc -> Close Drawer
      if (e.key === 'Escape') {
        setShowFormDrawer(false);
        setSelectedProduct(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync active selection updates
  const activeProduct = useMemo(() => {
    if (!selectedProduct) return null;
    return products.find(p => p.id === selectedProduct.id) || selectedProduct;
  }, [products, selectedProduct]);

  // Compute Active Product Relations
  const productRelations = useMemo(() => {
    if (!activeProduct) return null;
    const prodId = activeProduct.id;

    const supplier = suppliers.find(s => s.id === activeProduct.supplierId);
    
    // Quotes containing product
    const relatedQuotes = quotations.filter(q => 
      q.items?.some(item => item.productId === prodId)
    );

    // Sales Orders containing product
    const relatedSalesOrders = salesOrders.filter(so => 
      so.items?.some(item => item.productId === prodId)
    );

    // Purchase Orders containing product
    const relatedPurchaseOrders = purchaseOrders.filter(po => 
      po.items?.some(item => item.productId === prodId)
    );

    // Shipments containing product
    const relatedShipments = shipments.filter(shp => {
      const so = salesOrders.find(s => s.id === shp.orderId);
      return so?.items?.some(item => item.productId === prodId);
    });

    return { supplier, relatedQuotes, relatedSalesOrders, relatedPurchaseOrders, relatedShipments };
  }, [activeProduct, suppliers, quotations, salesOrders, purchaseOrders, shipments]);

  const openCreateForm = () => {
    setFormMode('create');
    setFormErrors([]);
    setFormTab('general');
    
    // Defaults
    setSku('');
    setName('');
    setDescription('');
    setCategory('Rice');
    setBrand('ExLogis Select');
    setCountryOfOrigin('India');
    setHsnCode('');
    setUom('BAG');
    setPurchasePrice(0);
    setSellingPrice(0);
    setCurrency('USD');
    setMoq(500);
    setLeadTime(15);
    setPackageType('PP Woven Bag');
    setUnitsPerCarton(1);
    setGrossWeight(25.2);
    setNetWeight(25.0);
    setCbm(0.04);
    setContainerLoadingCapacity(800);
    setShelfLife('24 Months');
    setStorageConditions('Dry, Cool Ventilated Store');
    setCertifications(['FSSAI', 'HACCP']);
    setJapanImportNotes('');
    setSupplierId(suppliers[0]?.id || '');
    setPreferredForwarderId(forwarders[0]?.id || '');
    setDefaultPackagingType('25KG PP Woven Bag');

    setShowFormDrawer(true);
  };

  const openEditForm = (p: Product) => {
    setFormMode('edit');
    setFormErrors([]);
    setFormTab('general');

    setSku(p.sku);
    setName(p.name);
    setDescription(p.description || '');
    setCategory(p.category);
    setBrand(p.brand);
    setCountryOfOrigin(p.countryOfOrigin);
    setHsnCode(p.hsnCode);
    setUom(p.uom);
    setPurchasePrice(p.purchasePrice);
    setSellingPrice(p.sellingPrice);
    setCurrency(p.currency);
    setMoq(p.moq);
    setLeadTime(p.leadTime);
    setPackageType(p.packageType);
    setUnitsPerCarton(p.unitsPerCarton);
    setGrossWeight(p.grossWeight);
    setNetWeight(p.netWeight);
    setCbm(p.cbm);
    setContainerLoadingCapacity(p.containerLoadingCapacity);
    setShelfLife(p.shelfLife);
    setStorageConditions(p.storageConditions);
    setCertifications(p.certifications || []);
    setJapanImportNotes(p.japanImportNotes || '');
    setSupplierId(p.supplierId);
    setPreferredForwarderId(p.preferredForwarderId || '');
    setDefaultPackagingType(p.defaultPackagingType || '');

    setShowFormDrawer(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);

    const payload: Partial<Product> = {
      sku,
      name,
      description,
      category,
      brand,
      countryOfOrigin,
      hsnCode,
      uom,
      purchasePrice: Number(purchasePrice),
      sellingPrice: Number(sellingPrice),
      currency,
      moq: Number(moq),
      leadTime: Number(leadTime),
      packageType,
      unitsPerCarton: Number(unitsPerCarton),
      grossWeight: Number(grossWeight),
      netWeight: Number(netWeight),
      cbm: Number(cbm),
      containerLoadingCapacity: Number(containerLoadingCapacity),
      shelfLife,
      storageConditions,
      certifications,
      japanImportNotes,
      supplierId,
      preferredForwarderId,
      defaultPackagingType
    };

    if (formMode === 'create') {
      const result = await createProduct(payload);
      if (result.success) {
        setShowFormDrawer(false);
      } else if (result.error) {
        setFormErrors(result.error.split(' | '));
      }
    } else if (formMode === 'edit' && activeProduct) {
      const result = await updateProduct(activeProduct.id, payload);
      if (result.success) {
        setShowFormDrawer(false);
      } else if (result.error) {
        setFormErrors(result.error.split(' | '));
      }
    }
  };

  const handleDuplicate = async (p: Product) => {
    const copy = await duplicateProduct(p.id);
    if (copy) {
      setSelectedProduct(copy);
    }
  };

  const handleToggleCert = (cert: string) => {
    setCertifications(prev => 
      prev.includes(cert) ? prev.filter(c => c !== cert) : [...prev, cert]
    );
  };

  return (
    <MasterPage 
      title="Product Master" 
      subtitle="Central Commodity Lifecycle & Relationships Control"
      loading={loading}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Product Table List */}
        <div className={cn(
          "transition-all duration-500 space-y-6",
          activeProduct ? "lg:col-span-6" : "lg:col-span-12"
        )}>
          {/* Main Controls Panel */}
          <div className="glass p-6 rounded-3xl border border-white/5 space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              {/* Search Bar with Field Filters */}
              <div className="relative w-full max-w-lg flex items-center bg-white/5 border border-white/10 rounded-2xl overflow-hidden focus-within:border-blue-500/50 transition-all">
                <select 
                  value={searchField} 
                  onChange={(e) => setSearchField(e.target.value as any)}
                  className="bg-transparent text-white/70 text-xs font-mono uppercase pl-4 focus:outline-none border-r border-white/10 pr-2 h-12"
                >
                  <option value="all" className="bg-[#0b0b0b]">All Fields</option>
                  <option value="sku" className="bg-[#0b0b0b]">SKU</option>
                  <option value="hsn" className="bg-[#0b0b0b]">HSN Code</option>
                  <option value="brand" className="bg-[#0b0b0b]">Brand</option>
                  <option value="category" className="bg-[#0b0b0b]">Category</option>
                </select>
                <Search className="absolute left-28 text-white/70" size={16} />
                <input 
                  type="text" 
                  placeholder="Identify Commodity..." 
                  className="w-full bg-transparent py-3 pl-12 pr-4 text-sm focus:outline-none text-white font-mono"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  ref={searchInputRef}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="p-2 text-white/70 hover:text-white/90">
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Toolbar Buttons */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                <button 
                  onClick={() => setShowFilterDrawer(!showFilterDrawer)}
                  className={cn(
                    "flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 border rounded-2xl text-xs font-mono uppercase tracking-widest transition-all",
                    Object.values(filters).some(arr => arr.length > 0)
                      ? "bg-blue-500/10 border-blue-500 text-blue-400"
                      : "bg-white/5 border-white/10 text-white/90 hover:bg-white/10"
                  )}
                >
                  <Filter size={14} /> Filters
                </button>
                
                <button 
                  onClick={openCreateForm}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-black rounded-2xl text-xs font-mono font-bold uppercase tracking-widest hover:bg-blue-400 transition-all border-none cursor-pointer"
                >
                  <Plus size={14} /> New Product
                </button>
              </div>
            </div>

            {/* Expanded Active Filters Panel */}
            <AnimatePresence>
              {showFilterDrawer && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-t border-white/5 pt-4"
                >
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-xs font-mono">
                    {/* Category Filter */}
                    <div className="space-y-2">
                      <p className="text-white/70 uppercase tracking-wider">Category</p>
                      <div className="flex flex-wrap gap-1.5">
                        {filterOptions.categories.map(c => (
                          <button
                            key={c}
                            onClick={() => setFilters(prev => ({
                              ...prev,
                              categories: prev.categories.includes(c) ? prev.categories.filter(x => x !== c) : [...prev.categories, c]
                            }))}
                            className={cn(
                              "px-2.5 py-1 rounded bg-[#101010] border text-[11px]",
                              filters.categories.includes(c) ? "border-blue-500 text-blue-400 bg-blue-500/5" : "border-white/5 text-white/70"
                            )}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Brand Filter */}
                    <div className="space-y-2">
                      <p className="text-white/70 uppercase tracking-wider">Brand</p>
                      <div className="flex flex-wrap gap-1.5">
                        {filterOptions.brands.map(b => (
                          <button
                            key={b}
                            onClick={() => setFilters(prev => ({
                              ...prev,
                              brands: prev.brands.includes(b) ? prev.brands.filter(x => x !== b) : [...prev.brands, b]
                            }))}
                            className={cn(
                              "px-2.5 py-1 rounded bg-[#101010] border text-[11px]",
                              filters.brands.includes(b) ? "border-blue-500 text-blue-400 bg-blue-500/5" : "border-white/5 text-white/70"
                            )}
                          >
                            {b}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Status Filter */}
                    <div className="space-y-2">
                      <p className="text-white/70 uppercase tracking-wider">Status</p>
                      <div className="flex flex-wrap gap-1.5">
                        {['ACTIVE', 'INACTIVE', 'ARCHIVED'].map(s => (
                          <button
                            key={s}
                            onClick={() => setFilters(prev => ({
                              ...prev,
                              statuses: prev.statuses.includes(s) ? prev.statuses.filter(x => x !== s) : [...prev.statuses, s]
                            }))}
                            className={cn(
                              "px-2.5 py-1 rounded bg-[#101010] border text-[11px]",
                              filters.statuses.includes(s) ? "border-blue-500 text-blue-400 bg-blue-500/5" : "border-white/5 text-white/70"
                            )}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6 border-t border-white/5 pt-4">
                    <button 
                      onClick={() => setFilters({ categories: [], brands: [], statuses: [], countries: [], suppliers: [], hsnCodes: [] })}
                      className="px-4 py-2 rounded bg-white/5 text-[11px] font-mono text-white/70 hover:bg-white/10"
                    >
                      Clear Matrix Filters
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bulk Action Header Toolbar */}
          <AnimatePresence>
            {selectedIds.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-wrap items-center justify-between p-4 bg-blue-500 text-black rounded-2xl gap-3"
              >
                <div className="flex items-center gap-3 text-sm font-mono font-bold">
                  <Package size={16} />
                  <span>{selectedIds.length} Nodes Selected</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button 
                    onClick={() => bulkArchive(selectedIds)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-black/10 hover:bg-black/20 rounded-lg text-[11px] font-mono font-bold uppercase tracking-wider border-none cursor-pointer text-black"
                  >
                    <Archive size={12} /> Archive
                  </button>
                  <button 
                    onClick={() => bulkRestore(selectedIds)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-black/10 hover:bg-black/20 rounded-lg text-[11px] font-mono font-bold uppercase tracking-wider border-none cursor-pointer text-black"
                  >
                    <RefreshCcw size={12} /> Restore
                  </button>
                  <button 
                    onClick={() => bulkDelete(selectedIds)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-black/10 hover:bg-black/20 rounded-lg text-[11px] font-mono font-bold uppercase tracking-wider border-none cursor-pointer text-black"
                  >
                    <Trash2 size={12} /> Soft-Delete
                  </button>
                  <button 
                    onClick={() => bulkExportCSV(selectedIds)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white hover:bg-black/90 rounded-lg text-[11px] font-mono font-bold uppercase tracking-wider border-none cursor-pointer"
                  >
                    <FileDown size={12} /> Export CSV
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Commodity Listing Grid */}
          <div className="glass rounded-3xl border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm font-mono">
                <thead className="bg-white/2 text-white/70 uppercase tracking-[0.2em] border-b border-white/5">
                  <tr>
                    <th className="py-5 px-6 w-8 text-center">
                      <input 
                        type="checkbox"
                        checked={products.length > 0 && selectedIds.length === products.length}
                        onChange={() => selectAll(products.map(p => p.id))}
                        className="rounded accent-blue-500 cursor-pointer"
                      />
                    </th>
                    <th className="py-5 px-6">
                      <button 
                        onClick={() => {
                          setSortBy('name');
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        }}
                        className="flex items-center gap-2 hover:text-white transition-colors bg-transparent border-none cursor-pointer text-white/70 text-sm font-mono uppercase"
                      >
                        Commodity Node {sortBy === 'name' && (sortOrder === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                      </button>
                    </th>
                    <th className="py-5 px-6">
                      <button 
                        onClick={() => {
                          setSortBy('sku');
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        }}
                        className="flex items-center gap-2 hover:text-white transition-colors bg-transparent border-none cursor-pointer text-white/70 text-sm font-mono uppercase"
                      >
                        SKU {sortBy === 'sku' && (sortOrder === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                      </button>
                    </th>
                    <th className="py-5 px-6">HSN / Category</th>
                    <th className="py-5 px-6 text-right">
                      <button 
                        onClick={() => {
                          setSortBy('price');
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        }}
                        className="flex items-center justify-end gap-2 hover:text-white transition-colors w-full bg-transparent border-none cursor-pointer text-white/70 text-sm font-mono uppercase"
                      >
                        Price {sortBy === 'price' && (sortOrder === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                      </button>
                    </th>
                    <th className="py-5 px-6 text-right">UOM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {products.map((p) => (
                    <tr 
                      key={p.id} 
                      className={cn(
                        "group cursor-pointer transition-all",
                        activeProduct?.id === p.id ? "bg-blue-500/10" : "hover:bg-white/2"
                      )}
                      onClick={() => setSelectedProduct(activeProduct?.id === p.id ? null : p)}
                    >
                      <td className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(p.id)}
                          onChange={() => toggleSelect(p.id)}
                          className="rounded accent-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 overflow-hidden relative">
                            <img src={p.images[0] || 'https://picsum.photos/seed/placeholder/80/80'} alt={p.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <div>
                            <p className="font-sans font-bold text-sm text-white/90 truncate max-w-[150px]">{p.name}</p>
                            <p className="text-[11px] text-white/70 uppercase tracking-tighter">{p.brand}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[11px] font-mono font-bold text-white/70 uppercase">
                          {p.sku}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="text-[11px] text-blue-400/80 font-bold">{p.category}</span>
                          <span className="text-[11px] text-white/70">HSN: {p.hsnCode}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right font-sans font-bold text-white/80">
                        {formatCurrency(p.sellingPrice)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex flex-col items-end">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[8px] font-mono font-bold uppercase">{p.entityStatus}</span>
                          <span className="text-[11px] text-white/70 mt-1 uppercase">{p.uom}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-white/70 font-mono text-sm uppercase tracking-widest">
                        No Commodities Found In Active Index
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>

        {/* Product Details Sidebar */}
        <AnimatePresence>
          {activeProduct && productRelations && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="lg:col-span-6 space-y-8"
            >
              {/* Profile Card Header */}
              <div className="glass p-8 rounded-4xl border border-white/5 relative overflow-hidden">
                {/* Control Panel Dropdown Actions */}
                <div className="absolute top-0 right-0 p-6 flex gap-2">
                  <button 
                    onClick={() => openEditForm(activeProduct)}
                    className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors border-none cursor-pointer"
                    title="Edit Product"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button 
                    onClick={() => handleDuplicate(activeProduct)}
                    className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors border-none cursor-pointer"
                    title="Duplicate Product"
                  >
                    <Copy size={14} />
                  </button>
                  {activeProduct.entityStatus === 'ACTIVE' ? (
                    <button 
                      onClick={() => archiveProduct(activeProduct.id)}
                      className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors border-none cursor-pointer"
                      title="Archive Product"
                    >
                      <Archive size={14} />
                    </button>
                  ) : (
                    <button 
                      onClick={() => restoreProduct(activeProduct.id)}
                      className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors border-none cursor-pointer"
                      title="Restore Product"
                    >
                      <RefreshCcw size={14} />
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      softDeleteProduct(activeProduct.id);
                      setSelectedProduct(null);
                    }}
                    className="p-2.5 rounded-full bg-white/5 hover:bg-rose-500/10 text-white/70 hover:text-rose-400 transition-colors border-none cursor-pointer"
                    title="Soft Delete Product"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button 
                    onClick={() => setSelectedProduct(null)}
                    className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors border-none cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 items-start mb-8">
                  <div className="w-32 h-32 rounded-2xl bg-white/5 border border-white/10 overflow-hidden relative shadow-2xl shrink-0">
                    <img src={activeProduct.images[0] || 'https://picsum.photos/seed/placeholder/200/200'} alt={activeProduct.name} className="w-full h-full object-cover opacity-80" />
                  </div>
                  <div className="flex-1 min-w-0 pr-12">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[8px] font-mono font-bold uppercase tracking-widest">
                        {activeProduct.category}
                      </span>
                      <span className={cn(
                        "px-2.5 py-0.5 rounded border text-[8px] font-mono font-bold uppercase tracking-widest",
                        activeProduct.entityStatus === 'ACTIVE' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                        activeProduct.entityStatus === 'ARCHIVED' && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                        activeProduct.entityStatus === 'INACTIVE' && "bg-white/5 text-white/70 border-white/10"
                      )}>
                        {activeProduct.entityStatus}
                      </span>
                    </div>
                    <h2 className="text-2xl font-display font-medium tracking-tight text-white mb-2 truncate">{activeProduct.name}</h2>
                    <p className="text-xs font-mono text-white/80 tracking-wider mb-2">HSN: {activeProduct.hsnCode} • BRAND: {activeProduct.brand} • ORIGIN: {activeProduct.countryOfOrigin}</p>
                    <p className="text-sm text-white/70 leading-relaxed font-sans line-clamp-2">{activeProduct.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-white/5 pt-6">
                  {[
                    { label: 'Purchase Cost', value: formatCurrency(activeProduct.purchasePrice), icon: DollarSign, color: 'text-emerald-400' },
                    { label: 'Selling Price', value: formatCurrency(activeProduct.sellingPrice), icon: DollarSign, color: 'text-blue-400' },
                    { label: 'UOM / MOQ', value: `${activeProduct.uom} / ${activeProduct.moq}`, icon: Package, color: 'text-amber-400' },
                    { label: 'Lead Time', value: `${activeProduct.leadTime} Days`, icon: Clock, color: 'text-violet-400' },
                  ].map((stat, i) => (
                    <div key={i} className="p-4 rounded-xl bg-white/2 border border-white/5">
                      <stat.icon size={12} className={cn("mb-2 opacity-40", stat.color)} />
                      <p className="text-[8px] font-mono text-white/70 uppercase tracking-widest mb-0.5">{stat.label}</p>
                      <p className="font-sans font-bold text-sm">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Related Information Matrix Tabs */}
              <div className="glass p-8 rounded-4xl border border-white/5">
                <div className="flex gap-6 border-b border-white/5 mb-6 overflow-x-auto custom-scrollbar whitespace-nowrap pb-2">
                  {[
                    { id: 'relationships', label: 'Compliance & Supply' },
                    { id: 'history', label: 'Transactions' },
                    { id: 'yield', label: 'Yield Analytics' },
                    { id: 'timeline', label: 'Activity Logs' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setDetailTab(tab.id as any)}
                      className={cn(
                        "pb-2 text-[11px] font-mono font-bold uppercase tracking-widest bg-transparent border-none cursor-pointer",
                        detailTab === tab.id 
                          ? "text-blue-500 border-b-2 border-blue-500" 
                          : "text-white/70 hover:text-white/70"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Relationships & Compliance Tab */}
                {detailTab === 'relationships' && (
                  <div className="space-y-6">
                    {/* Default Supplier Node */}
                    {productRelations.supplier ? (
                      <div className="p-5 rounded-2xl bg-white/2 border border-white/5 space-y-3">
                        <p className="text-[8px] font-mono text-white/70 uppercase tracking-wider">Default Supplier Partner</p>
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-sans font-bold text-sm text-white/90">{productRelations.supplier.name}</h4>
                            <p className="text-[11px] font-mono text-white/80">{productRelations.supplier.email}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-mono font-bold text-amber-400">★ {productRelations.supplier.performanceRating}</span>
                            <p className="text-[8px] font-mono text-white/70 mt-0.5">Rating Index</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-white/2 border border-white/5 text-center text-white/70 text-sm">
                        No default supplier mapped to this matrix node.
                      </div>
                    )}

                    {/* Packaging Specs */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-5 rounded-2xl bg-white/2 border border-white/5 space-y-2">
                        <p className="text-[8px] font-mono text-white/70 uppercase tracking-wider">Packaging Specs</p>
                        <div className="space-y-1 text-xs font-mono">
                          <div className="flex justify-between"><span className="text-white/70">Type:</span> <span>{activeProduct.packageType}</span></div>
                          <div className="flex justify-between"><span className="text-white/70">Carton Units:</span> <span>{activeProduct.unitsPerCarton}</span></div>
                          <div className="flex justify-between"><span className="text-white/70">CBM (Vol):</span> <span>{activeProduct.cbm} cbm</span></div>
                        </div>
                      </div>
                      
                      <div className="p-5 rounded-2xl bg-white/2 border border-white/5 space-y-2">
                        <p className="text-[8px] font-mono text-white/70 uppercase tracking-wider">Loading metrics</p>
                        <div className="space-y-1 text-xs font-mono">
                          <div className="flex justify-between"><span className="text-white/70">Gross Wt:</span> <span>{activeProduct.grossWeight} kg</span></div>
                          <div className="flex justify-between"><span className="text-white/70">Net Wt:</span> <span>{activeProduct.netWeight} kg</span></div>
                          <div className="flex justify-between"><span className="text-white/70">20GP Load:</span> <span>{activeProduct.containerLoadingCapacity} {activeProduct.uom}</span></div>
                        </div>
                      </div>
                    </div>

                    {/* Compliance Information */}
                    <div className="p-5 rounded-2xl bg-white/2 border border-white/5 space-y-4">
                      <p className="text-[8px] font-mono text-white/70 uppercase tracking-wider">Compliance Rules & Certifications</p>
                      <div className="space-y-2 text-xs font-mono">
                        <div className="flex justify-between"><span className="text-white/70">Shelf Life Index:</span> <span>{activeProduct.shelfLife}</span></div>
                        <div className="flex justify-between"><span className="text-white/70">Storage Parameters:</span> <span>{activeProduct.storageConditions}</span></div>
                        <div>
                          <span className="text-white/70 block mb-1.5">Compliance Certificates:</span>
                          <div className="flex flex-wrap gap-1">
                            {activeProduct.certifications.map(c => (
                              <span key={c} className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[8px]">{c}</span>
                            ))}
                          </div>
                        </div>
                        {activeProduct.japanImportNotes && (
                          <div className="border-t border-white/5 pt-3">
                            <span className="text-white/70 block mb-1">Japan Customs Quarantine Directive:</span>
                            <p className="text-[11px] text-white/70 leading-relaxed font-sans">{activeProduct.japanImportNotes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* History Transactions Tab */}
                {detailTab === 'history' && (
                  <div className="space-y-6 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
                    {/* Quotation history */}
                    <div>
                      <p className="text-[11px] font-mono text-white/70 uppercase tracking-wider mb-3">Linked Quotation history</p>
                      <div className="space-y-2">
                        {productRelations.relatedQuotes.map(q => (
                          <div key={q.id} className="flex justify-between items-center p-3 bg-white/2 border border-white/5 rounded-xl text-xs font-mono">
                            <div>
                              <p className="font-bold text-white/80">{q.quotationNo}</p>
                              <p className="text-[8px] text-white/70">{formatDate(q.date)}</p>
                            </div>
                            <div className="text-right">
                              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[8px]">{q.status}</span>
                              <p className="text-xs font-sans font-bold text-white/80 mt-1">{formatCurrency(q.totalValue)}</p>
                            </div>
                          </div>
                        ))}
                        {productRelations.relatedQuotes.length === 0 && (
                          <p className="text-center py-4 text-white/10 text-[11px] uppercase">No Quotation logs available</p>
                        )}
                      </div>
                    </div>

                    {/* Sales Order history */}
                    <div>
                      <p className="text-[11px] font-mono text-white/70 uppercase tracking-wider mb-3">Linked Sales Orders</p>
                      <div className="space-y-2">
                        {productRelations.relatedSalesOrders.map(so => (
                          <div key={so.id} className="flex justify-between items-center p-3 bg-white/2 border border-white/5 rounded-xl text-xs font-mono">
                            <div>
                              <p className="font-bold text-white/80">{so.orderNo}</p>
                              <p className="text-[8px] text-white/70">{formatDate(so.date)}</p>
                            </div>
                            <div className="text-right">
                              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[8px]">{so.status}</span>
                              <p className="text-xs font-sans font-bold text-white/80 mt-1">{formatCurrency(so.totalValue)}</p>
                            </div>
                          </div>
                        ))}
                        {productRelations.relatedSalesOrders.length === 0 && (
                          <p className="text-center py-4 text-white/10 text-[11px] uppercase">No Sales logs available</p>
                        )}
                      </div>
                    </div>

                    {/* Purchase Order history */}
                    <div>
                      <p className="text-[11px] font-mono text-white/70 uppercase tracking-wider mb-3">Linked Purchase Orders</p>
                      <div className="space-y-2">
                        {productRelations.relatedPurchaseOrders.map(po => (
                          <div key={po.id} className="flex justify-between items-center p-3 bg-white/2 border border-white/5 rounded-xl text-xs font-mono">
                            <div>
                              <p className="font-bold text-white/80">{po.poNo}</p>
                              <p className="text-[8px] text-white/70">{formatDate(po.date)}</p>
                            </div>
                            <div className="text-right">
                              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[8px]">{po.status}</span>
                              <p className="text-xs font-sans font-bold text-white/80 mt-1">{formatCurrency(po.totalValue)}</p>
                            </div>
                          </div>
                        ))}
                        {productRelations.relatedPurchaseOrders.length === 0 && (
                          <p className="text-center py-4 text-white/10 text-[11px] uppercase">No Purchase logs available</p>
                        )}
                      </div>
                    </div>

                    {/* Shipment history */}
                    <div>
                      <p className="text-[11px] font-mono text-white/70 uppercase tracking-wider mb-3">Linked Shipment logs</p>
                      <div className="space-y-2">
                        {productRelations.relatedShipments.map(shp => (
                          <div key={shp.id} className="flex justify-between items-center p-3 bg-white/2 border border-white/5 rounded-xl text-xs font-mono">
                            <div>
                              <p className="font-bold text-white/80">{shp.shipmentNo}</p>
                              <p className="text-[8px] text-white/70">DISPATCH: {formatDate(shp.etd)}</p>
                            </div>
                            <div className="text-right">
                              <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[8px]">{shp.status}</span>
                              <p className="text-xs font-mono text-white/70 mt-1">{shp.destinationPortId}</p>
                            </div>
                          </div>
                        ))}
                        {productRelations.relatedShipments.length === 0 && (
                          <p className="text-center py-4 text-white/10 text-[11px] uppercase">No Logistics logs available</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Yield / Margin Analytics Tab */}
                {detailTab === 'yield' && (
                  <div className="space-y-8">
                    {/* Cost Breakdown */}
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-4 rounded-xl bg-white/2 border border-white/5">
                        <p className="text-[8px] font-mono text-white/70 uppercase tracking-wider mb-1">Purchase Cost</p>
                        <p className="text-sm font-sans font-bold text-rose-400">{formatCurrency(activeProduct.purchasePrice)}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white/2 border border-white/5">
                        <p className="text-[8px] font-mono text-white/70 uppercase tracking-wider mb-1">Selling Value</p>
                        <p className="text-sm font-sans font-bold text-blue-400">{formatCurrency(activeProduct.sellingPrice)}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white/2 border border-white/5">
                        <p className="text-[8px] font-mono text-white/70 uppercase tracking-wider mb-1">Gross Yield</p>
                        <p className="text-sm font-sans font-bold text-emerald-400">
                          {activeProduct.sellingPrice > 0 
                            ? `${Math.round(((activeProduct.sellingPrice - activeProduct.purchasePrice) / activeProduct.sellingPrice) * 100)}%`
                            : '0%'}
                        </p>
                      </div>
                    </div>

                    {/* Historical Pricing Line Chart */}
                    <div className="space-y-3">
                      <p className="text-[11px] font-mono text-white/70 uppercase tracking-wider flex items-center gap-1.5">
                        <Activity size={10} /> Market Pricing Index
                      </p>
                      <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={activeProduct.pricingHistory || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1c1c1c" vertical={false} />
                            <XAxis dataKey="date" stroke="#444" fontSize={9} axisLine={false} tickLine={false} />
                            <YAxis stroke="#444" fontSize={9} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #222', color: '#fff', fontSize: '10px' }} />
                            <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}

                {/* Timeline Event Tab */}
                {detailTab === 'timeline' && (
                  <div className="max-h-[350px] overflow-y-auto custom-scrollbar pr-2 space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-white/5">
                    {(activeProduct.timeline || []).map((item, idx) => (
                      <div key={item.id || idx} className="relative pl-8">
                        <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-[#0a0a0a] border border-white/15 flex items-center justify-center z-10 text-blue-500">
                          {item.type === 'CREATED' && <Plus size={10} />}
                          {item.type === 'UPDATED' && <Edit3 size={10} />}
                          {item.type === 'ARCHIVED' && <Archive size={10} />}
                          {item.type === 'RESTORED' && <RefreshCcw size={10} />}
                          {item.type === 'PRICE_CHANGED' && <DollarSign size={10} />}
                          {item.type === 'SUPPLIER_CHANGED' && <ArrowLeftRight size={10} />}
                        </div>
                        <p className="text-[8px] font-mono text-white/70 uppercase mb-0.5">{formatDate(item.date)}</p>
                        <p className="text-sm font-bold text-white/90 mb-0.5">{item.title}</p>
                        <p className="text-xs text-white/70 leading-relaxed font-sans">{item.description}</p>
                      </div>
                    ))}
                    {(activeProduct.timeline || []).length === 0 && (
                      <p className="text-center py-8 text-white/10 text-[11px] uppercase font-mono pl-8">No Activity Log found</p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Slide overlay for Product registration / Modification (Form Drawer) */}
      <AnimatePresence>
        {showFormDrawer && (
          <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass border border-white/10 rounded-[2.5rem] p-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-6">
                <h3 className="text-2xl font-display font-medium flex items-center gap-3">
                  <Package className="text-blue-500" /> {formMode === 'create' ? 'Register New Commodity Node' : 'Modify Commodity Node'}
                </h3>
                <button onClick={() => setShowFormDrawer(false)} className="p-2 rounded bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-none cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              {/* Errors Panel */}
              {formErrors.length > 0 && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl mb-6 space-y-1">
                  <p className="text-sm font-mono font-bold text-rose-400 flex items-center gap-2">
                    <AlertCircle size={14} /> Validation Constraints Violated:
                  </p>
                  <ul className="list-disc list-inside text-xs font-mono text-rose-300">
                    {formErrors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Form Navigation Tabs */}
              <div className="flex gap-4 border-b border-white/5 mb-6 overflow-x-auto whitespace-nowrap pb-2 text-[11px] font-mono font-bold uppercase">
                {[
                  { id: 'general', label: '1. General Info' },
                  { id: 'commercial', label: '2. Commercials' },
                  { id: 'packaging', label: '3. Packaging Spec' },
                  { id: 'compliance', label: '4. Compliance' },
                  { id: 'relationships', label: '5. Supply Partners' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFormTab(tab.id as any)}
                    className={cn(
                      "pb-2 bg-transparent border-none cursor-pointer",
                      formTab === tab.id 
                        ? "text-blue-500 border-b-2 border-blue-500" 
                        : "text-white/70 hover:text-white/70"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-6">
                {/* 1. General Tab */}
                {formTab === 'general' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[11px] font-mono text-white/80 uppercase tracking-wider block">SKU Code (Unique)</label>
                        <input 
                          type="text" 
                          required
                          value={sku}
                          onChange={(e) => setSku(e.target.value)}
                          className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-white focus:outline-none focus:border-blue-500/50" 
                          placeholder="e.g. BMR-1121"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-mono text-white/80 uppercase tracking-wider block">Product Name</label>
                        <input 
                          type="text" 
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-white focus:outline-none focus:border-blue-500/50"
                          placeholder="e.g. Premium Basmati Rice"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-[11px] font-mono text-white/80 uppercase tracking-wider block">Category</label>
                        <select 
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-white focus:outline-none focus:border-blue-500/50"
                        >
                          {dbCategories.map(cat => (
                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-mono text-white/80 uppercase tracking-wider block">Brand</label>
                        <select 
                          required
                          value={brand}
                          onChange={(e) => setBrand(e.target.value)}
                          className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-white focus:outline-none"
                        >
                          <option value="">Select Brand</option>
                          {dbBrands.map(b => (
                            <option key={b.id} value={b.name}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-mono text-white/80 uppercase tracking-wider block">Country of Origin</label>
                        <select 
                          required
                          value={countryOfOrigin}
                          onChange={(e) => setCountryOfOrigin(e.target.value)}
                          className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-white focus:outline-none"
                        >
                          <option value="">Select Country</option>
                          {['India', 'China', 'USA', 'Vietnam', 'Brazil', 'Thailand', 'Indonesia', 'UAE', 'Singapore', 'Japan', 'Malaysia', 'Germany'].map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[11px] font-mono text-white/80 uppercase tracking-wider block">HS Code (6-10 digits)</label>
                        <input 
                          type="text" 
                          required
                          value={hsnCode}
                          onChange={(e) => setHsnCode(e.target.value)}
                          className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-white focus:outline-none"
                          placeholder="e.g. 10063020"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-mono text-white/80 uppercase tracking-wider block">Standard UOM</label>
                        <select 
                          value={uom}
                          onChange={(e) => setUom(e.target.value)}
                          className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-white focus:outline-none"
                        >
                          <option value="BAG">BAG (bags)</option>
                          <option value="CRT">CRT (cartons)</option>
                          <option value="PCS">PCS (pieces)</option>
                          <option value="KG">KG (kilograms)</option>
                          <option value="MT">MT (metric tons)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-mono text-white/80 uppercase tracking-wider block">Description / Specifications</label>
                      <textarea 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-white focus:outline-none min-h-[80px]" 
                      />
                    </div>
                  </div>
                )}

                {/* 2. Commercial Tab */}
                {formTab === 'commercial' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[11px] font-mono text-white/80 uppercase block">Purchase Cost per Unit (FOB)</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 text-sm">$</span>
                          <input 
                            type="number" 
                            step="0.01"
                            value={purchasePrice}
                            onChange={(e) => setPurchasePrice(Number(e.target.value))}
                            className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 pl-8 pr-4 text-sm font-mono text-white focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-mono text-white/80 uppercase block">Standard Selling Price per Unit</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 text-sm">$</span>
                          <input 
                            type="number" 
                            step="0.01"
                            value={sellingPrice}
                            onChange={(e) => setSellingPrice(Number(e.target.value))}
                            className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 pl-8 pr-4 text-sm font-mono text-white focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-[11px] font-mono text-white/80 uppercase block">Currency</label>
                        <select 
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value)}
                          className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-white focus:outline-none"
                        >
                          {['USD', 'EUR', 'GBP', 'INR', 'AED', 'SGD', 'CNY', 'JPY'].map(cur => (
                            <option key={cur} value={cur}>{cur}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-mono text-white/80 uppercase block">Minimum Order Qty (MOQ)</label>
                        <input 
                          type="number" 
                          value={moq}
                          onChange={(e) => setMoq(Number(e.target.value))}
                          className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-white focus:outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-mono text-white/80 uppercase block">Lead Time (Days)</label>
                        <input 
                          type="number" 
                          value={leadTime}
                          onChange={(e) => setLeadTime(Number(e.target.value))}
                          className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Packaging Tab */}
                {formTab === 'packaging' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[11px] font-mono text-white/80 uppercase block">Package Type</label>
                        <input 
                          type="text" 
                          value={packageType}
                          onChange={(e) => setPackageType(e.target.value)}
                          className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-white focus:outline-none"
                          placeholder="e.g. PP Woven Bag, Carton Box"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-mono text-white/80 uppercase block">Units per Carton</label>
                        <input 
                          type="number" 
                          value={unitsPerCarton}
                          onChange={(e) => setUnitsPerCarton(Number(e.target.value))}
                          className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="space-y-2 col-span-2">
                        <label className="text-[11px] font-mono text-white/80 uppercase block">Gross Weight / Net Weight (KG)</label>
                        <div className="flex gap-2">
                          <input 
                            type="number" 
                            step="0.01"
                            value={grossWeight}
                            onChange={(e) => setGrossWeight(Number(e.target.value))}
                            className="w-1/2 bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-white focus:outline-none"
                            placeholder="Gross"
                          />
                          <input 
                            type="number" 
                            step="0.01"
                            value={netWeight}
                            onChange={(e) => setNetWeight(Number(e.target.value))}
                            className="w-1/2 bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-white focus:outline-none"
                            placeholder="Net"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-mono text-white/80 uppercase block">CBM (Vol)</label>
                        <input 
                          type="number" 
                          step="0.001"
                          value={cbm}
                          onChange={(e) => setCbm(Number(e.target.value))}
                          className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-white focus:outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-mono text-white/80 uppercase block">20GP Max load</label>
                        <input 
                          type="number" 
                          value={containerLoadingCapacity}
                          onChange={(e) => setContainerLoadingCapacity(Number(e.target.value))}
                          className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Compliance Tab */}
                {formTab === 'compliance' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[11px] font-mono text-white/80 uppercase block">Shelf Life</label>
                        <input 
                          type="text" 
                          value={shelfLife}
                          onChange={(e) => setShelfLife(e.target.value)}
                          className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-white focus:outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-mono text-white/80 uppercase block">Storage Conditions</label>
                        <input 
                          type="text" 
                          value={storageConditions}
                          onChange={(e) => setStorageConditions(e.target.value)}
                          className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[11px] font-mono text-white/80 uppercase block mb-2">Required Certifications</span>
                      <div className="flex flex-wrap gap-2">
                        {['FSSAI', 'HACCP', 'Phytosanitary Certificate', 'FDA Approved', 'Halal Certified', 'ISO 22000'].map(cert => (
                          <button
                            key={cert}
                            type="button"
                            onClick={() => handleToggleCert(cert)}
                            className={cn(
                              "px-3 py-1.5 rounded-lg border text-xs font-mono",
                              certifications.includes(cert) ? "bg-blue-500/10 border-blue-500 text-blue-400" : "bg-white/5 border-white/10 text-white/70"
                            )}
                          >
                            {cert}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-mono text-white/80 uppercase block">Japan Quarantine Regulations / Import Notes</label>
                      <textarea 
                        value={japanImportNotes}
                        onChange={(e) => setJapanImportNotes(e.target.value)}
                        className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-white focus:outline-none min-h-[80px]" 
                      />
                    </div>
                  </div>
                )}

                {/* 5. Relationships Tab */}
                {formTab === 'relationships' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[11px] font-mono text-white/80 uppercase block">Default Supplier Partner</label>
                        <select 
                          value={supplierId}
                          onChange={(e) => setSupplierId(e.target.value)}
                          className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-white focus:outline-none"
                        >
                          {suppliers.map(s => (
                            <option key={s.id} value={s.id} className="bg-[#0c0c0c]">{s.name} ({s.country})</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-[11px] font-mono text-white/80 uppercase block">Preferred Forwarder Node</label>
                        <select 
                          value={preferredForwarderId}
                          onChange={(e) => setPreferredForwarderId(e.target.value)}
                          className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-white focus:outline-none"
                        >
                          {forwarders.map(f => (
                            <option key={f.id} value={f.id} className="bg-[#0c0c0c]">{f.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-mono text-white/80 uppercase block">Default Packaging Specification</label>
                      <input 
                        type="text" 
                        value={defaultPackagingType}
                        onChange={(e) => setDefaultPackagingType(e.target.value)}
                        className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-white focus:outline-none"
                        placeholder="e.g. 25KG Double Layer PP Bag"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-6 border-t border-white/5 flex justify-end gap-4">
                  <button 
                    type="button" 
                    onClick={() => setShowFormDrawer(false)}
                    className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-mono uppercase tracking-widest hover:bg-white/10 border-none cursor-pointer text-white"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-8 py-3 bg-blue-500 text-black font-bold rounded-xl text-xs font-mono uppercase tracking-widest hover:bg-blue-400 border-none cursor-pointer"
                  >
                    {formMode === 'create' ? 'Register Commodity' : 'Save Attributes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </MasterPage>
  );
}

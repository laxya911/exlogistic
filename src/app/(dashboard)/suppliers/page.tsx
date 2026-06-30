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
  ShieldCheck, 
  Edit3, 
  Clock, 
  ArrowLeftRight, 
  Compass,
  AlertCircle,
  Download,
  Activity,
  Building2,
  Mail,
  Phone,
  MapPin,
  Star,
  ShieldAlert,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PageHeaderUpdater } from '@/components/layout/page-context';
import { Supplier, Contact, Product, PurchaseOrder, Shipment } from '@/types';
import { formatCurrency, cn, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { useSuppliers, SupplierSortField, SortOrder } from '@/hooks/useSuppliers';
import { Pagination } from '@/components/ui/pagination';

export default function SupplierMasterPage() {
  const hook = useSuppliers();
  const {
    suppliers,
    rawSuppliers,
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
    createSupplier,
    updateSupplier,
    archiveSupplier,
    restoreSupplier,
    duplicateSupplier,
    softDeleteSupplier
  } = hook;

  // UI States
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showFormDrawer, setShowFormDrawer] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [formTab, setFormTab] = useState<'general' | 'performance' | 'contacts'>('general');
  const [detailTab, setDetailTab] = useState<'contacts' | 'commodities' | 'history' | 'timeline'>('contacts');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Communication note state
  const [communicationNote, setCommunicationNote] = useState('');
  const [commType, setCommType] = useState<'CALL' | 'EMAIL' | 'MEETING' | 'NOTE'>('NOTE');

  // Related data lists
  const [products, setProducts] = useState<Product[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);

  // Form Fields State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [country, setCountry] = useState('India');
  const [notes, setNotes] = useState('');
  const [website, setWebsite] = useState('');
  const [taxId, setTaxId] = useState('');
  const [performanceRating, setPerformanceRating] = useState(4.5);
  const [averageLeadTime, setAverageLeadTime] = useState(15);
  const [paymentTerms, setPaymentTerms] = useState('30 Days Net');
  const [certifications, setCertifications] = useState<string[]>(['ISO 9001', 'FSSAI']);
  
  // Multiple Contacts State
  const [formContacts, setFormContacts] = useState<Contact[]>([
    { name: '', role: 'Sales Lead', email: '', phone: '', isPrimary: true }
  ]);

  // Load supporting matrices
  useEffect(() => {
    const loadSupportData = async () => {
      try {
        const [prodData, poData, shpData] = await Promise.all([
          fetch('/api/products').then(r => r.json()),
          fetch('/api/purchase-orders').then(r => r.json()),
          fetch('/api/shipments').then(r => r.json())
        ]);
        setProducts(prodData);
        setPurchaseOrders(poData);
        setShipments(shpData);
      } catch (err) {
        console.error('Failed loading related matrices data');
      }
    };
    loadSupportData();
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        openCreateForm();
      }
      if (e.key === 'Escape') {
        setShowFormDrawer(false);
        setSelectedSupplier(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync active selection updates
  const activeSupplier = useMemo(() => {
    if (!selectedSupplier) return null;
    return suppliers.find(s => s.id === selectedSupplier.id) || selectedSupplier;
  }, [suppliers, selectedSupplier]);

  // Compute Active Vendor Relations
  const supplierRelations = useMemo(() => {
    if (!activeSupplier) return null;
    const suppId = activeSupplier.id;

    // Commodities supplied
    const suppliedCommodities = products.filter(p => p.supplierId === suppId);

    // PO history
    const clientPOs = purchaseOrders.filter(po => po.supplierId === suppId);

    // Shipments involving their cargo (by matching PO and Sales Orders or matching items)
    const clientShipments = shipments.filter(shp => {
      // Find PO related to this shipment or general origin cargo
      return clientPOs.some(po => po.id === shp.orderId); // fallback simple match
    });

    return {
      suppliedCommodities,
      clientPOs,
      clientShipments
    };
  }, [activeSupplier, products, purchaseOrders, shipments]);

  // Statistics Dashboard
  const dashboardStats = useMemo(() => {
    const active = rawSuppliers.filter(s => (!s.entityStatus || s.entityStatus === 'ACTIVE'));
    const totalVendors = active.length;
    const avgLeadTime = totalVendors > 0 
      ? Math.round(active.reduce((acc, curr) => acc + curr.averageLeadTime, 0) / totalVendors)
      : 0;
    const avgRating = totalVendors > 0 
      ? Number((active.reduce((acc, curr) => acc + curr.performanceRating, 0) / totalVendors).toFixed(2))
      : 0;
    const certifiedCount = active.filter(s => s.certifications?.length > 0).length;

    return { totalVendors, avgLeadTime, avgRating, certifiedCount };
  }, [rawSuppliers]);

  const openCreateForm = () => {
    setFormMode('create');
    setFormErrors([]);
    setFormTab('general');

    setName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setCountry('India');
    setNotes('');
    setWebsite('');
    setTaxId('');
    setPerformanceRating(4.5);
    setAverageLeadTime(15);
    setPaymentTerms('30 Days Net');
    setCertifications(['ISO 9001', 'FSSAI']);
    setFormContacts([
      { name: '', role: 'Sales Lead', email: '', phone: '', isPrimary: true }
    ]);

    setShowFormDrawer(true);
  };

  const openEditForm = (s: Supplier) => {
    setFormMode('edit');
    setFormErrors([]);
    setFormTab('general');

    setName(s.name);
    setEmail(s.email);
    setPhone(s.phone);
    setAddress(s.address);
    setCountry(s.country);
    setNotes(s.notes || '');
    setWebsite(s.website || '');
    setTaxId(s.taxId || '');
    setPerformanceRating(s.performanceRating);
    setAverageLeadTime(s.averageLeadTime);
    setPaymentTerms(s.paymentTerms);
    setCertifications(s.certifications || []);
    setFormContacts(s.contacts || [
      { name: '', role: 'Sales Lead', email: '', phone: '', isPrimary: true }
    ]);

    setShowFormDrawer(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);

    // Check at least one primary contact
    if (formContacts.length === 0 || !formContacts[0].name.trim()) {
      setFormErrors(['At least one contact with a name is required']);
      return;
    }

    const payload: Partial<Supplier> = {
      name,
      email,
      phone,
      address,
      country,
      notes,
      website,
      taxId,
      performanceRating: Number(performanceRating),
      averageLeadTime: Number(averageLeadTime),
      paymentTerms,
      certifications,
      contacts: formContacts.filter(c => c.name.trim() !== '')
    };

    if (formMode === 'create') {
      const result = await createSupplier(payload);
      if (result.success) {
        setShowFormDrawer(false);
      } else if (result.error) {
        setFormErrors(result.error.split(' | '));
      }
    } else if (formMode === 'edit' && activeSupplier) {
      const result = await updateSupplier(activeSupplier.id, payload);
      if (result.success) {
        setShowFormDrawer(false);
      } else if (result.error) {
        setFormErrors(result.error.split(' | '));
      }
    }
  };

  const handleAddContact = () => {
    setFormContacts(prev => [
      ...prev,
      { name: '', role: 'Agent', email: '', phone: '', isPrimary: false }
    ]);
  };

  const handleContactChange = (index: number, field: keyof Contact, value: any) => {
    setFormContacts(prev => prev.map((c, idx) => {
      if (idx !== index) return c;
      return { ...c, [field]: value };
    }));
  };

  const handleRemoveContact = (index: number) => {
    setFormContacts(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleDuplicate = async (s: Supplier) => {
    const copy = await duplicateSupplier(s.id);
    if (copy) {
      setSelectedSupplier(copy);
    }
  };

  const handleToggleCert = (cert: string) => {
    setCertifications(prev => 
      prev.includes(cert) ? prev.filter(c => c !== cert) : [...prev, cert]
    );
  };

  const handleSaveNote = async () => {
    if (!communicationNote.trim() || !activeSupplier) return;

    const timelineEvent = {
      id: `EV-${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString(),
      type: 'COMMUNICATION_LOGGED',
      title: `${commType} Saved`,
      description: communicationNote.trim(),
      userId: 'USR-001'
    };

    const updatedTimeline = [timelineEvent, ...(activeSupplier.timeline || [])];

    try {
      const res = await fetch(`/api/suppliers/${activeSupplier.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeline: updatedTimeline })
      });
      if (!res.ok) throw new Error('Note logger failed');
      const updated = await res.json();
      
      toast.success('Communication note logged');
      setCommunicationNote('');
      setSelectedSupplier(updated);
    } catch (e) {
      toast.error('Failed to log note');
    }
  };

  return (
    <>
      <PageHeaderUpdater title="Vendor Hub" subtitle="Export Supply Chain Cooperatives & Performance Control" />
      {/* Top Stat Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Active Cooperatives', value: dashboardStats.totalVendors, icon: Building2, color: 'text-blue-400' },
          { label: 'Avg Lead Time', value: `${dashboardStats.avgLeadTime} Days`, icon: Clock, color: 'text-rose-400' },
          { label: 'Certified Suppliers', value: `${dashboardStats.certifiedCount} Vendors`, icon: ShieldCheck, color: 'text-emerald-400' },
          { label: 'Avg Vendor Rating', value: `★ ${dashboardStats.avgRating}`, icon: Star, color: 'text-amber-400' },
        ].map((item, i) => (
          <div key={i} className="glass p-6 rounded-3xl border border-white/5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/70">
              <item.icon size={20} className={item.color} />
            </div>
            <div>
              <p className="text-[10px] font-mono text-white/70 uppercase tracking-widest mb-0.5">{item.label}</p>
              <p className="font-sans font-bold text-lg text-white">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Suppliers List Table */}
        <div className={cn(
          "transition-all duration-500 space-y-6",
          activeSupplier ? "lg:col-span-6" : "lg:col-span-12"
        )}>
          {/* Main Controls Panel */}
          <div className="glass p-6 rounded-3xl border border-white/5 space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              {/* Search input with categories */}
              <div className="relative w-full max-w-lg flex items-center bg-white/5 border border-white/10 rounded-2xl overflow-hidden focus-within:border-blue-500/50 transition-all font-mono">
                <select 
                  value={searchField} 
                  onChange={(e) => setSearchField(e.target.value as any)}
                  className="bg-transparent text-white/70 text-[10px] font-mono uppercase pl-4 focus:outline-none border-r border-white/10 pr-2 h-12"
                >
                  <option value="all" className="bg-[#0b0b0b]">All Fields</option>
                  <option value="name" className="bg-[#0b0b0b]">Cooperative</option>
                  <option value="email" className="bg-[#0b0b0b]">Email</option>
                  <option value="country" className="bg-[#0b0b0b]">Country</option>
                  <option value="certification" className="bg-[#0b0b0b]">Certificate</option>
                </select>
                <Search className="absolute left-28 text-white/70" size={16} />
                <input 
                  type="text" 
                  placeholder="Identify Agri Vendor..." 
                  className="w-full bg-transparent py-3 pl-12 pr-4 text-xs focus:outline-none text-white font-mono"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
                    "flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 border rounded-2xl text-[10px] font-mono uppercase tracking-widest transition-all",
                    Object.values(filters).some(arr => arr.length > 0)
                      ? "bg-blue-500/10 border-blue-500 text-blue-400"
                      : "bg-white/5 border-white/10 text-white/90 hover:bg-white/10"
                  )}
                >
                  <Filter size={14} /> Filters
                </button>
                
                <button 
                  onClick={openCreateForm}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-black rounded-2xl text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-blue-400 transition-all border-none cursor-pointer"
                >
                  <Plus size={14} /> Onboard Vendor
                </button>
              </div>
            </div>

            {/* Filter Drawer */}
            <AnimatePresence>
              {showFilterDrawer && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-t border-white/5 pt-4"
                >
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-[10px] font-mono">
                    {/* Country Filter */}
                    <div className="space-y-2">
                      <p className="text-white/70 uppercase tracking-wider">Country</p>
                      <div className="flex flex-wrap gap-1.5">
                        {filterOptions.countries.map(c => (
                          <button
                            key={c}
                            onClick={() => setFilters(prev => ({
                              ...prev,
                              countries: prev.countries.includes(c) ? prev.countries.filter(x => x !== c) : [...prev.countries, c]
                            }))}
                            className={cn(
                              "px-2.5 py-1 rounded bg-[#101010] border text-[9px]",
                              filters.countries.includes(c) ? "border-blue-500 text-blue-400 bg-blue-500/5" : "border-white/5 text-white/70"
                            )}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Certifications Filter */}
                    <div className="space-y-2">
                      <p className="text-white/70 uppercase tracking-wider">Certifications</p>
                      <div className="flex flex-wrap gap-1.5">
                        {filterOptions.certifications.map(cert => (
                          <button
                            key={cert}
                            onClick={() => setFilters(prev => ({
                              ...prev,
                              certifications: prev.certifications.includes(cert) ? prev.certifications.filter(x => x !== cert) : [...prev.certifications, cert]
                            }))}
                            className={cn(
                              "px-2.5 py-1 rounded bg-[#101010] border text-[9px]",
                              filters.certifications.includes(cert) ? "border-blue-500 text-blue-400 bg-blue-500/5" : "border-white/5 text-white/70"
                            )}
                          >
                            {cert}
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
                              "px-2.5 py-1 rounded bg-[#101010] border text-[9px]",
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
                      onClick={() => setFilters({ countries: [], certifications: [], statuses: [] })}
                      className="px-4 py-2 rounded bg-white/5 text-[9px] font-mono text-white/70 hover:bg-white/10"
                    >
                      Clear Vendor Filters
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
                className="flex flex-wrap items-center justify-between p-4 bg-blue-500 text-black rounded-2xl gap-3 animate-pulse"
              >
                <div className="flex items-center gap-3 text-xs font-mono font-bold">
                  <Building2 size={16} />
                  <span>{selectedIds.length} Vendors Checked</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button 
                    onClick={() => hook.bulkArchive(selectedIds)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-black/10 hover:bg-black/20 rounded-lg text-[9px] font-mono font-bold uppercase border-none cursor-pointer text-black"
                  >
                    <Archive size={12} /> Archive
                  </button>
                  <button 
                    onClick={() => hook.bulkRestore(selectedIds)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-black/10 hover:bg-black/20 rounded-lg text-[9px] font-mono font-bold uppercase border-none cursor-pointer text-black"
                  >
                    <RefreshCcw size={12} /> Restore
                  </button>
                  <button 
                    onClick={() => hook.bulkDelete(selectedIds)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-black/10 hover:bg-black/20 rounded-lg text-[9px] font-mono font-bold uppercase border-none cursor-pointer text-black"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                  <button 
                    onClick={() => hook.bulkExportCSV(selectedIds)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white hover:bg-black/90 rounded-lg text-[9px] font-mono font-bold uppercase border-none cursor-pointer"
                  >
                    <FileDown size={12} /> Export CSV
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Supplier Grid Listing */}
          <div className="glass rounded-3xl border border-white/5 overflow-hidden">
            <div className="overflow-x-auto font-mono">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-white/2 text-white/70 uppercase tracking-[0.2em] border-b border-white/5">
                  <tr>
                    <th className="py-5 px-6 w-8 text-center">
                      <input 
                        type="checkbox"
                        checked={suppliers.length > 0 && selectedIds.length === suppliers.length}
                        onChange={() => selectAll(suppliers.map(s => s.id))}
                        className="rounded accent-blue-500 cursor-pointer"
                      />
                    </th>
                    <th className="py-5 px-6">
                      <button 
                        onClick={() => {
                          setSortBy('name');
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        }}
                        className="flex items-center gap-2 hover:text-white transition-colors bg-transparent border-none cursor-pointer text-white/70 text-xs font-mono uppercase"
                      >
                        Cooperative {sortBy === 'name' && (sortOrder === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                      </button>
                    </th>
                    <th className="py-5 px-6">Country</th>
                    <th className="py-5 px-6">
                      <button 
                        onClick={() => {
                          setSortBy('performanceRating');
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        }}
                        className="flex items-center gap-2 hover:text-white transition-colors bg-transparent border-none cursor-pointer text-white/70 text-xs font-mono uppercase"
                      >
                        Rating {sortBy === 'performanceRating' && (sortOrder === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                      </button>
                    </th>
                    <th className="py-5 px-6">
                      <button 
                        onClick={() => {
                          setSortBy('averageLeadTime');
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        }}
                        className="flex items-center justify-end gap-2 hover:text-white transition-colors w-full bg-transparent border-none cursor-pointer text-white/70 text-xs font-mono uppercase"
                      >
                        Lead Time {sortBy === 'averageLeadTime' && (sortOrder === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                      </button>
                    </th>
                    <th className="py-5 px-6 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {suppliers.map((s) => (
                    <tr 
                      key={s.id} 
                      className={cn(
                        "group cursor-pointer transition-all",
                        activeSupplier?.id === s.id ? "bg-blue-500/10" : "hover:bg-white/2"
                      )}
                      onClick={() => setSelectedSupplier(activeSupplier?.id === s.id ? null : s)}
                    >
                      <td className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(s.id)}
                          onChange={() => toggleSelect(s.id)}
                          className="rounded accent-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-sans font-bold text-sm text-white/90 truncate max-w-[200px]">{s.name}</p>
                          <p className="text-[9px] text-white/25 truncate max-w-[200px]">{s.email}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-white/70">{s.country}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1 text-amber-400 font-bold">
                          <Star size={12} fill="currentColor" />
                          <span>{s.performanceRating.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right font-bold text-white/80">
                        {s.averageLeadTime} Days
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase",
                          (!s.entityStatus || s.entityStatus === 'ACTIVE') && "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
                          s.entityStatus === 'ARCHIVED' && "bg-amber-500/10 text-amber-400 border border-amber-500/20",
                          s.entityStatus === 'INACTIVE' && "bg-white/5 text-white/70 border border-white/10"
                        )}>{s.entityStatus}</span>
                      </td>
                    </tr>
                  ))}
                  {suppliers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-white/70 font-mono text-xs uppercase tracking-widest">
                        No Supplier Nodes Matched Filters
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

        {/* Selected Vendor Profile Sidebar */}
        <AnimatePresence>
          {activeSupplier && supplierRelations && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="lg:col-span-6 space-y-8"
            >
              {/* Profile Card Header */}
              <div className="glass p-8 rounded-4xl border border-white/5 relative overflow-hidden">
                {/* Control Panel Actions */}
                <div className="absolute top-0 right-0 p-6 flex gap-2">
                  <button 
                    onClick={() => openEditForm(activeSupplier)}
                    className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors border-none cursor-pointer"
                    title="Edit Vendor"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button 
                    onClick={() => handleDuplicate(activeSupplier)}
                    className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors border-none cursor-pointer"
                    title="Duplicate Vendor"
                  >
                    <Copy size={14} />
                  </button>
                  {activeSupplier.entityStatus === 'ACTIVE' ? (
                    <button 
                      onClick={() => archiveSupplier(activeSupplier.id)}
                      className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors border-none cursor-pointer"
                      title="Archive Vendor"
                    >
                      <Archive size={14} />
                    </button>
                  ) : (
                    <button 
                      onClick={() => restoreSupplier(activeSupplier.id)}
                      className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors border-none cursor-pointer"
                      title="Restore Vendor"
                    >
                      <RefreshCcw size={14} />
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      softDeleteSupplier(activeSupplier.id);
                      setSelectedSupplier(null);
                    }}
                    className="p-2.5 rounded-full bg-white/5 hover:bg-rose-500/10 text-white/70 hover:text-rose-400 transition-colors border-none cursor-pointer"
                    title="Soft Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button 
                    onClick={() => setSelectedSupplier(null)}
                    className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors border-none cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 items-start mb-8">
                  <div className="w-24 h-24 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/70 shadow-2xl shrink-0">
                    <Building2 size={32} className="text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0 pr-12">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[8px] font-mono font-bold uppercase tracking-widest">
                        <Star size={8} fill="currentColor" /> {activeSupplier.performanceRating.toFixed(1)} Rating
                      </div>
                      <span className={cn(
                        "px-2.5 py-0.5 rounded border text-[8px] font-mono font-bold uppercase tracking-widest",
                        activeSupplier.entityStatus === 'ACTIVE' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                        activeSupplier.entityStatus === 'ARCHIVED' && "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      )}>
                        {activeSupplier.entityStatus}
                      </span>
                    </div>
                    <h2 className="text-2xl font-display font-medium tracking-tight text-white mb-2 truncate">{activeSupplier.name}</h2>
                    <p className="text-[10px] font-mono text-white/80 tracking-wider mb-2">TAX: {activeSupplier.taxId || 'N/A'} • COUNTRY: {activeSupplier.country}</p>
                    <a 
                      href={activeSupplier.website} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs text-blue-400 hover:underline flex items-center gap-1 font-mono"
                    >
                      <Globe size={10} /> {activeSupplier.website || 'No website registered'}
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-white/5 pt-6">
                  {[
                    { label: 'Rating score', value: `★ ${activeSupplier.performanceRating.toFixed(1)}`, icon: Star, color: 'text-amber-400' },
                    { label: 'Avg Lead Time', value: `${activeSupplier.averageLeadTime} Days`, icon: Clock, color: 'text-rose-400' },
                    { label: 'Payment Terms', value: activeSupplier.paymentTerms, icon: DollarSign, color: 'text-emerald-400' },
                    { label: 'Commodities Mapped', value: `${supplierRelations.suppliedCommodities.length} items`, icon: Package, color: 'text-blue-400' },
                  ].map((stat, i) => (
                    <div key={i} className="p-4 rounded-xl bg-white/2 border border-white/5">
                      <stat.icon size={12} className={cn("mb-2 opacity-40", stat.color)} />
                      <p className="text-[8px] font-mono text-white/70 uppercase tracking-widest mb-0.5">{stat.label}</p>
                      <p className="font-sans font-bold text-xs">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Related Information Matrix Tabs */}
              <div className="glass p-8 rounded-4xl border border-white/5">
                <div className="flex gap-6 border-b border-white/5 mb-6 overflow-x-auto whitespace-nowrap pb-2">
                  {[
                    { id: 'contacts', label: 'Contact Directory' },
                    { id: 'commodities', label: 'Supplied Goods' },
                    { id: 'history', label: 'Invoices & POs' },
                    { id: 'timeline', label: 'Activity Logs' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setDetailTab(tab.id as any)}
                      className={cn(
                        "pb-2 text-[9px] font-mono font-bold uppercase tracking-widest bg-transparent border-none cursor-pointer",
                        detailTab === tab.id 
                          ? "text-blue-500 border-b-2 border-blue-500" 
                          : "text-white/70 hover:text-white/70"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Contacts Directory */}
                {detailTab === 'contacts' && (
                  <div className="space-y-4">
                    {activeSupplier.contacts.map((c, idx) => (
                      <div key={idx} className="p-5 rounded-2xl bg-white/2 border border-white/5 flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-sans font-bold text-sm text-white/90">{c.name}</span>
                            {c.isPrimary && (
                              <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[7px] rounded border border-blue-500/20 uppercase font-mono font-bold">Primary</span>
                            )}
                          </div>
                          <p className="text-[9px] font-mono text-blue-400">{c.role}</p>
                          <div className="flex items-center gap-1.5 text-[10px] text-white/70 font-mono mt-2">
                            <Mail size={10} /> {c.email}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-white/70 font-mono">
                            <Phone size={10} /> {c.phone}
                          </div>
                        </div>
                      </div>
                    ))}
                    {activeSupplier.contacts.length === 0 && (
                      <p className="text-center py-4 text-white/10 text-[9px] uppercase">No contacts registered</p>
                    )}
                  </div>
                )}

                {/* Supplied Commodities Tab */}
                {detailTab === 'commodities' && (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                    {supplierRelations.suppliedCommodities.map(p => (
                      <div key={p.id} className="p-4 rounded-xl bg-white/2 border border-white/5 flex justify-between items-center text-[11px] font-mono">
                        <div>
                          <p className="font-sans font-bold text-white/90">{p.name}</p>
                          <p className="text-[9px] text-white/25 mt-0.5">{p.sku} • HSN: {p.hsnCode}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-sans font-bold text-blue-400">{formatCurrency(p.sellingPrice)}</p>
                          <p className="text-[9px] text-white/25 mt-0.5">MOQ: {p.moq} {p.uom}</p>
                        </div>
                      </div>
                    ))}
                    {supplierRelations.suppliedCommodities.length === 0 && (
                      <p className="text-center py-8 text-white/10 text-[9px] uppercase">No commodities mapped to this supplier</p>
                    )}
                  </div>
                )}

                {/* Purchase Order History */}
                {detailTab === 'history' && (
                  <div className="space-y-6 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                    <div>
                      <p className="text-[9px] font-mono text-white/70 uppercase tracking-wider mb-3 font-bold">Linked Purchase Orders</p>
                      <div className="space-y-2">
                        {supplierRelations.clientPOs.map(po => (
                          <div key={po.id} className="flex justify-between items-center p-3 bg-white/2 border border-white/5 rounded-xl text-[10px] font-mono">
                            <div>
                              <p className="font-bold text-white/80">{po.poNo}</p>
                              <p className="text-[8px] text-white/70">{formatDate(po.date)}</p>
                            </div>
                            <div className="text-right">
                              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[8px]">{po.status}</span>
                              <p className="text-[10px] font-sans font-bold text-white/80 mt-1">{formatCurrency(po.totalValue)}</p>
                            </div>
                          </div>
                        ))}
                        {supplierRelations.clientPOs.length === 0 && (
                          <p className="text-center py-4 text-white/10 text-[9px] uppercase">No Purchase Order history</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-[9px] font-mono text-white/70 uppercase tracking-wider mb-3 font-bold">Associated Shipments Carrying Cargo</p>
                      <div className="space-y-2">
                        {supplierRelations.clientShipments.map(shp => (
                          <div key={shp.id} className="flex justify-between items-center p-3 bg-white/2 border border-white/5 rounded-xl text-[10px] font-mono">
                            <div>
                              <p className="font-bold text-white/80">{shp.shipmentNo}</p>
                              <p className="text-[8px] text-white/70">ETD: {formatDate(shp.etd)}</p>
                            </div>
                            <div className="text-right">
                              <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[8px]">{shp.status}</span>
                              <p className="text-[9px] text-white/25 mt-1">{shp.originPortId} → {shp.destinationPortId}</p>
                            </div>
                          </div>
                        ))}
                        {supplierRelations.clientShipments.length === 0 && (
                          <p className="text-center py-4 text-white/10 text-[9px] uppercase">No related shipment records</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Timeline Events & Note Logging */}
                {detailTab === 'timeline' && (
                  <div className="space-y-6">
                    {/* Live Communication Logger Input */}
                    <div className="p-4 rounded-2xl bg-white/2 border border-white/5 space-y-3">
                      <div className="flex justify-between items-center">
                        <p className="text-[8px] font-mono text-white/70 uppercase tracking-wider">Log Vendor Communication</p>
                        <select
                          value={commType}
                          onChange={(e) => setCommType(e.target.value as any)}
                          className="bg-transparent border border-white/10 rounded px-2 py-0.5 text-[9px] font-mono text-white/90"
                        >
                          <option value="NOTE" className="bg-[#0b0b0b]">Note</option>
                          <option value="CALL" className="bg-[#0b0b0b]">Call</option>
                          <option value="EMAIL" className="bg-[#0b0b0b]">Email</option>
                          <option value="MEETING" className="bg-[#0b0b0b]">Meeting</option>
                        </select>
                      </div>
                      <textarea
                        value={communicationNote}
                        onChange={(e) => setCommunicationNote(e.target.value)}
                        placeholder="Log bulk pricing discounts, quality audit checks, or lead time revisions..."
                        className="w-full bg-[#070707] border border-white/10 rounded-xl p-3 text-[11px] font-mono text-white focus:outline-none focus:border-blue-500/50 min-h-[60px]"
                      />
                      <div className="flex justify-end">
                        <button
                          onClick={handleSaveNote}
                          disabled={!communicationNote.trim()}
                          className="px-4 py-2 bg-blue-500 text-black text-[9px] font-mono font-bold uppercase rounded-lg hover:bg-blue-400 disabled:opacity-40 disabled:hover:bg-blue-500 border-none cursor-pointer"
                        >
                          Save Log
                        </button>
                      </div>
                    </div>

                    {/* Timeline List */}
                    <div className="max-h-[250px] overflow-y-auto custom-scrollbar pr-2 space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-white/5">
                      {(activeSupplier.timeline || []).map((item, idx) => (
                        <div key={item.id || idx} className="relative pl-8">
                          <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-[#0a0a0a] border border-white/15 flex items-center justify-center z-10 text-blue-400">
                            {item.type === 'CREATED' && <Building2 size={10} />}
                            {item.type === 'UPDATED' && <Edit3 size={10} />}
                            {item.type === 'ARCHIVED' && <Archive size={10} />}
                            {item.type === 'RESTORED' && <RefreshCcw size={10} />}
                            {item.type === 'RATING_CHANGED' && <Star size={10} />}
                            {item.type === 'LEAD_TIME_CHANGED' && <Clock size={10} />}
                            {item.type === 'STATUS_CHANGED' && <Activity size={10} />}
                            {item.type === 'COMMUNICATION_LOGGED' && <MessageSquare size={10} />}
                          </div>
                          <p className="text-[8px] font-mono text-white/70 uppercase mb-0.5">{formatDate(item.date)}</p>
                          <p className="text-xs font-bold text-white/90 mb-0.5">{item.title}</p>
                          <p className="text-[10px] text-white/70 leading-relaxed font-sans">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Onboard Vendor Drawer overlay */}
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
                  <Building2 className="text-blue-500" /> {formMode === 'create' ? 'Onboard New Supplier Cooperative' : 'Modify Supplier Profile'}
                </h3>
                <button onClick={() => setShowFormDrawer(false)} className="p-2 rounded bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-none cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              {/* Validation errors */}
              {formErrors.length > 0 && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl mb-6 space-y-1">
                  <p className="text-xs font-mono font-bold text-rose-400 flex items-center gap-2">
                    <AlertCircle size={14} /> Vendor onboarding constraints violated:
                  </p>
                  <ul className="list-disc list-inside text-[10px] font-mono text-rose-300">
                    {formErrors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Form Navigation Tabs */}
              <div className="flex gap-4 border-b border-white/5 mb-6 overflow-x-auto whitespace-nowrap pb-2 text-[9px] font-mono font-bold uppercase">
                {[
                  { id: 'general', label: '1. General Info' },
                  { id: 'performance', label: '2. Performance Metrics' },
                  { id: 'contacts', label: '3. Contacts Matrix' },
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
                {/* 1. General tab */}
                {formTab === 'general' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[9px] font-mono text-white/80 uppercase block">Cooperative / Vendor Name</label>
                        <input 
                          type="text" 
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-xs font-mono text-white focus:outline-none focus:border-blue-500/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-mono text-white/80 uppercase block">Contact Email</label>
                        <input 
                          type="email" 
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-xs font-mono text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-[9px] font-mono text-white/80 uppercase block">Telephone Number</label>
                        <input 
                          type="text" 
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-xs font-mono text-white focus:outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-mono text-white/80 uppercase block">Country</label>
                        <input 
                          type="text" 
                          required
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-xs font-mono text-white focus:outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-mono text-white/80 uppercase block">Tax Registration / VAT ID</label>
                        <input 
                          type="text" 
                          value={taxId}
                          onChange={(e) => setTaxId(e.target.value)}
                          className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-xs font-mono text-white focus:outline-none"
                          placeholder="e.g. TAX-VEND-123"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[9px] font-mono text-white/80 uppercase block">Corporate Website URL</label>
                        <input 
                          type="text" 
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-xs font-mono text-white focus:outline-none"
                          placeholder="e.g. https://www.vendor.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-mono text-white/80 uppercase block">Payment Invoicing Terms</label>
                        <select 
                          value={paymentTerms}
                          onChange={(e) => setPaymentTerms(e.target.value)}
                          className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-xs font-mono text-white focus:outline-none"
                        >
                          <option value="30 Days Net">30 Days Net</option>
                          <option value="15 Days Advance">15 Days Advance</option>
                          <option value="LC at Sight">LC at Sight</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-mono text-white/80 uppercase block">Business Address Details</label>
                      <textarea 
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-xs font-mono text-white focus:outline-none min-h-[80px]" 
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-mono text-white/80 uppercase block">General Operations Notes</label>
                      <textarea 
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-xs font-mono text-white focus:outline-none min-h-[80px]" 
                      />
                    </div>
                  </div>
                )}

                {/* 2. Performance Tab */}
                {formTab === 'performance' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[9px] font-mono text-white/80 uppercase block">Average Lead Time (Days)</label>
                        <input 
                          type="number" 
                          value={averageLeadTime}
                          onChange={(e) => setAverageLeadTime(Number(e.target.value))}
                          className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-xs font-mono text-white focus:outline-none"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-[9px] font-mono text-white/80 uppercase block">Performance Rating Score (1.0 to 5.0)</label>
                        <input 
                          type="number" 
                          step="0.1"
                          value={performanceRating}
                          onChange={(e) => setPerformanceRating(Number(e.target.value))}
                          className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-xs font-mono text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[9px] font-mono text-white/80 uppercase block mb-2">Supplier Certifications</span>
                      <div className="flex flex-wrap gap-2">
                        {['ISO 9001', 'FSSAI', 'HACCP', 'ISO 22000', 'Organic Certified', 'CE', 'Halal Certified'].map(cert => (
                          <button
                            key={cert}
                            type="button"
                            onClick={() => handleToggleCert(cert)}
                            className={cn(
                              "px-3 py-1.5 rounded-lg border text-[10px] font-mono",
                              certifications.includes(cert) ? "bg-blue-500/10 border-blue-500 text-blue-400" : "bg-white/5 border-white/10 text-white/70"
                            )}
                          >
                            {cert}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Contacts Matrix tab */}
                {formTab === 'contacts' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-mono text-white/80 uppercase tracking-wider">Associated Vendor Managers</span>
                      <button 
                        type="button"
                        onClick={handleAddContact}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[9px] font-mono uppercase text-white/90 hover:bg-white/10"
                      >
                        <Plus size={12} /> Add Contact
                      </button>
                    </div>

                    <div className="space-y-4">
                      {formContacts.map((contact, idx) => (
                        <div key={idx} className="p-5 rounded-2xl bg-[#080808] border border-white/10 relative space-y-4 font-mono">
                          {formContacts.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveContact(idx)}
                              className="absolute top-4 right-4 text-white/70 hover:text-rose-400 bg-transparent border-none cursor-pointer"
                            >
                              <X size={14} />
                            </button>
                          )}
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[8px] font-mono text-white/70 uppercase">Contact Name</label>
                              <input 
                                type="text"
                                required
                                value={contact.name}
                                onChange={(e) => handleContactChange(idx, 'name', e.target.value)}
                                className="w-full bg-[#0b0b0b] border border-white/10 rounded-lg p-2.5 text-xs text-white font-mono focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[8px] font-mono text-white/70 uppercase">Corporate Role</label>
                              <input 
                                type="text"
                                value={contact.role}
                                onChange={(e) => handleContactChange(idx, 'role', e.target.value)}
                                className="w-full bg-[#0b0b0b] border border-white/10 rounded-lg p-2.5 text-xs text-white font-mono focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[8px] font-mono text-white/70 uppercase">Email Address</label>
                              <input 
                                type="email"
                                value={contact.email}
                                onChange={(e) => handleContactChange(idx, 'email', e.target.value)}
                                className="w-full bg-[#0b0b0b] border border-white/10 rounded-lg p-2.5 text-xs text-white font-mono focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[8px] font-mono text-white/70 uppercase">Mobile Number</label>
                              <input 
                                type="text"
                                value={contact.phone}
                                onChange={(e) => handleContactChange(idx, 'phone', e.target.value)}
                                className="w-full bg-[#0b0b0b] border border-white/10 rounded-lg p-2.5 text-xs text-white font-mono focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <input 
                              type="checkbox"
                              checked={contact.isPrimary}
                              onChange={(e) => {
                                setFormContacts(prev => prev.map((c, i) => ({
                                  ...c,
                                  isPrimary: i === idx ? e.target.checked : false
                                })));
                              }}
                              className="rounded accent-blue-500 cursor-pointer"
                              id={`contact-primary-${idx}`}
                            />
                            <label htmlFor={`contact-primary-${idx}`} className="text-[9px] font-mono text-white/70 cursor-pointer">Mark as Primary Vendor Contact</label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-6 border-t border-white/5 flex justify-end gap-4">
                  <button 
                    type="button" 
                    onClick={() => setShowFormDrawer(false)}
                    className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-mono uppercase tracking-widest hover:bg-white/10 border-none cursor-pointer text-white"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-8 py-3 bg-blue-500 text-black font-bold rounded-xl text-[10px] font-mono uppercase tracking-widest hover:bg-blue-400 border-none cursor-pointer"
                  >
                    {formMode === 'create' ? 'Onboard Vendor' : 'Save Profile'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

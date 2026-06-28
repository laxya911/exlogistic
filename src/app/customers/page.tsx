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
  Activity,
  Users,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  MessageSquare,
  CheckCircle2,
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MasterPage } from '@/components/layout/master-page';
import { Customer, Contact, Port, Quotation, SalesOrder, Shipment } from '@/types';
import { formatCurrency, cn, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { useCustomers, CustomerSortField, SortOrder } from '@/hooks/useCustomers';

export default function CustomerCRMPage() {
  const hook = useCustomers();
  const {
    customers,
    rawCustomers,
    loading,
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
    createCustomer,
    updateCustomer,
    archiveCustomer,
    restoreCustomer,
    duplicateCustomer,
    softDeleteCustomer
  } = hook;

  // UI States
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showFormDrawer, setShowFormDrawer] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [formTab, setFormTab] = useState<'general' | 'finance' | 'contacts' | 'compliance'>('general');
  const [detailTab, setDetailTab] = useState<'contacts' | 'history' | 'finance' | 'timeline'>('contacts');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Communication note state
  const [communicationNote, setCommunicationNote] = useState('');
  const [commType, setCommType] = useState<'CALL' | 'EMAIL' | 'MEETING' | 'NOTE'>('NOTE');

  // Dynamic Options
  const [ports, setPorts] = useState<Port[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);

  // Form Fields State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [country, setCountry] = useState('USA');
  const [creditLimit, setCreditLimit] = useState(100000);
  const [paymentTerms, setPaymentTerms] = useState('30 Days Net');
  const [notes, setNotes] = useState('');
  const [website, setWebsite] = useState('');
  const [taxId, setTaxId] = useState('');
  const [segment, setSegment] = useState<'PREMIUM' | 'STANDARD' | 'LOW_VOLUME'>('STANDARD');
  const [accountManagerId, setAccountManagerId] = useState('USR-001');
  const [preferredDischargePortId, setPreferredDischargePortId] = useState('LAX');
  
  // Multiple Contacts State
  const [formContacts, setFormContacts] = useState<Contact[]>([
    { name: '', role: 'Procurement Manager', email: '', phone: '', isPrimary: true }
  ]);

  // Load supporting options
  useEffect(() => {
    const loadSupportData = async () => {
      try {
        const [portData, quoteData, soData, shpData] = await Promise.all([
          fetch('/api/calendar').then(() => [
            { id: 'TYO', name: 'Tokyo', code: 'JP TYO', country: 'Japan', type: 'SEA', entityStatus: 'ACTIVE', createdAt: '', updatedAt: '' },
            { id: 'OSA', name: 'Osaka', code: 'JP OSA', country: 'Japan', type: 'SEA', entityStatus: 'ACTIVE', createdAt: '', updatedAt: '' },
            { id: 'LAX', name: 'Los Angeles', code: 'US LAX', country: 'USA', type: 'SEA', entityStatus: 'ACTIVE', createdAt: '', updatedAt: '' },
            { id: 'SIN', name: 'Singapore', code: 'SG SIN', country: 'Singapore', type: 'SEA', entityStatus: 'ACTIVE', createdAt: '', updatedAt: '' }
          ] as any),
          fetch('/api/quotations').then(r => r.json()),
          fetch('/api/sales-orders').then(r => r.json()),
          fetch('/api/shipments').then(r => r.json())
        ]);
        setPorts(portData);
        setQuotations(quoteData);
        setSalesOrders(soData);
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
        setSelectedCustomer(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync active selection updates
  const activeCustomer = useMemo(() => {
    if (!selectedCustomer) return null;
    return customers.find(c => c.id === selectedCustomer.id) || selectedCustomer;
  }, [customers, selectedCustomer]);

  // Compute Active Customer Relations & Totals
  const customerRelations = useMemo(() => {
    if (!activeCustomer) return null;
    const custId = activeCustomer.id;

    // Filter transaction histories
    const clientQuotes = quotations.filter(q => q.customerId === custId);
    const clientSalesOrders = salesOrders.filter(so => so.customerId === custId);
    const clientShipments = shipments.filter(shp => {
      const so = salesOrders.find(s => s.id === shp.orderId);
      return so?.customerId === custId;
    });

    // Compute dynamic financial statistics
    const totalApprovedSalesValue = clientSalesOrders
      .filter(so => so.status === 'CONFIRMED')
      .reduce((acc, curr) => acc + curr.totalValue, 0);

    const creditHeadroom = Math.max(0, activeCustomer.creditLimit - totalApprovedSalesValue);

    return {
      clientQuotes,
      clientSalesOrders,
      clientShipments,
      totalApprovedSalesValue,
      creditHeadroom
    };
  }, [activeCustomer, quotations, salesOrders, shipments]);

  // Statistics Panels
  const dashboardStats = useMemo(() => {
    const active = rawCustomers.filter(c => c.entityStatus === 'ACTIVE');
    const exposure = active.reduce((acc, curr) => acc + curr.creditLimit, 0);
    const premiumCount = active.filter(c => c.segment === 'PREMIUM').length;
    
    // Most popular discharge port
    const portsCount: Record<string, number> = {};
    active.forEach(c => {
      portsCount[c.preferredDischargePortId] = (portsCount[c.preferredDischargePortId] || 0) + 1;
    });
    let topPort = 'N/A';
    let maxCount = 0;
    Object.entries(portsCount).forEach(([p, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topPort = p;
      }
    });

    return { activeCount: active.length, exposure, premiumCount, topPort };
  }, [rawCustomers]);

  const openCreateForm = () => {
    setFormMode('create');
    setFormErrors([]);
    setFormTab('general');
    
    setName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setCountry('USA');
    setCreditLimit(100000);
    setPaymentTerms('30 Days Net');
    setNotes('');
    setWebsite('');
    setTaxId('');
    setSegment('STANDARD');
    setAccountManagerId('USR-001');
    setPreferredDischargePortId('LAX');
    setFormContacts([
      { name: '', role: 'Procurement Manager', email: '', phone: '', isPrimary: true }
    ]);

    setShowFormDrawer(true);
  };

  const openEditForm = (c: Customer) => {
    setFormMode('edit');
    setFormErrors([]);
    setFormTab('general');

    setName(c.name);
    setEmail(c.email);
    setPhone(c.phone);
    setAddress(c.address);
    setCountry(c.country);
    setCreditLimit(c.creditLimit);
    setPaymentTerms(c.paymentTerms);
    setNotes(c.notes || '');
    setWebsite(c.website || '');
    setTaxId(c.taxId || '');
    setSegment(c.segment);
    setAccountManagerId(c.accountManagerId);
    setPreferredDischargePortId(c.preferredDischargePortId);
    setFormContacts(c.contacts || [
      { name: '', role: 'Procurement Manager', email: '', phone: '', isPrimary: true }
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

    const payload: Partial<Customer> = {
      name,
      email,
      phone,
      address,
      country,
      creditLimit: Number(creditLimit),
      paymentTerms,
      notes,
      website,
      taxId,
      segment,
      accountManagerId,
      preferredDischargePortId,
      contacts: formContacts.filter(c => c.name.trim() !== '')
    };

    if (formMode === 'create') {
      const result = await createCustomer(payload);
      if (result.success) {
        setShowFormDrawer(false);
      } else if (result.error) {
        setFormErrors(result.error.split(' | '));
      }
    } else if (formMode === 'edit' && activeCustomer) {
      const result = await updateCustomer(activeCustomer.id, payload);
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

  const handleDuplicate = async (c: Customer) => {
    const copy = await duplicateCustomer(c.id);
    if (copy) {
      setSelectedCustomer(copy);
    }
  };

  const handleSaveNote = async () => {
    if (!communicationNote.trim() || !activeCustomer) return;

    const timelineEvent = {
      id: `EV-${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString(),
      type: 'COMMUNICATION_LOGGED',
      title: `${commType} Recorded`,
      description: communicationNote.trim(),
      userId: 'USR-001'
    };

    const updatedTimeline = [timelineEvent, ...(activeCustomer.timeline || [])];

    try {
      const res = await fetch(`/api/customers/${activeCustomer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeline: updatedTimeline })
      });
      if (!res.ok) throw new Error('Note logger failed');
      const updated = await res.json();
      
      toast.success('Communication note saved to timeline');
      setCommunicationNote('');
      setSelectedCustomer(updated);
    } catch (e) {
      toast.error('Failed to log note');
    }
  };

  return (
    <MasterPage 
      title="Client Matrix" 
      subtitle="Export Buyer Relationship & Compliance Intelligence"
      loading={loading}
    >
      {/* Top Stat Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Active Clients', value: dashboardStats.activeCount, icon: Users, color: 'text-blue-400' },
          { label: 'Credit Exposure', value: formatCurrency(dashboardStats.exposure), icon: CreditCard, color: 'text-rose-400' },
          { label: 'Premium Segment Accounts', value: `${dashboardStats.premiumCount} Clients`, icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Top Discharge Port', value: dashboardStats.topPort, icon: Compass, color: 'text-violet-400' },
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
        {/* Customer Table List */}
        <div className={cn(
          "transition-all duration-500 space-y-6",
          activeCustomer ? "lg:col-span-6" : "lg:col-span-12"
        )}>
          {/* Main Controls Panel */}
          <div className="glass p-6 rounded-3xl border border-white/5 space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              {/* Search input with category options */}
              <div className="relative w-full max-w-lg flex items-center bg-white/5 border border-white/10 rounded-2xl overflow-hidden focus-within:border-blue-500/50 transition-all">
                <select 
                  value={searchField} 
                  onChange={(e) => setSearchField(e.target.value as any)}
                  className="bg-transparent text-white/70 text-[10px] font-mono uppercase pl-4 focus:outline-none border-r border-white/10 pr-2 h-12"
                >
                  <option value="all" className="bg-[#0b0b0b]">All Fields</option>
                  <option value="name" className="bg-[#0b0b0b]">Company</option>
                  <option value="email" className="bg-[#0b0b0b]">Email</option>
                  <option value="country" className="bg-[#0b0b0b]">Country</option>
                  <option value="segment" className="bg-[#0b0b0b]">Segment</option>
                </select>
                <Search className="absolute left-28 text-white/70" size={16} />
                <input 
                  type="text" 
                  placeholder="Query Client Coordinates..." 
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
                  <UserPlus size={14} /> Onboard Client
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

                    {/* Segment Filter */}
                    <div className="space-y-2">
                      <p className="text-white/70 uppercase tracking-wider">Segment</p>
                      <div className="flex flex-wrap gap-1.5">
                        {filterOptions.segments.map(s => (
                          <button
                            key={s}
                            onClick={() => setFilters(prev => ({
                              ...prev,
                              segments: prev.segments.includes(s) ? prev.segments.filter(x => x !== s) : [...prev.segments, s]
                            }))}
                            className={cn(
                              "px-2.5 py-1 rounded bg-[#101010] border text-[9px]",
                              filters.segments.includes(s) ? "border-blue-500 text-blue-400 bg-blue-500/5" : "border-white/5 text-white/70"
                            )}
                          >
                            {s}
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
                      onClick={() => setFilters({ countries: [], segments: [], statuses: [] })}
                      className="px-4 py-2 rounded bg-white/5 text-[9px] font-mono text-white/70 hover:bg-white/10"
                    >
                      Clear CRM Filters
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
                  <Users size={16} />
                  <span>{selectedIds.length} Clients Checked</span>
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

          {/* Client Table Grid */}
          <div className="glass rounded-3xl border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-white/2 text-white/70 uppercase tracking-[0.2em] border-b border-white/5">
                  <tr>
                    <th className="py-5 px-6 w-8 text-center">
                      <input 
                        type="checkbox"
                        checked={customers.length > 0 && selectedIds.length === customers.length}
                        onChange={() => selectAll(customers.map(c => c.id))}
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
                        Company {sortBy === 'name' && (sortOrder === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                      </button>
                    </th>
                    <th className="py-5 px-6">
                      <button 
                        onClick={() => {
                          setSortBy('country');
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        }}
                        className="flex items-center gap-2 hover:text-white transition-colors bg-transparent border-none cursor-pointer text-white/70 text-xs font-mono uppercase"
                      >
                        Country {sortBy === 'country' && (sortOrder === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                      </button>
                    </th>
                    <th className="py-5 px-6">
                      <button 
                        onClick={() => {
                          setSortBy('creditLimit');
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        }}
                        className="flex items-center justify-end gap-2 hover:text-white transition-colors w-full bg-transparent border-none cursor-pointer text-white/70 text-xs font-mono uppercase"
                      >
                        Credit Limit {sortBy === 'creditLimit' && (sortOrder === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                      </button>
                    </th>
                    <th className="py-5 px-6 text-right">Segment / Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {customers.map((c) => (
                    <tr 
                      key={c.id} 
                      className={cn(
                        "group cursor-pointer transition-all",
                        activeCustomer?.id === c.id ? "bg-blue-500/10" : "hover:bg-white/2"
                      )}
                      onClick={() => setSelectedCustomer(activeCustomer?.id === c.id ? null : c)}
                    >
                      <td className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(c.id)}
                          onChange={() => toggleSelect(c.id)}
                          className="rounded accent-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-sans font-bold text-sm text-white/90 truncate max-w-[200px]">{c.name}</p>
                          <p className="text-[9px] text-white/70 tracking-tighter truncate max-w-[200px]">{c.email}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-white/70">
                        <div className="flex items-center gap-1">
                          <Globe size={10} className="text-white/70" />
                          <span>{c.country}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right font-sans font-bold text-white/80">
                        {formatCurrency(c.creditLimit)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex flex-col items-end">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase",
                            c.segment === 'PREMIUM' && "bg-blue-500/10 text-blue-400 border border-blue-500/20",
                            c.segment === 'STANDARD' && "bg-white/5 text-white/90 border border-white/10",
                            c.segment === 'LOW_VOLUME' && "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          )}>{c.segment}</span>
                          <span className="text-[8px] text-white/25 mt-1 uppercase tracking-wider">{c.entityStatus}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {customers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-white/70 font-mono text-xs uppercase tracking-widest">
                        No Client Nodes Matched Filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Selected Customer CRM Sidebar */}
        <AnimatePresence>
          {activeCustomer && customerRelations && (
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
                    onClick={() => openEditForm(activeCustomer)}
                    className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors border-none cursor-pointer"
                    title="Edit Client"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button 
                    onClick={() => handleDuplicate(activeCustomer)}
                    className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors border-none cursor-pointer"
                    title="Duplicate Client"
                  >
                    <Copy size={14} />
                  </button>
                  {activeCustomer.entityStatus === 'ACTIVE' ? (
                    <button 
                      onClick={() => archiveCustomer(activeCustomer.id)}
                      className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors border-none cursor-pointer"
                      title="Archive Client"
                    >
                      <Archive size={14} />
                    </button>
                  ) : (
                    <button 
                      onClick={() => restoreCustomer(activeCustomer.id)}
                      className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors border-none cursor-pointer"
                      title="Restore Client"
                    >
                      <RefreshCcw size={14} />
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      softDeleteCustomer(activeCustomer.id);
                      setSelectedCustomer(null);
                    }}
                    className="p-2.5 rounded-full bg-white/5 hover:bg-rose-500/10 text-white/70 hover:text-rose-400 transition-colors border-none cursor-pointer"
                    title="Soft Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button 
                    onClick={() => setSelectedCustomer(null)}
                    className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors border-none cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 items-start mb-8">
                  <div className="w-24 h-24 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/70 shadow-2xl shrink-0">
                    <Users size={32} className="text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0 pr-12">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[8px] font-mono font-bold uppercase tracking-widest">
                        {activeCustomer.segment}
                      </span>
                      <span className={cn(
                        "px-2.5 py-0.5 rounded border text-[8px] font-mono font-bold uppercase tracking-widest",
                        activeCustomer.entityStatus === 'ACTIVE' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                        activeCustomer.entityStatus === 'ARCHIVED' && "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      )}>
                        {activeCustomer.entityStatus}
                      </span>
                    </div>
                    <h2 className="text-2xl font-display font-medium tracking-tight text-white mb-2 truncate">{activeCustomer.name}</h2>
                    <p className="text-[10px] font-mono text-white/80 tracking-wider mb-2">TAX: {activeCustomer.taxId || 'N/A'} • PM: {activeCustomer.accountManagerId} • DISCHARGE PORT: {activeCustomer.preferredDischargePortId}</p>
                    <a 
                      href={activeCustomer.website} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs text-blue-400 hover:underline flex items-center gap-1 font-mono"
                    >
                      <Globe size={10} /> {activeCustomer.website || 'No website registered'}
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-white/5 pt-6">
                  {[
                    { label: 'Credit Limit', value: formatCurrency(activeCustomer.creditLimit), icon: CreditCard, color: 'text-rose-400' },
                    { label: 'Payment Terms', value: activeCustomer.paymentTerms, icon: Clock, color: 'text-amber-400' },
                    { label: 'Discharge Port', value: activeCustomer.preferredDischargePortId, icon: Compass, color: 'text-violet-400' },
                    { label: 'Total Revenue', value: formatCurrency(customerRelations.totalApprovedSalesValue), icon: TrendingUp, color: 'text-emerald-400' },
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
                    { id: 'history', label: 'Transactions' },
                    { id: 'finance', label: 'Financial KPI' },
                    { id: 'timeline', label: 'Activity Logs & Notes' }
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
                    {activeCustomer.contacts.map((c, idx) => (
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
                    {activeCustomer.contacts.length === 0 && (
                      <p className="text-center py-4 text-white/10 text-[9px] uppercase">No contacts registered</p>
                    )}
                  </div>
                )}

                {/* History Transactions Tab */}
                {detailTab === 'history' && (
                  <div className="space-y-6 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
                    {/* Quotation history */}
                    <div>
                      <p className="text-[9px] font-mono text-white/70 uppercase tracking-wider mb-3">Linked Quotation history</p>
                      <div className="space-y-2">
                        {customerRelations.clientQuotes.map(q => (
                          <div key={q.id} className="flex justify-between items-center p-3 bg-white/2 border border-white/5 rounded-xl text-[10px] font-mono">
                            <div>
                              <p className="font-bold text-white/80">{q.quotationNo}</p>
                              <p className="text-[8px] text-white/70">{formatDate(q.date)}</p>
                            </div>
                            <div className="text-right">
                              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[8px]">{q.status}</span>
                              <p className="text-[10px] font-sans font-bold text-white/80 mt-1">{formatCurrency(q.totalValue)}</p>
                            </div>
                          </div>
                        ))}
                        {customerRelations.clientQuotes.length === 0 && (
                          <p className="text-center py-4 text-white/10 text-[9px] uppercase">No Quotation logs available</p>
                        )}
                      </div>
                    </div>

                    {/* Sales Order history */}
                    <div>
                      <p className="text-[9px] font-mono text-white/70 uppercase tracking-wider mb-3">Linked Sales Orders</p>
                      <div className="space-y-2">
                        {customerRelations.clientSalesOrders.map(so => (
                          <div key={so.id} className="flex justify-between items-center p-3 bg-white/2 border border-white/5 rounded-xl text-[10px] font-mono">
                            <div>
                              <p className="font-bold text-white/80">{so.orderNo}</p>
                              <p className="text-[8px] text-white/70">{formatDate(so.date)}</p>
                            </div>
                            <div className="text-right">
                              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[8px]">{so.status}</span>
                              <p className="text-[10px] font-sans font-bold text-white/80 mt-1">{formatCurrency(so.totalValue)}</p>
                            </div>
                          </div>
                        ))}
                        {customerRelations.clientSalesOrders.length === 0 && (
                          <p className="text-center py-4 text-white/10 text-[9px] uppercase">No Sales logs available</p>
                        )}
                      </div>
                    </div>

                    {/* Shipment history */}
                    <div>
                      <p className="text-[9px] font-mono text-white/70 uppercase tracking-wider mb-3">Linked Shipment logs</p>
                      <div className="space-y-2">
                        {customerRelations.clientShipments.map(shp => (
                          <div key={shp.id} className="flex justify-between items-center p-3 bg-white/2 border border-white/5 rounded-xl text-[10px] font-mono">
                            <div>
                              <p className="font-bold text-white/80">{shp.shipmentNo}</p>
                              <p className="text-[8px] text-white/70">DISPATCH: {formatDate(shp.etd)}</p>
                            </div>
                            <div className="text-right">
                              <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[8px]">{shp.status}</span>
                              <p className="text-[10px] font-mono text-white/70 mt-1">{shp.destinationPortId}</p>
                            </div>
                          </div>
                        ))}
                        {customerRelations.clientShipments.length === 0 && (
                          <p className="text-center py-4 text-white/10 text-[9px] uppercase">No Logistics logs available</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Financial KPI */}
                {detailTab === 'finance' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-4 rounded-xl bg-white/2 border border-white/5">
                        <p className="text-[8px] font-mono text-white/70 uppercase tracking-wider mb-1">Approved Revenue</p>
                        <p className="text-sm font-sans font-bold text-emerald-400">{formatCurrency(customerRelations.totalApprovedSalesValue)}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white/2 border border-white/5">
                        <p className="text-[8px] font-mono text-white/70 uppercase tracking-wider mb-1">Credit Limit</p>
                        <p className="text-sm font-sans font-bold text-rose-400">{formatCurrency(activeCustomer.creditLimit)}</p>
                      </div>
                    </div>

                    {/* Credit Headroom Bar Gauge */}
                    <div className="space-y-2 p-5 rounded-2xl bg-white/2 border border-white/5">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-white/70">Active Credit Exposure:</span>
                        <span className="text-white/90">
                          {Math.round((customerRelations.totalApprovedSalesValue / activeCustomer.creditLimit) * 100) || 0}% Exposure
                        </span>
                      </div>
                      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            (customerRelations.totalApprovedSalesValue / activeCustomer.creditLimit) > 0.8 ? "bg-rose-500" : "bg-blue-500"
                          )}
                          style={{ width: `${Math.min(100, (customerRelations.totalApprovedSalesValue / activeCustomer.creditLimit) * 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[8px] font-mono text-white/70 pt-1">
                        <span>Used: {formatCurrency(customerRelations.totalApprovedSalesValue)}</span>
                        <span>Available Headroom: {formatCurrency(customerRelations.creditHeadroom)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Timeline & Custom Note Logger */}
                {detailTab === 'timeline' && (
                  <div className="space-y-6">
                    {/* Live Communication Logger Input */}
                    <div className="p-4 rounded-2xl bg-white/2 border border-white/5 space-y-3">
                      <div className="flex justify-between items-center">
                        <p className="text-[8px] font-mono text-white/70 uppercase tracking-wider">Log Communication Note</p>
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
                        placeholder="Log meeting minutes, phone callback logs, or compliance checks..."
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
                      {(activeCustomer.timeline || []).map((item, idx) => (
                        <div key={item.id || idx} className="relative pl-8">
                          <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-[#0a0a0a] border border-white/15 flex items-center justify-center z-10 text-blue-400">
                            {item.type === 'CREATED' && <UserPlus size={10} />}
                            {item.type === 'UPDATED' && <Edit3 size={10} />}
                            {item.type === 'ARCHIVED' && <Archive size={10} />}
                            {item.type === 'RESTORED' && <RefreshCcw size={10} />}
                            {item.type === 'CREDIT_LIMIT_CHANGED' && <CreditCard size={10} />}
                            {item.type === 'STATUS_CHANGED' && <Clock size={10} />}
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

      {/* Onboard Client Drawer overlay */}
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
                  <Users className="text-blue-500" /> {formMode === 'create' ? 'Onboard New Customer Node' : 'Modify Customer Node'}
                </h3>
                <button onClick={() => setShowFormDrawer(false)} className="p-2 rounded bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-none cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              {/* Validation errors */}
              {formErrors.length > 0 && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl mb-6 space-y-1">
                  <p className="text-xs font-mono font-bold text-rose-400 flex items-center gap-2">
                    <AlertCircle size={14} /> Onboarding constraints violated:
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
                  { id: 'finance', label: '2. Financial Terms' },
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
                {/* 1. General Info tab */}
                {formTab === 'general' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[9px] font-mono text-white/80 uppercase block">Company Legal Name</label>
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
                        <label className="text-[9px] font-mono text-white/80 uppercase block">Tax ID / VAT Registration</label>
                        <input 
                          type="text" 
                          value={taxId}
                          onChange={(e) => setTaxId(e.target.value)}
                          className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-xs font-mono text-white focus:outline-none"
                          placeholder="e.g. TAX-12345"
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
                          placeholder="e.g. https://www.company.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-mono text-white/80 uppercase block">Corporate segment</label>
                        <select 
                          value={segment}
                          onChange={(e) => setSegment(e.target.value as any)}
                          className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-xs font-mono text-white focus:outline-none"
                        >
                          <option value="PREMIUM">PREMIUM (Large Exposure)</option>
                          <option value="STANDARD">STANDARD (Medium Exposure)</option>
                          <option value="LOW_VOLUME">LOW_VOLUME (Cash Only / Low Limit)</option>
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
                  </div>
                )}

                {/* 2. Financial Terms tab */}
                {formTab === 'finance' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[9px] font-mono text-white/80 uppercase block">Approved Credit Ceiling (USD)</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 text-xs">$</span>
                          <input 
                            type="number" 
                            value={creditLimit}
                            onChange={(e) => setCreditLimit(Number(e.target.value))}
                            className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 pl-8 pr-4 text-xs font-mono text-white focus:outline-none"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-[9px] font-mono text-white/80 uppercase block">Preferred Discharge Port</label>
                        <select 
                          value={preferredDischargePortId}
                          onChange={(e) => setPreferredDischargePortId(e.target.value)}
                          className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-xs font-mono text-white focus:outline-none"
                        >
                          {ports.map(p => (
                            <option key={p.id} value={p.id} className="bg-[#0b0b0b]">{p.name} ({p.country})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[9px] font-mono text-white/80 uppercase block">Payment Invoicing Terms</label>
                        <select 
                          value={paymentTerms}
                          onChange={(e) => setPaymentTerms(e.target.value)}
                          className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-xs font-mono text-white focus:outline-none"
                        >
                          <option value="30 Days Net">30 Days Net</option>
                          <option value="15 Days Advance">15 Days Advance</option>
                          <option value="Letter of Credit">Letter of Credit (L/C)</option>
                          <option value="60 Days Net">60 Days Net</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-mono text-white/80 uppercase block">Assigned Account Manager</label>
                        <select 
                          value={accountManagerId}
                          onChange={(e) => setAccountManagerId(e.target.value)}
                          className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-xs font-mono text-white focus:outline-none"
                        >
                          <option value="USR-001">USR-001 (Manager A)</option>
                          <option value="USR-002">USR-002 (Manager B)</option>
                          <option value="USR-003">USR-003 (Manager C)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-mono text-white/80 uppercase block">Internal Relationship Notes</label>
                      <textarea 
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-xs font-mono text-white focus:outline-none min-h-[80px]" 
                      />
                    </div>
                  </div>
                )}

                {/* 3. Contacts Matrix tab */}
                {formTab === 'contacts' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-mono text-white/80 uppercase tracking-wider">Associated Client Managers</span>
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
                        <div key={idx} className="p-5 rounded-2xl bg-[#080808] border border-white/10 relative space-y-4">
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
                                // Mark all others as non-primary
                                setFormContacts(prev => prev.map((c, i) => ({
                                  ...c,
                                  isPrimary: i === idx ? e.target.checked : false
                                })));
                              }}
                              className="rounded accent-blue-500 cursor-pointer"
                              id={`contact-primary-${idx}`}
                            />
                            <label htmlFor={`contact-primary-${idx}`} className="text-[9px] font-mono text-white/70 cursor-pointer">Mark as Primary Corporate Contact</label>
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
                    {formMode === 'create' ? 'Onboard Client' : 'Save Details'}
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

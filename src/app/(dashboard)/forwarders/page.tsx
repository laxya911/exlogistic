'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  MessageSquare,
  Truck,
  Anchor
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PageHeaderUpdater } from '@/components/layout/page-context';
import { Forwarder, Contact, Port, Shipment } from '@/types';
import { cn, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { useForwarders } from '@/hooks/useForwarders';

export default function ForwarderMasterPage() {
  const hook = useForwarders();
  const {
    forwarders,
    rawForwarders,
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
    createForwarder,
    updateForwarder,
    archiveForwarder,
    restoreForwarder,
    duplicateForwarder,
    softDeleteForwarder,
    fetchForwarders
  } = hook;

  // UI States
  const [selectedForwarder, setSelectedForwarder] = useState<Forwarder | null>(null);
  const [showFormDrawer, setShowFormDrawer] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [formTab, setFormTab] = useState<'general' | 'ports' | 'contacts'>('general');
  const [detailTab, setDetailTab] = useState<'contacts' | 'ports' | 'history' | 'timeline'>('contacts');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Communication note state
  const [communicationNote, setCommunicationNote] = useState('');
  const [commType, setCommType] = useState<'CALL' | 'EMAIL' | 'MEETING' | 'NOTE'>('NOTE');

  // Related data lists
  const [ports, setPorts] = useState<Port[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);

  // Form Fields State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [country, setCountry] = useState('Japan');
  const [notes, setNotes] = useState('');
  const [website, setWebsite] = useState('');
  const [taxId, setTaxId] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [rating, setRating] = useState(4.5);
  const [preferredPorts, setPreferredPorts] = useState<string[]>([]);
  
  // Multiple Contacts State
  const [formContacts, setFormContacts] = useState<Contact[]>([
    { name: '', role: 'Logistics Manager', email: '', phone: '', isPrimary: true }
  ]);

  // Load supporting matrices
  useEffect(() => {
    const loadSupportData = async () => {
      try {
        const [portData, shpData] = await Promise.all([
          fetch('/api/products').then(() => [ // fallback port list or fetch from db
            { id: 'TYO', name: 'Tokyo', code: 'JP TYO', country: 'Japan', type: 'SEA', entityStatus: 'ACTIVE', createdAt: '', updatedAt: '' },
            { id: 'OSA', name: 'Osaka', code: 'JP OSA', country: 'Japan', type: 'SEA', entityStatus: 'ACTIVE', createdAt: '', updatedAt: '' },
            { id: 'LAX', name: 'Los Angeles', code: 'US LAX', country: 'USA', type: 'SEA', entityStatus: 'ACTIVE', createdAt: '', updatedAt: '' },
            { id: 'SIN', name: 'Singapore', code: 'SG SIN', country: 'Singapore', type: 'SEA', entityStatus: 'ACTIVE', createdAt: '', updatedAt: '' }
          ] as Port[]),
          fetch('/api/shipments').then(r => r.json())
        ]);
        setPorts(portData);
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
        setSelectedForwarder(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync active selection updates
  const activeForwarder = useMemo(() => {
    if (!selectedForwarder) return null;
    return forwarders.find(f => f.id === selectedForwarder.id) || selectedForwarder;
  }, [forwarders, selectedForwarder]);

  // Compute Active Forwarder Relations
  const forwarderRelations = useMemo(() => {
    if (!activeForwarder) return null;
    const fwdId = activeForwarder.id;

    // Shipments involving this forwarder
    const clientShipments = shipments.filter(shp => shp.forwarderId === fwdId);

    return {
      clientShipments
    };
  }, [activeForwarder, shipments]);

  // Statistics Dashboard
  const dashboardStats = useMemo(() => {
    const active = rawForwarders.filter(f => ((f as any).status || f.entityStatus) === 'ACTIVE');
    const totalAgencies = active.length;
    const avgRating = totalAgencies > 0 
      ? Number((active.reduce((acc, curr) => acc + curr.performanceRating, 0) / totalAgencies).toFixed(2))
      : 0;
    const portsCovered = Array.from(new Set(active.flatMap(f => f.preferredPorts))).length;
    const countriesActive = Array.from(new Set(active.map(f => f.country))).length;

    return { totalAgencies, avgRating, portsCovered, countriesActive };
  }, [rawForwarders]);

  const openCreateForm = () => {
    setFormMode('create');
    setFormErrors([]);
    setFormTab('general');

    setName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setCountry('Japan');
    setNotes('');
    setWebsite('');
    setTaxId('');
    setStatus('ACTIVE');
    setRating(4.5);
    setPreferredPorts(['TYO']);
    setFormContacts([
      { name: '', role: 'Logistics Manager', email: '', phone: '', isPrimary: true }
    ]);

    setShowFormDrawer(true);
  };

  const openEditForm = (f: Forwarder) => {
    setFormMode('edit');
    setFormErrors([]);
    setFormTab('general');

    setName(f.name);
    setEmail(f.email);
    setPhone(f.phone);
    setAddress(f.address);
    setCountry(f.country);
    setNotes(f.notes || '');
    setWebsite(f.website || '');
    setTaxId(f.taxId || '');
    setStatus((f as any).status || f.entityStatus || 'ACTIVE');
    setRating(f.performanceRating);
    setPreferredPorts(f.preferredPorts || []);
    setFormContacts(f.contacts || [
      { name: '', role: 'Logistics Manager', email: '', phone: '', isPrimary: true }
    ]);

    setShowFormDrawer(true);
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormErrors([]);

    // Check at least one primary contact
    if (formContacts.length === 0 || !formContacts[0].name.trim()) {
      setFormErrors(['At least one contact with a name is required']);
      return;
    }

    if (preferredPorts.length === 0) {
      setFormErrors(['At least one preferred port coverage is required']);
      return;
    }

    const payload = {
      name,
      email,
      phone,
      address,
      country,
      notes,
      website,
      taxId,
      status,
      performanceRating: Number(rating),
      preferredPorts,
      contacts: formContacts.filter(c => c.name.trim() !== '')
    } as any;

    if (formMode === 'create') {
      const result = await createForwarder(payload);
      if (result.success) {
        setShowFormDrawer(false);
      } else if (result.error) {
        setFormErrors(result.error.split(' | '));
      }
    } else if (formMode === 'edit' && activeForwarder) {
      const result = await updateForwarder(activeForwarder.id, payload);
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

  const handleDuplicate = async (f: Forwarder) => {
    const copy = await duplicateForwarder(f.id);
    if (copy) {
      setSelectedForwarder(copy);
    }
  };

  const handleTogglePort = (portId: string) => {
    setPreferredPorts(prev => 
      prev.includes(portId) ? prev.filter(p => p !== portId) : [...prev, portId]
    );
  };

  const handleSaveNote = async () => {
    if (!communicationNote.trim() || !activeForwarder) return;

    const timelineEvent = {
      id: `EV-${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString(),
      type: 'COMMUNICATION_LOGGED',
      title: `${commType} Logged`,
      description: communicationNote.trim(),
      userId: 'USR-001'
    };

    const updatedTimeline = [timelineEvent, ...(activeForwarder.timeline || [])];

    try {
      const res = await fetch(`/api/forwarders/${activeForwarder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'LOG_NOTE', timeline: updatedTimeline })
      });
      if (!res.ok) throw new Error('Note logger failed');
      const updated = await res.json();
      
      toast.success('Communication note logged');
      setCommunicationNote('');
      setSelectedForwarder(updated);
      await fetchForwarders();
    } catch (e) {
      toast.error('Failed to log note');
    }
  };

  return (
    <>
      <PageHeaderUpdater title="Forwarder Matrix" subtitle="Logistics Forwarding Agencies & Port Coverage Control" />
      {/* Top Stat Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Active Agencies', value: dashboardStats.totalAgencies, icon: Truck, color: 'text-blue-400' },
          { label: 'Avg Agency Rating', value: `★ ${dashboardStats.avgRating}`, icon: Star, color: 'text-amber-400' },
          { label: 'Ports Covered', value: `${dashboardStats.portsCovered} Ports`, icon: Anchor, color: 'text-emerald-400' },
          { label: 'Operating Countries', value: `${dashboardStats.countriesActive} Regions`, icon: Globe, color: 'text-rose-400' },
        ].map((item, i) => (
          <div key={i} className="glass p-6 rounded-3xl border border-border flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
              <item.icon size={20} className={item.color} />
            </div>
            <div>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-0.5">{item.label}</p>
              <p className="font-sans font-bold text-lg text-foreground">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Forwarders List Table */}
        <div className={cn(
          "transition-all duration-500 space-y-6",
          activeForwarder ? "lg:col-span-6" : "lg:col-span-12"
        )}>
          {/* Main Controls Panel */}
          <div className="glass p-6 rounded-3xl border border-border space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              {/* Search input with categories */}
              <div className="relative w-full max-w-lg flex items-center bg-muted border border-border rounded-2xl overflow-hidden focus-within:border-blue-500/50 transition-all font-mono">
                <select 
                  value={searchField} 
                  onChange={(e) => setSearchField(e.target.value as any)}
                  className="bg-transparent text-muted-foreground text-[10px] font-mono uppercase pl-4 focus:outline-none border-r border-border pr-2 h-12"
                >
                  <option value="all" className="bg-background">All Fields</option>
                  <option value="name" className="bg-background">Agency</option>
                  <option value="email" className="bg-background">Email</option>
                  <option value="country" className="bg-background">Country</option>
                </select>
                <Search className="absolute left-28 text-muted-foreground" size={16} />
                <input 
                  type="text" 
                  placeholder="Identify Logistics Agency..." 
                  className="w-full bg-transparent py-3 pl-12 pr-4 text-xs focus:outline-none text-foreground font-mono"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="p-2 text-muted-foreground hover:text-foreground/90">
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
                      : "bg-muted border-border text-foreground/90 hover:bg-accent"
                  )}
                >
                  <Filter size={14} /> Filters
                </button>
                
                <button 
                  onClick={openCreateForm}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-black rounded-2xl text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-blue-400 transition-all border-none cursor-pointer"
                >
                  <Plus size={14} /> Onboard Agency
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
                  className="overflow-hidden border-t border-border pt-4"
                >
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-[10px] font-mono">
                    {/* Country Filter */}
                    <div className="space-y-2">
                      <p className="text-muted-foreground uppercase tracking-wider">Country</p>
                      <div className="flex flex-wrap gap-1.5">
                        {filterOptions.countries.map(c => (
                          <button
                            key={c}
                            onClick={() => setFilters(prev => ({
                              ...prev,
                              countries: prev.countries.includes(c) ? prev.countries.filter(x => x !== c) : [...prev.countries, c]
                            }))}
                            className={cn(
                              "px-2.5 py-1 rounded bg-card border text-[9px]",
                              filters.countries.includes(c) ? "border-blue-500 text-blue-400 bg-blue-500/5" : "border-border text-muted-foreground"
                            )}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>



                    {/* Status Filter */}
                    <div className="space-y-2">
                      <p className="text-muted-foreground uppercase tracking-wider">Status</p>
                      <div className="flex flex-wrap gap-1.5">
                        {['ACTIVE', 'INACTIVE', 'ARCHIVED'].map(s => (
                          <button
                            key={s}
                            onClick={() => setFilters(prev => ({
                              ...prev,
                              statuses: prev.statuses.includes(s) ? prev.statuses.filter(x => x !== s) : [...prev.statuses, s]
                            }))}
                            className={cn(
                              "px-2.5 py-1 rounded bg-card border text-[9px]",
                              filters.statuses.includes(s) ? "border-blue-500 text-blue-400 bg-blue-500/5" : "border-border text-muted-foreground"
                            )}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6 border-t border-border pt-4">
                    <button onClick={() => { setSearchQuery(''); setFilters({ statuses: [], countries: [], certifications: [] }); }}
                      className="px-4 py-2 rounded bg-muted text-[9px] font-mono text-muted-foreground hover:bg-accent"
                    >
                      Clear Filters
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
                  <Truck size={16} />
                  <span>{selectedIds.length} Agencies Checked</span>
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
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-foreground hover:bg-black/90 rounded-lg text-[9px] font-mono font-bold uppercase border-none cursor-pointer"
                  >
                    <FileDown size={12} /> Export CSV
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Forwarders Grid Listing */}
          <div className="glass rounded-3xl border border-border overflow-hidden">
            <div className="overflow-x-auto font-mono">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-white/2 text-muted-foreground uppercase tracking-[0.2em] border-b border-border">
                  <tr>
                    <th className="py-5 px-6 w-8 text-center">
                      <input 
                        type="checkbox"
                        checked={forwarders.length > 0 && selectedIds.length === forwarders.length}
                        onChange={() => selectAll(forwarders.map(f => f.id))}
                        className="rounded accent-blue-500 cursor-pointer"
                      />
                    </th>
                    <th className="py-5 px-6">
                      <button 
                        onClick={() => {
                          setSortBy('name');
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        }}
                        className="flex items-center gap-2 hover:text-foreground transition-colors bg-transparent border-none cursor-pointer text-muted-foreground text-xs font-mono uppercase"
                      >
                        Agency {sortBy === 'name' && (sortOrder === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                      </button>
                    </th>
                    <th className="py-5 px-6">Country</th>
                        <th onClick={() => { setSortBy('performanceRating' as any); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }} className="py-4 px-5 text-right font-bold cursor-pointer group">
                          <div className="flex items-center justify-end gap-1.5">
                            <Star size={11} className={cn(sortBy === 'performanceRating' ? 'text-blue-400' : 'text-muted-foreground/40')} />
                            <span className={cn('group-hover:text-blue-400 transition-colors', sortBy === 'performanceRating' && 'text-blue-400')}>Rating</span>
                            {sortBy === 'performanceRating' && (sortOrder === 'asc' ? <ChevronUp size={11} className="text-blue-400" /> : <ChevronDown size={11} className="text-blue-400" />)}
                          </div>
                        </th>
                    <th className="py-5 px-6">Ports Coverage</th>
                    <th className="py-5 px-6 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {forwarders.map((f) => (
                    <tr 
                      key={f.id} 
                      className={cn(
                        "group cursor-pointer transition-all",
                        activeForwarder?.id === f.id ? "bg-blue-500/10" : "hover:bg-white/2"
                      )}
                      onClick={() => setSelectedForwarder(activeForwarder?.id === f.id ? null : f)}
                    >
                      <td className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(f.id)}
                          onChange={() => toggleSelect(f.id)}
                          className="rounded accent-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-sans font-bold text-sm text-foreground/90 truncate max-w-50">{f.name}</p>
                          <p className="text-[9px] text-white/25 truncate max-w-50">{f.email}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-muted-foreground">{f.country}</td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1 text-amber-400 font-bold">
                          <Star size={12} fill="currentColor" />
                          <span>{f.performanceRating.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-1">
                          {(f.preferredPorts || []).map(port => (
                            <span key={port} className="px-1.5 py-0.5 rounded bg-muted text-foreground/90 text-[8px] border border-border">{port}</span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase",
                          ((f as any).status || f.entityStatus) === 'ACTIVE' && "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
                          ((f as any).status || f.entityStatus) === 'ARCHIVED' && "bg-amber-500/10 text-amber-400 border border-amber-500/20",
                          ((f as any).status || f.entityStatus) === 'INACTIVE' && "bg-muted text-muted-foreground border border-border"
                        )}>{(f as any).status || f.entityStatus}</span>
                      </td>
                    </tr>
                  ))}
                  {forwarders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-muted-foreground font-mono text-xs uppercase tracking-widest">
                        No Logistics Agencies Matched Filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Selected Forwarder Profile Sidebar */}
        <AnimatePresence>
          {activeForwarder && forwarderRelations && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="lg:col-span-6 space-y-8"
            >
              {/* Profile Card Header */}
              <div className="glass p-8 rounded-4xl border border-border relative overflow-hidden">
                {/* Control Panel Actions */}
                <div className="absolute top-0 right-0 p-6 flex gap-2">
                  <button 
                    onClick={() => openEditForm(activeForwarder)}
                    className="p-2.5 rounded-full bg-muted hover:bg-accent text-muted-foreground hover:text-foreground transition-colors border-none cursor-pointer"
                    title="Edit Agency"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button 
                    onClick={() => handleDuplicate(activeForwarder)}
                    className="p-2.5 rounded-full bg-muted hover:bg-accent text-muted-foreground hover:text-foreground transition-colors border-none cursor-pointer"
                    title="Duplicate Agency"
                  >
                    <Copy size={14} />
                  </button>
                  {activeForwarder.entityStatus === 'ACTIVE' ? (
                    <button 
                      onClick={() => archiveForwarder(activeForwarder.id)}
                      className="p-2.5 rounded-full bg-muted hover:bg-accent text-muted-foreground hover:text-foreground transition-colors border-none cursor-pointer"
                      title="Archive Agency"
                    >
                      <Archive size={14} />
                    </button>
                  ) : (
                    <button 
                      onClick={() => restoreForwarder(activeForwarder.id)}
                      className="p-2.5 rounded-full bg-muted hover:bg-accent text-muted-foreground hover:text-foreground transition-colors border-none cursor-pointer"
                      title="Restore Agency"
                    >
                      <RefreshCcw size={14} />
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      softDeleteForwarder(activeForwarder.id);
                      setSelectedForwarder(null);
                    }}
                    className="p-2.5 rounded-full bg-muted hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400 transition-colors border-none cursor-pointer"
                    title="Soft Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button 
                    onClick={() => setSelectedForwarder(null)}
                    className="p-2.5 rounded-full bg-muted hover:bg-accent text-muted-foreground hover:text-foreground transition-colors border-none cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 items-start mb-8">
                  <div className="w-24 h-24 rounded-2xl bg-muted border border-border flex items-center justify-center text-muted-foreground shadow-2xl shrink-0">
                    <Truck size={32} className="text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0 pr-12">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[8px] font-mono font-bold uppercase tracking-widest">
                        <Star size={8} fill="currentColor" /> {activeForwarder.performanceRating.toFixed(1)} Rating
                      </div>
                      <span className={cn(
                        "px-2.5 py-0.5 rounded border text-[8px] font-mono font-bold uppercase tracking-widest",
                        activeForwarder.entityStatus === 'ACTIVE' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                        activeForwarder.entityStatus === 'ARCHIVED' && "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      )}>
                        {activeForwarder.entityStatus}
                      </span>
                    </div>
                    <h2 className="text-2xl font-display font-medium tracking-tight text-foreground mb-2 truncate">{activeForwarder.name}</h2>
                    <p className="text-[10px] font-mono text-muted-foreground tracking-wider mb-2">TAX: {activeForwarder.taxId || 'N/A'} • REGION: {activeForwarder.country}</p>
                    <a 
                      href={activeForwarder.website} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs text-blue-400 hover:underline flex items-center gap-1 font-mono"
                    >
                      <Globe size={10} /> {activeForwarder.website || 'No website registered'}
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-border pt-6">
                  {[
                    { label: 'Rating score', value: `★ ${activeForwarder.performanceRating.toFixed(1)}`, icon: Star, color: 'text-amber-400' },
                    { label: 'Ports Covered', value: `${(activeForwarder.preferredPorts || []).length} Ports`, icon: Anchor, color: 'text-emerald-400' },
                    { label: 'Linked Shipments', value: `${forwarderRelations.clientShipments.length} cargo`, icon: ContainerIcon, color: 'text-blue-400' },
                  ].map((stat, i) => (
                    <div key={i} className="p-4 rounded-xl bg-white/2 border border-border">
                      <stat.icon size={12} className={cn("mb-2 opacity-40", stat.color)} />
                      <p className="text-[8px] font-mono text-muted-foreground uppercase tracking-widest mb-0.5">{stat.label}</p>
                      <p className="font-sans font-bold text-xs">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Related Information Matrix Tabs */}
              <div className="glass p-8 rounded-4xl border border-border">
                <div className="flex gap-6 border-b border-border mb-6 overflow-x-auto whitespace-nowrap pb-2">
                  {[
                    { id: 'contacts', label: 'Agent Directory' },
                    { id: 'ports', label: 'Port Coverages' },
                    { id: 'history', label: 'Shipment Logs' },
                    { id: 'timeline', label: 'Activity Logs' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setDetailTab(tab.id as any)}
                      className={cn(
                        "pb-2 text-[9px] font-mono font-bold uppercase tracking-widest bg-transparent border-none cursor-pointer",
                        detailTab === tab.id 
                          ? "text-blue-500 border-b-2 border-blue-500" 
                          : "text-muted-foreground hover:text-muted-foreground"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Contacts Directory */}
                {detailTab === 'contacts' && (
                  <div className="space-y-4">
                    {(activeForwarder.contacts || []).map((c: any, idx: number) => (
                      <div key={idx} className="p-5 rounded-2xl bg-white/2 border border-border flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-sans font-bold text-sm text-foreground/90">{c.name}</span>
                            {c.isPrimary && (
                              <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[7px] rounded border border-blue-500/20 uppercase font-mono font-bold">Primary</span>
                            )}
                          </div>
                          <p className="text-[9px] font-mono text-blue-400">{c.role}</p>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono mt-2">
                            <Mail size={10} /> {c.email}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
                            <Phone size={10} /> {c.phone}
                          </div>
                        </div>
                      </div>
                    ))}
                    {(activeForwarder.contacts || []).length === 0 && (
                      <p className="text-center py-4 text-white/10 text-[9px] uppercase">No agents registered</p>
                    )}
                  </div>
                )}

                {/* Port Coverages Tab */}
                {detailTab === 'ports' && (
                  <div className="space-y-3">
                    <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-2">Preferred Ports of Operations</p>
                    <div className="flex flex-wrap gap-2">
                      {(activeForwarder.preferredPorts || []).map(portId => {
                        const portObj = ports.find(p => p.id === portId);
                        return (
                          <div key={portId} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/2 border border-border font-mono text-xs text-muted-foreground">
                            <Anchor size={12} className="text-emerald-400" />
                            <span>{portObj ? `${portObj.name} (${portObj.code})` : portId}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Shipment History */}
                {detailTab === 'history' && (
                  <div className="space-y-3 max-h-75 overflow-y-auto custom-scrollbar pr-2">
                    <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-3 font-bold">Managed Shipments</p>
                    <div className="space-y-2">
                      {forwarderRelations.clientShipments.map(shp => (
                        <div key={shp.id} className="flex justify-between items-center p-3 bg-white/2 border border-border rounded-xl text-[10px] font-mono">
                          <div>
                            <p className="font-bold text-muted-foreground">{shp.shipmentNo}</p>
                            <p className="text-[8px] text-muted-foreground">ETD: {formatDate(shp.etd)}</p>
                          </div>
                          <div className="text-right">
                            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[8px]">{shp.status}</span>
                            <p className="text-[9px] text-white/25 mt-1">{shp.originPortId} → {shp.destinationPortId}</p>
                          </div>
                        </div>
                      ))}
                      {forwarderRelations.clientShipments.length === 0 && (
                        <p className="text-center py-4 text-white/10 text-[9px] uppercase">No managed shipments</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Timeline Events & Note Logging */}
                {detailTab === 'timeline' && (
                  <div className="space-y-6">
                    {/* Live Communication Logger Input */}
                    <div className="p-4 rounded-2xl bg-white/2 border border-border space-y-3">
                      <div className="flex justify-between items-center">
                        <p className="text-[8px] font-mono text-muted-foreground uppercase tracking-wider">Log Communication</p>
                        <select
                          value={commType}
                          onChange={(e) => setCommType(e.target.value as any)}
                          className="bg-transparent border border-border rounded px-2 py-0.5 text-[9px] font-mono text-foreground/90"
                        >
                          <option value="NOTE" className="bg-background">Note</option>
                          <option value="CALL" className="bg-background">Call</option>
                          <option value="EMAIL" className="bg-background">Email</option>
                          <option value="MEETING" className="bg-background">Meeting</option>
                        </select>
                      </div>
                      <textarea
                        value={communicationNote}
                        onChange={(e) => setCommunicationNote(e.target.value)}
                        placeholder="Log cargo schedules, custom delays, vessel allocations, or ocean freight revisions..."
                        className="w-full bg-background border border-border rounded-xl p-3 text-[11px] font-mono text-foreground focus:outline-none focus:border-blue-500/50 min-h-15"
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
                    <div className="max-h-62.5 overflow-y-auto custom-scrollbar pr-2 space-y-6 relative before:absolute before:left-2.75 before:top-2 before:bottom-2 before:w-px before:bg-muted">
                      {(activeForwarder.timeline || []).map((item, idx) => (
                        <div key={item.id || idx} className="relative pl-8">
                          <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center z-10 text-blue-400">
                            {item.type === 'CREATED' && <Truck size={10} />}
                            {item.type === 'UPDATED' && <Edit3 size={10} />}
                            {item.type === 'ARCHIVED' && <Archive size={10} />}
                            {item.type === 'RESTORED' && <RefreshCcw size={10} />}
                            {item.type === 'RATING_CHANGED' && <Star size={10} />}
                            {item.type === 'PORT_ADDED' && <Anchor size={10} />}
                            {item.type === 'STATUS_CHANGED' && <Activity size={10} />}
                            {item.type === 'COMMUNICATION_LOGGED' && <MessageSquare size={10} />}
                          </div>
                          <p className="text-[8px] font-mono text-muted-foreground uppercase mb-0.5">{formatDate(item.date)}</p>
                          <p className="text-xs font-bold text-foreground/90 mb-0.5">{item.title}</p>
                          <p className="text-[10px] text-muted-foreground leading-relaxed font-sans">{item.description}</p>
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

      {/* Onboard Agency Drawer overlay */}
      <AnimatePresence>
        {showFormDrawer && (
          <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass border border-border rounded-[2.5rem] p-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex justify-between items-center border-b border-border pb-4 mb-6">
                <h3 className="text-2xl font-display font-medium flex items-center gap-3">
                  <Truck className="text-blue-500" /> {formMode === 'create' ? 'Onboard New Logistics Agency' : 'Modify Agency Profile'}
                </h3>
                <button onClick={() => setShowFormDrawer(false)} className="p-2 rounded bg-muted hover:bg-accent text-muted-foreground hover:text-foreground border-none cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              {/* Validation errors */}
              {formErrors.length > 0 && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl mb-6 space-y-1">
                  <p className="text-xs font-mono font-bold text-rose-400 flex items-center gap-2">
                    <AlertCircle size={14} /> Agency onboarding constraints violated:
                  </p>
                  <ul className="list-disc list-inside text-[10px] font-mono text-rose-300">
                    {formErrors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Form Navigation Tabs */}
              <div className="flex gap-4 border-b border-border mb-6 overflow-x-auto whitespace-nowrap pb-2 text-[9px] font-mono font-bold uppercase">
                {[
                  { id: 'general', label: '1. General Info' },
                  { id: 'ports', label: '2. Port Coverage' },
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
                        : "text-muted-foreground hover:text-muted-foreground"
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
                        <label className="text-[9px] font-mono text-muted-foreground uppercase block">Logistics Agency Name</label>
                        <input 
                          type="text" 
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-background border border-border rounded-xl py-3 px-4 text-xs font-mono text-foreground focus:outline-none focus:border-blue-500/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-mono text-muted-foreground uppercase block">Booking Email</label>
                        <input 
                          type="email" 
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-background border border-border rounded-xl py-3 px-4 text-xs font-mono text-foreground focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="md:col-span-1 space-y-2">
                        <label className="text-[9px] font-mono text-muted-foreground uppercase block">Telephone Number</label>
                        <input 
                          type="text" 
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-background border border-border rounded-xl py-3 px-4 text-xs font-mono text-foreground focus:outline-none"
                        />
                      </div>
                      <div className="md:col-span-1 space-y-2">
                        <label className="text-[9px] font-mono text-muted-foreground uppercase block">Country</label>
                        <input 
                          type="text" 
                          required
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="w-full bg-background border border-border rounded-xl py-3 px-4 text-xs font-mono text-foreground focus:outline-none"
                        />
                      </div>
                      <div className="md:col-span-1 space-y-2">
                        <label className="text-[9px] font-mono text-muted-foreground uppercase block">Tax ID / Reg</label>
                        <input 
                          type="text" 
                          value={taxId}
                          onChange={(e) => setTaxId(e.target.value)}
                          className="w-full bg-background border border-border rounded-xl py-3 px-4 text-xs font-mono text-foreground focus:outline-none"
                          placeholder="e.g. TAX-123"
                        />
                      </div>
                      <div className="md:col-span-1 space-y-2">
                        <label className="text-[9px] font-mono text-muted-foreground uppercase block">Status</label>
                        <select 
                          value={status}
                          onChange={(e) => setStatus(e.target.value)}
                          className="w-full bg-background border border-border rounded-xl py-3 px-4 text-xs font-mono text-foreground focus:outline-none appearance-none"
                        >
                          <option value="ACTIVE">Active</option>
                          <option value="INACTIVE">Inactive</option>
                          <option value="ARCHIVED">Archived</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[9px] font-mono text-muted-foreground uppercase block">Agency Website URL</label>
                        <input 
                          type="text" 
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          className="w-full bg-background border border-border rounded-xl py-3 px-4 text-xs font-mono text-foreground focus:outline-none"
                          placeholder="e.g. https://www.agency.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-mono text-muted-foreground uppercase block">Performance Rating Score (1.0 to 5.0)</label>
                        <input 
                          type="number" 
                          step="0.1"
                          value={rating}
                          onChange={(e) => setRating(Number(e.target.value))}
                          className="w-full bg-background border border-border rounded-xl py-3 px-4 text-xs font-mono text-foreground focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-mono text-muted-foreground uppercase block">Office Address Details</label>
                      <textarea 
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl py-3 px-4 text-xs font-mono text-foreground focus:outline-none min-h-20" 
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-mono text-muted-foreground uppercase block">General Operations Notes</label>
                      <textarea 
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl py-3 px-4 text-xs font-mono text-foreground focus:outline-none min-h-20" 
                      />
                    </div>
                  </div>
                )}

                {/* 2. Ports Tab */}
                {formTab === 'ports' && (
                  <div className="space-y-4">
                    <span className="text-[9px] font-mono text-muted-foreground uppercase block mb-2">Preferred Ports Covered</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {ports.map(port => (
                        <button
                          key={port.id}
                          type="button"
                          onClick={() => handleTogglePort(port.id)}
                          className={cn(
                            "flex items-center gap-2 p-3.5 rounded-xl border text-[11px] font-mono text-left transition-all",
                            preferredPorts.includes(port.id) 
                              ? "bg-blue-500/10 border-blue-500 text-blue-400" 
                              : "bg-muted border-border text-muted-foreground hover:bg-accent"
                          )}
                        >
                          <Anchor size={12} className={preferredPorts.includes(port.id) ? "text-blue-400" : "opacity-30"} />
                          <div>
                            <p className="font-bold">{port.name}</p>
                            <p className="text-[9px] opacity-60">{port.code}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Contacts Matrix tab */}
                {formTab === 'contacts' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">Associated Agents / Port Managers</span>
                      <button 
                        type="button"
                        onClick={handleAddContact}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-muted border border-border rounded-lg text-[9px] font-mono uppercase text-foreground/90 hover:bg-accent"
                      >
                        <Plus size={12} /> Add Contact
                      </button>
                    </div>

                    <div className="space-y-4">
                      {formContacts.map((contact, idx) => (
                        <div key={idx} className="p-5 rounded-2xl bg-background border border-border relative space-y-4 font-mono">
                          {formContacts.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveContact(idx)}
                              className="absolute top-4 right-4 text-muted-foreground hover:text-rose-400 bg-transparent border-none cursor-pointer"
                            >
                              <X size={14} />
                            </button>
                          )}
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[8px] font-mono text-muted-foreground uppercase">Contact Name</label>
                              <input 
                                type="text"
                                required
                                value={contact.name}
                                onChange={(e) => handleContactChange(idx, 'name', e.target.value)}
                                className="w-full bg-background border border-border rounded-lg p-2.5 text-xs text-foreground font-mono focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[8px] font-mono text-muted-foreground uppercase">Corporate Role</label>
                              <input 
                                type="text"
                                value={contact.role}
                                onChange={(e) => handleContactChange(idx, 'role', e.target.value)}
                                className="w-full bg-background border border-border rounded-lg p-2.5 text-xs text-foreground font-mono focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[8px] font-mono text-muted-foreground uppercase">Email Address</label>
                              <input 
                                type="email"
                                value={contact.email}
                                onChange={(e) => handleContactChange(idx, 'email', e.target.value)}
                                className="w-full bg-background border border-border rounded-lg p-2.5 text-xs text-foreground font-mono focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[8px] font-mono text-muted-foreground uppercase">Mobile Number</label>
                              <input 
                                type="text"
                                value={contact.phone}
                                onChange={(e) => handleContactChange(idx, 'phone', e.target.value)}
                                className="w-full bg-background border border-border rounded-lg p-2.5 text-xs text-foreground font-mono focus:outline-none"
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
                            <label htmlFor={`contact-primary-${idx}`} className="text-[9px] font-mono text-muted-foreground cursor-pointer">Mark as Primary Agency Contact</label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-6 border-t border-border flex justify-end gap-4">
                  <button 
                    type="button" 
                    onClick={() => setShowFormDrawer(false)}
                    className="px-6 py-3 bg-muted border border-border rounded-xl text-[10px] font-mono uppercase tracking-widest hover:bg-accent border-none cursor-pointer text-foreground"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-8 py-3 bg-blue-500 text-black font-bold rounded-xl text-[10px] font-mono uppercase tracking-widest hover:bg-blue-400 border-none cursor-pointer"
                  >
                    {formMode === 'create' ? 'Onboard Agency' : 'Save Profile'}
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

// Simple Container icon fallback
function ContainerIcon({ size = 16, className = '' }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={cn("lucide lucide-container", className)}
      style={{ width: size, height: size }}
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M3 9h18" />
      <path d="M3 15h18" />
      <path d="M9 3v18" />
      <path d="M15 3v18" />
    </svg>
  );
}

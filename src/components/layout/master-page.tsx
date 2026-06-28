'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  Menu, 
  X, 
  ChevronRight, 
  Download, 
  FileText, 
  Settings,
  HelpCircle,
  LogOut,
  User,
  LayoutDashboard,
  Package,
  Calculator,
  Ship,
  Users,
  Building2,
  Calendar,
  CheckCircle2,
  ListTodo,
  Truck,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';

interface MasterPageProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  loading?: boolean;
  onExport?: () => void;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
}

export function MasterPage({ 
  children, 
  title, 
  subtitle, 
  loading, 
  onExport,
  searchValue,
  onSearchChange
}: MasterPageProps) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Quotations', href: '/quotations', icon: FileText },
    { label: 'Sales Orders', href: '/sales-orders', icon: CheckCircle2 },
    { label: 'Purchase Orders', href: '/purchase-orders', icon: Package },
    { label: 'Shipments', href: '/shipments', icon: Ship },
    { label: 'Master Data', href: '/products', icon: Package },
    { label: 'CRM', href: '/customers', icon: Users },
    { label: 'Vendors', href: '/suppliers', icon: Building2 },
    { label: 'Forwarders', href: '/forwarders', icon: Truck },
    { label: 'Costing', href: '/costing', icon: Calculator },
    { label: 'Documents', href: '/documents', icon: FileText },
    { label: 'Calendar', href: '/calendar', icon: Calendar },
    { label: 'Tasks', href: '/tasks', icon: ListTodo },
    { label: 'Reports', href: '/reports', icon: BarChart3 },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  const [searchFocused, setSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    products: any[],
    customers: any[],
    shipments: any[],
    documents: any[],
    quotations: any[],
    salesOrders: any[],
    purchaseOrders: any[],
    tasks: any[]
  }>({
    products: [],
    customers: [],
    shipments: [],
    documents: [],
    quotations: [],
    salesOrders: [],
    purchaseOrders: [],
    tasks: []
  });

  React.useEffect(() => {
    if (!searchValue) {
      setSearchResults({
        products: [],
        customers: [],
        shipments: [],
        documents: [],
        quotations: [],
        salesOrders: [],
        purchaseOrders: [],
        tasks: []
      });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchValue)}`);
        const json = await res.json();
        setSearchResults(json);
      } catch (e) {
        console.error('Search sync failed');
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue]);

  return (
    <div className="flex min-h-screen bg-[#080808] text-white">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 flex flex-col fixed inset-y-0 z-50 bg-[#0a0a0a]">
        <div className="p-8 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center font-bold text-black italic text-sm">EX</div>
            <div>
              <p className="text-xs font-display font-bold tracking-tight">EXLOGIS</p>
              <p className="text-[8px] font-mono text-blue-500/40 uppercase tracking-[0.2em]">Matrix ERP</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest transition-all group",
                pathname === item.href 
                  ? "bg-white/5 text-white" 
                  : "text-white/70 hover:text-white/70 hover:bg-white/2"
              )}
            >
              <item.icon size={14} className={cn(
                "transition-colors",
                pathname === item.href ? "text-blue-500" : "group-hover:text-blue-400"
              )} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 mt-auto border-t border-white/5">
          <div className="p-4 rounded-2xl bg-white/2 border border-white/5">
            <p className="text-[10px] font-mono text-white/70 uppercase tracking-widest mb-3">System Health</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              <p className="text-[10px] font-medium text-emerald-500/80 uppercase">Synchronized</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen flex flex-col">
        {/* Top Header */}
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-[#080808]/80 backdrop-blur-xl sticky top-0 z-60">
          <div className="flex items-center gap-8 flex-1">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70" size={16} />
              <input 
                type="text" 
                placeholder="Global Command (Cmd + K)" 
                className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:border-blue-500/40 transition-all font-mono"
                value={searchValue}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                onChange={(e) => onSearchChange?.(e.target.value)}
              />

              {/* Search Results Matrix */}
              <AnimatePresence>
                {searchFocused && searchValue && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full mt-2 w-[500px] glass border border-white/10 rounded-2xl p-6 shadow-2xl z-70 overflow-hidden"
                  >
                    <div className="space-y-6 max-h-[400px] overflow-y-auto custom-scrollbar">
                      {searchResults.products.length > 0 && (
                        <div>
                          <p className="text-[9px] font-mono text-white/70 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Package size={10} /> Products
                          </p>
                          <div className="space-y-0.5">
                            {searchResults.products.map(p => (
                              <Link key={p.id} href={`/products?id=${p.id}`} className="flex justify-between items-center p-2 rounded-lg hover:bg-white/5 transition-colors group">
                                <span className="text-xs text-white/80 group-hover:text-white">{p.name}</span>
                                <span className="text-[9px] font-mono text-white/70 uppercase tracking-tighter">{p.sku}</span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                      {searchResults.customers.length > 0 && (
                        <div>
                          <p className="text-[9px] font-mono text-white/70 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Users size={10} /> Customers
                          </p>
                          <div className="space-y-0.5">
                            {searchResults.customers.map(c => (
                              <Link key={c.id} href={`/customers?id=${c.id}`} className="flex justify-between items-center p-2 rounded-lg hover:bg-white/5 transition-colors group">
                                <span className="text-xs text-white/80 group-hover:text-white">{c.name}</span>
                                <span className="text-[9px] font-mono text-white/70 uppercase tracking-tighter">{c.country}</span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                      {searchResults.shipments.length > 0 && (
                        <div>
                          <p className="text-[9px] font-mono text-white/70 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Ship size={10} /> Shipments
                          </p>
                          <div className="space-y-0.5">
                            {searchResults.shipments.map(s => (
                              <Link key={s.id} href={`/shipments/${s.id}`} className="flex justify-between items-center p-2 rounded-lg hover:bg-white/5 transition-colors group">
                                <span className="text-xs text-white/80 group-hover:text-white">{s.shipmentNo}</span>
                                <span className="text-[9px] font-mono text-white/70 uppercase tracking-tighter">{s.status}</span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                      {searchResults.quotations.length > 0 && (
                        <div>
                          <p className="text-[9px] font-mono text-white/70 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <FileText size={10} /> Quotations
                          </p>
                          <div className="space-y-0.5">
                            {searchResults.quotations.map(q => (
                              <Link key={q.id} href={`/quotations/${q.id}`} className="flex justify-between items-center p-2 rounded-lg hover:bg-white/5 transition-colors group">
                                <span className="text-xs text-white/80 group-hover:text-white">{q.quotationNo}</span>
                                <span className="text-[9px] font-mono text-white/70 uppercase tracking-tighter">{q.status}</span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                      {searchResults.salesOrders.length > 0 && (
                        <div>
                          <p className="text-[9px] font-mono text-white/70 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <CheckCircle2 size={10} /> Sales Orders
                          </p>
                          <div className="space-y-0.5">
                            {searchResults.salesOrders.map(so => (
                              <Link key={so.id} href={`/sales-orders/${so.id}`} className="flex justify-between items-center p-2 rounded-lg hover:bg-white/5 transition-colors group">
                                <span className="text-xs text-white/80 group-hover:text-white">{so.orderNo}</span>
                                <span className="text-[9px] font-mono text-white/70 uppercase tracking-tighter">{so.status}</span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                      {searchResults.purchaseOrders.length > 0 && (
                        <div>
                          <p className="text-[9px] font-mono text-white/70 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Package size={10} /> Purchase Orders
                          </p>
                          <div className="space-y-0.5">
                            {searchResults.purchaseOrders.map(po => (
                              <Link key={po.id} href={`/purchase-orders/${po.id}`} className="flex justify-between items-center p-2 rounded-lg hover:bg-white/5 transition-colors group">
                                <span className="text-xs text-white/80 group-hover:text-white">{po.poNo}</span>
                                <span className="text-[9px] font-mono text-white/70 uppercase tracking-tighter">{po.status}</span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                      {searchResults.documents.length > 0 && (
                        <div>
                          <p className="text-[9px] font-mono text-white/70 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <FileText size={10} /> Digital Assets
                          </p>
                          <div className="space-y-0.5">
                            {searchResults.documents.map(d => (
                              <Link key={d.id} href={`/documents`} className="flex justify-between items-center p-2 rounded-lg hover:bg-white/5 transition-colors group">
                                <span className="text-xs text-white/80 group-hover:text-white">{d.name}</span>
                                <span className="text-[9px] font-mono text-white/70 uppercase tracking-tighter">{d.type}</span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                      {searchResults.tasks.length > 0 && (
                        <div>
                          <p className="text-[9px] font-mono text-white/70 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <ListTodo size={10} /> Operations
                          </p>
                          <div className="space-y-0.5">
                            {searchResults.tasks.map(t => (
                              <Link key={t.id} href={`/tasks`} className="flex justify-between items-center p-2 rounded-lg hover:bg-white/5 transition-colors group">
                                <span className="text-xs text-white/80 group-hover:text-white">{t.title}</span>
                                <span className="text-[9px] font-mono text-white/70 uppercase tracking-tighter">{t.priority}</span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {Object.values(searchResults).every(arr => arr.length === 0) && (
                        <div className="text-center py-6 text-xs text-white/70 font-mono uppercase tracking-widest">
                          No Matrix Nodes Found
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/notifications">
              <button className="p-3 rounded-xl bg-white/5 border border-white/5 text-white/70 hover:text-white hover:bg-white/10 transition-all relative">
                <Bell size={18} />
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
              </button>
            </Link>
            
            <div className="flex items-center gap-4 pl-6 border-l border-white/10">
              <div className="text-right">
                <p className="text-xs font-medium">Administrator</p>
                <p className="text-[9px] font-mono text-blue-500/60 uppercase tracking-tighter">SPRINT 8 RELEASE RC</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500/20 to-violet-500/20 border border-white/10 flex items-center justify-center font-mono text-xs text-white/70">
                AD
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-10 flex-1 relative z-0">
          <div className="mb-12 flex justify-between items-end">
            <div>
              <p className="text-[10px] font-mono text-blue-500 uppercase tracking-[0.3em] mb-3">ExLogis / {pathname.split('/')[1] || 'Dashboard'}</p>
              <h2 className="text-4xl font-display font-medium tracking-tight mb-2">{title}</h2>
              {subtitle && <p className="text-sm text-white/80">{subtitle}</p>}
            </div>
            {onExport && (
              <button 
                onClick={onExport}
                className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-white/10 transition-colors"
              >
                <Download size={16} /> Export Matrix
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[10px] font-mono text-white/70 uppercase tracking-widest">Processing Matrix...</p>
            </div>
          ) : children}
        </div>
      </main>
    </div>
  );
}

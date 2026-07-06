'use client';

import React, { useState } from 'react';
import { 
  Bell, 
  Menu, 
  X, 
  ChevronRight, 
  ChevronLeft,
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
  BarChart3,
  Hexagon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { useSession, signOut } from 'next-auth/react';
import { NotificationBell } from './NotificationBell';
import { GlobalSearch } from './GlobalSearch';
import { usePageHeader } from './page-context';

interface MasterPageProps {
  children: React.ReactNode;
}

export function MasterPage({ 
  children,
}: MasterPageProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [sidebarPinned, setSidebarPinned] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const sidebarOpen = sidebarPinned || sidebarHovered;
  const { title: pageTitle, subtitle } = usePageHeader();

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

  return (
    <div className="h-screen w-full bg-[#080808] text-white flex font-sans overflow-hidden selection:bg-blue-500/30">
      
      {/* Sidebar Navigation */}
      <motion.aside 
        initial={{ width: 80 }}
        animate={{ width: sidebarOpen ? 280 : 80 }}
        onMouseLeave={() => setSidebarHovered(false)}
        className="glass border-r border-white/5 hidden md:flex flex-col relative z-20 h-screen top-0"
      >
        <div 
          className="p-5 flex items-center gap-3 cursor-pointer"
          onMouseEnter={() => setSidebarHovered(true)}
        >
          <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-blue-600 to-indigo-600 shadow-[0_0_15px_rgba(37,99,235,0.5)] flex items-center justify-center shrink-0">
            <Hexagon size={16} className="text-white fill-white/20" />
          </div>
          {sidebarOpen && (
            <motion.span 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="font-display font-bold tracking-tight text-lg"
            >
              ExLogis
            </motion.span>
          )}
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href) && item.href !== '/' || pathname === item.href;
            return (
              <Link key={item.label} href={item.href} title={!sidebarOpen ? item.label : undefined}>
                <div className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-xl transition-all group relative overflow-hidden",
                  isActive ? "bg-white/10 text-white shadow-lg" : "text-white/60 hover:text-white hover:bg-white/5"
                )}>
                  {isActive && (
                    <motion.div layoutId="active-indicator" className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                  )}
                  <item.icon size={18} className={cn("shrink-0", isActive ? "text-blue-400" : "group-hover:text-white/90 transition-colors")} />
                  {sidebarOpen && (
                    <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto">
          <button 
            onClick={() => setSidebarPinned(!sidebarPinned)}
            className="w-full flex items-center justify-center p-3 rounded-xl bg-white/5 border border-white/5 text-white/50 hover:text-white/90 hover:bg-white/10 transition-colors"
            title={sidebarPinned ? "Unpin Sidebar" : "Pin Sidebar"}
          >
            {sidebarPinned ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none"></div>
        
        {/* Top Header */}
        <header className="h-20 px-8 flex items-center justify-between border-b border-white/5 glass z-10 shrink-0">
          <div>
            {/* Logo area or empty space for navbar layout */}
            <h1 className="text-lg font-display font-medium text-white/50 tracking-widest uppercase">ExLogis Global</h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden lg:block z-50">
              <GlobalSearch />
            </div>

            <NotificationBell />
            
            <div className="flex items-center gap-4 pl-6 border-l border-white/10">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{session?.user?.name || 'Commander'}</p>
                <p className="text-[10px] font-mono text-blue-400 uppercase tracking-widest">Global Admin</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-linear-to-tr from-blue-500 to-indigo-600 p-0.5 shadow-lg relative cursor-pointer" onClick={() => signOut({ callbackUrl: '/login' })}>
                <div className="w-full h-full bg-[#080808] rounded-full border-2 border-[#080808] overflow-hidden">
                  <div className="w-full h-full bg-white/10 flex items-center justify-center">
                    <User size={16} className="text-white/80" />
                  </div>
                </div>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-[#080808]"></div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Scrollable Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 relative z-0">
          <AnimatePresence mode="wait">
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="max-w-7xl mx-auto h-full"
              >
                <div className="mb-12 flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-mono text-blue-500 uppercase tracking-[0.3em] mb-3">ExLogis / {pathname.split('/')[1] || 'Dashboard'}</p>
                    <h2 className="text-4xl font-display font-medium tracking-tight mb-2">{pageTitle}</h2>
                    {subtitle && <p className="text-sm text-white/80">{subtitle}</p>}
                  </div>
                </div>
                {children}
              </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

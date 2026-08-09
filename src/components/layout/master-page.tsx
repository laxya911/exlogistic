'use client';

import { useMemo, ReactNode, useState, useEffect } from 'react';
import { 
  Bell, 
  Menu, 
  X, 
  Grid3X3,
  User,
  Hexagon,
  Sun,
  Moon,
  LogOut,
  Settings,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { useSession, signOut } from 'next-auth/react';
import { NotificationBell } from './NotificationBell';
import { GlobalSearch } from './GlobalSearch';
import { usePageHeader } from './page-context';
import { useTheme } from 'next-themes';

interface MasterPageProps {
  children: ReactNode;
}

const MODULES = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    triggerPaths: ['/dashboard'],
    links: [{ label: 'Overview', href: '/dashboard' }]
  },
  {
    id: 'sales',
    label: 'Sales',
    triggerPaths: ['/sales-orders', '/quotations', '/customers'],
    links: [
      { label: 'Quotations', href: '/quotations' },
      { label: 'Sales Orders', href: '/sales-orders' },
      { label: 'Customers', href: '/customers' },
    ]
  },
  {
    id: 'purchases',
    label: 'Purchase',
    triggerPaths: ['/purchase-orders', '/suppliers'],
    links: [
      { label: 'Purchase Orders', href: '/purchase-orders' },
      { label: 'Vendors', href: '/suppliers' },
    ]
  },
  {
    id: 'inventory',
    label: 'Inventory',
    triggerPaths: ['/products', '/inventory'],
    links: [
      { label: 'Products', href: '/products' },
      { label: 'Warehouses', href: '/inventory/warehouses' },
      { label: 'Attributes', href: '/products/attributes' },
    ]
  },
  {
    id: 'logistics',
    label: 'Logistics',
    triggerPaths: ['/shipments', '/forwarders', '/costing'],
    links: [
      { label: 'Shipments', href: '/shipments' },
      { label: 'Forwarders', href: '/forwarders' },
      { label: 'Costing', href: '/costing' },
    ]
  },
  {
    id: 'documents',
    label: 'Documents',
    triggerPaths: ['/documents'],
    links: [
      { label: 'All Documents', href: '/documents' }
    ]
  },
  {
    id: 'settings',
    label: 'Settings',
    triggerPaths: ['/settings'],
    links: [
      { label: 'General', href: '/settings' },
      { label: 'Users', href: '/settings/users' },
      { label: 'Organization', href: '/settings/organization' },
      { label: 'Security', href: '/settings/security' }
    ]
  }
];

export function MasterPage({ children }: MasterPageProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { title: pageTitle, subtitle } = usePageHeader();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Avatar Dropdown State
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLauncher = pathname === '/launcher';

  const isAdmin = (session?.user as any)?.isAdmin;
  const accessibleModules = useMemo(() => {
    return isAdmin ? MODULES : MODULES.filter(m => m.id !== 'settings');
  }, [isAdmin]);

  const activeModule = useMemo(() => {
    return accessibleModules.find(m => m.triggerPaths.some(p => pathname.startsWith(p))) || accessibleModules[0];
  }, [pathname, accessibleModules]);

  return (
    <div className="h-screen w-full bg-(--background) text-(--text-primary) flex flex-col font-sans overflow-hidden selection:bg-blue-500/30">
      
      {/* Top Header Navbar */}
      <header className="h-(--header-height) px-4 flex items-center justify-between border-b border-(--surface-border) glass z-20 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/launcher" className="p-2 hover:bg-(--surface-hover) rounded-lg transition-colors group">
            <Grid3X3 className="text-(--text-secondary) group-hover:text-(--text-primary)" size={20} />
          </Link>

          {!isLauncher && (
            <>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold tracking-tight text-lg mr-4">{activeModule.label}</span>
              </div>
              <nav className="hidden md:flex items-center gap-1">
                {activeModule.links.map(link => {
                  const isActive = pathname.startsWith(link.href) && (link.href !== '/' || pathname === link.href);
                  return (
                    <Link key={link.href} href={link.href} className={cn("nav-link", isActive && "nav-link-active")}>
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            </>
          )}
          {isLauncher && (
            <h1 className="text-lg font-display font-medium text-(--text-muted) tracking-widest uppercase">ExLogis Global Launcher</h1>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:block z-50">
            <GlobalSearch />
          </div>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg hover:bg-(--surface-hover) transition-colors cursor-pointer border-none bg-transparent"
            title="Toggle theme"
          >
            {mounted ? (
              theme === 'dark' ? (
                <Sun size={18} className="text-(--text-secondary) hover:text-(--text-primary)" />
              ) : (
                <Moon size={18} className="text-(--text-secondary) hover:text-(--text-primary)" />
              )
            ) : (
              <div className="w-4.5 h-4.5" />
            )}
          </button>
          <NotificationBell />
          {/* Avatar Dropdown */}
          <div className="relative">
            <div 
              className="w-8 h-8 rounded-full bg-linear-to-tr from-blue-500 to-indigo-600 p-0.5 shadow-lg relative cursor-pointer" 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              <div className="w-full h-full bg-(--background) rounded-full flex items-center justify-center overflow-hidden text-[10px] font-bold font-mono text-(--text-primary)">
                {session?.user?.name ? (
                  session.user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                ) : (
                  <User size={14} className="text-(--text-secondary)" />
                )}
              </div>
            </div>

            <AnimatePresence>
              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-3 w-56 glass border border-(--border) rounded-2xl shadow-xl z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-(--border) bg-white/5">
                      <p className="text-sm font-sans font-bold text-(--text-primary) truncate">{session?.user?.name || 'User'}</p>
                      <p className="text-[10px] font-mono text-(--text-secondary) truncate">{session?.user?.email}</p>
                    </div>
                    <div className="p-2 space-y-1">
                      <Link href="/profile" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-(--surface-hover) text-xs font-mono text-(--text-secondary) hover:text-(--text-primary) transition-colors cursor-pointer">
                        <Settings size={14} /> Profile Settings
                      </Link>
                      {isAdmin && (
                        <Link href="/settings/users" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-(--surface-hover) text-xs font-mono text-(--text-secondary) hover:text-(--text-primary) transition-colors cursor-pointer">
                          <Shield size={14} /> Administration
                        </Link>
                      )}
                    </div>
                    <div className="p-2 border-t border-(--border)">
                      <button 
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-rose-500/10 text-xs font-mono text-rose-400 transition-colors border-none cursor-pointer bg-transparent"
                      >
                        <LogOut size={14} /> Log Out
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 min-h-0 relative">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-(--page-padding) relative z-0 min-h-0">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="max-w-360 mx-auto min-h-full"
          >
            {!isLauncher && pageTitle && (
              <div className="mb-8 flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-mono text-blue-500 uppercase tracking-[0.3em] mb-2">{activeModule.label} / {pageTitle}</p>
                  <h2 className="text-3xl font-display font-medium tracking-tight mb-1">{pageTitle}</h2>
                  {subtitle && <p className="text-sm text-(--text-secondary)">{subtitle}</p>}
                </div>
              </div>
            )}
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}

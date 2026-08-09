'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { 
  LayoutDashboard,
  ShoppingCart,
  PackageSearch,
  Box,
  Ship,
  FileText,
  Settings,
  Calculator,
  Users
} from 'lucide-react';
import { usePageHeader } from '@/components/layout/page-context';

export default function LauncherPage() {
  const { setTitle, setSubtitle } = usePageHeader();

  React.useEffect(() => {
    setTitle('ExLogis Global');
    setSubtitle('Enterprise App Launcher');
  }, [setTitle, setSubtitle]);

  const apps = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', color: 'from-blue-400 to-blue-600', shadow: 'shadow-blue-500/20' },
    { name: 'Sales', icon: ShoppingCart, href: '/sales-orders', color: 'from-emerald-400 to-emerald-600', shadow: 'shadow-emerald-500/20' },
    { name: 'Purchase', icon: PackageSearch, href: '/purchase-orders', color: 'from-indigo-400 to-indigo-600', shadow: 'shadow-indigo-500/20' },
    { name: 'Inventory', icon: Box, href: '/products', color: 'from-purple-400 to-purple-600', shadow: 'shadow-purple-500/20' },
    { name: 'Logistics', icon: Ship, href: '/shipments', color: 'from-cyan-400 to-cyan-600', shadow: 'shadow-cyan-500/20' },
    { name: 'CRM', icon: Users, href: '/customers', color: 'from-amber-400 to-orange-600', shadow: 'shadow-orange-500/20' },
    { name: 'Documents', icon: FileText, href: '/documents', color: 'from-slate-400 to-slate-600', shadow: 'shadow-slate-500/20' },
    { name: 'Settings', icon: Settings, href: '/settings', color: 'from-zinc-500 to-zinc-700', shadow: 'shadow-zinc-500/20' },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8 max-w-5xl"
      >
        {apps.map((app, index) => (
          <Link key={app.name} href={app.href} className="group flex flex-col items-center gap-3">
            <motion.div 
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              className={`w-24 h-24 rounded-2xl bg-linear-to-tr ${app.color} flex items-center justify-center shadow-lg ${app.shadow} transition-all duration-300 group-hover:shadow-2xl border border-border`}
            >
              <app.icon size={36} className="text-white drop-shadow-md" strokeWidth={1.5} />
            </motion.div>
            <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors tracking-wide">
              {app.name}
            </span>
          </Link>
        ))}
      </motion.div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { motion } from 'motion/react';
import { ArrowRight, Globe, Shield, Zap, Terminal, Settings, Users, Coins, Moon, Sun } from 'lucide-react';

export default function LandingPage() {
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden selection:bg-blue-500/30">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-200 h-200 bg-blue-600/10 rounded-full blur-[120px] dark:mix-blend-screen transform -translate-y-1/2" />
        <div className="absolute bottom-0 right-1/4 w-150 h-150 bg-emerald-600/10 rounded-full blur-[100px] dark:mix-blend-screen transform translate-y-1/2" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-30 dark:opacity-100 [mask-image:linear-gradient(180deg,black,rgba(0,0,0,0))] dark:[mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      </div>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-linear-to-tr from-blue-600 to-emerald-400 rotate-12 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <div className="w-3 h-3 bg-white rounded-sm -rotate-12" />
            </div>
            <span className="font-display font-medium tracking-tight text-xl">ExLogis</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Platform</a>
            <a href="#" className="hover:text-foreground transition-colors">Features</a>
            <a href="#" className="hover:text-foreground transition-colors">Security</a>
          </nav>

          <div className="flex items-center gap-4">
            {mounted && (
              <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            )}
            {status === 'loading' ? (
              <div className="w-24 h-10 bg-muted rounded-xl animate-pulse" />
            ) : session ? (
              <Link href="/dashboard">
                <button className="px-5 py-2.5 rounded-xl bg-muted border border-border text-sm font-medium hover:bg-accent transition-all flex items-center gap-2 text-foreground cursor-pointer">
                  Dashboard <ArrowRight size={14} />
                </button>
              </Link>
            ) : (
              <Link href="/login">
                <button className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] cursor-pointer">
                  Sign In
                </button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto mt-20 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted border border-border text-xs font-mono text-emerald-500 mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            RBAC & SETTINGS MODULES LIVE
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl md:text-7xl font-display font-medium tracking-tight mb-8 leading-[1.1]"
          >
            The Intelligent <br/>
            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-500 via-cyan-400 to-emerald-500">
              Export Operations Core
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12"
          >
            A dynamic ERP platform built for modern global trade. Featuring deep configuration engines, multi-currency financials, and enterprise-grade access controls.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            {session ? (
              <Link href="/dashboard">
                <button className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_40px_rgba(37,99,235,0.5)] flex items-center justify-center gap-2 cursor-pointer">
                  Launch Platform <ArrowRight size={18} />
                </button>
              </Link>
            ) : (
              <Link href="/login">
                <button className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-blue-600 text-white hover:bg-blue-500 font-medium transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_40px_rgba(37,99,235,0.5)] flex items-center justify-center gap-2 cursor-pointer">
                  Access Platform <ArrowRight size={18} />
                </button>
              </Link>
            )}
            <button className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-muted border border-border hover:bg-accent text-foreground font-medium transition-all flex items-center justify-center gap-2 cursor-pointer">
              <Terminal size={18} /> View API Docs
            </button>
          </motion.div>
        </div>

        {/* Feature Grid */}
        <div className="max-w-7xl mx-auto mt-40">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="bg-(--surface) p-8 rounded-4xl border border-border shadow-sm hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-6 group-hover:scale-110 transition-transform">
                <Settings size={24} />
              </div>
              <h3 className="text-xl font-medium mb-3">Dynamic Settings</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Centralized management for business rules, organizational identities, and UI preferences across your entire enterprise.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="bg-(--surface) p-8 rounded-4xl border border-border shadow-sm hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-6 group-hover:scale-110 transition-transform">
                <Users size={24} />
              </div>
              <h3 className="text-xl font-medium mb-3">Enterprise RBAC</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Secure your operations with strict Role-Based Access Control, permission matrices, and departmental segmentation.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="bg-(--surface) p-8 rounded-4xl border border-border shadow-sm hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-6 group-hover:scale-110 transition-transform">
                <Coins size={24} />
              </div>
              <h3 className="text-xl font-medium mb-3">Global Financials</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Natively handle multi-currency configurations and dynamic tax matrices customized to national and international markets.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="bg-(--surface) p-8 rounded-4xl border border-border shadow-sm hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-500 mb-6 group-hover:scale-110 transition-transform">
                <Globe size={24} />
              </div>
              <h3 className="text-xl font-medium mb-3">Logistics Ready</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Manage container types, Incoterms, and measurement units via a unified reference data manager ready for scale.
              </p>
            </motion.div>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-12 mt-20 bg-(--background)">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm font-mono text-muted-foreground">© 2026 ExLogis ERP. All rights reserved.</p>
          <div className="flex items-center gap-6 text-sm font-mono text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">System Status</a>
          </div>
        </div>
      </footer>

    </div>
  );
}

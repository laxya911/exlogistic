'use client';

import React, { useState } from 'react';
import { 
  Settings, 
  Building2, 
  Globe, 
  CreditCard, 
  ShieldCheck, 
  Bell, 
  Users, 
  Database,
  Lock,
  AppWindow,
  Languages,
  DollarSign,
  Anchor,
  Truck,
  Box,
  Hash
} from 'lucide-react';
import { motion } from 'motion/react';
import { MasterPage } from '@/components/layout/master-page';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('organization');

  const tabs = [
    { id: 'organization', label: 'Organization', icon: Building2 },
    { id: 'business-rules', label: 'Business Rules', icon: ShieldCheck },
    { label: 'System Prefs', id: 'system', icon: AppWindow },
    { id: 'logistics', label: 'Logistics Matrix', icon: Truck },
    { id: 'notifications', label: 'Neural Alerts', icon: Bell },
  ];

  return (
    <MasterPage 
      title="System Settings" 
      subtitle="Operational Core Configuration"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Navigation */}
        <div className="lg:col-span-3 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-xs font-medium transition-all",
                activeTab === tab.id 
                  ? "bg-blue-500 text-black shadow-lg shadow-blue-500/20" 
                  : "text-white/40 hover:text-white hover:bg-white/5"
              )}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="lg:col-span-9 space-y-8">
          {activeTab === 'organization' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="glass p-10 rounded-[2.5rem] border border-white/5">
                <h3 className="text-xl font-display font-medium mb-8">Corporate Identity</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-white/20 uppercase tracking-widest px-1">Entity Name</label>
                    <input type="text" defaultValue="ExLogis Global ERP" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-blue-500/50 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-white/20 uppercase tracking-widest px-1">Tax Identification</label>
                    <input type="text" defaultValue="TAX-8899-002" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-blue-500/50 transition-all" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-mono text-white/20 uppercase tracking-widest px-1">Registered Address</label>
                    <input type="text" defaultValue="100 Matrix Tower, Global Hub, Singapore" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-blue-500/50 transition-all" />
                  </div>
                </div>
              </div>

              <div className="glass p-10 rounded-[2.5rem] border border-white/5">
                <h3 className="text-xl font-display font-medium mb-8">Regional Hubs</h3>
                <div className="space-y-4">
                  {['Singapore (Global HQ)', 'Tokyo (Asia Pacific)', 'Los Angeles (Americas)'].map((hub, i) => (
                    <div key={i} className="flex justify-between items-center p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                      <div className="flex items-center gap-4">
                        <Globe size={16} className="text-blue-500/40" />
                        <span className="text-sm font-medium">{hub}</span>
                      </div>
                      <span className="text-[10px] font-mono text-white/20 uppercase">PRIMARY NODE</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'business-rules' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="glass p-10 rounded-[2.5rem] border border-white/5">
                <h3 className="text-xl font-display font-medium mb-8">Approval Matrix</h3>
                <div className="space-y-6">
                  {[
                    { label: 'Quotation Approval Flow', desc: 'Requires manager approval above $50k', status: true },
                    { label: 'PO Auto-Generation', desc: 'Generate PO instantly on SO confirmation', status: true },
                    { label: 'Margin Sensitivity Alert', desc: 'Notify board if margin drops below 15%', status: false },
                  ].map((rule, i) => (
                    <div key={i} className="flex justify-between items-start p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                      <div>
                        <p className="text-sm font-bold mb-1">{rule.label}</p>
                        <p className="text-xs text-white/20">{rule.desc}</p>
                      </div>
                      <div className={cn(
                        "w-12 h-6 rounded-full relative transition-all cursor-pointer",
                        rule.status ? "bg-blue-500" : "bg-white/10"
                      )}>
                        <div className={cn(
                          "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                          rule.status ? "right-1" : "left-1"
                        )}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass p-10 rounded-[2.5rem] border border-white/5">
                <h3 className="text-xl font-display font-medium mb-8">Document Identification</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {['QT-', 'SO-', 'PO-', 'SHP-'].map((pref, i) => (
                    <div key={i} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Hash size={16} className="text-white/20" />
                        <span className="text-sm font-mono">{pref}Prefix</span>
                      </div>
                      <input type="text" defaultValue="2025-" className="w-20 bg-white/5 border border-white/10 rounded-lg py-1 px-3 text-xs text-right font-mono" />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'logistics' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="glass p-10 rounded-[2.5rem] border border-white/5">
                <h3 className="text-xl font-display font-medium mb-8">Standard Port Access</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['JP TYO', 'US LAX', 'SG SIN', 'DE HAM', 'AE DXB'].map((port, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                      <Anchor size={16} className="text-blue-500/40" />
                      <span className="text-xs font-mono">{port}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass p-10 rounded-[2.5rem] border border-white/5">
                <h3 className="text-xl font-display font-medium mb-8">Container Unit Types</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['20GP Standard', '40GP Standard', '40HQ High Cube', '20RF Reefer', '40RF Reefer'].map((type, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                      <Box size={16} className="text-emerald-500/40" />
                      <span className="text-xs font-mono">{type}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </MasterPage>
  );
}

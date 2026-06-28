'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Bell, 
  AppWindow,
  Truck,
  Hash,
  Globe,
  Anchor,
  Box,
  Save,
  Moon,
  Sun,
  Monitor,
  Mail,
  Smartphone,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MasterPage } from '@/components/layout/master-page';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('organization');
  const [isSaving, setIsSaving] = useState(false);

  // Form States (Simulated)
  const [orgData, setOrgData] = useState({
    name: 'ExLogis Global ERP',
    taxId: 'TAX-8899-002',
    address: '100 Matrix Tower, Global Hub, Singapore',
    timezone: 'Asia/Singapore',
    currency: 'USD'
  });

  const [rules, setRules] = useState({
    quoteApproval: true,
    autoPoGen: true,
    marginAlert: false,
    requireInsurance: true
  });

  const [prefixes, setPrefixes] = useState({
    quote: '2025-',
    so: 'SO-',
    po: 'PO-',
    shp: 'SHP-'
  });

  const [sysPrefs, setSysPrefs] = useState({
    theme: 'dark',
    compactMode: false,
    dateFormat: 'YYYY-MM-DD'
  });

  const [notifications, setNotifications] = useState({
    emailPO: true,
    emailSO: true,
    pushShipment: true,
    emailDailyReport: false
  });

  const tabs = [
    { id: 'organization', label: 'Organization', icon: Building2 },
    { id: 'business-rules', label: 'Business Rules', icon: ShieldCheck },
    { id: 'logistics', label: 'Logistics Matrix', icon: Truck },
    { id: 'system', label: 'System Prefs', icon: AppWindow },
    { id: 'notifications', label: 'Alert Routing', icon: Bell },
  ];

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API network delay
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Configuration synchronized to core matrix');
    }, 800);
  };

  return (
    <MasterPage 
      title="System Settings" 
      subtitle="Operational Core Configuration"
    >
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 pb-20">
        {/* Navigation */}
        <div className="w-full lg:w-64 shrink-0 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer border-none",
                activeTab === tab.id 
                  ? "bg-blue-500 text-black shadow-lg shadow-blue-500/20 font-bold" 
                  : "bg-transparent text-white/70 hover:text-white hover:bg-white/5"
              )}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}

          <div className="pt-8">
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-[10px] font-mono font-bold uppercase tracking-widest transition-all bg-emerald-500 text-black hover:bg-emerald-400 cursor-pointer border-none disabled:opacity-50"
            >
              {isSaving ? <span className="animate-spin text-lg">⟳</span> : <Save size={16} />}
              {isSaving ? 'Syncing...' : 'Commit Changes'}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {/* Organization Tab */}
              {activeTab === 'organization' && (
                <>
                  <div className="glass p-8 lg:p-10 rounded-[2.5rem] border border-white/5">
                    <h3 className="text-xl font-display font-medium mb-8">Corporate Identity</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[9px] font-mono text-white/70 uppercase tracking-widest px-1">Entity Name</label>
                        <input 
                          type="text" 
                          value={orgData.name} 
                          onChange={e => setOrgData({...orgData, name: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-blue-500/50 transition-all text-white" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-mono text-white/70 uppercase tracking-widest px-1">Tax Identification</label>
                        <input 
                          type="text" 
                          value={orgData.taxId}
                          onChange={e => setOrgData({...orgData, taxId: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-blue-500/50 transition-all text-white" 
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-[9px] font-mono text-white/70 uppercase tracking-widest px-1">Registered Address</label>
                        <input 
                          type="text" 
                          value={orgData.address}
                          onChange={e => setOrgData({...orgData, address: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-blue-500/50 transition-all text-white" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-mono text-white/70 uppercase tracking-widest px-1">Base Currency</label>
                        <select 
                          value={orgData.currency}
                          onChange={e => setOrgData({...orgData, currency: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-blue-500/50 transition-all text-white"
                        >
                          <option className="bg-[#0c0c0c]" value="USD">USD - US Dollar</option>
                          <option className="bg-[#0c0c0c]" value="EUR">EUR - Euro</option>
                          <option className="bg-[#0c0c0c]" value="SGD">SGD - Singapore Dollar</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-mono text-white/70 uppercase tracking-widest px-1">System Timezone</label>
                        <select 
                          value={orgData.timezone}
                          onChange={e => setOrgData({...orgData, timezone: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-blue-500/50 transition-all text-white"
                        >
                          <option className="bg-[#0c0c0c]" value="Asia/Singapore">Asia/Singapore (UTC+8)</option>
                          <option className="bg-[#0c0c0c]" value="America/New_York">America/New_York (UTC-5)</option>
                          <option className="bg-[#0c0c0c]" value="Europe/London">Europe/London (UTC+0)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="glass p-8 lg:p-10 rounded-[2.5rem] border border-white/5">
                    <h3 className="text-xl font-display font-medium mb-8">Regional Hubs</h3>
                    <div className="space-y-4">
                      {['Singapore (Global HQ)', 'Tokyo (Asia Pacific)', 'Los Angeles (Americas)'].map((hub, i) => (
                        <div key={i} className="flex justify-between items-center p-4 rounded-2xl bg-white/2 border border-white/5">
                          <div className="flex items-center gap-4">
                            <Globe size={16} className="text-blue-500/60" />
                            <span className="text-sm font-medium">{hub}</span>
                          </div>
                          {i === 0 && <span className="text-[9px] font-mono text-white/80 uppercase border border-white/10 px-2 py-0.5 rounded">Primary Node</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Business Rules Tab */}
              {activeTab === 'business-rules' && (
                <>
                  <div className="glass p-8 lg:p-10 rounded-[2.5rem] border border-white/5">
                    <h3 className="text-xl font-display font-medium mb-8">Approval Matrix</h3>
                    <div className="space-y-6">
                      {[
                        { key: 'quoteApproval', label: 'Quotation Approval Flow', desc: 'Requires manager approval for quotes exceeding $50k threshold' },
                        { key: 'autoPoGen', label: 'PO Auto-Generation', desc: 'Generate Purchase Orders instantly upon Sales Order confirmation' },
                        { key: 'marginAlert', label: 'Margin Sensitivity Alert', desc: 'Trigger Neural Alert if trade margin drops below 15%' },
                        { key: 'requireInsurance', label: 'Mandatory Insurance', desc: 'Block CIF/CIP shipments if insurance certificates are missing' },
                      ].map((rule) => (
                        <div key={rule.key} className="flex justify-between items-center p-6 rounded-2xl bg-white/2 border border-white/5 hover:border-white/10 transition-colors">
                          <div className="pr-4">
                            <p className="text-sm font-bold mb-1">{rule.label}</p>
                            <p className="text-xs text-white/70">{rule.desc}</p>
                          </div>
                          <div 
                            onClick={() => setRules(prev => ({ ...prev, [rule.key]: !(prev as any)[rule.key] }))}
                            className={cn(
                              "w-12 h-6 shrink-0 rounded-full relative transition-all cursor-pointer",
                              (rules as any)[rule.key] ? "bg-blue-500" : "bg-white/10"
                            )}
                          >
                            <div className={cn(
                              "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                              (rules as any)[rule.key] ? "right-1" : "left-1"
                            )}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="glass p-8 lg:p-10 rounded-[2.5rem] border border-white/5">
                    <h3 className="text-xl font-display font-medium mb-8">Document Identification</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        { key: 'quote', label: 'Quotation Prefix' },
                        { key: 'so', label: 'Sales Order Prefix' },
                        { key: 'po', label: 'Purchase Order Prefix' },
                        { key: 'shp', label: 'Shipment Prefix' },
                      ].map((doc) => (
                        <div key={doc.key} className="p-4 rounded-2xl bg-white/2 border border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Hash size={16} className="text-white/70" />
                            <span className="text-xs font-mono uppercase text-white/90">{doc.label}</span>
                          </div>
                          <input 
                            type="text" 
                            value={(prefixes as any)[doc.key]}
                            onChange={e => setPrefixes(prev => ({ ...prev, [doc.key]: e.target.value }))}
                            className="w-24 bg-white/5 border border-white/10 rounded-lg py-1.5 px-3 text-xs text-right font-mono text-white focus:outline-none focus:border-blue-500/50" 
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Logistics Matrix Tab */}
              {activeTab === 'logistics' && (
                <>
                  <div className="glass p-8 lg:p-10 rounded-[2.5rem] border border-white/5">
                    <div className="flex justify-between items-center mb-8">
                      <h3 className="text-xl font-display font-medium">Standard Port Access</h3>
                      <button className="text-[9px] font-mono uppercase tracking-widest text-blue-400 border border-blue-400/20 px-3 py-1 rounded-lg hover:bg-blue-400/10 transition-colors bg-transparent cursor-pointer">Manage Ports</button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {['IN NHV', 'IN MUN', 'US LAX', 'US NYC', 'JP TYO', 'SG SIN', 'DE HAM', 'AE DXB'].map((port, i) => (
                        <div key={i} className="flex items-center justify-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5">
                          <Anchor size={14} className="text-blue-500/60" />
                          <span className="text-[10px] font-mono font-bold tracking-widest">{port}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="glass p-8 lg:p-10 rounded-[2.5rem] border border-white/5">
                    <h3 className="text-xl font-display font-medium mb-8">Container Unit Types</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {['20GP Standard', '40GP Standard', '40HQ High Cube', '20RF Reefer', '40RF Reefer', 'LCL Cargo'].map((type, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                          <Box size={14} className="text-emerald-500/60 shrink-0" />
                          <span className="text-[10px] font-mono tracking-widest">{type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* System Prefs Tab */}
              {activeTab === 'system' && (
                <div className="glass p-8 lg:p-10 rounded-[2.5rem] border border-white/5">
                  <h3 className="text-xl font-display font-medium mb-8">Interface & Experience</h3>
                  
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <label className="text-[9px] font-mono text-white/70 uppercase tracking-widest px-1">Visual Theme</label>
                      <div className="grid grid-cols-3 gap-4 max-w-lg">
                        <button 
                          onClick={() => setSysPrefs({...sysPrefs, theme: 'dark'})}
                          className={cn("flex flex-col items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer", sysPrefs.theme === 'dark' ? "bg-white/10 border-white/30" : "bg-transparent border-white/5 hover:bg-white/5 text-white/70")}
                        >
                          <Moon size={20} />
                          <span className="text-[9px] font-mono uppercase tracking-widest">Dark Matrix</span>
                        </button>
                        <button 
                          onClick={() => setSysPrefs({...sysPrefs, theme: 'light'})}
                          className={cn("flex flex-col items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer opacity-50", sysPrefs.theme === 'light' ? "bg-white/10 border-white/30 text-white" : "bg-transparent border-white/5 hover:bg-white/5 text-white/70")}
                          disabled
                          title="Light mode currently disabled"
                        >
                          <Sun size={20} />
                          <span className="text-[9px] font-mono uppercase tracking-widest">Light (Soon)</span>
                        </button>
                        <button 
                          onClick={() => setSysPrefs({...sysPrefs, theme: 'system'})}
                          className={cn("flex flex-col items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer", sysPrefs.theme === 'system' ? "bg-white/10 border-white/30 text-white" : "bg-transparent border-white/5 hover:bg-white/5 text-white/70")}
                        >
                          <Monitor size={20} />
                          <span className="text-[9px] font-mono uppercase tracking-widest">System</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-6 rounded-2xl bg-white/2 border border-white/5">
                      <div>
                        <p className="text-sm font-bold mb-1">Compact Mode</p>
                        <p className="text-xs text-white/70">Reduce padding across all data tables and lists</p>
                      </div>
                      <div 
                        onClick={() => setSysPrefs(prev => ({ ...prev, compactMode: !prev.compactMode }))}
                        className={cn(
                          "w-12 h-6 shrink-0 rounded-full relative transition-all cursor-pointer",
                          sysPrefs.compactMode ? "bg-blue-500" : "bg-white/10"
                        )}
                      >
                        <div className={cn("absolute top-1 w-4 h-4 rounded-full bg-white transition-all", sysPrefs.compactMode ? "right-1" : "left-1")}></div>
                      </div>
                    </div>

                    <div className="space-y-4 max-w-sm">
                      <label className="text-[9px] font-mono text-white/70 uppercase tracking-widest px-1">Date Format</label>
                      <select 
                        value={sysPrefs.dateFormat}
                        onChange={e => setSysPrefs({...sysPrefs, dateFormat: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-blue-500/50 transition-all text-white"
                      >
                        <option className="bg-[#0c0c0c]" value="YYYY-MM-DD">YYYY-MM-DD (2025-10-24)</option>
                        <option className="bg-[#0c0c0c]" value="DD/MM/YYYY">DD/MM/YYYY (24/10/2025)</option>
                        <option className="bg-[#0c0c0c]" value="MM/DD/YYYY">MM/DD/YYYY (10/24/2025)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="glass p-8 lg:p-10 rounded-[2.5rem] border border-white/5">
                  <h3 className="text-xl font-display font-medium mb-8">Alert Routing & Delivery</h3>
                  
                  <div className="space-y-8">
                    <div>
                      <h4 className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-blue-400 mb-4"><Mail size={14}/> Email Routing</h4>
                      <div className="space-y-4">
                        {[
                          { key: 'emailPO', label: 'Purchase Order Issuance', desc: 'Send PDF copy to supplier automatically' },
                          { key: 'emailSO', label: 'Sales Order Confirmation', desc: 'Send acknowledgement to customer' },
                          { key: 'emailDailyReport', label: 'Daily Status Digest', desc: 'Morning summary of all pending shipments' },
                        ].map((rule) => (
                          <div key={rule.key} className="flex justify-between items-center p-4 rounded-xl bg-white/2 border border-white/5">
                            <div>
                              <p className="text-sm font-bold">{rule.label}</p>
                              <p className="text-[10px] text-white/70 mt-1">{rule.desc}</p>
                            </div>
                            <div 
                              onClick={() => setNotifications(prev => ({ ...prev, [rule.key]: !(prev as any)[rule.key] }))}
                              className={cn("w-10 h-5 shrink-0 rounded-full relative transition-all cursor-pointer", (notifications as any)[rule.key] ? "bg-blue-500" : "bg-white/10")}
                            >
                              <div className={cn("absolute top-1 w-3 h-3 rounded-full bg-white transition-all", (notifications as any)[rule.key] ? "right-1" : "left-1")}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-emerald-400 mb-4"><Smartphone size={14}/> Push Directives (System)</h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 rounded-xl bg-white/2 border border-white/5">
                          <div>
                            <p className="text-sm font-bold">Shipment Status Changes</p>
                            <p className="text-[10px] text-white/70 mt-1">Receive system alerts when containers cross milestones</p>
                          </div>
                          <div 
                            onClick={() => setNotifications(prev => ({ ...prev, pushShipment: !prev.pushShipment }))}
                            className={cn("w-10 h-5 shrink-0 rounded-full relative transition-all cursor-pointer", notifications.pushShipment ? "bg-emerald-500" : "bg-white/10")}
                          >
                            <div className={cn("absolute top-1 w-3 h-3 rounded-full bg-white transition-all", notifications.pushShipment ? "right-1" : "left-1")}></div>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </MasterPage>
  );
}

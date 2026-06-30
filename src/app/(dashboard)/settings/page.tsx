'use client';

import React, { useState, useEffect } from 'react';
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
  Check,
  Coins,
  Scale,
  Receipt
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PageHeaderUpdater } from '@/components/layout/page-context';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ReferenceManager } from '@/components/settings/ReferenceManager';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('organization');
  const [isSaving, setIsSaving] = useState(false);

  // Form States (Simulated)
  const [orgData, setOrgData] = useState({
    id: '',
    name: '',
    taxId: '',
    address: '',
    timezone: '',
    currency: ''
  });

  const [rules, setRules] = useState({
    quoteApproval: true,
    autoPoGen: true,
    marginAlert: false,
    requireInsurance: true
  });

  const [prefixes, setPrefixes] = useState({
    quote: '',
    so: '',
    po: '',
    shp: ''
  });

  const [sysPrefs, setSysPrefs] = useState({
    id: '',
    theme: '',
    compactMode: false,
    dateFormat: ''
  });

  const [notifications, setNotifications] = useState({
    emailPO: true,
    emailSO: true,
    pushShipment: true,
    emailDailyReport: false
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [compRes, prefRes] = await Promise.all([
          fetch('/api/company'),
          fetch('/api/preferences')
        ]);
        
        if (compRes.ok) {
          const comp = await compRes.json();
          if (comp) {
            setOrgData({
              id: comp.id,
              name: comp.name || '',
              taxId: comp.taxId || '',
              address: (comp.branches && comp.branches[0]?.address) || '',
              timezone: comp.timezone || '',
              currency: comp.currency || ''
            });
          }
        }
        
        if (prefRes.ok) {
          const pref = await prefRes.json();
          if (pref) {
            setSysPrefs({
              id: pref.id,
              theme: pref.theme || 'dark',
              compactMode: pref.compactMode || false,
              dateFormat: pref.dateFormat || 'YYYY-MM-DD'
            });
            setPrefixes({
              quote: pref.quotePrefix || '',
              so: pref.soPrefix || '',
              po: pref.poPrefix || '',
              shp: pref.shpPrefix || ''
            });
            setRules({
              quoteApproval: pref.quoteApproval ?? true,
              autoPoGen: pref.autoPoGen ?? true,
              marginAlert: pref.marginAlert ?? false,
              requireInsurance: pref.requireInsurance ?? true
            });
            setNotifications({
              emailPO: pref.emailPO ?? true,
              emailSO: pref.emailSO ?? true,
              pushShipment: pref.pushShipment ?? true,
              emailDailyReport: pref.emailDailyReport ?? false
            });
          }
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchSettings();
  }, []);

  const tabs = [
    { id: 'organization', label: 'Organization', icon: Building2 },
    { id: 'business-rules', label: 'Business Rules', icon: ShieldCheck },
    { id: 'logistics', label: 'Logistics Matrix', icon: Truck },
    { id: 'system', label: 'System Prefs', icon: AppWindow },
    { id: 'notifications', label: 'Alert Routing', icon: Bell },
    { id: 'roles', label: 'Roles & Security', icon: ShieldCheck },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const compPayload = {
        id: orgData.id,
        name: orgData.name,
        taxId: orgData.taxId,
        timezone: orgData.timezone,
        currency: orgData.currency,
      };
      
      const prefPayload = {
        id: sysPrefs.id,
        theme: sysPrefs.theme,
        compactMode: sysPrefs.compactMode,
        dateFormat: sysPrefs.dateFormat,
        quotePrefix: prefixes.quote,
        soPrefix: prefixes.so,
        poPrefix: prefixes.po,
        shpPrefix: prefixes.shp,
        quoteApproval: rules.quoteApproval,
        autoPoGen: rules.autoPoGen,
        marginAlert: rules.marginAlert,
        requireInsurance: rules.requireInsurance,
        emailPO: notifications.emailPO,
        emailSO: notifications.emailSO,
        pushShipment: notifications.pushShipment,
        emailDailyReport: notifications.emailDailyReport,
      };

      await Promise.all([
        fetch('/api/company', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(compPayload)
        }),
        fetch('/api/preferences', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(prefPayload)
        })
      ]);
      toast.success('Configuration synchronized to core matrix');
    } catch (error) {
      toast.error('Failed to synchronize configuration');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <PageHeaderUpdater title="System Settings" subtitle="Operational Core Configuration" />
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
                <div className="space-y-6">
                  <ReferenceManager 
                    title="Currencies"
                    type="currencies"
                    icon={Coins}
                    fields={[
                      { key: 'code', label: 'Code', type: 'text' },
                      { key: 'symbol', label: 'Symbol', type: 'text' },
                      { key: 'exchangeRate', label: 'Exchange Rate', type: 'number' },
                      { key: 'isDefault', label: 'Is Default', type: 'boolean' },
                    ]}
                  />

                  <ReferenceManager 
                    title="Container Types"
                    type="containers"
                    icon={Box}
                    fields={[
                      { key: 'code', label: 'Code', type: 'text' },
                      { key: 'description', label: 'Description', type: 'text' },
                      { key: 'teu', label: 'TEU', type: 'number' },
                      { key: 'maxWeight', label: 'Max Weight', type: 'number' },
                    ]}
                  />

                  <ReferenceManager 
                    title="Incoterms"
                    type="incoterms"
                    icon={Truck}
                    fields={[
                      { key: 'code', label: 'Code', type: 'text' },
                      { key: 'description', label: 'Description', type: 'text' },
                    ]}
                  />
                  
                  <ReferenceManager 
                    title="Measurement Units"
                    type="units"
                    icon={Scale}
                    fields={[
                      { key: 'code', label: 'Code', type: 'text' },
                      { key: 'name', label: 'Name', type: 'text' },
                      { key: 'type', label: 'Type (WEIGHT/VOLUME)', type: 'text' },
                    ]}
                  />

                  <ReferenceManager 
                    title="Tax Settings"
                    type="taxes"
                    icon={Receipt}
                    fields={[
                      { key: 'name', label: 'Name', type: 'text' },
                      { key: 'ratePercentage', label: 'Rate %', type: 'number' },
                    ]}
                  />
                </div>
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

              {/* Roles & Security Tab */}
              {activeTab === 'roles' && (
                <div className="glass p-8 lg:p-10 rounded-[2.5rem] border border-white/5">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h3 className="text-xl font-display font-medium">Roles & Security</h3>
                      <p className="text-[10px] font-mono text-white/50 uppercase tracking-widest mt-2">Access Control Matrix</p>
                    </div>
                    <a href="/settings/users" className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)]">
                      Manage Users Matrix
                    </a>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <ShieldCheck size={16} className="text-emerald-400" />
                          <span className="font-bold">Super Admin</span>
                        </div>
                        <p className="text-xs text-white/60 mt-1">Unrestricted access to all modules and system settings.</p>
                      </div>
                      <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-mono uppercase rounded border border-emerald-500/20">System Role</span>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/2 border border-white/5 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <ShieldCheck size={16} className="text-blue-400" />
                          <span className="font-bold">Manager</span>
                        </div>
                        <p className="text-xs text-white/60 mt-1">Department-level manager with elevated privileges.</p>
                      </div>
                      <button className="text-xs text-blue-400 hover:text-blue-300 font-medium">Edit Permissions</button>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/2 border border-white/5 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <ShieldCheck size={16} className="text-white/60" />
                          <span className="font-bold text-white/80">Staff</span>
                        </div>
                        <p className="text-xs text-white/60 mt-1">General operational staff with standard access.</p>
                      </div>
                      <button className="text-xs text-blue-400 hover:text-blue-300 font-medium">Edit Permissions</button>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}

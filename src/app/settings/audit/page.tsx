'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, User, Building2, Search, Filter, ShieldAlert, History } from 'lucide-react';
import { MasterPage } from '@/components/layout/master-page';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/audit');
        if (res.ok) {
          const data = await res.json();
          setLogs(Array.isArray(data) ? data : []);
        } else {
          toast.error('Failed to load audit logs');
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.entityType.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (log.user?.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = filterAction === 'ALL' || log.action === filterAction;
    return matchesSearch && matchesAction;
  });

  const getActionColor = (action: string) => {
    switch(action) {
      case 'CREATE': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'UPDATE': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'DELETE': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'LOGIN': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      default: return 'text-white/70 bg-white/5 border-white/10';
    }
  };

  return (
    <MasterPage 
      title="System Audit" 
      subtitle="Immutable activity and compliance logging"
    >
      <div className="flex flex-col gap-8 pb-20 max-w-7xl">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-2 rounded-2xl w-full md:w-96">
            <Search size={16} className="text-white/40 ml-2" />
            <input 
              type="text" 
              placeholder="Search entity or user..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none text-sm outline-none w-full placeholder:text-white/30"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-white/40" />
            {['ALL', 'CREATE', 'UPDATE', 'DELETE', 'LOGIN'].map(action => (
              <button
                key={action}
                onClick={() => setFilterAction(action)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-widest transition-all",
                  filterAction === action 
                    ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]" 
                    : "bg-white/5 text-white/60 hover:bg-white/10"
                )}
              >
                {action}
              </button>
            ))}
          </div>
        </div>

        <div className="glass rounded-[2.5rem] border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] font-mono uppercase tracking-widest text-white/40 bg-white/[0.02]">
                  <th className="px-8 py-5 font-medium">Timestamp</th>
                  <th className="px-8 py-5 font-medium">Action</th>
                  <th className="px-8 py-5 font-medium">Entity</th>
                  <th className="px-8 py-5 font-medium">User</th>
                  <th className="px-8 py-5 font-medium text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {loading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-white/50">Loading logs...</td></tr>
                ) : filteredLogs.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-white/50">No audit records found.</td></tr>
                ) : (
                  filteredLogs.map((log, idx) => (
                    <motion.tr 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={log.id} 
                      className="hover:bg-white/2 transition-colors group"
                    >
                      <td className="px-8 py-5 text-white/60 font-mono text-xs">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-8 py-5">
                        <span className={cn("px-3 py-1 text-[10px] font-mono uppercase rounded border", getActionColor(log.action))}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="font-medium text-white/90">{log.entityType}</div>
                        <div className="text-[10px] font-mono text-white/40 mt-1">{log.entityId.substring(0,8)}...</div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-white/40"/>
                          <span className="text-white/80">{log.user?.email || 'System'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button className="text-blue-400 hover:text-blue-300 text-xs font-medium">View Diff</button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </MasterPage>
  );
}

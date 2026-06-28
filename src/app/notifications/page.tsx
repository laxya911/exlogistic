'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  XCircle,
  Clock,
  ExternalLink,
  Filter,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MasterPage } from '@/components/layout/master-page';
import { Notification } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function NotificationCenterPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      setNotifications(data);
    } catch (e) {
      toast.error('Failed to sync notification stream');
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    toast.success('Matrix cleared');
  };

  const filtered = notifications.filter(n => filter === 'ALL' || !n.isRead);

  const getIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS': return <CheckCircle2 className="text-emerald-500" />;
      case 'WARNING': return <AlertTriangle className="text-amber-500" />;
      case 'ERROR': return <XCircle className="text-rose-500" />;
      default: return <Info className="text-blue-500" />;
    }
  };

  return (
    <MasterPage 
      title="Intelligence Hub" 
      subtitle="Neural Notification & Alert Stream"
      loading={loading}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="glass p-8 rounded-[2rem] border border-white/5 flex justify-between items-center">
          <div className="flex gap-4">
            <button 
              onClick={() => setFilter('ALL')}
              className={cn(
                "px-6 py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest transition-all",
                filter === 'ALL' ? "bg-white/10 text-white" : "text-white/20 hover:text-white/40"
              )}
            >
              All Directives
            </button>
            <button 
              onClick={() => setFilter('UNREAD')}
              className={cn(
                "px-6 py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest transition-all",
                filter === 'UNREAD' ? "bg-white/10 text-white" : "text-white/20 hover:text-white/40"
              )}
            >
              Unread
            </button>
          </div>
          <button 
            onClick={markAllRead}
            className="flex items-center gap-2 px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-mono uppercase tracking-widest hover:bg-white/10 transition-colors"
          >
            <Check size={14} /> Clear Stream
          </button>
        </div>

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((notif, i) => (
              <motion.div 
                key={notif.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "p-6 rounded-[2rem] border transition-all group relative overflow-hidden",
                  notif.isRead 
                    ? "bg-white/[0.02] border-white/5 opacity-60" 
                    : "bg-white/5 border-white/10 shadow-lg shadow-black/20"
                )}
              >
                {!notif.isRead && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                )}
                
                <div className="flex gap-6 items-start">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-sans font-bold text-lg leading-tight">{notif.title}</h4>
                      <span className="text-[10px] font-mono text-white/20 uppercase tracking-tighter whitespace-nowrap ml-4">
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-white/40 leading-relaxed mb-6">{notif.message}</p>
                    
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2 text-[9px] font-mono text-white/20 uppercase tracking-widest">
                        <Clock size={12} /> {new Date(notif.createdAt).toLocaleDateString()}
                      </div>
                      {notif.relatedId && (
                        <button className="flex items-center gap-2 text-[9px] font-mono text-blue-500 uppercase tracking-widest hover:underline">
                          <ExternalLink size={12} /> Inspect {notif.relatedType}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10">
                      <Check size={14} className="text-white/40" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </MasterPage>
  );
}

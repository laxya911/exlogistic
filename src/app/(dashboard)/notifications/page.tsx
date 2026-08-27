'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  XCircle,
  Clock,
  ExternalLink,
  Check,
  CheckCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PageHeaderUpdater } from '@/components/layout/page-context';
import { Notification } from '@/types';
import { cn, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function NotificationCenterPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const [isProcessing, setIsProcessing] = useState(false);

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

  const markAllRead = async () => {
    if (notifications.every(n => n.isRead)) return;
    
    setIsProcessing(true);
    const original = [...notifications];
    
    // Optimistic
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    
    try {
      const res = await fetch('/api/notifications', { method: 'PUT' });
      if (!res.ok) throw new Error('Failed to update');
      toast.success('Matrix stream cleared');
    } catch (e) {
      setNotifications(original);
      toast.error('Operation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const markRead = async (id: string, currentStatus: boolean) => {
    if (currentStatus) return; // Already read
    
    const original = [...notifications];
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true })
      });
      if (!res.ok) throw new Error('Failed to update');
    } catch (e) {
      setNotifications(original);
      toast.error('Failed to update notification');
    }
  };

  const filtered = notifications.filter(n => filter === 'ALL' || !n.isRead);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS': return <CheckCircle2 className="text-emerald-500" />;
      case 'WARNING': return <AlertTriangle className="text-amber-500" />;
      case 'ERROR': return <XCircle className="text-rose-500" />;
      default: return <Info className="text-blue-500" />;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'SUCCESS': return 'shadow-[0_0_15px_rgba(16,185,129,0.5)] bg-emerald-500';
      case 'WARNING': return 'shadow-[0_0_15px_rgba(245,158,11,0.5)] bg-amber-500';
      case 'ERROR': return 'shadow-[0_0_15px_rgba(239,68,68,0.5)] bg-rose-500';
      default: return 'shadow-[0_0_15px_rgba(59,130,246,0.5)] bg-blue-500';
    }
  };

  return (
    <>
      <PageHeaderUpdater title="Intelligence Hub" subtitle="Neural Notification & Alert Stream" />
      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        <div className="glass p-6 md:p-8 rounded-4xl border border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex gap-2 p-1 bg-muted rounded-xl border border-border w-full md:w-auto overflow-x-auto">
            <button 
              onClick={() => setFilter('ALL')}
              className={cn(
                "px-6 py-2.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer border-none",
                filter === 'ALL' ? "bg-white text-black shadow-lg" : "bg-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              All Directives
            </button>
            <button 
              onClick={() => setFilter('UNREAD')}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer border-none",
                filter === 'UNREAD' ? "bg-white text-black shadow-lg" : "bg-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Unread
              {unreadCount > 0 && (
                <span className={cn(
                  "px-1.5 py-0.5 rounded-md text-[9px]",
                  filter === 'UNREAD' ? "bg-black text-foreground" : "bg-accent text-foreground"
                )}>{unreadCount}</span>
              )}
            </button>
          </div>
          
          <button 
            onClick={markAllRead}
            disabled={isProcessing || unreadCount === 0}
            className="w-full md:w-auto flex justify-center items-center gap-2 px-6 py-3 bg-muted border border-border rounded-xl text-[10px] font-mono uppercase tracking-widest hover:bg-accent transition-colors cursor-pointer disabled:opacity-50"
          >
            <CheckCheck size={14} /> Clear Stream
          </button>
        </div>

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((notif, i) => (
              <motion.div 
                layout
                key={notif.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: Math.min(i * 0.05, 0.5) }} // Cap delay
                className={cn(
                  "p-5 md:p-6 rounded-4xl border transition-all group relative overflow-hidden flex flex-col md:flex-row gap-4 md:gap-6 items-start",
                  notif.isRead 
                    ? "bg-white/1 border-border opacity-60" 
                    : "bg-muted border-border shadow-lg shadow-black/20 hover:bg-white/[0.07]"
                )}
              >
                {!notif.isRead && (
                  <div className={cn("absolute top-0 left-0 w-1 h-full", getBorderColor(notif.type))}></div>
                )}
                
                <div className="w-12 h-12 rounded-2xl bg-muted border border-border flex items-center justify-center shrink-0">
                  {getIcon(notif.type)}
                </div>
                
                <div className="flex-1 min-w-0 w-full">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-sans font-bold text-base md:text-lg leading-tight pr-4">{notif.title}</h4>
                    <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-tighter whitespace-nowrap shrink-0 mt-1">
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed mb-4 md:mb-6">{notif.message}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 md:gap-6">
                    <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground uppercase tracking-widest">
                      <Clock size={12} /> {formatDate(notif.createdAt)}
                    </div>
                    {notif.relatedId && (
                      <button className="flex items-center gap-1.5 text-[9px] font-mono text-blue-400 uppercase tracking-widest hover:underline cursor-pointer border-none bg-transparent p-0">
                        <ExternalLink size={12} /> Inspect {notif.relatedType}
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="w-full md:w-auto flex justify-end md:opacity-0 group-hover:opacity-100 transition-opacity mt-4 md:mt-0">
                  {!notif.isRead && (
                    <button 
                      onClick={() => markRead(notif.id, notif.isRead)}
                      className="p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors border-none cursor-pointer flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest"
                      title="Mark as Read"
                    >
                      <Check size={14} /> <span className="md:hidden">Mark Read</span>
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className="py-24 text-center glass rounded-4xl border border-border">
              <Bell size={48} className="mx-auto mb-6 text-white/10" />
              <p className="text-sm font-mono text-muted-foreground uppercase tracking-widest">Stream is clear.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

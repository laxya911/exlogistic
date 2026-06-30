'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle2, Package, Clock, Ship, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Notification } from '@/types';
import { useRouter } from 'next/navigation';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications', { method: 'PUT' });
      setNotifications([]);
      setUnreadCount(0);
      setOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'QUOTATION_EXPIRING': return <Clock size={14} className="text-orange-400" />;
      case 'SHIPMENT_DELAYED': return <Ship size={14} className="text-rose-400" />;
      case 'APPROVAL_REQUIRED': return <CheckCircle2 size={14} className="text-blue-400" />;
      case 'PO_OVERDUE': return <Package size={14} className="text-rose-400" />;
      case 'TASK_ASSIGNED': return <FileText size={14} className="text-emerald-400" />;
      default: return <Bell size={14} className="text-white/70" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setOpen(!open)}
        className="p-3 rounded-xl bg-white/5 border border-white/5 text-white/70 hover:text-white hover:bg-white/10 transition-all relative"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full right-0 mt-2 w-80 bg-[#0a0a0a]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl z-70 overflow-hidden flex flex-col max-h-[400px]"
          >
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
              <h3 className="font-display font-medium text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={handleMarkAllRead}
                  className="text-[9px] font-mono uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Mark All Read
                </button>
              )}
            </div>

            <div className="overflow-y-auto custom-scrollbar flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-white/50">
                  You're all caught up!
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {notifications.map((n) => (
                    <div 
                      key={n.id} 
                      className="p-4 hover:bg-white/5 transition-colors cursor-pointer group"
                      onClick={() => {
                        if (n.actionUrl) {
                          setOpen(false);
                          router.push(n.actionUrl);
                        }
                      }}
                    >
                      <div className="flex gap-3">
                        <div className="mt-1 p-2 rounded-lg bg-white/5 h-fit">
                          {getIcon(n.type)}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-white/90 group-hover:text-white">{n.title}</p>
                          <p className="text-[11px] text-white/60 mt-1 line-clamp-2 leading-relaxed">{n.message}</p>
                          <p className="text-[9px] font-mono text-white/40 mt-2 uppercase">
                            {new Date(n.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

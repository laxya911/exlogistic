'use client';

import React, { useState, useEffect } from 'react';
import { MasterPage } from '@/components/layout/master-page';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  Ship,
  FileText,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/calendar');
      const data = await res.json();
      setEvents(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
  const prevMonthDays = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth() - 1);

  const days = [];
  // Prev month filler
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({ day: prevMonthDays - i, current: false });
  }
  // Current month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, current: true });
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'ETD': return <Ship size={10} className="text-blue-400" />;
      case 'ETA': return <Anchor size={10} className="text-emerald-400" />;
      case 'QUOTATION_EXPIRY': return <AlertCircle size={10} className="text-rose-400" />;
      default: return <Clock size={10} className="text-amber-400" />;
    }
  };

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <MasterPage 
      title="Commercial Calendar" 
      subtitle="Strategic Export Schedule"
      loading={loading}
    >
      <div className="glass rounded-[2.5rem] border border-white/5 overflow-hidden">
        {/* Calendar Header */}
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
          <div className="flex items-center gap-6">
            <h3 className="text-2xl font-display font-medium">
              {months[currentDate.getMonth()]} <span className="text-white/20">{currentDate.getFullYear()}</span>
            </h3>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          <button 
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-[10px] font-mono uppercase tracking-widest hover:bg-white/10 transition-colors"
          >
            Today
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 border-b border-white/5">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="py-4 text-center text-[10px] font-mono uppercase tracking-widest text-white/20 border-r border-white/5 last:border-0 bg-white/[0.005]">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((d, i) => {
            const dateStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${d.day.toString().padStart(2, '0')}`;
            const dayEvents = events.filter(e => e.start.startsWith(dateStr)).slice(0, 3);

            return (
              <div 
                key={i} 
                className={cn(
                  "min-h-[140px] p-4 border-r border-b border-white/5 group hover:bg-white/[0.02] transition-all relative",
                  !d.current && "opacity-20",
                  i % 7 === 6 && "border-r-0"
                )}
              >
                <span className={cn(
                  "text-xs font-mono mb-4 block",
                  d.current ? "text-white/40" : "text-white/10"
                )}>
                  {d.day.toString().padStart(2, '0')}
                </span>
                
                <div className="space-y-1.5">
                  {dayEvents.map((e, ei) => (
                    <div key={ei} className="px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20 flex items-center gap-2 overflow-hidden">
                      <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                      <span className="text-[8px] font-mono text-blue-400 truncate uppercase tracking-tighter">
                        {e.title}
                      </span>
                    </div>
                  ))}
                  {dayEvents.length > 0 && events.filter(e => e.start.startsWith(dateStr)).length > 3 && (
                    <p className="text-[8px] font-mono text-white/10 uppercase pl-1">
                      + {events.filter(e => e.start.startsWith(dateStr)).length - 3} more
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </MasterPage>
  );
}

function Anchor({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="5" r="3"/>
      <line x1="12" y1="22" x2="12" y2="8"/>
      <path d="M5 12H2a10 10 0 0 0 20 0h-3"/>
    </svg>
  );
}

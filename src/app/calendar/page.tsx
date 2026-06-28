'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { MasterPage } from '@/components/layout/master-page';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Ship, 
  AlertCircle, Anchor, Box, CheckSquare, Filter, FileText, ChevronDown, 
  MapPin, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { CalendarEvent } from '@/types';

// Event Types and Styling Maps
const EVENT_COLORS: Record<string, { bg: string, text: string, border: string, dot: string, label: string }> = {
  ETD: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', dot: 'bg-blue-500', label: 'Vessel Departures' },
  ETA: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', dot: 'bg-emerald-500', label: 'Vessel Arrivals' },
  QUOTATION_EXPIRY: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', dot: 'bg-rose-500', label: 'Quote Expiries' },
  PO_DELIVERY: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', dot: 'bg-amber-500', label: 'PO Deliveries' },
  MEETING: { bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-400', border: 'border-fuchsia-500/20', dot: 'bg-fuchsia-500', label: 'Tasks & Deadlines' }
};

const getEventIcon = (type: string) => {
  switch (type) {
    case 'ETD': return <Ship size={12} />;
    case 'ETA': return <Anchor size={12} />;
    case 'QUOTATION_EXPIRY': return <AlertCircle size={12} />;
    case 'PO_DELIVERY': return <Box size={12} />;
    case 'MEETING': return <CheckSquare size={12} />;
    default: return <Clock size={12} />;
  }
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Filters
  const [activeFilters, setActiveFilters] = useState<Set<string>>(
    new Set(['ETD', 'ETA', 'QUOTATION_EXPIRY', 'PO_DELIVERY', 'MEETING'])
  );

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/calendar');
      const data = await res.json();
      setEvents(data);
    } catch (e) {
      toast.error('Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  };

  const toggleFilter = (type: string) => {
    const newFilters = new Set(activeFilters);
    if (newFilters.has(type)) {
      newFilters.delete(type);
    } else {
      newFilters.add(type);
    }
    setActiveFilters(newFilters);
  };

  // Calendar Math
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
  const prevMonthDays = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth() - 1);

  const days = [];
  // Prev month filler
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({ day: prevMonthDays - i, current: false, monthOffset: -1 });
  }
  // Current month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, current: true, monthOffset: 0 });
  }
  // Next month filler (to complete the grid of 42 cells)
  const remainingCells = 42 - days.length;
  for (let i = 1; i <= remainingCells; i++) {
    days.push({ day: i, current: false, monthOffset: 1 });
  }

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const todayStr = new Date().toISOString().split('T')[0];

  const filteredEvents = events.filter(e => activeFilters.has(e.type));

  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return [];
    return filteredEvents.filter(e => e.start.startsWith(selectedDate));
  }, [selectedDate, filteredEvents]);

  return (
    <MasterPage 
      title="Commercial Calendar" 
      subtitle="Strategic Export Schedule & Deadlines"
      loading={loading}
    >
      <div className="flex gap-6 h-[800px]">
        {/* Main Calendar View */}
        <div className="flex-1 glass rounded-[2.5rem] border border-white/5 flex flex-col overflow-hidden relative">
          
          {/* Header */}
          <div className="p-6 border-b border-white/5 bg-white/2 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-6">
              <h3 className="text-2xl font-display font-medium min-w-[200px]">
                {months[currentDate.getMonth()]} <span className="text-white/80">{currentDate.getFullYear()}</span>
              </h3>
              <div className="flex items-center gap-2 bg-white/5 rounded-xl p-1 border border-white/5">
                <button 
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer border-none"
                >
                  <ChevronLeft size={18} />
                </button>
                <button 
                  onClick={() => setCurrentDate(new Date())}
                  className="px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors text-[10px] font-mono uppercase tracking-widest cursor-pointer border-none"
                >
                  Today
                </button>
                <button 
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer border-none"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
            
            {/* Legend / Filters */}
            <div className="flex gap-2 flex-wrap justify-end max-w-[600px]">
              {Object.entries(EVENT_COLORS).map(([type, config]) => (
                <button 
                  key={type}
                  onClick={() => toggleFilter(type)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-mono uppercase tracking-widest transition-colors border cursor-pointer",
                    activeFilters.has(type) 
                      ? `${config.bg} ${config.text} ${config.border}`
                      : "bg-white/5 text-white/80 border-white/5 hover:bg-white/10"
                  )}
                >
                  <div className={cn("w-1.5 h-1.5 rounded-full", activeFilters.has(type) ? config.dot : 'bg-white/20')} />
                  {config.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid Header */}
          <div className="grid grid-cols-7 border-b border-white/5 shrink-0 bg-white/1">
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d) => (
              <div key={d} className="py-4 text-center text-[9px] font-mono uppercase tracking-widest text-white/80 border-r border-white/5 last:border-r-0">
                {d}
              </div>
            ))}
          </div>

          {/* Grid Body */}
          <div className="grid grid-cols-7 flex-1 overflow-y-auto custom-scrollbar bg-[#050505]">
            {days.map((d, i) => {
              // Calculate correct date string for this cell
              const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + d.monthOffset, d.day);
              const dateStr = cellDate.toISOString().split('T')[0];
              const isToday = dateStr === todayStr;
              
              const dayEvents = filteredEvents.filter(e => e.start.startsWith(dateStr));
              const displayEvents = dayEvents.slice(0, 3);
              const overflowCount = dayEvents.length - 3;
              const isSelected = selectedDate === dateStr;

              return (
                <div 
                  key={i} 
                  onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  className={cn(
                    "min-h-[120px] p-2 border-r border-b border-white/5 transition-all cursor-pointer relative group",
                    !d.current && "bg-white/1 opacity-40 hover:opacity-100",
                    isToday && "bg-blue-500/5",
                    isSelected && "ring-1 ring-inset ring-blue-500/50 bg-blue-500/10",
                    "hover:bg-white/3"
                  )}
                >
                  <div className="flex justify-between items-start mb-2 px-1">
                    <span className={cn(
                      "text-xs font-mono font-medium flex items-center justify-center w-6 h-6 rounded-full",
                      isToday ? "bg-blue-500 text-black" : (d.current ? "text-white/90" : "text-white/80")
                    )}>
                      {d.day}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[9px] font-mono text-white/80 opacity-0 group-hover:opacity-100 transition-opacity">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    {displayEvents.map((e, ei) => {
                      const style = EVENT_COLORS[e.type];
                      return (
                        <div 
                          key={ei} 
                          className={cn(
                            "px-2 py-1 rounded border flex items-center gap-1.5 overflow-hidden transition-transform group-hover/event:scale-[1.02]",
                            style.bg, style.border
                          )}
                        >
                          <span className={style.text}>{getEventIcon(e.type)}</span>
                          <span className={cn("text-[9px] font-mono truncate uppercase tracking-tighter", style.text)}>
                            {e.title}
                          </span>
                        </div>
                      );
                    })}
                    {overflowCount > 0 && (
                      <div className="px-2 py-1 text-[8px] font-mono text-white/70 uppercase tracking-widest text-center hover:text-white transition-colors">
                        + {overflowCount} More
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Side Panel for Day Details */}
        <AnimatePresence>
          {selectedDate && (
            <motion.div 
              initial={{ opacity: 0, x: 20, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 400 }}
              exit={{ opacity: 0, x: 20, width: 0 }}
              className="glass rounded-[2.5rem] border border-white/5 overflow-hidden flex flex-col shrink-0"
            >
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/2">
                <div>
                  <h4 className="text-lg font-display font-medium">
                    {new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                  </h4>
                  <p className="text-[10px] font-mono text-white/70 uppercase tracking-widest">
                    {selectedDayEvents.length} Events Scheduled
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedDate(null)}
                  className="p-2 rounded-xl hover:bg-white/10 transition-colors border-none cursor-pointer"
                >
                  <X size={16} className="text-white/80" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-[#050505]">
                {selectedDayEvents.length === 0 ? (
                  <div className="py-20 text-center">
                    <CalendarIcon size={32} className="mx-auto text-white/10 mb-4" />
                    <p className="text-[10px] font-mono text-white/80 uppercase tracking-widest">No events on this day</p>
                  </div>
                ) : (
                  selectedDayEvents.map(e => {
                    const style = EVENT_COLORS[e.type];
                    return (
                      <div key={e.id} className="p-4 rounded-2xl glass border border-white/5 hover:border-white/10 transition-colors group relative overflow-hidden">
                        <div className={cn("absolute left-0 top-0 bottom-0 w-1", style.dot)} />
                        
                        <div className="flex items-start gap-3 pl-2">
                          <div className={cn("p-2 rounded-xl shrink-0 mt-0.5", style.bg, style.text)}>
                            {getEventIcon(e.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                              <p className="text-sm font-bold text-white/90 leading-tight">{e.title}</p>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <span className={cn("text-[9px] font-mono uppercase tracking-widest border px-2 py-0.5 rounded", style.text, style.border, style.bg)}>
                                {style.label}
                              </span>
                              <span className="text-white/70 text-[10px]">•</span>
                              <span className="text-[9px] font-mono text-blue-400 hover:underline cursor-pointer truncate">
                                Ref: {e.relatedId}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MasterPage>
  );
}

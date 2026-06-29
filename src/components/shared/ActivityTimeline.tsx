'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Clock, Plus, User, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface ActivityTimelineProps {
  entityType: string;
  entityId: string;
}

export function ActivityTimeline({ entityType, entityId }: ActivityTimelineProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchLogs = async () => {
    try {
      const res = await fetch(`/api/timeline?entityType=${entityType}&entityId=${entityId}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (entityType && entityId) {
      fetchLogs();
    }
  }, [entityType, entityId]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/timeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType, entityId, note })
      });

      if (res.ok) {
        setNote('');
        toast.success('Note added to timeline');
        fetchLogs(); // refresh the list
      } else {
        toast.error('Failed to add note');
      }
    } catch (error) {
      toast.error('Failed to add note');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getActionDetails = (log: any) => {
    if (log.action === 'NOTE_ADDED') {
      return {
        icon: <MessageSquare size={16} className="text-blue-400" />,
        text: 'added a note',
        color: 'bg-blue-500/20 border-blue-500/30',
        content: log.newValues?.text
      };
    }
    if (log.action === 'CREATE') {
      return {
        icon: <Plus size={16} className="text-emerald-400" />,
        text: 'created the record',
        color: 'bg-emerald-500/20 border-emerald-500/30',
      };
    }
    if (log.action === 'UPDATE') {
      return {
        icon: <Activity size={16} className="text-amber-400" />,
        text: 'updated the record',
        color: 'bg-amber-500/20 border-amber-500/30',
      };
    }
    // Default
    return {
      icon: <Activity size={16} className="text-white/40" />,
      text: `performed ${log.action}`,
      color: 'bg-white/10 border-white/20',
    };
  };

  return (
    <div className="w-full space-y-6">
      {/* Add Note Form */}
      <form onSubmit={handleAddNote} className="glass p-4 rounded-2xl flex gap-3 items-end border border-white/10 shadow-lg">
        <div className="flex-1 space-y-2">
          <label className="text-xs font-mono tracking-wider text-white/50 uppercase">Add Note</label>
          <input 
            type="text" 
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Type your note here..."
            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>
        <button 
          type="submit" 
          disabled={isSubmitting || !note.trim()}
          className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/30 text-white px-6 py-3 rounded-xl text-sm font-medium transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] whitespace-nowrap"
        >
          {isSubmitting ? 'Posting...' : 'Post Note'}
        </button>
      </form>

      {/* Timeline */}
      <div className="relative pl-6 border-l border-white/10 space-y-8 pt-4">
        {loading ? (
          <div className="text-white/40 text-sm animate-pulse">Loading timeline...</div>
        ) : logs.length === 0 ? (
          <div className="text-white/40 text-sm">No activity recorded yet.</div>
        ) : (
          <AnimatePresence>
            {logs.map((log, idx) => {
              const details = getActionDetails(log);
              return (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={log.id} 
                  className="relative"
                >
                  {/* Timeline Dot */}
                  <div className={`absolute -left-[35px] top-1 w-6 h-6 rounded-full border flex items-center justify-center bg-black ${details.color}`}>
                    {details.icon}
                  </div>
                  
                  {/* Content */}
                  <div className="glass p-4 rounded-2xl border border-white/5 space-y-2 group hover:border-white/10 transition-colors">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center overflow-hidden shrink-0">
                          {log.user?.image ? (
                            <img src={log.user.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User size={12} className="text-white/60" />
                          )}
                        </div>
                        <span className="text-sm font-medium text-white/90">
                          {log.user?.name || log.user?.email || 'System'}
                        </span>
                        <span className="text-sm text-white/50">{details.text}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-white/40 shrink-0">
                        <Clock size={12} />
                        <span>{formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}</span>
                      </div>
                    </div>
                    
                    {details.content && (
                      <div className="text-sm text-white/80 bg-black/20 p-3 rounded-xl border border-white/5">
                        {details.content}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

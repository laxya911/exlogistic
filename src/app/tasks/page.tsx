'use client';

import React, { useState, useEffect } from 'react';
import { MasterPage } from '@/components/layout/master-page';
import { 
  ListTodo, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Plus, 
  Filter, 
  ArrowUpRight,
  MoreVertical,
  Calendar as CalendarIcon,
  Search,
  Tag
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      setTasks(data);
    } catch (e) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'HIGH': return 'text-rose-400 border-rose-400/20 bg-rose-400/5';
      case 'MEDIUM': return 'text-amber-400 border-amber-400/20 bg-amber-400/5';
      case 'LOW': return 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5';
      default: return 'text-white/40 border-white/5 bg-white/5';
    }
  };

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    // Optimistic UI
    setTasks(prev => prev.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t));
    toast.success(task.isCompleted ? 'Task reopened' : 'Task marked as completed');
  };

  const filtered = tasks.filter(t => activeTab === 'completed' ? t.isCompleted : !t.isCompleted);

  return (
    <MasterPage 
      title="Operation Board" 
      subtitle="System Tasks & Follow-ups"
      loading={loading}
    >
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Header Section */}
        <div className="flex justify-between items-end">
          <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/5">
            {['pending', 'completed'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={cn(
                  "px-8 py-2.5 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all",
                  activeTab === tab 
                    ? "bg-white text-black font-bold shadow-xl" 
                    : "text-white/30 hover:text-white"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 text-black rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-blue-400 transition-all">
            <Plus size={16} /> Add Task
          </button>
        </div>

        {/* Task List */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((task, i) => (
              <motion.div 
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={task.id} 
                className={cn(
                  "glass p-6 rounded-2xl border border-white/5 group hover:border-white/20 transition-all flex items-center justify-between",
                  task.isCompleted && "opacity-60"
                )}
              >
                <div className="flex items-center gap-6">
                  <button 
                    onClick={() => toggleTask(task.id)}
                    className={cn(
                      "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                      task.isCompleted 
                        ? "bg-blue-500 border-blue-500 text-black" 
                        : "border-white/10 hover:border-white/30 text-transparent hover:text-white/30"
                    )}
                  >
                    <CheckCircle2 size={14} />
                  </button>
                  
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className={cn("text-sm font-medium", task.isCompleted && "line-through text-white/30")}>
                        {task.title}
                      </h4>
                      <span className={cn("px-2 py-0.5 rounded text-[8px] font-mono border", getPriorityColor(task.priority))}>
                        {task.priority}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-white/20 uppercase tracking-widest">
                        <Tag size={12} /> {task.category}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-white/20 uppercase tracking-widest">
                        <CalendarIcon size={12} /> Due: {formatDate(new Date(task.dueDate))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button className="p-2 rounded hover:bg-white/5 text-white/20 hover:text-white transition-colors">
                    <ArrowUpRight size={16} />
                  </button>
                  <button className="p-2 rounded hover:bg-white/5 text-white/20 hover:text-white transition-colors">
                    <MoreVertical size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className="py-24 text-center glass rounded-3xl border border-white/5">
              <ListTodo size={48} className="mx-auto mb-6 text-white/5" />
              <p className="text-sm font-display text-white/20 italic">No tasks found in this category.</p>
            </div>
          )}
        </div>
      </div>
    </MasterPage>
  );
}

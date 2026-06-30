'use client';

import React, { useState, useEffect } from 'react';
import { PageHeaderUpdater } from '@/components/layout/page-context';
import { 
  ListTodo, CheckCircle2, AlertTriangle, Plus, Tag, 
  Trash2, Calendar as CalendarIcon, X, Check, Save
} from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { Task } from '@/types';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  
  // Side Panel State
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: new Date().toISOString().split('T')[0],
    priority: 'MEDIUM',
    category: 'FOLLOW_UP',
    relatedId: ''
  });

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
      case 'HIGH': return 'text-rose-400 border-rose-400/20 bg-rose-400/10';
      case 'MEDIUM': return 'text-amber-400 border-amber-400/20 bg-amber-400/10';
      case 'LOW': return 'text-emerald-400 border-emerald-400/20 bg-emerald-400/10';
      default: return 'text-white/70 border-white/5 bg-white/5';
    }
  };

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    // Optimistic UI
    const originalTasks = [...tasks];
    setTasks(prev => prev.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t));
    
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted: !task.isCompleted })
      });
      if (!res.ok) throw new Error('Failed to update task');
      toast.success(task.isCompleted ? 'Task reopened' : 'Task marked as completed');
    } catch (e) {
      // Revert on failure
      setTasks(originalTasks);
      toast.error('Failed to update task state');
    }
  };

  const deleteTask = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setTasks(prev => prev.filter(t => t.id !== id));
      toast.success('Task removed');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return toast.error('Title is required');
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          isCompleted: false,
          entityStatus: 'ACTIVE',
        })
      });
      if (!res.ok) throw new Error('Failed to create task');
      const newTask = await res.json();
      setTasks(prev => [newTask, ...prev]);
      setIsPanelOpen(false);
      setFormData({
        title: '', description: '', dueDate: new Date().toISOString().split('T')[0],
        priority: 'MEDIUM', category: 'FOLLOW_UP', relatedId: ''
      });
      toast.success('Task created successfully');
      setActiveTab('pending'); // Auto switch to pending to see the new task
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeTasks = tasks.filter(t => t.entityStatus !== 'DELETED');
  const filtered = activeTasks.filter(t => activeTab === 'completed' ? t.isCompleted : !t.isCompleted);
  const pendingCount = activeTasks.filter(t => !t.isCompleted).length;
  const completedCount = activeTasks.filter(t => t.isCompleted).length;

  return (
    <>
      <PageHeaderUpdater title="Operation Board" subtitle="System Tasks, Reminders & Follow-ups" />
      <div className="flex gap-6 h-[calc(100vh-20rem)] min-h-[550px]">
        {/* Main Area */}
        <div className="flex-1 space-y-6 overflow-hidden flex flex-col">
          
          {/* Header KPIs & Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 shrink-0">
            <div className="flex gap-4">
              <div className="glass px-6 py-4 rounded-2xl border border-white/5 flex flex-col items-start min-w-[140px]">
                <p className="text-[10px] font-mono text-white/70 uppercase tracking-widest mb-1">Pending</p>
                <p className="text-3xl font-display font-medium text-white">{pendingCount}</p>
              </div>
              <div className="glass px-6 py-4 rounded-2xl border border-white/5 flex flex-col items-start min-w-[140px]">
                <p className="text-[10px] font-mono text-white/70 uppercase tracking-widest mb-1">Completed</p>
                <p className="text-3xl font-display font-medium text-white/70">{completedCount}</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/5">
                {['pending', 'completed'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={cn(
                      "px-8 py-2.5 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer border-none",
                      activeTab === tab 
                        ? "bg-blue-500 text-black shadow-lg shadow-blue-500/20 font-bold" 
                        : "bg-transparent text-white/70 hover:text-white"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setIsPanelOpen(true)}
                className="flex items-center gap-2 px-6 py-2.5 bg-white text-black rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-white/90 transition-all cursor-pointer border-none"
              >
                <Plus size={16} /> Add Task
              </button>
            </div>
          </div>

          {/* Task List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pb-20 pr-2">
            <AnimatePresence mode="popLayout">
              {filtered.map((task) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={task.id} 
                  className={cn(
                    "glass p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:border-white/20",
                    task.isCompleted ? "border-white/5 opacity-60 bg-white/1" : "border-white/10"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <button 
                      onClick={() => toggleTask(task.id)}
                      className={cn(
                        "w-6 h-6 shrink-0 mt-0.5 rounded border-2 flex items-center justify-center transition-all cursor-pointer",
                        task.isCompleted 
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" 
                          : "border-white/20 hover:border-blue-400 text-transparent hover:text-white/70"
                      )}
                    >
                      <Check size={14} strokeWidth={3} />
                    </button>
                    
                    <div>
                      <div className="flex flex-wrap items-center gap-3 mb-1.5">
                        <h4 className={cn("text-base font-medium", task.isCompleted && "line-through text-white/70")}>
                          {task.title}
                        </h4>
                        <span className={cn("px-2 py-0.5 rounded text-[9px] font-mono border uppercase tracking-widest", getPriorityColor(task.priority))}>
                          {task.priority}
                        </span>
                        {task.relatedId && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono border border-blue-500/20 bg-blue-500/10 text-blue-400">
                            Ref: {task.relatedId}
                          </span>
                        )}
                      </div>
                      
                      {task.description && (
                        <p className={cn("text-xs font-mono mb-3 line-clamp-2", task.isCompleted ? "text-white/70" : "text-white/80")}>
                          {task.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-white/80 uppercase tracking-widest">
                          <Tag size={12} /> {task.category}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-white/80 uppercase tracking-widest">
                          <CalendarIcon size={12} /> Due: {formatDate(new Date(task.dueDate))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => deleteTask(task.id)}
                      className="p-2.5 rounded-lg hover:bg-rose-500/10 text-white/80 hover:text-rose-400 transition-colors border-none cursor-pointer"
                      title="Delete Task"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filtered.length === 0 && (
              <div className="py-24 text-center glass rounded-4xl border border-white/5">
                <ListTodo size={48} className="mx-auto mb-6 text-white/10" />
                <p className="text-sm font-mono text-white/80 uppercase tracking-widest">No tasks found in this tab.</p>
              </div>
            )}
          </div>
        </div>

        {/* Create Task Side Panel */}
        <AnimatePresence>
          {isPanelOpen && (
            <motion.div 
              initial={{ opacity: 0, x: 20, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 450 }}
              exit={{ opacity: 0, x: 20, width: 0 }}
              className="glass rounded-[2.5rem] border border-white/5 overflow-hidden flex flex-col shrink-0"
            >
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/2">
                <div>
                  <h4 className="text-lg font-display font-medium">New Task</h4>
                  <p className="text-[10px] font-mono text-white/70 uppercase tracking-widest">Add an operation item</p>
                </div>
                <button 
                  onClick={() => setIsPanelOpen(false)}
                  className="p-2 rounded-xl hover:bg-white/10 transition-colors border-none cursor-pointer"
                >
                  <X size={16} className="text-white/80" />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono text-white/70 uppercase tracking-widest mb-2">Task Title *</label>
                    <input 
                      type="text" 
                      required
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 text-white"
                      placeholder="E.g., Send documents via DHL"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-white/70 uppercase tracking-widest mb-2">Description</label>
                    <textarea 
                      rows={3}
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 text-white resize-none"
                      placeholder="Optional details..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-white/70 uppercase tracking-widest mb-2">Due Date</label>
                      <input 
                        type="date"
                        required
                        value={formData.dueDate}
                        onChange={e => setFormData({...formData, dueDate: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 text-white color-scheme-dark"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-white/70 uppercase tracking-widest mb-2">Priority</label>
                      <select 
                        value={formData.priority}
                        onChange={e => setFormData({...formData, priority: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 text-white"
                      >
                        <option className="bg-[#0c0c0c]" value="LOW">Low</option>
                        <option className="bg-[#0c0c0c]" value="MEDIUM">Medium</option>
                        <option className="bg-[#0c0c0c]" value="HIGH">High</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-white/70 uppercase tracking-widest mb-2">Category</label>
                      <select 
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 text-white"
                      >
                        <option className="bg-[#0c0c0c]" value="FOLLOW_UP">Follow Up</option>
                        <option className="bg-[#0c0c0c]" value="DOCUMENT">Document</option>
                        <option className="bg-[#0c0c0c]" value="PAYMENT">Payment</option>
                        <option className="bg-[#0c0c0c]" value="SHIPMENT">Shipment</option>
                        <option className="bg-[#0c0c0c]" value="QUOTATION">Quotation</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-white/70 uppercase tracking-widest mb-2">Related Entity ID</label>
                      <input 
                        type="text" 
                        value={formData.relatedId}
                        onChange={e => setFormData({...formData, relatedId: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 text-white"
                        placeholder="E.g., SO-2025-001"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-blue-500 text-black text-[10px] font-mono font-bold uppercase tracking-widest rounded-xl hover:bg-blue-400 transition-colors flex items-center justify-center gap-2 border-none cursor-pointer disabled:opacity-50"
                  >
                    <Save size={14} /> {isSubmitting ? 'Saving...' : 'Save Task'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

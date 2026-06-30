'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Command, Loader2, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { SearchResult } from '@/services/search.service';

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Debounced Search
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results || []);
        setSelectedIndex(-1);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard Navigation (Ctrl+K to open, Arrows to navigate)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }

      if (!open) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        const selected = results[selectedIndex];
        if (selected) {
          router.push(selected.url);
          setOpen(false);
          setQuery('');
        }
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, results, selectedIndex, router]);

  const handleSelect = (url: string) => {
    router.push(url);
    setOpen(false);
    setQuery('');
  };

  return (
    <div className="relative w-full max-w-md" ref={dropdownRef}>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40 group-focus-within:text-blue-400 transition-colors">
          <Search size={16} />
        </div>
        <input 
          ref={inputRef}
          type="text" 
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => { if (query) setOpen(true); }}
          placeholder="Search matrix (Ctrl+K)"
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-12 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all font-mono shadow-inner"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          {loading ? (
            <Loader2 size={14} className="text-white/40 animate-spin" />
          ) : (
            <div className="hidden sm:flex items-center gap-1 px-1.5 py-1 rounded bg-white/5 border border-white/10">
              <Command size={10} className="text-white/50" />
              <span className="text-[9px] font-mono font-bold text-white/50">K</span>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {open && query.trim().length >= 2 && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }} // Fast animation
            className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0a]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[400px]"
          >
            <div className="overflow-y-auto custom-scrollbar p-2">
              {results.length === 0 && !loading ? (
                <div className="p-8 text-center text-xs text-white/50 font-mono uppercase tracking-widest">
                  No records found
                </div>
              ) : (
                <div className="space-y-1">
                  {results.map((r, index) => (
                    <div 
                      key={`${r.id}-${index}`}
                      onClick={() => handleSelect(r.url)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`flex justify-between items-center p-3 rounded-xl transition-colors cursor-pointer group ${
                        index === selectedIndex ? 'bg-blue-500/20 border border-blue-500/30' : 'hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className={`text-sm font-medium ${index === selectedIndex ? 'text-white' : 'text-white/90 group-hover:text-white'}`}>
                          {r.title}
                        </span>
                        <div className="flex items-center gap-2 mt-1 text-[10px] font-mono">
                          <span className="px-1.5 py-0.5 rounded bg-white/10 text-white/70 uppercase tracking-widest">
                            {r.type}
                          </span>
                          <span className="text-white/40 truncate max-w-[200px]">
                            {r.subtitle}
                          </span>
                        </div>
                      </div>
                      <ArrowRight size={14} className={`transition-opacity ${index === selectedIndex ? 'opacity-100 text-blue-400' : 'opacity-0 text-white/30 group-hover:opacity-100'}`} />
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

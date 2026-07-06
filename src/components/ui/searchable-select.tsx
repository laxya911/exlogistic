import React, { useState, useRef, useEffect, useLayoutEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { Search, Plus, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

export interface Option {
  label: string;
  value: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string | string[];
  onChange: (value: any) => void;
  multiple?: boolean;
  placeholder?: string;
  onAddClick?: (searchValue: string) => void;
  onAddNew?: () => void;
  addLabel?: string;
  className?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  multiple = false,
  placeholder = 'Select...',
  onAddClick,
  onAddNew,
  addLabel = 'Add New',
  className
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const portalId = useId();

  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const updatePosition = () => {
    if (isOpen && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
        zIndex: 99999
      });
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const portalEl = document.getElementById(`searchable-portal-${portalId}`);
      if (
        wrapperRef.current && 
        !wrapperRef.current.contains(target) &&
        (!portalEl || !portalEl.contains(target))
      ) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    if (isOpen) {
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  useLayoutEffect(() => {
    updatePosition();
  }, [isOpen]);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (optValue: string) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      if (currentValues.includes(optValue)) {
        onChange(currentValues.filter(v => v !== optValue));
      } else {
        onChange([...currentValues, optValue]);
      }
    } else {
      onChange(optValue);
      setIsOpen(false);
    }
    setSearch('');
  };

  const getDisplayValue = () => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      if (currentValues.length === 0) return placeholder;
      if (currentValues.length === 1) {
        return options.find(o => o.value === currentValues[0])?.label || currentValues[0];
      }
      return `${currentValues.length} selected`;
    } else {
      if (!value) return placeholder;
      return options.find(o => o.value === value)?.label || value;
    }
  };

  return (
    <div ref={wrapperRef} className={cn("relative w-full", isOpen ? "z-50" : "z-auto", className)}>
      <div 
        className="w-full bg-[#0b0b0b] border border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-white focus:outline-none cursor-pointer flex justify-between items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={!value || (multiple && value.length === 0) ? 'text-white/50' : 'text-white truncate pr-4'}>
          {getDisplayValue()}
        </span>
      </div>

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
            id={`searchable-portal-${portalId}`}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            style={dropdownStyle}
            className="bg-[#111] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="p-2 border-b border-white/5 flex items-center gap-2">
              <Search size={14} className="text-white/50 ml-2" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full bg-transparent border-none focus:outline-none text-sm text-white py-1"
              />
            </div>
            
            <div className="max-h-60 overflow-y-auto p-1">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt, idx) => {
                  const isSelected = multiple 
                    ? (Array.isArray(value) && value.includes(opt.value))
                    : value === opt.value;
                    
                  return (
                    <div
                      key={opt.value || String(idx)}
                      onClick={() => handleSelect(opt.value)}
                      className={cn(
                        "px-3 py-2 text-sm rounded-lg cursor-pointer flex items-center justify-between",
                        isSelected ? "bg-blue-600/20 text-blue-400" : "hover:bg-white/5 text-white/90"
                      )}
                    >
                      {opt.label}
                      {isSelected && <Check size={14} />}
                    </div>
                  );
                })
              ) : (
                <div className="px-3 py-4 text-sm text-center text-white/40">
                  No results found
                </div>
              )}
            </div>
            
            {(onAddClick || onAddNew) && (
              <div 
                className="p-2 border-t border-white/5 bg-white/2"
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    if (onAddClick) onAddClick(search);
                    if (onAddNew) onAddNew();
                  }}
                  className="w-full px-3 py-2 text-sm text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Plus size={14} />
                  {addLabel} {search && `"${search}"`}
                </button>
              </div>
            )}
          </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

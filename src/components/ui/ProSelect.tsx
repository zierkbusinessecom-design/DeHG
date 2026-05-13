'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/context/TranslationContext';
import { Portal } from './Portal';

interface Option {
  value: string;
  label: string;
  subtext?: string;
}

interface ProSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  searchable?: boolean;
}

export function ProSelect({ 
  options, 
  value, 
  onChange, 
  placeholder, 
  label, 
  className,
  searchable = false
}: ProSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opt.subtext?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const updateCoords = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener('scroll', updateCoords, true);
      window.addEventListener('resize', updateCoords);
    }
    return () => {
      window.removeEventListener('scroll', updateCoords, true);
      window.removeEventListener('resize', updateCoords);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node) && 
          dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn("space-y-1.5 w-full relative", className)} ref={containerRef}>
      {label && <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1 block">{label}</label>}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-5 text-left flex items-center justify-between transition-all hover:bg-white/10 group focus:ring-2 focus:ring-primary/50 relative z-10",
          isOpen && "border-primary/50 bg-white/10 shadow-[0_0_20px_-5px_rgba(16,185,129,0.2)]",
          !selectedOption && "text-muted-foreground"
        )}
      >
        <span className="text-sm font-bold truncate">
          {selectedOption ? selectedOption.label : (placeholder || t.select)}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-300", isOpen && "rotate-180 text-primary")} />
      </button>

      {isOpen && (
        <Portal>
          <div 
            ref={dropdownRef}
            style={{ 
              position: 'absolute',
              top: coords.top + 8,
              left: coords.left,
              width: coords.width,
              zIndex: 999999
            }}
            className="bg-[#121216] border border-white/10 rounded-3xl shadow-[0_30px_60px_-12px_rgba(0,0,0,0.8)] overflow-hidden animate-in fade-in zoom-in-95 duration-200 pointer-events-auto"
          >
            {searchable && (
              <div className="p-3 border-b border-white/5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    autoFocus
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                    placeholder={t.search}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            )}
            
            <div className="max-h-64 overflow-y-auto custom-scrollbar p-2">
              {filteredOptions.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground italic">Aucun résultat</div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-2xl transition-all flex items-center justify-between group/opt mb-1 last:mb-0",
                      value === option.value 
                        ? "bg-primary text-white shadow-lg shadow-primary/20" 
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-black uppercase tracking-tight">{option.label}</span>
                      {option.subtext && <span className={cn("text-[9px] mt-0.5", value === option.value ? "text-white/70" : "text-muted-foreground group-hover/opt:text-white/50")}>{option.subtext}</span>}
                    </div>
                    {value === option.value && <Check className="w-4 h-4" />}
                  </button>
                ))
              )}
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}

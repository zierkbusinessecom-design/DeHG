'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Result {
  id: string;
  title: string;
  subtext?: string;
  data?: any;
}

interface ClientAutocompleteProps {
  onSelect: (result: Result) => void;
  placeholder?: string;
  className?: string;
  onSearch: (query: string) => Promise<Result[]>;
}

export function ClientAutocomplete({ onSelect, placeholder = "Rechercher...", className, onSearch }: ClientAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (query.length > 1) {
        setLoading(true);
        const data = await onSearch(query);
        setResults(data);
        setIsOpen(true);
        setLoading(false);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <div className="relative">
        <input
          type="text"
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-white/10 transition-all"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length > 1 && setIsOpen(true)}
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 w-full mt-2 glass-card rounded-2xl border border-white/10 shadow-2xl z-[100] overflow-hidden animate-fade-in">
          <div className="max-h-80 overflow-y-auto p-1">
            {results.map((result) => (
              <button
                key={result.id}
                onClick={() => {
                  onSelect(result);
                  setQuery('');
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-3 rounded-xl hover:bg-primary/10 group transition-all"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white uppercase group-hover:text-primary transition-colors">
                    {result.title}
                  </span>
                  {result.subtext && (
                    <span className="text-[11px] text-muted-foreground mt-0.5">
                      {result.subtext}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

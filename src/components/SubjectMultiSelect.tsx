'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Check, ChevronDown, X, Search, BookOpen } from 'lucide-react';
import { createClient } from '@/lib/supabase-client';
import { cn } from '@/lib/utils';

interface Subject {
  id: string;
  name: string;
  book_name?: string;
  isDefault?: boolean;
}

interface SubjectMultiSelectProps {
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

export function SubjectMultiSelect({ selectedValues, onChange, placeholder = "Sélectionner les matières..." }: SubjectMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const { data } = await supabase.from('subjects').select('id, name, book_name');
        
        let allSubjects: Subject[] = data || [];
        
        // Add "Le Noble Coran" if not present
        if (!allSubjects.some(s => s.name === 'Le Noble Coran')) {
          allSubjects = [
            { id: 'quran-default', name: 'Le Noble Coran', book_name: 'Noble Coran', isDefault: true },
            ...allSubjects
          ];
        }
        
        setSubjects(allSubjects);
      } catch (error) {
        console.error("Error fetching subjects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleSubject = (subjectName: string) => {
    if (selectedValues.includes(subjectName)) {
      onChange(selectedValues.filter(v => v !== subjectName));
    } else {
      onChange([...selectedValues, subjectName]);
    }
  };

  const removeSubject = (e: React.MouseEvent, subjectName: string) => {
    e.stopPropagation();
    onChange(selectedValues.filter(v => v !== subjectName));
  };

  const filteredSubjects = subjects.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.book_name && s.book_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="relative w-full" ref={containerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "input-field min-h-[52px] flex flex-wrap gap-2 items-center cursor-pointer transition-all",
          isOpen ? "ring-2 ring-primary/50 border-primary/50" : "hover:border-white/20"
        )}
      >
        {selectedValues.length === 0 ? (
          <span className="text-muted-foreground text-sm ml-1">{placeholder}</span>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedValues.map(value => (
              <span 
                key={value} 
                className="flex items-center gap-1.5 px-3 py-1 bg-primary/20 text-primary text-[10px] font-black rounded-lg border border-primary/30 uppercase tracking-tight animate-in zoom-in-95 duration-200"
              >
                {value}
                <X 
                  className="w-3 h-3 cursor-pointer hover:text-white transition-colors" 
                  onClick={(e) => removeSubject(e, value)}
                />
              </span>
            ))}
          </div>
        )}
        <div className="ml-auto flex items-center gap-2 pr-1">
          <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-300", isOpen && "rotate-180")} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-[#0a0a0c] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="p-3 border-b border-white/5 bg-white/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input 
                type="text" 
                className="w-full bg-black/20 border border-white/5 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary/30"
                placeholder="Filtrer les matières..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="p-4 text-center text-xs text-muted-foreground">Chargement...</div>
            ) : filteredSubjects.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">Aucune matière trouvée</div>
            ) : (
              filteredSubjects.map(subject => {
                const isSelected = selectedValues.includes(subject.name);
                return (
                  <div 
                    key={subject.id}
                    onClick={() => toggleSubject(subject.name)}
                    className={cn(
                      "flex items-center justify-between px-4 py-3 cursor-pointer transition-colors group",
                      isSelected ? "bg-primary/10 text-primary" : "text-white/70 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-1.5 rounded-lg border transition-colors",
                        isSelected ? "bg-primary text-primary-foreground border-primary" : "bg-white/5 border-white/5 group-hover:border-white/10"
                      )}>
                        <BookOpen className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">{subject.name}</span>
                        {subject.book_name && (
                          <span className="text-[9px] opacity-50 uppercase tracking-tighter">Support: {subject.book_name}</span>
                        )}
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-primary" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

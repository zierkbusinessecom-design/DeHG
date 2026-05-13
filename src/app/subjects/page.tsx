'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useTranslation } from '@/context/TranslationContext';
import { 
  BookOpen, 
  Plus, 
  Layers, 
  Book, 
  FileText,
  Search,
  MoreVertical,
  Library
} from 'lucide-react';
import { createClient } from '@/lib/supabase-client';
import { cn } from '@/lib/utils';

export default function SubjectsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const supabase = createClient();

  useEffect(() => {
    const fetchSubjects = async () => {
      const { data } = await supabase.from('subjects').select('*');
      if (data) setSubjects(data);
      setLoading(false);
    };
    fetchSubjects();
  }, []);

  const allSubjects = subjects.some(s => s.name === 'Le Noble Coran') 
    ? subjects 
    : [{ id: 'quran-default', name: 'Le Noble Coran', book_name: 'Noble Coran', description: 'Mémorisation, Tajwid et étude du Noble Coran.', isDefault: true }, ...subjects];

  const filteredSubjects = allSubjects.filter(subject => 
    subject.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.book_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedSubjects = [...filteredSubjects].sort((a, b) => {
    if (a.name === 'Le Noble Coran') return -1;
    if (b.name === 'Le Noble Coran') return 1;
    return 0;
  });

  return (
    <DashboardLayout>
      <div className="page-transition">
        <div className="flex flex-wrap justify-between items-center gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">{t.subjects}</h1>
            <p className="text-muted-foreground text-sm font-medium mt-1">Gestion du catalogue des cours et supports de cours</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text"
                placeholder="Rechercher une matière..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-2xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => router.push('/subjects/new')}
              className="flex items-center gap-3 bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3.5 rounded-2xl font-black text-sm transition-all shadow-[0_0_30px_-5px_rgba(34,197,94,0.5)] uppercase tracking-tighter"
            >
              <Plus className="w-5 h-5" />
              {t.add_subject}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            [...Array(3)].map((_, i) => <div key={i} className="h-64 bg-white/5 rounded-[2.5rem] animate-pulse border border-white/5" />)
          ) : filteredSubjects.length === 0 ? (
            <div className="col-span-full py-32 text-center glass-card rounded-[2.5rem] border-dashed">
              <Library className="w-16 h-16 mx-auto mb-4 opacity-10" />
              <p className="text-muted-foreground font-bold italic">Aucune matière enregistrée</p>
            </div>
          ) : (
            sortedSubjects.map((subject) => {
              const isQuran = subject.name === 'Le Noble Coran';
              
              return (
                <div key={subject.id} className={cn(
                  "glass-card p-8 rounded-[2.5rem] border transition-all duration-500 group relative overflow-hidden",
                  isQuran ? "border-primary/40 bg-primary/5 shadow-[0_0_40px_-10px_rgba(34,197,94,0.2)]" : "border-white/5 hover:border-primary/30"
                )}>
                  <div className="flex justify-between items-start mb-8 relative z-10">
                    <div className={cn(
                      "p-4 rounded-2xl border shadow-xl group-hover:scale-110 transition-transform duration-500",
                      isQuran ? "bg-primary text-primary-foreground border-primary" : "bg-primary/10 border-primary/20 text-primary"
                    )}>
                      <BookOpen className="w-7 h-7" />
                    </div>
                    {isQuran && (
                      <span className="px-3 py-1 bg-primary/20 text-primary text-[9px] font-black rounded-full border border-primary/30 uppercase tracking-widest">Matière Système</span>
                    )}
                    {!isQuran && (
                      <button className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-muted-foreground hover:text-white border border-white/10 transition-all">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    )}
                  </div>
  
                  <div className="relative z-10 mb-8">
                    <h3 className="text-2xl font-black text-white tracking-tight leading-none">{subject.name}</h3>
                    <p className="text-xs text-muted-foreground mt-3 line-clamp-2 font-medium opacity-80">{subject.description || 'Catalogue officiel de la matière.'}</p>
                  </div>
  
                  <div className="space-y-4 mb-8 relative z-10">
                    <div className="flex items-center gap-4 text-muted-foreground group-hover:text-white transition-colors">
                      <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                        <Book className="w-4 h-4 text-primary/60" />
                      </div>
                      <span className="text-[11px] font-bold tracking-tight uppercase">{subject.book_name || 'Livre non spécifié'}</span>
                    </div>
                    <div className="flex items-center gap-4 text-muted-foreground group-hover:text-white transition-colors">
                      <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                        <Layers className="w-4 h-4 text-primary/60" />
                      </div>
                      <span className="text-[11px] font-bold tracking-tight uppercase">Niveau: {subject.level || 'Général'}</span>
                    </div>
                  </div>
  
                  {!isQuran ? (
                    <button className="w-full py-4 rounded-[1.25rem] bg-white/5 hover:bg-primary text-white hover:text-primary-foreground text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-white/10 hover:border-primary shadow-lg hover:shadow-primary/20 relative z-10">
                      Modifier le Programme
                    </button>
                  ) : (
                    <div className="w-full py-4 text-center rounded-[1.25rem] bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] border border-primary/20">
                      Matière Permanente
                    </div>
                  )}
  
                  <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-500" />
                </div>
              );
            }))
          }
        </div>
      </div>
    </DashboardLayout>
  );
}

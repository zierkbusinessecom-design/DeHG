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
  Library,
  Trash2,
  Edit2
} from 'lucide-react';
import { Portal } from '@/components/Portal';
import { useRef } from 'react';
import { createClient } from '@/lib/supabase-client';
import { cn } from '@/lib/utils';

export default function SubjectsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const supabase = createClient();

  const fetchSubjects = async () => {
    setLoading(true);
    const { data } = await supabase.from('subjects').select('*');
    if (data) setSubjects(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm("Voulez-vous vraiment supprimer cette matière ?")) {
      const { error } = await supabase.from('subjects').delete().eq('id', id);
      if (!error) {
        fetchSubjects();
      } else {
        alert("Erreur lors de la suppression: " + error.message);
      }
    }
  };

  const allSubjects = subjects.some(s => s.name === 'Le Noble Coran') 
    ? subjects 
    : [{ id: 'quran-default', name: 'Le Noble Coran', book_name: 'Noble Coran', description: 'Mémorisation, Tajwid et étude du Noble Coran.', isDefault: true }, ...subjects];

  const filteredSubjects = allSubjects.filter(subject => 
    subject.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.book_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            filteredSubjects.map((subject) => {
              return (
                <div key={subject.id} className="glass-card p-8 rounded-[2.5rem] border transition-all duration-500 group relative overflow-hidden border-white/5 hover:border-primary/30">
                  <div className="flex justify-between items-start mb-8 relative z-10">
                    <div className="p-4 rounded-2xl border shadow-xl group-hover:scale-110 transition-transform duration-500 bg-primary/10 border-primary/20 text-primary">
                      <BookOpen className="w-7 h-7" />
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(subject.id);
                      }}
                      className="p-2.5 bg-red-500/10 hover:bg-red-500 rounded-xl text-red-500 hover:text-white border border-red-500/20 transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
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
  
                  <button 
                    onClick={() => router.push(`/subjects/edit/${subject.id}`)}
                    className="w-full py-4 rounded-[1.25rem] bg-white/5 hover:bg-primary text-white hover:text-primary-foreground text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-white/10 hover:border-primary shadow-lg hover:shadow-primary/20 relative z-10"
                  >
                    Modifier le Programme
                  </button>
  
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

function SubjectActions({ subject, onDelete }: { subject: any, onDelete: () => void }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (buttonRef.current) {
      setButtonRect(buttonRef.current.getBoundingClientRect());
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      <button 
        ref={buttonRef}
        onClick={toggleMenu}
        className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-muted-foreground hover:text-white border border-white/10 transition-all shadow-sm"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {isOpen && buttonRect && (
        <Portal>
          <div 
            className="fixed inset-0 z-[9998]" 
            onClick={() => setIsOpen(false)} 
          />
          <div 
            className="fixed z-[9999] w-48 bg-[#121214] border border-white/10 rounded-2xl shadow-2xl overflow-hidden page-transition"
            style={{ 
              top: `${buttonRect.bottom + 8}px`, 
              left: `${buttonRect.left - 150}px` 
            }}
          >
            <button 
              onClick={() => { router.push(`/subjects/edit/${subject.id}`); setIsOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/5 transition-colors"
            >
              <Edit2 className="w-4 h-4 text-primary" /> Modifier
            </button>
            <button 
              onClick={() => { onDelete(); setIsOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-400/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Supprimer
            </button>
          </div>
        </Portal>
      )}
    </div>
  );
}

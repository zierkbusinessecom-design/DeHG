'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useTranslation } from '@/context/TranslationContext';
import { 
  UserSquare2, 
  Mail, 
  Phone, 
  BookOpen, 
  Plus,
  MoreVertical,
  Search,
  Filter,
  Trash2,
  Edit2,
  ExternalLink
} from 'lucide-react';
import { Portal } from '@/components/Portal';
import { createClient } from '@/lib/supabase-client';
import { cn } from '@/lib/utils';

export default function TeachersPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const supabase = createClient();

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('teachers')
      .select('*, profiles(*)');
    
    if (data) setTeachers(data);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Voulez-vous vraiment supprimer ce professeur ?")) {
      const { error } = await supabase.from('teachers').delete().eq('id', id);
      if (!error) {
        fetchTeachers();
      }
    }
  };

  const filteredTeachers = teachers.filter(teacher => 
    `${teacher.profiles?.first_name} ${teacher.profiles?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.specialty?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="page-transition">
        <div className="flex flex-wrap justify-between items-center gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">{t.teachers}</h1>
            <p className="text-muted-foreground text-sm font-medium mt-1">Gérez l'équipe pédagogique et leurs spécialités</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text"
                placeholder="Rechercher un prof..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-2xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => router.push('/teachers/new')}
              className="flex items-center gap-3 bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3.5 rounded-2xl font-black text-sm transition-all shadow-[0_0_30px_-5px_rgba(34,197,94,0.5)] uppercase tracking-tighter"
            >
              <Plus className="w-5 h-5" />
              {t.add_teacher}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            [...Array(3)].map((_, i) => <div key={i} className="h-72 bg-white/5 rounded-[2.5rem] animate-pulse border border-white/5" />)
          ) : filteredTeachers.length === 0 ? (
            <div className="col-span-full py-32 text-center glass-card rounded-[2.5rem] border-dashed">
              <UserSquare2 className="w-16 h-16 mx-auto mb-4 opacity-10" />
              <p className="text-muted-foreground font-bold italic">Aucun professeur trouvé</p>
            </div>
          ) : (
            filteredTeachers.map((teacher) => (
              <div key={teacher.id} className="glass-card p-8 rounded-[2.5rem] border border-white/5 hover:border-primary/30 transition-all duration-500 group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 z-20">
                  <TeacherActions teacher={teacher} onDelete={() => handleDelete(teacher.id)} />
                </div>

                <div className="flex items-center gap-6 mb-8 relative z-10">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/30 to-transparent flex items-center justify-center text-primary font-black text-3xl border border-primary/20 shadow-2xl group-hover:scale-110 transition-transform duration-500">
                    {teacher.profiles?.first_name?.[0]}{teacher.profiles?.last_name?.[0]}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">{teacher.profiles?.first_name} {teacher.profiles?.last_name}</h3>
                  </div>
                </div>

                <div className="space-y-4 mb-8 relative z-10">
                  <div className="flex items-center gap-4 text-muted-foreground group-hover:text-white transition-colors">
                    <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                      <Mail className="w-4 h-4 text-primary/60" />
                    </div>
                    <span className="text-xs font-medium tracking-tight">{teacher.profiles?.email || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-4 text-muted-foreground group-hover:text-white transition-colors">
                    <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                      <Phone className="w-4 h-4 text-primary/60" />
                    </div>
                    <span className="text-xs font-medium tracking-tight">{teacher.profiles?.phone || 'N/A'}</span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-muted-foreground group-hover:text-white transition-colors">
                    <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                      <BookOpen className="w-4 h-4 text-primary/60" />
                    </div>
                    <span className="text-xs font-medium tracking-tight">
                      {teacher.specialty ? teacher.specialty.split(',').filter((s: string) => s.trim() !== '').length : 0} Matière(s) spécialisée(s)
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 relative z-10">
                  <button 
                    onClick={() => router.push(`/teachers/${teacher.id}`)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest py-3.5 rounded-[1.25rem] border border-white/10 transition-all flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-3 h-3" /> Voir le Dossier Complet
                  </button>
                </div>

                <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-500" />
              </div>
            )))
          }
        </div>
      </div>
    </DashboardLayout>
  );
}

function TeacherActions({ teacher, onDelete }: { teacher: any, onDelete: () => void }) {
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
              onClick={() => { router.push(`/teachers/edit/${teacher.id}`); setIsOpen(false); }}
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

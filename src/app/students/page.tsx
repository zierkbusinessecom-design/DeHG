'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useTranslation } from '@/context/TranslationContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  UserPlus, 
  Eye, 
  Edit2, 
  Trash2,
  AlertCircle
} from 'lucide-react';
import { createClient } from '@/lib/supabase-client';
import { cn } from '@/lib/utils';

export default function StudentsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const fetchStudents = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('students')
      .select(`
        *,
        student_parent (
          parents (*)
        )
      `)
      .order('last_name', { ascending: true });
    
    if (data) setStudents(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le dossier de ${name} ? Cette action est irréversible.`)) {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (!error) {
        setStudents(prev => prev.filter(s => s.id !== id));
        alert("Élève supprimé avec succès.");
      } else {
        alert("Erreur lors de la suppression : " + error.message);
      }
    }
  };

  const filteredStudents = students.filter(s => 
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="page-transition">
        <div className="flex flex-wrap justify-between items-center gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">{t.students}</h1>
            <p className="text-muted-foreground text-sm font-medium mt-1">Gérez les dossiers complets de vos élèves</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text"
                placeholder={t.search}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-2xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Link href="/students/new" className="flex items-center gap-3 bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3.5 rounded-2xl font-black text-sm transition-all shadow-[0_0_30px_-5px_rgba(34,197,94,0.5)] uppercase tracking-tighter">
              <UserPlus className="w-5 h-5" />
              {t.add_student}
            </Link>
          </div>
        </div>

        <div className="glass-card rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="px-8 py-6 text-[11px] font-black text-muted-foreground uppercase tracking-widest">Élève</th>
                <th className="px-8 py-6 text-[11px] font-black text-muted-foreground uppercase tracking-widest">Groupe</th>
                <th className="px-8 py-6 text-[11px] font-black text-muted-foreground uppercase tracking-widest">Coran</th>
                <th className="px-8 py-6 text-[11px] font-black text-muted-foreground uppercase tracking-widest">Statut</th>
                <th className="px-8 py-6 text-[11px] font-black text-muted-foreground uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                [...Array(6)].map((_, i) => <tr key={i} className="animate-pulse"><td colSpan={5} className="px-8 py-6"><div className="h-5 bg-white/5 rounded-xl w-full" /></td></tr>)
              ) : filteredStudents.length === 0 ? (
                <tr><td colSpan={5} className="px-8 py-24 text-center text-muted-foreground italic">Aucun élève trouvé</td></tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/30 to-transparent flex items-center justify-center text-primary font-black text-lg border border-primary/20 shadow-lg group-hover:scale-110 transition-transform">
                          {student.first_name[0]}{student.last_name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-black text-white uppercase tracking-tight">{student.last_name}</p>
                          <p className="text-xs text-muted-foreground font-medium">{student.first_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="px-4 py-1.5 rounded-xl bg-primary/10 text-primary text-[10px] font-black uppercase border border-primary/20 shadow-lg shadow-primary/5">
                        {student.group_id === 'morning' ? 'Groupe A (Matin)' : 'Groupe B (Après-midi)'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-2 max-w-[120px]">
                        <div className="flex justify-between text-[10px] font-black uppercase text-muted-foreground">
                          <span>Juz {student.current_juz || 30}</span>
                          <span className="text-primary">{Math.round(((student.current_juz || 30) / 30) * 100)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                          <div className="h-full bg-primary shadow-[0_0_10px_rgba(34,197,94,0.5)]" style={{ width: `${((student.current_juz || 30) / 30) * 100}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border",
                        student.status === 'active' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                      )}>
                        {student.status === 'active' ? t.active : t.inactive}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-end gap-2 transition-opacity">
                        <button 
                          onClick={() => router.push(`/students/${student.id}`)}
                          className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-muted-foreground hover:text-white transition-all border border-white/5 hover:border-white/10"
                          title={t.view}
                        >
                          <Eye className="w-4.5 h-4.5" />
                        </button>
                        <button 
                          onClick={() => router.push(`/students/edit/${student.id}`)}
                          className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-muted-foreground hover:text-primary transition-all border border-white/5 hover:border-white/10"
                          title={t.edit}
                        >
                          <Edit2 className="w-4.5 h-4.5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(student.id, `${student.first_name} ${student.last_name}`)}
                          className="p-2.5 bg-white/5 hover:bg-red-500/10 rounded-xl text-muted-foreground hover:text-red-400 transition-all border border-white/5 hover:border-white/10"
                          title={t.delete}
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

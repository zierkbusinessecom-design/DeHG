'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useTranslation } from '@/context/TranslationContext';
import { 
  BookMarked, 
  Search, 
  History, 
  Target,
  BarChart3,
  BookOpen,
  ArrowRight,
  Save
} from 'lucide-react';
import { createClient } from '@/lib/supabase-client';
import { ProSelect } from '@/components/ui/ProSelect';
import { cn } from '@/lib/utils';

// Données de référence demandées pour les Juz
const JUZ_DATA = [
  { juz: 30, surah: "An-Naba'", page: 582, surahs: ["An-Naba'", "An-Nazi'at", "Abasa", "At-Takwir", "Al-Infitar", "Al-Mutaffifin", "Al-Inshiqaq", "Al-Buruj", "At-Tariq", "Al-A'la", "Al-Ghashiyah", "Al-Fajr", "Al-Balad", "Ash-Shams", "Al-Layl", "Ad-Duha", "Ash-Sharh", "At-Tin", "Al-Alaq", "Al-Qadr", "Al-Bayyinah", "Az-Zalzalah", "Al-Adiyat", "Al-Qari'ah", "At-Takathur", "Al-Asr", "Al-Humazah", "Al-Fil", "Quraysh", "Al-Ma'un", "Al-Kawthar", "Al-Kafirun", "An-Nasr", "Al-Masad", "Al-Ikhlas", "Al-Falaq", "An-Nas"] },
  { juz: 29, surah: "Al-Mulk", page: 562, surahs: ["Al-Mulk", "Al-Qalam", "Al-Haqqah", "Al-Ma'arij", "Nuh", "Al-Jinn", "Al-Muzzammil", "Al-Muddathir", "Al-Qiyamah", "Al-Insan", "Al-Mursalat"] },
  // ... On peut étendre jusqu'à Juz 1
  { juz: 1, surah: "Al-Fatiha", page: 1, surahs: ["Al-Fatiha", "Al-Baqarah"] }
];

export default function QuranPage() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [editData, setEditData] = useState({ juz: 30, surah: "An-Naba'", page: 582 });

  const supabase = createClient();

  useEffect(() => {
    const fetchStudents = async () => {
      const { data } = await supabase.from('students').select('*').order('last_name');
      if (data) setStudents(data);
      setLoading(false);
    };
    fetchStudents();
  }, []);

  const filteredStudents = students.filter(s => 
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpdate = async () => {
    if (!selectedStudent) return;
    const { error } = await supabase
      .from('students')
      .update({ current_juz: editData.juz, current_surah: editData.surah, current_page: editData.page })
      .eq('id', selectedStudent.id);
    
    if (!error) {
      // alert(t.success_msg);
      setSelectedStudent(null);
      // Refresh list
      const { data } = await supabase.from('students').select('*').order('last_name');
      if (data) setStudents(data);
    }
  };

  // Liste des Juz décroissante (30 -> 1)
  const juzOptions = JUZ_DATA.map(d => ({ 
    value: d.juz.toString(), 
    label: `Juz ${d.juz}`, 
    subtext: `${d.surah} (p.${d.page})` 
  }));

  // Sourates filtrées par Juz
  const currentJuzData = JUZ_DATA.find(d => d.juz.toString() === editData.juz.toString());
  const surahOptions = currentJuzData?.surahs.map(s => ({ value: s, label: s })) || [];

  return (
    <DashboardLayout>
      <div className="page-transition">
        <div className="flex flex-wrap justify-between items-center gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">{t.quran}</h1>
            <p className="text-muted-foreground text-sm font-medium mt-1">Suivi dynamique par Juz, Sourates et Pages.</p>
          </div>

          <div className="relative w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t.search}
              className="input-field pl-12"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {loading ? (
                [...Array(4)].map((_, i) => <div key={i} className="h-64 bg-white/5 rounded-[2.5rem] animate-pulse border border-white/5" />)
              ) : filteredStudents.length === 0 ? (
                <div className="col-span-full py-32 text-center glass-card rounded-[2.5rem] border-dashed">
                  <BookMarked className="w-16 h-16 mx-auto mb-4 opacity-10" />
                  <p className="text-muted-foreground font-bold italic">Aucun élève trouvé</p>
                </div>
              ) : (
                filteredStudents.map((student) => (
                  <div key={student.id} onClick={() => setSelectedStudent(student)} className={cn(
                    "glass-card p-8 rounded-[2.5rem] border transition-all duration-500 cursor-pointer group relative overflow-hidden",
                    selectedStudent?.id === student.id ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "border-white/5 hover:border-primary/30"
                  )}>
                    <div className="flex items-center gap-5 mb-8">
                       <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/30 to-transparent flex items-center justify-center text-primary font-black text-2xl border border-primary/20 shadow-xl group-hover:scale-110 transition-transform">
                          {student.last_name[0]}
                        </div>
                        <div>
                          <h3 className="font-black text-white uppercase tracking-tight text-lg">{student.last_name}</h3>
                          <p className="text-xs text-muted-foreground font-bold">{student.first_name}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                       <div className="bg-white/5 p-4 rounded-2xl text-center border border-white/5 group-hover:border-primary/20 transition-all">
                          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{t.juz}</p>
                          <p className="text-xl font-black text-white mt-1">{student.current_juz || 30}</p>
                       </div>
                       <div className="bg-white/5 p-4 rounded-2xl text-center border border-white/5 group-hover:border-primary/20 transition-all col-span-2">
                          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{t.surah}</p>
                          <p className="text-sm font-black text-white mt-1 truncate">{student.current_surah || 'An-Naba'}</p>
                       </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-8">
             <div className="glass-card p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden group">
                <h2 className="text-xl font-black text-white mb-8 flex items-center gap-4 uppercase tracking-tighter">
                   <Target className="w-6 h-6 text-primary" /> Mise à jour
                </h2>
                
                {selectedStudent ? (
                  <div className="space-y-6">
                    <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 mb-8">
                      <p className="text-xs text-primary font-black uppercase tracking-widest">Élève Sélectionné</p>
                      <p className="text-lg font-black text-white mt-1 uppercase">{selectedStudent.first_name} {selectedStudent.last_name}</p>
                    </div>

                    <ProSelect 
                      label="Sélectionner le Juz (Décroissant)"
                      value={editData.juz.toString()}
                      onChange={(val) => setEditData(prev => ({ ...prev, juz: Number(val) }))}
                      options={juzOptions}
                    />

                    <ProSelect 
                      label="Sélectionner la Sourate"
                      value={editData.surah}
                      onChange={(val) => setEditData(prev => ({ ...prev, surah: val }))}
                      options={surahOptions}
                    />

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">Numéro de Page</label>
                      <input 
                        type="number"
                        className="input-field"
                        value={editData.page}
                        onChange={(e) => setEditData(prev => ({ ...prev, page: Number(e.target.value) }))}
                      />
                    </div>

                    <button 
                      onClick={handleUpdate}
                      className="btn-primary w-full py-4 mt-4"
                    >
                      <Save className="w-5 h-5" />
                      {t.save}
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-20">
                     <BookMarked className="w-12 h-12 mx-auto mb-4 opacity-10" />
                     <p className="text-muted-foreground text-sm italic">Cliquez sur une fiche élève pour mettre à jour sa progression Coran.</p>
                  </div>
                )}
             </div>

             <div className="glass-card p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 p-8 opacity-5">
                  <BarChart3 className="w-32 h-32 text-primary" />
                </div>
                <h3 className="text-lg font-black text-white mb-6 uppercase tracking-tight">Statistiques Globales</h3>
                <div className="space-y-6 relative z-10">
                   <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-2">Performances du mois</p>
                      <p className="text-3xl font-black text-emerald-400 tracking-tighter">+1,420 <span className="text-xs font-bold text-muted-foreground opacity-60 ml-2">Pages validées</span></p>
                   </div>
                   <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-2">Groupe le plus actif</p>
                      <p className="text-sm font-black text-white">Groupe A (Matin)</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

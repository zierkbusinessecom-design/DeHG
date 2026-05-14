'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useTranslation } from '@/context/TranslationContext';
import { 
  Users, 
  CalendarCheck, 
  TrendingUp, 
  BadgeDollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  ShieldAlert,
  Search,
  Save,
  CheckCircle2,
  X,
  LayoutGrid
} from 'lucide-react';
import { createClient } from '@/lib/supabase-client';
import { ProSelect } from '@/components/ui/ProSelect';
import { ProDatePicker } from '@/components/ui/ProDatePicker';
import { cn } from '@/lib/utils';

const StatCard = ({ title, value, trend, icon: Icon, color }: any) => (
  <div className="glass-card p-6 rounded-3xl border border-white/5 hover:border-primary/20 transition-all duration-500 group overflow-hidden relative">
    <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-500" />
    
    <div className="flex justify-between items-start relative z-10">
      <div className={cn("p-3.5 rounded-2xl border border-white/10 shadow-xl transition-all duration-500 group-hover:scale-110", color)}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className={cn("flex items-center gap-1 text-[11px] font-black px-2 py-1 rounded-lg border", trend > 0 ? "text-green-400 bg-green-500/10 border-green-500/20" : "text-red-400 bg-red-500/10 border-red-500/20")}>
        {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        {Math.abs(trend)}%
      </div>
    </div>
    
    <div className="mt-6 relative z-10">
      <h3 className="text-muted-foreground text-xs font-bold uppercase tracking-widest">{title}</h3>
      <p className="text-3xl font-black mt-2 text-white tracking-tighter">{value}</p>
    </div>
  </div>
);

export default function Dashboard() {
  const { t } = useTranslation();
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [showDisciplineModal, setShowDisciplineModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [disciplineData, setDisciplineData] = useState({
    student_id: '',
    group_id: 'all',
    date: new Date(),
    description: '',
    type: ''
  });

  const supabase = createClient();

  const fetchStudents = async () => {
    let query = supabase.from('students').select('id, first_name, last_name, group_id').eq('status', 'active');
    if (disciplineData.group_id !== 'all') {
      query = query.eq('group_id', disciplineData.group_id === 'A' ? 'morning' : 'afternoon');
    }
    const { data } = await query;
    if (data) setStudents(data);
  };

  React.useEffect(() => {
    if (showDisciplineModal) fetchStudents();
  }, [showDisciplineModal, disciplineData.group_id]);

  const handleCreateReport = async () => {
    if (!disciplineData.student_id) return alert("Sélectionnez un élève");
    if (!disciplineData.description) return alert("Indiquez le motif");
    
    setLoading(true);
    try {
      // RÉCUPÉRATION DU SCHOOL_ID (Comme dans le reste de l'application)
      const { data: schoolData } = await supabase.from('schools').select('id').limit(1).maybeSingle();
      const school_id = schoolData?.id || 'd8c1c1c1-c1c1-c1c1-c1c1-d8c1c1c1c1c1';

      const { error } = await supabase.from('disciplinary_records').insert({
        student_id: disciplineData.student_id,
        school_id: school_id,
        date: disciplineData.date.toISOString().split('T')[0],
        description: disciplineData.description,
        type: disciplineData.type
      });

      if (error) throw error;
      
      setShowDisciplineModal(false);
      setDisciplineData({
        student_id: '',
        group_id: 'all',
        date: new Date(),
        description: '',
        type: ''
      });
      alert("Rapport enregistré avec succès");
    } catch (err: any) {
      alert("Erreur : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s => 
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = [
    { title: t.total_students, value: '1,284', trend: 12.5, icon: Users, color: 'bg-emerald-500' },
    { title: t.attendance_today, value: '942', trend: 3.2, icon: CalendarCheck, color: 'bg-teal-500' },
    { title: t.collected_fees, value: '12,450 €', trend: -2.4, icon: BadgeDollarSign, color: 'bg-green-600' },
    { title: t.success_rate, value: '88%', trend: 4.1, icon: TrendingUp, color: 'bg-emerald-700' },
  ];

  const recentActivity = [
    { id: 1, type: 'attendance', user: 'Moussa Diallo', action: 'Absence marquée', time: 'il y a 5 min' },
    { id: 2, type: 'payment', user: 'Fatoumata Barry', action: 'Paiement de 50€ reçu', time: 'il y a 12 min' },
    { id: 3, type: 'grade', user: 'Prof. Ahmed', action: 'Notes d\'Arabe publiées', time: 'il y a 25 min' },
    { id: 4, type: 'quran', user: 'Abdoulaye Sow', action: 'Progression Juz 4 validée', time: 'il y a 45 min' },
  ];

  return (
    <DashboardLayout>
      <div className="page-transition">
        <div className="flex flex-wrap justify-between items-center gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">{t.dashboard}</h1>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(34,197,94,1)]" />
              <p className="text-muted-foreground text-sm font-medium">{t.welcome_back}, Admin</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={() => setShowDisciplineModal(true)}
              className="btn-secondary px-6 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white"
            >
              <ShieldAlert className="w-4 h-4" />
              Rapport Discipline
            </button>
            <div className="flex gap-1.5 p-1.5 bg-card border border-white/5 rounded-2xl shadow-2xl">
              {['all', 'A', 'B'].map((group) => (
                <button
                  key={group}
                  onClick={() => setSelectedGroup(group)}
                  className={cn(
                    "px-5 py-2.5 rounded-xl text-[11px] font-black uppercase transition-all tracking-tighter",
                    selectedGroup === group 
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105" 
                      : "text-muted-foreground hover:text-white hover:bg-white/5"
                  )}
                >
                  {group === 'all' ? 'Vue Globale' : `Groupe ${group}`}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {stats.map((stat, i) => (
            <StatCard key={i} {...stat} />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8">
          <div className="glass-card p-8 rounded-3xl border border-white/5 overflow-hidden relative">
            <div className="absolute right-0 top-0 p-8 opacity-5">
              <Activity className="w-32 h-32 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
              <LayoutGrid className="w-5 h-5 text-primary" />
              Statistiques de Présences
            </h2>
            <div className="h-96 flex items-end justify-between gap-8 px-2">
               {[65, 45, 75, 85, 55, 95, 80, 70, 90, 60].map((val, i) => (
                 <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                   <div className="relative w-full">
                     <div 
                       className="w-full bg-primary/10 rounded-2xl border border-primary/20 relative group-hover:bg-primary/20 transition-all duration-500 overflow-hidden" 
                       style={{ height: `${val * 3}px` }}
                     >
                       <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-primary to-emerald-400 opacity-60 rounded-2xl group-hover:opacity-100 transition-all duration-500" style={{ height: '100%' }} />
                     </div>
                     <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all">
                       {val}%
                     </div>
                   </div>
                   <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Jour {i+1}</span>
                 </div>
               ))}
            </div>
          </div>
        </div>

        {showDisciplineModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="glass-card w-full max-w-2xl p-10 rounded-[3rem] border border-white/10 relative overflow-hidden">
               <div className="absolute -right-20 -top-20 w-64 h-64 bg-red-500/5 rounded-full blur-3xl" />
               
               <button onClick={() => setShowDisciplineModal(false)} className="absolute top-8 right-8 p-2 hover:bg-white/5 rounded-xl transition-all">
                 <X className="w-6 h-6 text-muted-foreground" />
               </button>

               <h2 className="text-3xl font-black text-white mb-8 flex items-center gap-4 uppercase tracking-tighter">
                 <ShieldAlert className="w-8 h-8 text-red-500" /> Rapport Disciplinaire
               </h2>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <ProDatePicker 
                    label="Date de l'incident" 
                    selected={disciplineData.date} 
                    onChange={d => setDisciplineData(p => ({...p, date: d || new Date()}))} 
                  />
                  <ProSelect 
                    label="Groupe"
                    value={disciplineData.group_id}
                    onChange={v => setDisciplineData(p => ({...p, group_id: v, student_id: ''}))}
                    options={[{value: 'all', label: 'Tous les groupes'}, {value: 'A', label: 'Groupe A (Matin)'}, {value: 'B', label: 'Groupe B (Après-midi)'}]}
                  />
                  
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">Rechercher l'élève</label>
                    <div className="relative">
                       <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                       <input 
                         className="input-field pl-12" 
                         placeholder="Nom ou prénom..." 
                         value={searchQuery}
                         onChange={e => setSearchQuery(e.target.value)}
                       />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto custom-scrollbar p-1">
                       {filteredStudents.map(student => (
                         <button
                           key={student.id}
                           type="button"
                           onClick={() => setDisciplineData(p => ({...p, student_id: student.id}))}
                           className={cn(
                             "p-3 rounded-xl border text-[10px] font-black uppercase text-center transition-all",
                             disciplineData.student_id === student.id 
                               ? "bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20" 
                               : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/20"
                           )}
                         >
                           {student.first_name} {student.last_name}
                         </button>
                       ))}
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">Motif de l'incident</label>
                    <textarea 
                      className="input-field min-h-[80px]" 
                      placeholder="Ex: Comportement perturbateur en classe..."
                      value={disciplineData.description}
                      onChange={e => setDisciplineData(p => ({...p, description: e.target.value}))}
                    />
                  </div>

                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">Mesure prise (Optionnel)</label>
                    <input 
                      className="input-field" 
                      placeholder="Ex: Avertissement verbal, convocation des parents..."
                      value={disciplineData.type}
                      onChange={e => setDisciplineData(p => ({...p, type: e.target.value}))}
                    />
                  </div>
               </div>

               <div className="flex justify-end gap-4">
                  <button onClick={() => setShowDisciplineModal(false)} className="btn-secondary px-8">Annuler</button>
                  <button onClick={handleCreateReport} disabled={loading} className="btn-primary bg-red-600 hover:bg-red-500 px-12">
                    <Save className="w-4 h-4" />
                    {loading ? 'Enregistrement...' : 'Enregistrer le rapport'}
                  </button>
               </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

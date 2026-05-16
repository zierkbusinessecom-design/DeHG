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
  
  const [dashboardStats, setDashboardStats] = useState({
    totalStudents: 0,
    attendancesToday: 0
  });
  
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

  React.useEffect(() => {
    const fetchStats = async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const [{ count: total }, { count: presents }] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('attendances').select('*', { count: 'exact', head: true }).eq('date', today).in('status', ['present', 'late'])
      ]);

      setDashboardStats({
        totalStudents: total || 0,
        attendancesToday: presents || 0
      });
    };
    fetchStats();
  }, []);

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
    { title: t.total_students, value: dashboardStats.totalStudents.toString(), trend: 5.2, icon: Users, color: 'bg-emerald-500' },
    { title: "Présences Aujourd'hui", value: dashboardStats.attendancesToday.toString(), trend: 2.1, icon: CalendarCheck, color: 'bg-teal-500' },
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
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={() => setShowDisciplineModal(true)}
              className="btn-secondary px-6 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white"
            >
              <ShieldAlert className="w-4 h-4" />
              Rapport Discipline
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-10">
          {stats.map((stat, i) => (
            <StatCard key={i} {...stat} />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8">
          <div className="glass-card p-8 rounded-[2.5rem] border border-white/5 overflow-hidden relative group">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-500" />
            
            <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-4 uppercase tracking-tight relative z-10">
              <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 text-primary">
                <Activity className="w-6 h-6" />
              </div>
              Activité & Événements Clés
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              <div className="p-6 bg-white/5 rounded-3xl border border-white/5 hover:border-white/10 transition-all">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-4">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <p className="text-[10px] text-amber-500 font-black uppercase mb-1 tracking-widest">À Venir Ce Weekend</p>
                <p className="text-lg font-black text-white leading-tight">Évaluations Mensuelles</p>
                <p className="text-xs text-muted-foreground mt-2 font-medium">Assurez-vous que les programmes ont été assignés aux élèves concernés.</p>
              </div>
              
              <div className="p-6 bg-white/5 rounded-3xl border border-white/5 hover:border-white/10 transition-all">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-4">
                  <Users className="w-5 h-5" />
                </div>
                <p className="text-[10px] text-blue-500 font-black uppercase mb-1 tracking-widest">Information Importante</p>
                <p className="text-lg font-black text-white leading-tight">Réunion des Parents</p>
                <p className="text-xs text-muted-foreground mt-2 font-medium">Dimanche 18 Mai à 12h00 pour le groupe du matin.</p>
              </div>
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
                       {searchQuery.length > 0 ? filteredStudents.map(student => (
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
                       )) : (
                         <div className="col-span-3 py-6 text-center text-muted-foreground text-[10px] uppercase font-bold italic">
                           Saisissez un nom pour trouver l'élève
                         </div>
                       )}
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

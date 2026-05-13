'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useTranslation } from '@/context/TranslationContext';
import { 
  GraduationCap, 
  Plus, 
  Search, 
  Users,
  Target,
  Calendar,
  Save,
  CheckCircle2,
  Trash2,
  BookOpen
} from 'lucide-react';
import { createClient } from '@/lib/supabase-client';
import { ProSelect } from '@/components/ui/ProSelect';
import { ProDatePicker } from '@/components/ui/ProDatePicker';
import { cn } from '@/lib/utils';
import { QURAN_JUZ } from '@/data/quran'; // On suppose que ce fichier existe

export default function GradesPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  
  const [newEval, setNewEval] = useState({
    type: 'test',
    student_id: '',
    date: new Date(),
    isGroup: true,
    group_id: 'morning',
    selectedSubjects: [
      { id: Date.now(), subject: '', scope: { start_juz: '30', start_surah: 'An-Naba', start_page: '', end_juz: '30', end_surah: 'An-Nas', end_page: '' } }
    ]
  });

  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      // 1. Charger les élèves
      const { data: studentsData } = await supabase.from('students').select('*').order('last_name');
      if (studentsData) setStudents(studentsData);

      // 2. Charger l'historique des évaluations
      const { data: evalData } = await supabase
        .from('academic_evaluations')
        .select('*, students(first_name, last_name)')
        .order('evaluation_date', { ascending: false });
      // 3. Charger les matières
      const { data: subjectsData } = await supabase.from('subjects').select('*').order('name');
      if (subjectsData) setSubjects(subjectsData);

      setLoading(false);
    };
    fetchData();
  }, []);

  const handleCreateEvaluation = async () => {
    try {
      setLoading(true);
      
      // RÉCUPÉRATION DU VRAI SCHOOL_ID
      const { data: schoolData } = await supabase.from('schools').select('id').limit(1).maybeSingle();
      const school_id = schoolData?.id || 'd8c1c1c1-c1c1-c1c1-c1c1-d8c1c1c1c1c1';

      let studentIds: string[] = [];
      if (newEval.isGroup) {
        const { data } = await supabase.from('students').select('id').eq('status', 'active');
        if (data) studentIds = data.map(s => s.id);
      } else {
        if (!newEval.student_id) return alert("Choisissez un élève");
        studentIds = [newEval.student_id];
      }

      // VALIDATION
      const hasEmptySubject = newEval.selectedSubjects.some(s => !s.subject);
      if (hasEmptySubject) return alert("Veuillez choisir une matière pour chaque ligne.");

      const evaluationsToInsert = studentIds.flatMap(sid => 
        newEval.selectedSubjects.map(sub => ({
          student_id: sid,
          school_id: school_id,
          subject: sub.subject,
          type: newEval.type.charAt(0).toUpperCase() + newEval.type.slice(1),
          evaluation_date: newEval.date.toISOString().split('T')[0],
          grade: 0,
          scope: sub.scope,
          remarks: 'Planification'
        }))
      );

      const { error } = await supabase.from('academic_evaluations').insert(evaluationsToInsert);
      
      if (error) {
        console.error("Détails Erreur Supabase:", error);
        throw new Error(error.message || "Erreur base de données");
      }

      alert("Évaluations créées !");
      setShowAdd(false);
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      alert("Erreur : " + (err.message || "Erreur inconnue"));
    } finally {
      setLoading(false);
    }
  };

  const filteredStudentsForSearch = students.filter(s => {
    const matchesSearch = `${s.first_name} ${s.last_name}`.toLowerCase().includes(studentSearch.toLowerCase());
    const matchesGroup = groupFilter === 'all' || (groupFilter === 'morning' ? !s.alphabet_book?.includes('midi') : s.alphabet_book?.includes('midi'));
    return matchesSearch && matchesGroup;
  });

  return (
    <DashboardLayout>
      <div className="page-transition">
        <div className="flex flex-wrap justify-between items-center gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">{t.grades}</h1>
            <p className="text-muted-foreground text-sm font-medium mt-1">Évaluations, tests et examens trimestriels.</p>
          </div>

          <button 
            onClick={() => setShowAdd(true)}
            className="btn-primary px-8"
          >
            <Plus className="w-5 h-5" />
            Nouvelle Évaluation
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
           <div className="xl:col-span-3 space-y-8">
              <div className="glass-card p-10 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
                 <div className="flex items-center justify-between mb-10">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-4">
                       <GraduationCap className="w-7 h-7 text-primary" /> Dernières Évaluations
                    </h2>
                    <div className="relative w-64">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input type="text" placeholder="Rechercher..." className="input-field py-2.5 pl-11" />
                    </div>
                 </div>

                 <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                       <thead>
                          <tr className="border-b border-white/5">
                             <th className="pb-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Élève</th>
                             <th className="pb-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Type</th>
                             <th className="pb-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Matière</th>
                             <th className="pb-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Date</th>
                             <th className="pb-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">Note / 10</th>
                             <th className="pb-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Actions</th>
                          </tr>
                       </thead>
                        <tbody className="divide-y divide-white/5">
                           {evaluations.length > 0 ? evaluations.map((item, i) => (
                              <tr key={i} className="group/row hover:bg-white/[0.02] transition-colors">
                                 <td className="py-6">
                                    <div className="flex items-center gap-4">
                                       <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary font-black border border-white/5 group-hover/row:scale-110 transition-transform">
                                          {item.students?.last_name?.[0] || '?'}
                                       </div>
                                       <div className="flex flex-col">
                                          <span className="text-white font-black uppercase text-sm">{item.students?.last_name} {item.students?.first_name}</span>
                                          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{item.book || 'Général'}</span>
                                       </div>
                                    </div>
                                 </td>
                                 <td className="py-6">
                                    <span className={cn(
                                       "px-3 py-1.5 text-[9px] font-black rounded-lg uppercase border",
                                       item.type === 'Examen' ? "bg-red-500/10 text-red-400 border-red-500/20" :
                                       item.type === 'Evaluation' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                       "bg-primary/10 text-primary border-primary/20"
                                    )}>
                                       {item.type}
                                    </span>
                                 </td>
                                 <td className="py-6 text-sm text-white font-black uppercase tracking-tight">{item.subject}</td>
                                 <td className="py-6 text-xs text-muted-foreground font-medium">{new Date(item.evaluation_date).toLocaleDateString()}</td>
                                 <td className="py-6 text-center">
                                    <span className={cn(
                                       "text-lg font-black",
                                       Number(item.grade) >= 8 ? "text-emerald-400" :
                                       Number(item.grade) >= 5 ? "text-amber-400" : "text-red-400"
                                    )}>
                                       {item.grade}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">/10</span>
                                 </td>
                                 <td className="py-6 text-right">
                                    <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Modifier</button>
                                 </td>
                              </tr>
                           )) : (
                              <tr>
                                 <td colSpan={6} className="py-20 text-center text-muted-foreground italic">Aucune évaluation trouvée.</td>
                              </tr>
                           )}
                        </tbody>
                    </table>
                 </div>
              </div>
           </div>

           <div className="space-y-8">
              <div className="glass-card p-8 rounded-[2.5rem] border border-white/5">
                 <h3 className="text-lg font-black text-white mb-6 uppercase tracking-tight">Répartition</h3>
                 <div className="space-y-6">
                    <div className="flex items-center justify-between">
                       <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Taux de Réussite</span>
                       <span className="text-sm font-black text-emerald-400">92%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-500 w-[92%] shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="glass-card w-full max-w-2xl p-10 rounded-[3rem] border border-white/10 relative my-auto">
             <div className="absolute -right-4 -top-4 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
             <h2 className="text-2xl font-black text-white mb-10 uppercase tracking-tight flex items-center gap-4">
                <Target className="w-8 h-8 text-primary" /> Créer une Évaluation
             </h2>
             
             <div className="max-h-[70vh] overflow-y-auto pr-4 custom-scrollbar">
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <ProSelect 
                   label="Type d'épreuve"
                   value={newEval.type}
                   onChange={(val) => setNewEval(p => ({...p, type: val}))}
                   options={[{value: 'test', label: t.test}, {value: 'evaluation', label: t.evaluation}, {value: 'exam', label: t.exam}]}
                />
                 <ProSelect 
                    label="Public visé"
                    value={newEval.isGroup ? 'group' : 'individual'}
                    onChange={(val) => setNewEval(p => ({...p, isGroup: val === 'group'}))}
                    options={[{value: 'group', label: 'Groupe Entier'}, {value: 'individual', label: 'Élève Unique'}]}
                 />
             </div>

             {!newEval.isGroup && (
                <div className="mb-8 p-6 bg-white/5 rounded-[2rem] border border-white/10 space-y-4">
                   <div className="flex gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input 
                          type="text" 
                          placeholder="Chercher un élève..." 
                          className="input-field py-2 pl-10 text-xs" 
                          value={studentSearch}
                          onChange={(e) => setStudentSearch(e.target.value)}
                        />
                      </div>
                      <select 
                        className="bg-[#121216] border border-white/10 rounded-xl px-4 text-[10px] text-white uppercase font-black"
                        value={groupFilter}
                        onChange={(e) => setGroupFilter(e.target.value)}
                      >
                        <option value="all">Tous les Groupes</option>
                        <option value="morning">Groupe A (Matin)</option>
                        <option value="afternoon">Groupe B (Après-midi)</option>
                      </select>
                   </div>
                   <div className="max-h-40 overflow-y-auto grid grid-cols-1 gap-2 pr-2 custom-scrollbar">
                      {filteredStudentsForSearch.map(s => (
                        <button 
                          key={s.id}
                          onClick={() => setNewEval(p => ({...p, student_id: s.id}))}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-xl border text-left transition-all",
                            newEval.student_id === s.id ? "bg-primary border-primary text-white" : "bg-black/20 border-white/5 text-muted-foreground hover:border-white/20"
                          )}
                        >
                          <span className="text-[10px] font-black uppercase">{s.last_name} {s.first_name}</span>
                          {newEval.student_id === s.id && <CheckCircle2 className="w-4 h-4" />}
                        </button>
                      ))}
                   </div>
                </div>
             )}

             <div className="space-y-6 mb-10">
                <div className="flex items-center justify-between">
                   <h3 className="text-xs font-black text-white uppercase tracking-widest">Programme de l'épreuve</h3>
                   <button 
                     onClick={() => setNewEval(p => ({...p, selectedSubjects: [...p.selectedSubjects, { id: Date.now(), subject: '', scope: { start_juz: '30', start_surah: 'An-Naba', start_page: '', end_juz: '30', end_surah: 'An-Nas', end_page: '' } }]}))}
                     className="text-[10px] font-black text-primary uppercase flex items-center gap-2 hover:underline"
                   >
                     <Plus className="w-3 h-3" /> Ajouter une matière
                   </button>
                </div>

                {newEval.selectedSubjects.map((sub, index) => (
                  <div key={sub.id} className="p-6 bg-white/5 rounded-[2rem] border border-white/5 space-y-6 relative group/item">
                    <button 
                      onClick={() => setNewEval(p => ({...p, selectedSubjects: p.selectedSubjects.filter((_, i) => i !== index)}))}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity shadow-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Matière</label>
                       <select 
                         className="input-field py-3 bg-[#121216]"
                         value={sub.subject}
                         onChange={(e) => {
                           const updated = [...newEval.selectedSubjects];
                           updated[index].subject = e.target.value;
                           setNewEval(p => ({...p, selectedSubjects: updated}));
                         }}
                       >
                         <option value="">Choisir...</option>
                         <option value="Le Noble Coran">Le Noble Coran</option>
                         {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                       </select>
                    </div>

                    {sub.subject === 'Le Noble Coran' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                           <p className="text-[9px] font-black text-primary uppercase">Début de l'épreuve</p>
                           <div className="grid grid-cols-2 gap-2">
                              <select className="input-field py-2 text-[10px] bg-black/40" value={sub.scope.start_juz} onChange={(e) => {
                                const updated = [...newEval.selectedSubjects];
                                updated[index].scope.start_juz = e.target.value;
                                setNewEval(p => ({...p, selectedSubjects: updated}));
                              }}>
                                {QURAN_JUZ.map(j => <option key={j.number} value={j.number}>Juz {j.number}</option>)}
                              </select>
                              <select className="input-field py-2 text-[10px] bg-black/40" value={sub.scope.start_surah} onChange={(e) => {
                                const updated = [...newEval.selectedSubjects];
                                updated[index].scope.start_surah = e.target.value;
                                setNewEval(p => ({...p, selectedSubjects: updated}));
                              }}>
                                {QURAN_JUZ.find(j => j.number === Number(sub.scope.start_juz))?.surahs.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                           </div>
                        </div>
                        <div className="space-y-4">
                           <p className="text-[9px] font-black text-primary uppercase">Fin de l'épreuve</p>
                           <div className="grid grid-cols-2 gap-2">
                              <select className="input-field py-2 text-[10px] bg-black/40" value={sub.scope.end_juz} onChange={(e) => {
                                const updated = [...newEval.selectedSubjects];
                                updated[index].scope.end_juz = e.target.value;
                                setNewEval(p => ({...p, selectedSubjects: updated}));
                              }}>
                                {QURAN_JUZ.map(j => <option key={j.number} value={j.number}>Juz {j.number}</option>)}
                              </select>
                              <select className="input-field py-2 text-[10px] bg-black/40" value={sub.scope.end_surah} onChange={(e) => {
                                const updated = [...newEval.selectedSubjects];
                                updated[index].scope.end_surah = e.target.value;
                                setNewEval(p => ({...p, selectedSubjects: updated}));
                              }}>
                                {QURAN_JUZ.find(j => j.number === Number(sub.scope.end_juz))?.surahs.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                           </div>
                        </div>
                      </div>
                    ) : sub.subject && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black text-muted-foreground uppercase">De la page</label>
                           <input type="number" className="input-field py-2" value={sub.scope.start_page} onChange={(e) => {
                             const updated = [...newEval.selectedSubjects];
                             updated[index].scope.start_page = e.target.value;
                             setNewEval(p => ({...p, selectedSubjects: updated}));
                           }} />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black text-muted-foreground uppercase">À la page</label>
                           <input type="number" className="input-field py-2" value={sub.scope.end_page} onChange={(e) => {
                             const updated = [...newEval.selectedSubjects];
                             updated[index].scope.end_page = e.target.value;
                             setNewEval(p => ({...p, selectedSubjects: updated}));
                           }} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
             </div>
             </div>
 
              <div className="flex justify-end gap-6 mt-10">
                 <button onClick={() => setShowAdd(false)} className="btn-secondary px-8">Annuler</button>
                 <button onClick={handleCreateEvaluation} className="btn-primary px-12">
                    <CheckCircle2 className="w-5 h-5" />
                    Créer l'Évaluation
                 </button>
              </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

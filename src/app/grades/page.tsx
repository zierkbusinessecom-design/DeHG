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
  BookOpen,
  Clock,
  AlertCircle,
  Edit2
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
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempGrade, setTempGrade] = useState<string>('');
  
  const [newEval, setNewEval] = useState({
    type: 'evaluation',
    student_id: '',
    date: new Date(),
    isGroup: true,
    target: 'group-all', // group-all, group-a, group-b, individual
    group_id: 'morning',
    globalRemarks: '',
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
        .select('*, students(first_name, last_name, group_id)')
        .order('evaluation_date', { ascending: false });
      
      if (evalData) setEvaluations(evalData);

      // 3. Charger les matières
      const { data: subjectsData } = await supabase.from('subjects').select('*').order('name');
      if (subjectsData) setSubjects(subjectsData);

      setLoading(false);
    };
    fetchData();
  }, []);

  const handleUpdateGrade = async (id: string) => {
    try {
      const { error } = await supabase
        .from('academic_evaluations')
        .update({ grade: tempGrade === '' ? null : Number(tempGrade) })
        .eq('id', id);
      
      if (error) throw error;
      setEditingId(null);
      // Rafraîchir les données
      const { data: evalData } = await supabase
        .from('academic_evaluations')
        .select('*, students(first_name, last_name, group_id)')
        .order('evaluation_date', { ascending: false });
      if (evalData) setEvaluations(evalData);
    } catch (err: any) {
      alert("Erreur: " + err.message);
    }
  };

  const handleDeleteEvaluation = async (id: string) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette épreuve ?")) return;
    
    try {
      const { error } = await supabase
        .from('academic_evaluations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setEvaluations(prev => prev.filter(e => e.id !== id));
    } catch (err: any) {
      alert("Erreur lors de la suppression: " + err.message);
    }
  };

  // Auto-fill logic for individual students
  useEffect(() => {
    const autoFillStudentData = async () => {
      if (newEval.target === 'individual' && newEval.student_id) {
        try {
          const [booksRes, quranRes] = await Promise.all([
            supabase.from('student_books_tracking').select('*').eq('student_id', newEval.student_id),
            supabase.from('student_quran_tracking').select('*').eq('student_id', newEval.student_id).maybeSingle()
          ]);

          let autoSubjects = [];

          // 1. Coran
          if (quranRes.data) {
            autoSubjects.push({
              id: Date.now(),
              subject: 'Le Noble Coran',
              scope: {
                start_juz: quranRes.data.juz?.toString() || '30',
                start_surah: quranRes.data.surah || 'An-Naba',
                start_page: quranRes.data.page?.toString() || '',
                end_juz: quranRes.data.juz?.toString() || '30',
                end_surah: quranRes.data.surah || 'An-Nas',
                end_page: ''
              }
            });
          }

          // 2. Livres
          if (booksRes.data && booksRes.data.length > 0) {
            booksRes.data.forEach((book, idx) => {
              autoSubjects.push({
                id: Date.now() + idx + 1,
                subject: book.book_name,
                scope: {
                  start_juz: '', start_surah: '',
                  start_page: book.current_page?.toString() || '',
                  end_juz: '', end_surah: '',
                  end_page: ''
                }
              });
            });
          }

          if (autoSubjects.length > 0) {
            setNewEval(prev => ({ ...prev, selectedSubjects: autoSubjects }));
          }
        } catch (err) {
          console.error("Auto-fill error:", err);
        }
      }
    };
    autoFillStudentData();
  }, [newEval.student_id, newEval.target]);

  const handleCreateEvaluation = async () => {
    try {
      setLoading(true);
      
      // RÉCUPÉRATION DU VRAI SCHOOL_ID
      const { data: schoolData } = await supabase.from('schools').select('id').limit(1).maybeSingle();
      const school_id = schoolData?.id || 'd8c1c1c1-c1c1-c1c1-c1c1-d8c1c1c1c1c1';

      let studentIds: string[] = [];
      if (newEval.target !== 'individual') {
        let query = supabase.from('students').select('id').eq('status', 'active');
        
        if (newEval.target === 'group-a') query = query.eq('group_id', 'morning');
        if (newEval.target === 'group-b') query = query.eq('group_id', 'afternoon');
        
        const { data } = await query;
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
          grade: null,
          scope: sub.scope,
          remarks: newEval.globalRemarks || 'Planification'
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
    const matchesGroup = groupFilter === 'all' || (groupFilter === 'morning' ? s.group_id === 'morning' : s.group_id === 'afternoon');
    return matchesSearch && matchesGroup;
  });

  const filteredEvaluations = evaluations.filter(item => {
    const matchesGroup = selectedGroup === 'all' || item.students?.group_id === selectedGroup;
    return matchesGroup;
  });

  const gradedEvals = filteredEvaluations.filter(e => e.grade !== null && e.grade !== undefined);
  const passedEvals = gradedEvals.filter(e => Number(e.grade) >= 5);
  const successRate = gradedEvals.length > 0 ? Math.round((passedEvals.length / gradedEvals.length) * 100) : 0;

  // Calculs pour la répartition détaillée
  const getRateForGroup = (gid: string | 'all') => {
    const evals = evaluations.filter(e => (gid === 'all' || e.students?.group_id === gid) && e.grade !== null && e.grade !== undefined);
    if (evals.length === 0) return 0;
    const passed = evals.filter(e => Number(e.grade) >= 5);
    return Math.round((passed.length / evals.length) * 100);
  };

  const rateGlobal = getRateForGroup('all');
  const rateA = getRateForGroup('morning');
  const rateB = getRateForGroup('afternoon');

  return (
    <DashboardLayout>
      <div className="page-transition">
        <div className="flex flex-wrap justify-between items-center gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">{t.grades}</h1>
            <p className="text-muted-foreground text-sm font-medium mt-1">Évaluations, tests et examens trimestriels.</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex gap-1.5 p-1.5 bg-white/5 border border-white/10 rounded-2xl shadow-xl">
              {[
                { id: 'all', label: 'Tous les élèves' },
                { id: 'morning', label: 'Groupe A (Matin)' },
                { id: 'afternoon', label: 'Groupe B (Après-midi)' }
              ].map((g) => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGroup(g.id)}
                  className={cn(
                    "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest",
                    selectedGroup === g.id 
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105" 
                      : "text-muted-foreground hover:text-white hover:bg-white/5"
                  )}
                >
                  {g.label}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setShowAdd(true)}
              className="btn-primary px-8"
            >
              <Plus className="w-5 h-5" />
              Nouvelle Évaluation
            </button>
          </div>
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
                           {filteredEvaluations.length > 0 ? filteredEvaluations.map((item, i) => (
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
                                    {editingId === item.id ? (
                                       <div className="flex items-center justify-center gap-2">
                                          <input 
                                            type="number" 
                                            max="10" 
                                            min="0" 
                                            step="0.5"
                                            className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm text-white font-black"
                                            value={tempGrade}
                                            onChange={(e) => setTempGrade(e.target.value)}
                                            autoFocus
                                          />
                                          <button 
                                            onClick={() => handleUpdateGrade(item.id)}
                                            className="p-1.5 bg-primary/20 text-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
                                          >
                                            <Save className="w-3.5 h-3.5" />
                                          </button>
                                       </div>
                                    ) : item.grade !== null && item.grade !== undefined ? (
                                       <>
                                          <span className={cn(
                                             "text-lg font-black",
                                             Number(item.grade) >= 8 ? "text-emerald-400" :
                                             Number(item.grade) >= 5 ? "text-amber-400" : "text-red-400"
                                          )}>
                                             {item.grade}
                                          </span>
                                          <span className="text-[10px] text-muted-foreground">/10</span>
                                       </>
                                    ) : (
                                       <div className="flex flex-col items-center gap-1">
                                          <div className="p-1.5 bg-white/5 rounded-lg border border-white/10">
                                             <Clock className="w-4 h-4 text-amber-500" />
                                          </div>
                                          <span className="text-[8px] font-black text-amber-500/80 uppercase tracking-widest">En attente</span>
                                       </div>
                                    )}
                                 </td>
                                 <td className="py-6 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                       {editingId === item.id ? (
                                          <button onClick={() => setEditingId(null)} className="text-[10px] font-black text-red-400 uppercase tracking-widest hover:underline">Annuler</button>
                                       ) : (
                                          <>
                                             <button 
                                                onClick={() => {
                                                   setEditingId(item.id);
                                                   setTempGrade(item.grade?.toString() || '');
                                                }}
                                                className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all border border-primary/20"
                                                title="Modifier"
                                             >
                                                <Edit2 className="w-4 h-4" />
                                             </button>
                                             <button 
                                                onClick={() => handleDeleteEvaluation(item.id)}
                                                className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                                                title="Supprimer"
                                             >
                                                <Trash2 className="w-4 h-4" />
                                             </button>
                                          </>
                                       )}
                                    </div>
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
                       <span className={cn(
                           "text-sm font-black",
                           successRate >= 75 ? "text-emerald-400" :
                           successRate >= 50 ? "text-amber-400" : "text-red-400"
                        )}>
                           {successRate}%
                        </span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                       <div 
                           className={cn(
                              "h-full transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.5)]",
                              successRate >= 75 ? "bg-emerald-500" :
                              successRate >= 50 ? "bg-amber-500" : "bg-red-500"
                           )} 
                           style={{ width: `${successRate}%` }} 
                        />
                    </div>

                    <div className="pt-6 border-t border-white/5 space-y-4">
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                           <span>Groupe A (Matin)</span>
                           <span className="text-white font-black">{rateA}%</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                           <span>Groupe B (Après-midi)</span>
                           <span className="text-white font-black">{rateB}%</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                           <span>Moyenne Générale</span>
                           <span className="text-white font-black">{rateGlobal}%</span>
                        </div>
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
                    options={[{value: 'evaluation', label: t.evaluation}, {value: 'exam', label: t.exam}]}
                 />
                <ProSelect 
                    label="Public visé"
                    value={newEval.target}
                    onChange={(val) => setNewEval(p => ({...p, target: val, isGroup: val !== 'individual'}))}
                    options={[
                      {value: 'group-all', label: 'Groupe Entier'}, 
                      {value: 'group-a', label: 'Groupe A (Matin)'}, 
                      {value: 'group-b', label: 'Groupe B (Après-midi)'}, 
                      {value: 'individual', label: 'Élève Unique'}
                    ]}
                  />
                  <ProDatePicker 
                    label="Date de l'épreuve"
                    selected={newEval.date}
                    onChange={(d) => setNewEval(p => ({...p, date: d || new Date()}))}
                  />
             </div>

             <div className="mb-8 space-y-1.5">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Remarque Générale / Message aux Parents</label>
                <input 
                  className="input-field" 
                  placeholder="Ex: Évaluation de fin de mois. À réviser sérieusement." 
                  value={newEval.globalRemarks}
                  onChange={(e) => setNewEval(p => ({...p, globalRemarks: e.target.value}))}
                />
             </div>

             {newEval.target === 'individual' && (
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

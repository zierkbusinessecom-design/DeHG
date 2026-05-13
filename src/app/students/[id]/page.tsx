'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useTranslation } from '@/context/TranslationContext';
import { format } from 'date-fns';
import { 
  User, 
  ChevronLeft, 
  BookMarked, 
  GraduationCap, 
  CalendarCheck, 
  History,
  ShieldAlert,
  Edit,
  Trash2,
  QrCode,
  BookOpen,
  MessageSquare,
  Phone,
  MapPin,
  Save,
  ShieldCheck,
  Clock,
  CheckCircle2,
  CreditCard
} from 'lucide-react';
import { createClient } from '@/lib/supabase-client';
import { cn } from '@/lib/utils';
import { StudentQRCode } from '@/components/StudentQRCode';
import { AnnualAttendanceCalendar } from '@/components/AnnualAttendanceCalendar';
import { QURAN_JUZ } from '@/data/quran';

export default function StudentProfilePage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showQR, setShowQR] = useState(false);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [quranTracking, setQuranTracking] = useState<any>(null);
  const [booksTracking, setBooksTracking] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [disciplineRecords, setDisciplineRecords] = useState<any[]>([]);
  const [showUpdateProgress, setShowUpdateProgress] = useState(false);
  const [updateData, setUpdateData] = useState({
    juz: '',
    surah: '',
    page: '',
    remarks: '',
    type: 'positive',
    books: [] as any[]
  });

  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      // 1. Étudiant
      const { data: studentData } = await supabase
        .from('students')
        .select('*, student_parent(parents(*))')
        .eq('id', id)
        .single();
      
      if (studentData) setStudent(studentData);

      // 2. Historique des présences
      const { data: attendanceData } = await supabase
        .from('attendances')
        .select('*')
        .eq('student_id', id)
        .order('date', { ascending: false });
      
      if (attendanceData) setAttendanceHistory(attendanceData);

      // 3. Suivi Coran
      const { data: quranData } = await supabase
        .from('student_quran_tracking')
        .select('*')
        .eq('student_id', id)
        .single();
      
      if (quranData) setQuranTracking(quranData);

      // 4. Suivi Livres
      const { data: booksData } = await supabase
        .from('student_books_tracking')
        .select('*')
        .eq('student_id', id);
      
      if (booksData) setBooksTracking(booksData);

      // 5. Évaluations
      const { data: evalData } = await supabase
        .from('academic_evaluations')
        .select('*')
        .eq('student_id', id)
        .order('evaluation_date', { ascending: false });
      
      if (evalData) setEvaluations(evalData);

      // 6. Discipline
      const { data: discData } = await supabase
        .from('disciplinary_records')
        .select('*')
        .eq('student_id', id)
        .order('date', { ascending: false });
      
      if (discData) setDisciplineRecords(discData);

      setLoading(false);
    };
    fetchData();
  }, [id]);

  const handleUpdateProgress = async () => {
    try {
      setLoading(true);
      const newHistoryEntry = {
        date: new Date().toISOString(),
        juz: updateData.juz,
        surah: updateData.surah,
        page: updateData.page,
        books: updateData.books.map(b => ({ name: b.name, page: b.current_page })),
        remarks: updateData.remarks,
        type: updateData.type
      };

      const updatedHistory = [...(quranTracking?.history || []), newHistoryEntry];

      // 1. Sauvegarde Coran
      const { error: quranError } = await supabase
        .from('student_quran_tracking')
        .upsert({
          student_id: id,
          juz: Number(updateData.juz),
          surah: updateData.surah,
          page: Number(updateData.page),
          history: updatedHistory,
          updated_at: new Date().toISOString()
        }, { onConflict: 'student_id' });

      if (quranError) throw quranError;

      // 2. Sauvegarde Livres
      for (const book of updateData.books) {
        const { error: bookError } = await supabase
          .from('student_books_tracking')
          .update({ current_page: Number(book.current_page) })
          .eq('id', book.id);
        if (bookError) throw bookError;
      }

      if (quranError) {
        console.error("SUPABASE ERROR:", quranError);
        return;
      }
      
      setShowUpdateProgress(false);
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la mise à jour.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <DashboardLayout><div className="flex items-center justify-center h-96"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div></DashboardLayout>;
  if (!student) return <DashboardLayout><div className="text-center py-20 text-muted-foreground">Élève non trouvé</div></DashboardLayout>;

  const parent = student.student_parent?.[0]?.parents;

  const tabs = [
    { id: 'overview', label: 'Vue Globale', icon: User },
    { id: 'pedagogy', label: 'LIVRES', icon: BookOpen },
    { id: 'grades', label: 'Notes', icon: GraduationCap },
    { id: 'attendance', label: 'Présences', icon: CalendarCheck },
    { id: 'discipline', label: 'Discipline', icon: ShieldAlert },
    { id: 'history', label: 'Historique', icon: History },
  ];

  return (
    <DashboardLayout>
      <div className="page-transition max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-5">
            <button 
              onClick={() => router.back()}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-muted-foreground hover:text-white transition-all border border-white/5 shadow-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/30 to-transparent flex items-center justify-center text-primary font-black text-3xl border border-primary/20 shadow-2xl">
              {student.first_name[0]}{student.last_name[0]}
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tighter uppercase">{student.first_name} {student.last_name}</h1>
              <p className="text-primary font-bold text-sm tracking-widest uppercase opacity-80 flex items-center gap-2">
                {student.groups?.name} — {student.groups?.session === 'morning' ? t.morning : t.afternoon}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                setUpdateData({
                  juz: quranTracking?.juz || '30',
                  surah: quranTracking?.surah || 'An-Naba',
                  page: quranTracking?.page || '582',
                  remarks: '',
                  type: 'positive',
                  books: booksTracking.map(b => ({ id: b.id, name: b.book_name, current_page: b.current_page }))
                });
                setShowUpdateProgress(true);
              }}
              className="btn-primary px-6"
            >
              <Save className="w-4 h-4" />
              Actualiser Progression
            </button>
            <button 
              onClick={() => router.push(`/students/edit/${id}`)}
              className="btn-secondary p-3.5 hover:text-blue-400 transition-colors"
            >
              <Edit className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setShowQR(true)}
              className="btn-secondary p-3.5 hover:text-emerald-400 transition-colors"
            >
              <QrCode className="w-5 h-5" />
            </button>
            <button 
              onClick={async () => {
                if(confirm("Supprimer ce dossier ?")) {
                  await supabase.from('students').delete().eq('id', id);
                  router.push('/students');
                }
              }}
              className="btn-secondary p-3.5 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex overflow-x-auto gap-2 p-1.5 bg-white/5 rounded-[2rem] border border-white/10 mb-8 custom-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-3 px-6 py-3.5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                activeTab === tab.id 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" 
                  : "text-muted-foreground hover:text-white hover:bg-white/5"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* CONTENT AREA */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className={cn(
            "space-y-8",
            activeTab === 'attendance' ? "xl:col-span-3" : "xl:col-span-2"
          )}>
            {activeTab === 'overview' && (
              <>
                {/* STATISTIQUES RAPIDES */}
                <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
                   <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                      <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mb-1">Présence</p>
                      <p className="text-xl font-black text-white">94%</p>
                   </div>
                   <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                      <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mb-1">Retards</p>
                      <p className="text-xl font-black text-amber-400">2</p>
                   </div>
                   <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                      <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mb-1">Comportement</p>
                      <p className="text-xl font-black text-emerald-400">A+</p>
                   </div>
                   <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                      <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mb-1">Dernière Note</p>
                      <p className="text-xl font-black text-primary">8.5<span className="text-[10px] text-muted-foreground">/10</span></p>
                   </div>
                </div>

                {/* DÉTAILS DE L'ÉLÈVE (Enfant + Parent) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass-card p-8 rounded-[2.5rem] border border-white/10">
                     <h3 className="text-lg font-black text-white mb-6 uppercase tracking-tight flex items-center gap-3">
                       <User className="w-5 h-5 text-primary" /> Identité & Responsable
                     </h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                        <div className="flex flex-col border-b border-white/5 pb-3">
                          <span className="text-muted-foreground text-[10px] font-black uppercase mb-1">Naissance</span>
                          <span className="text-white text-xs font-black">{student.birth_date || 'N/A'}</span>
                        </div>
                        <div className="flex flex-col border-b border-white/5 pb-3">
                          <span className="text-muted-foreground text-[10px] font-black uppercase mb-1">Genre</span>
                          <span className="text-white text-xs font-black">{student.gender === 'M' ? 'Garçon' : 'Fille'}</span>
                        </div>
                        <div className="flex flex-col pt-2">
                          <span className="text-muted-foreground text-[10px] font-black uppercase mb-1">Parent</span>
                          <span className="text-white text-xs font-black uppercase">{parent?.last_name || 'N/A'}</span>
                        </div>
                        <div className="flex flex-col pt-2 border-b border-white/5 pb-3">
                          <span className="text-muted-foreground text-[10px] font-black uppercase mb-1">Contact</span>
                          <span className="text-primary text-xs font-black">{parent?.phone || 'N/A'}</span>
                        </div>
                        <div className="flex flex-col pt-2 border-b border-white/5 pb-3">
                           <span className="text-muted-foreground text-[10px] font-black uppercase mb-1">Horaire</span>
                           <span className="text-white text-xs font-black">{student.group_id === 'morning' ? 'Groupe A (Matin)' : 'Groupe B (Après-midi)'}</span>
                        </div>
                     </div>
                  </div>

                  {/* ÉTAT DES PAIEMENTS */}
                  <div className="glass-card p-8 rounded-[2.5rem] border border-white/10">
                     <h3 className="text-lg font-black text-white mb-6 uppercase tracking-tight flex items-center gap-3">
                       <CreditCard className="w-5 h-5 text-primary" /> État Financier
                     </h3>
                     <div className="space-y-6">
                        <div className="flex justify-between items-end border-b border-white/5 pb-4">
                          <div>
                            <p className="text-[10px] text-muted-foreground font-black uppercase mb-1">Payé</p>
                            <p className="text-2xl font-black text-emerald-400">50.00 €</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-red-400 font-black uppercase mb-1">Dû</p>
                            <p className="text-2xl font-black text-red-500">0.00 €</p>
                          </div>
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center">
                          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Statut Scolarité</p>
                          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[9px] font-black rounded-full uppercase border border-emerald-500/20">À jour</span>
                        </div>
                     </div>
                  </div>
                </div>

                {/* Historique Financier (Largeur complète) */}
                <div className="glass-card p-8 rounded-[2.5rem] border border-white/10 mt-6">
                  <h3 className="text-lg font-black text-white mb-6 uppercase tracking-tight flex items-center gap-3">
                    <History className="w-5 h-5 text-primary" /> Historique Complet des Paiements
                  </h3>
                  <div className="bg-white/5 rounded-3xl border border-white/5 overflow-hidden">
                     <table className="w-full text-left">
                        <thead>
                           <tr className="bg-white/5 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                              <th className="px-6 py-4">Date</th>
                              <th className="px-6 py-4">Libellé</th>
                              <th className="px-6 py-4">Mode</th>
                              <th className="px-6 py-4 text-right">Montant</th>
                           </tr>
                        </thead>
                        <tbody className="text-xs font-bold text-white/80">
                           <tr className="border-t border-white/5">
                              <td className="px-6 py-4 font-bold text-white">07/05/2026</td>
                              <td className="px-6 py-4">Frais d'inscription + Paiement Initial</td>
                              <td className="px-6 py-4"><span className="px-2 py-1 bg-white/10 rounded-lg text-[10px]">CASH</span></td>
                              <td className="px-6 py-4 text-right text-emerald-400 font-black">+50.00 €</td>
                           </tr>
                        </tbody>
                     </table>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'pedagogy' && (
              <div className="space-y-6">
                 <div className="glass-card p-8 rounded-[2.5rem] border border-white/10">
                    <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3 mb-8">
                      <BookOpen className="w-6 h-6 text-primary" /> Livres & Supports Étudiés
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* LE CORAN EN PREMIER */}
                      {quranTracking && (
                        <div className="p-6 bg-primary/10 rounded-3xl border border-primary/20 space-y-4 relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                              <BookMarked className="w-16 h-16" />
                           </div>
                           <div className="flex justify-between items-start relative z-10">
                              <div>
                                <p className="text-[10px] text-primary font-black uppercase tracking-widest">Matière Prioritaire</p>
                                <h4 className="text-lg font-black text-white uppercase">Noble Coran</h4>
                              </div>
                              <span className="px-3 py-1 bg-primary text-white text-[10px] font-black rounded-lg shadow-lg">Juz {quranTracking.juz}</span>
                           </div>
                           <div className="flex items-center gap-4 relative z-10">
                              <div className="flex-1">
                                 <p className="text-[9px] text-muted-foreground font-black uppercase mb-1">Position Actuelle</p>
                                 <p className="text-xs text-white font-bold">{quranTracking.surah} — Page {quranTracking.page}</p>
                              </div>
                           </div>
                        </div>
                      )}

                      {booksTracking.length > 0 ? booksTracking.map((book) => (
                        <div key={book.id} className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4">
                           <div className="flex justify-between items-start">
                              <div>
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{book.level || 'Niveau 1'}</p>
                                <h4 className="text-lg font-black text-white uppercase">{book.book_name}</h4>
                              </div>
                              <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-lg">Page {book.current_page}</span>
                           </div>
                           <div className="space-y-2">
                              <p className="text-[10px] text-muted-foreground font-black uppercase">Progression & Remarques</p>
                              <p className="text-xs text-white/70 italic">"{book.remarks || 'Aucune remarque'}"</p>
                           </div>
                        </div>
                      )) : (
                        <div className="col-span-2 py-10 text-center text-muted-foreground italic border-2 border-dashed border-white/5 rounded-3xl">
                          Aucun livre spécifique enregistré pour le moment.
                        </div>
                      )}
                    </div>
                 </div>
              </div>
            )}


            {activeTab === 'grades' && (
              <div className="glass-card p-8 rounded-[2.5rem] border border-white/10">
                 <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3 mb-8">
                   <GraduationCap className="w-6 h-6 text-primary" /> Évaluations & Examens
                 </h3>
                 <div className="bg-white/5 rounded-3xl border border-white/5 overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                       <thead>
                          <tr className="bg-white/5 text-[10px] font-black uppercase text-muted-foreground tracking-widest border-b border-white/5">
                             <th className="px-6 py-5">Date</th>
                             <th className="px-6 py-5">Type</th>
                             <th className="px-6 py-5">Matière</th>
                             <th className="px-6 py-5">Note</th>
                          </tr>
                       </thead>
                       <tbody className="text-white/80">
                          {evaluations.map(e => (
                             <tr key={e.id} className="border-t border-white/5">
                                <td className="px-6 py-5 font-black">{new Date(e.evaluation_date).toLocaleDateString()}</td>
                                <td className="px-6 py-5"><span className="px-2 py-1 bg-white/5 rounded border border-white/10 uppercase text-[9px]">{e.type}</span></td>
                                <td className="px-6 py-5 uppercase font-black">{e.subject}</td>
                                <td className="px-6 py-5 font-black text-primary text-lg">{e.grade}/10</td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
            )}

            {activeTab === 'attendance' && (
              <div className="glass-card p-10 rounded-[2.5rem] border border-white/10">
                <AnnualAttendanceCalendar attendanceHistory={attendanceHistory} />
              </div>
            )}

            {activeTab === 'history' && (
              <div className="glass-card p-8 rounded-[2.5rem] border border-white/10">
                 <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3 mb-10">
                   <History className="w-6 h-6 text-primary" /> Timeline de Progression
                 </h3>
                 <div className="space-y-6">
                    {quranTracking?.history?.length > 0 ? [...quranTracking.history].reverse().map((entry: any, i: number) => (
                       <div key={i} className="flex gap-6 relative before:absolute before:left-[19px] before:top-10 before:bottom-0 before:w-0.5 before:bg-white/5 last:before:hidden">
                          <div className={cn(
                             "w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 border",
                             entry.type === 'positive' ? "bg-emerald-500/20 border-emerald-500/20 text-emerald-400" : "bg-red-500/20 border-red-500/20 text-red-400"
                          )}>
                             <Clock className="w-4 h-4" />
                          </div>
                          <div className="flex-1 pb-10">
                             <div className="flex items-center justify-between mb-1">
                                <p className="text-[10px] font-black text-white uppercase tracking-widest">{new Date(entry.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                <span className={cn(
                                   "text-[8px] font-black uppercase px-2 py-0.5 rounded",
                                   entry.type === 'positive' ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                                )}>{entry.type === 'positive' ? 'Positif' : 'Négatif'}</span>
                             </div>
                             <div className="text-white text-xs font-bold mb-1">
                                Juz {entry.juz} — {entry.surah} (Page {entry.page})
                             </div>
                             {entry.books?.length > 0 && (
                               <div className="flex flex-wrap gap-2 mb-2">
                                  {entry.books.map((b: any, bi: number) => (
                                    <span key={bi} className="text-[9px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-primary font-bold">
                                       {b.name}: p.{b.page}
                                    </span>
                                  ))}
                               </div>
                             )}
                             <div className="text-muted-foreground text-[11px] italic leading-relaxed bg-black/20 p-2 rounded-xl border border-white/5">
                                "{entry.remarks || 'Aucune remarque'}"
                             </div>
                          </div>
                       </div>
                    )) : (
                       <p className="text-center text-muted-foreground italic py-10">Aucun historique disponible.</p>
                    )}
                 </div>
              </div>
            )}
          </div>

          <div className="space-y-8">
            <div className="glass-card p-8 rounded-[2.5rem] border border-white/10">
               <h3 className="text-lg font-black text-white mb-6 uppercase tracking-tight flex items-center gap-3">
                 <ShieldCheck className="w-5 h-5 text-primary" /> État Général
               </h3>
               <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Niveau</span>
                    <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-lg">A+</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Assiduité</span>
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-black rounded-lg">98%</span>
                  </div>
                  <div className="pt-4 border-t border-white/5">
                     <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mb-3 text-center">Dernière Remarque</p>
                     <p className="text-xs text-white/70 italic text-center leading-relaxed">
                        "{quranTracking?.history?.[quranTracking.history.length - 1]?.remarks || 'Élève sérieux.'}"
                     </p>
                  </div>
               </div>
            </div>
            <div className="glass-card p-8 rounded-[2.5rem] border border-white/10 text-center group cursor-pointer relative overflow-hidden" onClick={() => setShowQR(true)}>
               <div className="flex justify-center mb-4"><QrCode className="w-12 h-12 text-primary" /></div>
               <p className="text-white font-black uppercase text-xs">Badge QR</p>
            </div>
          </div>
        </div>
      </div>

      {showQR && (
        <StudentQRCode 
          studentId={student.id} 
          studentName={`${student.first_name} ${student.last_name}`}
          onClose={() => setShowQR(false)} 
        />
      )}

      {showUpdateProgress && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
           <div className="glass-card w-full max-w-xl p-10 rounded-[3rem] border border-white/10 relative">
              <h2 className="text-2xl font-black text-white mb-8 uppercase tracking-tight flex items-center gap-4">
                 <Save className="w-8 h-8 text-primary" /> Actualiser Progression
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Juz</label>
                    <select className="input-field py-3 bg-[#121216]" value={updateData.juz} onChange={(e) => setUpdateData(p => ({...p, juz: e.target.value}))}>
                      {QURAN_JUZ.map(j => <option key={j.number} value={j.number}>Juz {j.number}</option>)}
                    </select>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Sourate</label>
                    <select className="input-field py-3 bg-[#121216]" value={updateData.surah} onChange={(e) => setUpdateData(p => ({...p, surah: e.target.value}))}>
                      {QURAN_JUZ.find(j => j.number === Number(updateData.juz))?.surahs.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                 </div>
                 <div className="space-y-1.5"><label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Page</label><input type="number" className="input-field py-3" value={updateData.page} onChange={(e) => setUpdateData(p => ({...p, page: e.target.value}))}/></div>
                 <div className="space-y-1.5"><label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Note Professeur</label><select className="input-field py-3 bg-[#121216]" value={updateData.type} onChange={(e) => setUpdateData(p => ({...p, type: e.target.value}))}><option value="positive">Positif</option><option value="negative">Négatif</option></select></div>
                 <div className="space-y-1.5 md:col-span-2"><label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Remarque</label><textarea className="input-field py-3 min-h-[100px]" value={updateData.remarks} onChange={(e) => setUpdateData(p => ({...p, remarks: e.target.value}))}/></div>
              </div>

              {updateData.books.length > 0 && (
                <div className="mb-8 p-6 bg-primary/5 rounded-[2rem] border border-primary/10">
                   <h4 className="text-[10px] font-black text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                     <BookOpen className="w-4 h-4" /> Progression des Livres
                   </h4>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {updateData.books.map((book, idx) => (
                        <div key={book.id} className="space-y-1">
                           <label className="text-[9px] font-bold text-white/50 uppercase ml-1">{book.name}</label>
                           <div className="flex items-center gap-2">
                              <span className="text-[10px] text-muted-foreground">Page:</span>
                              <input 
                                type="number" 
                                className="input-field py-2 bg-black/40 text-center" 
                                value={book.current_page} 
                                onChange={(e) => {
                                  const newBooks = [...updateData.books];
                                  newBooks[idx].current_page = e.target.value;
                                  setUpdateData(p => ({...p, books: newBooks}));
                                }}
                              />
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              )}
              <div className="flex justify-end gap-6">
                 <button onClick={() => setShowUpdateProgress(false)} className="btn-secondary px-8">Annuler</button>
                 <button onClick={handleUpdateProgress} className="btn-primary px-12">Enregistrer</button>
              </div>
           </div>
        </div>
      )}
    </DashboardLayout>
  );
}

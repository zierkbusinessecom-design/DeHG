'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useTranslation } from '@/context/TranslationContext';
import {
  User,
  ChevronLeft,
  Edit,
  Trash2,
  Mail,
  Phone,
  Briefcase,
  Award,
  CheckCircle2,
  MessageCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase-client';
import { cn } from '@/lib/utils';
import { useSchoolId } from '@/hooks/useSchoolId';

export default function TeacherProfilePage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const router = useRouter();
  const [teacher, setTeacher] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const { schoolId: school_id } = useSchoolId();
  const supabase = createClient();

  useEffect(() => {
    fetchTeacherData();
  }, [id]);

  const fetchTeacherData = async () => {
    // Infos prof
    const { data: teacherData } = await supabase
      .from('teachers')
      .select('*, profiles(*)')
      .eq('id', id)
      .single();

    if (teacherData) setTeacher(teacherData);
    setLoading(false);
  };

  if (loading) return <DashboardLayout><div className="flex items-center justify-center h-96"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div></DashboardLayout>;
  if (!teacher) return <DashboardLayout><div className="p-20 text-center">Professeur non trouvé.</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto page-transition pb-20">
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-10">
          <button
            onClick={() => router.push('/teachers')}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-muted-foreground hover:text-white transition-all border border-white/5 flex items-center gap-2 text-xs font-black uppercase tracking-widest"
          >
            <ChevronLeft className="w-4 h-4" /> Retour
          </button>

          <div className="flex gap-4">
            <button
              onClick={() => router.push(`/teachers/edit/${teacher.id}`)}
              className="btn-secondary p-3.5 hover:text-primary transition-colors"
            >
              <Edit className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                if (confirm("Supprimer ce professeur ?")) {
                  supabase.from('teachers').delete().eq('id', teacher.id).then(() => router.push('/teachers'));
                }
              }}
              className="btn-secondary p-3.5 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Profile Card Header */}
        <div className="glass-card p-12 rounded-[3rem] border border-white/10 mb-10 relative overflow-hidden group">
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary/5 rounded-full blur-[100px] group-hover:bg-primary/10 transition-all duration-700" />

          <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
            <div className="w-40 h-40 rounded-[3rem] bg-gradient-to-br from-primary/30 to-transparent flex items-center justify-center text-primary font-black text-6xl border-2 border-primary/20 shadow-2xl">
              {teacher.profiles?.first_name?.[0]}{teacher.profiles?.last_name?.[0]}
            </div>

            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
                <span className="px-4 py-1 bg-white/5 text-white/40 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-white/5">{teacher.status}</span>
              </div>
              <h1 className="text-5xl font-black text-white tracking-tighter uppercase mb-2 flex items-center justify-center md:justify-start gap-4">
                {teacher.profiles?.first_name} {teacher.profiles?.last_name}
                <CheckCircle2 className="w-8 h-8 text-primary fill-primary/10" />
              </h1>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-8 mt-8 text-muted-foreground">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-white/80">{teacher.profiles?.email || 'Non renseigné'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-white/80">{teacher.profiles?.phone || 'Non renseigné'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Combined Bio & Specialties Section */}
            <div className="glass-card p-10 rounded-[2.5rem] border border-white/10 overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-primary/10 transition-all duration-500" />
              
              <div className="flex flex-col md:flex-row gap-10 relative z-10">
                <div className="flex-1">
                  <h3 className="text-xl font-black text-white mb-6 uppercase tracking-tight flex items-center gap-4">
                    <Award className="w-6 h-6 text-primary" /> Biographie & Expérience
                  </h3>
                  <p className="text-muted-foreground leading-relaxed italic">
                    {teacher.bio || "Aucune biographie renseignée pour ce professeur."}
                  </p>
                </div>
                
                <div className="md:w-64 shrink-0">
                  <h3 className="text-xs font-black text-white/40 mb-4 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-primary" /> Spécialités
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {teacher.specialty ? teacher.specialty.split(',').map((s: string, i: number) => (
                      <span key={i} className="px-3 py-1.5 bg-white/5 text-white/70 text-[10px] font-bold rounded-xl border border-white/5 uppercase tracking-tighter hover:border-primary/30 transition-colors">
                        {s.trim()}
                      </span>
                    )) : (
                      <p className="text-white/20 text-[10px] italic">Aucune</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card p-10 rounded-[2.5rem] border border-white/10">
              <h3 className="text-xl font-black text-white mb-8 uppercase tracking-tight flex items-center gap-4">
                <Clock className="w-6 h-6 text-primary" /> Matières & Classes assignées
              </h3>
              {assignedCourses.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {assignedCourses.map((course) => (
                    <div key={course.id} className="p-6 bg-white/5 rounded-3xl border border-white/5 group/course relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-4 opacity-0 group-hover/course:opacity-100 transition-opacity">
                          <button 
                            onClick={async () => {
                              if(confirm("Désassigner cette matière ?")) {
                                await supabase.from('courses').delete().eq('id', course.id);
                                fetchTeacherData();
                              }
                            }}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                       </div>
                       <p className="text-xs font-black text-primary uppercase tracking-widest mb-1">{course.subjects?.name}</p>
                       <p className="text-white font-bold">{course.groups?.name}</p>
                       <div className="flex items-center gap-2 mt-3 text-[9px] text-muted-foreground font-black uppercase tracking-widest">
                          <BookOpen className="w-3 h-3" /> {course.subjects?.book_name || 'Support standard'}
                       </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white/5 rounded-3xl p-10 text-center border border-white/5 border-dashed">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                  <p className="text-muted-foreground font-bold italic">Aucun cours assigné pour le moment.</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <div className="glass-card p-8 rounded-[2.5rem] border border-white/10">
              <h3 className="text-lg font-black text-white mb-6 uppercase tracking-tight">Actions Rapides</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => {
                    let phone = teacher.profiles?.phone?.replace(/\D/g, '');
                    if (!phone) { alert("Numéro non renseigné"); return; }
                    if (phone.startsWith('0')) phone = phone.substring(1);
                    if (!phone.startsWith('32') && phone.length <= 10) phone = '32' + phone;
                    window.open(`https://wa.me/${phone}`, '_blank');
                  }}
                  className="w-full btn-secondary text-[10px] uppercase font-black py-4 flex items-center justify-center gap-3"
                >
                  <MessageCircle className="w-4 h-4 text-[#25D366]" /> WhatsApp Belge
                </button>
                <button 
                  onClick={() => setShowAssignModal(true)}
                  className="w-full btn-secondary text-[10px] uppercase font-black py-4 flex items-center justify-center gap-3 text-primary"
                >
                  <PlusCircle className="w-4 h-4" /> Assigner une Matière
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL ASSIGNATION */}
      {showAssignModal && (
        <Portal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
            <div className="glass-card w-full max-w-lg p-12 rounded-[3.5rem] border border-white/10 relative overflow-hidden shadow-2xl">
               <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-[80px]" />
               
               <button 
                onClick={() => setShowAssignModal(false)}
                className="absolute top-10 right-10 text-white/30 hover:text-white transition-colors"
               >
                 <X className="w-6 h-6" />
               </button>

               <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">Assignation</h2>
               <p className="text-muted-foreground text-sm font-medium mb-10">Liez ce professeur à une matière et un groupe.</p>

               <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Sélectionner la Matière</label>
                    <select 
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white focus:ring-2 focus:ring-primary/50 outline-none appearance-none"
                    >
                      <option value="" className="bg-[#121214]">Choisir une matière...</option>
                      {subjects.map(s => (
                        <option key={s.id} value={s.id} className="bg-[#121214]">{s.name} ({s.book_name || 'Standard'})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Sélectionner le Groupe (Classe)</label>
                    <select 
                      value={selectedGroup}
                      onChange={(e) => setSelectedGroup(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white focus:ring-2 focus:ring-primary/50 outline-none appearance-none"
                    >
                      <option value="" className="bg-[#121214]">Choisir un groupe...</option>
                      {groups.map(g => (
                        <option key={g.id} value={g.id} className="bg-[#121214]">{g.name} - {g.session === 'morning' ? 'Matin' : 'Après-midi'}</option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-6">
                    <button 
                      onClick={handleAssignSubject}
                      disabled={isAssigning || !selectedSubject || !selectedGroup}
                      className="w-full btn-primary py-5 rounded-[2rem] text-sm font-black uppercase tracking-widest shadow-[0_20px_40px_-10px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:shadow-none"
                    >
                      {isAssigning ? 'Assignation en cours...' : 'Confirmer l\'Assignation'}
                    </button>
                  </div>
               </div>
            </div>
          </div>
        </Portal>
      )}
    </DashboardLayout>
  );
}

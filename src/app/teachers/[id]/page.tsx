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
    // 1. Infos prof
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
                if (window.confirm("Supprimer ce professeur ?")) {
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
                <button 
                  onClick={() => {
                    let phone = teacher.profiles?.phone?.replace(/\D/g, '');
                    if (!phone) { alert("Numéro non renseigné"); return; }
                    if (phone.startsWith('0')) phone = phone.substring(1);
                    if (!phone.startsWith('32') && phone.length <= 10) phone = '32' + phone;
                    window.open(`https://wa.me/${phone}`, '_blank');
                  }}
                  className="px-6 py-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white rounded-xl border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg ml-4"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne de GAUCHE : Biographie */}
          <div className="lg:col-span-2 space-y-8">
            <div className="glass-card p-10 rounded-[2.5rem] border border-white/10 overflow-hidden relative group h-full">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-primary/10 transition-all duration-500" />
              
              <div className="relative z-10">
                <h3 className="text-xl font-black text-white mb-6 uppercase tracking-tight flex items-center gap-4">
                  <Award className="w-6 h-6 text-primary" /> Biographie & Expérience
                </h3>
                <p className="text-muted-foreground leading-relaxed italic text-lg">
                  {teacher.bio || "Aucune biographie renseignée pour ce professeur."}
                </p>
              </div>
            </div>
          </div>


          {/* Colonne de DROITE : Spécialités */}
          <div className="space-y-8">
            <div className="glass-card p-8 rounded-[2.5rem] border border-white/10 h-full">
              <h3 className="text-lg font-black text-white mb-6 uppercase tracking-tight flex items-center gap-3">
                <Briefcase className="w-5 h-5 text-primary" /> Spécialités
              </h3>
              <div className="flex flex-wrap gap-2">
                {teacher.specialty ? teacher.specialty.split(',').map((s: string, i: number) => (
                  <span key={i} className="px-4 py-2 bg-primary/10 text-primary text-[10px] font-black rounded-xl border border-primary/20 uppercase tracking-widest hover:bg-primary hover:text-white transition-all cursor-default w-full text-center">
                    {s.trim()}
                  </span>
                )) : (
                  <p className="text-xs text-muted-foreground italic">Aucune spécialité renseignée.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

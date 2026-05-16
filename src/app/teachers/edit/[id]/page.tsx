'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useTranslation } from '@/context/TranslationContext';
import { 
  UserSquare2, 
  Save, 
  ChevronLeft,
  Mail,
  Phone,
  Briefcase
} from 'lucide-react';
import { createClient } from '@/lib/supabase-client';
import { useSchoolId } from '@/hooks/useSchoolId';

import { SubjectMultiSelect } from '@/components/SubjectMultiSelect';

export default function EditTeacherPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    specialty: '',
    bio: ''
  });

  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  const { schoolId: school_id } = useSchoolId();
  const supabase = createClient();

  useEffect(() => {
    const fetchTeacher = async () => {
      const { data, error } = await supabase
        .from('teachers')
        .select('*, profiles(*)')
        .eq('id', id)
        .single();
      
      if (data) {
        let rawPhone = data.profiles?.phone || '';
        if (rawPhone.startsWith('+32')) rawPhone = rawPhone.replace('+32', '').trim();
        
        setFormData({
          full_name: `${data.profiles?.first_name || ''} ${data.profiles?.last_name || ''}`.trim(),
          email: data.profiles?.email || '',
          phone: rawPhone,
          specialty: data.specialty || '',
          bio: data.bio || ''
        });

        // Parse specialty into array for MultiSelect
        if (data.specialty) {
          const subjects = data.specialty.split(',').map((s: string) => s.trim()).filter((s: string) => s !== '');
          setSelectedSubjects(subjects);
        }
      }
      setLoading(false);
    };
    fetchTeacher();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubjectsChange = (values: string[]) => {
    setSelectedSubjects(values);
    setFormData(prev => ({ ...prev, specialty: values.join(', ') }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    if (selectedSubjects.length === 0) {
      alert("Veuillez sélectionner au moins une matière.");
      setSaving(false);
      return;
    }
    
    try {
      // 1. Récupérer l'ID du profil
      const { data: teacherData } = await supabase
        .from('teachers')
        .select('profile_id')
        .eq('id', id)
        .single();

      if (teacherData?.profile_id) {
        // 2. Mettre à jour le profil
        const fullPhone = '+32' + formData.phone.replace(/\s/g, '');
        const nameParts = formData.full_name.trim().split(/\s+/);
        const first_name = nameParts[0] || '';
        const last_name = nameParts.slice(1).join(' ') || '';

        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            first_name,
            last_name,
            email: formData.email,
            phone: fullPhone
          })
          .eq('id', teacherData.profile_id);

        if (profileError) throw profileError;
      }

      // 3. Mettre à jour les infos prof
      const { error: teacherError } = await supabase
        .from('teachers')
        .update({
          specialty: formData.specialty,
          bio: formData.bio
        })
        .eq('id', id);

      if (teacherError) throw teacherError;

      router.push(`/teachers/${id}`);
    } catch (error: any) {
      console.error(error);
      alert(t.error_msg + ': ' + (error.message || 'Erreur inconnue'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <DashboardLayout><div className="flex items-center justify-center h-96">Chargement...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto page-transition">
        <div className="flex items-center gap-4 mb-10">
          <button 
            onClick={() => router.back()}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-muted-foreground hover:text-white transition-all border border-white/5"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Modifier le Professeur</h1>
            <p className="text-muted-foreground text-sm font-medium mt-1">Mise à jour des informations professionnelles.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 pb-20">
          <div className="glass-card p-10 rounded-[2.5rem] border border-white/10 relative overflow-hidden group">
             <div className="absolute -right-4 -top-4 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all" />
             <h2 className="text-xl font-black text-white mb-8 flex items-center gap-4 relative z-10 uppercase tracking-tight">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary border border-primary/20">
                  <UserSquare2 className="w-6 h-6" />
                </div>
                Détails du Professeur
             </h2>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nom Complet</label>
                  <input required name="full_name" className="input-field" placeholder="Ex: Abdoulaye DIALLO" value={formData.full_name} onChange={handleChange} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-primary" /> {t.email}</label>
                  <input required type="email" name="email" className="input-field" placeholder="prof@dhg.school" value={formData.email} onChange={handleChange} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-primary" /> {t.phone}</label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 text-white font-medium text-sm pointer-events-none">+32</div>
                    <input 
                      required 
                      name="phone" 
                      className="input-field pl-11" 
                      placeholder="487 97 88..." 
                      value={formData.phone} 
                      onChange={handleChange} 
                    />
                  </div>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-2"><Briefcase className="w-3.5 h-3.5 text-primary" /> Spécialité / Matière(s) enseignée(s)</label>
                  <SubjectMultiSelect 
                    selectedValues={selectedSubjects} 
                    onChange={handleSubjectsChange} 
                    placeholder="Sélectionnez une ou plusieurs matières..."
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">Biographie / Expérience</label>
                  <textarea name="bio" rows={4} className="input-field resize-none" placeholder="Décrivez brièvement le parcours du professeur..." value={formData.bio} onChange={handleChange} />
                </div>
             </div>
          </div>

          <div className="flex justify-end gap-6 pt-10">
            <button type="button" onClick={() => router.back()} className="btn-secondary px-10">{t.cancel}</button>
            <button type="submit" disabled={saving} className="btn-primary px-16 min-w-[200px]">
              <Save className="w-5 h-5" />
              {saving ? 'Mise à jour...' : 'Sauvegarder les modifications'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

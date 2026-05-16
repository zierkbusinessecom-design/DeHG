'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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

export default function NewTeacherPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    specialty: '', // Will store as comma-separated string
    bio: ''
  });

  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  const { schoolId: school_id } = useSchoolId();
  const supabase = createClient();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubjectsChange = (values: string[]) => {
    setSelectedSubjects(values);
    setFormData(prev => ({ ...prev, specialty: values.join(', ') }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (selectedSubjects.length === 0) {
      alert("Veuillez sélectionner au moins une matière.");
      setLoading(false);
      return;
    }
    
    try {
    if (!school_id) {
      alert("Erreur: ID de l'école non trouvé.");
      setLoading(false);
      return;
    }

      const nameParts = formData.full_name.trim().split(/\s+/);
      const first_name = nameParts[0] || '';
      const last_name = nameParts.slice(1).join(' ') || '';

      // 1. Créer le profil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert([{
          first_name,
          last_name,
          email: formData.email,
          phone: formData.phone,
          role: 'teacher',
          school_id: school_id
        }])
        .select()
        .single();

      if (profileError) throw profileError;

      // Combiner l'indicatif avec le numéro pour l'enregistrement
      const fullPhone = '+32' + formData.phone.replace(/\s/g, '');
      
      // Mettre à jour le profil avec le numéro complet (facultatif si on veut garder séparé, mais plus simple ici)
      await supabase.from('profiles').update({ phone: fullPhone }).eq('id', profile.id);

      // 2. Créer le professeur
      const { error: teacherError } = await supabase
        .from('teachers')
        .insert([{
          school_id,
          profile_id: profile.id,
          specialty: formData.specialty,
          bio: formData.bio,
          status: 'active'
        }]);

      if (teacherError) throw teacherError;

      // alert(t.success_msg);
      router.push('/teachers');
    } catch (error: any) {
      console.error(error);
      alert(t.error_msg + ': ' + (error.message || 'Erreur inconnue'));
    } finally {
      setLoading(false);
    }
  };

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
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase">{t.add_teacher}</h1>
            <p className="text-muted-foreground text-sm font-medium mt-1">Recrutement d'un nouveau membre du personnel enseignant.</p>
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
            <button type="submit" disabled={loading} className="btn-primary px-16 min-w-[200px]">
              <Save className="w-5 h-5" />
              {loading ? 'Enregistrement...' : t.save}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

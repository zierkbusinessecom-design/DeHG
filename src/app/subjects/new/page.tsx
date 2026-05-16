'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useTranslation } from '@/context/TranslationContext';
import { 
  BookOpen, 
  Save, 
  ChevronLeft,
  Layers,
  FileText
} from 'lucide-react';
import { createClient } from '@/lib/supabase-client';
import { ProSelect } from '@/components/ui/ProSelect';
import { useSchoolId } from '@/hooks/useSchoolId';

export default function NewSubjectPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'academic',
    description: '',
    book_name: '',
    level: 'Initial',
    total_pages: 0
  });

  const { schoolId: school_id } = useSchoolId();
  const supabase = createClient();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
    if (!school_id) {
      alert("Erreur: ID de l'école non trouvé.");
      setLoading(false);
      return;
    }

      const { error } = await supabase
        .from('subjects')
        .insert([{
          school_id,
          name: formData.name,
          book_name: formData.name,
          type: 'academic',
          level: 'Général',
          description: formData.description,
          total_pages: Number(formData.total_pages)
        }]);

      if (error) throw error;

      // alert(t.success_msg);
      router.push('/subjects');
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
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Nouveau Livre</h1>
            <p className="text-muted-foreground text-sm font-medium mt-1">Ajout d'un nouveau livre au catalogue.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 pb-20">
          <div className="glass-card p-10 rounded-[2.5rem] border border-white/10 relative overflow-hidden group">
             <div className="absolute -right-4 -top-4 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all" />
              <h2 className="text-xl font-black text-white mb-8 flex items-center gap-4 relative z-10 uppercase tracking-tight">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary border border-primary/20">
                   <BookOpen className="w-6 h-6" />
                </div>
                Détails du Livre
              </h2>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nom du livre</label>
                  <input required name="name" className="input-field" placeholder="Ex: Al-Asas" value={formData.name} onChange={handleChange} />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nombre total de pages</label>
                  <input required type="number" name="total_pages" className="input-field" value={formData.total_pages} onChange={handleChange} />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">Description</label>
                  <textarea name="description" rows={3} className="input-field resize-none" placeholder="Objectifs pédagogiques..." value={formData.description} onChange={handleChange} />
                </div>
             </div>
          </div>

          <div className="flex justify-end gap-6 pt-10">
            <button type="button" onClick={() => router.back()} className="btn-secondary px-10">{t.cancel}</button>
            <button type="submit" disabled={loading} className="btn-primary px-16 min-w-[200px]">
              <Save className="w-5 h-5" />
              {loading ? 'Création...' : t.save}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

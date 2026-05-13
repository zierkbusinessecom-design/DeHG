'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useTranslation } from '@/context/TranslationContext';
import { 
  User, 
  ChevronLeft, 
  Save, 
  Users,
  Briefcase,
  MapPin,
  Phone,
  BookOpen,
  Calendar
} from 'lucide-react';
import { createClient } from '@/lib/supabase-client';
import { ProSelect } from '@/components/ui/ProSelect';
import { ProDatePicker } from '@/components/ui/ProDatePicker';
import { useSchoolId } from '@/hooks/useSchoolId';
import { cn } from '@/lib/utils';

export default function EditStudentPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availableBooks, setAvailableBooks] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    birth_date: null as Date | null,
    gender: 'M',
    group_id: '',
    alphabet_book: 'Noorania',
    alphabet_page: 1,
    status: 'active',
    parent_first_name: '',
    parent_last_name: '',
    parent_phone: '',
    parent_address: '',
    parent_occupation: '',
    selected_books: [] as string[]
  });

  const { schoolId: school_id } = useSchoolId();
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      // 1. Charger l'élève
      const { data, error } = await supabase
        .from('students')
        .select('*, student_parent(parents(*))')
        .eq('id', id)
        .single();
      
      if (data) {
        const parent = data.student_parent?.[0]?.parents;
        let rawParentPhone = parent?.phone || '';
        if (rawParentPhone.startsWith('+32')) rawParentPhone = rawParentPhone.replace('+32', '').trim();

        setFormData({
          first_name: data.first_name,
          last_name: data.last_name,
          birth_date: data.birth_date ? new Date(data.birth_date) : null,
          gender: data.gender || 'M',
          group_id: data.group_id || '',
          alphabet_book: data.alphabet_book || 'Noorania',
          alphabet_page: data.alphabet_page || 1,
          status: data.status || 'active',
          parent_first_name: parent?.first_name || '',
          parent_last_name: parent?.last_name || '',
          parent_phone: rawParentPhone,
          parent_address: parent?.address || '',
          parent_occupation: parent?.occupation || '',
          selected_books: data.alphabet_book ? data.alphabet_book.split(', ') : []
        });
      }

      // 2. Charger les livres dynamiquement
      const { data: subjectsData } = await supabase
        .from('subjects')
        .select('name, book_name')
        .order('name');
      
      if (subjectsData) setAvailableBooks(subjectsData);

      setLoading(false);
    };
    fetchData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // 1. Update Student
      const { error: studentError } = await supabase
        .from('students')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          birth_date: formData.birth_date ? formData.birth_date.toISOString().split('T')[0] : null,
          gender: formData.gender,
          group_id: formData.group_id,
          alphabet_book: formData.selected_books.join(', '),
          alphabet_page: formData.alphabet_page,
          status: formData.status
        })
        .eq('id', id);

      if (studentError) throw studentError;

      // 2. Update Parent (Simple logic for now: update the first linked parent)
      const { data: linkData } = await supabase
        .from('student_parent')
        .select('parent_id')
        .eq('student_id', id)
        .single();

      if (linkData?.parent_id) {
        const fullParentPhone = '+32' + formData.parent_phone.replace(/\s/g, '');
        const { error: parentError } = await supabase
          .from('parents')
          .update({
            first_name: formData.parent_first_name,
            last_name: formData.parent_last_name,
            phone: fullParentPhone,
            address: formData.parent_address,
            occupation: formData.parent_occupation
          })
          .eq('id', linkData.parent_id);
        
        if (parentError) throw parentError;
      }

      router.push(`/students/${id}`);
    } catch (error: any) {
      alert("Erreur: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <DashboardLayout><div className="flex items-center justify-center h-96">Chargement...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto page-transition pb-20">
        <div className="flex items-center gap-4 mb-10">
          <button 
            onClick={() => router.back()}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-muted-foreground hover:text-white transition-all border border-white/5 shadow-sm"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Modifier l'Élève</h1>
            <p className="text-muted-foreground text-sm font-medium mt-1">Mise à jour des informations du dossier.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
           {/* Section État Civil */}
           <div className="glass-card p-10 rounded-[2.5rem] border border-white/10">
              <h2 className="text-xl font-black text-white mb-8 flex items-center gap-4 uppercase tracking-tight">
                <User className="w-6 h-6 text-primary" /> État Civil
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">Prénom</label>
                  <input className="input-field" value={formData.first_name} onChange={e => setFormData(p => ({...p, first_name: e.target.value}))} required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nom</label>
                  <input className="input-field" value={formData.last_name} onChange={e => setFormData(p => ({...p, last_name: e.target.value}))} required />
                </div>
                <ProDatePicker label="Date de Naissance" selected={formData.birth_date} onChange={d => setFormData(p => ({...p, birth_date: d}))} />
                <ProSelect 
                  label="Genre" 
                  value={formData.gender} 
                  onChange={v => setFormData(p => ({...p, gender: v}))}
                  options={[{value: 'M', label: 'Masculin'}, {value: 'F', label: 'Féminin'}]}
                />
              </div>
           </div>

           {/* Section Parent */}
           <div className="glass-card p-10 rounded-[2.5rem] border border-white/10">
              <h2 className="text-xl font-black text-white mb-8 flex items-center gap-4 uppercase tracking-tight">
                <Users className="w-6 h-6 text-primary" /> Parent Responsable
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">Prénom du Parent</label>
                  <input className="input-field" value={formData.parent_first_name} onChange={e => setFormData(p => ({...p, parent_first_name: e.target.value}))} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nom du Parent</label>
                  <input className="input-field" value={formData.parent_last_name} onChange={e => setFormData(p => ({...p, parent_last_name: e.target.value}))} />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-primary" /> Téléphone</label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 text-white font-medium text-sm pointer-events-none">+32</div>
                    <input 
                      required 
                      className="input-field pl-11" 
                      placeholder="487 97 88..." 
                      value={formData.parent_phone} 
                      onChange={e => setFormData(p => ({...p, parent_phone: e.target.value}))} 
                    />
                  </div>
                </div>
              </div>
           </div>

            {/* Section Alphabétisation (MULTI-CHOIX) */}
            <div className="glass-card p-10 rounded-[2.5rem] border border-white/10">
               <h2 className="text-xl font-black text-white mb-8 flex items-center gap-4 uppercase tracking-tight">
                 <BookOpen className="w-6 h-6 text-primary" /> Matières & Supports d'Apprentissage
               </h2>
               
               <div className="space-y-6 relative z-10">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Sélectionnez les livres que l'enfant va étudier :</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {availableBooks.map((book) => {
                      const isSelected = formData.selected_books.includes(book.name);
                      return (
                        <button
                          key={book.name}
                          type="button"
                          onClick={() => {
                            const newBooks = isSelected 
                              ? formData.selected_books.filter(b => b !== book.name)
                              : [...formData.selected_books, book.name];
                            setFormData(p => ({ ...p, selected_books: newBooks }));
                          }}
                          className={cn(
                            "flex items-center gap-3 p-4 rounded-2xl border transition-all text-left",
                            isSelected 
                              ? "bg-primary/20 border-primary text-white shadow-lg shadow-primary/10" 
                              : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:border-white/20"
                          )}
                        >
                          <div className={cn(
                            "w-5 h-5 rounded-md border flex items-center justify-center transition-colors",
                            isSelected ? "bg-primary border-primary" : "border-white/20"
                          )}>
                            {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[11px] font-black uppercase tracking-tight leading-none mb-1">{book.name}</span>
                            <span className="text-[9px] opacity-50 truncate max-w-[120px]">{book.book_name || 'Standard'}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-6 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">Commentaire de progression</label>
                      <input className="input-field" placeholder="Ex: Suit bien le programme" value={formData.alphabet_book} onChange={(e) => setFormData(p => ({ ...p, alphabet_book: e.target.value}))} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">Page de départ (générale)</label>
                      <input type="number" className="input-field" value={formData.alphabet_page} onChange={(e) => setFormData(p => ({ ...p, alphabet_page: Number(e.target.value)}))} />
                    </div>
                  </div>
               </div>
            </div>

           <div className="flex justify-end pt-4">
              <button type="submit" disabled={saving} className="btn-primary px-16">
                <Save className="w-5 h-5" />
                {saving ? 'Enregistrement...' : 'Mettre à jour'}
              </button>
           </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useTranslation } from '@/context/TranslationContext';
import { 
  User, 
  Users, 
  Save, 
  ChevronLeft,
  CreditCard,
  Phone,
  MapPin,
  Briefcase,
  BookOpen
} from 'lucide-react';
import { createClient } from '@/lib/supabase-client';
import { ProSelect } from '@/components/ui/ProSelect';
import { ProDatePicker } from '@/components/ui/ProDatePicker';
import { cn } from '@/lib/utils';
import { useSchoolId } from '@/hooks/useSchoolId';
import { QURAN_JUZ } from '@/data/quran';

export default function NewStudentPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);
  const [availableBooks, setAvailableBooks] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    // Élève
    first_name: '',
    last_name: '',
    birth_date: null as Date | null,
    gender: 'M',
    group_id: '',
    alphabet_book: 'Noorania',
    alphabet_page: 1,
    // Parent
    parent_first_name: '',
    parent_last_name: '',
    parent_phone: '',
    parent_address: '',
    parent_occupation: '',
    relationship: 'Father',
    selected_books: [] as { name: string, page: string, juz?: string, hizb?: string, surah?: string, level?: string }[],
    // Paiement Initial
    registration_fee: '50',
    initial_payment: '50',
    payment_method: 'cash'
  });

  const { schoolId: school_id, loading: schoolLoading } = useSchoolId();
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      // Charger les groupes fixes
      const groupOptions = [
        { value: 'morning', label: t.group_a, subtext: '09h00 → 12h00' },
        { value: 'afternoon', label: t.group_b, subtext: '12h00 → 15h00' }
      ];
      setGroups(groupOptions);

      // Charger les livres dynamiquement
      const { data } = await supabase
        .from('subjects')
        .select('name, book_name')
        .order('name');
      
      if (data) setAvailableBooks(data);
    };
    fetchData();
  }, [t]);

  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
    if (!school_id) {
      alert("Erreur: ID de l'école non trouvé. Veuillez vérifier votre connexion.");
      setLoading(false);
      return;
    }

      // 1. Créer le Parent
      const fullParentPhone = '+32' + formData.parent_phone.replace(/\s/g, '');
      const { data: parent, error: parentError } = await supabase
        .from('parents')
        .insert([{
          school_id,
          first_name: formData.parent_first_name,
          last_name: formData.parent_last_name,
          phone: fullParentPhone,
          address: formData.parent_address,
          occupation: formData.parent_occupation
        }])
        .select()
        .single();

      if (parentError) throw parentError;

      // 2. Créer l'Élève
      const { data: student, error: studentError } = await supabase
        .from('students')
        .insert([{
          school_id,
          first_name: formData.first_name,
          last_name: formData.last_name,
          birth_date: formData.birth_date ? formData.birth_date.toISOString().split('T')[0] : null,
          gender: formData.gender,
          group_id: formData.group_id,
          alphabet_book: formData.selected_books.map(b => 
            b.name === 'Le Coran' 
              ? `Coran (Juz ${b.juz || '1'}, Hizb ${b.hizb || '1'}, Page ${b.page || '1'})`
              : `${b.name} (Page ${b.page || '1'})`
          ).join(', '),
          status: 'active'
        }])
        .select()
        .single();

      if (studentError) throw studentError;

      // 3. Lier Élève et Parent
      const { error: linkError } = await supabase
        .from('student_parent')
        .insert([{
          student_id: student.id,
          parent_id: parent.id,
          relationship: 'Parent'
        }]);

      if (linkError) throw linkError;

      // 4. Créer les frais d'inscription
      const { data: fee, error: feeError } = await supabase
        .from('student_fees')
        .insert([{
          school_id,
          student_id: student.id,
          amount_paid: Number(formData.initial_payment),
          status: Number(formData.initial_payment) >= Number(formData.registration_fee) ? 'paid' : 'partial'
        }])
        .select()
        .single();

      if (feeError) throw feeError;

      // 5. Enregistrer le paiement
      if (Number(formData.initial_payment) > 0) {
        const { error: payError } = await supabase
          .from('payments')
          .insert([{
            school_id,
            student_fee_id: fee.id,
            amount: Number(formData.initial_payment),
            method: formData.payment_method,
            notes: 'Paiement à l\'inscription'
          }]);
        
      if (payError) throw payError;
      }

      // 6. Enregistrer les données académiques réelles
      const quranBook = formData.selected_books.find(b => b.name === 'Le Coran');
      if (quranBook) {
        await supabase.from('student_quran_tracking').insert([{
          student_id: student.id,
          juz: Number(quranBook.juz),
          surah: quranBook.surah,
          page: Number(quranBook.page),
          history: [{
            date: new Date().toISOString(),
            juz: quranBook.juz,
            surah: quranBook.surah,
            page: quranBook.page,
            remarks: 'Inscription initiale',
            type: 'positive'
          }]
        }]);
      }

      const otherBooks = formData.selected_books.filter(b => b.name !== 'Le Coran');
      if (otherBooks.length > 0) {
        const booksToInsert = otherBooks.map(b => ({
          student_id: student.id,
          book_name: b.name,
          level: b.level,
          current_page: Number(b.page),
          remarks: 'Inscription initiale'
        }));
        await supabase.from('student_books_tracking').insert(booksToInsert);
      }

      router.push('/students');
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
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-muted-foreground hover:text-white transition-all border border-white/5 shadow-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tighter uppercase">{t.add_student}</h1>
              <p className="text-muted-foreground text-sm font-medium mt-1">Inscription directe et module de paiement intégré.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 pb-20">
          {/* DÉTAILS DE L'ÉLÈVE & PARENT (BLOC UNIQUE) */}
          <div className="glass-card p-10 rounded-[2.5rem] border border-white/10 relative overflow-hidden group">
             <div className="absolute -right-4 -top-4 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all" />
             <h2 className="text-xl font-black text-white mb-8 flex items-center gap-4 relative z-10 uppercase tracking-tight">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary border border-primary/20">
                  <User className="w-6 h-6" />
                </div>
                Détails de l'Élève
             </h2>

             <div className="space-y-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-1.5">
                     <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nom Complet de l'Enfant</label>
                     <input required className="input-field" placeholder="Ex: Mamadou Diallo" value={formData.last_name} onChange={(e) => handleChange('last_name', e.target.value)} />
                   </div>
                   <ProDatePicker label={t.birth_date} selected={formData.birth_date} onChange={(date) => handleChange('birth_date', date)} />
                   
                   <ProSelect label={t.gender} value={formData.gender} onChange={(val) => handleChange('gender', val)} options={[{ value: 'M', label: t.male }, { value: 'F', label: t.female }]} />
                   <ProSelect label={t.groups} value={formData.group_id} onChange={(val) => handleChange('group_id', val)} options={groups} placeholder="Sélectionner un horaire" />
                </div>

                {/* CHAMPS PARENT INTÉGRÉS ICI */}
                <div className="pt-8 border-t border-white/5">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nom Complet du Parent</label>
                        <input required className="input-field" placeholder="Ex: Amadou Diallo" value={formData.parent_last_name} onChange={(e) => handleChange('parent_last_name', e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">Téléphone du Parent</label>
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
             </div>
          </div>

          {/* MATIÈRES & SUPPORTS (DYNAMIQUE) */}
          <div className="glass-card p-10 rounded-[2.5rem] border border-white/10 relative overflow-hidden group mb-8">
             <h2 className="text-xl font-black text-white mb-8 flex items-center gap-4 relative z-10 uppercase tracking-tight">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary border border-primary/20">
                  <BookOpen className="w-6 h-6" />
                </div>
                Matières & Supports d'Apprentissage
             </h2>
             
             <div className="space-y-10 relative z-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {/* LE CORAN EST TOUJOURS EN PREMIER */}
                  {[{ name: 'Le Coran', book_name: 'Noble Coran' }, ...availableBooks.filter(b => b.name !== 'Le Coran')]
                    .filter((v, i, a) => a.findIndex(t => t.name === v.name) === i)
                    .map((book) => {
                    const selectedBook = formData.selected_books.find(b => b.name === book.name);
                    const isSelected = !!selectedBook;
                    
                    return (
                      <div key={book.name} className="space-y-4">
                        <button
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              handleChange('selected_books', formData.selected_books.filter(b => b.name !== book.name));
                            } else {
                              handleChange('selected_books', [...formData.selected_books, { name: book.name, page: '1', juz: '30', hizb: '1', surah: 'An-Naba', level: '1' }]);
                            }
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 p-4 rounded-2xl border transition-all text-left",
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
                            <span className="text-[9px] opacity-50 truncate">{book.book_name || 'Standard'}</span>
                          </div>
                        </button>

                        {/* CHAMPS DÉTAILLÉS SI SÉLECTIONNÉ */}
                        {isSelected && (
                          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-4 animate-in slide-in-from-top-2 duration-300">
                            {book.name === 'Le Coran' ? (
                              <div className="space-y-3">
                                {/* JUZ DROPDOWN (30 -> 1) */}
                                <div className="space-y-1">
                                  <label className="text-[9px] font-black text-muted-foreground uppercase">Juz</label>
                                  <select 
                                    className="input-field py-2 text-xs bg-[#121216]" 
                                    value={selectedBook.juz} 
                                    onChange={(e) => {
                                      const juzNum = Number(e.target.value);
                                      const juzData = QURAN_JUZ.find(j => j.number === juzNum);
                                      const newBooks = formData.selected_books.map(b => 
                                        b.name === book.name 
                                          ? { ...b, juz: e.target.value, surah: juzData?.surahs[0] || '' } 
                                          : b
                                      );
                                      handleChange('selected_books', newBooks);
                                    }}
                                  >
                                    {QURAN_JUZ.map(j => (
                                      <option key={j.number} value={j.number}>Juz {j.number} — {j.mainSurah}</option>
                                    ))}
                                  </select>
                                </div>

                                {/* SURAH DROPDOWN (DYNAMIQUE) */}
                                <div className="space-y-1">
                                  <label className="text-[9px] font-black text-muted-foreground uppercase">Sourate</label>
                                  <select 
                                    className="input-field py-2 text-xs bg-[#121216]" 
                                    value={selectedBook.surah} 
                                    onChange={(e) => {
                                      const newBooks = formData.selected_books.map(b => b.name === book.name ? { ...b, surah: e.target.value } : b);
                                      handleChange('selected_books', newBooks);
                                    }}
                                  >
                                    {QURAN_JUZ.find(j => j.number === Number(selectedBook.juz))?.surahs.map(s => (
                                      <option key={s} value={s}>{s}</option>
                                    ))}
                                  </select>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-1">
                                    <label className="text-[9px] font-black text-muted-foreground uppercase">Page</label>
                                    <input 
                                      type="number" 
                                      className="input-field py-2 text-xs" 
                                      value={selectedBook.page} 
                                      onChange={(e) => {
                                        const newBooks = formData.selected_books.map(b => b.name === book.name ? { ...b, page: e.target.value } : b);
                                        handleChange('selected_books', newBooks);
                                      }}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[9px] font-black text-muted-foreground uppercase">Niveau</label>
                                    <input 
                                      type="text" 
                                      className="input-field py-2 text-xs" 
                                      placeholder="Niveau..."
                                      value={selectedBook.level} 
                                      onChange={(e) => {
                                        const newBooks = formData.selected_books.map(b => b.name === book.name ? { ...b, level: e.target.value } : b);
                                        handleChange('selected_books', newBooks);
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-1">
                                    <label className="text-[9px] font-black text-muted-foreground uppercase">Page Actuelle</label>
                                    <input 
                                      type="number" 
                                      className="input-field py-2 text-xs" 
                                      value={selectedBook.page} 
                                      onChange={(e) => {
                                        const newBooks = formData.selected_books.map(b => b.name === book.name ? { ...b, page: e.target.value } : b);
                                        handleChange('selected_books', newBooks);
                                      }}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[9px] font-black text-muted-foreground uppercase">Niveau</label>
                                    <input 
                                      type="text" 
                                      className="input-field py-2 text-xs" 
                                      value={selectedBook.level} 
                                      onChange={(e) => {
                                        const newBooks = formData.selected_books.map(b => b.name === book.name ? { ...b, level: e.target.value } : b);
                                        handleChange('selected_books', newBooks);
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
             </div>
          </div>

          {/* PAIEMENT INITIAL */}
          <div className="glass-card p-10 rounded-[2.5rem] border border-white/10 relative overflow-hidden group">
             <h2 className="text-xl font-black text-white mb-8 flex items-center gap-4 relative z-10 uppercase tracking-tight">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary border border-primary/20">
                  <CreditCard className="w-6 h-6" />
                </div>
                Finances & Paiement Initial
             </h2>
             <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10 items-end">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">{t.registration_fee} (€)</label>
                  <input type="number" className="input-field" value={formData.registration_fee} onChange={(e) => handleChange('registration_fee', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">{t.initial_payment} (€)</label>
                  <input type="number" className="input-field" value={formData.initial_payment} onChange={(e) => handleChange('initial_payment', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-red-400 uppercase tracking-widest ml-1 italic">Reste à payer (€)</label>
                  <div className="input-field bg-red-500/5 border-red-500/20 text-red-500 font-black flex items-center">
                    {Math.max(0, (Number(formData.registration_fee) || 0) - (Number(formData.initial_payment) || 0)).toFixed(2)} €
                  </div>
                </div>
                <ProSelect label={t.payment_method} value={formData.payment_method} onChange={(val) => handleChange('payment_method', val)} options={[{ value: 'cash', label: t.cash }, { value: 'transfer', label: t.bank_transfer }]} />
             </div>
          </div>
          

          <div className="flex justify-end gap-6 pt-10">
            <button type="button" onClick={() => router.back()} className="btn-secondary px-10">{t.cancel}</button>
            <button type="submit" disabled={loading} className="btn-primary px-16 min-w-[200px]">
              <Save className="w-5 h-5" />
              {loading ? 'Traitement...' : t.save}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

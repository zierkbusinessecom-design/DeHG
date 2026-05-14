'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useTranslation } from '@/context/TranslationContext';
import { 
  BadgeDollarSign, 
  Wallet, 
  Clock, 
  Plus, 
  ArrowDownCircle,
  Download,
  Search,
  Filter
} from 'lucide-react';
import { createClient } from '@/lib/supabase-client';
import { cn } from '@/lib/utils';
import { ProSelect } from '@/components/ui/ProSelect';
import { useSchoolId } from '@/hooks/useSchoolId';
import { CheckCircle2, X, Save } from 'lucide-react';

export default function FinancePage() {
  const { t } = useTranslation();
  const [payments, setPayments] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newPayment, setNewPayment] = useState({
    student_id: '',
    amount: '',
    method: 'cash',
    notes: ''
  });

  const { schoolId: school_id } = useSchoolId();
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // 1. Fetch Payments
    const { data: payData } = await supabase
      .from('payments')
      .select(`
        *,
        student_fees (
          students (first_name, last_name)
        ),
        profiles (first_name, last_name)
      `)
      .order('payment_date', { ascending: false });
    if (payData) setPayments(payData);

    // 2. Fetch Students for the selection
    const { data: stuData } = await supabase
      .from('students')
      .select('id, first_name, last_name')
      .eq('status', 'active');
    if (stuData) setStudents(stuData);

    setLoading(false);
  };

  const handleCreatePayment = async () => {
    if (!newPayment.student_id || !newPayment.amount) return alert("Veuillez remplir tous les champs");
    setSaving(true);

    try {
      // 1. Trouver ou créer un student_fee pour cet élève
      const { data: feeData } = await supabase
        .from('student_fees')
        .select('id')
        .eq('student_id', newPayment.student_id)
        .limit(1)
        .maybeSingle();
      
      let feeId = feeData?.id;

      if (!feeId) {
        const { data: newFee } = await supabase
          .from('student_fees')
          .insert([{ student_id: newPayment.student_id, school_id, amount_paid: 0, status: 'partial' }])
          .select()
          .single();
        feeId = newFee?.id;
      }

      // 2. Insérer le paiement
      const { error } = await supabase
        .from('payments')
        .insert([{
          student_fee_id: feeId,
          school_id,
          amount: Number(newPayment.amount),
          method: newPayment.method,
          notes: newPayment.notes,
          payment_date: new Date().toISOString()
        }]);

      if (error) throw error;

      alert("Paiement enregistré !");
      setShowAdd(false);
      fetchData();
    } catch (err: any) {
      alert("Erreur: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const downloadCSV = () => {
    const headers = ['Date', 'Eleve', 'Montant', 'Methode', 'Gestionnaire'];
    const rows = filteredPayments.map(p => [
      new Date(p.payment_date).toLocaleDateString(),
      `${p.student_fees?.students?.last_name} ${p.student_fees?.students?.first_name}`,
      p.amount + " €",
      p.method,
      `${p.profiles?.first_name} ${p.profiles?.last_name}`
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "transactions.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stats = [
    { title: 'Total Collecté (Mois)', value: '4,850 €', icon: ArrowDownCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { title: 'Restant Dû Global', value: '1,240 €', icon: Clock, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { title: 'Taux de Recouvrement', value: '78%', icon: Wallet, color: 'text-teal-400', bg: 'bg-teal-500/10' },
  ];

  const filteredPayments = payments.filter(p => 
    `${p.student_fees?.students?.first_name} ${p.student_fees?.students?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="page-transition">
        <div className="flex flex-wrap justify-between items-center gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">{t.finance}</h1>
            <p className="text-muted-foreground text-sm font-medium mt-1">Suivi des flux financiers et cotisations</p>
          </div>

          <button 
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-3 bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3.5 rounded-2xl font-black text-sm transition-all shadow-[0_0_30px_-5px_rgba(34,197,94,0.5)] uppercase tracking-tighter"
          >
            <Plus className="w-5 h-5" />
            {t.add_payment}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {stats.map((stat, i) => (
            <div key={i} className="glass-card p-8 rounded-[2rem] border border-white/5 flex items-center gap-6 hover:border-primary/30 transition-all group overflow-hidden relative">
              <div className={cn("p-4 rounded-2xl border border-white/5 shadow-xl transition-transform group-hover:scale-110", stat.bg, stat.color)}>
                <stat.icon className="w-7 h-7" />
              </div>
              <div className="relative z-10">
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">{stat.title}</p>
                <p className="text-3xl font-black text-white mt-1 tracking-tighter">{stat.value}</p>
              </div>
              <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all" />
            </div>
          ))}
        </div>

        <div className="glass-card rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl">
          <div className="p-8 border-b border-white/5 bg-white/5 flex flex-wrap justify-between items-center gap-6">
            <div className="flex items-center gap-5">
              <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 shadow-xl">
                <BadgeDollarSign className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">Historique des Transactions</h2>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative w-72">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="text"
                  placeholder="Rechercher par élève..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button 
                onClick={downloadCSV}
                className="flex items-center gap-2 p-3 bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white border border-white/10 rounded-2xl transition-all"
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5 border-b border-white/5">
                  <th className="px-8 py-5 text-[11px] font-black text-muted-foreground uppercase tracking-widest">Date</th>
                  <th className="px-8 py-5 text-[11px] font-black text-muted-foreground uppercase tracking-widest">Élève</th>
                  <th className="px-8 py-5 text-[11px] font-black text-muted-foreground uppercase tracking-widest">Montant</th>
                  <th className="px-8 py-5 text-[11px] font-black text-muted-foreground uppercase tracking-widest">Méthode</th>
                  <th className="px-8 py-5 text-[11px] font-black text-muted-foreground uppercase tracking-widest">Gestionnaire</th>
                  <th className="px-8 py-5 text-[11px] font-black text-muted-foreground uppercase tracking-widest text-right">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  [...Array(5)].map((_, i) => <tr key={i} className="animate-pulse"><td colSpan={6} className="px-8 py-6"><div className="h-5 bg-white/5 rounded-xl w-full" /></td></tr>)
                ) : filteredPayments.length === 0 ? (
                  <tr><td colSpan={6} className="px-8 py-20 text-center text-muted-foreground">Aucune transaction trouvée</td></tr>
                ) : (
                  filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-primary/5 transition-colors group">
                      <td className="px-8 py-5 text-sm text-white font-medium">
                        {new Date(p.payment_date).toLocaleDateString()}
                      </td>
                      <td className="px-8 py-5 text-sm text-white font-black uppercase tracking-tight">
                        {p.student_fees?.students?.last_name} {p.student_fees?.students?.first_name}
                      </td>
                      <td className="px-8 py-5 text-sm text-emerald-400 font-black">
                        +{p.amount} €
                      </td>
                      <td className="px-8 py-5">
                        <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                          {p.method}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-xs text-muted-foreground font-medium italic">
                        {p.profiles?.first_name} {p.profiles?.last_name}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
                          Complété
                        </span>
                      </td>
                    </tr>
                  )))
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="glass-card w-full max-w-lg p-10 rounded-[3rem] border border-white/10 relative my-auto">
             <div className="absolute -right-4 -top-4 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
             <h2 className="text-2xl font-black text-white mb-10 uppercase tracking-tight flex items-center gap-4">
                <BadgeDollarSign className="w-8 h-8 text-primary" /> Enregistrer un Paiement
             </h2>
             
             <div className="space-y-6">
                <div className="space-y-1.5">
                   <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">Élève</label>
                   <select 
                     className="input-field py-3 bg-[#121216]"
                     value={newPayment.student_id}
                     onChange={(e) => setNewPayment(p => ({...p, student_id: e.target.value}))}
                   >
                     <option value="">Sélectionner un élève...</option>
                     {students.map(s => <option key={s.id} value={s.id}>{s.last_name} {s.first_name}</option>)}
                   </select>
                </div>

                <div className="space-y-1.5">
                   <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">Montant (€)</label>
                   <input 
                     type="number" 
                     className="input-field" 
                     placeholder="0.00" 
                     value={newPayment.amount}
                     onChange={(e) => setNewPayment(p => ({...p, amount: e.target.value}))}
                   />
                </div>

                <ProSelect 
                   label="Méthode de paiement"
                   value={newPayment.method}
                   onChange={(val) => setNewPayment(p => ({...p, method: val}))}
                   options={[{value: 'cash', label: 'Espèces'}, {value: 'transfer', label: 'Virement'}, {value: 'card', label: 'Carte'}]}
                />

                <div className="space-y-1.5">
                   <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">Notes / Référence</label>
                   <input 
                     className="input-field" 
                     placeholder="Ex: Paiement Mars 2024" 
                     value={newPayment.notes}
                     onChange={(e) => setNewPayment(p => ({...p, notes: e.target.value}))}
                   />
                </div>
             </div>

             <div className="flex justify-end gap-6 mt-10">
                <button onClick={() => setShowAdd(false)} className="btn-secondary px-8">Annuler</button>
                <button 
                  onClick={handleCreatePayment} 
                  disabled={saving}
                  className="btn-primary px-12"
                >
                  <Save className="w-5 h-5" />
                  {saving ? 'Traitement...' : 'Confirmer'}
                </button>
             </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

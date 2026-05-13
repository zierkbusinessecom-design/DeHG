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

export default function FinancePage() {
  const { t } = useTranslation();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const supabase = createClient();

  useEffect(() => {
    const fetchPayments = async () => {
      const { data } = await supabase
        .from('payments')
        .select(`
          *,
          student_fees (
            students (first_name, last_name)
          ),
          profiles (first_name, last_name)
        `)
        .order('payment_date', { ascending: false });
      if (data) setPayments(data);
      setLoading(false);
    };
    fetchPayments();
  }, []);

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

          <button className="flex items-center gap-3 bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3.5 rounded-2xl font-black text-sm transition-all shadow-[0_0_30px_-5px_rgba(34,197,94,0.5)] uppercase tracking-tighter">
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
              <button className="flex items-center gap-2 p-3 bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white border border-white/10 rounded-2xl transition-all">
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
    </DashboardLayout>
  );
}

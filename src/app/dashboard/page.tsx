'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useTranslation } from '@/context/TranslationContext';
import { 
  Users, 
  CalendarCheck, 
  TrendingUp, 
  BadgeDollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  LayoutGrid,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

const StatCard = ({ title, value, trend, icon: Icon, color }: any) => (
  <div className="glass-card p-6 rounded-3xl border border-white/5 hover:border-primary/20 transition-all duration-500 group overflow-hidden relative">
    <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-500" />
    
    <div className="flex justify-between items-start relative z-10">
      <div className={cn("p-3.5 rounded-2xl border border-white/10 shadow-xl transition-all duration-500 group-hover:scale-110", color)}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className={cn("flex items-center gap-1 text-[11px] font-black px-2 py-1 rounded-lg border", trend > 0 ? "text-green-400 bg-green-500/10 border-green-500/20" : "text-red-400 bg-red-500/10 border-red-500/20")}>
        {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        {Math.abs(trend)}%
      </div>
    </div>
    
    <div className="mt-6 relative z-10">
      <h3 className="text-muted-foreground text-xs font-bold uppercase tracking-widest">{title}</h3>
      <p className="text-3xl font-black mt-2 text-white tracking-tighter">{value}</p>
    </div>
  </div>
);

export default function Dashboard() {
  const { t } = useTranslation();
  const [selectedGroup, setSelectedGroup] = useState('all');

  const stats = [
    { title: t.total_students, value: '1,284', trend: 12.5, icon: Users, color: 'bg-emerald-500' },
    { title: t.attendance_today, value: '942', trend: 3.2, icon: CalendarCheck, color: 'bg-teal-500' },
    { title: t.collected_fees, value: '12,450 €', trend: -2.4, icon: BadgeDollarSign, color: 'bg-green-600' },
    { title: t.success_rate, value: '88%', trend: 4.1, icon: TrendingUp, color: 'bg-emerald-700' },
  ];

  const recentActivity = [
    { id: 1, type: 'attendance', user: 'Moussa Diallo', action: 'Absence marquée', time: 'il y a 5 min' },
    { id: 2, type: 'payment', user: 'Fatoumata Barry', action: 'Paiement de 50€ reçu', time: 'il y a 12 min' },
    { id: 3, type: 'grade', user: 'Prof. Ahmed', action: 'Notes d\'Arabe publiées', time: 'il y a 25 min' },
    { id: 4, type: 'quran', user: 'Abdoulaye Sow', action: 'Progression Juz 4 validée', time: 'il y a 45 min' },
  ];

  return (
    <DashboardLayout>
      <div className="page-transition">
        <div className="flex flex-wrap justify-between items-center gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">{t.dashboard}</h1>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(34,197,94,1)]" />
              <p className="text-muted-foreground text-sm font-medium">{t.welcome_back}, Admin</p>
            </div>
          </div>
          
          <div className="flex gap-1.5 p-1.5 bg-card border border-white/5 rounded-2xl shadow-2xl">
            {['all', 'A', 'B'].map((group) => (
              <button
                key={group}
                onClick={() => setSelectedGroup(group)}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-[11px] font-black uppercase transition-all tracking-tighter",
                  selectedGroup === group 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105" 
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                )}
              >
                {group === 'all' ? 'Vue Globale' : `Groupe ${group}`}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {stats.map((stat, i) => (
            <StatCard key={i} {...stat} />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8">
          <div className="glass-card p-8 rounded-3xl border border-white/5 overflow-hidden relative">
            <div className="absolute right-0 top-0 p-8 opacity-5">
              <Activity className="w-32 h-32 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
              <LayoutGrid className="w-5 h-5 text-primary" />
              Statistiques de Présences
            </h2>
            <div className="h-72 flex items-end justify-between gap-6 px-2">
              {[65, 45, 75, 85, 55, 95, 80].map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                  <div className="relative w-full">
                    <div 
                      className="w-full bg-primary/10 rounded-2xl border border-primary/20 relative group-hover:bg-primary/20 transition-all duration-500 overflow-hidden" 
                      style={{ height: `${val * 2}px` }}
                    >
                      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-primary to-emerald-400 opacity-60 rounded-2xl group-hover:opacity-100 transition-all duration-500" style={{ height: '100%' }} />
                    </div>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all">
                      {val}%
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Jour {i+1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

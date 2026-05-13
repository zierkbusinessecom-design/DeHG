'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/context/TranslationContext';
import { 
  User, 
  BookMarked, 
  CalendarCheck, 
  BadgeDollarSign, 
  GraduationCap,
  Download,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { createClient } from '@/lib/supabase-client';
import { generateBulletinPDF } from '@/lib/pdf-generator';

const ChildCard = ({ child, t }: any) => (
  <div className="glass-card p-6 rounded-3xl border border-white/10 hover:border-primary/30 transition-all animate-fade-in">
    <div className="flex items-center gap-4 mb-6">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/5 flex items-center justify-center text-primary font-bold text-2xl">
        {child.first_name[0]}{child.last_name[0]}
      </div>
      <div>
        <h3 className="text-xl font-bold text-white uppercase">{child.last_name} {child.first_name}</h3>
        <p className="text-sm text-muted-foreground">Groupe {child.groups?.name} • Trimestre 1</p>
      </div>
      <button 
        onClick={() => generateBulletinPDF(child, [], {})}
        className="ml-auto p-3 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl transition-all border border-primary/20"
      >
        <Download className="w-5 h-5" />
      </button>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
        <div className="flex items-center gap-2 mb-2 text-primary">
          <BookMarked className="w-4 h-4" />
          <span className="text-xs font-bold uppercase">Coran</span>
        </div>
        <p className="text-lg font-bold text-white">Juz {child.current_juz}</p>
        <p className="text-[10px] text-muted-foreground">{child.current_surah || 'Al-Baqarah'}</p>
      </div>

      <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
        <div className="flex items-center gap-2 mb-2 text-green-400">
          <GraduationCap className="w-4 h-4" />
          <span className="text-xs font-bold uppercase">Moyenne</span>
        </div>
        <p className="text-lg font-bold text-white">15.50</p>
        <p className="text-[10px] text-muted-foreground">Rang: 4ème</p>
      </div>

      <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
        <div className="flex items-center gap-2 mb-2 text-orange-400">
          <CalendarCheck className="w-4 h-4" />
          <span className="text-xs font-bold uppercase">Présences</span>
        </div>
        <p className="text-lg font-bold text-white">98%</p>
        <p className="text-[10px] text-muted-foreground">2 Absences</p>
      </div>

      <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
        <div className="flex items-center gap-2 mb-2 text-blue-400">
          <BadgeDollarSign className="w-4 h-4" />
          <span className="text-xs font-bold uppercase">Cotisations</span>
        </div>
        <p className="text-lg font-bold text-white">À jour</p>
        <p className="text-[10px] text-muted-foreground">Payé: 150€</p>
      </div>
    </div>

    <button className="w-full mt-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white text-sm font-bold transition-all border border-white/10 flex items-center justify-center gap-2">
      Voir le dossier complet
      <ChevronRight className="w-4 h-4" />
    </button>
  </div>
);

export default function ParentDashboard() {
  const { t, setLocale, locale } = useTranslation();
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    const fetchChildren = async () => {
      // In a real app, we'd get the current parent profile
      // For this demo, we'll fetch all students linked to a sample parent or just some students
      const { data } = await supabase
        .from('students')
        .select('*, groups(*)')
        .limit(2);
      if (data) setChildren(data);
      setLoading(false);
    };
    fetchChildren();
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] p-6 lg:p-12">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Espace Parent</h1>
            <p className="text-muted-foreground mt-1">Suivez la progression de vos enfants</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
              {(['fr', 'en', 'ar'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLocale(l)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${locale === l ? 'bg-primary text-white' : 'text-muted-foreground'}`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <button className="p-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {loading ? (
            [1, 2].map(i => <div key={i} className="h-96 bg-white/5 rounded-3xl animate-pulse" />)
          ) : children.length === 0 ? (
            <div className="col-span-full py-20 text-center glass-card rounded-3xl">
              <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucun enfant trouvé pour ce compte.</p>
            </div>
          ) : (
            children.map(child => (
              <ChildCard key={child.id} child={child} t={t} />
            )))
          }
        </div>

        <div className="mt-12 glass-card p-8 rounded-3xl border border-white/5">
          <h2 className="text-xl font-bold text-white mb-6">Messages de l'école</h2>
          <div className="space-y-4">
            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
              <p className="text-sm text-primary font-bold mb-1">Rappel : Réunion Parents-Profs</p>
              <p className="text-xs text-muted-foreground">Ce samedi à 10h00 en salle B12. Votre présence est vivement souhaitée.</p>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
              <p className="text-sm text-white font-bold mb-1">Sortie pédagogique confirmée</p>
              <p className="text-xs text-muted-foreground">La sortie au musée de l'alphabet est prévue pour le dimanche 15 mai.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

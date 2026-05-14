'use client';

import React, { useState } from 'react';
import { 
  format, 
  startOfYear, 
  eachMonthOfInterval, 
  endOfYear, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  isSaturday, 
  isSunday,
  addDays,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Clock, Info, X } from 'lucide-react';

interface AnnualAttendanceCalendarProps {
  attendanceHistory: any[];
}

export function AnnualAttendanceCalendar({ attendanceHistory }: AnnualAttendanceCalendarProps) {
  const [selectedDay, setSelectedDay] = useState<any>(null);
  
  const currentYear = new Date().getFullYear();
  const months = eachMonthOfInterval({
    start: startOfYear(new Date(currentYear, 0, 1)),
    end: endOfYear(new Date(currentYear, 0, 1))
  });

  const getNextSchoolDay = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // On cherche sur les 30 prochains jours le premier samedi/dimanche sans données
    for (let i = 0; i < 30; i++) {
      const d = addDays(today, i);
      if (isSaturday(d) || isSunday(d)) {
        const hasRecord = attendanceHistory.some(a => isSameDay(new Date(a.date), d));
        if (!hasRecord) return d;
      }
    }
    return null;
  };

  const nextSchoolDay = getNextSchoolDay();

  const getDayStatus = (date: Date) => {
    const record = attendanceHistory.find(a => isSameDay(new Date(a.date), date));
    return record || null;
  };

  // On prépare les données pour la grille inversée
  // Chaque mois aura une liste de ses weekends
  const monthWeekends = months.map(month => {
    const daysInMonth = eachDayOfInterval({
      start: startOfMonth(month),
      end: endOfMonth(month)
    });
    return {
      name: format(month, 'MMM', { locale: fr }),
      days: daysInMonth.filter(d => isSaturday(d) || isSunday(d))
    };
  });

  // On trouve le nombre maximum de weekends dans un mois pour les lignes
  const maxWeekends = Math.max(...monthWeekends.map(m => m.days.length));

  return (
    <div className="space-y-8 pb-10 overflow-x-auto custom-scrollbar">
      {/* LÉGENDE */}
      <div className="flex flex-wrap gap-6 p-6 bg-white/[0.02] rounded-[2rem] border border-white/5 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-md bg-emerald-500 shadow-[0_0_10px_#10b981]" />
          <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Présent</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-md bg-orange-500" />
          <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Retard</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-md bg-blue-500" />
          <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Hors Horaire</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-md bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)] border-2 border-white" />
          <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Prochain Cours</span>
        </div>
      </div>

      {/* GRILLE INVERSÉE : MOIS EN HAUT, JOURS EN BAS */}
      <div className="min-w-[1000px] bg-white/[0.02] p-10 rounded-[3rem] border border-white/5 shadow-2xl">
        <div className="grid grid-cols-12 gap-4">
          {/* En-têtes des Mois */}
          {monthWeekends.map((m, i) => (
            <div key={i} className="text-center">
              <div className="text-[11px] font-black text-primary uppercase tracking-[0.2em] mb-6 pb-2 border-b border-white/10">
                {m.name}
              </div>
              
              {/* Colonne des jours pour ce mois */}
              <div className="space-y-3">
                {Array.from({ length: maxWeekends }).map((_, rowIndex) => {
                  const date = m.days[rowIndex];
                  if (!date) return <div key={rowIndex} className="w-full aspect-square opacity-0" />;

                  const record = getDayStatus(date);
                  const isToday = isSameDay(date, new Date());
                  const isNext = nextSchoolDay && isSameDay(date, nextSchoolDay);
                  
                  let colorClass = "bg-white/5 border border-white/5 text-white/20 hover:border-white/20";
                  
                  if (record) {
                    if (record.status === 'present' && !record.is_exception) colorClass = "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20";
                    else if (record.status === 'late' && !record.is_exception) colorClass = "bg-orange-500 text-white shadow-lg shadow-orange-500/20";
                    else if (record.is_exception) colorClass = "bg-blue-500 text-white shadow-lg shadow-blue-500/20";
                  } else if (isNext) {
                    colorClass = "bg-yellow-400 text-black font-black shadow-[0_0_15px_rgba(250,204,21,0.4)] border-white scale-110 z-10";
                  }

                  return (
                    <div 
                      key={rowIndex}
                      onClick={() => record && setSelectedDay(record)}
                      className={cn(
                        "w-full aspect-square rounded-xl transition-all flex flex-col items-center justify-center cursor-pointer border",
                        colorClass,
                        record && "hover:scale-110 hover:z-10",
                        isToday && "ring-2 ring-primary ring-offset-2 ring-offset-black"
                      )}
                    >
                      <span className="text-[8px] font-black uppercase opacity-40">
                        {isSaturday(date) ? 'SAM' : 'DIM'}
                      </span>
                      <span className="text-xs font-black">
                        {format(date, 'd')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL DÉTAILS */}
      {selectedDay && (
        <div 
          onClick={() => setSelectedDay(null)}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="glass-card w-full max-w-sm p-10 rounded-[3rem] border border-white/10 relative overflow-hidden cursor-default shadow-2xl"
          >
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setSelectedDay(null);
              }} 
              className="absolute top-8 right-8 p-3 bg-primary rounded-2xl text-white shadow-xl hover:scale-110 transition-all z-[1000]"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h3 className="text-2xl font-black text-white mb-8 uppercase tracking-tighter">Détails de Présence</h3>
            
            <div className="space-y-6">
              <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-2">Date du scan</p>
                <p className="text-white font-black text-lg uppercase">{format(new Date(selectedDay.date), 'EEEE dd MMMM', { locale: fr })}</p>
                <div className="flex items-center gap-3 mt-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-white tracking-tighter">{selectedDay.arrival_time}</p>
                    <p className="text-[10px] text-primary font-black uppercase tracking-widest">Heure d'arrivée</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[10px] text-muted-foreground uppercase font-black mb-1">Ponctualité</p>
                  <p className={cn("font-black uppercase text-[11px]", 
                    selectedDay.status === 'present' ? 'text-emerald-400' : 'text-orange-400'
                  )}>
                    {selectedDay.status === 'present' ? 'À l\'heure' : 'En retard'}
                  </p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[10px] text-muted-foreground uppercase font-black mb-1">Validation</p>
                  <p className="text-white font-black uppercase text-[11px]">
                    {selectedDay.is_exception ? 'Exceptionnel' : 'Standard'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

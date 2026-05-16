'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useTranslation } from '@/context/TranslationContext';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 

  Users,
  Search,
  QrCode,
  AlertCircle
} from 'lucide-react';
import { createClient } from '@/lib/supabase-client';
import { format, isAfter, setHours, setMinutes } from 'date-fns';
import { ProSelect } from '@/components/ui/ProSelect';
import { ProDatePicker } from '@/components/ui/ProDatePicker';
import { QRScanner } from '@/components/QRScanner';
import { cn } from '@/lib/utils';

export default function AttendancePage() {
  const { t } = useTranslation();
  const [date, setDate] = useState<Date | null>(new Date());
  const [selectedGroup, setSelectedGroup] = useState<string>('morning');
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, { status: string, arrival_time?: string }>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const supabase = createClient();

  const groups = [
    { value: 'morning', label: t.group_a, subtext: '09h00 → 12h00' },
    { value: 'afternoon', label: t.group_b, subtext: '12h00 → 15h00' }
  ];

  // Détection automatique du groupe en fonction de l'heure
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 12 && hour < 17) setSelectedGroup('afternoon');
    else setSelectedGroup('morning');
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!date) return;
      setLoading(true);
      
      // 1. Récupérer les élèves actifs
      const { data: studentsData } = await supabase
        .from('students')
        .select('*')
        .eq('status', 'active')
        .eq('group_id', selectedGroup);
      
      if (studentsData) {
        setStudents(studentsData);
        
        // 2. Récupérer les présences déjà enregistrées pour cette date et ce groupe
        const { data: existingAttendance } = await supabase
          .from('attendances')
          .select('*')
          .eq('date', format(date, 'yyyy-MM-dd'))
          .eq('session', selectedGroup);

        const attendanceMap: Record<string, any> = {};
        
        // Initialiser tout le monde à présent par défaut (si rien en base)
        studentsData.forEach(s => {
          attendanceMap[s.id] = { status: 'present' };
        });

        // Écraser avec les données réelles de la base
        if (existingAttendance) {
          existingAttendance.forEach(record => {
            attendanceMap[record.student_id] = { 
              status: record.status, 
              arrival_time: record.arrival_time 
            };
          });
        }
        
        setAttendance(attendanceMap);
      }
      setLoading(false);
    };

    fetchData();
  }, [selectedGroup, date]); // Se rafraîchit si le groupe OU la date change

  const updateStatus = async (studentId: string, status: string) => {
    const arrivalTime = status === 'late' ? format(new Date(), 'HH:mm:ss') : null;
    
    // Mise à jour locale immédiate
    setAttendance(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status, arrival_time: status === 'late' ? format(new Date(), 'HH:mm') : undefined }
    }));

    // Sauvegarde en base immédiate
    const student = students.find(s => s.id === studentId);
    if (!student || !date) return;

    await supabase.from('attendances').upsert({
      student_id: studentId,
      school_id: student.school_id,
      date: format(date, 'yyyy-MM-dd'),
      status,
      arrival_time: arrivalTime,
      session: selectedGroup
    }, { onConflict: 'student_id,date' });
  };

  const markAllPresent = async () => {
    const allPresent: Record<string, any> = {};
    students.forEach(s => {
      allPresent[s.id] = { status: 'present' };
    });
    setAttendance(allPresent);

    // Sauvegarde en masse
    if (!date) return;
    const data = students.map(s => ({
      student_id: s.id,
      school_id: s.school_id,
      date: format(date, 'yyyy-MM-dd'),
      status: 'present',
      arrival_time: null,
      session: selectedGroup
    }));
    await supabase.from('attendances').upsert(data, { onConflict: 'student_id,date' });
  };

  const handleQRScan = (scannedId: string) => {
    // Dans un système réel, scannedId est l'ID Supabase de l'élève
    const student = students.find(s => s.id === scannedId);
    
    if (student) {
      const now = new Date();
      let status = 'present';
      
      const limitTime = selectedGroup === 'morning' 
        ? setMinutes(setHours(new Date(), 9), 10)
        : setMinutes(setHours(new Date(), 12), 10);
      
      if (isAfter(now, limitTime)) {
        status = 'late';
      }

      updateStatus(student.id, status);
      // On ne ferme plus le scanner, on laisse l'enregistrement se faire visuellement en arrière-plan
      console.log(`Scan réussi: ${student.first_name} marked as ${status}`);
    }
  };

  const handleSave = async () => {
    if (!date || students.length === 0) return;
    setSaving(true);
    
    try {
      const attendanceData = students.map(s => ({
        student_id: s.id,
        school_id: s.school_id,
        date: format(date, 'yyyy-MM-dd'),
        status: attendance[s.id]?.status || 'absent',
        arrival_time: attendance[s.id]?.arrival_time || null,
        session: selectedGroup
      }));

      // On utilise upsert pour écraser si on ré-enregistre le même jour
      const { error } = await supabase
        .from('attendances')
        .upsert(attendanceData, { onConflict: 'student_id,date' });

      if (error) throw error;
      // alert("Présences enregistrées avec succès !");
    } catch (err: any) {
      console.error(err);
      alert("Erreur lors de la sauvegarde: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter(s => 
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="page-transition">
        <div className="flex flex-wrap justify-between items-center gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">{t.attendance}</h1>
            <p className="text-muted-foreground text-sm font-medium mt-1">Gestion automatisée par QR Code et détection des retards.</p>
          </div>

          <div className="flex items-center gap-4">
            <ProDatePicker selected={date} onChange={setDate} className="w-56" />
            <div className="flex gap-1.5 p-1.5 bg-white/5 border border-white/10 rounded-2xl shadow-xl">
              {[
                { id: 'morning', label: 'Groupe A (Matin)' },
                { id: 'afternoon', label: 'Groupe B (Après-midi)' }
              ].map((g) => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGroup(g.id)}
                  className={cn(
                    "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest",
                    selectedGroup === g.id 
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105" 
                      : "text-muted-foreground hover:text-white hover:bg-white/5"
                  )}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="glass-card rounded-[2.5rem] overflow-hidden border border-white/5 relative">
          <div className="p-10 border-b border-white/5 bg-white/[0.02]">
            <div className="flex flex-wrap items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-6">
                <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
                  <Users className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight uppercase">{selectedGroup === 'morning' ? 'Groupe A (Matin)' : 'Groupe B (Après-midi)'}</h2>
                  <p className="text-sm text-muted-foreground font-medium italic">Séance du {format(date || new Date(), 'dd MMMM yyyy')}</p>
                </div>
              </div>

               <div className="flex items-center gap-4">
                 <div className="relative w-64">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                   <input 
                     type="text"
                     placeholder="Filtrer les élèves..."
                     className="input-field py-2.5 pl-11"
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                   />
                 </div>
                 <button 
                   onClick={markAllPresent}
                   className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all"
                 >
                   <CheckCircle2 className="w-4 h-4" /> Tout présent
                 </button>
               </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-10 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Élève</th>
                  <th className="px-10 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">Status de Présence</th>
                  <th className="px-10 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Heure d'arrivée</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={3} className="px-10 py-6"><div className="h-10 bg-white/5 rounded-xl w-full" /></td>
                    </tr>
                  ))
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-32 text-center text-muted-foreground">
                       <Users className="w-16 h-16 mx-auto mb-4 opacity-10" />
                       <p className="font-black uppercase tracking-widest italic">Aucun élève trouvé dans ce groupe</p>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => {
                    const status = attendance[student.id]?.status;
                    const arrival = attendance[student.id]?.arrival_time;

                    return (
                      <tr key={student.id} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="px-10 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-transparent flex items-center justify-center text-primary font-black text-lg border border-primary/10 group-hover:scale-110 transition-transform">
                              {student.first_name[0]}
                            </div>
                            <div>
                              <p className="text-sm font-black text-white uppercase">{student.last_name} {student.first_name}</p>
                              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">ID: {student.id.substring(0, 8)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-6">
                           <div className="flex justify-center gap-3">
                              <button
                                onClick={() => updateStatus(student.id, 'present')}
                                className={cn(
                                  "px-6 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all tracking-widest border flex items-center gap-2",
                                  status === 'present' 
                                    ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20" 
                                    : "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10"
                                )}
                              >
                                <CheckCircle2 className="w-4 h-4" /> {t.present}
                              </button>
                              <button
                                onClick={() => updateStatus(student.id, 'absent')}
                                className={cn(
                                  "px-6 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all tracking-widest border flex items-center gap-2",
                                  status === 'absent' 
                                    ? "bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20" 
                                    : "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10"
                                )}
                              >
                                <XCircle className="w-4 h-4" /> {t.absent}
                              </button>
                              <button
                                onClick={() => updateStatus(student.id, 'late')}
                                className={cn(
                                  "px-6 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all tracking-widest border flex items-center gap-2",
                                  status === 'late' 
                                    ? "bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20" 
                                    : "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10"
                                )}
                              >
                                <Clock className="w-4 h-4" /> {t.late}
                              </button>
                           </div>
                        </td>
                        <td className="px-10 py-6 text-right">
                           {arrival ? (
                             <span className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-lg text-[10px] font-black">
                               <Clock className="w-3 h-3" /> {arrival}
                             </span>
                           ) : (
                             <span className="text-[10px] text-muted-foreground font-medium">---</span>
                           )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showScanner && (
        <QRScanner onScan={handleQRScan} onClose={() => setShowScanner(false)} />
      )}
    </DashboardLayout>
  );
}

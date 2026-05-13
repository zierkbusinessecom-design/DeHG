'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useTranslation } from '@/context/TranslationContext';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Save, 
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
    const fetchStudents = async () => {
      setLoading(true);
      // Récupération des élèves filtrés par le groupe
      // Note: On suppose que la table students a une colonne group_id ou session
      const { data } = await supabase
        .from('students')
        .select('*')
        .eq('status', 'active');
      
      if (data) {
        // Filtrage local en fonction du groupe (matin/après-midi)
        const groupFiltered = data.filter(s => s.group_id === selectedGroup);

        setStudents(groupFiltered);
        const initialAttendance: Record<string, any> = {};
        groupFiltered.forEach(s => {
          initialAttendance[s.id] = { status: 'present' };
        });
        setAttendance(initialAttendance);
      }
      setLoading(false);
    };

    fetchStudents();
  }, [selectedGroup]); // Se rafraîchit quand on change de groupe

  const updateStatus = (studentId: string, status: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status, arrival_time: status === 'late' ? format(new Date(), 'HH:mm') : undefined }
    }));
  };

  const markAllPresent = () => {
    const allPresent: Record<string, any> = {};
    students.forEach(s => {
      allPresent[s.id] = { status: 'present' };
    });
    setAttendance(allPresent);
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
        session_type: selectedGroup
      }));

      // On utilise upsert pour écraser si on ré-enregistre le même jour
      const { error } = await supabase
        .from('attendances')
        .upsert(attendanceData, { onConflict: 'student_id, date, session_type' });

      if (error) throw error;
      alert("Présences enregistrées avec succès !");
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
            <button 
              onClick={() => setShowScanner(true)}
              className="flex items-center gap-3 bg-white/5 hover:bg-white/10 text-white px-8 py-3.5 rounded-2xl font-black text-sm transition-all border border-white/10 shadow-2xl"
            >
              <QrCode className="w-5 h-5 text-primary" />
              {t.scan_qr}
            </button>
            <ProDatePicker selected={date} onChange={setDate} className="w-56" />
            <ProSelect value={selectedGroup} onChange={setSelectedGroup} options={groups} className="w-72" />
          </div>
        </div>

        <div className="glass-card rounded-[2.5rem] p-10 border border-white/5 relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-6 mb-12 relative z-10">
            <div className="flex items-center gap-6">
              <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 shadow-xl">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight uppercase">{t.groups} - {selectedGroup === 'morning' ? 'Groupe A' : 'Groupe B'}</h2>
                <p className="text-sm text-muted-foreground font-medium italic">Enregistrement pour la séance du {format(date || new Date(), 'dd MMMM yyyy')}</p>
              </div>
            </div>

             <div className="flex items-center gap-4">
               <div className="relative w-64">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                 <input 
                   type="text"
                   placeholder="Filtrer..."
                   className="input-field py-2.5 pl-11"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
               </div>
               <button 
                 onClick={markAllPresent}
                 className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all"
               >
                 <CheckCircle2 className="w-4 h-4" /> Tout le monde présent
               </button>
               <button 
                 onClick={handleSave}
                 disabled={saving || students.length === 0}
                 className="btn-primary px-10"
               >
                 <Save className="w-5 h-5" />
                 {saving ? '...' : t.save}
               </button>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 relative z-10">
            {loading ? (
              [...Array(8)].map((_, i) => <div key={i} className="h-44 bg-white/5 rounded-[2rem] animate-pulse border border-white/5" />)
            ) : filteredStudents.length === 0 ? (
              <div className="col-span-full py-32 text-center text-muted-foreground bg-white/2 rounded-[2rem] border border-dashed border-white/10">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-10" />
                <p className="font-black uppercase tracking-widest italic">Aucun élève à afficher</p>
              </div>
            ) : (
              filteredStudents.map((student) => {
                const status = attendance[student.id]?.status;
                const arrival = attendance[student.id]?.arrival_time;

                return (
                  <div key={student.id} className="glass-card p-6 rounded-[2.25rem] border border-white/5 hover:border-primary/40 transition-all duration-500 group relative overflow-hidden">
                    {status === 'late' && (
                      <div className="absolute top-0 right-0 p-3">
                        <AlertCircle className="w-5 h-5 text-orange-500 animate-pulse" />
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-transparent flex items-center justify-center text-primary font-black text-xl border border-primary/10 group-hover:scale-110 transition-transform duration-500">
                        {student.first_name[0]}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-black text-white uppercase truncate">{student.last_name}</p>
                        <p className="text-[10px] text-muted-foreground font-bold truncate uppercase tracking-widest">{student.first_name}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => updateStatus(student.id, 'present')}
                        className={cn(
                          "flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl text-[9px] font-black uppercase transition-all tracking-widest border",
                          status === 'present' 
                            ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" 
                            : "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10"
                        )}
                      >
                        <CheckCircle2 className="w-4 h-4" /> {t.present}
                      </button>
                      <button
                        onClick={() => updateStatus(student.id, 'absent')}
                        className={cn(
                          "flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl text-[9px] font-black uppercase transition-all tracking-widest border",
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
                          "flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl text-[9px] font-black uppercase transition-all tracking-widest border",
                          status === 'late' 
                            ? "bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20" 
                            : "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10"
                        )}
                      >
                        <div className="relative">
                          <Clock className="w-4 h-4" />
                          {arrival && <span className="absolute -top-3 -right-3 text-[7px] font-black text-orange-400">{arrival}</span>}
                        </div>
                        {t.late}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {showScanner && (
        <QRScanner onScan={handleQRScan} onClose={() => setShowScanner(false)} />
      )}
    </DashboardLayout>
  );
}

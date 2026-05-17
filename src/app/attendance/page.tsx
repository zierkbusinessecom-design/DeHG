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
import { format } from 'date-fns';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const supabase = createClient();

  const groups = [
    { value: 'morning', label: t.group_a, subtext: '09h00 → 12h00' },
    { value: 'afternoon', label: t.group_b, subtext: '12h00 → 15h00' }
  ];

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 12 && hour < 17) setSelectedGroup('afternoon');
    else setSelectedGroup('morning');
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!date) return;
      setLoading(true);
      
      const { data: studentsData } = await supabase
        .from('students')
        .select('*')
        .eq('status', 'active')
        .eq('group_id', selectedGroup);
      
      if (studentsData) {
        setStudents(studentsData);
        
        const { data: existingAttendance } = await supabase
          .from('attendances')
          .select('*')
          .eq('date', format(date, 'yyyy-MM-dd'))
          .eq('session', selectedGroup);

        const attendanceMap: Record<string, any> = {};
        
        studentsData.forEach(s => {
          attendanceMap[s.id] = { status: 'present' };
        });

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
  }, [selectedGroup, date, supabase]);

  const updateStatus = async (studentId: string, status: string) => {
    const arrivalTime = status === 'late' ? format(new Date(), 'HH:mm:ss') : null;
    
    setAttendance(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status, arrival_time: status === 'late' ? format(new Date(), 'HH:mm') : undefined }
    }));

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
    updateStatus(scannedId, 'present');
    setShowScanner(false);
  };

  const filteredStudents = students.filter(student => {
    const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  return (
    <DashboardLayout>
      <div className="page-transition space-y-10">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white uppercase">{t.attendance}</h1>
            <p className="text-sm text-muted-foreground font-medium italic mt-1">{t.attendance_sub}</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button 
              onClick={() => setShowScanner(true)}
              className="btn-secondary px-6 flex items-center gap-2 hover:border-primary/40 hover:text-primary transition-all"
            >
              <QrCode className="w-5 h-5 text-primary" />
              <span>{t.scan_qr}</span>
            </button>

            <div className="w-64">
              <ProDatePicker 
                selected={date}
                onChange={(d) => setDate(d)}
                placeholder={t.select_date}
              />
            </div>

            <div className="w-64">
              <ProSelect 
                options={groups}
                value={selectedGroup}
                onChange={(v) => setSelectedGroup(v)}
                placeholder={t.select_group}
              />
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
                   className="flex items-center gap-2 px-6 py-2.5 bg-primary/10 text-primary border border-primary/20 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-all"
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

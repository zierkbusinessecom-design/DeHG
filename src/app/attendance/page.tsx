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
  AlertCircle,
  MessageSquare,
  Send,
  Phone,
  X
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

  // Modal WhatsApp Bilan Hebdo
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [weekendSummary, setWeekendSummary] = useState<any[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(false);

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

  // Récupération du Bilan du Week-end (Samedi & Dimanche)
  const fetchWeekendSummary = async () => {
    setLoadingSummary(true);
    setShowWhatsAppModal(true);
    
    const targetDate = date || new Date();
    const dayOfWeek = targetDate.getDay(); // 0 = Dimanche, 6 = Samedi
    const diffToSat = dayOfWeek === 0 ? -1 : 6 - dayOfWeek;
    const diffToSun = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;

    const satDate = new Date(targetDate);
    satDate.setDate(targetDate.getDate() + diffToSat);
    const satStr = format(satDate, 'yyyy-MM-dd');

    const sunDate = new Date(targetDate);
    sunDate.setDate(targetDate.getDate() + diffToSun);
    const sunStr = format(sunDate, 'yyyy-MM-dd');

    const { data: attData } = await supabase
      .from('attendances')
      .select('*')
      .in('date', [satStr, sunStr])
      .eq('session', selectedGroup);

    const parentIds = students.map(s => s.parent_id).filter(Boolean);
    let parentsMap: Record<string, string> = {};
    if (parentIds.length > 0) {
      const { data: pData } = await supabase.from('parents').select('id, phone').in('id', parentIds);
      if (pData) {
        pData.forEach(p => { parentsMap[p.id] = p.phone; });
      }
    }

    const summaryList = students.map(s => {
      const satRec = attData?.find(a => a.student_id === s.id && a.date === satStr);
      const sunRec = attData?.find(a => a.student_id === s.id && a.date === sunStr);
      return {
        student: s,
        parentPhone: parentsMap[s.parent_id] || '',
        satDate: format(satDate, 'dd/MM'),
        sunDate: format(sunDate, 'dd/MM'),
        satStatus: satRec?.status || 'non pointé',
        satArrival: satRec?.arrival_time,
        sunStatus: sunRec?.status || 'non pointé',
        sunArrival: sunRec?.arrival_time,
      };
    });

    setWeekendSummary(summaryList);
    setLoadingSummary(false);
  };

  const sendWhatsApp = (summary: any) => {
    if (!summary.parentPhone) {
      alert("Aucun numéro de téléphone pour le parent de cet élève.");
      return;
    }

    const satText = summary.satStatus === 'present' ? 'Présent à l\'heure ✅' :
                    summary.satStatus === 'late' ? `En retard ⏰ (${summary.satArrival ? summary.satArrival.substring(0,5) : ''})` :
                    summary.satStatus === 'absent' ? 'Absent ❌' : 'Non pointé ➖';

    const sunText = summary.sunStatus === 'present' ? 'Présent à l\'heure ✅' :
                    summary.sunStatus === 'late' ? `En retard ⏰ (${summary.sunArrival ? summary.sunArrival.substring(0,5) : ''})` :
                    summary.sunStatus === 'absent' ? 'Absent ❌' : 'Non pointé ➖';

    const message = `*Institut DeHG — Bilan du week-end*\n\n` +
      `Salam Alaykum, voici le récapitulatif d'assiduité de *${summary.student.first_name} ${summary.student.last_name}* pour ce week-end :\n\n` +
      `• Samedi (${summary.satDate}) : ${satText}\n` +
      `• Dimanche (${summary.sunDate}) : ${sunText}\n\n` +
      `Qu'Allah vous préserve et accorde la réussite à nos élèves !`;

    let phone = summary.parentPhone.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = '32' + phone.substring(1);
    if (!phone.startsWith('32') && phone.length <= 10) phone = '32' + phone;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
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
                 
                 {/* Bouton Bilan Hebdo WhatsApp */}
                 <button 
                   onClick={fetchWeekendSummary}
                   className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-lg shadow-emerald-500/10"
                 >
                   <MessageSquare className="w-4 h-4" /> Bilan WhatsApp (Dimanche)
                 </button>

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

      {/* ===== MODAL WHATSAPP BILAN WEEK-END ===== */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="glass-card max-w-3xl w-full max-h-[85vh] rounded-[2.5rem] border border-white/10 flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-8 border-b border-white/10 bg-emerald-500/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/30">
                  <MessageSquare className="w-7 h-7 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Bilan WhatsApp du Week-end</h3>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">
                    Envoi individuel aux parents — {selectedGroup === 'morning' ? 'Groupe A' : 'Groupe B'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowWhatsAppModal(false)}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-all border border-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content / List */}
            <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
              {loadingSummary ? (
                <div className="py-20 text-center space-y-4">
                  <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-black uppercase text-muted-foreground tracking-widest">Analyse des présences du week-end...</p>
                </div>
              ) : weekendSummary.length === 0 ? (
                <div className="py-20 text-center text-muted-foreground font-bold italic">Aucun élève trouvé.</div>
              ) : (
                weekendSummary.map((summary, idx) => (
                  <div key={idx} className="p-5 bg-white/[0.03] hover:bg-white/[0.05] border border-white/5 rounded-3xl flex items-center justify-between transition-colors gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-base flex items-center justify-center uppercase">
                        {summary.student.first_name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-black text-white uppercase">{summary.student.last_name} {summary.student.first_name}</p>
                        <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-2 mt-1">
                          <Phone className="w-3 h-3 text-emerald-400" /> {summary.parentPhone || 'Numéro manquant'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right border-r border-white/10 pr-6">
                        <div className="text-xs font-bold flex items-center gap-3">
                          <span className="text-muted-foreground uppercase text-[9px] tracking-widest">Samedi :</span>
                          <span className={cn(
                            summary.satStatus === 'present' && "text-emerald-400",
                            summary.satStatus === 'late' && "text-orange-400",
                            summary.satStatus === 'absent' && "text-red-400",
                            summary.satStatus === 'non pointé' && "text-muted-foreground"
                          )}>
                            {summary.satStatus === 'present' ? 'Présent' : summary.satStatus === 'late' ? 'En Retard' : summary.satStatus === 'absent' ? 'Absent' : 'Non pointé'}
                          </span>
                        </div>
                        <div className="text-xs font-bold flex items-center gap-3 mt-1">
                          <span className="text-muted-foreground uppercase text-[9px] tracking-widest">Dimanche :</span>
                          <span className={cn(
                            summary.sunStatus === 'present' && "text-emerald-400",
                            summary.sunStatus === 'late' && "text-orange-400",
                            summary.sunStatus === 'absent' && "text-red-400",
                            summary.sunStatus === 'non pointé' && "text-muted-foreground"
                          )}>
                            {summary.sunStatus === 'present' ? 'Présent' : summary.sunStatus === 'late' ? 'En Retard' : summary.sunStatus === 'absent' ? 'Absent' : 'Non pointé'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => sendWhatsApp(summary)}
                        disabled={!summary.parentPhone}
                        className={cn(
                          "px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-md",
                          summary.parentPhone 
                            ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20 cursor-pointer" 
                            : "bg-white/5 text-white/20 border border-white/5 cursor-not-allowed"
                        )}
                      >
                        <Send className="w-3.5 h-3.5" /> Envoyer Bilan
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

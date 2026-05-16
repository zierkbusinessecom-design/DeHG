'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase-client';
import { format, isAfter, setHours, setMinutes } from 'date-fns';
import { QrCode, AlertTriangle, ArrowLeft, CheckCircle2, Clock, XCircle, ShieldAlert, Zap, Users, LogOut, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function KioskPresencePage() {
  const [scanResult, setScanResult] = useState<{
    status: 'success' | 'error' | 'warning' | 'idle' | 'already' | 'hors' | 'early' | 'departure';
    message: string;
    studentName?: string;
  }>({ status: 'idle', message: 'Scanne ton badge' });

  const [isProcessing, setIsProcessing] = useState(false);
  const [mode, setMode] = useState<'arrival' | 'departure'>('arrival');
  const [arrivalCount, setArrivalCount] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const router = useRouter();
  const supabase = createClient();
  
  // Sons différents par statut
  const audioSuccess = useRef<HTMLAudioElement | null>(null);
  const audioEarly = useRef<HTMLAudioElement | null>(null);
  const audioLate = useRef<HTMLAudioElement | null>(null);
  const audioError = useRef<HTMLAudioElement | null>(null);
  const audioDeparture = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioSuccess.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    audioEarly.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audioLate.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    audioError.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3');
    audioDeparture.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2867/2867-preview.mp3');
  }, []);

  const playSound = (type: 'success' | 'early' | 'late' | 'error' | 'departure') => {
    const map = { success: audioSuccess, early: audioEarly, late: audioLate, error: audioError, departure: audioDeparture };
    map[type]?.current?.play().catch(() => {});
  };

  // Compteur en temps réel
  const fetchCounter = useCallback(async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const currentSession = new Date().getHours() < 12 ? 'morning' : 'afternoon';
    
    const { count: arrived } = await supabase
      .from('attendances')
      .select('*', { count: 'exact', head: true })
      .eq('date', today)
      .eq('session', currentSession)
      .in('status', ['present', 'late']);
    
    const { count: total } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .eq('group_id', currentSession);
    
    setArrivalCount(arrived || 0);
    setTotalStudents(total || 0);
  }, [supabase]);

  useEffect(() => {
    fetchCounter();
    const interval = setInterval(fetchCounter, 15000); // Refresh every 15s
    return () => clearInterval(interval);
  }, [fetchCounter]);

  const handleScan = useCallback(async (scannedId: string) => {
    if (isProcessing || scanResult.status !== 'idle') return;
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(scannedId)) return; 

    setIsProcessing(true);

    try {
      const today = format(new Date(), 'yyyy-MM-dd');

      // MODE DÉPART
      if (mode === 'departure') {
        const { data: student } = await supabase.from('students').select('*').eq('id', scannedId).single();
        if (!student) {
          setScanResult({ status: 'error', message: 'Badge inconnu' });
          playSound('error');
          setTimeout(() => setScanResult({ status: 'idle', message: 'Scanne ton badge' }), 2000);
          return;
        }

        await supabase.from('attendances').update({
          departure_time: format(new Date(), 'HH:mm:ss')
        }).eq('student_id', scannedId).eq('date', today);

        setScanResult({ status: 'departure', message: 'À demain !', studentName: student.first_name });
        playSound('departure');
        setTimeout(() => setScanResult({ status: 'idle', message: 'Scanne ton badge' }), 3500);
        return;
      }

      // MODE ARRIVÉE
      const { data: existing } = await supabase
        .from('attendances')
        .select('id, arrival_time, status')
        .eq('student_id', scannedId)
        .eq('date', today)
        .maybeSingle();

      if (existing && existing.status !== 'absent') {
        setScanResult({ status: 'already', message: 'Déjà pointé !', studentName: '' });
        playSound('error');
        setTimeout(() => setScanResult({ status: 'idle', message: 'Scanne ton badge' }), 3000);
        return;
      }

      const { data: student, error: studentError } = await supabase
        .from('students').select('*').eq('id', scannedId).single();

      if (studentError || !student) {
        setScanResult({ status: 'error', message: 'Badge inconnu' });
        playSound('error');
        setTimeout(() => setScanResult({ status: 'idle', message: 'Scanne ton badge' }), 2000);
        return;
      }

      const currentTime = new Date();
      const currentHour = currentTime.getHours();
      let status: 'present' | 'late' | 'early' = 'present';
      let isException = false;

      const studentSession = student.group_id;
      const kioskSession = currentHour < 12 ? 'morning' : 'afternoon';
      if (studentSession !== kioskSession) isException = true;

      const earlyLimit = studentSession === 'morning' 
        ? setMinutes(setHours(new Date(), 8), 30) : setMinutes(setHours(new Date(), 11), 30);
      const lateLimit = studentSession === 'morning' 
        ? setMinutes(setHours(new Date(), 9), 10) : setMinutes(setHours(new Date(), 12), 10);

      if (!isException) {
        if (currentTime < earlyLimit) status = 'early';
        else if (isAfter(currentTime, lateLimit)) status = 'late';
      }

      await supabase.from('attendances').upsert({
        school_id: student.school_id,
        student_id: student.id,
        date: today,
        session: kioskSession,
        status: status === 'early' ? 'present' : status,
        arrival_time: status === 'late' ? format(currentTime, 'HH:mm:ss') : null,
        is_exception: isException,
        device_info: 'Borne Tablette'
      }, { onConflict: 'student_id,date' });

      // Refresh counter
      fetchCounter();

      if (isException) {
        setScanResult({ status: 'hors', message: 'Hors horaire', studentName: student.first_name });
        playSound('late');
      } else if (status === 'early') {
        setScanResult({ status: 'early', message: 'En avance !', studentName: student.first_name });
        playSound('early');
      } else if (status === 'late') {
        setScanResult({ status: 'warning', message: 'En retard', studentName: student.first_name });
        playSound('late');
      } else {
        setScanResult({ status: 'success', message: 'Bienvenue !', studentName: student.first_name });
        playSound('success');
      }

      setTimeout(() => setScanResult({ status: 'idle', message: 'Scanne ton badge' }), 3500);

    } catch (err) {
      setScanResult({ status: 'error', message: 'Erreur' });
      playSound('error');
      setTimeout(() => setScanResult({ status: 'idle', message: 'Scanne ton badge' }), 3000);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, scanResult.status, supabase, mode, fetchCounter]);

  const isIdle = scanResult.status === 'idle';

  return (
    <div className={cn(
      "fixed inset-0 overflow-hidden select-none font-sans transition-colors duration-500",
      isIdle && "bg-[#050505]",
      scanResult.status === 'success' && "bg-emerald-600",
      scanResult.status === 'early' && "bg-violet-600",
      scanResult.status === 'warning' && "bg-orange-500",
      scanResult.status === 'hors' && "bg-blue-600",
      scanResult.status === 'already' && "bg-red-600",
      scanResult.status === 'error' && "bg-red-700",
      scanResult.status === 'departure' && "bg-sky-600"
    )}>
      
      {/* ===== IDLE VIEW: Scanner ===== */}
      <div className={cn(
        "absolute inset-0 flex flex-col items-center justify-between py-8 px-6 transition-opacity duration-400",
        isIdle ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        {/* HEADER */}
        <div className="w-full flex items-center justify-between z-20">
          <button 
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-5 py-3 rounded-2xl border border-white/10 transition-all font-black text-[10px] uppercase tracking-widest"
          >
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>

          {/* MODE TOGGLE */}
          <button
            onClick={() => setMode(m => m === 'arrival' ? 'departure' : 'arrival')}
            className={cn(
              "flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all font-black text-[10px] uppercase tracking-widest",
              mode === 'arrival' 
                ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30" 
                : "bg-sky-500/20 border-sky-500/30 text-sky-400 hover:bg-sky-500/30"
            )}
          >
            {mode === 'arrival' ? <LogIn className="w-4 h-4" /> : <LogOut className="w-4 h-4" />}
            {mode === 'arrival' ? 'Mode Arrivée' : 'Mode Départ'}
          </button>
          
          <div className="text-right">
            <p className="text-white font-black text-sm uppercase tracking-widest">{format(new Date(), 'HH:mm')}</p>
            <p className="text-white/40 text-[9px] font-black uppercase tracking-widest">{format(new Date(), 'dd MMM yyyy')}</p>
          </div>
        </div>

        {/* SCANNER */}
        <div className="flex-1 flex items-center justify-center w-full">
          <div className="relative">
            <div className={cn(
              "relative w-[380px] h-[380px] bg-black rounded-3xl overflow-hidden border-2 shadow-2xl shadow-black/50",
              mode === 'arrival' ? "border-white/10" : "border-sky-500/30"
            )}>
              <ScannerComponent onScan={handleScan} isActive={isIdle} />
              
              {/* Laser */}
              <div className={cn(
                "absolute left-0 right-0 h-[2px] z-30 pointer-events-none kiosk-laser",
                mode === 'arrival' ? "bg-primary" : "bg-sky-400"
              )}
                style={{ boxShadow: mode === 'arrival' 
                  ? '0 0 12px 2px rgba(16,185,129,0.6), 0 0 40px 4px rgba(16,185,129,0.2)'
                  : '0 0 12px 2px rgba(56,189,248,0.6), 0 0 40px 4px rgba(56,189,248,0.2)' 
                }} 
              />

              {/* Corners */}
              {['top-3 left-3 border-t-[3px] border-l-[3px] rounded-tl-xl',
                'top-3 right-3 border-t-[3px] border-r-[3px] rounded-tr-xl',
                'bottom-3 left-3 border-b-[3px] border-l-[3px] rounded-bl-xl',
                'bottom-3 right-3 border-b-[3px] border-r-[3px] rounded-br-xl'
              ].map((c, i) => (
                <div key={i} className={cn("absolute w-12 h-12 z-20 pointer-events-none", c, mode === 'arrival' ? 'border-primary' : 'border-sky-400')} />
              ))}
            </div>

            {/* Idle Text */}
            <div className="mt-8 text-center flex flex-col items-center gap-3 opacity-40">
              {mode === 'arrival' ? <QrCode className="w-8 h-8 text-primary" /> : <LogOut className="w-8 h-8 text-sky-400" />}
              <p className="text-white font-black text-sm uppercase tracking-[0.3em]">
                {mode === 'arrival' ? 'Scanne ton badge' : 'Badge de sortie'}
              </p>
            </div>
          </div>
        </div>

        {/* FOOTER WITH COUNTER */}
        <div className="w-full flex items-center justify-center gap-6 z-20">
          {/* Counter */}
          <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-3">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-white font-black text-[10px] uppercase tracking-widest">
              <span className="text-primary text-base">{arrivalCount}</span> / {totalStudents} élèves
            </span>
          </div>
          {/* Session */}
          <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-3">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-white font-black text-[10px] uppercase tracking-widest">
              {new Date().getHours() < 12 ? 'Matin — Groupe A' : 'Après-midi — Groupe B'}
            </span>
          </div>
        </div>
      </div>

      {/* ===== FEEDBACK VIEW: Full Screen Color ===== */}
      <div className={cn(
        "absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-400 z-40",
        !isIdle ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        <div className="flex flex-col items-center gap-6 text-center px-8">
          {scanResult.status === 'success' && <CheckCircle2 className="w-28 h-28 text-white drop-shadow-2xl" />}
          {scanResult.status === 'early' && <Zap className="w-28 h-28 text-white drop-shadow-2xl" />}
          {scanResult.status === 'warning' && <Clock className="w-28 h-28 text-white drop-shadow-2xl" />}
          {scanResult.status === 'hors' && <ShieldAlert className="w-28 h-28 text-white drop-shadow-2xl" />}
          {scanResult.status === 'already' && <XCircle className="w-28 h-28 text-white drop-shadow-2xl" />}
          {scanResult.status === 'error' && <AlertTriangle className="w-28 h-28 text-white drop-shadow-2xl" />}
          {scanResult.status === 'departure' && <LogOut className="w-28 h-28 text-white drop-shadow-2xl" />}

          {scanResult.studentName && (
            <h1 className="text-6xl md:text-7xl font-black text-white uppercase tracking-tighter drop-shadow-lg">
              {scanResult.studentName}
            </h1>
          )}

          <p className="text-3xl font-black text-white/90 uppercase tracking-[0.2em]">
            {scanResult.message}
          </p>

          {(scanResult.status === 'success' || scanResult.status === 'early' || scanResult.status === 'warning' || scanResult.status === 'departure') && (
            <p className="text-xl font-black text-white/60 uppercase tracking-widest mt-2">
              {scanResult.status === 'departure' ? 'Départ' : 'Arrivée'} à {format(new Date(), 'HH:mm')}
            </p>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes kiosk-laser-move {
          0% { transform: translateY(0); }
          100% { transform: translateY(376px); }
        }
        .kiosk-laser {
          top: 0;
          animation: kiosk-laser-move 1.8s linear infinite;
        }
        #reader {
          width: 100% !important;
          height: 100% !important;
          border: none !important;
        }
        #reader video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          transform: scaleX(-1) !important;
        }
        #reader img[alt="Info icon"] { display: none !important; }
        #reader__scan_region { min-height: 100% !important; }
        #reader__scan_region > br,
        #reader__dashboard_section,
        #reader__dashboard_section_swaplink,
        #reader__header_message { display: none !important; }
      `}</style>
    </div>
  );
}

function ScannerComponent({ onScan, isActive }: { onScan: (res: string) => void, isActive: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const onScanRef = useRef(onScan);
  const isActiveRef = useRef(isActive);
  const scannerRef = useRef<any>(null);
  const isInitializingRef = useRef(false);
  
  useEffect(() => { onScanRef.current = onScan; isActiveRef.current = isActive; }, [onScan, isActive]);

  useEffect(() => {
    let mounted = true;
    const startScanner = async () => {
      if (scannerRef.current || isInitializingRef.current) return;
      isInitializingRef.current = true;
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (!mounted) return;
        const html5QrCode = new Html5Qrcode("reader", { verbose: false });
        scannerRef.current = html5QrCode;
        await html5QrCode.start(
          { facingMode: "environment" }, { fps: 30 },
          (decodedText: string) => { if (isActiveRef.current) onScanRef.current(decodedText); },
          () => {}
        );
      } catch (err: any) {
        if (mounted) setError("Vérifiez les permissions caméra ou la connexion HTTPS.");
      } finally { if (mounted) isInitializingRef.current = false; }
    };
    startScanner();
    return () => {
      mounted = false;
      const instance = scannerRef.current;
      scannerRef.current = null;
      if (instance && instance.isScanning) instance.stop().then(() => instance.clear()).catch(() => {});
    };
  }, []);

  if (error) return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black p-10 text-center z-10">
      <AlertTriangle className="w-12 h-12 text-red-500 mb-6" />
      <p className="text-white text-xs font-black uppercase leading-relaxed tracking-widest">{error}</p>
      <button onClick={() => window.location.reload()} className="mt-6 text-[10px] text-white/40 underline uppercase font-black">Réessayer</button>
    </div>
  );

  return <div id="reader" className="w-full h-full" />;
}

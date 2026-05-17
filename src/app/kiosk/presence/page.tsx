'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase-client';
import { format, isAfter, setHours, setMinutes } from 'date-fns';
import { QrCode, AlertTriangle, ArrowLeft, CheckCircle2, Clock, XCircle, ShieldAlert, Zap, Users, LogOut, Volume2, VolumeX } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function KioskPresencePage() {
  const [scanResult, setScanResult] = useState<{
    status: 'success' | 'error' | 'warning' | 'idle' | 'already' | 'hors' | 'early' | 'departure';
    message: string;
    studentName?: string;
  }>({ status: 'idle', message: 'Scanne ton badge' });

  const [isProcessing, setIsProcessing] = useState(false);
  const [arrivalCount, setArrivalCount] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const router = useRouter();
  const supabase = createClient();

  // Initialisation Web Audio API (100% fiable, sans fichiers réseau)
  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    setSoundEnabled(true);
  };

  const playSynthesizedSound = useCallback((type: 'success' | 'early' | 'late' | 'error' | 'departure') => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      if (type === 'success') {
        // Accord joyeux ascendant (C5 -> E5 -> G5 -> C6)
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(0, now + idx * 0.08);
          gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.08 + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.35);
        });
      } else if (type === 'early') {
        // Arpège pétillant rapide
        [659.25, 880, 1318.51].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.06);
          gain.gain.setValueAtTime(0, now + idx * 0.06);
          gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.06 + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.06);
          osc.stop(now + idx * 0.06 + 0.3);
        });
      } else if (type === 'late') {
        // Alerte douce descendante
        [440, 329.63].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now + idx * 0.15);
          gain.gain.setValueAtTime(0, now + idx * 0.15);
          gain.gain.linearRampToValueAtTime(0.15, now + idx * 0.15 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.15);
          osc.stop(now + idx * 0.15 + 0.4);
        });
      } else if (type === 'departure') {
        // Carillon descendant apaisant (C6 -> G5 -> E5 -> C5)
        [1046.50, 783.99, 659.25, 523.25].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.1);
          gain.gain.setValueAtTime(0, now + idx * 0.1);
          gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.1 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.1);
          osc.stop(now + idx * 0.1 + 0.4);
        });
      } else if (type === 'error') {
        // Buzzer d'erreur grave
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
      }
    } catch (e) {
      console.error('Erreur audio', e);
    }
  }, []);

  // Compteur en temps réel
  const fetchCounter = useCallback(async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const currentSession = new Date().getHours() < 12 ? 'morning' : 'afternoon';
    
    const { count: arrived } = await supabase
      .from('attendances')
      .select('*', { count: 'exact', head: true })
      .eq('date', today)
      .eq('session', currentSession)
      .in('status', ['present', 'late', 'early']);
    
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

  // LOGIQUE DE SCAN INTELLIGENT (Borne Automatique)
  const handleScan = useCallback(async (scannedId: string) => {
    if (isProcessing || scanResult.status !== 'idle') return;
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(scannedId)) return; 

    setIsProcessing(true);

    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const currentTime = new Date();
      const currentHour = currentTime.getHours();

      // 1. Récupérer l'élève
      const { data: student, error: studentError } = await supabase
        .from('students').select('*').eq('id', scannedId).single();

      if (studentError || !student) {
        setScanResult({ status: 'error', message: 'Badge inconnu' });
        playSynthesizedSound('error');
        setTimeout(() => setScanResult({ status: 'idle', message: 'Scanne ton badge' }), 2000);
        return;
      }

      // 2. Vérifier si un pointage existe déjà aujourd'hui
      const { data: existing } = await supabase
        .from('attendances')
        .select('id, arrival_time, departure_time, status')
        .eq('student_id', scannedId)
        .eq('date', today)
        .maybeSingle();

      const studentSession = student.group_id; // 'morning' (9h-12h) ou 'afternoon' (12h-15h)
      const kioskSession = currentHour < 12 ? 'morning' : 'afternoon';
      const isException = studentSession !== kioskSession;

      // 3. DÉTERMINER ARRIVÉE VS DÉPART AUTOMATIQUEMENT
      if (existing && existing.status !== 'absent') {
        // Un pointage existe déjà pour aujourd'hui
        let isDepartureTime = false;

        if (studentSession === 'morning') {
          // Groupe A : à partir de 11h15 on considère que c'est la sortie
          if (currentHour >= 11) isDepartureTime = true;
        } else {
          // Groupe B : à partir de 14h15 on considère que c'est la sortie
          if (currentHour >= 14) isDepartureTime = true;
        }

        if (isDepartureTime) {
          if (existing.departure_time) {
            setScanResult({ status: 'already', message: 'Départ déjà enregistré !', studentName: student.first_name });
            playSynthesizedSound('error');
          } else {
            // Enregistrer la sortie
            await supabase.from('attendances').update({
              departure_time: format(currentTime, 'HH:mm:ss')
            }).eq('id', existing.id);

            setScanResult({ status: 'departure', message: 'À demain !', studentName: student.first_name });
            playSynthesizedSound('departure');
          }
        } else {
          // Pointage trop rapproché de l'arrivée
          setScanResult({ status: 'already', message: 'Déjà pointé !', studentName: '' });
          playSynthesizedSound('error');
        }

        setTimeout(() => setScanResult({ status: 'idle', message: 'Scanne ton badge' }), 3000);
        return;
      }

      // 4. AUCUN POINTAGE EXISTANT -> ARRIVÉE
      let status: 'present' | 'late' | 'early' = 'present';

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
        playSynthesizedSound('late');
      } else if (status === 'early') {
        setScanResult({ status: 'early', message: 'En avance !', studentName: student.first_name });
        playSynthesizedSound('early');
      } else if (status === 'late') {
        setScanResult({ status: 'warning', message: 'En retard', studentName: student.first_name });
        playSynthesizedSound('late');
      } else {
        setScanResult({ status: 'success', message: 'Bienvenue !', studentName: student.first_name });
        playSynthesizedSound('success');
      }

      setTimeout(() => setScanResult({ status: 'idle', message: 'Scanne ton badge' }), 3500);

    } catch (err) {
      setScanResult({ status: 'error', message: 'Erreur' });
      playSynthesizedSound('error');
      setTimeout(() => setScanResult({ status: 'idle', message: 'Scanne ton badge' }), 3000);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, scanResult.status, supabase, fetchCounter, playSynthesizedSound]);

  const isIdle = scanResult.status === 'idle';

  return (
    <div 
      onClick={initAudio} // Débloque l'audio au premier clic sur l'écran
      className={cn(
        "fixed inset-0 overflow-hidden select-none font-sans transition-colors duration-500",
        isIdle && "bg-[#050505]",
        scanResult.status === 'success' && "bg-emerald-600",
        scanResult.status === 'early' && "bg-violet-600",
        scanResult.status === 'warning' && "bg-orange-500",
        scanResult.status === 'hors' && "bg-blue-600",
        scanResult.status === 'already' && "bg-red-600",
        scanResult.status === 'error' && "bg-red-700",
        scanResult.status === 'departure' && "bg-sky-600"
      )}
    >
      
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


          
          <div className="text-right">
            <p className="text-white font-black text-sm uppercase tracking-widest">{format(new Date(), 'HH:mm')}</p>
            <p className="text-white/40 text-[9px] font-black uppercase tracking-widest">{format(new Date(), 'dd MMM yyyy')}</p>
          </div>
        </div>

        {/* SCANNER */}
        <div className="flex-1 flex items-center justify-center w-full">
          <div className="relative">
            <div className="relative w-[380px] h-[380px] bg-black rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl shadow-black/50">
              <ScannerComponent onScan={handleScan} isActive={isIdle} />
              
              {/* Laser */}
              <div className="absolute left-0 right-0 h-[2px] bg-primary z-30 pointer-events-none kiosk-laser"
                style={{ boxShadow: '0 0 12px 2px rgba(16,185,129,0.6), 0 0 40px 4px rgba(16,185,129,0.2)' }} 
              />

              {/* Corners */}
              {['top-3 left-3 border-t-[3px] border-l-[3px] rounded-tl-xl',
                'top-3 right-3 border-t-[3px] border-r-[3px] rounded-tr-xl',
                'bottom-3 left-3 border-b-[3px] border-l-[3px] rounded-bl-xl',
                'bottom-3 right-3 border-b-[3px] border-r-[3px] rounded-br-xl'
              ].map((c, i) => (
                <div key={i} className={cn("absolute w-12 h-12 z-20 pointer-events-none border-primary", c)} />
              ))}
            </div>

            {/* Idle Text */}
            <div className="mt-8 text-center flex flex-col items-center gap-3 opacity-40">
              <QrCode className="w-8 h-8 text-primary" />
              <p className="text-white font-black text-sm uppercase tracking-[0.3em]">
                Borne Murale — Arrivée & Départ Auto
              </p>
            </div>
          </div>
        </div>

        {/* FOOTER WITH COUNTER */}
        <div className="w-full flex items-center justify-center gap-6 z-20">
          <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-3">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-white font-black text-[10px] uppercase tracking-widest">
              <span className="text-primary text-base">{arrivalCount}</span> / {totalStudents} élèves
            </span>
          </div>
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

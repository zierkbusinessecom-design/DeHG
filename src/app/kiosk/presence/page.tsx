'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase-client';
import { format, isAfter, setHours, setMinutes } from 'date-fns';
import { QrCode, AlertTriangle, ArrowLeft, CheckCircle2, Clock, XCircle, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function KioskPresencePage() {
  const [scanResult, setScanResult] = useState<{
    status: 'success' | 'error' | 'warning' | 'idle' | 'already' | 'hors';
    message: string;
    studentName?: string;
  }>({ status: 'idle', message: 'Scanne ton badge' });

  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  
  const audioSuccess = useRef<HTMLAudioElement | null>(null);
  const audioWarning = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioSuccess.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    audioWarning.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
  }, []);

  const playSound = (type: 'success' | 'warning') => {
    if (type === 'success') audioSuccess.current?.play().catch(() => {});
    if (type === 'warning') audioWarning.current?.play().catch(() => {});
  };

  const handleScan = useCallback(async (scannedId: string) => {
    if (isProcessing || scanResult.status !== 'idle') return;
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(scannedId)) return; 

    setIsProcessing(true);

    try {
      const today = format(new Date(), 'yyyy-MM-dd');

      const { data: existing } = await supabase
        .from('attendances')
        .select('id, arrival_time')
        .eq('student_id', scannedId)
        .eq('date', today)
        .maybeSingle();

      if (existing) {
        setScanResult({ 
          status: 'already', 
          message: 'Déjà pointé !', 
          studentName: '' 
        });
        playSound('warning');
        setTimeout(() => setScanResult({ status: 'idle', message: 'Scanne ton badge' }), 3000);
        return;
      }

      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', scannedId)
        .single();

      if (studentError || !student) {
        setScanResult({ status: 'error', message: 'Badge inconnu' });
        setTimeout(() => setScanResult({ status: 'idle', message: 'Scanne ton badge' }), 2000);
        return;
      }

      const currentTime = new Date();
      const currentHour = currentTime.getHours();
      let status: 'present' | 'late' = 'present';
      let isException = false;

      const studentSession = student.group_id;
      const kioskSession = currentHour < 12 ? 'morning' : 'afternoon';

      if (studentSession !== kioskSession) isException = true;

      const limitTime = studentSession === 'morning' 
        ? setMinutes(setHours(new Date(), 9), 10)
        : setMinutes(setHours(new Date(), 12), 10);
      
      if (isAfter(currentTime, limitTime)) status = 'late';

      const { error: insertError } = await supabase
        .from('attendances')
        .insert([{
          school_id: student.school_id,
          student_id: student.id,
          date: today,
          session: kioskSession,
          status: status,
          arrival_time: format(currentTime, 'HH:mm:ss'),
          is_exception: isException,
          device_info: 'Borne Tablette'
        }]);

      if (insertError) throw insertError;

      if (isException) {
        setScanResult({ 
          status: 'hors', 
          message: 'Hors horaire', 
          studentName: student.first_name 
        });
        playSound('warning');
      } else if (status === 'late') {
        setScanResult({ 
          status: 'warning', 
          message: 'En retard', 
          studentName: student.first_name 
        });
        playSound('warning');
      } else {
        setScanResult({ 
          status: 'success', 
          message: 'Bienvenue !', 
          studentName: student.first_name 
        });
        playSound('success');
      }

      setTimeout(() => setScanResult({ status: 'idle', message: 'Scanne ton badge' }), 3500);

    } catch (err) {
      setScanResult({ status: 'error', message: 'Erreur' });
      setTimeout(() => setScanResult({ status: 'idle', message: 'Scanne ton badge' }), 3000);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, scanResult.status, supabase]);

  const isIdle = scanResult.status === 'idle';

  return (
    <div className={cn(
      "fixed inset-0 overflow-hidden select-none font-sans transition-colors duration-500",
      isIdle && "bg-[#050505]",
      scanResult.status === 'success' && "bg-emerald-600",
      scanResult.status === 'warning' && "bg-orange-500",
      scanResult.status === 'hors' && "bg-blue-600",
      scanResult.status === 'already' && "bg-red-600",
      scanResult.status === 'error' && "bg-red-700"
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
              <div className="absolute top-3 left-3 w-12 h-12 border-t-[3px] border-l-[3px] border-primary rounded-tl-xl z-20 pointer-events-none" />
              <div className="absolute top-3 right-3 w-12 h-12 border-t-[3px] border-r-[3px] border-primary rounded-tr-xl z-20 pointer-events-none" />
              <div className="absolute bottom-3 left-3 w-12 h-12 border-b-[3px] border-l-[3px] border-primary rounded-bl-xl z-20 pointer-events-none" />
              <div className="absolute bottom-3 right-3 w-12 h-12 border-b-[3px] border-r-[3px] border-primary rounded-br-xl z-20 pointer-events-none" />
            </div>

            {/* Idle Text */}
            <div className="mt-8 text-center flex flex-col items-center gap-3 opacity-40">
              <QrCode className="w-8 h-8 text-primary" />
              <p className="text-white font-black text-sm uppercase tracking-[0.3em]">Scanne ton badge</p>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="w-full flex justify-center z-20">
          <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-3">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-white font-black text-[10px] uppercase tracking-widest">
              Session {new Date().getHours() < 12 ? 'Matin — Groupe A' : 'Après-midi — Groupe B'}
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
          {/* Icon */}
          {scanResult.status === 'success' && <CheckCircle2 className="w-28 h-28 text-white drop-shadow-2xl" />}
          {scanResult.status === 'warning' && <Clock className="w-28 h-28 text-white drop-shadow-2xl" />}
          {scanResult.status === 'hors' && <ShieldAlert className="w-28 h-28 text-white drop-shadow-2xl" />}
          {scanResult.status === 'already' && <XCircle className="w-28 h-28 text-white drop-shadow-2xl" />}
          {scanResult.status === 'error' && <AlertTriangle className="w-28 h-28 text-white drop-shadow-2xl" />}

          {/* Student Name */}
          {scanResult.studentName && (
            <h1 className="text-6xl md:text-7xl font-black text-white uppercase tracking-tighter drop-shadow-lg">
              {scanResult.studentName}
            </h1>
          )}

          {/* Message */}
          <p className="text-3xl font-black text-white/90 uppercase tracking-[0.2em]">
            {scanResult.message}
          </p>
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
        #reader img[alt="Info icon"] {
          display: none !important;
        }
        #reader__scan_region {
          min-height: 100% !important;
        }
        #reader__scan_region > br,
        #reader__dashboard_section,
        #reader__dashboard_section_swaplink,
        #reader__header_message {
          display: none !important;
        }
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
  
  useEffect(() => {
    onScanRef.current = onScan;
    isActiveRef.current = isActive;
  }, [onScan, isActive]);

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
          { facingMode: "environment" }, 
          { fps: 30 },
          (decodedText: string) => {
            if (isActiveRef.current) {
              onScanRef.current(decodedText);
            }
          },
          () => {}
        );
      } catch (err: any) {
        console.error("Camera init error:", err);
        if (mounted) setError("Vérifiez les permissions caméra ou la connexion HTTPS.");
      } finally {
        if (mounted) isInitializingRef.current = false;
      }
    };

    startScanner();

    return () => {
      mounted = false;
      const instance = scannerRef.current;
      scannerRef.current = null;
      if (instance && instance.isScanning) {
        instance.stop().then(() => instance.clear()).catch(() => {});
      }
    };
  }, []);

  if (error) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black p-10 text-center z-10">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-6" />
        <p className="text-white text-xs font-black uppercase leading-relaxed tracking-widest">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-6 text-[10px] text-white/40 underline uppercase font-black">Réessayer</button>
      </div>
    );
  }

  return <div id="reader" className="w-full h-full" />;
}

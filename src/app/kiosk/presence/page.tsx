'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase-client';
import { format, isAfter, setHours, setMinutes } from 'date-fns';
import { QrCode, AlertTriangle, ArrowLeft, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function KioskPresencePage() {
  const [scanResult, setScanResult] = useState<{
    status: 'success' | 'error' | 'warning' | 'idle' | 'already';
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
          message: 'Déjà enregistré', 
          studentName: 'Passage à ' + existing.arrival_time.substring(0,5) 
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
        setScanResult({ status: 'error', message: 'Code Inconnu' });
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

      if (isException || status === 'late') {
        setScanResult({ 
          status: 'warning', 
          message: isException ? 'Hors Horaire' : 'Retard', 
          studentName: student.first_name 
        });
        playSound('warning');
      } else {
        setScanResult({ 
          status: 'success', 
          message: 'Bienvenue', 
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

  const feedbackColor = {
    success: 'emerald',
    warning: 'orange',
    already: 'blue',
    error: 'red',
    idle: ''
  }[scanResult.status];

  return (
    <div className="fixed inset-0 bg-[#050505] overflow-hidden select-none font-sans flex flex-col items-center justify-between py-8 px-6">
      
      {/* HEADER */}
      <div className="w-full max-w-lg flex items-center justify-between z-20">
        <button 
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-5 py-3 rounded-2xl border border-white/10 transition-all font-black text-[10px] uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>

        <div className="flex flex-col items-center">
          <div className="w-12 h-12 bg-white rounded-xl p-1.5 shadow-2xl">
            <img src="/DHG1.jpeg" alt="Logo" className="w-full h-full object-contain" />
          </div>
        </div>
        
        <div className="text-right">
           <p className="text-white font-black text-sm uppercase tracking-widest">{format(new Date(), 'HH:mm')}</p>
           <p className="text-white/40 text-[9px] font-black uppercase tracking-widest">{format(new Date(), 'dd MMM yyyy')}</p>
        </div>
      </div>

      {/* SCANNER AREA */}
      <div className="flex-1 flex items-center justify-center w-full">
        <div className="relative">
          {/* Scanner Box */}
          <div className="relative w-[380px] h-[380px] bg-black rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl shadow-black/50">
            <ScannerComponent onScan={handleScan} isActive={scanResult.status === 'idle'} />
            
            {/* Laser Line - uses transform for smooth animation */}
            <div className="absolute left-0 right-0 h-[2px] bg-primary z-30 pointer-events-none kiosk-laser" 
              style={{ boxShadow: '0 0 12px 2px rgba(16,185,129,0.6), 0 0 40px 4px rgba(16,185,129,0.2)' }} 
            />

            {/* Corner Markers */}
            <div className="absolute top-3 left-3 w-12 h-12 border-t-[3px] border-l-[3px] border-primary rounded-tl-xl z-20 pointer-events-none" />
            <div className="absolute top-3 right-3 w-12 h-12 border-t-[3px] border-r-[3px] border-primary rounded-tr-xl z-20 pointer-events-none" />
            <div className="absolute bottom-3 left-3 w-12 h-12 border-b-[3px] border-l-[3px] border-primary rounded-bl-xl z-20 pointer-events-none" />
            <div className="absolute bottom-3 right-3 w-12 h-12 border-b-[3px] border-r-[3px] border-primary rounded-br-xl z-20 pointer-events-none" />
          </div>

          {/* Status Text Below Scanner */}
          <div className="mt-8 text-center">
            {scanResult.status === 'idle' ? (
              <div className="flex flex-col items-center gap-3 opacity-50">
                <QrCode className="w-8 h-8 text-primary" />
                <p className="text-white font-black text-sm uppercase tracking-[0.3em]">Scanne ton badge</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                {scanResult.status === 'success' && <CheckCircle2 className="w-16 h-16 text-emerald-400 drop-shadow-lg" />}
                {scanResult.status === 'warning' && <AlertTriangle className="w-16 h-16 text-orange-400 drop-shadow-lg" />}
                {scanResult.status === 'already' && <Clock className="w-16 h-16 text-blue-400 drop-shadow-lg" />}
                {scanResult.status === 'error' && <XCircle className="w-16 h-16 text-red-400 drop-shadow-lg" />}
                
                {scanResult.studentName && (
                  <h2 className="text-4xl font-black text-white uppercase tracking-tighter">
                    {scanResult.studentName}
                  </h2>
                )}
                <div className={cn(
                  "px-6 py-2 rounded-2xl border",
                  scanResult.status === 'success' && "bg-emerald-500/20 border-emerald-500/30",
                  scanResult.status === 'warning' && "bg-orange-500/20 border-orange-500/30",
                  scanResult.status === 'already' && "bg-blue-500/20 border-blue-500/30",
                  scanResult.status === 'error' && "bg-red-500/20 border-red-500/30"
                )}>
                  <span className="text-white font-black uppercase tracking-[0.15em] text-base">
                    {scanResult.message}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="w-full max-w-lg flex justify-center z-20">
        <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-3">
          <Clock className="w-4 h-4 text-primary" />
          <span className="text-white font-black text-[10px] uppercase tracking-widest">
            Session {new Date().getHours() < 12 ? 'Matin — Groupe A' : 'Après-midi — Groupe B'}
          </span>
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
        /* Override html5-qrcode default styles */
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
      // Strict guard against double initialization (React Strict Mode fix)
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

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
  
  // Audio Refs
  const audioSuccess = useRef<HTMLAudioElement | null>(null);
  const audioWarning = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Sons de confirmation
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

      // 1. Vérifier si une présence existe déjà
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

      // 2. Récupérer l'élève
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

      // 3. Insertion
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

      // 4. Feedback
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

  return (
    <div className="fixed inset-0 bg-black overflow-hidden select-none font-sans">
      {/* FULLSCREEN CAMERA BACKDROP */}
      <div className="absolute inset-0 z-0">
        <ScannerComponent onScan={handleScan} isActive={scanResult.status === 'idle'} />
      </div>

      {/* OVERLAY GLASS & HUD (Only visible when idle) */}
      <div className={cn(
        "absolute inset-0 z-10 transition-opacity duration-500 flex flex-col justify-between",
        scanResult.status === 'idle' ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        {/* HEADER */}
        <div className="w-full px-8 py-8 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
          <button 
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-5 py-3 rounded-2xl border border-white/10 transition-all font-black text-xs uppercase tracking-widest"
          >
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>

          <div className="flex flex-col items-center">
            <div className="w-14 h-14 bg-white rounded-2xl p-2 shadow-2xl mb-2">
              <img src="/DHG1.jpeg" alt="Logo" className="w-full h-full object-contain" />
            </div>
          </div>
          
          <div className="w-[120px] text-right">
             <p className="text-white font-black text-sm uppercase tracking-widest">{format(new Date(), 'HH:mm')}</p>
             <p className="text-white/50 text-[10px] font-black uppercase tracking-widest">{format(new Date(), 'dd MMM yyyy')}</p>
          </div>
        </div>

        {/* HUD SCANNER TARGET */}
        <div className="flex-1 flex items-center justify-center relative">
          {/* Sombre tout autour sauf au centre */}
          <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 0 100vmax rgba(0,0,0,0.6)' }} />
          
          <div className="relative w-[350px] h-[350px] md:w-[450px] md:h-[450px] pointer-events-none z-20 flex items-center justify-center">
            {/* CORNERS */}
            <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-primary rounded-tl-3xl shadow-[0_0_20px_rgba(16,185,129,0.3)]" />
            <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-primary rounded-tr-3xl shadow-[0_0_20px_rgba(16,185,129,0.3)]" />
            <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-primary rounded-bl-3xl shadow-[0_0_20px_rgba(16,185,129,0.3)]" />
            <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-primary rounded-br-3xl shadow-[0_0_20px_rgba(16,185,129,0.3)]" />
            
            {/* LASER */}
            <div className="absolute top-0 left-4 right-4 h-[2px] bg-primary shadow-[0_0_20px_#10b981] animate-[hud-scan_1.5s_linear_infinite]" />
            
            {/* CENTER TEXT */}
            <div className="mt-48 flex flex-col items-center gap-4 opacity-40">
              <QrCode className="w-12 h-12 text-white" />
              <p className="text-white font-black text-sm uppercase tracking-[0.3em]">Scanner ici</p>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="w-full px-8 py-8 bg-gradient-to-t from-black/80 to-transparent flex justify-center">
           <div className="bg-black/40 backdrop-blur-xl border border-white/10 px-8 py-4 rounded-3xl flex items-center gap-4">
             <Clock className="w-5 h-5 text-primary" />
             <span className="text-white font-black text-xs uppercase tracking-widest">
               Session {new Date().getHours() < 12 ? 'Matin' : 'Après-midi'}
             </span>
           </div>
        </div>
      </div>

      {/* FEEDBACK MODALS (Glassmorphism) */}
      <div className={cn(
        "absolute inset-0 z-50 flex items-center justify-center transition-all duration-500 backdrop-blur-2xl",
        scanResult.status !== 'idle' ? "opacity-100" : "opacity-0 pointer-events-none",
        scanResult.status === 'success' && "bg-emerald-900/40",
        scanResult.status === 'warning' && "bg-orange-900/40",
        scanResult.status === 'already' && "bg-blue-900/40",
        scanResult.status === 'error' && "bg-red-900/40"
      )}>
        {scanResult.status !== 'idle' && (
          <div className={cn(
            "p-12 rounded-[3rem] border border-white/20 shadow-2xl flex flex-col items-center transform transition-all duration-500",
            scanResult.status !== 'idle' ? "scale-100 translate-y-0" : "scale-90 translate-y-10",
            scanResult.status === 'success' && "bg-emerald-500/20 shadow-emerald-500/20",
            scanResult.status === 'warning' && "bg-orange-500/20 shadow-orange-500/20",
            scanResult.status === 'already' && "bg-blue-500/20 shadow-blue-500/20",
            scanResult.status === 'error' && "bg-red-500/20 shadow-red-500/20"
          )}>
             {scanResult.status === 'success' && <CheckCircle2 className="w-24 h-24 text-emerald-400 mb-6 drop-shadow-lg" />}
             {scanResult.status === 'warning' && <AlertTriangle className="w-24 h-24 text-orange-400 mb-6 drop-shadow-lg" />}
             {scanResult.status === 'already' && <Clock className="w-24 h-24 text-blue-400 mb-6 drop-shadow-lg" />}
             {scanResult.status === 'error' && <XCircle className="w-24 h-24 text-red-400 mb-6 drop-shadow-lg" />}
             
             {scanResult.studentName && (
               <h2 className="text-5xl md:text-6xl font-black text-white uppercase tracking-tighter mb-4 text-center">
                 {scanResult.studentName}
               </h2>
             )}
             <div className="bg-black/40 px-8 py-3 rounded-2xl border border-white/10 mt-2">
               <span className="text-white font-black uppercase tracking-[0.2em] text-xl">
                 {scanResult.message}
               </span>
             </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes hud-scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        /* Make the html5-qrcode video completely fill the screen in background */
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
        #reader-scan-region {
          height: 100% !important;
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
      if (scannerRef.current || isInitializingRef.current) return; // Prevent double initialization
      isInitializingRef.current = true;

      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (!mounted) return;
        
        const html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;
        
        const config = { 
          fps: 60,
          // No qrbox: we want full screen video, UI is handled above it!
        };

        await html5QrCode.start(
          { facingMode: "environment" }, 
          config,
          (decodedText: string) => {
            if (isActiveRef.current) {
              onScanRef.current(decodedText);
            }
          },
          () => {} // Ignore silent read failures
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
      if (scannerRef.current) {
        const html5QrCode = scannerRef.current;
        if (html5QrCode.isScanning) {
          html5QrCode.stop().then(() => {
            html5QrCode.clear();
          }).catch((err: any) => console.error("Stop error", err));
        }
        scannerRef.current = null;
      }
    };
  }, []);

  if (error) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black p-10 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-6" />
        <p className="text-white text-xs font-black uppercase leading-relaxed tracking-widest">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-6 text-[10px] text-white/40 underline uppercase font-black">Réessayer</button>
      </div>
    );
  }

  return <div id="reader" className="w-full h-full bg-black" />;
}

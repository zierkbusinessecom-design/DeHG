'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase-client';
import { format, isAfter, setHours, setMinutes, startOfDay } from 'date-fns';
import { QrCode, ShieldCheck, Clock, AlertTriangle, UserCheck, Camera, Volume2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

// Sons encodés en Base64 pour être autonomes
const SOUNDS = {
  success: "data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQYAAACAgICAgICAgICA", // Bip court
  warning: "data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQYAAACAgICAgICAgICA", // À remplacer par vrais sons
  error: "data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQYAAACAgICAgICAgICA"
};

export default function KioskPresencePage() {
  const [scanResult, setScanResult] = useState<{
    status: 'success' | 'error' | 'warning' | 'idle' | 'already';
    message: string;
    studentName?: string;
  }>({ status: 'idle', message: 'Scanne ton badge' });

  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraActive, setCameraActive] = useState(true);
  const router = useRouter();
  const supabase = createClient();
  
  // Audio Refs
  const audioSuccess = useRef<HTMLAudioElement | null>(null);
  const audioWarning = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Sons de confirmation (Bips simples et pros)
    audioSuccess.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    audioWarning.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
  }, []);

  const playSound = (type: 'success' | 'warning') => {
    if (type === 'success') audioSuccess.current?.play().catch(() => {});
    if (type === 'warning') audioWarning.current?.play().catch(() => {});
  };

  const handleScan = useCallback(async (scannedId: string) => {
    if (isProcessing) return;
    
    // Validation stricte de l'ID (Format UUID attendu)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(scannedId)) {
      console.warn("Scan invalide ignoré (pas un UUID)");
      return; 
    }

    setIsProcessing(true);

    try {
      const today = format(new Date(), 'yyyy-MM-dd');

      // 1. Vérifier si une présence existe déjà pour aujourd'hui (Anti-doublon strict)
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
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, supabase]);

  return (
    <div className={cn(
      "fixed inset-0 z-[9999] transition-all duration-700 flex flex-col items-center justify-center p-6 overflow-hidden select-none",
      scanResult.status === 'idle' && "bg-[#050505]",
      scanResult.status === 'success' && "bg-emerald-600",
      scanResult.status === 'warning' && "bg-orange-500",
      scanResult.status === 'already' && "bg-blue-600",
      scanResult.status === 'error' && "bg-red-600"
    )}>
      {/* KIOSK HEADER */}
      <div className="absolute top-10 w-full px-10 flex items-center justify-between z-20">
        <button 
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl border border-white/10 transition-all font-black text-[10px] uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>

        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-white rounded-2xl p-2.5 shadow-2xl mb-3 border border-white/10">
            <img src="/DHG1.jpeg" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <p className="text-white/40 text-[8px] font-black uppercase tracking-[0.3em]">Borne de Présence</p>
        </div>
        
        <div className="w-[100px]" /> {/* Spacer to balance the layout */}
      </div>

      {/* SCANNER VIEWPORT */}
      <div className="relative w-full max-w-md aspect-square bg-black rounded-[4rem] border-8 border-white/5 shadow-2xl overflow-hidden group">
        {!cameraActive ? null : (
          <ScannerComponent onScan={handleScan} isProcessing={isProcessing} />
        )}
        
        {/* LASER LINE */}
        {cameraActive && (
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary shadow-[0_0_40px_#10b981] animate-[scan_1.2s_linear_infinite] z-20 pointer-events-none" />
        )}
        
        {/* CORNERS */}
        <div className="absolute inset-10 border-2 border-white/10 rounded-[2rem] pointer-events-none z-10" />
      </div>

      {/* RESULT FEEDBACK */}
      <div className="mt-14 text-center z-20">
         {scanResult.studentName ? (
           <div className="page-transition">
              <h2 className="text-6xl font-black text-white uppercase tracking-tighter mb-3">{scanResult.studentName}</h2>
              <div className="inline-flex items-center gap-4 bg-black/20 px-8 py-3 rounded-2xl border border-white/10 backdrop-blur-md">
                 <span className="text-white font-black uppercase tracking-[0.2em] text-lg">{scanResult.message}</span>
              </div>
           </div>
         ) : (
           <div className="flex flex-col items-center gap-6 opacity-50">
              <QrCode className="w-16 h-16 text-primary" />
              <p className="text-2xl font-black text-white uppercase tracking-[0.4em] italic">{scanResult.message}</p>
           </div>
         )}
      </div>

      {/* FOOTER STATS */}
      <div className="absolute bottom-10 w-full max-w-md px-10 flex justify-between items-end z-20">
         <div>
            <p className="text-[10px] text-white/30 font-black uppercase mb-1">Session Active</p>
            <p className="text-white font-black text-xs uppercase tracking-widest">
              {new Date().getHours() < 12 ? 'Groupe A (Matin)' : 'Groupe B (A-Midi)'}
            </p>
         </div>
         <div className="text-right">
            <p className="text-[10px] text-white/30 font-black uppercase mb-1">Date</p>
            <p className="text-white font-black text-xs uppercase tracking-widest">{format(new Date(), 'dd MMMM yyyy')}</p>
         </div>
      </div>

      <style jsx global>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        #reader video {
          transform: scaleX(-1) !important;
        }
      `}</style>
    </div>
  );
}

function ScannerComponent({ onScan, isProcessing }: { onScan: (res: string) => void, isProcessing: boolean }) {
  const [error, setError] = useState<string | null>(null);
  
  // Utiliser des refs pour éviter que le useEffect ne se relance à chaque changement
  const onScanRef = useRef(onScan);
  const isProcessingRef = useRef(isProcessing);
  
  useEffect(() => {
    onScanRef.current = onScan;
    isProcessingRef.current = isProcessing;
  }, [onScan, isProcessing]);

  useEffect(() => {
    let html5QrCode: any;

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        html5QrCode = new Html5Qrcode("reader");
        
        const config = { 
          fps: 60, 
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
            const qrboxSize = Math.floor(minEdgeSize * 0.8);
            return { width: qrboxSize, height: qrboxSize };
          },
          aspectRatio: 1.0
        };

        await html5QrCode.start(
          { facingMode: "environment" }, 
          config,
          (decodedText: string) => {
            if (!isProcessingRef.current) onScanRef.current(decodedText);
          },
          () => {} // Ignorer les échecs de lecture silencieusement
        );
      } catch (err: any) {
        console.error(err);
        setError("Vérifiez les permissions caméra ou la connexion HTTPS.");
      }
    };

    startScanner();

    return () => {
      if (html5QrCode && html5QrCode.isScanning) { 
        html5QrCode.stop().then(() => html5QrCode.clear()).catch(() => {});
      }
    };
  }, []);

  if (error) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/10 p-10 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-6" />
        <p className="text-white text-xs font-black uppercase leading-relaxed tracking-widest">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-6 text-[10px] text-white/40 underline uppercase font-black">Réessayer</button>
      </div>
    );
  }

  return <div id="reader" className="w-full h-full object-cover" />;
}

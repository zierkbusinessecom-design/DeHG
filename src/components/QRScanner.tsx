'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface QRScannerProps {
  onScan: (id: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const html5QrCode = useRef<any>(null);
  const lastScanTime = useRef<number>(0);

  useEffect(() => {
    const loadScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        html5QrCode.current = new Html5Qrcode("reader");
        
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };

        await html5QrCode.current.start(
          { facingMode: "environment" },
          config,
          (decodedText: string) => {
            const now = Date.now();
            // Délai de 3 secondes pour éviter les répétitions (Kalil Bah marqué présent 10 fois)
            if (now - lastScanTime.current > 3000) {
              lastScanTime.current = now;
              onScan(decodedText);
              // On ne ferme plus le scanner, on le laisse ouvert pour l'élève suivant
            }
          },
          (errorMessage: string) => {}
        );
      } catch (err) {
        console.error("Scanner loading failed", err);
      }
    };

    const stopScanner = async () => {
      if (html5QrCode.current && html5QrCode.current.isScanning) {
        await html5QrCode.current.stop();
        html5QrCode.current.clear();
      }
    };

    loadScanner();
    return () => { stopScanner(); };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass-card w-full max-w-md p-8 rounded-[2.5rem] border border-white/10 relative overflow-hidden">
        <div className="absolute -right-4 -top-4 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
        
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all z-20"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-black text-white mb-8 uppercase tracking-tight text-center relative z-10">
          Scan Automatique
        </h2>

        <div className="relative aspect-square overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-2xl">
           {/* On applique un transform pour inverser l'image si nécessaire, 
               mais par défaut on va s'assurer que c'est intuitif */}
           <div id="reader" className="w-full h-full object-cover scale-x-[-1]" />
           
           <div className="absolute inset-0 pointer-events-none border-[40px] border-black/40">
              <div className="w-full h-full border-2 border-primary/50 rounded-xl relative">
                 <div className="absolute inset-0 bg-primary/5 animate-pulse" />
              </div>
           </div>
        </div>

        <p className="mt-8 text-[10px] text-muted-foreground text-center font-black uppercase tracking-widest leading-relaxed opacity-60">
          Enregistrement continu activé<br/>Visez le code pour valider
        </p>
      </div>
    </div>
  );
}

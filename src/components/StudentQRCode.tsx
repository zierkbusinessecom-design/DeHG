'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Download, Printer } from 'lucide-react';

interface StudentQRCodeProps {
  studentId: string;
  studentName: string;
  onClose: () => void;
}

export function StudentQRCode({ studentId, studentName, onClose }: StudentQRCodeProps) {
  const downloadQR = () => {
    const svg = document.getElementById('student-qr');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `QR_${studentName}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card w-full max-w-sm p-10 rounded-[3rem] border border-white/10 relative text-center" onClick={e => e.stopPropagation()}>
        {/* Background Decoration */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-20 p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative z-10">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
            <Download className="w-8 h-8 text-primary" />
          </div>
          
          <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Badge Numérique</h2>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-10">{studentName}</p>

          <div className="bg-white p-6 rounded-[2.5rem] inline-block shadow-2xl border-4 border-primary/20 mb-10">
            <QRCodeSVG 
              id="student-qr"
              value={studentId} 
              size={200}
              level="H"
              includeMargin={false}
              imageSettings={{
                src: "/DHG1.jpeg",
                x: undefined,
                y: undefined,
                height: 40,
                width: 40,
                excavate: true,
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={downloadQR}
              className="btn-primary py-3.5 text-[10px] uppercase font-black"
            >
              <Download className="w-4 h-4" />
              Télécharger
            </button>
            <button 
              onClick={() => window.print()}
              className="btn-secondary py-3.5 text-[10px] uppercase font-black"
            >
              <Printer className="w-4 h-4" />
              Imprimer
            </button>
          </div>
          
          <p className="mt-8 text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-40">
            ID: {studentId}
          </p>
        </div>
      </div>
    </div>
  );
}

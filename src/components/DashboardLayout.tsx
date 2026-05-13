'use client';

import React from 'react';
import Sidebar from './Sidebar';
import { useTranslation } from '@/context/TranslationContext';
import { cn } from '@/lib/utils';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { locale } = useTranslation();
  
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <Sidebar />
      <main className="ml-72 p-10 min-h-screen relative overflow-x-hidden">
        {/* Background Gradients */}
        <div className="fixed top-0 left-72 right-0 bottom-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute -top-[20%] -right-[10%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute -bottom-[20%] -left-[10%] w-[60%] h-[60%] bg-emerald-900/5 rounded-full blur-[120px]" />
        </div>
        
        <div className="relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}

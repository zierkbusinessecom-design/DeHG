'use client';

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useTranslation } from '@/context/TranslationContext';
import { Settings as SettingsIcon, Image as ImageIcon, Save, Bell, Shield, Globe } from 'lucide-react';

export default function SettingsPage() {
  const { t, locale, setLocale } = useTranslation();

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto page-transition">
        <div className="flex items-center gap-4 mb-10">
          <div className="p-3 bg-primary/10 rounded-2xl text-primary border border-primary/20">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase">{t.settings}</h1>
            <p className="text-muted-foreground text-sm font-medium mt-1">{t.general_settings}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Logo Section */}
          <div className="glass-card p-10 rounded-[2.5rem] border border-white/10">
            <h2 className="text-xl font-black text-white mb-8 flex items-center gap-4 uppercase tracking-tight">
              <ImageIcon className="w-6 h-6 text-primary" />
              {t.school_logo}
            </h2>
            
            <div className="flex items-center gap-10">
              <div className="w-40 h-40 rounded-[2.5rem] bg-white p-4 shadow-2xl flex items-center justify-center border border-white/10 overflow-hidden">
                <img src="/DHG1.jpeg" alt="School Logo" className="w-full h-full object-contain" style={{ imageRendering: 'crisp-edges' }} />
              </div>
              <div className="flex-1 space-y-4">
                <p className="text-sm text-muted-foreground font-medium max-w-sm">
                  Ceci est le logo officiel de votre établissement. Il apparaît sur les bulletins, la page de connexion et le tableau de bord.
                </p>
                <button className="btn-secondary text-xs py-2.5 px-6">Remplacer le logo</button>
              </div>
            </div>
          </div>

          {/* School Info */}
          <div className="glass-card p-10 rounded-[2.5rem] border border-white/10">
            <h2 className="text-xl font-black text-white mb-8 flex items-center gap-4 uppercase tracking-tight">
              <Globe className="w-6 h-6 text-primary" />
              Informations de l'Établissement
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nom de l'école</label>
                <input className="input-field" defaultValue="DIOGONDIRAL ET HOORE GOOGA" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">Slogan / Sous-titre</label>
                <input className="input-field" defaultValue="Management" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">Année Académique</label>
                <input className="input-field" defaultValue="2025-2026" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">Trimestre Actuel</label>
                <input className="input-field" defaultValue="1er Trimestre" />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button className="btn-primary px-16">
              <Save className="w-5 h-5" />
              {t.save_settings}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

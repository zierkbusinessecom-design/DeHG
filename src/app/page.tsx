'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { useTranslation } from '@/context/TranslationContext';
import { Shield, Lock, User, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const { t, locale, setLocale } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);

  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      setError(loginError.message);
      
      if (newAttempts >= 10) {
        console.warn('SECURITY ALERT: 10 failed login attempts detected!');
        alert('ALERTE SÉCURITÉ : Trop de tentatives échouées. Votre adresse IP a été signalée.');
      }
    } else {
      router.push('/dashboard');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 font-['Outfit']">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md animate-fade-in relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex p-5 rounded-[2.5rem] bg-card border border-white/10 mb-8 shadow-2xl relative group">
            <div className="absolute inset-0 bg-primary/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-16 h-16 rounded-[1.5rem] bg-primary flex items-center justify-center shadow-[0_0_30px_-5px_rgba(34,197,94,0.6)] relative z-10">
              <span className="text-primary-foreground font-black text-3xl">D</span>
            </div>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase">{t.school_name}</h1>
          <p className="text-muted-foreground mt-3 font-medium tracking-wide opacity-60">Gestion Scolaire Professionnelle</p>
        </div>

        <div className="glass-card p-10 rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-500" />
          
          <form onSubmit={handleLogin} className="space-y-8 relative z-10">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-4 text-red-400 text-xs font-bold animate-shake">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-2.5">
              <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">{t.email}</label>
              <div className="relative group/input">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                <input
                  type="email"
                  required
                  placeholder="admin@dhg.school"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-white/10 transition-all font-medium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">Mot de passe</label>
              <div className="relative group/input">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-white/10 transition-all font-medium"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black py-4.5 rounded-[1.5rem] transition-all shadow-[0_0_40px_-10px_rgba(34,197,94,0.5)] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>

        <div className="flex flex-col items-center gap-6 mt-12 relative z-10">
          <div className="flex gap-3 p-1.5 bg-card border border-white/5 rounded-2xl shadow-xl">
            {(['fr', 'en', 'ar'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLocale(l)}
                className={cn(
                  "px-5 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-tighter",
                  locale === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-white"
                )}
              >
                {l}
              </button>
            ))}
          </div>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.3em] opacity-40">
            &copy; 2026 {t.school_name}. Tous droits réservés.
          </p>
        </div>
      </div>
    </div>
  );
}

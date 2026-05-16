'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  UserSquare2, 
  BookOpen, 
  CalendarCheck, 
  GraduationCap, 
  BadgeDollarSign, 
  BookMarked, 
  Settings,
  LogOut,
  QrCode
} from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';

const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { t, locale, setLocale } = useTranslation();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const menuItems = [
    { icon: QrCode, label: "Scanner QR Code", href: '/kiosk/presence' },
    { icon: LayoutDashboard, label: t.dashboard, href: '/dashboard' },
    { icon: Users, label: t.students, href: '/students' },
    { icon: UserSquare2, label: t.teachers, href: '/teachers' },
    { icon: CalendarCheck, label: t.attendance, href: '/attendance' },
    { icon: GraduationCap, label: t.grades, href: '/grades' },
    { icon: BadgeDollarSign, label: t.finance, href: '/finance' },
    { icon: BookOpen, label: t.subjects, href: '/subjects' },
    { icon: Settings, label: t.settings, href: '/settings' },
  ];

  return (
    <aside className="w-72 h-screen bg-[#0a0a0c] border-r border-white/5 flex flex-col fixed left-0 top-0 z-50 transition-all duration-500">
      <div className="p-8">
        <Link href="/dashboard" className="flex items-center gap-4 group cursor-pointer">
          <div className="w-14 h-14 rounded-[1.25rem] bg-white flex items-center justify-center shadow-2xl overflow-hidden group-hover:scale-105 transition-transform duration-500 border border-white/10">
            <img src="/DHG1.jpeg" alt="Logo" className="w-full h-full object-contain p-2" style={{ imageRendering: 'crisp-edges' }} />
          </div>
          <div>
            <h1 className="text-lg font-black text-white leading-none tracking-tighter uppercase">{t.school_short}</h1>
            <p className="text-[10px] text-primary font-black mt-1.5 uppercase tracking-[0.2em] opacity-80">Management</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar pt-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-500 group relative overflow-hidden",
                isActive 
                  ? "bg-primary text-white shadow-[0_10px_25px_-5px_rgba(16,185,129,0.4)]" 
                  : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
              )}
            >
              <item.icon className={cn("w-5 h-5 transition-all duration-500", isActive ? "scale-110" : "group-hover:scale-110")} />
              <span className={cn("font-black text-[13px] uppercase tracking-tight", locale === 'ar' && "font-sans")}>{item.label}</span>
              {isActive && (
                <div className="absolute right-0 top-0 h-full w-1 bg-white/20" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-8 mt-auto space-y-8">
        <div className="flex gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/10">
          {(['fr', 'en', 'ar'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLocale(l)}
              className={cn(
                "flex-1 text-[10px] py-2.5 rounded-xl transition-all uppercase font-black tracking-widest",
                locale === l ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-white"
              )}
            >
              {l}
            </button>
          ))}
        </div>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-4 w-full px-5 py-4 text-red-400 hover:bg-red-500/10 rounded-2xl transition-all group border border-transparent hover:border-red-500/10"
        >
          <LogOut className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          <span className="font-black text-[13px] uppercase tracking-widest">{t.logout}</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

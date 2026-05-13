'use client';

import React, { forwardRef } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { fr, enUS, arSA } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getMonth, getYear } from 'date-fns';
import { useTranslation } from '@/context/TranslationContext';

registerLocale('fr', fr);
registerLocale('en', enUS);
registerLocale('ar', arSA);

interface ProDatePickerProps {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

const CustomInput = forwardRef(({ value, onClick, placeholder, className }: any, ref: any) => (
  <button
    type="button"
    className={cn(
      "w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-left flex items-center relative hover:bg-white/10 z-10",
      className
    )}
    onClick={onClick}
    ref={ref}
  >
    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none" />
    <span className={cn("font-bold", !value && "text-muted-foreground")}>
      {value || placeholder}
    </span>
  </button>
));

CustomInput.displayName = 'CustomInput';

export function ProDatePicker({ selected, onChange, label, placeholder, className }: ProDatePickerProps) {
  const { t, locale } = useTranslation();
  
  const years = Array.from({ length: 15 }, (_, i) => 2026 + i);
  const months = {
    fr: ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"],
    en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    ar: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"]
  };

  const currentMonths = months[locale as keyof typeof months] || months.fr;

  return (
    <div className={cn("space-y-1.5 w-full relative", className)}>
      {label && <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1 block">{label}</label>}
      <div className="relative">
        <DatePicker
          selected={selected}
          onChange={onChange}
          locale={locale}
          dateFormat="dd/MM/yyyy"
          placeholderText={placeholder || t.date}
          customInput={<CustomInput placeholder={placeholder || t.date} />}
          wrapperClassName="w-full"
          renderCustomHeader={({
            date,
            changeYear,
            changeMonth,
            decreaseMonth,
            increaseMonth,
            prevMonthButtonDisabled,
            nextMonthButtonDisabled,
          }) => (
            <div className="flex items-center justify-between px-3 py-3 bg-[#121216] rounded-t-3xl border-b border-white/5">
              <button
                type="button"
                onClick={decreaseMonth}
                disabled={prevMonthButtonDisabled}
                className="p-2 hover:bg-white/5 rounded-xl disabled:opacity-0 transition-all text-primary"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex gap-1">
                <div className="relative group">
                  <select
                    value={getYear(date)}
                    onChange={({ target: { value } }) => changeYear(Number(value))}
                    className="bg-white/5 px-3 py-1.5 rounded-lg text-xs font-black text-white outline-none cursor-pointer hover:bg-white/10 transition-all appearance-none pr-7 border border-white/5"
                  >
                    {years.map((year) => (
                      <option key={year} value={year} className="bg-[#121216]">
                        {year}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                </div>

                <div className="relative group">
                  <select
                    value={currentMonths[getMonth(date)]}
                    onChange={({ target: { value } }) => changeMonth(currentMonths.indexOf(value))}
                    className="bg-white/5 px-3 py-1.5 rounded-lg text-xs font-black text-white outline-none cursor-pointer hover:bg-white/10 transition-all appearance-none pr-7 border border-white/5"
                  >
                    {currentMonths.map((option) => (
                      <option key={option} value={option} className="bg-[#121216]">
                        {option}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <button
                type="button"
                onClick={increaseMonth}
                disabled={nextMonthButtonDisabled}
                className="p-2 hover:bg-white/5 rounded-xl disabled:opacity-0 transition-all text-primary"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
          popperClassName="pro-datepicker-popper"
          portalId="portal-root"
        />
      </div>
    </div>
  );
}

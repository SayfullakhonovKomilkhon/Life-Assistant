import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Cake,
  PartyPopper,
  Pin,
  CheckSquare,
  Mic,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import type { PlanEvent, Birthday, Holiday, Task, VoiceNote } from '../types';

type CalendarMode = 'day' | 'week' | 'month' | 'year';

interface CalendarViewProps {
  events: PlanEvent[];
  birthdays: Birthday[];
  holidays: Holiday[];
  tasks: Task[];
  voiceNotes: VoiceNote[];
  onSelectDate: (date: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  birthdays,
  holidays,
  tasks,
  voiceNotes,
  onSelectDate,
}) => {
  const { language, t, months, monthsShort, weekdaysShort, formatDate, formatWeekday } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [mode, setMode] = useState<CalendarMode>('month');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrev = () => {
    if (mode === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (mode === 'year') {
      setCurrentDate(new Date(year - 1, month, 1));
    } else if (mode === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 1);
      setCurrentDate(d);
    }
  };

  const handleNext = () => {
    if (mode === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (mode === 'year') {
      setCurrentDate(new Date(year + 1, month, 1));
    } else if (mode === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 1);
      setCurrentDate(d);
    }
  };

  // Helper to get items for specific date (YYYY-MM-DD)
  const getItemsForDate = (dateStr: string) => {
    const ev = events.filter((e) => e.date === dateStr);
    const bd = birthdays.filter((b) => b.birthDate.endsWith(dateStr.slice(4)));
    const hol = holidays.filter((h) => h.date.endsWith(dateStr.slice(4)));
    const tk = tasks.filter((t) => t.date === dateStr);
    const vn = voiceNotes.filter((v) => v.date === dateStr);
    return { events: ev, birthdays: bd, holidays: hol, tasks: tk, voiceNotes: vn };
  };

  // Month grid calculations
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday

  const daysArray: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push(i);
  }

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Calendar Header */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {mode === 'year'
                ? `${year}`
                : `${months[month]} ${year}`}
            </h2>
            <p className="text-xs text-slate-400">
              {t('calendar')} • {t(`calendar${mode.charAt(0).toUpperCase() + mode.slice(1)}` as any)}
            </p>
          </div>
        </div>

        {/* View Mode Switcher (Day, Week, Month, Year) & Navigation */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 text-xs font-semibold">
            {(['day', 'week', 'month', 'year'] as CalendarMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer capitalize ${
                  mode === m
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t(`calendar${m.charAt(0).toUpperCase() + m.slice(1)}` as any)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              {t('today')}
            </button>
            <button
              onClick={handleNext}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </button>
          </div>
        </div>
      </div>

      {/* MONTH VIEW */}
      {mode === 'month' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-400 pb-3 mb-2 border-b border-slate-100 dark:border-slate-800">
            {weekdaysShort.map((day, idx) => (
              <div key={idx} className={idx === 0 ? 'text-rose-500' : ''}>
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {daysArray.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="h-20 sm:h-28 rounded-2xl bg-slate-50/40 dark:bg-slate-800/20" />;
              }

              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isToday = dateStr === todayStr;
              const items = getItemsForDate(dateStr);

              return (
                <div
                  key={dateStr}
                  onClick={() => onSelectDate(dateStr)}
                  className={`h-20 sm:h-28 p-2 rounded-2xl border transition cursor-pointer flex flex-col justify-between group ${
                    isToday
                      ? 'border-indigo-600 bg-indigo-50/30 dark:bg-indigo-950/30 shadow-xs'
                      : 'border-slate-100 dark:border-slate-800/80 hover:border-indigo-300 dark:hover:border-indigo-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-700 dark:text-slate-300 group-hover:text-indigo-600'
                      }`}
                    >
                      {day}
                    </span>

                    {/* Quick indicator count */}
                    {items.birthdays.length > 0 && <span title="Birthday">🎂</span>}
                  </div>

                  {/* Badges container */}
                  <div className="space-y-1 overflow-hidden">
                    {items.events.slice(0, 2).map((e) => (
                      <div
                        key={e.id}
                        className="text-[10px] font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded truncate"
                      >
                        📌 {e.title}
                      </div>
                    ))}
                    {items.holidays.slice(0, 1).map((h) => (
                      <div
                        key={h.id}
                        className="text-[10px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded truncate"
                      >
                        🎉 {h.title}
                      </div>
                    ))}
                    {items.tasks.slice(0, 1).map((t) => (
                      <div
                        key={t.id}
                        className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded truncate"
                      >
                        ✅ {t.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* YEAR VIEW */}
      {mode === 'year' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {months.map((mName, mIdx) => {
            const mDays = new Date(year, mIdx + 1, 0).getDate();
            const mStartDay = new Date(year, mIdx, 1).getDay();

            return (
              <div
                key={mIdx}
                className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm"
              >
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 border-b pb-1">
                  {mName}
                </h4>
                <div className="grid grid-cols-7 gap-1 text-[10px] text-center font-medium">
                  {weekdaysShort.map((w, wi) => (
                    <span key={wi} className="text-slate-400 font-bold">
                      {w.charAt(0)}
                    </span>
                  ))}
                  {Array.from({ length: mStartDay }).map((_, ei) => (
                    <span key={`e-${ei}`} />
                  ))}
                  {Array.from({ length: mDays }).map((_, di) => {
                    const dNum = di + 1;
                    const dStr = `${year}-${String(mIdx + 1).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
                    const items = getItemsForDate(dStr);
                    const hasItems =
                      items.events.length > 0 ||
                      items.birthdays.length > 0 ||
                      items.holidays.length > 0;

                    return (
                      <button
                        key={dNum}
                        onClick={() => onSelectDate(dStr)}
                        className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center transition cursor-pointer ${
                          dStr === todayStr
                            ? 'bg-indigo-600 text-white font-bold'
                            : hasItems
                            ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {dNum}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* WEEK & DAY VIEWS */}
      {(mode === 'week' || mode === 'day') && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="space-y-4">
            {(mode === 'day' ? [currentDate] : Array.from({ length: 7 }, (_, i) => {
              const d = new Date(currentDate);
              const dayOfWeek = d.getDay();
              d.setDate(d.getDate() - dayOfWeek + i);
              return d;
            })).map((d) => {
              const dStr = d.toISOString().split('T')[0];
              const items = getItemsForDate(dStr);
              const isToday = dStr === todayStr;

              return (
                <div
                  key={dStr}
                  onClick={() => onSelectDate(dStr)}
                  className={`p-4 rounded-2xl border transition cursor-pointer ${
                    isToday
                      ? 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/20'
                      : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {formatWeekday(d)}, {formatDate(d)}
                      </span>
                      {isToday && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                          {t('today')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {items.birthdays.map((b) => (
                      <div key={b.id} className="text-xs p-2 rounded-xl bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300">
                        🎂 {b.name}
                      </div>
                    ))}
                    {items.holidays.map((h) => (
                      <div key={h.id} className="text-xs p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">
                        🎉 {h.title}
                      </div>
                    ))}
                    {items.events.map((e) => (
                      <div key={e.id} className="text-xs p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300">
                        📌 {e.time ? `${e.time} — ` : ''}{e.title}
                      </div>
                    ))}
                    {items.tasks.map((t) => (
                      <div key={t.id} className="text-xs p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                        ✅ {t.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Cake,
  PartyPopper,
  Pin,
  CheckSquare,
  Sparkles,
  Bot,
  Sun,
  CloudSun,
  Moon,
  Mic,
  FileText,
  Plus,
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { api } from '../services/api';
import type { PlanEvent, Birthday, Holiday, Task, Note, VoiceNote } from '../types';

interface DayScheduleViewProps {
  mode: 'today' | 'tomorrow' | 'my-day';
  events: PlanEvent[];
  birthdays: Birthday[];
  holidays: Holiday[];
  tasks: Task[];
  notes?: Note[];
  voiceNotes?: VoiceNote[];
  onToggleTask: (id: string, completed: boolean) => void;
  onOpenAddPlan: () => void;
  onOpenAddTask: () => void;
  onOpenVoice: () => void;
}

export const DayScheduleView: React.FC<DayScheduleViewProps> = ({
  mode,
  events,
  birthdays,
  holidays,
  tasks,
  notes = [],
  voiceNotes = [],
  onToggleTask,
  onOpenAddPlan,
  onOpenAddTask,
  onOpenVoice,
}) => {
  const { language, t, formatDate, formatWeekday } = useLanguage();
  const [aiSummary, setAiSummary] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const targetDate = new Date();
  if (mode === 'tomorrow') {
    targetDate.setDate(targetDate.getDate() + 1);
  }
  const dateStr = targetDate.toISOString().split('T')[0];

  // Filter items for targetDate
  const dayEvents = events
    .filter((e) => e.date === dateStr)
    .sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));

  const dayTasks = tasks.filter(
    (t) => t.date === dateStr || (mode === 'today' && !t.date && !t.isCompleted)
  );

  const dayBirthdays = birthdays.filter((b) => b.birthDate.endsWith(dateStr.slice(4)));
  const dayHolidays = holidays.filter((h) => h.date.endsWith(dateStr.slice(4)));
  const dayVoiceNotes = voiceNotes.filter((v) => v.date === dateStr);

  const isEmpty =
    dayEvents.length === 0 &&
    dayTasks.length === 0 &&
    dayBirthdays.length === 0 &&
    dayHolidays.length === 0;

  // Split into Morning (<12:00), Afternoon (12:00-17:00), Evening (>=17:00)
  const morningEvents = dayEvents.filter((e) => {
    if (!e.time) return false;
    const hour = parseInt(e.time.split(':')[0], 10);
    return hour < 12;
  });

  const afternoonEvents = dayEvents.filter((e) => {
    if (!e.time) return false;
    const hour = parseInt(e.time.split(':')[0], 10);
    return hour >= 12 && hour < 17;
  });

  const eveningEvents = dayEvents.filter((e) => {
    if (!e.time) return true; // untimed go to evening or general
    const hour = parseInt(e.time.split(':')[0], 10);
    return hour >= 17;
  });

  const handleAskAiAboutDay = async () => {
    setIsAiLoading(true);
    try {
      const prompt =
        mode === 'tomorrow'
          ? language === 'uz'
            ? 'Ertangi kunimni ko‘rsat.'
            : language === 'ru'
            ? 'Покажи мой завтрашний день.'
            : 'Show me my day tomorrow.'
          : language === 'uz'
          ? 'Bugungi kunimni umumlashtirib ber.'
          : language === 'ru'
          ? 'Составь подробное резюме моего сегодняшнего дня.'
          : 'Summarize my schedule for today.';

      const res = await api.chatAssistant(prompt, dateStr);
      setAiSummary(res.reply);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const title =
    mode === 'today'
      ? `📅 ${t('today')}`
      : mode === 'tomorrow'
      ? `➡️ ${t('tomorrow')}`
      : `🤖 ${t('myDay')}`;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1">
            <span>{formatWeekday(targetDate)}</span>
            <span>•</span>
            <span>{formatDate(targetDate)}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {title}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAskAiAboutDay}
            disabled={isAiLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition cursor-pointer"
          >
            <Bot className="w-4 h-4" />
            <span>
              {isAiLoading
                ? t('loading')
                : mode === 'tomorrow'
                ? language === 'uz'
                  ? 'Ertangi kunimni ko‘rsat'
                  : language === 'ru'
                  ? 'Покажи мой завтрашний день'
                  : 'Show my day tomorrow'
                : t('generateBriefing')}
            </span>
          </button>
          <button
            onClick={onOpenAddPlan}
            className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            title={t('addPlan')}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* AI Narrative Section */}
      {aiSummary && (
        <div className="p-5 rounded-3xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/60 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-2">
            <Sparkles className="w-4 h-4" />
            <span>AI Assistant Analysis</span>
          </div>
          <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed">
            {aiSummary}
          </div>
        </div>
      )}

      {/* Empty State */}
      {isEmpty ? (
        <div className="py-16 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 p-8">
          <div className="w-14 h-14 mx-auto rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 flex items-center justify-center mb-3">
            <Calendar className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
            {mode === 'today' ? t('noEventsToday') : t('noEventsTomorrow')}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5">
            Use the Voice Assistant or the quick actions to schedule a plan or task.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onOpenVoice}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md hover:bg-indigo-700 transition"
            >
              <Mic className="w-4 h-4" />
              <span>{t('quickVoiceAssistant')}</span>
            </button>
            <button
              onClick={onOpenAddPlan}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              {t('addPlan')}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Birthdays today banner */}
          {dayBirthdays.length > 0 && (
            <div className="p-4 rounded-3xl bg-gradient-to-r from-pink-500/15 via-rose-500/10 to-amber-500/10 border border-pink-500/30 flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-pink-500 text-white shadow-md shadow-pink-500/25">
                <Cake className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-pink-600 dark:text-pink-400 uppercase tracking-wider">
                  {t('birthdays')}
                </span>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {dayBirthdays.map((b) => b.name).join(', ')}
                </h4>
                <p className="text-xs text-slate-500">
                  {dayBirthdays.map((b) => b.notes || t('todayBirthdayBanner')).join(' • ')}
                </p>
              </div>
            </div>
          )}

          {/* Holidays banner */}
          {dayHolidays.length > 0 && (
            <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-yellow-500/10 border border-amber-500/30 flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/25">
                <PartyPopper className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  {t('holidays')}
                </span>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {dayHolidays
                    .map((h) =>
                      language === 'uz'
                        ? h.titleUz || h.title
                        : language === 'ru'
                        ? h.titleRu || h.title
                        : h.title
                    )
                    .join(', ')}
                </h4>
                <p className="text-xs text-slate-500">
                  {dayHolidays.map((h) => h.description || h.descriptionRu || '').join(' • ')}
                </p>
              </div>
            </div>
          )}

          {/* Timeline / Time-of-day sections (Morning, Afternoon, Evening) for My Day or Timeline */}
          {mode === 'my-day' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Morning */}
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {t('morningSection')}
                  </h4>
                </div>
                <div className="space-y-2">
                  {morningEvents.length === 0 ? (
                    <p className="text-xs text-slate-400 py-3">No morning events</p>
                  ) : (
                    morningEvents.map((e) => (
                      <div key={e.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block font-mono">
                          {e.time}
                        </span>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {e.title}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Afternoon */}
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <CloudSun className="w-4 h-4 text-orange-500" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {t('afternoonSection')}
                  </h4>
                </div>
                <div className="space-y-2">
                  {afternoonEvents.length === 0 ? (
                    <p className="text-xs text-slate-400 py-3">No afternoon events</p>
                  ) : (
                    afternoonEvents.map((e) => (
                      <div key={e.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block font-mono">
                          {e.time}
                        </span>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {e.title}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Evening */}
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <Moon className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {t('eveningSection')}
                  </h4>
                </div>
                <div className="space-y-2">
                  {eveningEvents.length === 0 ? (
                    <p className="text-xs text-slate-400 py-3">No evening events</p>
                  ) : (
                    eveningEvents.map((e) => (
                      <div key={e.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block font-mono">
                          {e.time || '18:00'}
                        </span>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {e.title}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Standard Full Chronological Timeline for Today & Tomorrow */
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                {t('plans')}
              </h3>

              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {dayEvents.map((item) => (
                  <div key={item.id} className="relative flex items-start gap-3">
                    <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 ring-4 ring-white dark:ring-slate-900" />
                    <div className="flex-1 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {item.time && (
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                              {item.time}
                              {item.endTime ? ` — ${item.endTime}` : ''}
                            </span>
                          )}
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {item.title}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-xs text-slate-500">{item.description}</p>
                        )}
                        {item.location && (
                          <p className="text-[11px] text-slate-400 mt-1">📍 {item.location}</p>
                        )}
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 self-start sm:self-auto capitalize">
                        {item.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tasks checklist */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-600" />
                <span>{t('tasks')}</span>
              </h3>
              <button
                onClick={onOpenAddTask}
                className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('add')}</span>
              </button>
            </div>

            <div className="space-y-2">
              {dayTasks.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">No tasks for this day</p>
              ) : (
                dayTasks.map((tItem) => (
                  <div
                    key={tItem.id}
                    onClick={() => onToggleTask(tItem.id, !tItem.isCompleted)}
                    className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                      tItem.isCompleted
                        ? 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800 text-slate-400 line-through'
                        : 'bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={tItem.isCompleted}
                        onChange={() => {}}
                        className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <span className="text-xs font-medium truncate">{tItem.title}</span>
                    </div>
                    {tItem.time && (
                      <span className="text-[11px] text-slate-400 font-mono">{tItem.time}</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Voice Notes on this day */}
          {dayVoiceNotes.length > 0 && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                <Mic className="w-4 h-4 text-indigo-600" />
                <span>{t('voiceNotes')}</span>
              </h3>
              <div className="space-y-2">
                {dayVoiceNotes.map((vn) => (
                  <div
                    key={vn.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
                  >
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">{vn.title}</h5>
                    <p className="text-xs text-slate-500 mt-1">{vn.transcription}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { PartyPopper, Plus, Trash2, Calendar, ShieldCheck, Tag } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import type { Holiday, HolidayCategory } from '../types';

interface HolidaysViewProps {
  holidays: Holiday[];
  onAddCustomHoliday: (h: Omit<Holiday, 'id' | 'userId' | 'isPublic'>) => Promise<void>;
  onDeleteCustomHoliday: (id: string) => Promise<void>;
}

export const HolidaysView: React.FC<HolidaysViewProps> = ({
  holidays,
  onAddCustomHoliday,
  onDeleteCustomHoliday,
}) => {
  const { language, t, formatDate } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Custom Holiday Form state
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('2026-06-01');
  const [category, setCategory] = useState<HolidayCategory>('custom');
  const [description, setDescription] = useState('');

  const filtered = holidays.filter((h) => {
    if (selectedCategory === 'all') return true;
    return h.category === selectedCategory;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await onAddCustomHoliday({
      title: title.trim(),
      date,
      category,
      description: description.trim() || undefined,
    });
    setTitle('');
    setDescription('');
    setShowAddModal(false);
  };

  const categories = [
    { id: 'all', label: t('all') },
    { id: 'uzbekistan', label: t('categoryUzbekistan') },
    { id: 'international', label: t('categoryInternational') },
    { id: 'cultural', label: t('categoryCultural') },
    { id: 'custom', label: t('categoryCustom') },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500">
            <PartyPopper className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {t('holidays')}
            </h2>
            <p className="text-xs text-slate-400">
              Official Uzbekistan, International and Cultural celebrations
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-500/25 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t('addCustomHoliday')}</span>
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              selectedCategory === c.id
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Holidays Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((h) => {
          const displayTitle =
            language === 'uz'
              ? h.titleUz || h.title
              : language === 'ru'
              ? h.titleRu || h.title
              : h.title;

          const displayDesc =
            language === 'uz'
              ? h.descriptionUz || h.description
              : language === 'ru'
              ? h.descriptionRu || h.description
              : h.description;

          return (
            <div
              key={h.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎉</span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {displayTitle}
                    </h4>
                  </div>
                  {!h.isPublic && (
                    <button
                      onClick={() => onDeleteCustomHoliday(h.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {formatDate(h.date)}
                  </span>
                  {h.isPublic && (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck className="w-3 h-3" />
                      {t('officialHolidayTag')}
                    </span>
                  )}
                </div>

                {displayDesc && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                    {displayDesc}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-medium text-slate-400 capitalize">
                {h.category}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Custom Holiday Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              {t('addCustomHoliday')}
            </h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Holiday Name *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. City Anniversary"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Notes about celebration..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-md"
                >
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

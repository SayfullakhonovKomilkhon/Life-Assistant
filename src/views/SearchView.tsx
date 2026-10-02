import React, { useState } from 'react';
import { Search as SearchIcon, Sparkles, Pin, CheckSquare, Cake, PartyPopper, FileText, Mic } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { api } from '../services/api';
import type { PlanEvent, Birthday, Holiday, Task, Note, VoiceNote } from '../types';

interface SearchViewProps {
  events: PlanEvent[];
  birthdays: Birthday[];
  holidays: Holiday[];
  tasks: Task[];
  notes: Note[];
  voiceNotes: VoiceNote[];
}

export const SearchView: React.FC<SearchViewProps> = ({
  events,
  birthdays,
  holidays,
  tasks,
  notes,
  voiceNotes,
}) => {
  const { language, t, formatDate } = useLanguage();
  const [query, setQuery] = useState('');
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiSearchResults, setAiSearchResults] = useState<
    { itemType: string; itemId: string; score: number; reason: string }[] | null
  >(null);

  // Standard keyword matching across all entities
  const q = query.toLowerCase().trim();

  const matchedEvents = q
    ? events.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          (e.description && e.description.toLowerCase().includes(q)) ||
          (e.location && e.location.toLowerCase().includes(q))
      )
    : [];

  const matchedTasks = q
    ? tasks.filter((t) => t.title.toLowerCase().includes(q) || (t.category && t.category.toLowerCase().includes(q)))
    : [];

  const matchedBirthdays = q
    ? birthdays.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          (b.relationship && b.relationship.toLowerCase().includes(q)) ||
          (b.notes && b.notes.toLowerCase().includes(q))
      )
    : [];

  const matchedHolidays = q
    ? holidays.filter(
        (h) =>
          h.title.toLowerCase().includes(q) ||
          (h.titleRu && h.titleRu.toLowerCase().includes(q)) ||
          (h.titleUz && h.titleUz.toLowerCase().includes(q))
      )
    : [];

  const matchedNotes = q
    ? notes.filter((n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q))
    : [];

  const matchedVoice = q
    ? voiceNotes.filter((v) => v.title.toLowerCase().includes(q) || v.transcription.toLowerCase().includes(q))
    : [];

  const handleAiSmartSearch = async () => {
    if (!query.trim()) return;
    setIsAiSearching(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await api.smartSearch(query.trim(), todayStr);
      setAiSearchResults(res.results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiSearching(false);
    }
  };

  const totalMatches =
    matchedEvents.length +
    matchedTasks.length +
    matchedBirthdays.length +
    matchedHolidays.length +
    matchedNotes.length +
    matchedVoice.length;

  const examplePrompts = [
    language === 'uz'
      ? 'Imtihon bilan bog‘liq hamma narsani ko‘rsat'
      : language === 'ru'
      ? 'Покажи всё, что связано с английским'
      : 'Show everything related to my exam',
    language === 'uz'
      ? 'Tug‘ilgan kunlar va sovg‘alar'
      : language === 'ru'
      ? 'Встречи и занятия на следующей неделе'
      : 'Family and friends birthdays',
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Search Header */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <SearchIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {t('search')}
            </h2>
            <p className="text-xs text-slate-400">{t('smartSearchHint')}</p>
          </div>
        </div>

        {/* Input Bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setAiSearchResults(null);
              }}
              placeholder={t('searchPlaceholder')}
              className="w-full text-xs sm:text-sm pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={handleAiSmartSearch}
            disabled={!query.trim() || isAiSearching}
            className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition cursor-pointer flex-shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">
              {isAiSearching ? t('loading') : t('smartSearch')}
            </span>
          </button>
        </div>

        {/* Example prompts */}
        <div className="flex items-center gap-2 overflow-x-auto text-xs text-slate-500">
          <span className="font-semibold text-slate-400">Try:</span>
          {examplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuery(p);
                setAiSearchResults(null);
              }}
              className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 transition whitespace-nowrap cursor-pointer"
            >
              "{p}"
            </button>
          ))}
        </div>
      </div>

      {/* AI Semantic Matches */}
      {aiSearchResults && (
        <div className="p-5 rounded-3xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/60 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-3">
            <Sparkles className="w-4 h-4" />
            <span>AI Semantic Search Insights</span>
          </div>

          <div className="space-y-2">
            {aiSearchResults.map((res, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900 dark:text-white capitalize">
                    {res.itemType}:{' '}
                  </span>
                  <span className="text-slate-600 dark:text-slate-300">{res.reason}</span>
                </div>
                <span className="font-bold text-indigo-600 text-[11px]">
                  {Math.round(res.score * 100)}% match
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results Sections */}
      {!q && !aiSearchResults ? (
        <div className="py-16 text-center text-slate-400">
          <SearchIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p className="text-xs">Type a keyword or ask a natural language query above.</p>
        </div>
      ) : totalMatches === 0 && !aiSearchResults ? (
        <div className="py-16 text-center text-slate-400">
          <p className="text-xs">{t('searchNoResults')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Plans */}
          {matchedEvents.length > 0 && (
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Pin className="w-4 h-4 text-indigo-500" />
                <span>{t('plans')} ({matchedEvents.length})</span>
              </h3>
              <div className="space-y-2">
                {matchedEvents.map((e) => (
                  <div key={e.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">{e.title}</span>
                      <p className="text-slate-400 text-[11px]">{formatDate(e.date)} {e.time ? `• ${e.time}` : ''}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-600">{e.priority}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tasks */}
          {matchedTasks.length > 0 && (
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-500" />
                <span>{t('tasks')} ({matchedTasks.length})</span>
              </h3>
              <div className="space-y-2">
                {matchedTasks.map((t) => (
                  <div key={t.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs">
                    <span className={`font-semibold ${t.isCompleted ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                      {t.title}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">{t.isCompleted ? 'Completed' : 'Pending'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Birthdays */}
          {matchedBirthdays.length > 0 && (
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Cake className="w-4 h-4 text-pink-500" />
                <span>{t('birthdays')} ({matchedBirthdays.length})</span>
              </h3>
              <div className="space-y-2">
                {matchedBirthdays.map((b) => (
                  <div key={b.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">{b.name}</span>
                      <p className="text-slate-400 text-[11px]">{b.relationship || 'Friend'} • {b.birthDate}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Voice Notes */}
          {matchedVoice.length > 0 && (
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Mic className="w-4 h-4 text-indigo-500" />
                <span>{t('voiceNotes')} ({matchedVoice.length})</span>
              </h3>
              <div className="space-y-2">
                {matchedVoice.map((v) => (
                  <div key={v.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-xs">
                    <span className="font-bold text-slate-900 dark:text-white">{v.title}</span>
                    <p className="text-slate-500 mt-1 italic">"{v.transcription}"</p>
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

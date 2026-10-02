import React, { useState, useRef } from 'react';
import { Mic, Play, Pause, Trash2, Edit2, Check, Clock, Plus } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import type { VoiceNote } from '../types';

interface VoiceNotesViewProps {
  voiceNotes: VoiceNote[];
  onOpenVoice: () => void;
  onUpdateVoiceNote: (id: string, updates: Partial<VoiceNote>) => Promise<void>;
  onDeleteVoiceNote: (id: string) => Promise<void>;
}

export const VoiceNotesView: React.FC<VoiceNotesViewProps> = ({
  voiceNotes,
  onOpenVoice,
  onUpdateVoiceNote,
  onDeleteVoiceNote,
}) => {
  const { t, formatDate } = useLanguage();
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedText, setEditedText] = useState('');

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = (vn: VoiceNote) => {
    if (!vn.audioData) return;

    if (playingId === vn.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(vn.audioData);
      audio.onended = () => setPlayingId(null);
      audio.play();
      audioRef.current = audio;
      setPlayingId(vn.id);
    }
  };

  const handleStartEdit = (vn: VoiceNote) => {
    setEditingId(vn.id);
    setEditedText(vn.transcription);
  };

  const handleSaveEdit = async (id: string) => {
    await onUpdateVoiceNote(id, { transcription: editedText });
    setEditingId(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Mic className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {t('voiceNotes')}
            </h2>
            <p className="text-xs text-slate-400">
              Original voice recordings and AI speech transcriptions
            </p>
          </div>
        </div>

        <button
          onClick={onOpenVoice}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/25 transition cursor-pointer self-start sm:self-auto"
        >
          <Mic className="w-4 h-4" />
          <span>Record New Voice Note</span>
        </button>
      </div>

      {/* Voice Notes List */}
      {voiceNotes.length === 0 ? (
        <div className="py-16 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 p-8">
          <Mic className="w-10 h-10 text-indigo-400 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
            No voice recordings yet
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Press the button below to dictate your thoughts or plans.
          </p>
          <button
            onClick={onOpenVoice}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md hover:bg-indigo-700 transition"
          >
            Start Recording
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {voiceNotes.map((vn) => (
            <div
              key={vn.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600">
                      <Mic className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                        {vn.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span>{formatDate(vn.date)}</span>
                        {vn.time && <span>• {vn.time}</span>}
                        {vn.duration && <span>• {vn.duration}s</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleStartEdit(vn)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteVoiceNote(vn.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Transcription text */}
                {editingId === vn.id ? (
                  <div className="space-y-2 mb-3">
                    <textarea
                      value={editedText}
                      onChange={(e) => setEditedText(e.target.value)}
                      rows={3}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2.5 py-1 text-xs rounded-lg border text-slate-600"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(vn.id)}
                        className="px-2.5 py-1 text-xs rounded-lg bg-indigo-600 text-white font-semibold"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4 line-clamp-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                    "{vn.transcription}"
                  </p>
                )}
              </div>

              {/* Original Audio Player controls */}
              {vn.audioData && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500">
                    {t('voiceOriginalAudio')}
                  </span>
                  <button
                    onClick={() => togglePlay(vn)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-100 transition cursor-pointer"
                  >
                    {playingId === vn.id ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>{t('voicePause')}</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>{t('voicePlay')}</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

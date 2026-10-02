import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Play,
  Pause,
  Trash2,
  Check,
  X,
  Sparkles,
  Calendar,
  Clock,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { useSpeech } from '../hooks/useSpeech';
import { useLanguage } from '../hooks/useLanguage';
import { api } from '../services/api';
import type { SmartEventExtraction, PlanEvent, Task } from '../types';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated?: (event: PlanEvent | Task) => void;
  onVoiceNoteCreated?: () => void;
}

export const VoiceModal: React.FC<VoiceModalProps> = ({
  isOpen,
  onClose,
  onEventCreated,
  onVoiceNoteCreated,
}) => {
  const { language, t, formatDate } = useLanguage();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [extractedData, setExtractedData] = useState<SmartEventExtraction | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const handleTranscriptionFinished = async (text: string, base64?: string, duration?: number) => {
    if (base64) setAudioBase64(base64);
    if (duration) setAudioDuration(duration);

    if (!text || text.trim().length === 0) {
      setErrorMessage(t('voiceNotUnderstood'));
      return;
    }

    setIsProcessingAI(true);
    setErrorMessage(null);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const extraction = await api.parseVoice(text, todayStr);
      setExtractedData(extraction);
    } catch (err: any) {
      console.error('Error extracting event from voice:', err);
      setErrorMessage(err.message || t('voiceNotUnderstood'));
    } finally {
      setIsProcessingAI(false);
    }
  };

  const {
    isRecording,
    transcript,
    setTranscript,
    recordingDuration,
    audioUrl,
    error: speechError,
    startRecording,
    stopRecording,
  } = useSpeech({
    language,
    onTranscriptionComplete: handleTranscriptionFinished,
  });

  // Reset state when opening/closing
  useEffect(() => {
    if (!isOpen) {
      if (isRecording) stopRecording();
      setExtractedData(null);
      setAudioBase64(null);
      setErrorMessage(null);
      setIsPlayingAudio(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleAudioPlayback = () => {
    if (!audioPlayerRef.current && audioUrl) {
      audioPlayerRef.current = new Audio(audioUrl);
      audioPlayerRef.current.onended = () => setIsPlayingAudio(false);
    }

    if (audioPlayerRef.current) {
      if (isPlayingAudio) {
        audioPlayerRef.current.pause();
        setIsPlayingAudio(false);
      } else {
        audioPlayerRef.current.play();
        setIsPlayingAudio(true);
      }
    }
  };

  const handleConfirmCreate = async () => {
    if (!extractedData) return;

    try {
      if (extractedData.type === 'task') {
        const newTask = await api.createTask({
          title: extractedData.title,
          date: extractedData.date,
          time: extractedData.time,
          priority: extractedData.priority || 'medium',
          isCompleted: false,
        });
        if (onEventCreated) onEventCreated(newTask);
      } else {
        const newEvent = await api.createEvent({
          title: extractedData.title,
          date: extractedData.date,
          time: extractedData.time,
          endTime: extractedData.endTime,
          description: extractedData.description,
          location: extractedData.location,
          priority: extractedData.priority || 'medium',
          repeat: 'none',
        });
        if (onEventCreated) onEventCreated(newEvent);
      }

      // Also save VoiceNote record with original audio and transcription
      if (audioBase64 || transcript) {
        await api.createVoiceNote({
          title: extractedData.title,
          transcription: transcript,
          audioData: audioBase64 || undefined,
          date: new Date().toISOString().split('T')[0],
          time: `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`,
          duration: audioDuration,
        });
        if (onVoiceNoteCreated) onVoiceNoteCreated();
      }

      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save event');
    }
  };

  const handleSaveAsVoiceNoteOnly = async () => {
    if (!transcript && !audioBase64) return;
    try {
      await api.createVoiceNote({
        title: transcript.substring(0, 40) || 'Voice Note',
        transcription: transcript,
        audioData: audioBase64 || undefined,
        date: new Date().toISOString().split('T')[0],
        time: `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`,
        duration: audioDuration,
      });
      if (onVoiceNoteCreated) onVoiceNoteCreated();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save note');
    }
  };

  const exampleText =
    language === 'ru'
      ? t('voiceExampleRU')
      : language === 'uz'
      ? t('voiceExampleUZ')
      : t('voiceExampleEN');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-slate-800 p-6 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t('voiceModalTitle')}
              </h2>
              <p className="text-xs text-slate-500">{t('voiceInstruction')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Center: Microphone Visualizer */}
        <div className="py-6 flex flex-col items-center justify-center">
          <div className="relative flex items-center justify-center">
            {isRecording && (
              <>
                <span className="absolute w-28 h-28 rounded-full bg-indigo-500/20 animate-ping" />
                <span className="absolute w-24 h-24 rounded-full bg-violet-500/30 animate-pulse" />
              </>
            )}

            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl transition-all transform active:scale-95 cursor-pointer ${
                isRecording
                  ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/40'
                  : 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-indigo-500/40'
              }`}
            >
              {isRecording ? <Square className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {isRecording
                ? `${t('voiceListening')} (${recordingDuration}s)`
                : isProcessingAI
                ? t('voiceProcessing')
                : t('voiceModalTitle')}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs italic">
              {exampleText}
            </p>
          </div>
        </div>

        {/* Error notice */}
        {(errorMessage || speechError) && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMessage || speechError}</span>
          </div>
        )}

        {/* Audio Player and Transcription */}
        {(transcript || audioUrl) && (
          <div className="space-y-3 mb-5">
            {/* Audio player pill */}
            {audioUrl && (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleAudioPlayback}
                    className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition"
                  >
                    {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {t('voiceOriginalAudio')}
                    </p>
                    <p className="text-[10px] text-slate-400">{audioDuration} seconds recorded</p>
                  </div>
                </div>
              </div>
            )}

            {/* Editable Transcription */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                {t('voiceTranscribed')}
              </label>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Say or type something..."
                rows={2}
                className="w-full text-xs p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* AI Extracted details preview */}
        {extractedData && (
          <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 mb-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                {t('voiceExtractedTitle')}
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 capitalize">
                {extractedData.type}
              </span>
            </div>

            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
              {extractedData.title}
            </h4>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span>{formatDate(extractedData.date)}</span>
              </div>
              {extractedData.time && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{extractedData.time}</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-indigo-100/60 dark:border-indigo-900/40 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {t('voiceConfirmPrompt')}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setExtractedData(null)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleConfirmCreate}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md transition cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{t('create')}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer actions when no extraction yet or just saving voice note */}
        {!extractedData && (transcript || audioUrl) && (
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={handleSaveAsVoiceNoteOnly}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {t('voiceSaveAsNote')}
            </button>
            <button
              onClick={() => handleTranscriptionFinished(transcript, audioBase64 || undefined, audioDuration)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('confirm')}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

import { useState, useRef, useEffect, useCallback } from 'react';
import type { Language } from '../types';

interface UseSpeechOptions {
  language: Language;
  onTranscriptionComplete?: (text: string, audioDataUrl?: string, durationSeconds?: number) => void;
}

export function useSpeech({ language, onTranscriptionComplete }: UseSpeechOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);

  const getLangCode = (lang: Language) => {
    switch (lang) {
      case 'ru':
        return 'ru-RU';
      case 'uz':
        return 'uz-UZ';
      case 'en':
      default:
        return 'en-US';
    }
  };

  const startRecording = useCallback(async () => {
    setError(null);
    setTranscript('');
    setAudioUrl(null);
    setAudioBlob(null);
    setRecordingDuration(0);
    audioChunksRef.current = [];

    // 1. Audio stream & MediaRecorder setup
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      startTimeRef.current = Date.now();

      timerRef.current = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 500);

      // 2. SpeechRecognition if available
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = getLangCode(language);

        recognition.onresult = (event: any) => {
          let current = '';
          for (let i = 0; i < event.results.length; i++) {
            current += event.results[i][0].transcript + ' ';
          }
          setTranscript(current.trim());
        };

        recognition.onerror = (e: any) => {
          console.warn('SpeechRecognition error:', e.error);
        };

        recognition.start();
        recognitionRef.current = recognition;
      }
    } catch (err: any) {
      console.error('Microphone access failed:', err);
      setError('Microphone permission denied or not supported');
      setIsRecording(false);
    }
  }, [language]);

  const stopRecording = useCallback(async () => {
    if (!isRecording) return;
    setIsRecording(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }

    const duration = Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 1000));

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setAudioBlob(blob);

        // Convert blob to base64 for persistent storage
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          if (onTranscriptionComplete) {
            onTranscriptionComplete(transcript, base64data, duration);
          }
        };

        // stop audio tracks
        if (mediaRecorderRef.current?.stream) {
          mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
        }
      };
      mediaRecorderRef.current.stop();
    }
  }, [isRecording, transcript, onTranscriptionComplete]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      if (mediaRecorderRef.current?.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    isRecording,
    transcript,
    setTranscript,
    recordingDuration,
    audioUrl,
    audioBlob,
    error,
    startRecording,
    stopRecording,
  };
}

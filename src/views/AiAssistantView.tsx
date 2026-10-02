import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Mic, Sparkles, User, RefreshCw, ChevronRight } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { api } from '../services/api';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface AiAssistantViewProps {
  onOpenVoice: () => void;
}

export const AiAssistantView: React.FC<AiAssistantViewProps> = ({ onOpenVoice }) => {
  const { language, t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text:
        language === 'uz'
          ? 'Salom! Men sizning shaxsiy hayotiy yordamchingizman. Taqvimingiz, rejalaringiz, tug‘ilgan kunlar yoki bayramlar haqida xohlagan savolingizni berishingiz mumkin.'
          : language === 'ru'
          ? 'Здравствуйте! Я ваш личный помощник. Спросите меня о расписании на завтра, ближайших днях рождения, планах на неделю или продиктуйте новую задачу.'
          : "Hello! I am your Personal Life Assistant. Ask me anything about your schedule, tomorrow's plans, upcoming birthdays, or tasks.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: 'usr_' + Date.now(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await api.chatAssistant(text.trim(), todayStr);
      const aiMsg: Message = {
        id: 'ai_' + Date.now(),
        sender: 'assistant',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: 'err_' + Date.now(),
        sender: 'assistant',
        text: err.message || 'Sorry, I encountered an issue. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedPrompts = [
    t('aiSuggestedPrompt1'),
    t('aiSuggestedPrompt2'),
    t('aiSuggestedPrompt3'),
    t('aiSuggestedPrompt4'),
  ];

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in duration-200">
      {/* Top Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {t('aiTitle')}
            </h2>
            <p className="text-xs text-slate-400">
              {language === 'ru' ? 'Русский' : language === 'uz' ? 'O‘zbekcha' : 'English'} • Powered by Gemini AI
            </p>
          </div>
        </div>

        <button
          onClick={onOpenVoice}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 text-xs font-semibold transition cursor-pointer"
        >
          <Mic className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Voice Dictation</span>
        </button>
      </div>

      {/* Suggested Prompts Header */}
      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 flex items-center gap-2 overflow-x-auto scrollbar-none">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex-shrink-0">
          Try:
        </span>
        {suggestedPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            className="text-xs px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/60 transition whitespace-nowrap cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  isUser
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                    : 'bg-indigo-600 text-white'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] sm:max-w-[70%] p-4 rounded-3xl text-xs sm:text-sm leading-relaxed whitespace-pre-line shadow-xs ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-slate-100/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200/50 dark:border-slate-700/50'
                }`}
              >
                {m.text}
                <div
                  className={`text-[10px] mt-1.5 text-right ${
                    isUser ? 'text-indigo-200' : 'text-slate-400'
                  }`}
                >
                  {m.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-3xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 rounded-tl-none flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 animate-spin text-indigo-500" />
              <span>{t('aiThinking')}</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2"
      >
        <button
          type="button"
          onClick={onOpenVoice}
          className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
          title="Voice Input"
        >
          <Mic className="w-4 h-4" />
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('aiPlaceholder')}
          className="flex-1 text-xs sm:text-sm p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="p-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white shadow-md shadow-indigo-500/25 transition cursor-pointer flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

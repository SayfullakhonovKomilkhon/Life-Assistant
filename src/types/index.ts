export type Language = 'en' | 'ru' | 'uz';

export type ThemeMode = 'light' | 'dark' | 'midnight' | 'system';

export type AccentColor =
  | 'indigo'
  | 'emerald'
  | 'rose'
  | 'amber'
  | 'cyan'
  | 'purple'
  | 'blue'
  | 'crimson'
  | 'teal';

export type Priority = 'low' | 'medium' | 'high';

export type RepeatType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export type HolidayCategory = 'uzbekistan' | 'international' | 'cultural' | 'custom';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  phone?: string;
  bio?: string;
  language: Language;
  timezone: string;
  country: string;
  theme: ThemeMode;
  accentColor?: AccentColor;
  onboardingCompleted: boolean;
  pushEnabled?: boolean;
  createdAt: string;
}

export interface Birthday {
  id: string;
  userId: string;
  name: string;
  photo?: string;
  birthDate: string; // YYYY-MM-DD or --MM-DD
  birthYear?: number;
  relationship?: string;
  phone?: string;
  email?: string;
  notes?: string;
  reminderDays: number[]; // e.g. [30, 14, 7, 3, 1, 0]
  createdAt: string;
  updatedAt: string;
}

export interface PlanEvent {
  id: string;
  userId: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  endTime?: string; // HH:mm
  description?: string;
  location?: string;
  category?: string;
  priority: Priority;
  reminderMinutes?: number; // 0, 5, 15, 30, 60, 120, 1440
  repeat: RepeatType;
  isCompleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  date?: string; // YYYY-MM-DD
  time?: string; // HH:mm
  priority: Priority;
  category?: string;
  isCompleted: boolean;
  completedAt?: string;
  reminderMinutes?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Holiday {
  id: string;
  userId?: string | null; // null for system public holidays
  title: string;
  titleRu?: string;
  titleUz?: string;
  date: string; // YYYY-MM-DD or MM-DD
  category: HolidayCategory;
  description?: string;
  descriptionRu?: string;
  descriptionUz?: string;
  isPublic: boolean;
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VoiceNote {
  id: string;
  userId: string;
  title: string;
  audioData?: string; // data:audio/... base64
  transcription: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  duration?: number; // seconds
  processedEventId?: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'birthday' | 'event' | 'task' | 'holiday' | 'system';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface SmartEventExtraction {
  type: 'plan' | 'task' | 'birthday' | 'note';
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  endTime?: string; // HH:mm
  description?: string;
  location?: string;
  priority?: Priority;
  relationship?: string;
  birthYear?: number;
  confidence: number;
  originalText: string;
}

export interface DailyStats {
  totalBirthdays: number;
  totalPlans: number;
  completedTasks: number;
  pendingTasks: number;
  upcomingEvents: number;
  voiceNotes: number;
  holidays: number;
  completionRate: number;
}

import type {
  User,
  Birthday,
  PlanEvent,
  Task,
  Holiday,
  Note,
  VoiceNote,
  AppNotification,
  SmartEventExtraction,
} from '../types';

const TOKEN_KEY = 'pla_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Auth
  register: (data: { email: string; password: string; name: string; language?: string }) =>
    request<{ user: User; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password?: string; autoCreate?: boolean }) =>
    request<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  loginDemo: () =>
    request<{ user: User; token: string }>('/api/auth/demo', {
      method: 'POST',
    }),

  resetPassword: (data: { email: string; newPassword: string }) =>
    request<{ success: boolean; message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMe: () => request<{ user: User }>('/api/auth/me'),

  updateProfile: (data: Partial<User>) =>
    request<{ user: User }>('/api/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Events (Plans)
  getEvents: () => request<PlanEvent[]>('/api/events'),
  createEvent: (data: Omit<PlanEvent, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) =>
    request<PlanEvent>('/api/events', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateEvent: (id: string, data: Partial<PlanEvent>) =>
    request<PlanEvent>(`/api/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteEvent: (id: string) =>
    request<{ success: boolean }>(`/api/events/${id}`, {
      method: 'DELETE',
    }),

  // Birthdays
  getBirthdays: () => request<Birthday[]>('/api/birthdays'),
  createBirthday: (data: Omit<Birthday, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) =>
    request<Birthday>('/api/birthdays', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateBirthday: (id: string, data: Partial<Birthday>) =>
    request<Birthday>(`/api/birthdays/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteBirthday: (id: string) =>
    request<{ success: boolean }>(`/api/birthdays/${id}`, {
      method: 'DELETE',
    }),

  // Tasks
  getTasks: () => request<Task[]>('/api/tasks'),
  createTask: (data: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) =>
    request<Task>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTask: (id: string, data: Partial<Task>) =>
    request<Task>(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteTask: (id: string) =>
    request<{ success: boolean }>(`/api/tasks/${id}`, {
      method: 'DELETE',
    }),

  // Holidays
  getHolidays: () => request<Holiday[]>('/api/holidays'),
  createCustomHoliday: (data: Omit<Holiday, 'id' | 'userId' | 'isPublic'>) =>
    request<Holiday>('/api/holidays/custom', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteCustomHoliday: (id: string) =>
    request<{ success: boolean }>(`/api/holidays/custom/${id}`, {
      method: 'DELETE',
    }),

  // Notes
  getNotes: () => request<Note[]>('/api/notes'),
  createNote: (data: Omit<Note, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) =>
    request<Note>('/api/notes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateNote: (id: string, data: Partial<Note>) =>
    request<Note>(`/api/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteNote: (id: string) =>
    request<{ success: boolean }>(`/api/notes/${id}`, {
      method: 'DELETE',
    }),

  // Voice Notes
  getVoiceNotes: () => request<VoiceNote[]>('/api/voice-notes'),
  createVoiceNote: (data: Omit<VoiceNote, 'id' | 'userId' | 'createdAt'>) =>
    request<VoiceNote>('/api/voice-notes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateVoiceNote: (id: string, data: Partial<VoiceNote>) =>
    request<VoiceNote>(`/api/voice-notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteVoiceNote: (id: string) =>
    request<{ success: boolean }>(`/api/voice-notes/${id}`, {
      method: 'DELETE',
    }),

  // Notifications
  getNotifications: () => request<AppNotification[]>('/api/notifications'),
  markNotificationRead: (id: string) =>
    request<{ success: boolean }>(`/api/notifications/${id}/read`, {
      method: 'POST',
    }),
  markAllNotificationsRead: () =>
    request<{ success: boolean }>('/api/notifications/read-all', {
      method: 'POST',
    }),

  // Push
  getVapidPublicKey: () => request<{ publicKey: string }>('/api/push/public-key'),
  subscribePush: (subscription: PushSubscription) =>
    request<{ success: boolean }>('/api/push/subscribe', {
      method: 'POST',
      body: JSON.stringify(subscription.toJSON()),
    }),
  sendTestPush: () =>
    request<{ success: boolean; count: number }>('/api/push/test', {
      method: 'POST',
    }),

  // AI
  parseVoice: (text: string, referenceDate?: string) =>
    request<SmartEventExtraction>('/api/ai/parse-voice', {
      method: 'POST',
      body: JSON.stringify({ text, referenceDate }),
    }),

  chatAssistant: (message: string, todayStr?: string) =>
    request<{ reply: string }>('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, todayStr }),
    }),

  getDailyBriefing: (todayStr?: string) =>
    request<{ briefing: string }>('/api/ai/briefing', {
      method: 'POST',
      body: JSON.stringify({ todayStr }),
    }),

  getDailySummary: (todayStr?: string) =>
    request<{ summary: string }>('/api/ai/summary', {
      method: 'POST',
      body: JSON.stringify({ todayStr }),
    }),

  smartSearch: (query: string, todayStr?: string) =>
    request<{ results: { itemType: string; itemId: string; score: number; reason: string }[] }>(
      '/api/ai/smart-search',
      {
        method: 'POST',
        body: JSON.stringify({ query, todayStr }),
      }
    ),

  // Export / Import
  exportFullData: () => request<any>('/api/data/export'),
  importFullData: (data: any) =>
    request<{ success: boolean; message: string }>('/api/data/import', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Offline batch sync
  batchSync: (mutations: any[]) =>
    request<{ success: boolean; processed: number }>('/api/sync/batch', {
      method: 'POST',
      body: JSON.stringify({ mutations }),
    }),
};

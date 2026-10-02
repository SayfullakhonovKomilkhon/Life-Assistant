import { api } from './api';

export interface QueuedMutation {
  id: string;
  entity: 'events' | 'tasks' | 'birthdays' | 'notes';
  action: 'create' | 'update' | 'delete';
  data?: any;
  targetId?: string;
  timestamp: number;
}

const CACHE_PREFIX = 'pla_cache_';
const QUEUE_KEY = 'pla_sync_queue';

export const offlineStore = {
  getCache<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(CACHE_PREFIX + key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setCache<T>(key: string, data: T) {
    try {
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(data));
    } catch (e) {
      console.warn('LocalStorage quota or write error:', e);
    }
  },

  getQueue(): QueuedMutation[] {
    try {
      const raw = localStorage.getItem(QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  enqueueMutation(mutation: Omit<QueuedMutation, 'id' | 'timestamp'>) {
    const queue = this.getQueue();
    const item: QueuedMutation = {
      ...mutation,
      id: 'm_' + Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
    };
    queue.push(item);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    return item;
  },

  clearQueue() {
    localStorage.removeItem(QUEUE_KEY);
  },

  async processQueue(): Promise<number> {
    const queue = this.getQueue();
    if (queue.length === 0) return 0;

    try {
      const formatted = queue.map((m) => ({
        entity: m.entity,
        action: m.action,
        data: m.data,
        id: m.targetId,
      }));

      const res = await api.batchSync(formatted);
      if (res.success) {
        this.clearQueue();
        return res.processed;
      }
    } catch (err) {
      console.error('Failed to sync offline queue:', err);
    }
    return 0;
  },
};

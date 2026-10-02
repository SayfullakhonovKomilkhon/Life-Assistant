import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { db } from './server/db';
import { authenticate, generateToken, AuthRequest } from './server/auth';
import {
  parseVoiceToEvent,
  askAssistant,
  generateDailyBriefing,
  generateDailySummary,
  smartSemanticSearch,
} from './server/ai';
import {
  getVapidPublicKey,
  sendTestNotification,
  startNotificationScheduler,
} from './server/push';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Body parsers - allow audio base64 payload up to 25mb
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Start background push notification scheduler
startNotificationScheduler();

// --- Auth Routes ---
app.post('/api/auth/register', (req, res) => {
  try {
    const { email, password, name, language } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }
    const user = db.createUser(email, password, name, language || 'ru');
    const token = generateToken(user.id);
    res.json({ user, token });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Registration failed' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password, autoCreate } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  const cleanEmail = email.trim().toLowerCase();
  let user = db.verifyPassword(cleanEmail, password || '');
  if (!user) {
    // Check if user exists
    const existing = db.getUserByEmail(cleanEmail);
    if (!existing || autoCreate) {
      // Auto-create account so user is never blocked!
      try {
        const fallbackName = cleanEmail.split('@')[0];
        const formattedName = fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1);
        user = db.createUser(cleanEmail, password || 'password123', formattedName, 'ru');
      } catch (e: any) {
        return res.status(400).json({ error: e.message || 'Failed to create user' });
      }
    } else {
      return res.status(401).json({ error: 'Неверный пароль. Воспользуйтесь демо-входом или сбросьте пароль.' });
    }
  }
  const token = generateToken(user.id);
  res.json({ user, token });
});

app.post('/api/auth/demo', (req, res) => {
  const defaultUser = db.getUserById('user_bekhruz') || db.getAllUsers()[0];
  if (!defaultUser) {
    return res.status(404).json({ error: 'Demo user not found' });
  }
  const token = generateToken(defaultUser.id);
  res.json({ user: defaultUser, token });
});

app.post('/api/auth/reset-password', (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Email and new password are required' });
  }
  const ok = db.resetPassword(email, newPassword);
  if (!ok) {
    return res.status(404).json({ error: 'User with this email not found' });
  }
  res.json({ success: true, message: 'Password reset successfully' });
});

app.get('/api/auth/me', authenticate, (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

app.patch('/api/auth/profile', authenticate, (req: AuthRequest, res) => {
  const updated = db.updateUser(req.user!.id, req.body);
  res.json({ user: updated });
});

// --- Events (Plans) Routes ---
app.get('/api/events', authenticate, (req: AuthRequest, res) => {
  const events = db.getEvents(req.user!.id);
  res.json(events);
});

app.post('/api/events', authenticate, (req: AuthRequest, res) => {
  const created = db.createEvent(req.user!.id, req.body);
  res.status(201).json(created);
});

app.put('/api/events/:id', authenticate, (req: AuthRequest, res) => {
  const updated = db.updateEvent(req.user!.id, req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Event not found' });
  res.json(updated);
});

app.delete('/api/events/:id', authenticate, (req: AuthRequest, res) => {
  const ok = db.deleteEvent(req.user!.id, req.params.id);
  res.json({ success: ok });
});

// --- Birthdays Routes ---
app.get('/api/birthdays', authenticate, (req: AuthRequest, res) => {
  const birthdays = db.getBirthdays(req.user!.id);
  res.json(birthdays);
});

app.post('/api/birthdays', authenticate, (req: AuthRequest, res) => {
  const created = db.createBirthday(req.user!.id, req.body);
  res.status(201).json(created);
});

app.put('/api/birthdays/:id', authenticate, (req: AuthRequest, res) => {
  const updated = db.updateBirthday(req.user!.id, req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Birthday not found' });
  res.json(updated);
});

app.delete('/api/birthdays/:id', authenticate, (req: AuthRequest, res) => {
  const ok = db.deleteBirthday(req.user!.id, req.params.id);
  res.json({ success: ok });
});

// --- Tasks Routes ---
app.get('/api/tasks', authenticate, (req: AuthRequest, res) => {
  const tasks = db.getTasks(req.user!.id);
  res.json(tasks);
});

app.post('/api/tasks', authenticate, (req: AuthRequest, res) => {
  const created = db.createTask(req.user!.id, req.body);
  res.status(201).json(created);
});

app.put('/api/tasks/:id', authenticate, (req: AuthRequest, res) => {
  const updated = db.updateTask(req.user!.id, req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Task not found' });
  res.json(updated);
});

app.delete('/api/tasks/:id', authenticate, (req: AuthRequest, res) => {
  const ok = db.deleteTask(req.user!.id, req.params.id);
  res.json({ success: ok });
});

// --- Holidays Routes ---
app.get('/api/holidays', authenticate, (req: AuthRequest, res) => {
  const holidays = db.getHolidays(req.user!.id);
  res.json(holidays);
});

app.post('/api/holidays/custom', authenticate, (req: AuthRequest, res) => {
  const created = db.createCustomHoliday(req.user!.id, req.body);
  res.status(201).json(created);
});

app.delete('/api/holidays/custom/:id', authenticate, (req: AuthRequest, res) => {
  const ok = db.deleteCustomHoliday(req.user!.id, req.params.id);
  res.json({ success: ok });
});

// --- Notes Routes ---
app.get('/api/notes', authenticate, (req: AuthRequest, res) => {
  const notes = db.getNotes(req.user!.id);
  res.json(notes);
});

app.post('/api/notes', authenticate, (req: AuthRequest, res) => {
  const created = db.createNote(req.user!.id, req.body);
  res.status(201).json(created);
});

app.put('/api/notes/:id', authenticate, (req: AuthRequest, res) => {
  const updated = db.updateNote(req.user!.id, req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Note not found' });
  res.json(updated);
});

app.delete('/api/notes/:id', authenticate, (req: AuthRequest, res) => {
  const ok = db.deleteNote(req.user!.id, req.params.id);
  res.json({ success: ok });
});

// --- Voice Notes Routes ---
app.get('/api/voice-notes', authenticate, (req: AuthRequest, res) => {
  const voiceNotes = db.getVoiceNotes(req.user!.id);
  res.json(voiceNotes);
});

app.post('/api/voice-notes', authenticate, (req: AuthRequest, res) => {
  const created = db.createVoiceNote(req.user!.id, req.body);
  res.status(201).json(created);
});

app.put('/api/voice-notes/:id', authenticate, (req: AuthRequest, res) => {
  const updated = db.updateVoiceNote(req.user!.id, req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Voice note not found' });
  res.json(updated);
});

app.delete('/api/voice-notes/:id', authenticate, (req: AuthRequest, res) => {
  const ok = db.deleteVoiceNote(req.user!.id, req.params.id);
  res.json({ success: ok });
});

// --- Notifications Routes ---
app.get('/api/notifications', authenticate, (req: AuthRequest, res) => {
  const notifs = db.getNotifications(req.user!.id);
  res.json(notifs);
});

app.post('/api/notifications/:id/read', authenticate, (req: AuthRequest, res) => {
  const ok = db.markNotificationAsRead(req.user!.id, req.params.id);
  res.json({ success: ok });
});

app.post('/api/notifications/read-all', authenticate, (req: AuthRequest, res) => {
  const ok = db.markAllNotificationsAsRead(req.user!.id);
  res.json({ success: ok });
});

// --- Push Notifications Routes ---
app.get('/api/push/public-key', (req, res) => {
  res.json({ publicKey: getVapidPublicKey() });
});

app.post('/api/push/subscribe', authenticate, (req: AuthRequest, res) => {
  const { endpoint, keys } = req.body;
  if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
    return res.status(400).json({ error: 'Valid subscription object required' });
  }
  const saved = db.savePushSubscription(req.user!.id, endpoint, keys);
  db.updateUser(req.user!.id, { pushEnabled: true });
  res.json({ success: true, subscription: saved });
});

app.post('/api/push/test', authenticate, async (req: AuthRequest, res) => {
  const result = await sendTestNotification(req.user!.id);
  res.json(result);
});

// --- AI Endpoints ---
app.post('/api/ai/parse-voice', authenticate, async (req: AuthRequest, res) => {
  try {
    const { text, referenceDate } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text prompt required' });
    }
    const today = referenceDate || new Date().toISOString().split('T')[0];
    const user = req.user!;
    const extracted = await parseVoiceToEvent(text, today, user.timezone, user.language);
    res.json(extracted);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'AI parsing failed' });
  }
});

app.post('/api/ai/chat', authenticate, async (req: AuthRequest, res) => {
  try {
    const { message, todayStr } = req.body;
    const user = req.user!;
    const context = {
      todayStr: todayStr || new Date().toISOString().split('T')[0],
      userTimezone: user.timezone,
      language: user.language,
      events: db.getEvents(user.id),
      tasks: db.getTasks(user.id),
      birthdays: db.getBirthdays(user.id),
      holidays: db.getHolidays(user.id),
      notes: db.getNotes(user.id),
    };
    const reply = await askAssistant(message, context);
    res.json({ reply });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'AI chat failed' });
  }
});

app.post('/api/ai/briefing', authenticate, async (req: AuthRequest, res) => {
  try {
    const { todayStr } = req.body;
    const user = req.user!;
    const context = {
      todayStr: todayStr || new Date().toISOString().split('T')[0],
      userTimezone: user.timezone,
      language: user.language,
      events: db.getEvents(user.id),
      tasks: db.getTasks(user.id),
      birthdays: db.getBirthdays(user.id),
      holidays: db.getHolidays(user.id),
      notes: db.getNotes(user.id),
    };
    const briefing = await generateDailyBriefing(context);
    res.json({ briefing });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Briefing failed' });
  }
});

app.post('/api/ai/summary', authenticate, async (req: AuthRequest, res) => {
  try {
    const { todayStr } = req.body;
    const user = req.user!;
    const context = {
      todayStr: todayStr || new Date().toISOString().split('T')[0],
      userTimezone: user.timezone,
      language: user.language,
      events: db.getEvents(user.id),
      tasks: db.getTasks(user.id),
      birthdays: db.getBirthdays(user.id),
      holidays: db.getHolidays(user.id),
      notes: db.getNotes(user.id),
    };
    const summary = await generateDailySummary(context);
    res.json({ summary });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Summary failed' });
  }
});

app.post('/api/ai/smart-search', authenticate, async (req: AuthRequest, res) => {
  try {
    const { query, todayStr } = req.body;
    const user = req.user!;
    const context = {
      todayStr: todayStr || new Date().toISOString().split('T')[0],
      userTimezone: user.timezone,
      language: user.language,
      events: db.getEvents(user.id),
      tasks: db.getTasks(user.id),
      birthdays: db.getBirthdays(user.id),
      holidays: db.getHolidays(user.id),
      notes: db.getNotes(user.id),
    };
    const results = await smartSemanticSearch(query, context);
    res.json({ results });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Search failed' });
  }
});

// --- Backup & Offline Sync Endpoints ---
app.get('/api/data/export', authenticate, (req: AuthRequest, res) => {
  const fullData = db.getFullUserData(req.user!.id);
  res.json(fullData);
});

app.post('/api/data/import', authenticate, (req: AuthRequest, res) => {
  try {
    const { events, birthdays, tasks, notes } = req.body;
    const userId = req.user!.id;
    if (Array.isArray(events)) {
      for (const e of events) db.createEvent(userId, e);
    }
    if (Array.isArray(birthdays)) {
      for (const b of birthdays) db.createBirthday(userId, b);
    }
    if (Array.isArray(tasks)) {
      for (const t of tasks) db.createTask(userId, t);
    }
    if (Array.isArray(notes)) {
      for (const n of notes) db.createNote(userId, n);
    }
    res.json({ success: true, message: 'Data imported successfully' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Import failed' });
  }
});

app.post('/api/sync/batch', authenticate, (req: AuthRequest, res) => {
  const { mutations } = req.body;
  const userId = req.user!.id;
  const results: any[] = [];

  if (Array.isArray(mutations)) {
    for (const m of mutations) {
      const { entity, action, data, id } = m;
      try {
        if (entity === 'events') {
          if (action === 'create') results.push(db.createEvent(userId, data));
          else if (action === 'update') results.push(db.updateEvent(userId, id, data));
          else if (action === 'delete') results.push({ deleted: db.deleteEvent(userId, id) });
        } else if (entity === 'tasks') {
          if (action === 'create') results.push(db.createTask(userId, data));
          else if (action === 'update') results.push(db.updateTask(userId, id, data));
          else if (action === 'delete') results.push({ deleted: db.deleteTask(userId, id) });
        } else if (entity === 'birthdays') {
          if (action === 'create') results.push(db.createBirthday(userId, data));
          else if (action === 'update') results.push(db.updateBirthday(userId, id, data));
          else if (action === 'delete') results.push({ deleted: db.deleteBirthday(userId, id) });
        } else if (entity === 'notes') {
          if (action === 'create') results.push(db.createNote(userId, data));
          else if (action === 'update') results.push(db.updateNote(userId, id, data));
          else if (action === 'delete') results.push({ deleted: db.deleteNote(userId, id) });
        }
      } catch (err) {
        console.error('Batch mutation error:', err);
      }
    }
  }
  res.json({ success: true, processed: results.length });
});

// --- Server setup: Vite dev vs Prod ---
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} (${isProd ? 'production' : 'development'})`);
  });
}

startServer();

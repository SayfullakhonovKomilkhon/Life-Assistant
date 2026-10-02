import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { User, Birthday, PlanEvent, Task, Holiday, Note, VoiceNote, AppNotification } from '../src/types';

export interface PushSubscriptionItem {
  id: string;
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  createdAt: string;
}

export interface ReminderItem {
  id: string;
  userId: string;
  entityType: 'event' | 'task' | 'birthday' | 'holiday';
  entityId: string;
  title: string;
  remindAt: string; // ISO string
  sent: boolean;
  createdAt: string;
}

interface DatabaseSchema {
  users: (User & { passwordHash: string; salt: string })[];
  birthdays: Birthday[];
  events: PlanEvent[];
  tasks: Task[];
  holidays: Holiday[];
  notes: Note[];
  voiceNotes: VoiceNote[];
  notifications: AppNotification[];
  pushSubscriptions: PushSubscriptionItem[];
  reminders: ReminderItem[];
}

const DATA_DIR = path.resolve('data');
const DB_FILE = path.join(DATA_DIR, 'assistant_db.json');

const INITIAL_HOLIDAYS: Holiday[] = [
  // Uzbekistan National Holidays (Official)
  {
    id: 'uz_new_year',
    title: "New Year's Day",
    titleRu: 'Новый год',
    titleUz: 'Yangi yil bayrami',
    date: '2026-01-01',
    category: 'uzbekistan',
    description: "Official national holiday in Uzbekistan celebrating the start of the year.",
    descriptionRu: 'Официальный государственный праздник Узбекистана.',
    descriptionUz: "O'zbekiston Respublikasida rasmiy dam olish kuni.",
    isPublic: true,
  },
  {
    id: 'uz_defenders',
    title: 'Day of Defenders of the Motherland',
    titleRu: 'День защитников Родины',
    titleUz: 'Vatan himoyachilari kuni',
    date: '2026-01-14',
    category: 'uzbekistan',
    description: 'Holiday honoring the Armed Forces of the Republic of Uzbekistan.',
    descriptionRu: 'Праздник в честь Вооруженных Сил Республики Узбекистан.',
    descriptionUz: "O'zbekiston Respublikasi Qurolli Kuchlari sharafiga nishonlanadigan bayram.",
    isPublic: true,
  },
  {
    id: 'uz_womens_day',
    title: "International Women's Day",
    titleRu: 'Международный женский день',
    titleUz: 'Xalqaro xotin-qizlar kuni',
    date: '2026-03-08',
    category: 'uzbekistan',
    description: 'Celebrating the achievements and honoring all women.',
    descriptionRu: 'Праздник весны, женственности и признания заслуг женщин.',
    descriptionUz: "Ayollarga ehtirom va bahor bayrami.",
    isPublic: true,
  },
  {
    id: 'uz_navruz',
    title: 'Navruz Holiday',
    titleRu: 'Праздник Навруз',
    titleUz: "Navro'z bayrami",
    date: '2026-03-21',
    category: 'uzbekistan',
    description: 'Astronomical vernal equinox, national celebration of spring and renewal.',
    descriptionRu: 'Национальный праздник весеннего равноденствия, обновления и изобилия.',
    descriptionUz: "Bahoriy tengkunlik, tabiat uyg'onishi va yangilanish umumxalq bayrami.",
    isPublic: true,
  },
  {
    id: 'uz_memory_day',
    title: 'Day of Memory and Honour',
    titleRu: 'День памяти и почестей',
    titleUz: 'Xotira va qadrlash kuni',
    date: '2026-05-09',
    category: 'uzbekistan',
    description: 'Honoring veterans, memory of ancestors, and peace.',
    descriptionRu: 'День всенародного поминовения и почитания ветеранов.',
    descriptionUz: 'Ajdodlar xotirasini yod etish va faxriylarni e’zozlash kuni.',
    isPublic: true,
  },
  {
    id: 'uz_independence',
    title: 'Independence Day of Uzbekistan',
    titleRu: 'День Независимости Республики Узбекистан',
    titleUz: "O'zbekiston Respublikasi Mustaqilligi kuni",
    date: '2026-09-01',
    category: 'uzbekistan',
    description: 'The main state holiday marking the independence declared on Sept 1, 1991.',
    descriptionRu: 'Главный государственный праздник Республики Узбекистан.',
    descriptionUz: "O'zbekiston Respublikasining bosh davlat bayrami.",
    isPublic: true,
  },
  {
    id: 'uz_teachers_day',
    title: 'Teachers and Mentors Day',
    titleRu: 'День учителей и наставников',
    titleUz: "O'qituvchi va murabbiylar kuni",
    date: '2026-10-01',
    category: 'uzbekistan',
    description: 'Day of gratitude to all educators, teachers and professors.',
    descriptionRu: 'Праздник признания труда учителей, педагогов и наставников.',
    descriptionUz: "Ustoz va murabbiylar mehnatini e'zozlash kuni.",
    isPublic: true,
  },
  {
    id: 'uz_constitution',
    title: 'Constitution Day of Uzbekistan',
    titleRu: 'День Конституции Республики Узбекистан',
    titleUz: "O'zbekiston Respublikasi Konstitutsiyasi kuni",
    date: '2026-12-08',
    category: 'uzbekistan',
    description: 'Adoption of the Constitution of the Republic of Uzbekistan in 1992.',
    descriptionRu: 'День принятия Основного Закона Республики Узбекистан.',
    descriptionUz: "O'zbekiston Konstitutsiyasi qabul qilingan kun.",
    isPublic: true,
  },
  {
    id: 'uz_roza_hayit',
    title: 'Ro‘za Hayit (Eid al-Fitr)',
    titleRu: 'Руза хайит (Ид аль-Фитр)',
    titleUz: "Ro'za hayiti",
    date: '2026-03-20',
    category: 'cultural',
    description: 'Holy holiday celebrating the completion of Ramadan fasting.',
    descriptionRu: 'Священный мусульманский праздник окончания поста Рамадан.',
    descriptionUz: "Ramazon oyi yakunida nishonlanadigan muqaddas bayram.",
    isPublic: true,
  },
  {
    id: 'uz_qurbon_hayit',
    title: 'Qurbon Hayit (Eid al-Adha)',
    titleRu: 'Курбан хайит (Ид аль-Адха)',
    titleUz: "Qurbon hayiti",
    date: '2026-05-27',
    category: 'cultural',
    description: 'Feast of Sacrifice, values of generosity and charity.',
    descriptionRu: 'Мусульманский праздник жертвоприношения и благотворительности.',
    descriptionUz: 'Saxovat va muruvvat muqaddas bayrami.',
    isPublic: true,
  },
  // International Holidays
  {
    id: 'intl_earth_day',
    title: 'Earth Day',
    titleRu: 'День Земли',
    titleUz: 'Xalqaro Yer kuni',
    date: '2026-04-22',
    category: 'international',
    description: 'Global environmental protection and ecological awareness.',
    descriptionRu: 'Международный день в поддержку охраны окружающей среды.',
    descriptionUz: "Atrof-muhitni muhofaza qilish xalqaro kuni.",
    isPublic: true,
  },
  {
    id: 'intl_un_day',
    title: 'United Nations Day',
    titleRu: 'День Организации Объединенных Наций',
    titleUz: 'BMT kuni',
    date: '2026-10-24',
    category: 'international',
    description: 'Anniversary of the entry into force of the UN Charter in 1945.',
    descriptionRu: 'Годовщина вступления в силу Устава ООН.',
    descriptionUz: 'Birlashgan Millatlar Tashkiloti tashkil topgan kun.',
    isPublic: true,
  }
];

class Database {
  private data: DatabaseSchema = {
    users: [],
    birthdays: [],
    events: [],
    tasks: [],
    holidays: INITIAL_HOLIDAYS,
    notes: [],
    voiceNotes: [],
    notifications: [],
    pushSubscriptions: [],
    reminders: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = {
          ...this.data,
          ...parsed,
          // ensure system holidays always present
          holidays: this.mergeHolidays(parsed.holidays || []),
        };
      } catch (err) {
        console.error('Failed to load database, initializing defaults:', err);
        this.seedDefaultUser();
        this.save();
      }
    } else {
      this.seedDefaultUser();
      this.save();
    }
  }

  private mergeHolidays(existing: Holiday[]): Holiday[] {
    const map = new Map<string, Holiday>();
    for (const h of INITIAL_HOLIDAYS) {
      map.set(h.id, h);
    }
    for (const h of existing) {
      map.set(h.id, h);
    }
    return Array.from(map.values());
  }

  public save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save database:', err);
    }
  }

  private hashPassword(password: string, salt: string): string {
    return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  }

  private seedDefaultUser() {
    const salt = crypto.randomBytes(16).toString('hex');
    const defaultUserId = 'user_bekhruz';
    const passwordHash = this.hashPassword('assistant123', salt);

    const defaultUser: User & { passwordHash: string; salt: string } = {
      id: defaultUserId,
      email: 'bekhruz@assistant.ai',
      name: 'Bekhruz',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      language: 'ru',
      timezone: 'Asia/Tashkent',
      country: 'Uzbekistan',
      theme: 'system',
      onboardingCompleted: true,
      pushEnabled: false,
      createdAt: new Date().toISOString(),
      passwordHash,
      salt,
    };

    this.data.users.push(defaultUser);

    // Initial demo seed data to showcase features immediately
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Today plans
    this.data.events.push(
      {
        id: 'evt_1',
        userId: defaultUserId,
        title: 'English lesson with Sarah',
        date: todayStr,
        time: '09:00',
        endTime: '10:30',
        description: 'Review IELTS speaking and grammar topic 4',
        location: 'Zoom Conference',
        category: 'Education',
        priority: 'high',
        reminderMinutes: 15,
        repeat: 'weekly',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'evt_2',
        userId: defaultUserId,
        title: 'Finish project architecture presentation',
        date: todayStr,
        time: '14:00',
        endTime: '15:30',
        description: 'Prepare interactive slides for Personal Life Assistant',
        location: 'Office / Online',
        category: 'Work',
        priority: 'high',
        reminderMinutes: 30,
        repeat: 'none',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'evt_3',
        userId: defaultUserId,
        title: 'Mathematics & Algorithms study',
        date: todayStr,
        time: '18:00',
        endTime: '19:30',
        description: 'Graph algorithms & dynamic programming practice',
        location: 'Home Study',
        category: 'Study',
        priority: 'medium',
        reminderMinutes: 15,
        repeat: 'daily',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'evt_4',
        userId: defaultUserId,
        title: 'Dentist appointment',
        date: tomorrowStr,
        time: '16:00',
        endTime: '17:00',
        description: 'Routine dental checkup and cleaning',
        location: 'Central Dental Clinic, Tashkent',
        category: 'Health',
        priority: 'medium',
        reminderMinutes: 60,
        repeat: 'none',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    );

    // Today Tasks
    this.data.tasks.push(
      {
        id: 'task_1',
        userId: defaultUserId,
        title: 'Finish homework for English course',
        date: todayStr,
        time: '12:00',
        priority: 'high',
        category: 'Study',
        isCompleted: false,
        reminderMinutes: 30,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'task_2',
        userId: defaultUserId,
        title: 'Buy fresh fruits and green tea',
        date: todayStr,
        priority: 'low',
        category: 'Personal',
        isCompleted: true,
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'task_3',
        userId: defaultUserId,
        title: 'Review weekly budget and plans',
        date: tomorrowStr,
        priority: 'medium',
        category: 'Finance',
        isCompleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    );

    // Birthdays
    this.data.birthdays.push(
      {
        id: 'bday_1',
        userId: defaultUserId,
        name: 'Alex Johnson',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        birthDate: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`,
        birthYear: 1998,
        relationship: 'Friend',
        phone: '+998 90 123-45-67',
        email: 'alex@example.com',
        notes: 'Enjoys books on architecture and espresso.',
        reminderDays: [7, 3, 1, 0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'bday_2',
        userId: defaultUserId,
        name: 'Sarah Rustamova',
        photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        birthDate: '1995-10-15',
        birthYear: 1995,
        relationship: 'Family',
        phone: '+998 93 987-65-43',
        email: 'sarah.r@example.com',
        notes: 'Loves pottery and art galleries.',
        reminderDays: [14, 7, 1, 0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    );

    // Notes
    this.data.notes.push({
      id: 'note_1',
      userId: defaultUserId,
      title: 'Life Assistant Goals',
      content: '1. Keep daily focus\n2. Celebrate all friends birthdays on time\n3. Consistent language practice',
      tags: ['productivity', 'goals'],
      pinned: true,
      color: '#e0e7ff',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Notifications
    this.data.notifications.push({
      id: 'notif_1',
      userId: defaultUserId,
      title: '🎉 Birthday Reminder',
      message: "Alex Johnson is celebrating their birthday today!",
      type: 'birthday',
      isRead: false,
      link: '/birthdays',
      createdAt: new Date().toISOString(),
    });
  }

  // --- User Methods ---
  public getUserByEmail(email: string) {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public getUserById(id: string) {
    const u = this.data.users.find((u) => u.id === id);
    if (!u) return null;
    const { passwordHash, salt, ...safeUser } = u;
    return safeUser as User;
  }

  public createUser(email: string, password: string, name: string, language: 'en' | 'ru' | 'uz' = 'ru') {
    const existing = this.getUserByEmail(email);
    if (existing) throw new Error('User already exists');

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = this.hashPassword(password, salt);
    const newUser: User & { passwordHash: string; salt: string } = {
      id: 'user_' + crypto.randomUUID(),
      email,
      name,
      language,
      timezone: 'Asia/Tashkent',
      country: 'Uzbekistan',
      theme: 'system',
      onboardingCompleted: false,
      createdAt: new Date().toISOString(),
      passwordHash,
      salt,
    };
    this.data.users.push(newUser);
    this.save();
    const { passwordHash: _, salt: __, ...safeUser } = newUser;
    return safeUser as User;
  }

  public verifyPassword(email: string, password: string): User | null {
    const user = this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return null;
    const hash = this.hashPassword(password, user.salt);
    if (hash === user.passwordHash) {
      const { passwordHash, salt, ...safeUser } = user;
      return safeUser as User;
    }
    return null;
  }

  public updateUser(id: string, updates: Partial<User>) {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    this.save();
    const { passwordHash, salt, ...safeUser } = this.data.users[idx];
    return safeUser as User;
  }

  public resetPassword(email: string, newPassword: string): boolean {
    const user = this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return false;
    const salt = crypto.randomBytes(16).toString('hex');
    user.salt = salt;
    user.passwordHash = this.hashPassword(newPassword, salt);
    this.save();
    return true;
  }

  public getAllUsers(): User[] {
    return this.data.users.map(({ passwordHash, salt, ...safeUser }) => safeUser as User);
  }

  // --- Entity CRUD Operations scoped by userId ---
  public getEvents(userId: string): PlanEvent[] {
    return this.data.events.filter((e) => e.userId === userId);
  }

  public createEvent(userId: string, event: Omit<PlanEvent, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): PlanEvent {
    const newEvent: PlanEvent = {
      ...event,
      id: 'evt_' + crypto.randomUUID(),
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.events.push(newEvent);
    this.save();
    return newEvent;
  }

  public updateEvent(userId: string, id: string, updates: Partial<PlanEvent>): PlanEvent | null {
    const idx = this.data.events.findIndex((e) => e.id === id && e.userId === userId);
    if (idx === -1) return null;
    this.data.events[idx] = {
      ...this.data.events[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.events[idx];
  }

  public deleteEvent(userId: string, id: string): boolean {
    const initialLen = this.data.events.length;
    this.data.events = this.data.events.filter((e) => !(e.id === id && e.userId === userId));
    const deleted = this.data.events.length < initialLen;
    if (deleted) this.save();
    return deleted;
  }

  public getBirthdays(userId: string): Birthday[] {
    return this.data.birthdays.filter((b) => b.userId === userId);
  }

  public createBirthday(userId: string, birthday: Omit<Birthday, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Birthday {
    const newBday: Birthday = {
      ...birthday,
      id: 'bday_' + crypto.randomUUID(),
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.birthdays.push(newBday);
    this.save();
    return newBday;
  }

  public updateBirthday(userId: string, id: string, updates: Partial<Birthday>): Birthday | null {
    const idx = this.data.birthdays.findIndex((b) => b.id === id && b.userId === userId);
    if (idx === -1) return null;
    this.data.birthdays[idx] = {
      ...this.data.birthdays[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.birthdays[idx];
  }

  public deleteBirthday(userId: string, id: string): boolean {
    const initialLen = this.data.birthdays.length;
    this.data.birthdays = this.data.birthdays.filter((b) => !(b.id === id && b.userId === userId));
    const deleted = this.data.birthdays.length < initialLen;
    if (deleted) this.save();
    return deleted;
  }

  public getTasks(userId: string): Task[] {
    return this.data.tasks.filter((t) => t.userId === userId);
  }

  public createTask(userId: string, task: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Task {
    const newTask: Task = {
      ...task,
      id: 'task_' + crypto.randomUUID(),
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.tasks.push(newTask);
    this.save();
    return newTask;
  }

  public updateTask(userId: string, id: string, updates: Partial<Task>): Task | null {
    const idx = this.data.tasks.findIndex((t) => t.id === id && t.userId === userId);
    if (idx === -1) return null;
    this.data.tasks[idx] = {
      ...this.data.tasks[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.tasks[idx];
  }

  public deleteTask(userId: string, id: string): boolean {
    const initialLen = this.data.tasks.length;
    this.data.tasks = this.data.tasks.filter((t) => !(t.id === id && t.userId === userId));
    const deleted = this.data.tasks.length < initialLen;
    if (deleted) this.save();
    return deleted;
  }

  public getHolidays(userId: string): Holiday[] {
    return this.data.holidays.filter((h) => h.isPublic || h.userId === userId);
  }

  public createCustomHoliday(userId: string, holiday: Omit<Holiday, 'id' | 'userId' | 'isPublic'>): Holiday {
    const newHol: Holiday = {
      ...holiday,
      id: 'hol_' + crypto.randomUUID(),
      userId,
      isPublic: false,
    };
    this.data.holidays.push(newHol);
    this.save();
    return newHol;
  }

  public deleteCustomHoliday(userId: string, id: string): boolean {
    const initialLen = this.data.holidays.length;
    this.data.holidays = this.data.holidays.filter((h) => !(h.id === id && h.userId === userId && !h.isPublic));
    const deleted = this.data.holidays.length < initialLen;
    if (deleted) this.save();
    return deleted;
  }

  public getNotes(userId: string): Note[] {
    return this.data.notes.filter((n) => n.userId === userId);
  }

  public createNote(userId: string, note: Omit<Note, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Note {
    const newNote: Note = {
      ...note,
      id: 'note_' + crypto.randomUUID(),
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.notes.push(newNote);
    this.save();
    return newNote;
  }

  public updateNote(userId: string, id: string, updates: Partial<Note>): Note | null {
    const idx = this.data.notes.findIndex((n) => n.id === id && n.userId === userId);
    if (idx === -1) return null;
    this.data.notes[idx] = {
      ...this.data.notes[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.notes[idx];
  }

  public deleteNote(userId: string, id: string): boolean {
    const initialLen = this.data.notes.length;
    this.data.notes = this.data.notes.filter((n) => !(n.id === id && n.userId === userId));
    const deleted = this.data.notes.length < initialLen;
    if (deleted) this.save();
    return deleted;
  }

  public getVoiceNotes(userId: string): VoiceNote[] {
    return this.data.voiceNotes.filter((v) => v.userId === userId);
  }

  public createVoiceNote(userId: string, voiceNote: Omit<VoiceNote, 'id' | 'userId' | 'createdAt'>): VoiceNote {
    const newVoice: VoiceNote = {
      ...voiceNote,
      id: 'vn_' + crypto.randomUUID(),
      userId,
      createdAt: new Date().toISOString(),
    };
    this.data.voiceNotes.push(newVoice);
    this.save();
    return newVoice;
  }

  public updateVoiceNote(userId: string, id: string, updates: Partial<VoiceNote>): VoiceNote | null {
    const idx = this.data.voiceNotes.findIndex((v) => v.id === id && v.userId === userId);
    if (idx === -1) return null;
    this.data.voiceNotes[idx] = { ...this.data.voiceNotes[idx], ...updates };
    this.save();
    return this.data.voiceNotes[idx];
  }

  public deleteVoiceNote(userId: string, id: string): boolean {
    const initialLen = this.data.voiceNotes.length;
    this.data.voiceNotes = this.data.voiceNotes.filter((v) => !(v.id === id && v.userId === userId));
    const deleted = this.data.voiceNotes.length < initialLen;
    if (deleted) this.save();
    return deleted;
  }

  public getNotifications(userId: string): AppNotification[] {
    return this.data.notifications.filter((n) => n.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  public createNotification(userId: string, notif: Omit<AppNotification, 'id' | 'userId' | 'createdAt'>): AppNotification {
    const newNotif: AppNotification = {
      ...notif,
      id: 'notif_' + crypto.randomUUID(),
      userId,
      createdAt: new Date().toISOString(),
    };
    this.data.notifications.unshift(newNotif);
    this.save();
    return newNotif;
  }

  public markNotificationAsRead(userId: string, id: string): boolean {
    const item = this.data.notifications.find((n) => n.id === id && n.userId === userId);
    if (!item) return false;
    item.isRead = true;
    this.save();
    return true;
  }

  public markAllNotificationsAsRead(userId: string): boolean {
    let changed = false;
    for (const n of this.data.notifications) {
      if (n.userId === userId && !n.isRead) {
        n.isRead = true;
        changed = true;
      }
    }
    if (changed) this.save();
    return true;
  }

  public savePushSubscription(userId: string, endpoint: string, keys: { p256dh: string; auth: string }): PushSubscriptionItem {
    // remove existing if same endpoint
    this.data.pushSubscriptions = this.data.pushSubscriptions.filter((s) => s.endpoint !== endpoint);
    const sub: PushSubscriptionItem = {
      id: 'sub_' + crypto.randomUUID(),
      userId,
      endpoint,
      keys,
      createdAt: new Date().toISOString(),
    };
    this.data.pushSubscriptions.push(sub);
    this.save();
    return sub;
  }

  public getPushSubscriptions(userId?: string): PushSubscriptionItem[] {
    if (userId) {
      return this.data.pushSubscriptions.filter((s) => s.userId === userId);
    }
    return this.data.pushSubscriptions;
  }

  public removePushSubscription(endpoint: string) {
    this.data.pushSubscriptions = this.data.pushSubscriptions.filter((s) => s.endpoint !== endpoint);
    this.save();
  }

  public getFullUserData(userId: string) {
    return {
      user: this.getUserById(userId),
      events: this.getEvents(userId),
      birthdays: this.getBirthdays(userId),
      tasks: this.getTasks(userId),
      holidays: this.getHolidays(userId),
      notes: this.getNotes(userId),
      voiceNotes: this.getVoiceNotes(userId),
      notifications: this.getNotifications(userId),
    };
  }
}

export const db = new Database();

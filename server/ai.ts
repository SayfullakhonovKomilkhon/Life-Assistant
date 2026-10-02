import { GoogleGenAI, Type } from '@google/genai';
import type { Language, PlanEvent, Task, Birthday, Holiday, Note, SmartEventExtraction } from '../src/types';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export interface UserScheduleContext {
  todayStr: string;
  userTimezone: string;
  language: Language;
  events: PlanEvent[];
  tasks: Task[];
  birthdays: Birthday[];
  holidays: Holiday[];
  notes: Note[];
}

export async function parseVoiceToEvent(
  text: string,
  referenceDate: string,
  timezone: string,
  lang: Language
): Promise<SmartEventExtraction> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return fallbackParse(text, referenceDate);
  }

  try {
    const prompt = `You are a smart calendar assistant.
The user spoke or typed the following text:
"${text}"

Reference context:
- Current date: ${referenceDate}
- User Timezone: ${timezone}
- User Language: ${lang}

Analyze the text and extract calendar/task details.
Map relative terms properly:
- "today", "сегодня", "bugun" -> ${referenceDate}
- "tomorrow", "завтра", "ertaga" -> the day after ${referenceDate}
- "next Wednesday", "в следующую среду", "keyingi chorshanba" -> calculate exact YYYY-MM-DD
- "at 7pm", "в 19:00", "в семь вечера", "soat 19:00 da" -> "19:00"

Extract:
- type: "plan" | "task" | "birthday" | "note"
- title: concise title for the item
- date: YYYY-MM-DD
- time: HH:mm (if mentioned, otherwise empty)
- endTime: HH:mm (if mentioned, otherwise empty)
- description: extra details or original utterance
- priority: "low" | "medium" | "high"
- location: location if mentioned
- confidence: number between 0.1 and 1.0`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING },
            title: { type: Type.STRING },
            date: { type: Type.STRING },
            time: { type: Type.STRING },
            endTime: { type: Type.STRING },
            description: { type: Type.STRING },
            priority: { type: Type.STRING },
            location: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
          },
          required: ['type', 'title', 'date'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      type: (parsed.type || 'plan') as any,
      title: parsed.title || text,
      date: parsed.date || referenceDate,
      time: parsed.time || undefined,
      endTime: parsed.endTime || undefined,
      description: parsed.description || text,
      priority: (parsed.priority || 'medium') as any,
      location: parsed.location || undefined,
      confidence: parsed.confidence || 0.95,
      originalText: text,
    };
  } catch (err) {
    console.error('Gemini parseVoiceToEvent error, using fallback:', err);
    return fallbackParse(text, referenceDate);
  }
}

function fallbackParse(text: string, referenceDate: string): SmartEventExtraction {
  const lower = text.toLowerCase();
  const d = new Date(referenceDate);

  if (lower.includes('завтра') || lower.includes('tomorrow') || lower.includes('ertaga')) {
    d.setDate(d.getDate() + 1);
  } else if (lower.includes('послезавтра') || lower.includes('in two days') || lower.includes('indiniga')) {
    d.setDate(d.getDate() + 2);
  }

  const dateStr = d.toISOString().split('T')[0];

  // extract time like 19:00, 7:00, 7 pm, etc.
  let timeMatch = text.match(/(\d{1,2})[:.](\d{2})/);
  let time: string | undefined = undefined;
  if (timeMatch) {
    time = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
  } else {
    const hourMatch = text.match(/(\d{1,2})\s*(?:вечера|дня|утра|pm|am|soat)/i);
    if (hourMatch) {
      let h = parseInt(hourMatch[1], 10);
      if (lower.includes('вечера') || lower.includes('pm')) {
        if (h < 12) h += 12;
      }
      time = `${String(h).padStart(2, '0')}:00`;
    }
  }

  // extract title
  let cleanTitle = text
    .replace(/(?:завтра|сегодня|послезавтра|tomorrow|today|ertaga|bugun)/gi, '')
    .replace(/(?:в\s+\d{1,2}[:.]\d{2}|at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?|soat\s+\d{1,2}(?::\d{2})?\s*da)/gi, '')
    .replace(/(?:мне нужно|надо|plan|task|kerak)/gi, '')
    .trim();

  if (!cleanTitle) cleanTitle = text;
  cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

  return {
    type: lower.includes('задач') || lower.includes('task') || lower.includes('vazifa') ? 'task' : 'plan',
    title: cleanTitle,
    date: dateStr,
    time,
    description: text,
    priority: 'medium',
    confidence: 0.8,
    originalText: text,
  };
}

export async function askAssistant(
  userQuery: string,
  context: UserScheduleContext
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return generateLocalResponse(userQuery, context);
  }

  try {
    const systemPrompt = `You are "Personal Life Assistant", an elite personal life AI assistant.
User's interface language: ${context.language.toUpperCase()}.
CRITICAL: You MUST ALWAYS respond in the user's selected language:
- If language is 'ru' -> Speak natural, fluent Russian.
- If language is 'uz' -> Speak natural, fluent Uzbek (O‘zbek tili).
- If language is 'en' -> Speak natural, fluent English.

Today's date: ${context.todayStr}
Timezone: ${context.userTimezone}

User's database content:
- Plans / Events: ${JSON.stringify(context.events.map(e => ({ title: e.title, date: e.date, time: e.time, priority: e.priority, category: e.category })))}
- Tasks: ${JSON.stringify(context.tasks.map(t => ({ title: t.title, date: t.date, isCompleted: t.isCompleted, priority: t.priority })))}
- Birthdays: ${JSON.stringify(context.birthdays.map(b => ({ name: b.name, birthDate: b.birthDate, relationship: b.relationship })))}
- Holidays: ${JSON.stringify(context.holidays.map(h => ({ title: h.title, titleRu: h.titleRu, titleUz: h.titleUz, date: h.date, category: h.category })))}
- Notes: ${JSON.stringify(context.notes.map(n => ({ title: n.title, content: n.content })))}

Special instructions:
- If asked "Show me my day tomorrow" / "Покажи мой завтрашний день" / "Ertangi kunimni ko‘rsat", present all tomorrow's plans, tasks, birthdays, holidays in a structured, friendly timeline.
- If asked about "This week" / "На этой неделе" / "Bu hafta", summarize the week's events clearly.
- If user requests creating an event/task/plan, state clearly that you recognized the item and summarize its date and time.
- Be concise, warm, helpful, and organized with emojis.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userQuery,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    return response.text || generateLocalResponse(userQuery, context);
  } catch (err) {
    console.error('Gemini askAssistant error:', err);
    return generateLocalResponse(userQuery, context);
  }
}

export async function generateDailyBriefing(context: UserScheduleContext): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  const today = context.todayStr;

  const todayEvents = context.events.filter(e => e.date === today);
  const todayTasks = context.tasks.filter(t => t.date === today || (!t.date && !t.isCompleted));
  const todayBirthdays = context.birthdays.filter(b => b.birthDate.endsWith(today.slice(4)));
  const todayHolidays = context.holidays.filter(h => h.date.endsWith(today.slice(4)));

  if (!apiKey) {
    if (context.language === 'ru') {
      return `Доброе утро! ☀️\nСегодня у вас:\n📌 Планов: ${todayEvents.length}\n🎂 Дней рождения: ${todayBirthdays.length}\n🎉 Праздников: ${todayHolidays.length}\n✅ Задач: ${todayTasks.length}\n\nЖелаем продуктивного и вдохновляющего дня!`;
    } else if (context.language === 'uz') {
      return `Xayrli tong! ☀️\nBugungi rejalaringiz:\n📌 Rejalar: ${todayEvents.length}\n🎂 Tug‘ilgan kunlar: ${todayBirthdays.length}\n🎉 Bayramlar: ${todayHolidays.length}\n✅ Vazifalar: ${todayTasks.length}\n\nKuningiz barakali va sermahsul o‘tsin!`;
    } else {
      return `Good morning! ☀️\nToday you have:\n📌 Plans: ${todayEvents.length}\n🎂 Birthdays: ${todayBirthdays.length}\n🎉 Holidays: ${todayHolidays.length}\n✅ Tasks: ${todayTasks.length}\n\nHave a wonderful and productive day!`;
    }
  }

  try {
    const prompt = `Generate an inspiring, structured Morning Briefing for the user.
Language: ${context.language.toUpperCase()}
Today is: ${today}
Plans today: ${JSON.stringify(todayEvents)}
Tasks today: ${JSON.stringify(todayTasks)}
Birthdays today: ${JSON.stringify(todayBirthdays)}
Holidays today: ${JSON.stringify(todayHolidays)}

Keep it clear, uplifting, and formatted with bullet points for Morning, Afternoon, and Evening schedule.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });
    return response.text || '';
  } catch (err) {
    console.error('Error generating briefing:', err);
    return '';
  }
}

export async function generateDailySummary(context: UserScheduleContext): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  const today = context.todayStr;
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const completedTasks = context.tasks.filter(t => t.isCompleted);
  const pendingTasks = context.tasks.filter(t => !t.isCompleted);
  const tomorrowEvents = context.events.filter(e => e.date === tomorrowStr);

  if (!apiKey) {
    if (context.language === 'ru') {
      return `🌙 Итог дня:\n\n✅ Выполнено задач: ${completedTasks.length}\n⏳ Ожидает решения: ${pendingTasks.length}\n➡️ Завтра запланировано событий: ${tomorrowEvents.length}\n\nОтличная работа сегодня! Отдохните и наберитесь сил.`;
    } else if (context.language === 'uz') {
      return `🌙 Kun yakuni:\n\n✅ Bajarilgan vazifalar: ${completedTasks.length}\n⏳ Kutilayotgan vazifalar: ${pendingTasks.length}\n➡️ Ertaga rejalashtirilgan ishlar: ${tomorrowEvents.length}\n\nBugun yaxshi harakat qildingiz! Xayrli tun va maroqli hordiq tilaymiz.`;
    } else {
      return `🌙 Daily Summary:\n\n✅ Completed tasks: ${completedTasks.length}\n⏳ Pending tasks: ${pendingTasks.length}\n➡️ Tomorrow's scheduled events: ${tomorrowEvents.length}\n\nGreat job today! Rest well and recharge.`;
    }
  }

  try {
    const prompt = `Generate a pleasant Evening Summary.
Language: ${context.language.toUpperCase()}
Completed tasks: ${JSON.stringify(completedTasks)}
Pending tasks: ${JSON.stringify(pendingTasks)}
Tomorrow events: ${JSON.stringify(tomorrowEvents)}

Summarize achievements, list what's coming up tomorrow, and wish them a restful evening.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });
    return response.text || '';
  } catch (err) {
    console.error('Error generating summary:', err);
    return '';
  }
}

export async function smartSemanticSearch(
  query: string,
  context: UserScheduleContext
): Promise<{ itemType: string; itemId: string; score: number; reason: string }[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // fallback keyword search
    const results: { itemType: string; itemId: string; score: number; reason: string }[] = [];
    const q = query.toLowerCase();
    for (const e of context.events) {
      if (e.title.toLowerCase().includes(q) || (e.description && e.description.toLowerCase().includes(q))) {
        results.push({ itemType: 'plan', itemId: e.id, score: 0.9, reason: 'Keyword match in plan title or description' });
      }
    }
    for (const t of context.tasks) {
      if (t.title.toLowerCase().includes(q)) {
        results.push({ itemType: 'task', itemId: t.id, score: 0.9, reason: 'Keyword match in task title' });
      }
    }
    for (const b of context.birthdays) {
      if (b.name.toLowerCase().includes(q) || (b.notes && b.notes.toLowerCase().includes(q))) {
        results.push({ itemType: 'birthday', itemId: b.id, score: 0.9, reason: 'Keyword match in birthday' });
      }
    }
    for (const n of context.notes) {
      if (n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)) {
        results.push({ itemType: 'note', itemId: n.id, score: 0.9, reason: 'Keyword match in note content' });
      }
    }
    return results;
  }

  try {
    const prompt = `You are a semantic search engine for Personal Life Assistant.
Search Query: "${query}"

Items:
Plans: ${JSON.stringify(context.events.map(e => ({ id: e.id, title: e.title, description: e.description, category: e.category })))}
Tasks: ${JSON.stringify(context.tasks.map(t => ({ id: t.id, title: t.title, category: t.category })))}
Birthdays: ${JSON.stringify(context.birthdays.map(b => ({ id: b.id, name: b.name, notes: b.notes })))}
Notes: ${JSON.stringify(context.notes.map(n => ({ id: n.id, title: n.title, content: n.content })))}

Return a list of items that match or semantically relate to the user's intent.
For example if the user asks "Show everything related to English exam" or "Покажи всё, что связано с экзаменом", find English lessons, study tasks, notes about exams, etc.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              itemType: { type: Type.STRING },
              itemId: { type: Type.STRING },
              score: { type: Type.NUMBER },
              reason: { type: Type.STRING },
            },
            required: ['itemType', 'itemId', 'score', 'reason'],
          },
        },
      },
    });

    return JSON.parse(response.text || '[]');
  } catch (err) {
    console.error('Smart search error:', err);
    return [];
  }
}

function generateLocalResponse(query: string, context: UserScheduleContext): string {
  const lower = query.toLowerCase();
  const lang = context.language;

  const tomorrow = new Date(context.todayStr);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  if (lower.includes('завтра') || lower.includes('tomorrow') || lower.includes('ertaga')) {
    const tmEvents = context.events.filter(e => e.date === tomorrowStr);
    const tmTasks = context.tasks.filter(t => t.date === tomorrowStr);
    const tmBdays = context.birthdays.filter(b => b.birthDate.endsWith(tomorrowStr.slice(4)));

    if (lang === 'ru') {
      let msg = `📅 Расписание на завтра (${tomorrowStr}):\n\n`;
      if (tmEvents.length === 0 && tmTasks.length === 0 && tmBdays.length === 0) {
        msg += 'У вас нет запланированных событий на завтра. Отличное время для отдыха или новых идей!';
      } else {
        if (tmEvents.length > 0) {
          msg += '📌 Планы:\n' + tmEvents.map(e => `• ${e.time ? e.time + ' — ' : ''}${e.title}`).join('\n') + '\n\n';
        }
        if (tmTasks.length > 0) {
          msg += '✅ Задачи:\n' + tmTasks.map(t => `• ${t.title}`).join('\n') + '\n\n';
        }
        if (tmBdays.length > 0) {
          msg += '🎂 Дни рождения:\n' + tmBdays.map(b => `• ${b.name}`).join('\n') + '\n\n';
        }
      }
      return msg;
    } else if (lang === 'uz') {
      let msg = `📅 Ertangi kun jadvali (${tomorrowStr}):\n\n`;
      if (tmEvents.length === 0 && tmTasks.length === 0 && tmBdays.length === 0) {
        msg += 'Ertaga rejalashtirilgan tadbirlar yo‘q. Bo‘sh vaqtingizni unumli o‘tkazishingiz mumkin!';
      } else {
        if (tmEvents.length > 0) {
          msg += '📌 Rejalar:\n' + tmEvents.map(e => `• ${e.time ? e.time + ' — ' : ''}${e.title}`).join('\n') + '\n\n';
        }
        if (tmTasks.length > 0) {
          msg += '✅ Vazifalar:\n' + tmTasks.map(t => `• ${t.title}`).join('\n') + '\n\n';
        }
        if (tmBdays.length > 0) {
          msg += '🎂 Tug‘ilgan kunlar:\n' + tmBdays.map(b => `• ${b.name}`).join('\n') + '\n\n';
        }
      }
      return msg;
    } else {
      let msg = `📅 Tomorrow's schedule (${tomorrowStr}):\n\n`;
      if (tmEvents.length === 0 && tmTasks.length === 0 && tmBdays.length === 0) {
        msg += 'You have no events scheduled for tomorrow. A great day to relax or catch up!';
      } else {
        if (tmEvents.length > 0) {
          msg += '📌 Plans:\n' + tmEvents.map(e => `• ${e.time ? e.time + ' — ' : ''}${e.title}`).join('\n') + '\n\n';
        }
        if (tmTasks.length > 0) {
          msg += '✅ Tasks:\n' + tmTasks.map(t => `• ${t.title}`).join('\n') + '\n\n';
        }
        if (tmBdays.length > 0) {
          msg += '🎂 Birthdays:\n' + tmBdays.map(b => `• ${b.name}`).join('\n') + '\n\n';
        }
      }
      return msg;
    }
  }

  if (lang === 'ru') {
    return `Я проанализировал ваш личный календарь. Всего у вас ${context.events.length} планов, ${context.tasks.length} задач и ${context.birthdays.length} дней рождения. Чем еще я могу вам помочь?`;
  } else if (lang === 'uz') {
    return `Taqvimingizni tahlil qildim. Sizda jami ${context.events.length} ta reja, ${context.tasks.length} ta vazifa va ${context.birthdays.length} ta tug‘ilgan kun ro‘yxatga olingan. Yana qanday yordam bera olaman?`;
  } else {
    return `I have reviewed your calendar. You have ${context.events.length} plans, ${context.tasks.length} tasks, and ${context.birthdays.length} birthdays on file. How else can I assist you today?`;
  }
}

import type { PlanEvent, Birthday, Task } from '../types';

export function generateICS(events: PlanEvent[], birthdays: Birthday[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Personal Life Assistant//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  const nowStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  for (const e of events) {
    const dateClean = e.date.replace(/-/g, '');
    let dtStart = dateClean;
    let dtEnd = dateClean;

    if (e.time) {
      const [h, m] = e.time.split(':');
      dtStart += `T${h.padStart(2, '0')}${m.padStart(2, '0')}00`;
      if (e.endTime) {
        const [eh, em] = e.endTime.split(':');
        dtEnd += `T${eh.padStart(2, '0')}${em.padStart(2, '0')}00`;
      } else {
        const endH = (parseInt(h, 10) + 1) % 24;
        dtEnd += `T${String(endH).padStart(2, '0')}${m.padStart(2, '0')}00`;
      }
    }

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:evt-${e.id}@personal-life-assistant`);
    lines.push(`DTSTAMP:${nowStamp}`);
    lines.push(e.time ? `DTSTART:${dtStart}` : `DTSTART;VALUE=DATE:${dateClean}`);
    lines.push(e.time ? `DTEND:${dtEnd}` : `DTEND;VALUE=DATE:${dateClean}`);
    lines.push(`SUMMARY:${escapeICS(e.title)}`);
    if (e.description) lines.push(`DESCRIPTION:${escapeICS(e.description)}`);
    if (e.location) lines.push(`LOCATION:${escapeICS(e.location)}`);
    if (e.repeat && e.repeat !== 'none') {
      const freqMap: Record<string, string> = {
        daily: 'DAILY',
        weekly: 'WEEKLY',
        monthly: 'MONTHLY',
        yearly: 'YEARLY',
      };
      if (freqMap[e.repeat]) lines.push(`RRULE:FREQ=${freqMap[e.repeat]}`);
    }
    lines.push('END:VEVENT');
  }

  for (const b of birthdays) {
    const dateParts = b.birthDate.split('-');
    const currentYear = new Date().getFullYear();
    const mm = dateParts[1] || '01';
    const dd = dateParts[2] || '01';
    const dateClean = `${currentYear}${mm}${dd}`;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:bday-${b.id}@personal-life-assistant`);
    lines.push(`DTSTAMP:${nowStamp}`);
    lines.push(`DTSTART;VALUE=DATE:${dateClean}`);
    lines.push(`DTEND;VALUE=DATE:${dateClean}`);
    lines.push(`SUMMARY:🎂 ${escapeICS(b.name)}'s Birthday`);
    lines.push(`DESCRIPTION:${escapeICS(b.notes || 'Birthday celebration')}`);
    lines.push('RRULE:FREQ=YEARLY');
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function escapeICS(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function parseICS(icsText: string): { events: Partial<PlanEvent>[]; birthdays: Partial<Birthday>[] } {
  const events: Partial<PlanEvent>[] = [];
  const birthdays: Partial<Birthday>[] = [];

  const veventBlocks = icsText.split('BEGIN:VEVENT').slice(1);

  for (const block of veventBlocks) {
    const summaryMatch = block.match(/SUMMARY:(.*?)(?:\r?\n|$)/);
    const dtstartMatch = block.match(/DTSTART(?:;[^:]+)?:(.*?)(?:\r?\n|$)/);
    const descMatch = block.match(/DESCRIPTION:(.*?)(?:\r?\n|$)/);
    const locMatch = block.match(/LOCATION:(.*?)(?:\r?\n|$)/);

    const summary = summaryMatch ? summaryMatch[1].trim() : 'Event';
    const rawStart = dtstartMatch ? dtstartMatch[1].trim() : '';
    const description = descMatch ? descMatch[1].trim() : '';
    const location = locMatch ? locMatch[1].trim() : '';

    let date = new Date().toISOString().split('T')[0];
    let time: string | undefined = undefined;

    if (rawStart) {
      const cleaned = rawStart.replace('Z', '');
      const y = cleaned.substring(0, 4);
      const m = cleaned.substring(4, 6);
      const d = cleaned.substring(6, 8);
      date = `${y}-${m}-${d}`;
      if (cleaned.includes('T')) {
        const timePart = cleaned.split('T')[1];
        if (timePart.length >= 4) {
          time = `${timePart.substring(0, 2)}:${timePart.substring(2, 4)}`;
        }
      }
    }

    if (summary.includes('🎂') || summary.toLowerCase().includes('birthday')) {
      birthdays.push({
        name: summary.replace('🎂', '').replace(/'s Birthday/i, '').trim(),
        birthDate: date,
        notes: description,
        reminderDays: [7, 1, 0],
      });
    } else {
      events.push({
        title: summary,
        date,
        time,
        description,
        location,
        priority: 'medium',
        repeat: 'none',
      });
    }
  }

  return { events, birthdays };
}

export function generateCSV(items: { events: PlanEvent[]; tasks: Task[]; birthdays: Birthday[] }): string {
  const rows: string[] = ['Type,Title/Name,Date,Time,Priority/Age,Details'];

  for (const e of items.events) {
    rows.push(`"Plan","${e.title}","${e.date}","${e.time || ''}","${e.priority}","${(e.description || '').replace(/"/g, '""')}"`);
  }
  for (const t of items.tasks) {
    rows.push(`"Task","${t.title}","${t.date || ''}","${t.time || ''}","${t.priority}","${t.isCompleted ? 'Completed' : 'Pending'}"`);
  }
  for (const b of items.birthdays) {
    rows.push(`"Birthday","${b.name}","${b.birthDate}","","${b.birthYear || ''}","${(b.notes || '').replace(/"/g, '""')}"`);
  }

  return rows.join('\n');
}

export function parseCSV(csvText: string): { events: Partial<PlanEvent>[]; tasks: Partial<Task>[]; birthdays: Partial<Birthday>[] } {
  const events: Partial<PlanEvent>[] = [];
  const tasks: Partial<Task>[] = [];
  const birthdays: Partial<Birthday>[] = [];

  const lines = csvText.split('\n').filter((l) => l.trim().length > 0);
  const dataLines = lines.slice(1);

  for (const line of dataLines) {
    // Basic CSV splitting
    const cols = line.split(',').map((c) => c.replace(/^"|"$/g, '').trim());
    const [type, title, date, time, extra1, extra2] = cols;

    if (!title) continue;

    if (type?.toLowerCase() === 'plan') {
      events.push({
        title,
        date: date || new Date().toISOString().split('T')[0],
        time: time || undefined,
        priority: (extra1 as any) || 'medium',
        description: extra2,
        repeat: 'none',
      });
    } else if (type?.toLowerCase() === 'task') {
      tasks.push({
        title,
        date: date || undefined,
        time: time || undefined,
        priority: (extra1 as any) || 'medium',
        isCompleted: extra2?.toLowerCase() === 'completed',
      });
    } else if (type?.toLowerCase() === 'birthday') {
      birthdays.push({
        name: title,
        birthDate: date || '2000-01-01',
        birthYear: extra1 ? parseInt(extra1, 10) : undefined,
        notes: extra2,
        reminderDays: [7, 1, 0],
      });
    }
  }

  return { events, tasks, birthdays };
}

export function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

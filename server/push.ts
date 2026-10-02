import fs from 'fs';
import path from 'path';
import webpush from 'web-push';
import { db, PushSubscriptionItem } from './db';

const DATA_DIR = path.resolve('data');
const VAPID_FILE = path.join(DATA_DIR, 'vapid.json');

interface VapidKeys {
  publicKey: string;
  privateKey: string;
}

let vapidKeys: VapidKeys;

function initVapid() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(VAPID_FILE)) {
    try {
      vapidKeys = JSON.parse(fs.readFileSync(VAPID_FILE, 'utf-8'));
    } catch (err) {
      vapidKeys = webpush.generateVAPIDKeys();
      fs.writeFileSync(VAPID_FILE, JSON.stringify(vapidKeys, null, 2));
    }
  } else {
    vapidKeys = webpush.generateVAPIDKeys();
    fs.writeFileSync(VAPID_FILE, JSON.stringify(vapidKeys, null, 2));
  }

  webpush.setVapidDetails(
    'mailto:notifications@personal-life-assistant.app',
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
}

initVapid();

export function getVapidPublicKey(): string {
  return vapidKeys.publicKey;
}

export async function sendPush(
  sub: PushSubscriptionItem,
  payload: { title: string; body: string; url?: string; icon?: string; tag?: string }
): Promise<boolean> {
  try {
    const pushSub = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
      },
    };

    const stringified = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icon.svg',
      badge: '/icon.svg',
      data: {
        url: payload.url || '/',
      },
      tag: payload.tag || 'general-notification',
    });

    await webpush.sendNotification(pushSub, stringified);
    return true;
  } catch (err: any) {
    if (err.statusCode === 404 || err.statusCode === 410) {
      // Subscription expired or unsubscribed
      db.removePushSubscription(sub.endpoint);
    } else {
      console.warn('Push notification delivery error:', err.message || err);
    }
    return false;
  }
}

export async function sendTestNotification(userId: string): Promise<{ success: boolean; count: number }> {
  const subscriptions = db.getPushSubscriptions(userId);
  if (subscriptions.length === 0) {
    return { success: false, count: 0 };
  }

  let sentCount = 0;
  for (const sub of subscriptions) {
    const ok = await sendPush(sub, {
      title: 'Personal Life Assistant',
      body: 'Web Push notifications are successfully active! You will receive timely alerts for your plans and birthdays.',
      url: '/',
      tag: 'test-notification',
    });
    if (ok) sentCount++;
  }

  db.createNotification(userId, {
    title: '🔔 Test Notification Sent',
    message: 'Push notification was sent to your browser.',
    type: 'system',
    isRead: false,
    link: '/settings',
  });

  return { success: sentCount > 0, count: sentCount };
}

// Background reminder scheduler
let schedulerInterval: NodeJS.Timeout | null = null;

export function startNotificationScheduler() {
  if (schedulerInterval) return;

  schedulerInterval = setInterval(async () => {
    try {
      checkAndSendDueReminders();
    } catch (err) {
      console.error('Scheduler tick error:', err);
    }
  }, 30000); // Check every 30 seconds
}

async function checkAndSendDueReminders() {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const allSubs = db.getPushSubscriptions();
  if (allSubs.length === 0) return;

  // Group subs by userId
  const userSubs = new Map<string, PushSubscriptionItem[]>();
  for (const s of allSubs) {
    const list = userSubs.get(s.userId) || [];
    list.push(s);
    userSubs.set(s.userId, list);
  }

  for (const [userId, subs] of userSubs.entries()) {
    const events = db.getEvents(userId);
    const tasks = db.getTasks(userId);
    const birthdays = db.getBirthdays(userId);

    // Check today's events at matching time
    for (const evt of events) {
      if (evt.date === todayStr && evt.time) {
        // e.g. remind at event time or with reminder offset
        if (evt.time === currentTimeStr) {
          for (const sub of subs) {
            await sendPush(sub, {
              title: `📌 ${evt.title}`,
              body: evt.description || `Scheduled plan at ${evt.time}`,
              url: '/plans',
              tag: `evt-${evt.id}-${todayStr}`,
            });
          }
        }
      }
    }

    // Check today's birthdays at 09:00 morning
    if (currentTimeStr === '09:00') {
      for (const bday of birthdays) {
        if (bday.birthDate.endsWith(todayStr.slice(4))) {
          for (const sub of subs) {
            await sendPush(sub, {
              title: `🎂 Today is ${bday.name}'s Birthday!`,
              body: `Don't forget to congratulate them!`,
              url: '/birthdays',
              tag: `bday-${bday.id}-${todayStr}`,
            });
          }
        }
      }
    }
  }
}

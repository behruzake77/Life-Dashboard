/**
 * Browser Notification API wrapper.
 * Requests permission and sends OS-level notifications.
 */

const SETTINGS_KEY = 'life_os_settings';

export function isNotificationsEnabled(): boolean {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return true;
    const s = JSON.parse(raw);
    return s.pushNotifications !== false;
  } catch {
    return true;
  }
}

export function getPermission(): NotificationPermission | null {
  if (!('Notification' in window)) return null;
  return Notification.permission;
}

/**
 * Request browser notification permission.
 * Returns the resulting permission state.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | null> {
  if (!('Notification' in window)) return null;
  if (Notification.permission === 'granted') return 'granted';
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    return null;
  }
}

interface NotifyOptions {
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  silent?: boolean;
}

/**
 * Send a native OS notification.
 * Silently does nothing if permission isn't granted or setting is off.
 */
export function notify(title: string, options: NotifyOptions = {}): void {
  if (!isNotificationsEnabled()) return;
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      silent: false,
      ...options,
    });
  } catch {
    // Some browsers restrict Notification in certain contexts — fail silently
  }
}

// ─── Predefined notifications ────────────────────────────────────────────────

export function notifyPomodoroComplete(mode: 'focus' | 'short_break' | 'long_break'): void {
  if (mode === 'focus') {
    notify('🎯 Fokus seansi yakunlandi!', {
      body: 'Ajoyib ish! Endi tanaffus qilib oling.',
      tag: 'pomodoro-complete',
    });
  } else {
    notify('⏰ Tanaffus tugadi!', {
      body: 'Qaytib ishlashga tayyor bo\'lish vaqti keldi.',
      tag: 'pomodoro-break-end',
    });
  }
}

export function notifyTaskComplete(taskTitle: string): void {
  notify('✅ Vazifa bajarildi!', {
    body: taskTitle,
    tag: `task-${taskTitle}`,
  });
}

export function notifyHabitDone(habitName: string): void {
  notify('🔥 Odat bajarildi!', {
    body: `"${habitName}" — streak davom etmoqda!`,
    tag: `habit-${habitName}`,
  });
}

export function notifyDailyReminder(): void {
  notify('📋 Bugungi vazifalaringiz sizni kutmoqda!', {
    body: 'Ultimate Life OS — maqsadlaringizga yaqinlashmoqda.',
    tag: 'daily-reminder',
  });
}

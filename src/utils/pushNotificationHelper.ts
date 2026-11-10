// src/utils/pushNotificationHelper.ts
// Native Web Push & PWA Notification Engine for ProAnaliz AI.

const NOTIF_STORAGE_KEY = 'proanaliz_push_notif_enabled';

export function isPushNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function isPushNotificationEnabled(): boolean {
  if (!isPushNotificationSupported()) return false;
  try {
    const pref = localStorage.getItem(NOTIF_STORAGE_KEY);
    return pref === 'true' && Notification.permission === 'granted';
  } catch {
    return false;
  }
}

export async function requestPushNotificationPermission(): Promise<boolean> {
  if (!isPushNotificationSupported()) return false;

  try {
    const perm = await Notification.requestPermission();
    const granted = perm === 'granted';
    try {
      localStorage.setItem(NOTIF_STORAGE_KEY, granted ? 'true' : 'false');
    } catch {}

    if (granted) {
      sendNativePushNotification('⚽ ProAnaliz AI Gol Bildirimleri Aktif!', {
        body: 'Canlı maçlarda gol olduğunda ve favori maçlarınızda anlık bildirim alacaksınız.',
        icon: '/icons/icon-192.png',
        tag: 'proanaliz-welcome'
      });
    }

    return granted;
  } catch (err) {
    console.warn('Bildirim izni hatası:', err);
    return false;
  }
}

export function setPushNotificationEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(NOTIF_STORAGE_KEY, enabled ? 'true' : 'false');
  } catch {}
}

export function sendNativePushNotification(title: string, options?: NotificationOptions): void {
  if (!isPushNotificationSupported()) return;
  if (Notification.permission !== 'granted') return;

  try {
    const pref = localStorage.getItem(NOTIF_STORAGE_KEY);
    if (pref === 'false') return;

    const notifOptions: NotificationOptions = {
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      silent: false,
      ...options
    };

    // If ServiceWorker registration is available, prefer registration.showNotification
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, notifOptions);
      }).catch(() => {
        new Notification(title, notifOptions);
      });
    } else {
      new Notification(title, notifOptions);
    }
  } catch (e) {
    console.warn('Native bildirim gönderilemedi:', e);
  }
}

// src/utils/authHelper.ts
// Frontend authentication, VIP session management and Admin API

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  isVip: boolean;
  vipPlan?: string | null;
  vipExpiresAt?: number | null;
  createdAt?: number;
}

const TOKEN_KEY = 'proanaliz_auth_token';
const USER_KEY = 'proanaliz_auth_user';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveAuthSession(token: string, user: User): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {}
}

export function clearAuthSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {}
}

export async function fetchCurrentUser(): Promise<User | null> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const res = await fetch('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!res.ok) {
      if (res.status === 401) {
        clearAuthSession();
      }
      return null;
    }
    const data = await res.json();
    if (data.success && data.user) {
      saveAuthSession(token, data.user);
      return data.user;
    }
    return null;
  } catch {
    return getStoredUser();
  }
}

export async function loginUserApi(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Giriş yapılamadı.' };
    }
    saveAuthSession(data.token, data.user);
    return { success: true, user: data.user };
  } catch (err: any) {
    return { success: false, error: 'Sunucuya bağlanırken bir hata oluştu.' };
  }
}

export async function registerUserApi(name: string, email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Kayıt işlemi başarısız.' };
    }
    saveAuthSession(data.token, data.user);
    return { success: true, user: data.user };
  } catch (err: any) {
    return { success: false, error: 'Sunucuya bağlanırken bir hata oluştu.' };
  }
}

export async function activateVipApi(planDays: number = 30, planName: string = 'Aylık VIP'): Promise<{ success: boolean; user?: User; error?: string }> {
  const token = getStoredToken();
  if (!token) return { success: false, error: 'Önce giriş yapmalısınız.' };

  try {
    const res = await fetch('/api/auth/vip-activate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ planDays, planName })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'VIP aktivasyonu başarısız.' };
    }
    if (data.token) {
      saveAuthSession(data.token, data.user);
    }
    return { success: true, user: data.user };
  } catch (err: any) {
    return { success: false, error: 'Bağlantı hatası oluştu.' };
  }
}

export async function redeemPromoCodeApi(code: string): Promise<{ success: boolean; user?: User; error?: string }> {
  const token = getStoredToken();
  if (!token) return { success: false, error: 'Önce giriş yapmalısınız.' };

  try {
    const res = await fetch('/api/auth/redeem-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ code })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Kod geçersiz.' };
    }
    if (data.token) {
      saveAuthSession(data.token, data.user);
    }
    return { success: true, user: data.user };
  } catch (err: any) {
    return { success: false, error: 'Bağlantı hatası oluştu.' };
  }
}

// --- 🛡️ Admin API Methods ---

export async function fetchAdminStatsApi(): Promise<{ success: boolean; stats?: any; error?: string }> {
  const token = getStoredToken();
  if (!token) return { success: false, error: 'Yetki yok.' };
  try {
    const res = await fetch('/api/admin/stats', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return await res.json();
  } catch {
    return { success: false, error: 'İstatistikler alınamadı.' };
  }
}

export async function fetchAdminUsersApi(): Promise<{ success: boolean; users?: User[]; error?: string }> {
  const token = getStoredToken();
  if (!token) return { success: false, error: 'Yetki yok.' };
  try {
    const res = await fetch('/api/admin/users', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return await res.json();
  } catch {
    return { success: false, error: 'Kullanıcılar alınamadı.' };
  }
}

export async function updateUserVipApi(userId: string, planDays: number = 30, planName: string = 'Yönetici VIP'): Promise<{ success: boolean; user?: User; error?: string }> {
  const token = getStoredToken();
  if (!token) return { success: false, error: 'Yetki yok.' };
  try {
    const res = await fetch(`/api/admin/users/${userId}/vip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ planDays, planName })
    });
    return await res.json();
  } catch {
    return { success: false, error: 'VIP güncellenemedi.' };
  }
}

export async function updateUserRoleApi(userId: string, role: 'admin' | 'user'): Promise<{ success: boolean; user?: User; error?: string }> {
  const token = getStoredToken();
  if (!token) return { success: false, error: 'Yetki yok.' };
  try {
    const res = await fetch(`/api/admin/users/${userId}/role`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ role })
    });
    return await res.json();
  } catch {
    return { success: false, error: 'Rol güncellenemedi.' };
  }
}

export async function deleteUserApi(userId: string): Promise<{ success: boolean; error?: string }> {
  const token = getStoredToken();
  if (!token) return { success: false, error: 'Yetki yok.' };
  try {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    return await res.json();
  } catch {
    return { success: false, error: 'Kullanıcı silinemedi.' };
  }
}

export async function fetchAdminPromosApi(): Promise<{ success: boolean; promos?: any[]; error?: string }> {
  const token = getStoredToken();
  if (!token) return { success: false, error: 'Yetki yok.' };
  try {
    const res = await fetch('/api/admin/promos', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return await res.json();
  } catch {
    return { success: false, error: 'Promosyon kodları alınamadı.' };
  }
}

export async function createPromoCodeApi(code: string, days: number = 7, label: string = 'Özel Kampanya'): Promise<{ success: boolean; promo?: any; error?: string }> {
  const token = getStoredToken();
  if (!token) return { success: false, error: 'Yetki yok.' };
  try {
    const res = await fetch('/api/admin/promos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ code, days, label })
    });
    return await res.json();
  } catch {
    return { success: false, error: 'Promosyon kodu oluşturulamadı.' };
  }
}

export async function deletePromoCodeApi(code: string): Promise<{ success: boolean; error?: string }> {
  const token = getStoredToken();
  if (!token) return { success: false, error: 'Yetki yok.' };
  try {
    const res = await fetch(`/api/admin/promos/${code}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    return await res.json();
  } catch {
    return { success: false, error: 'Promosyon kodu silinemedi.' };
  }
}

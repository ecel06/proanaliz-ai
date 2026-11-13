// src/utils/authHelper.ts
// Frontend authentication, VIP session management and Admin API

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  preferredInterest?: 'football' | 'horses' | 'stocks' | null;
  authProvider?: 'local' | 'google' | 'whatsapp_otp';
  role: 'admin' | 'user';
  isVip: boolean;
  vipPlan?: string | null;
  vipExpiresAt?: number | null;
  createdAt?: number;
}

export interface EditorMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  matchTime: string;
  matchDate: string;
  prediction: string;
  odds: number;
  confidence: number;
  reason?: string;
}

export interface EditorCoupon {
  id: string;
  title: string;
  subtitle: string;
  category: 'football' | 'horses' | 'stocks';
  confidence: number;
  totalOdds: number;
  isVipOnly: boolean;
  status: 'pending' | 'won' | 'lost';
  author: string;
  createdAt: number;
  matches: EditorMatch[];
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

export async function registerUserApi(name: string, email: string, password: string, phone?: string): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, phone })
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

export async function googleAuthApi(params: { email: string; name?: string; phone?: string; sub?: string }): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Google ile giriş başarısız.' };
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

export async function updateUserDetailsApi(userId: string, data: { name?: string; phone?: string; planDays?: number; planName?: string }): Promise<{ success: boolean; user?: User; error?: string }> {
  const token = getStoredToken();
  if (!token) return { success: false, error: 'Yetki yok.' };
  try {
    const res = await fetch(`/api/admin/users/${userId}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    return await res.json();
  } catch {
    return { success: false, error: 'Kullanıcı güncellenemedi.' };
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

// --- WhatsApp / SMS OTP Helpers ---
export async function requestOtpApi(phone: string): Promise<{ success: boolean; message?: string; code?: string; error?: string }> {
  try {
    const res = await fetch('/api/auth/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
    return await res.json();
  } catch {
    return { success: false, error: 'Doğrulama kodu gönderilemedi. Sunucu bağlantınızı kontrol edin.' };
  }
}

export async function verifyOtpApi(phone: string, code: string): Promise<{ success: boolean; user?: User; token?: string; isNew?: boolean; error?: string }> {
  try {
    const res = await fetch('/api/auth/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code })
    });
    const data = await res.json();
    if (data.success && data.token && data.user) {
      saveAuthSession(data.token, data.user);
    }
    return data;
  } catch {
    return { success: false, error: 'Giriş doğrulanamadı.' };
  }
}

// --- User Preference Update (Onboarding) ---
export async function updateUserPreferenceApi(preference: 'football' | 'horses' | 'stocks'): Promise<{ success: boolean; user?: User; error?: string }> {
  const token = getStoredToken();
  if (!token) return { success: false, error: 'Giriş yapılmamış.' };
  try {
    const res = await fetch('/api/user/preference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ preference })
    });
    const data = await res.json();
    if (data.success && data.user) {
      saveAuthSession(token, data.user);
    }
    return data;
  } catch {
    return { success: false, error: 'Tercih kaydedilemedi.' };
  }
}

// --- Editor Curated Coupons API ---
export async function fetchEditorCouponsApi(): Promise<{ success: boolean; coupons?: EditorCoupon[]; error?: string }> {
  try {
    const res = await fetch('/api/editor-coupons');
    return await res.json();
  } catch {
    return { success: false, error: 'Yönetici kuponları alınamadı.' };
  }
}

export async function saveEditorCouponApi(coupon: Partial<EditorCoupon>): Promise<{ success: boolean; coupon?: EditorCoupon; error?: string }> {
  const token = getStoredToken();
  if (!token) return { success: false, error: 'Yetki yok.' };
  try {
    const res = await fetch('/api/admin/editor-coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(coupon)
    });
    return await res.json();
  } catch {
    return { success: false, error: 'Kupon kaydedilemedi.' };
  }
}

export async function deleteEditorCouponApi(couponId: string): Promise<{ success: boolean; error?: string }> {
  const token = getStoredToken();
  if (!token) return { success: false, error: 'Yetki yok.' };
  try {
    const res = await fetch(`/api/admin/editor-coupons/${couponId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    return await res.json();
  } catch {
    return { success: false, error: 'Kupon silinemedi.' };
  }
}

// --- Services Health API ---
export async function fetchServicesHealthApi(): Promise<{ success: boolean; health?: any; error?: string }> {
  const token = getStoredToken();
  if (!token) return { success: false, error: 'Yetki yok.' };
  try {
    const res = await fetch('/api/admin/services-health', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return await res.json();
  } catch {
    return { success: false, error: 'Sistem sağlık verisi alınamadı.' };
  }
}

// --- Member Profile Update API ---
export async function updateOwnProfileApi(data: { name?: string; phone?: string; currentPassword?: string; newPassword?: string }): Promise<{ success: boolean; user?: User; error?: string }> {
  const token = getStoredToken();
  if (!token) return { success: false, error: 'Giriş yapılmamış.' };
  try {
    const res = await fetch('/api/user/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (result.success && result.user) {
      saveAuthSession(token, result.user);
    }
    return result;
  } catch {
    return { success: false, error: 'Profil güncellenemedi.' };
  }
}

// --- Site-Wide Announcement API ---
export interface SiteAnnouncement {
  enabled: boolean;
  text: string;
  variant: 'gold' | 'emerald' | 'rose' | 'blue';
  link?: string;
  updatedAt?: number;
}

export async function fetchAnnouncementApi(): Promise<{ success: boolean; announcement?: SiteAnnouncement; error?: string }> {
  try {
    const res = await fetch('/api/announcement');
    return await res.json();
  } catch {
    return { success: false, error: 'Duyuru alınamadı.' };
  }
}

export async function saveAnnouncementApi(announcement: SiteAnnouncement): Promise<{ success: boolean; announcement?: SiteAnnouncement; error?: string }> {
  const token = getStoredToken();
  if (!token) return { success: false, error: 'Yetki yok.' };
  try {
    const res = await fetch('/api/admin/announcement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(announcement)
    });
    return await res.json();
  } catch {
    return { success: false, error: 'Duyuru kaydedilemedi.' };
  }
}

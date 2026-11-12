// server/userService.js
// Secure, lightweight, zero-dependency User Authentication & VIP Subscription Engine
// Built with Node.js native crypto (scrypt password hashing & HMAC-SHA256 stateless session tokens)

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

const JWT_SECRET = process.env.JWT_SECRET || 'proanaliz-ai-master-auth-secret-key-2026';

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory cache synced with users.json
let usersMap = new Map();

function seedDefaultAdmin() {
  const adminEmail = 'admin@proanaliz.ai';
  let found = false;
  for (const u of usersMap.values()) {
    if (u.email && u.email.toLowerCase() === adminEmail) {
      found = true;
      // Ensure always admin and VIP
      u.role = 'admin';
      u.isVip = true;
      u.vipPlan = 'Kurucu Yönetici VIP';
      u.vipExpiresAt = Date.now() + 365 * 24 * 60 * 60 * 1000;
      break;
    }
  }

  if (!found) {
    const adminUser = {
      id: 'usr_master_admin_001',
      name: 'Yönetici',
      email: adminEmail,
      phone: '05550000000',
      authProvider: 'local',
      passwordHash: hashPassword('Password123!'),
      role: 'admin',
      isVip: true,
      vipPlan: 'Kurucu Yönetici VIP',
      vipExpiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
    };
    usersMap.set(adminUser.id, adminUser);
    saveUsers();
    console.log('[UserService] Master admin permanently seeded: admin@proanaliz.ai');
  }
}

function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, 'utf-8');
      const list = JSON.parse(raw);
      usersMap = new Map();
      for (const u of list) {
        usersMap.set(u.id, u);
      }
    }
  } catch (err) {
    console.error('[UserService] Error loading users:', err);
    usersMap = new Map();
  }
  // Guarantee master admin exists at all times across container reboots
  seedDefaultAdmin();
}

function saveUsers() {
  try {
    const list = Array.from(usersMap.values());
    fs.writeFileSync(USERS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('[UserService] Error saving users:', err);
  }
}

// Load on start
loadUsers();

// --- Crypto Utilities ---
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, originalHash] = stored.split(':');
  const checkHash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(checkHash, 'hex'), Buffer.from(originalHash, 'hex'));
}

function createToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');

  if (signature !== expectedSig) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (payload.exp && Date.now() > payload.exp) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}

function sanitizeUser(user) {
  if (!user) return null;
  const now = Date.now();
  const isVipActive = Boolean(user.isVip && (!user.vipExpiresAt || user.vipExpiresAt > now));
  
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || null,
    authProvider: user.authProvider || 'local',
    role: user.role || 'user',
    isVip: isVipActive,
    vipPlan: isVipActive ? user.vipPlan : null,
    vipExpiresAt: isVipActive ? user.vipExpiresAt : null,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  };
}

// --- Public Auth Methods ---

export function registerUser({ name, email, password, phone }) {
  if (!email || !password || !name) {
    return { success: false, error: 'Tüm zorunlu alanları doldurunuz.' };
  }
  const cleanEmail = String(email).trim().toLowerCase();
  const cleanName = String(name).trim();
  const cleanPhone = phone ? String(phone).replace(/[^\d+]/g, '').trim() : null;

  if (cleanName.length < 2) {
    return { success: false, error: 'Ad soyad en az 2 karakter olmalıdır.' };
  }
  if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    return { success: false, error: 'Geçerli bir e-posta adresi giriniz.' };
  }
  if (password.length < 6) {
    return { success: false, error: 'Şifreniz en az 6 karakter olmalıdır.' };
  }
  if (cleanPhone && cleanPhone.length < 10) {
    return { success: false, error: 'Lütfen geçerli bir telefon numarası giriniz (en az 10 hane).' };
  }

  // Check unique email
  for (const existing of usersMap.values()) {
    if (existing.email && existing.email.toLowerCase() === cleanEmail) {
      return { success: false, error: 'Bu e-posta adresiyle zaten kayıt olunmuş.' };
    }
  }

  const userId = `usr_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const isFirstUser = usersMap.size === 0;

  // New registrations receive automatic 7-day VIP trial (first user gets 1-year Creator/Admin VIP)
  const isVip = true;
  const vipPlan = isFirstUser ? 'Kurucu Yönetici VIP' : '7 Günlük Deneme VIP';
  const vipExpiresAt = isFirstUser
    ? Date.now() + 365 * 24 * 60 * 60 * 1000
    : Date.now() + 7 * 24 * 60 * 60 * 1000;

  const newUser = {
    id: userId,
    name: cleanName,
    email: cleanEmail,
    phone: cleanPhone,
    authProvider: 'local',
    passwordHash: hashPassword(password),
    role: isFirstUser ? 'admin' : 'user',
    isVip,
    vipPlan,
    vipExpiresAt,
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
  };

  usersMap.set(userId, newUser);
  saveUsers();

  const safeUser = sanitizeUser(newUser);
  const token = createToken({ id: safeUser.id, email: safeUser.email, role: safeUser.role, isVip: safeUser.isVip });

  return { success: true, token, user: safeUser };
}

export function googleAuth({ email, name, phone, sub }) {
  if (!email) {
    return { success: false, error: 'Google e-posta bilgisi alınamadı.' };
  }
  const cleanEmail = String(email).trim().toLowerCase();
  const cleanName = String(name || cleanEmail.split('@')[0]).trim();
  const cleanPhone = phone ? String(phone).replace(/[^\d+]/g, '').trim() : null;

  let existing = null;
  for (const u of usersMap.values()) {
    if (u.email && u.email.toLowerCase() === cleanEmail) {
      existing = u;
      break;
    }
  }

  if (existing) {
    existing.lastLoginAt = Date.now();
    if (cleanPhone && !existing.phone) existing.phone = cleanPhone;
    saveUsers();
    const safeUser = sanitizeUser(existing);
    const token = createToken({ id: safeUser.id, email: safeUser.email, role: safeUser.role, isVip: safeUser.isVip });
    return { success: true, token, user: safeUser, isNew: false };
  }

  // Create new user from Google signup
  const userId = `usr_g_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const isFirstUser = usersMap.size === 0;
  const isVip = true; // Welcome 7-day VIP for new registrations
  const vipPlan = isFirstUser ? 'Kurucu Yönetici VIP' : '7 Günlük Deneme VIP';
  const vipExpiresAt = isFirstUser
    ? Date.now() + 365 * 24 * 60 * 60 * 1000
    : Date.now() + 7 * 24 * 60 * 60 * 1000;

  const newUser = {
    id: userId,
    name: cleanName,
    email: cleanEmail,
    phone: cleanPhone,
    authProvider: 'google',
    googleId: sub || null,
    passwordHash: null,
    role: isFirstUser ? 'admin' : 'user',
    isVip,
    vipPlan,
    vipExpiresAt,
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
  };

  usersMap.set(userId, newUser);
  saveUsers();

  const safeUser = sanitizeUser(newUser);
  const token = createToken({ id: safeUser.id, email: safeUser.email, role: safeUser.role, isVip: safeUser.isVip });
  return { success: true, token, user: safeUser, isNew: true };
}

export function loginUser({ email, password }) {
  if (!email || !password) {
    return { success: false, error: 'E-posta ve şifrenizi giriniz.' };
  }
  const cleanEmail = String(email).trim().toLowerCase();

  let targetUser = null;
  for (const u of usersMap.values()) {
    if (u.email.toLowerCase() === cleanEmail) {
      targetUser = u;
      break;
    }
  }

  if (!targetUser) {
    return { success: false, error: 'Kullanıcı bulunamadı. Lütfen e-postanızı kontrol edin.' };
  }

  const isValid = verifyPassword(password, targetUser.passwordHash);
  if (!isValid) {
    return { success: false, error: 'Hatalı şifre girdiniz.' };
  }

  // Check VIP expiration
  if (targetUser.isVip && targetUser.vipExpiresAt && Date.now() > targetUser.vipExpiresAt) {
    targetUser.isVip = false;
    targetUser.vipPlan = null;
  }

  targetUser.lastLoginAt = Date.now();
  saveUsers();

  const safeUser = sanitizeUser(targetUser);
  const token = createToken({ id: safeUser.id, email: safeUser.email, role: safeUser.role, isVip: safeUser.isVip });

  return { success: true, token, user: safeUser };
}

export function getUserById(userId) {
  const user = usersMap.get(userId);
  if (!user) return null;
  return sanitizeUser(user);
}

export function activateUserVip(userId, planDays = 30, planName = 'Aylık VIP') {
  const user = usersMap.get(userId);
  if (!user) return { success: false, error: 'Kullanıcı bulunamadı.' };

  const currentExpiry = user.vipExpiresAt && user.vipExpiresAt > Date.now() ? user.vipExpiresAt : Date.now();
  const newExpiry = currentExpiry + planDays * 24 * 60 * 60 * 1000;

  user.isVip = true;
  user.vipPlan = planName;
  user.vipExpiresAt = newExpiry;
  saveUsers();

  const safe = sanitizeUser(user);
  const token = createToken({ id: safe.id, email: safe.email, role: safe.role, isVip: true });

  return { success: true, user: safe, token };
}

// Promo codes for promotion, launch testing or gift campaigns
const promoCodesMap = new Map([
  ['PRO2026', { code: 'PRO2026', days: 7, label: '7 Günlük Tanıtım VIP', createdBy: 'system' }],
  ['HOSGELDIN', { code: 'HOSGELDIN', days: 3, label: '3 Günlük Deneme VIP', createdBy: 'system' }],
  ['KRALVIP', { code: 'KRALVIP', days: 30, label: '30 Günlük VIP Kampanya', createdBy: 'system' }],
]);

export function redeemPromoCode(userId, code) {
  const cleanCode = String(code || '').trim().toUpperCase();
  const promo = promoCodesMap.get(cleanCode);

  if (!promo) {
    return { success: false, error: 'Geçersiz veya süresi dolmuş promosyon kodu.' };
  }

  return activateUserVip(userId, promo.days, promo.label);
}

// --- Admin Management Methods ---

export function getAllUsers() {
  return Array.from(usersMap.values()).map(sanitizeUser);
}

export function updateUserVip(userId, planDays = 30, planName = 'Yönetici VIP') {
  return activateUserVip(userId, planDays, planName);
}

export function updateUserDetails(userId, { name, phone, planDays, planName }) {
  const user = usersMap.get(userId);
  if (!user) return { success: false, error: 'Kullanıcı bulunamadı.' };

  if (name && String(name).trim().length >= 2) {
    user.name = String(name).trim();
  }
  if (phone !== undefined) {
    user.phone = phone ? String(phone).replace(/[^\d+]/g, '').trim() : null;
  }
  if (planDays) {
    const currentExpiry = user.vipExpiresAt && user.vipExpiresAt > Date.now() ? user.vipExpiresAt : Date.now();
    user.vipExpiresAt = currentExpiry + Number(planDays) * 24 * 60 * 60 * 1000;
    user.isVip = true;
    if (planName) user.vipPlan = planName;
  }
  saveUsers();
  return { success: true, user: sanitizeUser(user) };
}

export function updateUserRole(userId, newRole = 'user') {
  const user = usersMap.get(userId);
  if (!user) return { success: false, error: 'Kullanıcı bulunamadı.' };

  user.role = newRole === 'admin' ? 'admin' : 'user';
  saveUsers();
  return { success: true, user: sanitizeUser(user) };
}

export function deleteUser(userId) {
  const user = usersMap.get(userId);
  if (!user) return { success: false, error: 'Kullanıcı bulunamadı.' };

  usersMap.delete(userId);
  saveUsers();
  return { success: true, message: 'Kullanıcı silindi.' };
}

export function getPromoCodesList() {
  return Array.from(promoCodesMap.values());
}

export function createPromoCode(code, days = 7, label = 'Özel Kampanya') {
  const cleanCode = String(code || '').trim().toUpperCase();
  if (!cleanCode || cleanCode.length < 3) {
    return { success: false, error: 'Kod en az 3 karakter olmalıdır.' };
  }
  const item = { code: cleanCode, days: Number(days) || 7, label, createdBy: 'admin' };
  promoCodesMap.set(cleanCode, item);
  return { success: true, promo: item };
}

export function deletePromoCode(code) {
  const cleanCode = String(code || '').trim().toUpperCase();
  if (!promoCodesMap.has(cleanCode)) {
    return { success: false, error: 'Kod bulunamadı.' };
  }
  promoCodesMap.delete(cleanCode);
  return { success: true, message: 'Kod silindi.' };
}

export function getAdminStats() {
  const all = Array.from(usersMap.values());
  const now = Date.now();
  const totalUsers = all.length;
  const vipUsers = all.filter(u => u.isVip && (!u.vipExpiresAt || u.vipExpiresAt > now)).length;
  const adminUsers = all.filter(u => u.role === 'admin').length;
  return {
    totalUsers,
    vipUsers,
    adminUsers,
    totalPromoCodes: promoCodesMap.size,
    serverUptime: process.uptime(),
    timestamp: now,
  };
}

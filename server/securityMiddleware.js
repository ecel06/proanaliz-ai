// server/securityMiddleware.js
// Enterprise Zero-Dependency Security Shield for ProAnaliz AI
// Rate Limiting (Brute-force protection), Security Headers, CORS Policy & Audit alerts

import crypto from 'crypto';

// In-memory rate limiting stores (IP -> { count, resetTime })
const loginLimiterStore = new Map();
const registerLimiterStore = new Map();
const promoLimiterStore = new Map();
const otpLimiterStore = new Map();
const globalApiLimiterStore = new Map();

// Periodic cleanup of expired rate limit entries (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of loginLimiterStore.entries()) {
    if (now > data.resetTime) loginLimiterStore.delete(ip);
  }
  for (const [ip, data] of registerLimiterStore.entries()) {
    if (now > data.resetTime) registerLimiterStore.delete(ip);
  }
  for (const [ip, data] of promoLimiterStore.entries()) {
    if (now > data.resetTime) promoLimiterStore.delete(ip);
  }
  for (const [ip, data] of otpLimiterStore.entries()) {
    if (now > data.resetTime) otpLimiterStore.delete(ip);
  }
  for (const [ip, data] of globalApiLimiterStore.entries()) {
    if (now > data.resetTime) globalApiLimiterStore.delete(ip);
  }
}, 5 * 60 * 1000);

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || '127.0.0.1';
}

/**
 * Generic Rate Limiting Factory
 */
export function createRateLimiter({ windowMs, max, message, store }) {
  return (req, res, next) => {
    const ip = getClientIp(req);
    const now = Date.now();
    const entry = store.get(ip);

    if (!entry || now > entry.resetTime) {
      store.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (entry.count >= max) {
      const waitMinutes = Math.ceil((entry.resetTime - now) / 60000);
      return res.status(429).json({
        success: false,
        error: message || `Çok fazla istek yapıldı. Lütfen ${waitMinutes} dakika sonra tekrar deneyin.`
      });
    }

    entry.count += 1;
    next();
  };
}

// 1. Login Brute-force protection: Max 5 failed attempts per 15 minutes per IP
export const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: '🚨 Çok fazla hatalı giriş denemesi yapıldı. Güvenliğiniz için bu IP 15 dakika boyunca kilitlendi.',
  store: loginLimiterStore
});

// 2. Registration spam protection: Max 5 registrations per 1 hour per IP
export const registerRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Çok fazla üyelik açma denemesi yapıldı. Lütfen 1 saat sonra tekrar deneyin.',
  store: registerLimiterStore
});

// 3. Promo code brute-force protection: Max 5 promo checks per 5 minutes per IP
export const promoRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: 'Çok fazla promosyon kodu denemesi yapıldı. Lütfen 5 dakika bekleyin.',
  store: promoLimiterStore
});

// 4. WhatsApp OTP spam protection: Max 3 OTP per 10 minutes per IP
export const otpRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 3,
  message: 'Çok fazla SMS / OTP doğrulama kodu talep edildi. Lütfen 10 dakika bekleyin.',
  store: otpLimiterStore
});

// 5. Global API DDoS protection: Max 150 requests per minute per IP
export const globalApiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 150,
  message: 'Aşırı istek algılandı (DDoS koruması). Lütfen bir dakika bekleyin.',
  store: globalApiLimiterStore
});

/**
 * Helmet-grade HTTP Security Headers
 */
export function securityHeadersMiddleware(req, res, next) {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Prevent clickjacking via iframes
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  // XSS Auditor filter
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Force HTTPS on browsers
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  // Hide server technology
  res.removeHeader('X-Powered-By');
  next();
}

/**
 * Strict Domain CORS Guard
 */
export function corsGuardMiddleware(req, res, next) {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://proanaliz-ai.onrender.com',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000'
  ];

  // If request has origin (browser request)
  if (origin) {
    if (allowedOrigins.includes(origin) || origin.endsWith('.onrender.com')) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else {
      // Forbidden foreign origin
      return res.status(403).json({ success: false, error: 'Yetkisiz erişim kaynağı (CORS Reddedildi).' });
    }
  } else {
    // Non-browser / same-origin / health check
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
}

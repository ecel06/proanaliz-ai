// server/server.js
// ProAnaliz AI - Live Bulletin & Analytics Backend Microservice

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { fetchLiveBulletin, fetchMatchInsights, SUPPORTED_LEAGUES } from './bulletinService.js';
import {
  startFormSyncScheduler,
  getAllRealForms,
  getRealFormForTeam,
  syncAllRealForms
} from './realFormService.js';
import {
  fetchFullHorseRacingBulletin,
  fetchProgramDetail,
  fetchProgramList
} from './horseRacingService.js';
import {
  fetchStockScreener,
  fetchStockChart,
  fetchStockDeepAnalysis,
  fetchMacroOverview
} from './stockService.js';
import {
  registerUser,
  loginUser,
  googleAuth,
  getUserById,
  verifyToken,
  activateUserVip,
  redeemPromoCode,
  getAllUsers,
  updateUserVip,
  updateUserRole,
  updateUserDetails,
  deleteUser,
  getPromoCodesList,
  createPromoCode,
  deletePromoCode,
  getAdminStats,
  requestOtp,
  verifyOtp,
  updateUserPreference,
  getEditorCoupons,
  saveEditorCoupon,
  deleteEditorCoupon,
  getServicesHealth,
  updateOwnProfile,
  getAnnouncement,
  setAnnouncement,
  logActivity,
  requestPasswordReset,
  resetPasswordWithCode,
  adminResetUserPassword,
  createSupportTicket,
  getAllSupportTickets,
  getUserSupportTickets,
  updateSupportTicketStatus,
  invalidateOtherSessions,
  deleteOwnAccount
} from './userService.js';
import {
  securityHeadersMiddleware,
  corsGuardMiddleware,
  loginRateLimiter,
  registerRateLimiter,
  promoRateLimiter,
  otpRateLimiter,
  globalApiRateLimiter
} from './securityMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Enterprise Security Shield Pipeline
app.use(securityHeadersMiddleware);
app.use(corsGuardMiddleware);
app.use(globalApiRateLimiter);
app.use(express.json({ limit: '500kb' }));

// In-memory cache
let cachedBulletin = null;
let lastFetchTime = null;
let isFetching = false;

// Load pre-existing cached file if available (pick freshest/largest between public/data/bulletin.json & src/data/liveBulletin.json)
function loadLocalCache() {
  try {
    const candidates = [
      path.resolve(__dirname, '../public/data/bulletin.json'),
      path.resolve(__dirname, '../src/data/liveBulletin.json')
    ];
    let bestData = null;
    for (const filePath of candidates) {
      if (!fs.existsSync(filePath)) continue;
      try {
        const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const count = Array.isArray(parsed?.matches) ? parsed.matches.length : 0;
        const bestCount = Array.isArray(bestData?.matches) ? bestData.matches.length : 0;
        const parsedTs = parsed?.updatedAt ? new Date(parsed.updatedAt).getTime() : 0;
        const bestTs = bestData?.updatedAt ? new Date(bestData.updatedAt).getTime() : 0;
        if (count > 0 && (parsedTs > bestTs || (parsedTs === bestTs && count > bestCount))) {
          bestData = parsed;
        }
      } catch {}
    }
    if (bestData) {
      cachedBulletin = bestData;
      lastFetchTime = bestData.updatedAt;
      console.log(`📁 [Server] Yerel bülten önbellekten yüklendi (${cachedBulletin.matches?.length || 0} maç).`);
    }
  } catch (err) {
    console.error('Önbellek okuma hatası:', err.message);
  }
}

loadLocalCache();

// Helper to save cache to public & src
function persistCache(data) {
  if (!data || !data.matches || data.matches.length === 0) {
    console.warn('⚠️ [Server] Boş veri geldiği için önbellek üzerine yazılmadı.');
    return;
  }
  try {
    const publicDir = path.resolve(__dirname, '../public/data');
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
    fs.writeFileSync(path.join(publicDir, 'bulletin.json'), JSON.stringify(data, null, 2), 'utf8');

    const srcDir = path.resolve(__dirname, '../src/data');
    if (!fs.existsSync(srcDir)) fs.mkdirSync(srcDir, { recursive: true });
    fs.writeFileSync(path.join(srcDir, 'liveBulletin.json'), JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Önbellek kaydetme hatası:', err.message);
  }
}

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'ProAnaliz AI Backend',
    totalMatches: cachedBulletin?.totalMatches || 0,
    lastUpdate: lastFetchTime,
    uptimeSeconds: Math.floor(process.uptime())
  });
});

// 2. Get full bulletin with real-time live score updates
app.get('/api/bulletin', async (req, res) => {
  try {
    const now = Date.now();
    const cacheAgeMs = lastFetchTime ? (now - new Date(lastFetchTime).getTime()) : Infinity;

    // If cache is empty or older than 30 seconds, refresh live scoreboard
    if (!cachedBulletin || cacheAgeMs > 30 * 1000) {
      if (!isFetching) {
        isFetching = true;
        fetchLiveBulletin()
          .then((fresh) => {
            cachedBulletin = fresh;
            lastFetchTime = fresh.updatedAt;
            persistCache(cachedBulletin);
            isFetching = false;
          })
          .catch((err) => {
            isFetching = false;
            console.warn('Otomatik bülten yenileme uyarısı:', err.message);
          });
      }
    }
    res.json(cachedBulletin);
  } catch (err) {
    res.status(500).json({ error: 'Bülten verisi alınamadı', message: err.message });
  }
});

// 3. Force refresh bulletin endpoint
app.post('/api/bulletin/refresh', async (req, res) => {
  if (isFetching) {
    return res.status(429).json({ message: 'Bülten şu anda güncelleniyor, lütfen bekleyin...' });
  }

  try {
    isFetching = true;
    console.log('🔄 [Server] Manuel bülten yenileme tetiklendi...');
    const freshData = await fetchLiveBulletin();
    cachedBulletin = freshData;
    lastFetchTime = freshData.updatedAt;
    persistCache(cachedBulletin);
    isFetching = false;
    res.json({
      success: true,
      message: `Bülten başarıyla güncellendi! ${freshData.totalMatches} maç hazır.`,
      updatedAt: freshData.updatedAt,
      totalMatches: freshData.totalMatches,
      leagueCounts: freshData.leagueCounts
    });
  } catch (err) {
    isFetching = false;
    res.status(500).json({ error: 'Yenileme başarısız oldu', message: err.message });
  }
});

// 4. Get supported leagues and counts
app.get('/api/leagues', (req, res) => {
  res.json({
    leagues: SUPPORTED_LEAGUES,
    counts: cachedBulletin?.leagueCounts || {}
  });
});

// 5. Proxy live standings for any league with strict 3s timeout
app.get('/api/standings/:leagueCode', async (req, res) => {
  const { leagueCode } = req.params;
  try {
    const url = `https://site.api.espn.com/apis/v2/sports/soccer/${leagueCode}/standings`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(3000)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(504).json({ error: 'Standings fetch timeout/failed', message: err.message });
  }
});

// 5b. On-demand real Match Insights (H2H, Officials, Injuries, Venue, Last 5 Games)
app.get('/api/match-insights', async (req, res) => {
  const eventId = String(req.query.eventId || '');
  const league = String(req.query.league || '');
  const homeTeam = String(req.query.homeTeam || '');
  const awayTeam = String(req.query.awayTeam || '');
  try {
    const insights = await fetchMatchInsights(eventId, league, homeTeam, awayTeam);
    res.json({ success: true, insights });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5c. Live Horse Racing (TJK / Nesine) Bulletin, Program Details & Results
app.get('/api/horse-racing/bulletin', async (req, res) => {
  try {
    const programId = req.query.programId ? Number(req.query.programId) : null;
    const force = req.query.force === '1' || req.query.force === 'true';
    const data = await fetchFullHorseRacingBulletin(programId, force);
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/horse-racing/program/:programId', async (req, res) => {
  try {
    const force = req.query.force === '1' || req.query.force === 'true';
    const detail = await fetchProgramDetail(req.params.programId, force);
    if (!detail) {
      return res.status(404).json({ success: false, message: 'Program not found' });
    }
    res.json({ success: true, detail });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/horse-racing/results', async (req, res) => {
  try {
    const listData = await fetchProgramList(req.query.force === '1');
    const targetId = req.query.programId ? Number(req.query.programId) : listData.selectedProgramId;
    const detail = targetId ? await fetchProgramDetail(targetId, req.query.force === '1') : null;
    res.json({
      success: true,
      programs: listData.programs,
      selectedProgramId: targetId,
      summary: detail?.summary || null,
      races: detail?.races || [],
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5d. Live Stock Market Screener & Historical OHLCV Chart (BIST / NASDAQ / NYSE / Crypto)
app.get('/api/stocks/screener', async (req, res) => {
  try {
    const market = String(req.query.market || 'bist');
    const search = String(req.query.search || '');
    const force = req.query.force === '1' || req.query.force === 'true';
    const data = await fetchStockScreener(market, search, force);
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/stocks/chart/:symbol', async (req, res) => {
  try {
    const market = String(req.query.market || 'bist');
    const range = String(req.query.range || '6mo');
    const interval = String(req.query.interval || '1d');
    const chart = await fetchStockChart(req.params.symbol, market, range, interval);
    if (!chart) {
      return res.status(404).json({ success: false, message: 'Chart data not found' });
    }
    res.json({ success: true, chart });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/stocks/deep/:symbol', async (req, res) => {
  try {
    const market = String(req.query.market || 'bist');
    const deep = await fetchStockDeepAnalysis(req.params.symbol, market);
    if (!deep) {
      return res.status(404).json({ success: false, message: 'Deep research data not found' });
    }
    res.json({ success: true, deep });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Live Macro (Dolar, Euro, Altın, Gümüş, Borsa, Kripto) endpoint
app.get('/api/macro/live', async (req, res) => {
  try {
    const force = req.query.force === 'true';
    const items = await fetchMacroOverview(force);
    res.json({ success: true, timestamp: Date.now(), items });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- User Authentication & VIP Subscription Routes ---
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Oturum açmanız gerekiyor.' });
  }
  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ success: false, error: 'Oturum süresi dolmuş veya geçersiz.' });
  }
  req.userId = payload.id;
  next();
}

app.post('/api/auth/register', registerRateLimiter, (req, res) => {
  const result = registerUser(req.body);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

app.post('/api/auth/login', loginRateLimiter, (req, res) => {
  const result = loginUser(req.body);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

app.post('/api/auth/google', loginRateLimiter, (req, res) => {
  const result = googleAuth(req.body);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

// WhatsApp / SMS OTP endpoints
app.post('/api/auth/otp/send', otpRateLimiter, (req, res) => {
  const result = requestOtp(req.body.phone);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

app.post('/api/auth/otp/verify', (req, res) => {
  const { phone, code } = req.body;
  const result = verifyOtp(phone, code);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

// Forgot & Reset Password
app.post('/api/auth/forgot-password', otpRateLimiter, (req, res) => {
  const { identifier } = req.body;
  const result = requestPasswordReset(identifier);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

app.post('/api/auth/reset-password', (req, res) => {
  const result = resetPasswordWithCode(req.body);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

// Update user preference (onboarding selection)
app.post('/api/user/preference', authMiddleware, (req, res) => {
  const { preference } = req.body;
  const result = updateUserPreference(req.userId, preference);
  res.json(result);
});

// Update own profile (name, phone, password)
app.post('/api/user/profile', authMiddleware, (req, res) => {
  const result = updateOwnProfile(req.userId, req.body);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

// Revoke other device sessions
app.post('/api/user/invalidate-sessions', authMiddleware, (req, res) => {
  try {
    const result = invalidateOtherSessions(req.userId);
    res.json({ success: true, ...result, message: 'Diğer tüm cihazlardaki oturumlar başarıyla kapatıldı.' });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

// Self-service KVKK/GDPR Account Deletion
app.post('/api/user/delete-account', authMiddleware, (req, res) => {
  try {
    const { password } = req.body;
    const result = deleteOwnAccount(req.userId, password);
    res.json(result);
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

// User & Public Support Ticket Submission
app.post('/api/support/ticket', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let userId = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const payload = verifyToken(authHeader.substring(7));
      if (payload) userId = payload.id;
    }
    const ticket = createSupportTicket({ ...req.body, userId });
    res.json({ success: true, ticket });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

// Get user's own tickets
app.get('/api/user/support-tickets', authMiddleware, (req, res) => {
  const tickets = getUserSupportTickets(req.userId);
  res.json({ success: true, tickets });
});

// Site-Wide Announcement (Public)
app.get('/api/announcement', (req, res) => {
  res.json({ success: true, announcement: getAnnouncement() });
});

// Public / User Editor Curated Coupons
app.get('/api/editor-coupons', (req, res) => {
  const coupons = getEditorCoupons();
  res.json({ success: true, coupons });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = getUserById(req.userId);
  if (!user) {
    return res.status(404).json({ success: false, error: 'Kullanıcı bulunamadı.' });
  }
  res.json({ success: true, user });
});

app.post('/api/auth/redeem-code', authMiddleware, promoRateLimiter, (req, res) => {
  const { code } = req.body;
  const result = redeemPromoCode(req.userId, code);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

app.post('/api/auth/vip-activate', authMiddleware, (req, res) => {
  const { planDays = 30, planName = 'Aylık VIP' } = req.body;
  const result = activateUserVip(req.userId, planDays, planName);
  res.json(result);
});

// --- 🛡️ Admin Panel Endpoints (Admin Only) ---
function adminMiddleware(req, res, next) {
  authMiddleware(req, res, () => {
    const user = getUserById(req.userId);
    if (!user || user.role !== 'admin') {
      try {
        logActivity('SECURITY_ALERT', 'Engellenen yetkisiz Admin erişimi', { ip: req.ip, userId: req.userId || 'anon' });
      } catch {}
      return res.status(403).json({ success: false, error: 'Bu işlem için Yönetici (Admin) yetkisi gerekiyor.' });
    }
    req.adminUser = user;
    next();
  });
}

app.get('/api/admin/stats', adminMiddleware, (req, res) => {
  const stats = getAdminStats();
  res.json({ success: true, stats });
});

app.get('/api/admin/users', adminMiddleware, (req, res) => {
  const users = getAllUsers();
  res.json({ success: true, users });
});

app.post('/api/admin/users/:id/vip', adminMiddleware, (req, res) => {
  const { planDays = 30, planName = 'Yönetici VIP' } = req.body;
  const result = updateUserVip(req.params.id, planDays, planName);
  res.json(result);
});

app.post('/api/admin/users/:id/update', adminMiddleware, (req, res) => {
  const result = updateUserDetails(req.params.id, req.body);
  res.json(result);
});

app.post('/api/admin/users/:id/reset-password', adminMiddleware, (req, res) => {
  const { newPassword } = req.body;
  const result = adminResetUserPassword(req.userId, req.params.id, newPassword);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

app.post('/api/admin/users/:id/role', adminMiddleware, (req, res) => {
  const { role = 'user' } = req.body;
  const result = updateUserRole(req.params.id, role);
  res.json(result);
});

app.delete('/api/admin/users/:id', adminMiddleware, (req, res) => {
  const result = deleteUser(req.params.id);
  res.json(result);
});

app.get('/api/admin/promos', adminMiddleware, (req, res) => {
  const promos = getPromoCodesList();
  res.json({ success: true, promos });
});

app.post('/api/admin/promos', adminMiddleware, (req, res) => {
  const { code, days = 7, label = 'Özel Promosyon' } = req.body;
  const result = createPromoCode(code, days, label);
  res.json(result);
});

app.delete('/api/admin/promos/:code', adminMiddleware, (req, res) => {
  const result = deletePromoCode(req.params.code);
  res.json(result);
});

// Admin Editor Curated Coupons Endpoints
app.post('/api/admin/editor-coupons', adminMiddleware, (req, res) => {
  const result = saveEditorCoupon(req.body);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

app.delete('/api/admin/editor-coupons/:id', adminMiddleware, (req, res) => {
  const result = deleteEditorCoupon(req.params.id);
  if (!result.success) {
    return res.status(404).json(result);
  }
  res.json(result);
});

// Admin Live Services Health Monitor
app.get('/api/admin/services-health', adminMiddleware, (req, res) => {
  const health = getServicesHealth();
  res.json({ success: true, health });
});

// Admin Announcement Update
app.post('/api/admin/announcement', adminMiddleware, (req, res) => {
  const result = setAnnouncement(req.body);
  res.json(result);
});

// 6. Dynamic Real Team Forms endpoints (100% Real Match Results)
app.get('/api/forms', (req, res) => {
  res.json(getAllRealForms());
});

app.get('/api/form/:teamName', (req, res) => {
  const form = getRealFormForTeam(req.params.teamName);
  if (form) {
    res.json({ success: true, team: req.params.teamName, form });
  } else {
    res.status(404).json({ success: false, message: 'Team form not found' });
  }
});

app.post('/api/forms/sync', async (req, res) => {
  try {
    const data = await syncAllRealForms();
    res.json({ success: true, totalTeams: Object.keys(data).length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

function getNetworkIp() {
  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal && !iface.address.startsWith('169.254')) {
          return iface.address;
        }
      }
    }
  } catch (e) {
    console.error('IP tespit hatası:', e);
  }
  return 'localhost';
}

// Admin Support Tickets Management
app.get('/api/admin/support/tickets', adminMiddleware, (req, res) => {
  const tickets = getAllSupportTickets();
  res.json({ success: true, tickets });
});

app.post('/api/admin/support/tickets/:id/status', adminMiddleware, (req, res) => {
  try {
    const ticket = updateSupportTicketStatus(req.params.id, req.body);
    res.json({ success: true, ticket });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

// 5. Mobil ve Yerel Ağ Bağlantı Bilgisi (PWA Kurulumu için)
const APP_VERSION = '2026.11.13.12';

app.get('/api/version', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json({
    version: APP_VERSION,
    timestamp: Date.now()
  });
});

app.get('/api/network-info', (req, res) => {
  const host = req.headers['host'];
  const forwardedProto = req.headers['x-forwarded-proto'] || 'https';
  if (process.env.RENDER_EXTERNAL_URL || (host && !host.includes('localhost') && !host.includes('127.0.0.1'))) {
    const publicUrl = process.env.RENDER_EXTERNAL_URL || `${forwardedProto}://${host}`;
    return res.json({
      success: true,
      ip: host,
      port: PORT,
      networkUrl: publicUrl,
      localhostUrl: `http://localhost:${PORT}`
    });
  }

  const ip = getNetworkIp();
  res.json({
    success: true,
    ip,
    port: PORT,
    networkUrl: `http://${ip}:${PORT}`,
    localhostUrl: `http://localhost:${PORT}`
  });
});

// 6. Serve static production files from dist directory and public directory
const distPath = path.resolve(__dirname, '../dist');
const publicPath = path.resolve(__dirname, '../public');

if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
}

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    }
  }));
  // Express 5 compatible catch-all without route pattern
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      return res.sendFile(indexPath);
    }
    next();
  });
  console.log(`📦 [Server] dist klasörü statik olarak sunuluyor: ${distPath}`);
}

app.listen(PORT, '0.0.0.0', () => {
  const localIp = getNetworkIp();
  console.log(`\n==================================================`);
  console.log(`🚀 [ProAnaliz AI] Sunucu Başarıyla Başlatıldı!`);
  console.log(`💻 Bilgisayar Erişimi: http://localhost:${PORT}`);
  console.log(`📱 Cep Telefonu / Wi-Fi: http://${localIp}:${PORT}`);
  console.log(`📲 Telefonunuzdan bu adresi açıp 'Ana Ekrana Ekle' yapabilirsiniz.`);
  console.log(`==================================================\n`);
  // Start background periodic real forms sync (every 10 minutes)
  startFormSyncScheduler(10);

  // Trigger immediate startup live bulletin sync
  const runBulletinSync = async () => {
    if (isFetching) return;
    try {
      isFetching = true;
      const freshData = await fetchLiveBulletin();
      if (freshData && Array.isArray(freshData.matches) && freshData.matches.length > 0) {
        cachedBulletin = freshData;
        lastFetchTime = freshData.updatedAt;
        persistCache(cachedBulletin);
      }
      isFetching = false;
    } catch (err) {
      isFetching = false;
    }
  };

  runBulletinSync();

  // Start background periodic live score & bulletin sync (every 30 seconds)
  setInterval(runBulletinSync, 30 * 1000);
});


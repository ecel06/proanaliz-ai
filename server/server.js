// server/server.js
// ProAnaliz AI - Live Bulletin & Analytics Backend Microservice

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { fetchLiveBulletin, SUPPORTED_LEAGUES } from './bulletinService.js';
import {
  startFormSyncScheduler,
  getAllRealForms,
  getRealFormForTeam,
  syncAllRealForms
} from './realFormService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// In-memory cache
let cachedBulletin = null;
let lastFetchTime = null;
let isFetching = false;

// Load pre-existing cached file if available
function loadLocalCache() {
  try {
    const filePath = path.resolve(__dirname, '../public/data/bulletin.json');
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      cachedBulletin = JSON.parse(raw);
      lastFetchTime = cachedBulletin.updatedAt;
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

// 5. Mobil ve Yerel Ağ Bağlantı Bilgisi (PWA Kurulumu için)
const APP_VERSION = '2026.11.10.5';

app.get('/api/version', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json({
    version: APP_VERSION,
    timestamp: Date.now()
  });
});

app.get('/api/network-info', (req, res) => {
  const ip = getNetworkIp();
  res.json({
    success: true,
    ip,
    port: PORT,
    networkUrl: `http://${ip}:${PORT}`,
    localhostUrl: `http://localhost:${PORT}`
  });
});

// 6. Serve static production files from dist directory (Standalone mode)
const distPath = path.resolve(__dirname, '../dist');
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

  // Start background periodic live score & bulletin sync (every 30 seconds)
  setInterval(async () => {
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
  }, 30 * 1000);
});


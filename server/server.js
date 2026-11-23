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
  fetchProgramList,
  fetchLiveStreamId
} from './horseRacingService.js';
import {
  fetchStockScreener,
  fetchStockChart,
  fetchStockDeepAnalysis,
  fetchMacroOverview,
  fetchLiveGoldMarket,
  fetchLiveViopContracts
} from './stockService.js';
import { getLiveStandings } from './standingsService.js';
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
  syncCouponMatchResults,
  autoCheckAndRolloverCoupons,
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
      } catch { }
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

// 5. Multi-Source High-Speed Live Standings (beIN SPORTS for Turkish Leagues, ESPN for Global, with 30-min cache & verified fallbacks)
app.get('/api/standings/:leagueCode', async (req, res) => {
  const { leagueCode } = req.params;
  const force = req.query.force === '1' || req.query.force === 'true';
  try {
    const data = await getLiveStandings(leagueCode, force);
    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, error: 'Standings fetch failed', message: err.message });
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

app.get('/api/horse-racing/live-stream', async (req, res) => {
  try {
    const videoId = await fetchLiveStreamId();
    res.json({
      success: true,
      videoId: videoId || null,
      channelId: 'UCNLO4lpteIloZ4IKb9L2DoA',
      embedUrl: videoId
        ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=0&rel=0&playsinline=1`
        : `https://www.youtube-nocookie.com/embed/live_stream?channel=UCNLO4lpteIloZ4IKb9L2DoA&autoplay=1&mute=0&rel=0&playsinline=1`
    });
  } catch (err) {
    res.json({
      success: true,
      videoId: null,
      channelId: 'UCNLO4lpteIloZ4IKb9L2DoA',
      embedUrl: `https://www.youtube-nocookie.com/embed/live_stream?channel=UCNLO4lpteIloZ4IKb9L2DoA&autoplay=1&mute=0&rel=0&playsinline=1`
    });
  }
});

// 📺 High-Performance Live Sports Stream Proxy (Bypasses browser CORS & hotlink referer blocks)
app.get('/api/stream-proxy', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl || typeof targetUrl !== 'string') {
    return res.status(400).send('Missing url parameter');
  }

  let referer = 'https://www.trtspor.com.tr/';
  if (targetUrl.includes('ht-spor') || targetUrl.includes('ciner')) {
    referer = 'https://www.htspor.com/';
  } else if (targetUrl.includes('aspor')) {
    referer = 'https://www.aspor.com.tr/';
  }

  try {
    const upstreamRes = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': referer,
        'Origin': new URL(referer).origin,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });

    if (!upstreamRes.ok) {
      return res.status(upstreamRes.status).send(`Upstream error: ${upstreamRes.statusText}`);
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    const contentType = upstreamRes.headers.get('content-type') || 'application/vnd.apple.mpegurl';
    res.setHeader('Content-Type', contentType);

    const isPlaylist = targetUrl.includes('.m3u8') || contentType.includes('mpegurl') || contentType.includes('application/x-mpegURL');

    if (isPlaylist) {
      const text = await upstreamRes.text();
      const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
      const rewritten = text
        .split('\n')
        .map((line) => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const absoluteUrl = trimmed.startsWith('http') ? trimmed : new URL(trimmed, baseUrl).href;
            // Only proxy .m3u8 sub-playlists (to pass referer headers).
            // Direct .ts media chunks must be fetched directly by client browser in Turkey to avoid overseas datacenter 403 blocks.
            if (absoluteUrl.includes('.m3u8')) {
              return `/api/stream-proxy?url=${encodeURIComponent(absoluteUrl)}`;
            }
            return absoluteUrl;
          }
          return line;
        })
        .join('\n');
      return res.send(rewritten);
    }

    // Binary media chunk (.ts, .aac, .m4s)
    const arrayBuffer = await upstreamRes.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    console.error('[StreamProxy Error]:', err.message);
    return res.status(502).send('Stream proxy failure: ' + err.message);
  }
});

// 📺 Dynamic Sports TV Channels with Active Live Stream Resolver
let sportsTvChannelsCache = { data: null, expiresAt: 0 };

async function resolveYouTubeLiveVideoId(channelHandle) {
  try {
    const res = await fetch(`https://www.youtube.com/${channelHandle}/live`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
    });
    if (!res.ok) return null;
    const body = await res.text();
    const match = body.match(/"videoId":"([^"]+)"/);
    return match ? match[1] : null;
  } catch (err) {
    return null;
  }
}

app.get('/api/sports-tv/channels', async (req, res) => {
  const now = Date.now();
  const force = req.query.force === '1' || req.query.force === 'true';
  if (!force && sportsTvChannelsCache.data && sportsTvChannelsCache.expiresAt > now) {
    return res.json(sportsTvChannelsCache.data);
  }

  try {
    const [asporId, htsporId, sportsDigitaleId, trtsporId] = await Promise.all([
      resolveYouTubeLiveVideoId('@aspor'),
      resolveYouTubeLiveVideoId('@htspor'),
      resolveYouTubeLiveVideoId('@SportsDigitale'),
      resolveYouTubeLiveVideoId('@trtspor'),
    ]);

    const channels = [
      {
        id: 'skysports_uk',
        name: 'Sky Sports Main Event HD',
        country: 'İngiltere',
        countryFlag: '🇬🇧',
        category: 'İngiltere Premier Lig & Kupa',
        badge: '🇬🇧 İNGİLTERE',
        youtubeId: '',
        streamUrl: '',
        fallbackWebUrl: 'https://www.skysports.com/football',
        officialStreamUrl: 'https://www.skysports.com/watch',
        logoText: 'SKY SPORTS',
        accentColor: '#3B82F6',
        description: '🔴 Canlı Yayın • İngiltere Resmi Yayıncısı (Sky Sports & TNT Sports UK)',
      },
      {
        id: 'skysports_scotland',
        name: 'Sky Sports Football UK',
        country: 'İskoçya',
        countryFlag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
        category: 'İskoçya Premiership (Celtic, Rangers)',
        badge: '🏴󠁧󠁢󠁳󠁣󠁴󠁿 İSKOÇYA',
        youtubeId: '',
        streamUrl: '',
        fallbackWebUrl: 'https://www.skysports.com/scottish-football',
        officialStreamUrl: 'https://www.skysports.com/watch',
        logoText: 'SKY FOOTBALL',
        accentColor: '#0EA5E9',
        description: '🔴 Canlı Yayın • İskoçya Resmi Yayıncısı (Sky Sports & BBC Scotland)',
      },
      {
        id: 'movistar_es',
        name: 'Movistar+ LaLiga HD',
        country: 'İspanya',
        countryFlag: '🇪🇸',
        category: 'İspanya La Liga & Kral Kupası',
        badge: '🇪🇸 İSPANYA',
        youtubeId: '',
        streamUrl: '',
        fallbackWebUrl: 'https://www.laliga.com',
        officialStreamUrl: 'https://ver.movistarplus.es',
        logoText: 'MOVISTAR+',
        accentColor: '#F59E0B',
        description: '🔴 Canlı Yayın • İspanya Resmi Yayıncısı (Movistar+ & DAZN LaLiga)',
      },
      {
        id: 'skysport_it',
        name: 'Sky Sport Calcio HD',
        country: 'İtalya',
        countryFlag: '🇮🇹',
        category: 'İtalya Serie A & İtalya Kupası',
        badge: '🇮🇹 İTALYA',
        youtubeId: '',
        streamUrl: '',
        fallbackWebUrl: 'https://sport.sky.it/calcio',
        officialStreamUrl: 'https://sport.sky.it/calcio/serie-a',
        logoText: 'SKY CALCIO',
        accentColor: '#EC4899',
        description: '🔴 Canlı Yayın • İtalya Resmi Yayıncısı (Sky Sport Italia & DAZN Italia)',
      },
      {
        id: 'skysport_de',
        name: 'Sky Sport Bundesliga 1 HD',
        country: 'Almanya',
        countryFlag: '🇩🇪',
        category: 'Almanya Bundesliga',
        badge: '🇩🇪 ALMANYA',
        youtubeId: '',
        streamUrl: '',
        fallbackWebUrl: 'https://sport.sky.de/bundesliga',
        officialStreamUrl: 'https://sport.sky.de',
        logoText: 'SKY BUNDESLIGA',
        accentColor: '#6366F1',
        description: '🔴 Canlı Yayın • Almanya Resmi Yayıncısı (Sky Deutschland & DAZN 1 DE)',
      },
      {
        id: 'dazn_fr',
        name: 'DAZN Ligue 1 HD',
        country: 'Fransa',
        countryFlag: '🇫🇷',
        category: 'Fransa Ligue 1',
        badge: '🇫🇷 FRANSA',
        youtubeId: '',
        streamUrl: '',
        fallbackWebUrl: 'https://www.ligue1.com',
        officialStreamUrl: 'https://www.dazn.com/fr-FR/home',
        logoText: 'DAZN LIGUE 1',
        accentColor: '#8B5CF6',
        description: '🔴 Canlı Yayın • Fransa Resmi Yayıncısı (DAZN France & beIN Sports)',
      },
      {
        id: 'espn_nl',
        name: 'ESPN 1 Eredivisie HD',
        country: 'Hollanda',
        countryFlag: '🇳🇱',
        category: 'Hollanda Eredivisie',
        badge: '🇳🇱 HOLLANDA',
        youtubeId: '',
        streamUrl: '',
        fallbackWebUrl: 'https://www.espn.nl',
        officialStreamUrl: 'https://www.espn.nl/watch',
        logoText: 'ESPN NL',
        accentColor: '#EF4444',
        description: '🔴 Canlı Yayın • Hollanda Resmi Yayıncısı (ESPN Netherlands)',
      },
      {
        id: 'trtspor',
        name: 'TRT Spor HD',
        country: 'Türkiye',
        countryFlag: '🇹🇷',
        category: 'Trendyol 1. Lig & Uluslar Ligi',
        badge: '🇹🇷 ŞİFRESİZ CANLI',
        youtubeId: '',
        streamUrl: 'https://trt.daioncdn.net/trtspor/master.m3u8?app=web&platform=trtspor',
        fallbackWebUrl: 'https://www.trtspor.com.tr/canli-yayin-izle/trt-spor',
        officialStreamUrl: 'https://www.trtspor.com.tr/canli-yayin-izle/trt-spor',
        logoText: 'TRT SPOR',
        accentColor: '#10B981',
        description: '🔴 Canlı Yayın • Trendyol 1. Lig, A Milli Takım & UEFA Maçları',
      },
      {
        id: 'aspor',
        name: 'A Spor HD',
        country: 'Türkiye',
        countryFlag: '🇹🇷',
        category: 'Ziraat Türkiye Kupası',
        badge: '🇹🇷 ŞİFRESİZ CANLI',
        youtubeId: asporId || 'DwFLd1Mg0eE',
        streamUrl: 'https://rnttwmjcin.turknet.ercdn.net/lcpmvefbyo/aspor/aspor.m3u8',
        fallbackWebUrl: 'https://www.aspor.com.tr/canli-yayin',
        officialStreamUrl: 'https://www.aspor.com.tr/canli-yayin',
        logoText: 'A SPOR',
        accentColor: '#06B6D4',
        description: '🔴 Canlı Yayın • Ziraat Türkiye Kupası Karşılaşmaları & Canlı Analizler',
      },
      {
        id: 'bein1',
        name: 'beIN SPORTS 1 HD',
        country: 'Türkiye',
        countryFlag: '🇹🇷',
        category: 'Trendyol Süper Lig & Derbiler',
        badge: '🇹🇷 SÜPER LİG',
        youtubeId: '',
        streamUrl: '',
        fallbackWebUrl: 'https://beinsports.com.tr',
        officialStreamUrl: 'https://www.todtv.com.tr',
        logoText: 'beIN 1',
        accentColor: '#9333EA',
        description: '🔴 Canlı Yayın • Trendyol Süper Lig Resmi Yayıncı Kanalı',
      },
      {
        id: 'htspor',
        name: 'HT Spor HD',
        country: 'Türkiye',
        countryFlag: '🇹🇷',
        category: 'Süper Lig & Canlı Maç Yorumları',
        badge: 'CANLI HD',
        youtubeId: htsporId || 'gcWaPe_LBMc',
        streamUrl: 'https://ciner.daioncdn.net/ht-spor/ht-spor.m3u8?app=web',
        fallbackWebUrl: 'https://www.htspor.com/canli-yayin',
        officialStreamUrl: 'https://www.htspor.com/canli-yayin',
        logoText: 'HT SPOR',
        accentColor: '#8B5CF6',
        description: '🔴 Canlı Yayın • Süper Lig, HT Futbol & Taktik Tahtası',
      },
      {
        id: 'sportsdigitale',
        name: 'Sports Digitale',
        country: 'Türkiye',
        countryFlag: '🇹🇷',
        category: 'Canlı Derbi & Maç Yorumları',
        badge: 'CANLI HD',
        youtubeId: sportsDigitaleId || '5PvmYQcOKu4',
        streamUrl: '',
        fallbackWebUrl: 'https://www.youtube.com/@SportsDigitale',
        officialStreamUrl: 'https://www.youtube.com/@SportsDigitale',
        logoText: 'DIGITALE',
        accentColor: '#F59E0B',
        description: '🔴 Canlı Yayın • Canlı Maç Önü ve Sonu Derbi Analizleri',
      },
    ];

    sportsTvChannelsCache = {
      data: { success: true, channels, updatedAt: new Date().toISOString() },
      expiresAt: now + 5 * 60 * 1000,
    };

    res.json(sportsTvChannelsCache.data);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5d. Live Stock Market Screener & Historical OHLCV Chart (BIST / NASDAQ / NYSE / Crypto)
app.get('/api/stocks/viop', async (req, res) => {
  try {
    const force = req.query.force === '1' || req.query.force === 'true';
    const data = await fetchLiveViopContracts(force);
    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

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

// 🪙 Canlı Altın Piyasası (Spot Gösterge vs. Kapalıçarşı Serbest Piyasa) endpoint
app.get('/api/gold/live', async (req, res) => {
  try {
    const force = req.query.force === 'true';
    const data = await fetchLiveGoldMarket(force);
    res.json({ success: true, ...data });
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
  req.userPayload = payload;
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
  const user = getUserById(req.userId, req.userPayload);
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
  const user = getUserById(req.userId, req.userPayload);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Kullanıcı bulunamadı.' });
  }

  // Adminler her zaman doğrudan VIP tanımlayabilir
  if (user.role === 'admin') {
    const result = activateUserVip(req.userId, planDays, planName);
    return res.json(result);
  }

  // Normal kullanıcılar için: 7 günlük ücretsiz deneme (ömür boyu yalnızca 1 kez)
  if (planDays <= 7 && !user.hasUsedTrial) {
    user.hasUsedTrial = true;
    const result = activateUserVip(req.userId, 7, '7 Günlük Deneme VIP');
    return res.json(result);
  }

  // Yetkisiz ödemesiz VIP talepleri engellenir
  return res.status(403).json({
    success: false,
    error: user.hasUsedTrial
      ? '7 Günlük ücretsiz deneme sürenizi daha önce kullandınız. VIP üyeliğinizi uzatmak için lütfen geçerli bir promosyon kodu giriniz.'
      : 'VIP üyelik aktivasyonu için lütfen geçerli bir promosyon kodu kullanınız veya müşteri desteği ile iletişime geçiniz.'
  });
});

// --- 🛡️ Admin Panel Endpoints (Admin Only) ---
function adminMiddleware(req, res, next) {
  authMiddleware(req, res, () => {
    const user = getUserById(req.userId, req.userPayload);
    if (!user || user.role !== 'admin') {
      try {
        logActivity('SECURITY_ALERT', 'Engellenen yetkisiz Admin erişimi', { ip: req.ip, userId: req.userId || 'anon' });
      } catch { }
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

// Admin Force Rollover Endpoint
app.post('/api/admin/rollover-coupons', adminMiddleware, (req, res) => {
  const matches = cachedBulletin?.matches || [];
  const coupon = autoCheckAndRolloverCoupons(matches, true);
  if (!coupon) {
    return res.status(400).json({ success: false, error: 'Bültende uygun maç bulunamadı veya kupon oluşturulamadı.' });
  }
  res.json({ success: true, coupon });
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
const APP_VERSION = '2026.11.20.46';

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
        try {
          syncCouponMatchResults(cachedBulletin.matches);
          autoCheckAndRolloverCoupons(cachedBulletin.matches);
        } catch (e) {
          console.error('[Server] Coupon sync error:', e.message);
        }
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


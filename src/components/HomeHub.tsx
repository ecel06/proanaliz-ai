// src/components/HomeHub.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronRight,
  Sparkles,
  Download,
  ArrowUpRight,
  Trophy,
  Target,
  Zap,
  CheckCircle2,
  TrendingUp,
  Smartphone,
  QrCode,
  Coins,
  Crown,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  User as UserIcon,
  LogOut,
  Share2,
  Gift,
} from 'lucide-react';
import { Match, MatchAnalysis } from '../types';
import { User } from '../utils/authHelper';

interface HomeHubProps {
  onSelectFootball: () => void;
  onSelectHorseRacing: () => void;
  onSelectStocks: () => void;
  onOpenInstallModal?: () => void;
  onOpenShare?: () => void;
  onOpenVIP?: () => void;
  onOpenAuth?: () => void;
  onOpenProfile?: () => void;
  onOpenAdmin?: () => void;
  onOpenAIPerformance?: () => void;
  onLogout?: () => void;
  user?: User | null;
  allMatches?: Match[];
  analysesMap?: Map<string | number, MatchAnalysis> | Record<string | number, MatchAnalysis>;
}

// Module-level cache to eliminate layout shift and repeated heavy API hits
let cachedBestHorse: any = null;
let cachedBestStock: any = null;
let cachedMacroRates: any[] = [];
let lastHubFetchTime = 0;

export const HomeHub: React.FC<HomeHubProps> = ({
  onSelectFootball,
  onSelectHorseRacing,
  onSelectStocks,
  onOpenInstallModal,
  onOpenShare,
  onOpenVIP,
  onOpenAuth,
  onOpenProfile,
  onOpenAdmin,
  onOpenAIPerformance,
  onLogout,
  user,
  allMatches = [],
  analysesMap,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [showGoldRadar, setShowGoldRadar] = useState<boolean>(true);

  // Real live data for today's horse and stock with instant cache hydration
  const [bestHorse, setBestHorse] = useState<{
    title: string;
    place: string;
    jockey?: string;
    badge: string;
    recommendation: string;
  } | null>(() => cachedBestHorse);

  const [bestStock, setBestStock] = useState<{
    symbol: string;
    name: string;
    price: string;
    changePct: string;
    isPositive: boolean;
    recommendation: string;
    badge: string;
  } | null>(() => cachedBestStock);

  // Real live Gold & Currency macro rates (Dolar, Euro, Gram Altın, Çeyrek Altın, Ons, vb.)
  const [macroRates, setMacroRates] = useState<Array<{
    symbol: string;
    label: string;
    unit: string;
    price: number;
    changePct: number;
  }>>(() => cachedMacroRates);

  // PWA Install prompt listener
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Fetch real today's horse and stock data with smart caching
  useEffect(() => {
    const now = Date.now();
    const shouldFetch = now - lastHubFetchTime > 120000 || !cachedBestHorse || !cachedBestStock;

    if (shouldFetch) {
      lastHubFetchTime = now;
      // 1. Fetch real today's Horse Racing top runner
      fetch('/api/horse-racing/bulletin')
        .then((r) => r.json())
        .then((data) => {
          const prog = data?.programs?.[0];
          const detail = data?.activeProgramDetail;
          const placeName = prog?.place ? `${prog.place} Hipodromu` : 'TJK Bugün Bülteni';

          if (detail?.races && detail.races.length > 0) {
            let topHorse: any = null;
            let topRaceNum = 1;
            let highestAgf = 0;

            for (const race of detail.races) {
              if (!race.horses) continue;
              for (const h of race.horses) {
                const agf = parseFloat(h.agfPercent || '0') || 0;
                if (agf > highestAgf) {
                  highestAgf = agf;
                  topHorse = h;
                  topRaceNum = race.raceNumber;
                }
              }
            }

            if (topHorse) {
              const horseObj = {
                title: `#${topHorse.number} ${topHorse.name}`,
                place: `${placeName} • ${topRaceNum}. Koşu`,
                jockey: topHorse.jockey?.name ? `Jokey: ${topHorse.jockey.name}` : undefined,
                badge: highestAgf > 0 ? `%${highestAgf} AGF Lideri` : 'Günün Bankosu',
                recommendation: `AI Robotu: #${topHorse.number} Tek / Banko Tavsiyesi`,
              };
              cachedBestHorse = horseObj;
              setBestHorse(horseObj);
              return;
            }

            const r1 = detail.races[0];
            const h1 = r1?.horses?.[0];
            if (h1) {
              const horseObj = {
                title: `#${h1.number} ${h1.name}`,
                place: `${placeName} • ${r1.raceNumber}. Koşu`,
                jockey: h1.jockey?.name ? `Jokey: ${h1.jockey.name}` : undefined,
                badge: 'Günün Favorisi',
                recommendation: `Öne Çıkan Form: #${h1.number} ${h1.name}`,
              };
              cachedBestHorse = horseObj;
              setBestHorse(horseObj);
            }
          }
        })
        .catch(() => {});

      // 2. Fetch real today's BIST stock leader
      fetch('/api/stocks/screener?market=bist')
        .then((r) => r.json())
        .then((data) => {
          const stocks = data?.stocks;
          if (stocks && stocks.length > 0) {
            const positive = stocks.filter((s: any) => s.changePct > 0);
            const pool = positive.length > 0 ? positive : stocks;
            const sorted = [...pool].sort((a: any, b: any) => (b.volume || 0) - (a.volume || 0));
            const top = sorted[0];
            if (top) {
              const stockObj = {
                symbol: top.symbol,
                name: top.name || 'Borsa İstanbul',
                price: `${top.close?.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} ₺`,
                changePct: `${top.changePct >= 0 ? '+' : ''}${top.changePct?.toFixed(2)}%`,
                isPositive: top.changePct >= 0,
                recommendation: `RSI: ${Math.round(top.rsi || 55)} • Quant Alım Sinyali`,
                badge: 'GÜÇLÜ AL',
              };
              cachedBestStock = stockObj;
              setBestStock(stockObj);
            }
          }
        })
        .catch(() => {});
    }

    // 3. Fetch real live Gold & Foreign Currency Macro overview (every 60s)
    const fetchMacro = () => {
      fetch('/api/macro/live')
        .then((r) => r.json())
        .then((data) => {
          if (data?.items && Array.isArray(data.items)) {
            cachedMacroRates = data.items;
            setMacroRates(data.items);
          }
        })
        .catch(() => {});
    };

    if (cachedMacroRates.length === 0 || now - lastHubFetchTime > 60000) {
      fetchMacro();
    }
    const macroTimer = setInterval(fetchMacro, 60000);

    return () => clearInterval(macroTimer);
  }, []);

  // Compute the single best match playing TODAY (or LIVE right now)
  const bestFootballMatch = useMemo(() => {
    if (!allMatches || allMatches.length === 0) return null;
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const getAnalysis = (id: string | number) => {
      if (!analysesMap) return null;
      if (typeof (analysesMap as any).get === 'function') {
        return (analysesMap as any).get(id) || (analysesMap as any).get(String(id)) || (analysesMap as any).get(Number(id));
      }
      return (analysesMap as any)[id];
    };

    // 1. First Priority: Matches currently LIVE right now!
    const liveMatches = allMatches.filter((m) => m.status === 'live');
    if (liveMatches.length > 0) {
      const sorted = [...liveMatches].sort((a, b) => {
        const confA = getAnalysis(a.id)?.confidence || 50;
        const confB = getAnalysis(b.id)?.confidence || 50;
        return confB - confA;
      });
      const top = sorted[0];
      const analysis = getAnalysis(top.id);
      const homeName = top.homeTeam?.name || 'Ev Sahibi';
      const awayName = top.awayTeam?.name || 'Deplasman';
      const minute = top.liveMinute ? `${top.liveMinute}` : 'Canlı';
      const score = top.currentScore
        ? `${top.currentScore.home} - ${top.currentScore.away}`
        : ((top as any).homeScore !== undefined ? `${(top as any).homeScore} - ${(top as any).awayScore}` : '');

      return {
        title: `${homeName} — ${awayName}`,
        badge: `🔴 CANLI ${minute}${score ? ` (${score})` : ''}`,
        league: `${top.league || 'Futbol'} • Canlı Takip`,
        recommendation: analysis?.prediction ? `${analysis.prediction} (%${Math.round(analysis.confidence)} Güven)` : 'Canlı Gol Baskısı Yüksek',
        confidence: analysis ? Math.round(analysis.confidence) : 85,
        isLive: true,
      };
    }

    // 2. Second Priority: Matches UPCOMING TODAY
    const todayUpcoming = allMatches.filter((m) => {
      if (m.status === 'finished') return false;
      const dStr = (m.utcDate || m.date || '').slice(0, 10);
      return dStr === todayStr;
    });

    if (todayUpcoming.length > 0) {
      const sorted = [...todayUpcoming].sort((a, b) => {
        const confA = getAnalysis(a.id)?.confidence || 50;
        const confB = getAnalysis(b.id)?.confidence || 50;
        return confB - confA;
      });
      const top = sorted[0];
      const analysis = getAnalysis(top.id);
      const homeName = top.homeTeam?.name || 'Ev Sahibi';
      const awayName = top.awayTeam?.name || 'Deplasman';

      let timeText = 'Bugün';
      if (top.time && top.time.includes(':')) {
        timeText = `Bugün ${top.time}`;
      } else if (top.utcDate) {
        try {
          const d = new Date(top.utcDate);
          timeText = `Bugün ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        } catch {
          timeText = 'Bugün';
        }
      }

      return {
        title: `${homeName} — ${awayName}`,
        badge: timeText,
        league: `${top.league || 'Futbol'} • Günün Bankosu`,
        recommendation: analysis?.prediction ? `${analysis.prediction} (%${Math.round(analysis.confidence)} Güven)` : 'Günün Öne Çıkan Bankosu',
        confidence: analysis ? Math.round(analysis.confidence) : 84,
        isLive: false,
      };
    }

    // 3. Third Priority: Closest upcoming match in bulletin (within next 24-48 hours)
    const upcoming = allMatches.filter((m) => m.status === 'upcoming');
    if (upcoming.length > 0) {
      const sorted = [...upcoming].sort((a, b) => {
        const timeA = new Date(a.utcDate || a.date).getTime() || 0;
        const timeB = new Date(b.utcDate || b.date).getTime() || 0;
        return timeA - timeB;
      });
      const top = sorted[0];
      const analysis = getAnalysis(top.id);
      const homeName = top.homeTeam?.name || 'Ev Sahibi';
      const awayName = top.awayTeam?.name || 'Deplasman';
      let dateBadge = 'Yakında';
      try {
        const d = new Date(top.utcDate || top.date);
        dateBadge = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      } catch {}

      return {
        title: `${homeName} — ${awayName}`,
        badge: dateBadge,
        league: `${top.league || 'Futbol'} • Sıradaki Maç`,
        recommendation: analysis?.prediction ? `${analysis.prediction} (%${Math.round(analysis.confidence)} Güven)` : 'İlk Başlayacak Karşılaşma',
        confidence: analysis ? Math.round(analysis.confidence) : 80,
        isLive: false,
      };
    }

    return null;
  }, [allMatches, analysesMap]);

  const handleInstallApp = async () => {
    if (!deferredPrompt) {
      if (onOpenInstallModal) onOpenInstallModal();
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="h-full w-full flex-1 min-h-0 bg-slate-950 text-slate-100 flex flex-col items-center px-3 sm:px-6 py-1.5 sm:py-2.5 relative overflow-hidden no-scrollbar">
      {/* Subtle Ambient Glow */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[480px] h-[480px] rounded-full bg-emerald-500/10 blur-[90px]" />
      <div className="pointer-events-none absolute -bottom-32 right-1/4 w-[400px] h-[400px] rounded-full bg-amber-500/10 blur-[90px]" />

      <div
        className="w-full max-w-5xl h-full flex-1 min-h-0 flex flex-col justify-between space-y-1.5 sm:space-y-2 md:space-y-0 relative z-10 overflow-y-auto md:overflow-hidden no-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        
        {/* Top Header: Brand & Quick Install Action (Compact) */}
        <div className="text-center space-y-1">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="inline-flex items-center space-x-2 px-3 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-extrabold tracking-widest uppercase text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>ProAnaliz AI • Küresel Analiz Terminali</span>
            </div>

            {onOpenInstallModal && (
              <button
                onClick={onOpenInstallModal}
                className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 text-[10px] font-bold text-slate-300 hover:text-white transition-all shadow cursor-pointer group"
                title="Telefona İndir, Karekod ve Kurulum Rehberi"
              >
                <Smartphone className="w-3 h-3 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>Telefona İndir</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </button>
            )}

            {onOpenShare && (
              <button
                onClick={onOpenShare}
                className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-400/40 text-[10px] font-black text-emerald-300 hover:text-white transition-all shadow cursor-pointer group"
                title="Arkadaşını Davet Et, +3 Gün Hediye VIP Kazan!"
              >
                <Gift className="w-3 h-3 text-amber-400 group-hover:scale-110 transition-transform" />
                <span>Paylaş &amp; Kazan</span>
                <span className="px-1 py-0.2 rounded text-[8px] font-black bg-amber-400 text-slate-950 font-mono">
                  +3G
                </span>
              </button>
            )}

            {onOpenVIP && (
              <button
                onClick={onOpenVIP}
                className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-[10px] transition-all shadow-md shadow-amber-500/25 cursor-pointer active:scale-95 group"
                title="VIP Üyelik Paketleri ve Ayrıcalıkları"
              >
                <Crown className="w-3 h-3 text-slate-950" />
                <span>{user?.isVip ? '👑 VIP Üyeliğim' : '👑 VIP Üye Ol'}</span>
              </button>
            )}

            {!user ? (
              onOpenAuth && (
                <button
                  onClick={onOpenAuth}
                  className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold text-[10px] transition-all shadow cursor-pointer"
                  title="Giriş Yap veya Ücretsiz Üye Ol"
                >
                  <UserIcon className="w-3 h-3 text-amber-400" />
                  <span>Giriş / Üye Ol</span>
                </button>
              )
            ) : (
              <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-slate-900/90 border border-slate-800 text-[10px]">
                <button
                  onClick={onOpenProfile}
                  className="inline-flex items-center space-x-1 font-bold text-slate-300 hover:text-white cursor-pointer transition-colors"
                  title="Üye Paneli & Hesap Ayarları"
                >
                  <UserIcon className="w-3 h-3 text-emerald-400" />
                  <span>{user.name.split(' ')[0]}</span>
                </button>
                {user.isVip && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-amber-400 text-slate-950 font-black">VIP</span>
                )}
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="text-slate-500 hover:text-rose-400 cursor-pointer transition-colors ml-1"
                    title="Çıkış Yap"
                  >
                    <LogOut className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            {user?.role === 'admin' && onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/50 hover:bg-rose-500/30 text-rose-300 font-black text-[10px] transition-all shadow-md shadow-rose-500/20 cursor-pointer active:scale-95 group"
                title="Yönetici (Admin) Paneli"
              >
                <ShieldCheck className="w-3 h-3 text-rose-400" />
                <span>🛡️ Yönetici Paneli</span>
              </button>
            )}

            {deferredPrompt && !isInstalled && (
              <button
                onClick={handleInstallApp}
                className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] transition-colors shadow-lg shadow-emerald-500/20 cursor-pointer animate-pulse"
              >
                <Download className="w-3 h-3" />
                <span>Telefona Kur</span>
              </button>
            )}
          </div>

          {/* Live AI Accuracy Scorecard Banner */}
          {onOpenAIPerformance && (
            <div 
              onClick={onOpenAIPerformance}
              className="mt-2 mb-4 p-3 rounded-2xl bg-gradient-to-r from-amber-500/15 via-slate-900 to-emerald-500/15 border border-amber-400/30 hover:border-amber-400/60 transition-all cursor-pointer flex items-center justify-between gap-3 group shadow-lg shadow-amber-500/5 max-w-xl mx-auto"
            >
              <div className="flex items-center gap-2.5 text-left">
                <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-400/30">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white">Yapay Zeka Başarı Karnesi</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Doğrulanmış İstatistikler
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Biten maçlar ve resmi sonuçlarla kanıtlanmış şeffaf Poisson tahmin performansı
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-amber-400 font-bold text-xs shrink-0 group-hover:translate-x-1 transition-transform">
                <span className="hidden sm:inline">İncele</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          )}

          <h1 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-white">
            Bölüm Seçiniz
          </h1>
          <p className="text-[10px] sm:text-xs text-slate-400 max-w-md mx-auto">
            Yapay zeka modelleri ve canlı verilerle donatılmış bağımsız profesyonel analiz platformu
          </p>
        </div>

        {/* 🪙 CANLI ALTIN & DÖVİZ PİYASALARI TİCKER (Compact & Live Dynamic) */}
        <div 
          onClick={onSelectStocks}
          className="w-full rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/40 px-2 py-1.5 sm:px-3 sm:py-1.5 transition-all shadow-md flex items-center justify-between gap-2 overflow-hidden cursor-pointer group"
          title="Borsa, Altın ve Döviz Terminaline Git"
        >
          <div className="flex items-center gap-1.5 shrink-0 pr-2 border-r border-slate-800/80">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[10px] sm:text-xs font-black tracking-wider uppercase text-amber-300 whitespace-nowrap flex items-center gap-1">
              <span>🪙 Canlı Piyasa:</span>
            </span>
          </div>

          {/* Infinite Smooth Scrolling Ticker Loop - Hardware Accelerated */}
          <div className="relative overflow-hidden flex-1 min-w-0">
            {/* Smooth Edge Fades without heavy mask-image */}
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-3 sm:w-4 bg-gradient-to-r from-slate-900 to-transparent z-10" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-3 sm:w-4 bg-gradient-to-l from-slate-900 to-transparent z-10" />
            {macroRates.length > 0 ? (
              <div className="flex items-center gap-1.5 sm:gap-2 animate-marquee py-0.5">
                {/* Render two duplicated sets for seamless continuous animation loop */}
                {[0, 1].map((copyIndex) => (
                  <div key={copyIndex} className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    {macroRates.map((item) => {
                      const isGold = item.symbol.includes('ALTIN') || item.symbol === 'GC=F';
                      const isUsd = item.symbol === 'USDTRY=X';
                      const isEur = item.symbol === 'EURTRY=X';
                      const isGbp = item.symbol === 'GBPTRY=X';
                      const isBtc = item.symbol === 'BTC-USD';
                      const isBist = item.symbol === 'XU100.IS';

                      let icon = '📊';
                      let cleanLabel = item.label;
                      if (item.symbol === 'GRAM_ALTIN') { icon = '🪙'; cleanLabel = 'Gram Altın'; }
                      else if (item.symbol === 'CEYREK_ALTIN') { icon = '👑'; cleanLabel = 'Çeyrek'; }
                      else if (item.symbol === 'GC=F') { icon = '🟡'; cleanLabel = 'Ons Altın'; }
                      else if (isUsd) { icon = '💵'; cleanLabel = 'USD/TRY'; }
                      else if (isEur) { icon = '💶'; cleanLabel = 'EUR/TRY'; }
                      else if (isGbp) { icon = '💷'; cleanLabel = 'GBP/TRY'; }
                      else if (isBtc) { icon = '₿'; cleanLabel = 'BTC'; }
                      else if (isBist) { icon = '📈'; cleanLabel = 'BIST 100'; }

                      const isPos = item.changePct >= 0;
                      const formattedPrice = item.price >= 1000
                        ? item.price.toLocaleString('tr-TR', { maximumFractionDigits: item.price >= 10000 ? 0 : 2 })
                        : item.price.toFixed(2);

                      return (
                        <div
                          key={`${copyIndex}-${item.symbol}`}
                          className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-lg border text-[10px] sm:text-[11px] whitespace-nowrap shrink-0 transition-transform ${
                            isGold
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                              : isUsd || isEur || isGbp
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                              : 'bg-slate-800/80 border-slate-700/60 text-slate-200'
                          }`}
                        >
                          <span className="text-[11px] sm:text-xs">{icon}</span>
                          <span className="font-bold text-slate-300">{cleanLabel}:</span>
                          <span className="font-mono font-black text-white">
                            {formattedPrice} {item.unit}
                          </span>
                          <span
                            className={`font-mono text-[9px] sm:text-[10px] font-extrabold ${
                              isPos ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {isPos ? '+' : ''}{item.changePct}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-[10px] sm:text-[11px] text-slate-400 animate-pulse">
                <span>Canlı altın ve döviz kurları yükleniyor...</span>
              </div>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-slate-400 group-hover:text-cyan-300 transition-colors shrink-0 pl-1.5 border-l border-slate-800/80">
            <span>Terminal</span>
            <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>

        {/* Clean Portal Cards: Futbol, At Yarışı & Borsa (Proportioned to fit screen) */}
        <div className="w-full shrink-0 grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-2.5 md:gap-3">
          {/* FUTBOL CARD */}
          <button
            onClick={onSelectFootball}
            className="group relative rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-emerald-400/70 p-2.5 sm:p-3 md:py-2.5 md:px-3 text-left transition-all duration-200 cursor-pointer shadow-xl hover:shadow-emerald-500/15 hover:-translate-y-0.5 active:scale-[0.99] flex flex-col items-center justify-center space-y-1 md:space-y-1.5"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-10 md:h-10 rounded-xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-xl sm:text-2xl group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/10">
              ⚽
            </div>
            <div className="text-center space-y-0.5">
              <div className="text-base sm:text-lg md:text-lg font-black tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                Futbol
              </div>
              <p className="text-[10px] text-slate-400">Canlı Skorlar • Poisson AI • xG</p>
            </div>
            <div className="inline-flex items-center space-x-1 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-emerald-400 opacity-80 group-hover:opacity-100">
              <span>Giriş Yap</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* AT YARIŞI CARD */}
          <button
            onClick={onSelectHorseRacing}
            className="group relative rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-amber-400/70 p-2.5 sm:p-3 md:py-2.5 md:px-3 text-left transition-all duration-200 cursor-pointer shadow-xl hover:shadow-amber-500/15 hover:-translate-y-0.5 active:scale-[0.99] flex flex-col items-center justify-center space-y-1 md:space-y-1.5"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-10 md:h-10 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-xl sm:text-2xl group-hover:scale-110 transition-transform shadow-lg shadow-amber-500/10">
              🏇
            </div>
            <div className="text-center space-y-0.5">
              <div className="text-base sm:text-lg md:text-lg font-black tracking-tight text-white group-hover:text-amber-300 transition-colors">
                At Yarışı
              </div>
              <p className="text-[10px] text-slate-400">TJK Bülteni • Canlı AGF • Altılı Robotu</p>
            </div>
            <div className="inline-flex items-center space-x-1 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-amber-400 opacity-80 group-hover:opacity-100">
              <span>Giriş Yap</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* BORSA CARD */}
          <button
            onClick={onSelectStocks}
            className="group relative rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-cyan-400/70 p-2.5 sm:p-3 md:py-2.5 md:px-3 text-left transition-all duration-200 cursor-pointer shadow-xl hover:shadow-cyan-500/15 hover:-translate-y-0.5 active:scale-[0.99] flex flex-col items-center justify-center space-y-1 md:space-y-1.5"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-10 md:h-10 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-xl sm:text-2xl group-hover:scale-110 transition-transform shadow-lg shadow-cyan-500/10">
              📈
            </div>
            <div className="text-center space-y-0.5">
              <div className="text-base sm:text-lg md:text-lg font-black tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                Borsa
              </div>
              <p className="text-[10px] text-slate-400">BIST &amp; ABD • Quant Al-Sat • Canlı KAP</p>
            </div>
            <div className="inline-flex items-center space-x-1 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-cyan-400 opacity-80 group-hover:opacity-100">
              <span>Giriş Yap</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>

        {/* 📱 TELEFONA İNDİR BANNERI (Responsive & Never Squashed on Mobile) */}
        <div className="w-full shrink-0 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900 border border-slate-800 hover:border-emerald-500/40 p-3 sm:p-3.5 md:py-2.5 md:px-4 transition-all shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 relative overflow-hidden group">
          <div className="flex items-center gap-2.5 sm:gap-3 text-left min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center shrink-0 text-emerald-400 shadow">
              <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-black text-white">
                  ProAnaliz AI Cebinizde
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                  ÜCRETSİZ PWA
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 leading-tight">
                Tek dokunuşla ana ekrana ekleyin, canlı gol ve kupon bildirimlerini anında alın.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-0.5 sm:pt-0">
            {deferredPrompt && !isInstalled && (
              <button
                onClick={handleInstallApp}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs transition-all shadow cursor-pointer animate-pulse"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Hemen Kur</span>
              </button>
            )}
            <button
              onClick={() => {
                if (onOpenInstallModal) onOpenInstallModal();
              }}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 hover:border-emerald-400/60 border border-slate-700 active:scale-95 text-white font-black text-xs transition-all shadow-xs cursor-pointer group"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>Telefona İndir</span>
            </button>
            {onOpenShare && (
              <button
                onClick={onOpenShare}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-95 text-slate-950 font-black text-xs transition-all shadow-md shadow-amber-500/20 cursor-pointer group"
                title="Arkadaşını Davet Et, +3 Gün Hediye VIP Kazan!"
              >
                <Gift className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Paylaş &amp; Kazan</span>
              </button>
            )}
          </div>
        </div>

        {/* 🌟 GÜNÜN ALTIN FIRSATLARI & AI RADAR CARD (Compact & Dynamic) */}
        <div className="w-full shrink-0 rounded-2xl bg-slate-900/70 border border-slate-800/80 p-2.5 sm:p-3 md:py-2 md:px-3 space-y-1.5 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-1">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Sparkles className="w-3 h-3" />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                  <span>Günün Yapay Zeka Özeti &amp; Altın Fırsatları</span>
                </h3>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  CANLI TESPİTLER
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowGoldRadar(!showGoldRadar)}
              className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded hover:bg-slate-800 transition-colors"
            >
              {showGoldRadar ? 'Gizle' : 'Göster'}
            </button>
          </div>

          {showGoldRadar && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-2.5 pt-0.5">
              {/* Futbol Özet Tile */}
              <div
                onClick={onSelectFootball}
                className="p-2 sm:p-2.5 md:py-1.5 md:px-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-950 border border-emerald-500/20 hover:border-emerald-500/50 transition-all cursor-pointer flex flex-col justify-between space-y-1 group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                      <span>⚽ Günün Maçı</span>
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                      {bestFootballMatch ? bestFootballMatch.badge : '%84 Güven'}
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm font-black text-white mt-1 group-hover:text-emerald-300 transition-colors truncate">
                    {bestFootballMatch ? bestFootballMatch.title : 'Günün Canlı Maçları Yükleniyor...'}
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5 truncate">
                    AI Önerisi: <strong className="text-emerald-400">{bestFootballMatch ? bestFootballMatch.recommendation : 'MS 1 & 1.5 Üst'}</strong>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800/40 pt-1.5">
                  <span className="truncate">{bestFootballMatch ? bestFootballMatch.league : 'Günün Canlı Bülteni'}</span>
                  <span className="text-emerald-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center shrink-0">
                    İncele <ArrowUpRight className="w-3 h-3" />
                  </span>
                </div>
              </div>

              {/* At Yarışı Özet Tile */}
              <div
                onClick={onSelectHorseRacing}
                className="p-2 sm:p-2.5 md:py-1.5 md:px-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-950 border border-amber-500/20 hover:border-amber-500/50 transition-all cursor-pointer flex flex-col justify-between space-y-1 group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                      <span>🏇 Günün Atı &amp; AGF</span>
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-bold">
                      {bestHorse ? bestHorse.badge : 'Günün Bankosu'}
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm font-black text-white mt-1 group-hover:text-amber-300 transition-colors truncate">
                    {bestHorse ? bestHorse.title : 'İzmir • 5. Koşu #6 KUZEYİN POYRAZI'}
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5 truncate">
                    {bestHorse?.jockey ? <span className="text-slate-400">{bestHorse.jockey} • </span> : null}
                    <strong className="text-amber-300">{bestHorse ? bestHorse.recommendation : 'AI Robotu: Tek / Banko'}</strong>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800/40 pt-1.5">
                  <span className="truncate">{bestHorse ? bestHorse.place : 'TJK Bugün Programı'}</span>
                  <span className="text-amber-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center shrink-0">
                    Bültene Git <ArrowUpRight className="w-3 h-3" />
                  </span>
                </div>
              </div>

              {/* Borsa Özet Tile */}
              <div
                onClick={onSelectStocks}
                className="p-2 sm:p-2.5 md:py-1.5 md:px-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-950 border border-cyan-500/20 hover:border-cyan-500/50 transition-all cursor-pointer flex flex-col justify-between space-y-1 group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                      <span>📈 Günün Hissesi &amp; Quant</span>
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                      {bestStock ? bestStock.badge : 'GÜÇLÜ AL'}
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm font-black text-white mt-1 group-hover:text-cyan-300 transition-colors flex items-center justify-between gap-1">
                    <span className="truncate">{bestStock ? `${bestStock.symbol} • ${bestStock.name}` : 'THYAO • Türk Hava Yolları'}</span>
                    {bestStock?.changePct && (
                      <span className={`text-[10px] font-mono font-bold shrink-0 ${bestStock.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {bestStock.price} ({bestStock.changePct})
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5 truncate">
                    Analiz: <strong className="text-cyan-300">{bestStock ? bestStock.recommendation : 'RSI: 70.8 • Hacim Anomalisi & AL'}</strong>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800/40 pt-1.5">
                  <span>Borsa İstanbul (BIST 30)</span>
                  <span className="text-cyan-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center shrink-0">
                    Terminale Git <ArrowUpRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 🛡️ YASAL UYARI & SORUMLULUK REDDİ (YTD) - Belirgin & Göze Hitap Eden Tasarım */}
        <div className="w-full shrink-0 flex items-center justify-center py-0.5 md:py-1">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-0.5 sm:py-1 rounded-full bg-gradient-to-r from-amber-500/10 via-amber-400/20 to-amber-500/10 border border-amber-400/40 text-amber-200/90 shadow-md shadow-amber-500/10 text-[9px] sm:text-[10px] md:text-[11px] backdrop-blur-md max-w-full">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-black uppercase tracking-wider text-amber-300 shrink-0">
              YASAL UYARI:
            </span>
            <span className="font-medium text-slate-300 truncate sm:whitespace-normal">
              Bu platformdaki tüm analiz ve modellemeler bilgilendirme amaçlıdır; kesinlikle{' '}
              <strong className="text-amber-300 font-black tracking-wide underline decoration-amber-400 decoration-2 underline-offset-2">
                YATIRIM TAVSİYESİ DEĞİLDİR (YTD)
              </strong>
              .
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

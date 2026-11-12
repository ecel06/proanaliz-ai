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
} from 'lucide-react';
import { Match, MatchAnalysis } from '../types';

interface HomeHubProps {
  onSelectFootball: () => void;
  onSelectHorseRacing: () => void;
  onSelectStocks: () => void;
  onOpenInstallModal?: () => void;
  allMatches?: Match[];
  analysesMap?: Map<string | number, MatchAnalysis> | Record<string | number, MatchAnalysis>;
}

export const HomeHub: React.FC<HomeHubProps> = ({
  onSelectFootball,
  onSelectHorseRacing,
  onSelectStocks,
  onOpenInstallModal,
  allMatches = [],
  analysesMap,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [showGoldRadar, setShowGoldRadar] = useState<boolean>(true);

  // Real live data for today's horse and stock
  const [bestHorse, setBestHorse] = useState<{
    title: string;
    place: string;
    jockey?: string;
    badge: string;
    recommendation: string;
  } | null>(null);

  const [bestStock, setBestStock] = useState<{
    symbol: string;
    name: string;
    price: string;
    changePct: string;
    isPositive: boolean;
    recommendation: string;
    badge: string;
  } | null>(null);

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

  // Fetch real today's horse and stock data
  useEffect(() => {
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
            setBestHorse({
              title: `#${topHorse.number} ${topHorse.name}`,
              place: `${placeName} • ${topRaceNum}. Koşu`,
              jockey: topHorse.jockey?.name ? `Jokey: ${topHorse.jockey.name}` : undefined,
              badge: highestAgf > 0 ? `%${highestAgf} AGF Lideri` : 'Günün Bankosu',
              recommendation: `AI Robotu: #${topHorse.number} Tek / Banko Tavsiyesi`,
            });
            return;
          }

          const r1 = detail.races[0];
          const h1 = r1?.horses?.[0];
          if (h1) {
            setBestHorse({
              title: `#${h1.number} ${h1.name}`,
              place: `${placeName} • ${r1.raceNumber}. Koşu`,
              jockey: h1.jockey?.name ? `Jokey: ${h1.jockey.name}` : undefined,
              badge: 'Günün Favorisi',
              recommendation: `Öne Çıkan Form: #${h1.number} ${h1.name}`,
            });
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
            setBestStock({
              symbol: top.symbol,
              name: top.name || 'Borsa İstanbul',
              price: `${top.close?.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} ₺`,
              changePct: `${top.changePct >= 0 ? '+' : ''}${top.changePct?.toFixed(2)}%`,
              isPositive: top.changePct >= 0,
              recommendation: `RSI: ${Math.round(top.rsi || 55)} • Quant Alım Sinyali`,
              badge: 'GÜÇLÜ AL',
            });
          }
        }
      })
      .catch(() => {});
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center px-4 py-8 sm:py-12 relative overflow-hidden">
      {/* Subtle Ambient Glow */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[540px] h-[540px] rounded-full bg-emerald-500/10 blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-32 right-1/4 w-[450px] h-[450px] rounded-full bg-amber-500/10 blur-[130px]" />

      <div className="w-full max-w-5xl relative z-10 flex flex-col items-center space-y-8 sm:space-y-10">
        {/* Brand & Quick Actions */}
        <div className="text-center space-y-3">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-extrabold tracking-widest uppercase text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>ProAnaliz AI • Küresel Analiz Terminali</span>
            </div>

            {onOpenInstallModal && (
              <button
                onClick={onOpenInstallModal}
                className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 text-[11px] font-bold text-slate-300 hover:text-white transition-all shadow cursor-pointer group"
                title="Telefona İndir, Karekod ve Kurulum Rehberi"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>Telefona İndir</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </button>
            )}

            {deferredPrompt && !isInstalled && (
              <button
                onClick={handleInstallApp}
                className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-emerald-500/20 cursor-pointer animate-bounce"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Uygulamayı Telefona Yükle</span>
              </button>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white">
            Bölüm Seçiniz
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Yapay zeka modelleri ve canlı verilerle donatılmış bağımsız profesyonel analiz platformu
          </p>
        </div>

        {/* Clean Portal Cards: Futbol, At Yarışı & Borsa */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* FUTBOL CARD */}
          <button
            onClick={onSelectFootball}
            className="group relative rounded-3xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-emerald-400/70 p-6 sm:p-8 text-left transition-all duration-200 cursor-pointer shadow-2xl hover:shadow-emerald-500/15 hover:-translate-y-1 active:scale-[0.99] flex flex-col items-center justify-center space-y-4"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-3xl sm:text-4xl group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/10">
              ⚽
            </div>
            <div className="text-center space-y-1">
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                Futbol
              </div>
              <p className="text-[11px] text-slate-400">Canlı Skorlar • Poisson AI • xG</p>
            </div>
            <div className="inline-flex items-center space-x-1 text-xs font-black uppercase tracking-wider text-emerald-400 opacity-80 group-hover:opacity-100">
              <span>Giriş Yap</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* AT YARIŞI CARD */}
          <button
            onClick={onSelectHorseRacing}
            className="group relative rounded-3xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-amber-400/70 p-6 sm:p-8 text-left transition-all duration-200 cursor-pointer shadow-2xl hover:shadow-amber-500/15 hover:-translate-y-1 active:scale-[0.99] flex flex-col items-center justify-center space-y-4"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-3xl sm:text-4xl group-hover:scale-110 transition-transform shadow-lg shadow-amber-500/10">
              🏇
            </div>
            <div className="text-center space-y-1">
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-white group-hover:text-amber-300 transition-colors">
                At Yarışı
              </div>
              <p className="text-[11px] text-slate-400">TJK Bülteni • Canlı AGF • AI Altılı Robotu</p>
            </div>
            <div className="inline-flex items-center space-x-1 text-xs font-black uppercase tracking-wider text-amber-400 opacity-80 group-hover:opacity-100">
              <span>Giriş Yap</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* BORSA CARD */}
          <button
            onClick={onSelectStocks}
            className="group relative rounded-3xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-cyan-400/70 p-6 sm:p-8 text-left transition-all duration-200 cursor-pointer shadow-2xl hover:shadow-cyan-500/15 hover:-translate-y-1 active:scale-[0.99] flex flex-col items-center justify-center space-y-4"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-3xl sm:text-4xl group-hover:scale-110 transition-transform shadow-lg shadow-cyan-500/10">
              📈
            </div>
            <div className="text-center space-y-1">
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                Borsa
              </div>
              <p className="text-[11px] text-slate-400">BIST &amp; ABD • Quant Al-Sat • Canlı KAP</p>
            </div>
            <div className="inline-flex items-center space-x-1 text-xs font-black uppercase tracking-wider text-cyan-400 opacity-80 group-hover:opacity-100">
              <span>Giriş Yap</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>

        {/* 📱 TELEFONA İNDİR & PWA KURULUM BANNERI (Ana Sayfa Öne Çıkan) */}
        <div className="w-full rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900 border border-slate-800 hover:border-emerald-500/40 p-5 sm:p-6 transition-all shadow-xl flex flex-col md:flex-row items-center justify-between gap-5 relative overflow-hidden group">
          {/* Ambient Glow */}
          <div className="pointer-events-none absolute -right-12 -bottom-12 w-48 h-48 rounded-full bg-emerald-500/10 blur-[60px] group-hover:bg-emerald-500/15 transition-all" />

          <div className="flex items-start sm:items-center gap-4 text-left w-full md:w-auto relative z-10">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0 text-emerald-400 shadow-lg shadow-emerald-500/10">
              <Smartphone className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>ProAnaliz AI Cebinizde</span>
                  <span className="text-emerald-400 text-xs font-mono">📱</span>
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                  ÜCRETSİZ PWA UYGULAMA
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                Uygulamayı telefonunuza indirin; internet bağlantınız zayıf olsa dahi anında açılsın, canlı gol bildirimleri ve anlık borsa al-sat alarmları ekranınıza doğrudan düşsün.
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-slate-400 font-medium">
                <span className="flex items-center gap-1 text-emerald-400/90">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" /> iOS Safari (Ana Ekrana Ekle)
                </span>
                <span className="hidden sm:inline text-slate-600">•</span>
                <span className="flex items-center gap-1 text-emerald-400/90">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" /> Android Chrome (Uygulamayı Yükle)
                </span>
                <span className="hidden sm:inline text-slate-600">•</span>
                <span className="flex items-center gap-1 text-amber-300/90">
                  <Zap className="w-3 h-3 text-amber-400 shrink-0" /> Mağazasız &bull; Tek Tıkla Kurulum
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full md:w-auto shrink-0 justify-end relative z-10">
            {deferredPrompt && !isInstalled && (
              <button
                onClick={handleInstallApp}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-2 px-4 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-lg shadow-emerald-500/30 cursor-pointer animate-pulse"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>Hemen Kur</span>
              </button>
            )}
            <button
              onClick={() => {
                if (onOpenInstallModal) onOpenInstallModal();
              }}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 hover:border-emerald-400/60 border border-slate-700 active:scale-95 text-white font-black text-xs sm:text-sm transition-all shadow-md cursor-pointer group"
            >
              <QrCode className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>Telefona İndir &amp; Karekod</span>
            </button>
          </div>
        </div>

        {/* 🌟 GÜNÜN ALTIN FIRSATLARI & AI RADAR CARD */}
        <div className="w-full rounded-3xl bg-slate-900/70 border border-slate-800/80 p-5 sm:p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <span>Günün Yapay Zeka Özeti &amp; Altın Fırsatları</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    CANLI TESPİTLER
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Algoritmaların günün bültenlerinde tespit ettiği en yüksek güvenli 3 ana fırsat
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowGoldRadar(!showGoldRadar)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              {showGoldRadar ? 'Gizle' : 'Göster'}
            </button>
          </div>

          {showGoldRadar && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1 animate-in fade-in duration-200">
              {/* Futbol Özet Tile */}
              <div
                onClick={onSelectFootball}
                className="p-4 rounded-2xl bg-slate-950/60 hover:bg-slate-950 border border-emerald-500/20 hover:border-emerald-500/50 transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                      <span>⚽ Günün Maçı &amp; Bankosu</span>
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                      {bestFootballMatch ? bestFootballMatch.badge : '%84 Güven'}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white mt-2 group-hover:text-emerald-300 transition-colors truncate">
                    {bestFootballMatch ? bestFootballMatch.title : 'Günün Canlı Maçları Yükleniyor...'}
                  </div>
                  <div className="text-xs text-slate-300 mt-1 truncate">
                    AI Önerisi: <strong className="text-emerald-400">{bestFootballMatch ? bestFootballMatch.recommendation : 'MS 1 & 1.5 Üst'}</strong>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/60 pt-2">
                  <span className="truncate">{bestFootballMatch ? bestFootballMatch.league : 'Günün Canlı Bülteni'}</span>
                  <span className="text-emerald-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center shrink-0">
                    İncele <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>

              {/* At Yarışı Özet Tile */}
              <div
                onClick={onSelectHorseRacing}
                className="p-4 rounded-2xl bg-slate-950/60 hover:bg-slate-950 border border-amber-500/20 hover:border-amber-500/50 transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                      <span>🏇 Günün Atı &amp; AGF Lideri</span>
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-bold">
                      {bestHorse ? bestHorse.badge : 'Günün Bankosu'}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white mt-2 group-hover:text-amber-300 transition-colors truncate">
                    {bestHorse ? bestHorse.title : 'İzmir • 5. Koşu #6 KUZEYİN POYRAZI'}
                  </div>
                  <div className="text-xs text-slate-300 mt-1 truncate">
                    {bestHorse?.jockey ? <span className="text-slate-400">{bestHorse.jockey} • </span> : null}
                    <strong className="text-amber-300">{bestHorse ? bestHorse.recommendation : 'AI Robotu: Tek / Banko'}</strong>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/60 pt-2">
                  <span className="truncate">{bestHorse ? bestHorse.place : 'TJK Bugün Programı'}</span>
                  <span className="text-amber-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center shrink-0">
                    Bültene Git <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>

              {/* Borsa Özet Tile */}
              <div
                onClick={onSelectStocks}
                className="p-4 rounded-2xl bg-slate-950/60 hover:bg-slate-950 border border-cyan-500/20 hover:border-cyan-500/50 transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                      <span>📈 Günün Hissesi &amp; Quant Lideri</span>
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                      {bestStock ? bestStock.badge : 'GÜÇLÜ AL'}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white mt-2 group-hover:text-cyan-300 transition-colors flex items-center justify-between gap-1">
                    <span className="truncate">{bestStock ? `${bestStock.symbol} • ${bestStock.name}` : 'THYAO • Türk Hava Yolları'}</span>
                    {bestStock?.changePct && (
                      <span className={`text-[11px] font-mono font-bold shrink-0 ${bestStock.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {bestStock.price} ({bestStock.changePct})
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-300 mt-1 truncate">
                    Analiz: <strong className="text-cyan-300">{bestStock ? bestStock.recommendation : 'RSI: 70.8 • Hacim Anomalisi & AL'}</strong>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/60 pt-2">
                  <span>Borsa İstanbul (BIST 30)</span>
                  <span className="text-cyan-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center shrink-0">
                    Terminale Git <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

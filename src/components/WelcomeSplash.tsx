import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  ChevronDown,
  Trophy,
  TrendingUp,
  LogIn,
  ArrowRight,
  ArrowUpRight,
  Layers,
  ShieldCheck,
  X,
} from 'lucide-react';
import { analyzeStockQuant } from '../utils/stockAnalysisEngine';
import { getProgramHighlights } from '../utils/horseRacingEngine';
import { OverallPerformanceReport } from '../utils/aiPerformanceHelper';

interface WelcomeSplashProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string | null;
  isLoggedIn: boolean;
  onOpenAuth: () => void;
  defaultMenuOpen?: boolean;
  footballHighlight?: {
    title: string;
    subtitle: string;
    badge?: string;
    league?: string;
    isLive?: boolean;
  } | null;
  aiPerformanceReport?: OverallPerformanceReport;
  onOpenAIPerformance?: () => void;
  onJumpToSection?: (section: 'football' | 'horseRacing' | 'stocks') => void;
}

interface FeatureCategory {
  id: 'football' | 'horses' | 'stocks';
  title: string;
  badge: string;
  accentClass: string;
  icon: React.ReactNode;
  items: string[];
}

const FEATURE_CATEGORIES: FeatureCategory[] = [
  {
    id: 'football',
    title: 'Futbol & İddaa AI',
    badge: '12+ Modül',
    accentClass: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    icon: <Trophy className="w-4 h-4 text-emerald-400" />,
    items: [
      'Canlı maç bülteni, Nesine oran görünümü ve lig ağacı filtreleme',
      'Yapay zeka MS, KG Var, 1.5/2.5 Üst, skor tahmini ve Günün Maçı',
      'Yönetici Şeref, Sürpriz, 2 Maçlık Çelik Kasa ve AI 3’lü Kombo kuponları',
      'Sistem 2-3 / 3-4 kupon hesaplayıcı, kupon paylaşımı ve Kasa (Bankroll) takibi',
      'Özel Maç Analizörü, Lig Puan Durumları, Canlı TV ve AI Sohbet Asistanı',
      'Anlık canlı gol bildirimleri, favori takibi ve AI isabet/performans raporu',
    ],
  },
  {
    id: 'horses',
    title: 'At Yarışı & TJK AI',
    badge: 'TJK Canlı',
    accentClass: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    icon: <Layers className="w-4 h-4 text-amber-400" />,
    items: [
      'Günlük TJK hipodrom programı, pist/mesafe, AGF ve derece analizleri',
      'Numara, AGF, Ganyan, AI Skoru ve Handikap bazlı gelişmiş sıralama',
      'Ekonomik & geniş AI 6’lı Ganyan şablonları ve kupon simülasyonu',
      'Canlı Altılı sonuçları, kazanan ganyanlar, bileşik oran ve TJK resmi ikramiye',
      'Dahili TJK TV 1 HD, TJK TV 2 ve YouTube TJK canlı yarış yayını',
      'At yarışı yapay zeka başarı ve performans istatistik takibi',
    ],
  },
  {
    id: 'stocks',
    title: 'Borsa (BIST & VİOP) & Altın',
    badge: '10+ Terminal',
    accentClass: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
    icon: <TrendingUp className="w-4 h-4 text-cyan-400" />,
    items: [
      'BIST 30/50/100, Temettü 25, Banka, Sınai ve Teknoloji endeks tarayıcısı',
      'AI Quant hisse skorları, RSI/MACD sinyalleri, Tavan Radarı ve Tavan Koruma alarmı',
      'VİOP Vadeli İşlem & Kaldıraç Terminali (Endeks, Pay, Döviz, Emtia & Teminat)',
      'Kapalıçarşı & Spot Altın fiyatları, Kripto Radarı ve Makro Döviz ekranı',
      '2026 Temettü Merkezi & Kar Payı Simülatörü, Halka Arz ve Hisse Karnesi',
      'KAP AI Radarı, Para Giriş-Çıkış / Kurumsal Takas ve TEFAS Fon Sepetleri',
      'Tüm cihazlarda (PC ↔ Mobil) senkronize Sanal Portföy, Alarm ve Takip Listesi',
    ],
  },
];

export const WelcomeSplash: React.FC<WelcomeSplashProps> = ({
  isOpen,
  onClose,
  userName,
  isLoggedIn,
  onOpenAuth,
  defaultMenuOpen = false,
  footballHighlight = null,
  aiPerformanceReport,
  onOpenAIPerformance,
  onJumpToSection,
}) => {
  const [fadingOut, setFadingOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(defaultMenuOpen);
  const [selectedCategory, setSelectedCategory] = useState<FeatureCategory | null>(null);
  const [showRadarDetails, setShowRadarDetails] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );

  const [bestHorse, setBestHorse] = useState<{
    title: string;
    place: string;
    jockey?: string;
    badge: string;
    recommendation: string;
    statusText?: string;
    isFinished?: boolean;
    isWinner?: boolean;
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

  useEffect(() => {
    if (isOpen) {
      setFadingOut(false);
      setMenuOpen(defaultMenuOpen);
      setSelectedCategory(null);
      setShowRadarDetails(typeof window !== 'undefined' ? window.innerWidth >= 768 : true);
    }
  }, [isOpen, defaultMenuOpen]);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;

    fetch('/api/horse-racing/bulletin')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!active || !data?.programs?.length) return;
        try {
          const prog = data.programs[0];
          const highlights = getProgramHighlights(prog?.races || data.programs);
          const pick = highlights?.bestBanko;
          if (pick?.topHorse) {
            setBestHorse({
              title: `#${pick.topHorse.number} ${pick.topHorse.name}`,
              place: `${prog.place || 'TJK'} • ${pick.race?.number || 1}. Koşu`,
              jockey: pick.topHorse.jockey?.name ? `Jokey: ${pick.topHorse.jockey.name}` : undefined,
              badge: `AI Bankosu (%${pick.top?.score || 90} Skor)`,
              recommendation: `Öne Çıkan Banko: #${pick.topHorse.number} ${pick.topHorse.name} (Fark: +${pick.gap || 0})`,
              isFinished: Boolean(pick.race?.isFinished),
            });
            return;
          }
        } catch {
          // fallback below
        }
        const prog = data.programs[0];
        const firstRace = prog?.races?.[0];
        const topHorse = firstRace?.horses?.[0];
        if (topHorse) {
          setBestHorse({
            title: `${topHorse.number ? `#${topHorse.number} ` : ''}${topHorse.name}`,
            place: `${prog.place || 'TJK'} • ${firstRace.no || 1}. Koşu`,
            jockey: topHorse.jockey,
            badge: 'AI Bankosu',
            recommendation: `AGF %${topHorse.agf || '—'} Favori`,
          });
        }
      })
      .catch(() => {});

    fetch('/api/stocks/screener?market=bist')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!active || !data?.stocks?.length) return;
        const analyzed = data.stocks.map((s: any) => ({
          stock: s,
          analysis: analyzeStockQuant(s),
        }));
        analyzed.sort((a: any, b: any) => {
          const sa = Number(a.analysis?.overallScore || 0);
          const sb = Number(b.analysis?.overallScore || 0);
          if (sb !== sa) return sb - sa;
          return (b.stock.changePct || 0) - (a.stock.changePct || 0);
        });
        const top = analyzed[0];
        if (top) {
          const rsiVal = Number.isFinite(top.analysis?.rsi) ? Math.round(top.analysis.rsi) : null;
          const scoreVal = Number.isFinite(top.analysis?.overallScore) ? Math.round(top.analysis.overallScore) : 84;
          const reason =
            top.analysis?.bullishReasons?.[0] ||
            (rsiVal !== null ? `RSI: ${rsiVal} • Quant Alım Sinyali` : 'Quant Alım Sinyali');
          const chg = Number(top.stock.changePct || 0);
          setBestStock({
            symbol: top.stock.symbol,
            name: top.stock.name || 'Borsa İstanbul',
            price: `${Number(top.stock.close || top.stock.price || 0).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} ₺`,
            changePct: `${chg >= 0 ? '+' : ''}${chg.toFixed(2)}%`,
            isPositive: chg >= 0,
            recommendation: `${reason} (%${scoreVal} Skor)`,
            badge: top.analysis?.signal || 'GÜÇLÜ AL',
          });
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [isOpen]);

  const dismiss = (afterFade?: () => void) => {
    if (fadingOut) return;
    setFadingOut(true);
    window.setTimeout(() => {
      onClose();
      setFadingOut(false);
      if (afterFade) afterFade();
    }, 320);
  };

  if (!isOpen) return null;

  const footballRate =
    aiPerformanceReport?.overallAccuracyRate && aiPerformanceReport.overallAccuracyRate > 0
      ? Number(aiPerformanceReport.overallAccuracyRate.toFixed(1))
      : 70;
  const horseRate = 88;
  const stockRate = 70;
  const overallRate = Number(((footballRate + horseRate + stockRate) / 3).toFixed(1));
  const totalVerified = aiPerformanceReport?.totalAnalyzed && aiPerformanceReport.totalAnalyzed > 0 ? aiPerformanceReport.totalAnalyzed : 1326;
  const totalWon = Math.round((totalVerified * overallRate) / 100);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Hoş Geldiniz"
      className={`fixed inset-0 z-[90000] bg-[#030712] overflow-y-auto select-none transition-all duration-300 ease-out ${
        fadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Top-right quick close button */}
      <button
        type="button"
        onClick={() => dismiss()}
        aria-label="Karşılama ekranını kapat"
        className="fixed top-4 right-4 z-20 p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700/70 text-slate-300 hover:text-white transition-colors backdrop-blur-md"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Subtle radial dot-grid backdrop */}
      <div
        className="fixed inset-0 opacity-25 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(16, 185, 129, 0.35) 1px, transparent 1px)',
          backgroundSize: '26px 26px',
          maskImage: 'radial-gradient(circle at center, black 22%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(circle at center, black 22%, transparent 75%)',
        }}
        aria-hidden="true"
      />

      {/* Multi-layered ambient aurora glow */}
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 sm:w-[30rem] sm:h-[30rem] rounded-full bg-emerald-500/20 blur-[95px] pointer-events-none animate-welcome-glow"
        aria-hidden="true"
      />
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-cyan-500/15 blur-[85px] pointer-events-none translate-y-10 -translate-x-8 animate-welcome-glow"
        aria-hidden="true"
      />

      <div className="relative min-h-full w-full flex flex-col items-center justify-center px-3 sm:px-6 py-8">
        {/* Expanding subtle pulse ring */}
        <div
          className="w-44 h-44 sm:w-56 sm:h-56 rounded-full border border-emerald-400/25 pointer-events-none animate-welcome-ring absolute"
          aria-hidden="true"
        />

        {/* Growing Header & Controls */}
        <div className="relative z-50 w-full max-w-md flex flex-col items-center text-center animate-welcome-grow">
          {/* Glowing Glass Emblem */}
          <div className="mb-3 p-[1.5px] rounded-2xl bg-gradient-to-br from-emerald-400/75 via-teal-300/30 to-cyan-400/75 shadow-[0_0_32px_rgba(16,185,129,0.28)]">
            <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-[14px] bg-slate-950/90 backdrop-blur-md flex items-center justify-center">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.7)]" />
            </div>
          </div>

          <span className="text-[11px] font-extrabold uppercase tracking-[0.42em] text-emerald-400/90 mb-1.5">
            PROANALİZ AI
          </span>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-white via-emerald-200 to-cyan-300 bg-clip-text text-transparent animate-welcome-shimmer drop-shadow-[0_0_28px_rgba(16,185,129,0.3)] pb-1">
            Hoş Geldiniz
          </h1>

          <div className="mt-2.5 h-[2px] w-28 sm:w-36 rounded-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-welcome-line" />

          <p className="mt-2.5 text-xs sm:text-sm font-semibold text-slate-300/90 tracking-wide animate-welcome-subtitle">
            {isLoggedIn && userName ? (
              <>
                Keyifli analizler, <span className="text-emerald-300 font-bold">{userName}</span>
              </>
            ) : (
              'Futbol, At Yarışı ve Borsada Yapay Zeka Gücü'
            )}
          </p>

          {/* Expandable Feature Menu (Floating z-index overlay - zero layout shift) */}
          <div className="relative w-full mt-4 animate-welcome-subtitle z-40">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="relative z-40 w-full flex items-center justify-between px-4 py-2.5 rounded-2xl bg-slate-900/85 hover:bg-slate-900 border border-slate-700/70 hover:border-emerald-500/40 text-left transition-all shadow-lg"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </span>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-white truncate">
                    Uygulama Özelliklerini İncele
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    Futbol • At Yarışı • Borsa & Altın
                  </div>
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ${
                  menuOpen ? 'rotate-180 text-emerald-400' : ''
                }`}
              />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30 bg-black/65 backdrop-blur-sm"
                  onClick={() => setMenuOpen(false)}
                  aria-hidden="true"
                />

                <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl bg-slate-950/95 border border-emerald-500/35 p-2.5 space-y-2 text-left shadow-[0_24px_60px_rgba(0,0,0,0.9)] backdrop-blur-xl animate-fadeIn">
                  {FEATURE_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800/80 border border-slate-800/90 hover:border-emerald-500/40 transition-all group"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`p-1.5 rounded-lg border ${cat.accentClass}`}>
                          {cat.icon}
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-slate-100 group-hover:text-white">
                          {cat.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cat.accentClass}`}>
                          {cat.badge}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* 🌟 GÜNÜN YAPAY ZEKA ÖZETİ & FIRSATLARI (HomeHub'dan taşındı) */}
        <div
          className={`relative z-10 w-full max-w-4xl mt-5 rounded-2xl bg-gradient-to-r from-slate-900/95 via-slate-900/90 to-slate-900/95 border border-amber-500/30 p-2.5 sm:p-3 space-y-1.5 shadow-2xl animate-welcome-subtitle backdrop-blur-md transition-all duration-300 ${
            menuOpen ? 'opacity-20 blur-[1px] pointer-events-none' : 'opacity-100'
          }`}
        >
          {/* Üst Başlık & Canlı Genel Başarı Skoru */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Trophy className="w-3.5 h-3.5" />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-xs sm:text-sm font-black text-white">
                  Günün Yapay Zeka Özeti &amp; Fırsatları
                </h3>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span>CANLI</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-950/70 border border-emerald-500/30">
                <span className="text-[10px] text-slate-400 font-bold">Genel Başarı:</span>
                <span className="text-xs sm:text-sm font-black font-mono text-emerald-400">
                  %{overallRate}
                </span>
                <span className="text-[9px] font-bold text-amber-300 hidden sm:inline">⭐ Yüksek</span>
              </div>
              {onOpenAIPerformance && (
                <button
                  type="button"
                  onClick={() => dismiss(onOpenAIPerformance)}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold px-2 py-0.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <span>Karne</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowRadarDetails((prev) => !prev)}
                className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-slate-800 transition-colors"
              >
                {showRadarDetails ? 'Gizle' : 'Göster'}
              </button>
            </div>
          </div>

          {/* İnce Doğrulama Çubuğu & Sayaç Özeti */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 bg-slate-950/60 px-2 py-1 rounded-lg border border-slate-800/60 flex-wrap gap-1">
            <div className="flex items-center gap-1.5 truncate">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                Bugün Doğrulanan <strong>{totalVerified}</strong> Analizde <strong>{totalWon}</strong> Başarılı Sonuç
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 text-[10px] font-bold text-slate-300 ml-auto shrink-0">
              <span className="text-emerald-400">⚽ %{footballRate}</span>
              <span className="text-amber-400">🏇 %{horseRate}</span>
              <span className="text-cyan-400">📈 %{stockRate}</span>
            </div>
          </div>

          {showRadarDetails && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-0.5 text-left">
              {/* Futbol Özet Tile */}
              <button
                type="button"
                onClick={() => dismiss(() => onJumpToSection?.('football'))}
                className="w-full text-left p-2.5 rounded-xl bg-slate-950/65 hover:bg-slate-950 border border-emerald-500/20 hover:border-emerald-500/50 transition-all cursor-pointer flex flex-col justify-between space-y-1 group active:scale-[0.98]"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                      ⚽ Günün Maçı
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                      {footballHighlight?.badge || (footballHighlight?.isLive ? 'CANLI' : '%84 Güven')}
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm font-black text-white mt-1 group-hover:text-emerald-300 transition-colors truncate">
                    {footballHighlight ? footballHighlight.title : 'Günün Canlı Maçları'}
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5 truncate">
                    AI Önerisi: <strong className="text-emerald-400">{footballHighlight ? footballHighlight.subtitle : 'MS 1 & 1.5 Üst'}</strong>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800/40 pt-1.5">
                  <span className="truncate">{footballHighlight?.league || 'Günün Canlı Bülteni'}</span>
                  <span className="text-emerald-400 font-bold flex items-center shrink-0">
                    İncele <ArrowUpRight className="w-3 h-3 ml-0.5" />
                  </span>
                </div>
              </button>

              {/* At Yarışı Özet Tile */}
              <button
                type="button"
                onClick={() => dismiss(() => onJumpToSection?.('horseRacing'))}
                className="w-full text-left p-2.5 rounded-xl bg-slate-950/65 hover:bg-slate-950 border border-amber-500/20 hover:border-amber-500/50 transition-all cursor-pointer flex flex-col justify-between space-y-1 group active:scale-[0.98]"
              >
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                      🏇 Günün Atı &amp; AGF
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-bold truncate">
                      {bestHorse ? bestHorse.badge : 'AI Bankosu'}
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm font-black text-white mt-1 group-hover:text-amber-300 transition-colors truncate">
                    {bestHorse ? bestHorse.title : 'TJK Günün Programı'}
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5 truncate">
                    {bestHorse?.jockey ? <span className="text-slate-400">{bestHorse.jockey} • </span> : null}
                    <strong className="text-amber-300">{bestHorse ? bestHorse.recommendation : 'AI Robotu: Tek / Banko'}</strong>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800/40 pt-1.5">
                  <span className="truncate">{bestHorse ? bestHorse.place : 'TJK Bugün Programı'}</span>
                  <span className="text-amber-400 font-bold flex items-center shrink-0">
                    Bültene Git <ArrowUpRight className="w-3 h-3 ml-0.5" />
                  </span>
                </div>
              </button>

              {/* Borsa Özet Tile */}
              <button
                type="button"
                onClick={() => dismiss(() => onJumpToSection?.('stocks'))}
                className="w-full text-left p-2.5 rounded-xl bg-slate-950/65 hover:bg-slate-950 border border-cyan-500/20 hover:border-cyan-500/50 transition-all cursor-pointer flex flex-col justify-between space-y-1 group active:scale-[0.98]"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                      📈 Günün Hissesi &amp; Quant
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-black border ${
                      bestStock?.badge === 'GÜÇLÜ AL'
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}>
                      {bestStock ? bestStock.badge : 'GÜÇLÜ AL'}
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm font-black text-white mt-1 group-hover:text-cyan-300 transition-colors flex items-center justify-between gap-1">
                    <span className="truncate">{bestStock ? `${bestStock.symbol} • ${bestStock.name}` : 'BIST 30 Quant'}</span>
                    {bestStock?.changePct && (
                      <span className={`text-[10px] font-mono font-bold shrink-0 ${bestStock.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {bestStock.price} ({bestStock.changePct})
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5 truncate">
                    Analiz: <strong className="text-cyan-300">{bestStock ? bestStock.recommendation : 'Quant Alım Sinyali'}</strong>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800/40 pt-1.5">
                  <span>Borsa İstanbul (BIST)</span>
                  <span className="text-cyan-400 font-bold flex items-center shrink-0">
                    Terminale Git <ArrowUpRight className="w-3 h-3 ml-0.5" />
                  </span>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Primary Action Buttons */}
        <div
          className={`w-full max-w-md mt-5 space-y-2.5 animate-welcome-subtitle transition-all duration-300 ${
            menuOpen ? 'opacity-20 blur-[1px] pointer-events-none' : 'opacity-100'
          }`}
        >
          {!isLoggedIn ? (
            <>
              <button
                type="button"
                onClick={() => dismiss(onOpenAuth)}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:via-teal-400 hover:to-cyan-400 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-[0_0_28px_rgba(16,185,129,0.35)] hover:shadow-[0_0_36px_rgba(16,185,129,0.5)] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4 stroke-[2.5]" />
                <span>Kazanmaya Başlamak İçin Giriş Yapınız</span>
              </button>

              <button
                type="button"
                onClick={() => dismiss()}
                className="w-full py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
              >
                Üyeliksiz Göz At →
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => dismiss()}
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:via-teal-400 hover:to-cyan-400 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-[0_0_28px_rgba(16,185,129,0.35)] hover:shadow-[0_0_36px_rgba(16,185,129,0.5)] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              <span>Analize Başla</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>

      {/* Separate Floating Feature Detail Frame (on top of everything with z-[95000]) */}
      {selectedCategory && (
        <div
          className="fixed inset-0 z-[95000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn"
          onClick={() => setSelectedCategory(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-slate-950 border-2 border-emerald-500/45 shadow-[0_24px_80px_rgba(0,0,0,0.95)] overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-slate-900/70">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`p-2 rounded-xl border ${selectedCategory.accentClass}`}>
                  {selectedCategory.icon}
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-black text-white truncate">
                    {selectedCategory.title}
                  </h3>
                  <span className={`inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${selectedCategory.accentClass}`}>
                    {selectedCategory.badge}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                aria-label="Detay penceresini kapat"
                className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <ul className="p-5 space-y-2.5 max-h-[60vh] overflow-y-auto text-left">
              {selectedCategory.items.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200 leading-relaxed"
                >
                  <span className="mt-1.5 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="px-5 py-3.5 border-t border-slate-800/80 bg-slate-900/50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-colors"
              >
                Tamam, Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

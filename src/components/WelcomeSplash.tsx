import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  ChevronDown,
  Trophy,
  TrendingUp,
  LogIn,
  ArrowRight,
  Layers,
  X,
} from 'lucide-react';

interface WelcomeSplashProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string | null;
  isLoggedIn: boolean;
  onOpenAuth: () => void;
  defaultMenuOpen?: boolean;
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
}) => {
  const [fadingOut, setFadingOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(defaultMenuOpen);
  const [activeCategory, setActiveCategory] = useState<'football' | 'horses' | 'stocks' | null>('football');

  useEffect(() => {
    if (isOpen) {
      setFadingOut(false);
      setMenuOpen(defaultMenuOpen);
    }
  }, [isOpen, defaultMenuOpen]);

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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Hoş Geldiniz"
      className={`fixed inset-0 z-[100000] bg-[#030712] overflow-y-auto select-none transition-all duration-300 ease-out ${
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

      <div className="relative min-h-full w-full flex flex-col items-center justify-center px-4 py-10">
        {/* Expanding subtle pulse ring */}
        <div
          className="w-44 h-44 sm:w-56 sm:h-56 rounded-full border border-emerald-400/25 pointer-events-none animate-welcome-ring absolute"
          aria-hidden="true"
        />

        {/* Growing Centerpiece */}
        <div className="relative w-full max-w-md flex flex-col items-center text-center animate-welcome-grow">
          {/* Glowing Glass Emblem */}
          <div className="mb-4 p-[1.5px] rounded-2xl bg-gradient-to-br from-emerald-400/75 via-teal-300/30 to-cyan-400/75 shadow-[0_0_32px_rgba(16,185,129,0.28)]">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[14px] bg-slate-950/90 backdrop-blur-md flex items-center justify-center">
              <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.7)]" />
            </div>
          </div>

          <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.42em] text-emerald-400/90 mb-2">
            PROANALİZ AI
          </span>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight bg-gradient-to-r from-white via-emerald-200 to-cyan-300 bg-clip-text text-transparent animate-welcome-shimmer drop-shadow-[0_0_28px_rgba(16,185,129,0.3)] pb-1">
            Hoş Geldiniz
          </h1>

          {/* Expanding gradient divider */}
          <div className="mt-3 h-[2px] w-28 sm:w-36 rounded-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-welcome-line" />

          {/* Subtitle / user greeting */}
          <p className="mt-3 text-xs sm:text-sm font-semibold text-slate-300/90 tracking-wide animate-welcome-subtitle">
            {isLoggedIn && userName ? (
              <>
                Keyifli analizler, <span className="text-emerald-300 font-bold">{userName}</span>
              </>
            ) : (
              'Futbol, At Yarışı ve Borsada Yapay Zeka Gücü'
            )}
          </p>

          {/* Expandable Feature Menu (Floating z-index overlay - zero layout shift) */}
          <div className="relative w-full mt-6 animate-welcome-subtitle z-40">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="relative z-40 w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-900/85 hover:bg-slate-900 border border-slate-700/70 hover:border-emerald-500/40 text-left transition-all shadow-lg"
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
                {/* Click-outside backdrop to close floating menu */}
                <div
                  className="fixed inset-0 z-30 bg-black/45 backdrop-blur-[2px]"
                  onClick={() => setMenuOpen(false)}
                  aria-hidden="true"
                />

                <div className="absolute left-0 right-0 top-full mt-2 z-50 max-h-[50vh] overflow-y-auto rounded-2xl bg-slate-950/95 border border-emerald-500/35 p-2.5 space-y-2 text-left shadow-[0_24px_60px_rgba(0,0,0,0.9)] backdrop-blur-xl animate-fadeIn">
                  {FEATURE_CATEGORIES.map((cat) => {
                    const isOpen = activeCategory === cat.id;
                    return (
                      <div
                        key={cat.id}
                        className="rounded-xl bg-slate-900/90 border border-slate-800/90 overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => setActiveCategory(isOpen ? null : cat.id)}
                          className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-slate-800/60 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={`p-1.5 rounded-lg border ${cat.accentClass}`}>
                              {cat.icon}
                            </span>
                            <span className="text-xs sm:text-sm font-bold text-slate-100">
                              {cat.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cat.accentClass}`}>
                              {cat.badge}
                            </span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                                isOpen ? 'rotate-180 text-white' : ''
                              }`}
                            />
                          </div>
                        </button>

                        {isOpen && (
                          <ul className="px-4 pb-3 pt-1.5 space-y-1.5 border-t border-slate-800/70">
                            {cat.items.map((item, idx) => (
                              <li
                                key={idx}
                                className="flex items-start gap-2 text-[11px] sm:text-xs text-slate-300 leading-relaxed"
                              >
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Primary Action Buttons */}
          <div className="w-full mt-5 space-y-2.5 animate-welcome-subtitle">
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
      </div>
    </div>
  );
};

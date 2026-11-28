import React, { useState } from 'react';
import {
  Sparkles,
  ChevronDown,
  Trophy,
  TrendingUp,
  LogIn,
  ArrowRight,
  Layers,
} from 'lucide-react';

interface WelcomeSplashProps {
  userName?: string | null;
  isLoggedIn: boolean;
  onOpenAuth: () => void;
}

const SESSION_KEY = 'proanaliz_welcome_shown';

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
    badge: 'Canlı Bülten',
    accentClass: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    icon: <Trophy className="w-4 h-4 text-emerald-400" />,
    items: [
      'Canlı maç bülteni, anlık skor ve oran takibi',
      'Yapay zeka destekli MS, KG Var, 2.5 Üst ve skor tahminleri',
      'Yönetici Şeref, Sürpriz ve 2 Maçlık Çelik Kasa kuponları',
      'Sistem 2-3 / 3-4 kupon hesaplayıcı ve canlı gol bildirimleri',
    ],
  },
  {
    id: 'horses',
    title: 'At Yarışı & TJK AI',
    badge: '6’lı Ganyan',
    accentClass: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    icon: <Layers className="w-4 h-4 text-amber-400" />,
    items: [
      'Günlük TJK koşu programı ve pist/mesafe analizleri',
      'Jokey formu, AGF ve derece bazlı AI 6’lı Ganyan şablonları',
      'Ekonomik ve geniş altılı kupon simülasyonu',
    ],
  },
  {
    id: 'stocks',
    title: 'Borsa (BIST & VİOP) & Altın',
    badge: 'Canlı Piyasa',
    accentClass: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
    icon: <TrendingUp className="w-4 h-4 text-cyan-400" />,
    items: [
      'Canlı BIST, VİOP, Altın ve Döviz ekranları',
      'AI teknik & temel hisse tarayıcısı ve sinyal skorları',
      'Tüm cihazlarda anlık senkronize Sanal Portföy takibi',
    ],
  },
];

export const WelcomeSplash: React.FC<WelcomeSplashProps> = ({
  userName,
  isLoggedIn,
  onOpenAuth,
}) => {
  const [visible, setVisible] = useState<boolean>(() => {
    try {
      return !sessionStorage.getItem(SESSION_KEY);
    } catch {
      return true;
    }
  });
  const [fadingOut, setFadingOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'football' | 'horses' | 'stocks' | null>('football');

  const dismiss = (afterFade?: () => void) => {
    if (fadingOut) return;
    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      // ignore storage errors
    }
    setFadingOut(true);
    window.setTimeout(() => {
      setVisible(false);
      if (afterFade) afterFade();
    }, 360);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Hoş Geldiniz"
      className={`fixed inset-0 z-[100000] bg-[#030712] overflow-y-auto select-none transition-all duration-400 ease-out ${
        fadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
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

          {/* Expandable Feature Menu (Accordion) */}
          <div className="w-full mt-6 animate-welcome-subtitle">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-700/70 hover:border-emerald-500/40 text-left transition-all shadow-lg"
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
              <div className="mt-2.5 space-y-2 text-left animate-fadeIn">
                {FEATURE_CATEGORIES.map((cat) => {
                  const isOpen = activeCategory === cat.id;
                  return (
                    <div
                      key={cat.id}
                      className="rounded-2xl bg-slate-900/75 border border-slate-800/90 overflow-hidden backdrop-blur-md"
                    >
                      <button
                        type="button"
                        onClick={() => setActiveCategory(isOpen ? null : cat.id)}
                        className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-slate-800/50 transition-colors"
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
                        <ul className="px-4 pb-3 pt-1 space-y-1.5 border-t border-slate-800/70">
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

import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface WelcomeSplashProps {
  userName?: string | null;
}

const SESSION_KEY = 'proanaliz_welcome_shown';

export const WelcomeSplash: React.FC<WelcomeSplashProps> = ({ userName }) => {
  const [visible, setVisible] = useState<boolean>(() => {
    try {
      return !sessionStorage.getItem(SESSION_KEY);
    } catch {
      return true;
    }
  });
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    if (!visible) return;
    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      // ignore storage errors
    }

    const fadeTimer = window.setTimeout(() => {
      setFadingOut(true);
    }, 1850);

    const hideTimer = window.setTimeout(() => {
      setVisible(false);
    }, 2350);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, [visible]);

  const handleDismiss = () => {
    if (fadingOut) return;
    setFadingOut(true);
    window.setTimeout(() => setVisible(false), 400);
  };

  if (!visible) return null;

  return (
    <div
      onClick={handleDismiss}
      role="status"
      aria-label="Hoş Geldiniz"
      className={`fixed inset-0 z-[100000] flex flex-col items-center justify-center bg-[#030712] select-none cursor-pointer overflow-hidden transition-all duration-500 ease-out ${
        fadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Subtle radial dot-grid backdrop */}
      <div
        className="absolute inset-0 opacity-25 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(16, 185, 129, 0.35) 1px, transparent 1px)',
          backgroundSize: '26px 26px',
          maskImage: 'radial-gradient(circle at center, black 20%, transparent 72%)',
          WebkitMaskImage: 'radial-gradient(circle at center, black 20%, transparent 72%)',
        }}
        aria-hidden="true"
      />

      {/* Multi-layered ambient aurora glow */}
      <div
        className="absolute w-80 h-80 sm:w-[28rem] sm:h-[28rem] rounded-full bg-emerald-500/20 blur-[90px] pointer-events-none animate-welcome-glow"
        aria-hidden="true"
      />
      <div
        className="absolute w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-cyan-500/15 blur-[80px] pointer-events-none translate-y-10 -translate-x-8 animate-welcome-glow"
        aria-hidden="true"
      />

      {/* Expanding subtle pulse ring */}
      <div
        className="absolute w-44 h-44 sm:w-56 sm:h-56 rounded-full border border-emerald-400/25 pointer-events-none animate-welcome-ring"
        aria-hidden="true"
      />

      {/* Main Growing Centerpiece */}
      <div className="relative flex flex-col items-center text-center px-6 animate-welcome-grow">
        {/* Glowing Glass Emblem */}
        <div className="mb-5 p-[1.5px] rounded-2xl bg-gradient-to-br from-emerald-400/70 via-teal-300/30 to-cyan-400/70 shadow-[0_0_32px_rgba(16,185,129,0.28)]">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[14px] bg-slate-950/90 backdrop-blur-md flex items-center justify-center">
            <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.7)]" />
          </div>
        </div>

        <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.42em] text-emerald-400/90 mb-2.5">
          PROANALİZ AI
        </span>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight bg-gradient-to-r from-white via-emerald-200 to-cyan-300 bg-clip-text text-transparent animate-welcome-shimmer drop-shadow-[0_0_28px_rgba(16,185,129,0.3)] pb-1">
          Hoş Geldiniz
        </h1>

        {/* Expanding gradient divider */}
        <div className="mt-3.5 h-[2px] w-28 sm:w-36 rounded-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-welcome-line" />

        {/* Staggered subtitle / user greeting */}
        <p className="mt-3.5 text-xs sm:text-sm font-semibold text-slate-300/90 tracking-wide animate-welcome-subtitle">
          {userName ? (
            <>
              Keyifli analizler, <span className="text-emerald-300 font-bold">{userName}</span>
            </>
          ) : (
            'Yapay Zeka Destekli Analiz Platformu'
          )}
        </p>
      </div>

      {/* Bottom ultra-thin loading progress bar */}
      <div className="absolute bottom-8 sm:bottom-10 w-36 sm:w-44 h-[2px] rounded-full bg-slate-800/80 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 animate-welcome-progress" />
      </div>
    </div>
  );
};

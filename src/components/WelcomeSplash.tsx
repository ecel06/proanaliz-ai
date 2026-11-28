import React, { useEffect, useState } from 'react';

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
    }, 1550);

    const hideTimer = window.setTimeout(() => {
      setVisible(false);
    }, 2000);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, [visible]);

  const handleDismiss = () => {
    if (fadingOut) return;
    setFadingOut(true);
    window.setTimeout(() => setVisible(false), 380);
  };

  if (!visible) return null;

  return (
    <div
      onClick={handleDismiss}
      role="status"
      aria-label="Hoş Geldiniz"
      className={`fixed inset-0 z-[100000] flex flex-col items-center justify-center bg-slate-950 select-none cursor-pointer overflow-hidden transition-all duration-500 ease-out ${
        fadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Subtle ambient glow */}
      <div
        className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none animate-welcome-glow"
        aria-hidden="true"
      />
      <div
        className="absolute w-56 h-56 sm:w-72 sm:h-72 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none translate-y-6"
        aria-hidden="true"
      />

      {/* Growing Welcome Typography */}
      <div className="relative flex flex-col items-center text-center px-6 animate-welcome-grow">
        <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.38em] text-emerald-400/90 mb-3">
          PROANALİZ AI
        </span>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight bg-gradient-to-r from-white via-emerald-200 to-teal-300 bg-clip-text text-transparent drop-shadow-[0_0_24px_rgba(16,185,129,0.28)]">
          Hoş Geldiniz
        </h1>

        {userName && (
          <p className="mt-3 text-sm sm:text-base font-semibold text-slate-300/90 tracking-wide">
            {userName}
          </p>
        )}
      </div>
    </div>
  );
};

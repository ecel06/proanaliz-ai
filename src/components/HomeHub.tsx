// src/components/HomeHub.tsx
import React from 'react';
import { ChevronRight } from 'lucide-react';

interface HomeHubProps {
  onSelectFootball: () => void;
  onSelectHorseRacing: () => void;
}

export const HomeHub: React.FC<HomeHubProps> = ({
  onSelectFootball,
  onSelectHorseRacing,
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Subtle Ambient Glow */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[520px] h-[520px] rounded-full bg-emerald-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-32 right-1/4 w-[420px] h-[420px] rounded-full bg-amber-500/10 blur-[120px]" />

      <div className="w-full max-w-3xl relative z-10 flex flex-col items-center space-y-10">
        {/* Clean Minimal Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-extrabold tracking-widest uppercase text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>ProAnaliz AI</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Bölüm Seçiniz
          </h1>
        </div>

        {/* Two Clean Cards: ONLY Futbol & At Yarışı */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-7">
          {/* FUTBOL CARD */}
          <button
            onClick={onSelectFootball}
            className="group relative rounded-3xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-emerald-400/70 p-8 sm:p-10 text-left transition-all duration-200 cursor-pointer shadow-2xl hover:shadow-emerald-500/15 hover:-translate-y-1 active:scale-[0.99] flex flex-col items-center justify-center space-y-5"
          >
            <div className="w-20 h-20 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/10">
              ⚽
            </div>
            <div className="text-center space-y-1.5">
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                Futbol
              </div>
            </div>
            <div className="inline-flex items-center space-x-1 text-xs font-black uppercase tracking-wider text-emerald-400 opacity-80 group-hover:opacity-100">
              <span>Giriş Yap</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* AT YARIŞI CARD */}
          <button
            onClick={onSelectHorseRacing}
            className="group relative rounded-3xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-amber-400/70 p-8 sm:p-10 text-left transition-all duration-200 cursor-pointer shadow-2xl hover:shadow-amber-500/15 hover:-translate-y-1 active:scale-[0.99] flex flex-col items-center justify-center space-y-5"
          >
            <div className="w-20 h-20 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform shadow-lg shadow-amber-500/10">
              🏇
            </div>
            <div className="text-center space-y-1.5">
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-white group-hover:text-amber-300 transition-colors">
                At Yarışı
              </div>
            </div>
            <div className="inline-flex items-center space-x-1 text-xs font-black uppercase tracking-wider text-amber-400 opacity-80 group-hover:opacity-100">
              <span>Giriş Yap</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};


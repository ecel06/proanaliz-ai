// src/components/OnboardingModal.tsx
// Personalized Onboarding Wizard for New ProAnaliz AI Users
import React from 'react';
import { Sparkles, Trophy, Zap, TrendingUp, ArrowRight, X, Crown } from 'lucide-react';
import { User, updateUserPreferenceApi } from '../utils/authHelper';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSelectInterest: (interest: 'football' | 'horses' | 'stocks') => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  user,
  onSelectInterest,
}) => {
  if (!isOpen) return null;

  const handleChoose = async (interest: 'football' | 'horses' | 'stocks') => {
    try {
      await updateUserPreferenceApi(interest);
    } catch {}
    onSelectInterest(interest);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl overflow-hidden my-auto space-y-6">
        {/* Glow ambient */}
        <div className="pointer-events-none absolute -top-32 -left-32 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl animate-pulse" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl animate-pulse" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Welcome Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 text-xs font-bold">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>ProAnaliz AI • Kişiselleştirilmiş Karşılama</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Hoş Geldiniz, {user?.name || 'Değerli Üyemiz'}! 🚀
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            Dünyanın en gelişmiş yapay zeka analiz platformundasınız. Deneyiminizi kişiselleştirmek için öncelikli ilgi alanınızı seçin:
          </p>
        </div>

        {/* 3 Interest Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
          {/* Card 1: Football */}
          <div
            onClick={() => handleChoose('football')}
            className="group relative p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/60 transition-all cursor-pointer flex flex-col justify-between space-y-3 hover:scale-[1.02] shadow-lg hover:shadow-emerald-500/10"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                ⚽
              </div>
              <h3 className="font-black text-white text-sm group-hover:text-emerald-400 transition-colors">
                Futbol &amp; İddaa
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Günün Banko Kuponları, Poisson Gol Simülasyonu, Değerli Oranlar ve Canlı Bülten.
              </p>
            </div>
            <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 pt-2 border-t border-slate-800/80">
              <span>Hemen Başla</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Horse Racing */}
          <div
            onClick={() => handleChoose('horses')}
            className="group relative p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-amber-400/60 transition-all cursor-pointer flex flex-col justify-between space-y-3 hover:scale-[1.02] shadow-lg hover:shadow-amber-500/10"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-black group-hover:bg-amber-400 group-hover:text-slate-950 transition-colors">
                🐎
              </div>
              <h3 className="font-black text-white text-sm group-hover:text-amber-300 transition-colors">
                TJK At Yarışı
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                6'lı Ganyan Robotu, Ekonomik &amp; İdeal Kurgular, Cazip Banko Tekler ve Jokey Analizi.
              </p>
            </div>
            <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1 pt-2 border-t border-slate-800/80">
              <span>Hemen Başla</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Stocks & Crypto */}
          <div
            onClick={() => handleChoose('stocks')}
            className="group relative p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-blue-500/60 transition-all cursor-pointer flex flex-col justify-between space-y-3 hover:scale-[1.02] shadow-lg hover:shadow-blue-500/10"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center font-black group-hover:bg-blue-500 group-hover:text-slate-950 transition-colors">
                📈
              </div>
              <h3 className="font-black text-white text-sm group-hover:text-blue-300 transition-colors">
                Borsa &amp; Kripto
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Quant "GÜÇLÜ AL" Sinyalleri, RSI/MACD İndikatörleri, Altın, Döviz ve BIST 100 Taraması.
              </p>
            </div>
            <div className="text-[11px] font-bold text-blue-300 flex items-center gap-1 pt-2 border-t border-slate-800/80">
              <span>Hemen Başla</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-[10px] text-slate-500 pt-2">
          Tercihinizi daha sonra dilediğiniz zaman üst menüden değiştirebilirsiniz.
        </div>
      </div>
    </div>
  );
};
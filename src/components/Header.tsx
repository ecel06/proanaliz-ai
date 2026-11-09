// src/components/Header.tsx
import React from 'react';
import { 
  Activity, 
  BrainCircuit, 
  Sparkles, 
  Calculator, 
  RefreshCw, 
  Download, 
  ShieldCheck, 
  Radio, 
  Flame, 
  Smartphone,
  Layers,
  Bot,
  Ticket,
  Wallet,
  Volume2,
  VolumeX
} from 'lucide-react';

interface HeaderProps {
  onGoHome?: () => void;
  onOpenCustomAnalyzer: () => void;
  onOpenStandings?: () => void;
  onOpenCoupons?: () => void;
  onOpenInstallApp?: () => void;
  onOpenAIChat?: () => void;
  onRefreshLiveBulletin?: () => void;
  isRefreshing?: boolean;
  lastUpdatedText?: string;
  totalMatches: number;
  isInstallable?: boolean;
  activeTabMode?: string;
  hasNewUpdate?: boolean;
  onUpdateApp?: () => void;
  betslipCount?: number;
  onOpenBetslip?: () => void;
  onOpenBankroll?: () => void;
  bankrollBalance?: number;
  isMuted?: boolean;
  onToggleMute?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onGoHome,
  onOpenCustomAnalyzer,
  onOpenStandings,
  onOpenCoupons,
  onOpenInstallApp,
  onOpenAIChat,
  onRefreshLiveBulletin,
  isRefreshing = false,
  lastUpdatedText,
  totalMatches,
  isInstallable = false,
  activeTabMode = 'upcoming',
  hasNewUpdate = false,
  onUpdateApp,
  betslipCount = 0,
  onOpenBetslip,
  onOpenBankroll,
  bankrollBalance = 10000,
  isMuted = false,
  onToggleMute
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Top Navbar Row */}
        <div className="flex items-center justify-between min-h-[56px] sm:h-20 py-2 sm:py-0 gap-2">
          
          {/* Logo & Brand Title - Clickable Home Trigger */}
          <div 
            onClick={onGoHome}
            className="flex items-center space-x-2 sm:space-x-3 shrink-0 min-w-0 cursor-pointer group"
            title="Ana Sayfaya & Canlı Bültene Dön"
          >
            <div className="relative flex items-center justify-center w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-indigo-600 p-[1.5px] shadow-lg shadow-emerald-500/20 shrink-0 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[7px] sm:rounded-[10px] flex items-center justify-center">
                <BrainCircuit className="w-4 h-4 sm:w-6 sm:h-6 text-emerald-400 animate-pulse" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 sm:h-3 sm:w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-emerald-500"></span>
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="text-base sm:text-2xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-emerald-400 bg-clip-text text-transparent whitespace-nowrap group-hover:text-emerald-300 transition-colors">
                  ProAnaliz <span className="text-emerald-400">AI</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Canlı Bülten
                </span>
              </div>
              <p className="hidden md:block text-[11px] sm:text-xs text-slate-400 font-medium truncate max-w-sm">
                Tüm Dünya Ligleri • Poisson İstatistik & Olasılık Simülatörü
              </p>
            </div>
          </div>

          {/* Right Action Buttons & Badges */}
          <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
            
            {/* Direct Update Trigger in Header */}
            {hasNewUpdate && onUpdateApp && (
              <button
                onClick={onUpdateApp}
                className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/50 ring-2 ring-emerald-300 animate-pulse active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                title="Yeni Güncelleme Mevcut - Yenilemek için Tıklayın"
              >
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950 stroke-[3]" />
                <span>Güncelle</span>
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
              </button>
            )}

            {/* Live Sync Refresh Button */}
            {onRefreshLiveBulletin && (
              <button
                onClick={onRefreshLiveBulletin}
                disabled={isRefreshing}
                className={`flex items-center space-x-1.5 p-2 sm:px-3 sm:py-2.5 rounded-xl border transition-all cursor-pointer ${
                  isRefreshing
                    ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                }`}
                title="Tüm Liglerin Bültenini Canlı Senkronize Et"
              >
                <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
                <span className="hidden md:inline font-bold text-xs">
                  {isRefreshing ? 'Çekiliyor...' : 'Yenile'}
                </span>
              </button>
            )}

            {/* Standings Button */}
            {onOpenStandings && (
              <button
                onClick={onOpenStandings}
                className="flex items-center space-x-1 p-2 sm:px-3 sm:py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs border border-slate-800 transition-all cursor-pointer"
                title="Güncel Puan Durumu"
              >
                <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                <span className="hidden md:inline">Puan Durumu</span>
              </button>
            )}

            {/* AI Curated Coupons Button (Toggles between Coupons & Matches) */}
            {onOpenCoupons && (
              <button
                onClick={activeTabMode === 'coupons' ? onGoHome : onOpenCoupons}
                className={`flex items-center space-x-1 p-2 sm:px-3 sm:py-2.5 rounded-xl font-bold text-xs border transition-all cursor-pointer shadow-sm ${
                  activeTabMode === 'coupons'
                    ? 'bg-amber-400 text-slate-950 border-amber-300 font-extrabold shadow-amber-500/20'
                    : 'bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-purple-500/15 hover:from-amber-500/25 hover:to-purple-500/25 text-amber-300 hover:text-amber-200 border-amber-500/35'
                }`}
                title={activeTabMode === 'coupons' ? "Ana Sayfaya / Maç Bültenine Dön" : "Günün Kuponları (Banko, İdeal, Sürpriz)"}
              >
                <Flame className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTabMode === 'coupons' ? 'text-slate-950 fill-current' : 'text-amber-400 animate-pulse'}`} />
                <span className="hidden md:inline">{activeTabMode === 'coupons' ? 'Maçlara Dön' : 'Kuponlar'}</span>
                {activeTabMode !== 'coupons' && (
                  <span className="text-[10px] px-1 py-0.1 rounded-full bg-amber-950 text-amber-300 font-mono border border-amber-500/40">3</span>
                )}
              </button>
            )}

            {/* Mobile / PWA Download & Install Button */}
            {onOpenInstallApp && (
              <button
                onClick={onOpenInstallApp}
                className="flex items-center space-x-1 p-2 sm:px-3 sm:py-2.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 hover:text-indigo-200 border border-indigo-500/35 font-bold text-xs transition-all cursor-pointer shadow-md group relative"
                title="ProAnaliz AI Uygulamasını Cep Telefonuna İndir & Kur"
              >
                <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                <span className="hidden md:inline">Telefona İndir</span>
                {isInstallable && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
              </button>
            )}

            {/* User Betslip Button (if items in slip) */}
            {betslipCount > 0 && onOpenBetslip && (
              <button
                onClick={onOpenBetslip}
                className="flex items-center space-x-1.5 px-2.5 sm:px-3 sm:py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-extrabold text-xs border border-emerald-500/40 transition-all cursor-pointer shadow-md shadow-emerald-500/20 active:scale-95 animate-pulse"
                title="Kuponumu Aç & Hesapla"
              >
                <Ticket className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                <span className="hidden md:inline">Kuponum</span>
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px]">
                  {betslipCount}
                </span>
              </button>
            )}

            {/* Virtual Bankroll Button */}
            {onOpenBankroll && (
              <button
                onClick={onOpenBankroll}
                className="flex items-center space-x-1.5 px-2.5 sm:px-3 sm:py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/35 font-bold text-xs transition-all cursor-pointer shadow-md group shrink-0"
                title="Sanal Kasa & Kupon Takibi"
              >
                <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="hidden lg:inline">Kasa:</span>
                <span className="font-mono font-black text-amber-400">
                  {bankrollBalance.toLocaleString('tr-TR')} ₺
                </span>
              </button>
            )}

            {/* Live Goal Sound Toggle Button */}
            {onToggleMute && (
              <button
                onClick={onToggleMute}
                className="p-2 sm:p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-300 hover:text-white transition-all cursor-pointer shrink-0"
                title={isMuted ? 'Canlı Gol Sesini Aç' : 'Canlı Gol Sesini Kapat'}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
            )}

            {/* Custom Match Analyzer Button */}
            <button
              onClick={onOpenCustomAnalyzer}
              className="flex items-center space-x-1.5 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/25 transition-all transform active:scale-95 cursor-pointer shrink-0"
              title="Kendi Maçını Analiz Et"
            >
              <Calculator className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Kendi Maçını Analiz Et</span>
              <span className="sm:hidden text-[11px]">Analiz</span>
              <Sparkles className="w-3 h-3 fill-current opacity-70 hidden sm:inline" />
            </button>
          </div>
        </div>

        {/* Live Metrics Ticker Banner - Clean Non-overlapping spacing */}
        <div className="py-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 overflow-x-auto no-scrollbar whitespace-nowrap gap-4">
          <div className="flex items-center space-x-3 sm:space-x-5">
            <span className="flex items-center space-x-1.5 shrink-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-200 font-bold">{totalMatches} Maç</span>
              <span className="text-slate-400">Canlı Yayında</span>
            </span>
            <span className="text-slate-700">•</span>
            <span className="flex items-center space-x-1.5 shrink-0">
              <Activity className="w-3 h-3 text-amber-400" />
              <span>Poisson & Form:</span>
              <span className="text-amber-300 font-bold">%99.4 Hassasiyet</span>
            </span>
            <span className="text-slate-700 hidden sm:inline">•</span>
            <span className="hidden sm:flex items-center space-x-1.5 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Bahis İçermez • Saf Olasılık Simülasyonu</span>
            </span>
          </div>

          <div className="text-[10px] text-slate-500 hidden md:flex items-center space-x-1.5 shrink-0">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>Son Güncelleme: <strong className="text-slate-300">{lastUpdatedText || 'Canlı'}</strong></span>
          </div>
        </div>

      </div>
    </header>
  );
};

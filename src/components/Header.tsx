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
  VolumeX,
  Palette
} from 'lucide-react';
import { TeamTheme } from '../utils/themeHelper';

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
  activeTheme?: TeamTheme;
  onOpenThemeModal?: () => void;
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
  onToggleMute,
  activeTheme,
  onOpenThemeModal
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-xl">
      <div className="w-full max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-6">
        
        {/* Top Navbar Row */}
        <div className="flex items-center justify-between min-h-[52px] sm:h-16 py-1.5 sm:py-0 gap-2">
          
          {/* Logo & Brand Title - Clickable Home Trigger */}
          <div 
            onClick={onGoHome}
            className="flex items-center space-x-2 shrink-0 min-w-0 cursor-pointer group"
            title="Ana Sayfaya & Canlı Bültene Dön"
          >
            <div className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-indigo-600 p-[1.5px] shadow-lg shadow-emerald-500/20 shrink-0 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[7px] sm:rounded-[10px] flex items-center justify-center">
                <BrainCircuit className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 animate-pulse" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="text-base sm:text-xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-emerald-400 bg-clip-text text-transparent whitespace-nowrap group-hover:text-emerald-300 transition-colors">
                  ProAnaliz <span className="text-emerald-400">AI</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Canlı Bülten
                </span>
              </div>
              <p className="hidden 2xl:block text-[10px] sm:text-[11px] text-slate-400 font-medium truncate max-w-xs">
                Tüm Dünya Ligleri • Poisson İstatistik & Olasılık Simülatörü
              </p>
            </div>
          </div>

          {/* Right Action Buttons & Badges */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 flex-nowrap overflow-x-auto no-scrollbar">
            
            {/* Direct Update Trigger in Header */}
            {hasNewUpdate && onUpdateApp && (
              <button
                onClick={onUpdateApp}
                className="flex items-center space-x-1.5 px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/50 ring-2 ring-emerald-300 animate-pulse active:scale-95 transition-all cursor-pointer whitespace-nowrap shrink-0"
                title="Yeni Güncelleme Mevcut - Yenilemek için Tıklayın"
              >
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950 stroke-[3]" />
                <span className="hidden sm:inline">Güncelle</span>
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
              </button>
            )}

            {/* Live Sync Refresh Button */}
            {onRefreshLiveBulletin && (
              <button
                onClick={onRefreshLiveBulletin}
                disabled={isRefreshing}
                className={`flex items-center space-x-1.5 px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-xl border transition-all cursor-pointer shrink-0 ${
                  isRefreshing
                    ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                    : 'bg-slate-900/90 hover:bg-slate-800 text-white border-slate-700/80 shadow-xs'
                }`}
                title="Tüm Liglerin Bültenini Canlı Senkronize Et"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : 'text-emerald-400'}`} />
                <span className="hidden lg:inline font-bold text-xs text-white">
                  {isRefreshing ? 'Çekiliyor...' : 'Yenile'}
                </span>
              </button>
            )}

            {/* Standings Button */}
            {onOpenStandings && (
              <button
                onClick={onOpenStandings}
                className="flex items-center space-x-1.5 px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white font-bold text-xs border border-slate-700/80 transition-all cursor-pointer shrink-0 shadow-xs"
                title="Güncel Puan Durumu"
              >
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden lg:inline">Puan Durumu</span>
              </button>
            )}

            {/* AI Curated Coupons Button (Toggles between Coupons & Matches) */}
            {onOpenCoupons && (
              <button
                onClick={activeTabMode === 'coupons' ? onGoHome : onOpenCoupons}
                className={`flex items-center space-x-1.5 px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-xl font-bold text-xs border transition-all cursor-pointer shadow-xs shrink-0 ${
                  activeTabMode === 'coupons'
                    ? 'bg-amber-400 text-slate-950 border-amber-300 font-extrabold shadow-amber-500/20'
                    : 'bg-slate-900/90 hover:bg-slate-800 text-white border-slate-700/80'
                }`}
                title={activeTabMode === 'coupons' ? "Ana Sayfaya / Maç Bültenine Dön" : "Günün Kuponları (Banko, İdeal, Sürpriz)"}
              >
                <Flame className={`w-3.5 h-3.5 ${activeTabMode === 'coupons' ? 'text-slate-950 fill-current' : 'text-amber-400 animate-pulse'}`} />
                <span className="hidden md:inline">{activeTabMode === 'coupons' ? 'Maçlar' : 'Kuponlar'}</span>
                {activeTabMode !== 'coupons' && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-black">3</span>
                )}
              </button>
            )}

            {/* Mobile / PWA Download & Install Button */}
            {onOpenInstallApp && (
              <button
                onClick={onOpenInstallApp}
                className="flex items-center space-x-1.5 px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700/80 font-bold text-xs transition-all cursor-pointer shadow-xs group relative shrink-0"
                title="ProAnaliz AI Uygulamasını Cep Telefonuna İndir & Kur"
              >
                <Smartphone className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
                <span className="hidden xl:inline">Telefona İndir</span>
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
                className="flex items-center space-x-1.5 px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-extrabold text-xs border border-emerald-500/40 transition-all cursor-pointer shadow-md shadow-emerald-500/20 active:scale-95 animate-pulse shrink-0"
                title="Kuponumu Aç & Hesapla"
              >
                <Ticket className="w-3.5 h-3.5 text-emerald-400" />
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
                className="flex items-center space-x-1 px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-white font-bold text-xs transition-all cursor-pointer shadow-xs group shrink-0"
                title="Sanal Kasa & Kupon Takibi"
              >
                <Wallet className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="hidden xl:inline text-slate-400">Kasa:</span>
                <span className="font-mono font-black text-amber-400">
                  {bankrollBalance.toLocaleString('tr-TR')} ₺
                </span>
              </button>
            )}

            {/* Team Theme & Color Selector Button */}
            {onOpenThemeModal && (
              <button
                onClick={onOpenThemeModal}
                className="flex items-center space-x-1.5 px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-xl border font-bold text-xs transition-all cursor-pointer shadow-xs group shrink-0 active:scale-95"
                style={{
                  backgroundColor: activeTheme?.badgeBg || 'rgba(16, 185, 129, 0.15)',
                  borderColor: activeTheme?.cardBorder || 'rgba(16, 185, 129, 0.35)',
                  color: activeTheme?.primaryColor || '#10b981'
                }}
                title={`Takım & Renk Teması Seçici (Aktif: ${activeTheme?.name || 'ProAnaliz'})`}
              >
                <Palette className="w-3.5 h-3.5 group-hover:rotate-45 transition-transform" />
                <span className="hidden sm:inline font-black tracking-tight">{activeTheme?.emoji} {activeTheme?.shortName}</span>
                <span className="sm:hidden text-xs">{activeTheme?.emoji || '🎨'}</span>
              </button>
            )}

            {/* Live Goal Sound Toggle Button */}
            {onToggleMute && (
              <button
                onClick={onToggleMute}
                className="p-1.5 sm:p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-all cursor-pointer shrink-0 shadow-xs"
                title={isMuted ? 'Canlı Gol Sesini Aç' : 'Canlı Gol Sesini Kapat'}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
            )}

            {/* Custom Match Analyzer Button */}
            <button
              onClick={onOpenCustomAnalyzer}
              className="flex items-center space-x-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-500/25 transition-all transform active:scale-95 cursor-pointer shrink-0"
              title="Kendi Maçını Analiz Et"
            >
              <Calculator className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden lg:inline">Kendi Maçını Analiz Et</span>
              <span className="lg:hidden text-xs">Maç Analizi</span>
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

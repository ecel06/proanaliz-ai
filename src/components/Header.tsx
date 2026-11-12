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
  Palette,
  Trophy,
  Bell,
  BellOff,
  Home,
  User as UserIcon,
  Crown,
  LogOut
} from 'lucide-react';
import { TeamTheme } from '../utils/themeHelper';
import { User } from '../utils/authHelper';

interface HeaderProps {
  user?: User | null;
  onOpenAuth?: () => void;
  onOpenVIP?: () => void;
  onLogout?: () => void;
  onGoHome?: () => void;
  onOpenCustomAnalyzer: () => void;
  onOpenStandings?: () => void;
  onOpenAIPerformance?: () => void;
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
  isPushEnabled?: boolean;
  onTogglePush?: () => void;
  activeTheme?: TeamTheme;
  onOpenThemeModal?: () => void;
  activeSection?: 'home' | 'football' | 'horseRacing' | 'stocks';
  onSelectSection?: (section: 'home' | 'football' | 'horseRacing' | 'stocks') => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onOpenAuth,
  onOpenVIP,
  onLogout,
  onGoHome,
  onOpenCustomAnalyzer,
  onOpenStandings,
  onOpenAIPerformance,
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
  isPushEnabled = false,
  onTogglePush,
  activeTheme,
  onOpenThemeModal,
  activeSection = 'football',
  onSelectSection
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-xl w-full max-w-full overflow-x-clip">
      <div className="w-full max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-6 min-w-0">
        
        {/* ROW 1: Brand Logo & Top Action Tools (Clean, Spacious, Zero Overflow) */}
        <div className="flex items-center justify-between h-12 sm:h-13 gap-2 min-w-0 w-full py-1">
          
          {/* Logo & Brand Title - Clickable Home Trigger */}
          <div 
            onClick={onGoHome}
            className="flex items-center space-x-1.5 sm:space-x-2 shrink-0 min-w-0 cursor-pointer group"
            title="Ana Sayfaya & Canlı Bültene Dön"
          >
            <div className="relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-emerald-400 via-teal-500 to-indigo-600 p-[1.5px] shadow-lg shadow-emerald-500/20 shrink-0 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center">
                <BrainCircuit className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 animate-pulse" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="text-sm sm:text-base lg:text-lg font-black tracking-tight text-white whitespace-nowrap group-hover:text-emerald-300 transition-colors">
                  ProAnaliz <span className="text-emerald-400">AI</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Canlı Bülten
                </span>
              </div>
            </div>
          </div>

          {/* Right Action Tools - Complete Suite with Zero Horizontal Overflow */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink min-w-0 overflow-x-auto no-scrollbar py-0.5">
            
            {/* Direct Update Trigger in Header */}
            {hasNewUpdate && onUpdateApp && (
              <button
                onClick={onUpdateApp}
                className="flex items-center space-x-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 text-slate-950 font-black text-[11px] sm:text-xs shadow-lg shadow-emerald-500/50 ring-2 ring-emerald-300 animate-pulse active:scale-95 transition-all cursor-pointer whitespace-nowrap shrink-0"
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
                className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border transition-all cursor-pointer shrink-0 flex items-center space-x-1.5 ${
                  isRefreshing
                    ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                    : 'bg-slate-900/90 hover:bg-slate-800 text-white border-slate-700/80 shadow-xs'
                }`}
                title="Tüm Liglerin Bültenini Canlı Senkronize Et"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : 'text-emerald-400'}`} />
                <span className="hidden md:inline font-bold text-xs text-white">
                  {isRefreshing ? 'Çekiliyor...' : 'Yenile'}
                </span>
              </button>
            )}

            {/* Team Theme & Color Selector Button (Football only) */}
            {activeSection === 'football' && onOpenThemeModal && (
              <button
                onClick={onOpenThemeModal}
                className="flex items-center space-x-1 px-1.5 py-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border font-bold text-xs transition-all cursor-pointer shadow-xs group shrink-0 active:scale-95"
                style={{
                  backgroundColor: activeTheme?.badgeBg || 'rgba(16, 185, 129, 0.15)',
                  borderColor: activeTheme?.cardBorder || 'rgba(16, 185, 129, 0.35)',
                  color: activeTheme?.primaryColor || '#10b981'
                }}
                title={`Takım & Renk Teması Seçici (Aktif: ${activeTheme?.name || 'ProAnaliz'})`}
              >
                <Palette className="w-3.5 h-3.5 group-hover:rotate-45 transition-transform shrink-0" />
                <span className="font-black text-[11px] sm:text-xs">{activeTheme?.emoji || '🎨'}</span>
                <span className="hidden sm:inline font-bold text-xs">{activeTheme?.shortName || 'Renk'}</span>
              </button>
            )}

            {/* Standings Button (Football only) */}
            {activeSection === 'football' && onOpenStandings && (
              <button
                onClick={onOpenStandings}
                className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white font-bold text-xs border border-slate-700/80 transition-all cursor-pointer shrink-0 shadow-xs"
                title="Güncel Puan Durumu"
              >
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden lg:inline">Puan Durumu</span>
              </button>
            )}

            {/* AI Performance Scorecard Button (Football only) */}
            {activeSection === 'football' && onOpenAIPerformance && (
              <button
                onClick={onOpenAIPerformance}
                className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-amber-300 font-bold text-xs border border-amber-400/30 transition-all cursor-pointer shrink-0 shadow-xs"
                title="Yapay Zeka Başarı Karnesi & Şeffaf İstatistikler"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden lg:inline">Başarı Karnesi</span>
              </button>
            )}

            {/* AI Curated Coupons Button (Football only) */}
            {activeSection === 'football' && onOpenCoupons && (
              <button
                onClick={activeTabMode === 'coupons' ? () => onSelectSection?.('football') : onOpenCoupons}
                className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl font-bold text-xs border transition-all cursor-pointer shadow-xs shrink-0 ${
                  activeTabMode === 'coupons'
                    ? 'bg-amber-400 text-slate-950 border-amber-300 font-extrabold shadow-amber-500/20'
                    : 'bg-slate-900/90 hover:bg-slate-800 text-white border-slate-700/80'
                }`}
                title={activeTabMode === 'coupons' ? "Maç Bültenine Dön" : "Günün Kuponları (Banko, İdeal, Sürpriz)"}
              >
                <Flame className={`w-3.5 h-3.5 ${activeTabMode === 'coupons' ? 'text-slate-950 fill-current' : 'text-amber-400 animate-pulse'}`} />
                <span className="hidden md:inline">{activeTabMode === 'coupons' ? 'Maçlar' : 'Kuponlar'}</span>
                {activeTabMode !== 'coupons' && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-black">3</span>
                )}
              </button>
            )}

            {/* User Betslip Button (Football only, if items in slip) */}
            {activeSection === 'football' && betslipCount > 0 && onOpenBetslip && (
              <button
                onClick={onOpenBetslip}
                className="flex items-center space-x-1 px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-extrabold text-[11px] sm:text-xs border border-emerald-500/40 transition-all cursor-pointer shadow-md shadow-emerald-500/20 active:scale-95 animate-pulse shrink-0"
                title="Kuponumu Aç & Hesapla"
              >
                <Ticket className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Kupon</span>
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px]">
                  {betslipCount}
                </span>
              </button>
            )}

            {/* Virtual Bankroll Button - Football only */}
            {activeSection === 'football' && onOpenBankroll && (
              <button
                onClick={onOpenBankroll}
                className="hidden sm:flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-white font-bold text-xs transition-all cursor-pointer shadow-xs group shrink-0"
                title="Sanal Kasa & Kupon Takibi"
              >
                <Wallet className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="font-mono font-black text-amber-400 text-[11px] sm:text-xs">
                  {bankrollBalance.toLocaleString('tr-TR')} ₺
                </span>
              </button>
            )}

            {/* Live Goal Sound Toggle Button (Football only) */}
            {activeSection === 'football' && onToggleMute && (
              <button
                onClick={onToggleMute}
                className="p-1.5 sm:p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-all cursor-pointer shrink-0 shadow-xs"
                title={isMuted ? 'Canlı Gol Sesini (GOOOOL!) Aç' : 'Canlı Gol Sesini Kapat'}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
            )}

            {/* Native Web Push Notification Toggle Button (Football only) */}
            {activeSection === 'football' && onTogglePush && (
              <button
                onClick={onTogglePush}
                className={`p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer shrink-0 shadow-xs ${
                  isPushEnabled
                    ? 'bg-amber-400/20 text-amber-300 border-amber-400/50 shadow-amber-500/20'
                    : 'bg-slate-900/90 hover:bg-slate-800 text-slate-400 border-slate-700/80 hover:text-white'
                }`}
                title={isPushEnabled ? 'Anlık Push Bildirimleri Açık' : 'Anlık Push Bildirimlerini Aç'}
              >
                {isPushEnabled ? <Bell className="w-3.5 h-3.5 text-amber-400" /> : <BellOff className="w-3.5 h-3.5" />}
              </button>
            )}

            {/* Custom Match Analyzer Button (Football only) */}
            {activeSection === 'football' && (
              <button
                onClick={onOpenCustomAnalyzer}
                className="flex items-center space-x-1 px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-500/25 transition-all transform active:scale-95 cursor-pointer shrink-0"
                title="Kendi Maçını Analiz Et"
              >
                <Calculator className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline lg:hidden text-[11px]">Analiz</span>
                <span className="hidden lg:inline">Kendi Maçını Analiz Et</span>
              </button>
            )}

            {/* 👤 User Auth & 👑 VIP Membership Actions */}
            {!user ? (
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                {onOpenVIP && (
                  <button
                    onClick={onOpenVIP}
                    className="flex items-center space-x-1 px-2 py-1.5 rounded-xl bg-amber-400/20 border border-amber-400/50 hover:bg-amber-400/30 text-amber-300 font-black text-xs shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
                    title="VIP Kulübü ve Ayrıcalıkları"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span>VIP Ol</span>
                  </button>
                )}
                {onOpenAuth && (
                  <button
                    onClick={onOpenAuth}
                    className="flex items-center space-x-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/25 active:scale-95 transition-all cursor-pointer shrink-0"
                    title="Giriş Yap veya Ücretsiz Hesap Aç"
                  >
                    <UserIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span className="hidden sm:inline">Giriş / </span><span>Üye Ol</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1 shrink-0">
                {user.isVip ? (
                  <button
                    onClick={onOpenVIP}
                    className="flex items-center space-x-1 px-2 py-1.5 rounded-xl bg-amber-400/20 border border-amber-400/50 text-amber-300 font-black text-xs shadow-xs cursor-pointer active:scale-95 shrink-0"
                    title={`VIP Üyelik Aktif (Plan: ${user.vipPlan || 'VIP'})`}
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    <span className="hidden sm:inline font-bold truncate max-w-[80px]">
                      {user.name.split(' ')[0]}
                    </span>
                    <span className="text-[10px] px-1 py-0.2 rounded bg-amber-400 text-slate-950 font-black">
                      VIP
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={onOpenVIP}
                    className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 cursor-pointer active:scale-95 animate-pulse shrink-0"
                    title="VIP Üyeliğe Yükselt"
                  >
                    <Crown className="w-3.5 h-3.5" />
                    <span>VIP Ol</span>
                  </button>
                )}

                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="p-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer shrink-0"
                    title="Oturumu Kapat"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ROW 2: Primary 4 Core Categories Bar - DEDICATED FULL ROW ON ALL SCREENS (Zero Overflow) */}
        {onSelectSection && (
          <nav
            aria-label="Ana Spor Kategorisi Menüsü"
            className="w-full pb-2 pt-0.5"
          >
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5 p-1 rounded-xl bg-slate-900/90 border border-slate-800 shadow-inner w-full sm:max-w-2xl sm:mx-auto">
              <button
                onClick={() => onSelectSection('home')}
                className={`flex items-center justify-center space-x-1 sm:space-x-2 py-1.5 sm:py-2 px-1 rounded-lg font-black text-xs sm:text-sm transition-all cursor-pointer min-w-0 ${
                  activeSection === 'home'
                    ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
                title="Ana Sayfaya Dön"
              >
                <Home className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Ana Sayfa</span>
              </button>
              <button
                onClick={() => onSelectSection('football')}
                className={`flex items-center justify-center space-x-1 sm:space-x-2 py-1.5 sm:py-2 px-1 rounded-lg font-black text-xs sm:text-sm transition-all cursor-pointer min-w-0 ${
                  activeSection === 'football'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <span>⚽</span>
                <span className="truncate">Futbol</span>
              </button>
              <button
                onClick={() => onSelectSection('horseRacing')}
                className={`flex items-center justify-center space-x-1 sm:space-x-2 py-1.5 sm:py-2 px-1 rounded-lg font-black text-xs sm:text-sm transition-all cursor-pointer min-w-0 ${
                  activeSection === 'horseRacing'
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/25'
                    : 'text-slate-300 hover:text-amber-300 hover:bg-slate-800/50'
                }`}
              >
                <span>🏇</span>
                <span className="truncate">At Yarışı</span>
              </button>
              <button
                onClick={() => onSelectSection('stocks')}
                className={`flex items-center justify-center space-x-1 sm:space-x-2 py-1.5 sm:py-2 px-1 rounded-lg font-black text-xs sm:text-sm transition-all cursor-pointer min-w-0 ${
                  activeSection === 'stocks'
                    ? 'bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/25'
                    : 'text-slate-300 hover:text-cyan-300 hover:bg-slate-800/50'
                }`}
              >
                <span>📈</span>
                <span className="truncate">Borsa</span>
              </button>
            </div>
          </nav>
        )}

        {/* Live Metrics Ticker Banner - 100% Solid Responsive, Zero Overflow */}
        <div className="py-1 border-t border-slate-800/60 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 gap-2 overflow-hidden">
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 truncate">
            <span className="flex items-center space-x-1 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {activeSection === 'horseRacing' ? (
                <strong className="text-amber-300">TJK &amp; Nesine Canlı At Yarışı</strong>
              ) : activeSection === 'stocks' ? (
                <strong className="text-cyan-300">BIST / NASDAQ / Kripto Canlı Borsa Terminali</strong>
              ) : (
                <>
                  <strong className="text-slate-200">{totalMatches} Maç</strong>
                  <span className="hidden sm:inline text-slate-400">Canlı Yayında</span>
                </>
              )}
            </span>
            <span className="text-slate-700">•</span>
            <span className="truncate text-slate-400">
              {activeSection === 'horseRacing' ? (
                <>AGF &amp; Form Motoru: <strong className="text-emerald-300 font-bold">Aktif</strong></>
              ) : activeSection === 'stocks' ? (
                <>Quant AL/SAT Sinyal Motoru: <strong className="text-cyan-300 font-bold">Aktif</strong></>
              ) : (
                <>Poisson: <strong className="text-amber-300 font-bold">%99.4</strong></>
              )}
            </span>
            <span className="hidden sm:inline text-slate-700">•</span>
            <span className="hidden sm:inline text-slate-400">
              {activeSection === 'stocks'
                ? 'Piyasa Verileri • Yatırım Tavsiyesi Değildir'
                : 'Bahis İçermez • Saf Olasılık Simülasyonu'}
            </span>
          </div>

          <div className="text-[10px] text-slate-500 shrink-0 flex items-center space-x-1">
            <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">Son Güncelleme: </span>
            <strong className="text-slate-300">{lastUpdatedText || 'Canlı'}</strong>
          </div>
        </div>

      </div>
    </header>
  );
};

// src/components/MobileBottomNav.tsx
// Section-specific, ultra-sleek, thumb-friendly mobile bottom navigation bar (visible on sm:hidden)
import React from 'react';
import {
  Home,
  Flame,
  Activity,
  User,
  Crown,
  Trophy,
  CheckCircle2,
  Sparkles,
  Zap,
  Ticket,
  TrendingUp,
  Briefcase,
  Bell
} from 'lucide-react';
import { User as UserType } from '../utils/authHelper';

export interface MobileBottomNavProps {
  activeSection: 'home' | 'football' | 'horseRacing' | 'stocks';
  // Football tab mode & actions
  activeTabMode?: 'upcoming' | 'coupons' | 'finished';
  onSelectSection: (section: 'home' | 'football' | 'horseRacing' | 'stocks') => void;
  onSelectFootballTab?: (tab: 'upcoming' | 'coupons' | 'finished') => void;
  onOpenStandings?: () => void;
  betslipCount?: number;
  onOpenBetslip?: () => void;

  // Horse Racing subTab & actions
  horseSubTab?: 'bulletin' | 'ai_coupons' | 'ikili_cifte' | 'results' | 'changes';
  onSelectHorseSubTab?: (tab: 'bulletin' | 'ai_coupons' | 'ikili_cifte' | 'results' | 'changes') => void;

  // Stocks actions
  onSelectStockAction?: (action: 'list' | 'portfolio' | 'alerts' | 'kap') => void;

  // Common user / modals
  onOpenProfile?: () => void;
  onOpenAuth?: () => void;
  onOpenVIP?: () => void;
  user?: UserType | null;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeSection,
  activeTabMode = 'upcoming',
  onSelectSection,
  onSelectFootballTab,
  onOpenStandings,
  betslipCount = 0,
  onOpenBetslip,
  horseSubTab = 'bulletin',
  onSelectHorseSubTab,
  onSelectStockAction,
  onOpenProfile,
  onOpenAuth,
  onOpenVIP,
  user
}) => {
  // 1. Ana sayfada alt menü gösterilmez (tam ekran sade ana hub)
  if (activeSection === 'home') {
    return null;
  }

  return (
    <nav
      aria-label="Mobil Alt Gezinme Çubuğu"
      className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 shadow-[0_-8px_25px_rgba(0,0,0,0.6)] px-1.5 py-1 pb-safe"
    >
      {/* ⚽ 2. FUTBOL BÖLÜMÜNE ÖZEL ALT MENÜ */}
      {activeSection === 'football' && (
        <div className="grid grid-cols-5 items-center justify-around max-w-md mx-auto">
          {/* Ana Sayfa Dönüş */}
          <button
            onClick={() => onSelectSection('home')}
            className="flex flex-col items-center justify-center py-1 transition-all cursor-pointer text-slate-400 hover:text-white"
          >
            <Home className="w-5 h-5 stroke-[1.75]" />
            <span className="text-[10px] mt-0.5 tracking-tight">Ana Sayfa</span>
          </button>

          {/* Maçlar */}
          <button
            onClick={() => onSelectFootballTab?.('upcoming')}
            className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer relative ${
              activeTabMode === 'upcoming' ? 'text-emerald-400 font-extrabold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className={`text-base leading-none ${activeTabMode === 'upcoming' ? 'scale-125' : 'grayscale'}`}>⚽</span>
            <span className="text-[10px] mt-0.5 tracking-tight">Maçlar</span>
            {activeTabMode === 'upcoming' && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute -bottom-0.5 animate-pulse" />
            )}
          </button>

          {/* Kuponlar */}
          <button
            onClick={() => onSelectFootballTab?.('coupons')}
            className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer relative ${
              activeTabMode === 'coupons' ? 'text-amber-400 font-extrabold' : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            <Flame className={`w-5 h-5 ${activeTabMode === 'coupons' ? 'text-amber-400 fill-current scale-110 animate-pulse' : 'stroke-[1.75]'}`} />
            <span className="text-[10px] mt-0.5 tracking-tight">Kuponlar</span>
            {activeTabMode === 'coupons' && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 absolute -bottom-0.5 animate-pulse" />
            )}
          </button>

          {/* Bitenler */}
          <button
            onClick={() => onSelectFootballTab?.('finished')}
            className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer relative ${
              activeTabMode === 'finished' ? 'text-emerald-400 font-extrabold' : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            <CheckCircle2 className={`w-5 h-5 ${activeTabMode === 'finished' ? 'stroke-[2.5] scale-110' : 'stroke-[1.75]'}`} />
            <span className="text-[10px] mt-0.5 tracking-tight">Bitenler</span>
            {activeTabMode === 'finished' && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute -bottom-0.5 animate-pulse" />
            )}
          </button>

          {/* Puan Durumu veya Kuponum */}
          {betslipCount > 0 ? (
            <button
              onClick={onOpenBetslip}
              className="flex flex-col items-center justify-center py-1 transition-all cursor-pointer text-emerald-400 font-extrabold relative"
            >
              <Ticket className="w-5 h-5 stroke-[2.2] animate-bounce" />
              <span className="text-[10px] mt-0.5 tracking-tight">Kuponum ({betslipCount})</span>
            </button>
          ) : (
            <button
              onClick={onOpenStandings}
              className="flex flex-col items-center justify-center py-1 transition-all cursor-pointer text-slate-400 hover:text-cyan-300 active:scale-95"
            >
              <Activity className="w-5 h-5 stroke-[1.75]" />
              <span className="text-[10px] mt-0.5 tracking-tight">Puan Durumu</span>
            </button>
          )}
        </div>
      )}

      {/* 🏇 3. AT YARIŞI BÖLÜMÜNE ÖZEL ALT MENÜ */}
      {activeSection === 'horseRacing' && (
        <div className="grid grid-cols-5 items-center justify-around max-w-md mx-auto">
          {/* Ana Sayfa Dönüş */}
          <button
            onClick={() => onSelectSection('home')}
            className="flex flex-col items-center justify-center py-1 transition-all cursor-pointer text-slate-400 hover:text-white"
          >
            <Home className="w-5 h-5 stroke-[1.75]" />
            <span className="text-[10px] mt-0.5 tracking-tight">Ana Sayfa</span>
          </button>

          {/* Bülten & Koşular */}
          <button
            onClick={() => onSelectHorseSubTab?.('bulletin')}
            className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer relative ${
              horseSubTab === 'bulletin' ? 'text-emerald-400 font-extrabold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className={`text-base leading-none ${horseSubTab === 'bulletin' ? 'scale-125' : 'grayscale'}`}>🏇</span>
            <span className="text-[10px] mt-0.5 tracking-tight">Bülten</span>
            {horseSubTab === 'bulletin' && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute -bottom-0.5 animate-pulse" />
            )}
          </button>

          {/* AI Altılı */}
          <button
            onClick={() => onSelectHorseSubTab?.('ai_coupons')}
            className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer relative ${
              horseSubTab === 'ai_coupons' ? 'text-amber-400 font-extrabold' : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            <Sparkles className={`w-5 h-5 ${horseSubTab === 'ai_coupons' ? 'text-amber-400 fill-current scale-110' : 'stroke-[1.75]'}`} />
            <span className="text-[10px] mt-0.5 tracking-tight">AI Altılı</span>
            {horseSubTab === 'ai_coupons' && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 absolute -bottom-0.5 animate-pulse" />
            )}
          </button>

          {/* İkili & Çifte */}
          <button
            onClick={() => onSelectHorseSubTab?.('ikili_cifte')}
            className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer relative ${
              horseSubTab === 'ikili_cifte' ? 'text-indigo-400 font-extrabold' : 'text-slate-400 hover:text-indigo-300'
            }`}
          >
            <Zap className={`w-5 h-5 ${horseSubTab === 'ikili_cifte' ? 'stroke-[2.5] scale-110' : 'stroke-[1.75]'}`} />
            <span className="text-[10px] mt-0.5 tracking-tight">İkili & Çifte</span>
            {horseSubTab === 'ikili_cifte' && (
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 absolute -bottom-0.5 animate-pulse" />
            )}
          </button>

          {/* Sonuçlar */}
          <button
            onClick={() => onSelectHorseSubTab?.('results')}
            className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer relative ${
              horseSubTab === 'results' ? 'text-amber-400 font-extrabold' : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            <Trophy className={`w-5 h-5 ${horseSubTab === 'results' ? 'stroke-[2.5] scale-110' : 'stroke-[1.75]'}`} />
            <span className="text-[10px] mt-0.5 tracking-tight">Sonuçlar</span>
            {horseSubTab === 'results' && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 absolute -bottom-0.5 animate-pulse" />
            )}
          </button>
        </div>
      )}

      {/* 📈 4. BORSA BÖLÜMÜNE ÖZEL ALT MENÜ */}
      {activeSection === 'stocks' && (
        <div className="grid grid-cols-5 items-center justify-around max-w-md mx-auto">
          {/* Ana Sayfa Dönüş */}
          <button
            onClick={() => onSelectSection('home')}
            className="flex flex-col items-center justify-center py-1 transition-all cursor-pointer text-slate-400 hover:text-white"
          >
            <Home className="w-5 h-5 stroke-[1.75]" />
            <span className="text-[10px] mt-0.5 tracking-tight">Ana Sayfa</span>
          </button>

          {/* Hisseler (BIST) */}
          <button
            onClick={() => onSelectStockAction?.('list')}
            className="flex flex-col items-center justify-center py-1 transition-all cursor-pointer text-emerald-400 font-extrabold"
          >
            <TrendingUp className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[10px] mt-0.5 tracking-tight">Hisseler</span>
          </button>

          {/* Sanal Portföy */}
          <button
            onClick={() => onSelectStockAction?.('portfolio')}
            className="flex flex-col items-center justify-center py-1 transition-all cursor-pointer text-slate-400 hover:text-amber-300"
          >
            <Briefcase className="w-5 h-5 stroke-[1.75]" />
            <span className="text-[10px] mt-0.5 tracking-tight">Portföy</span>
          </button>

          {/* Alarmlar */}
          <button
            onClick={() => onSelectStockAction?.('alerts')}
            className="flex flex-col items-center justify-center py-1 transition-all cursor-pointer text-slate-400 hover:text-cyan-300"
          >
            <Bell className="w-5 h-5 stroke-[1.75]" />
            <span className="text-[10px] mt-0.5 tracking-tight">Alarmlar</span>
          </button>

          {/* Profil / VIP */}
          <button
            onClick={() => {
              if (user) onOpenProfile?.();
              else onOpenAuth?.();
            }}
            className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer relative ${
              user?.isVip ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            {user?.isVip ? (
              <Crown className="w-5 h-5 text-amber-400 stroke-[2.2]" />
            ) : (
              <User className="w-5 h-5 stroke-[1.75]" />
            )}
            <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[56px]">
              {user ? user.name.split(' ')[0] : 'Giriş Yap'}
            </span>
          </button>
        </div>
      )}
    </nav>
  );
};

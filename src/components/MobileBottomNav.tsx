// src/components/MobileBottomNav.tsx
// Ultra-sleek, thumb-friendly mobile bottom navigation bar (visible on sm:hidden)
import React from 'react';
import { Home, Flame, Activity, User, Crown, Trophy, Layers } from 'lucide-react';
import { User as UserType } from '../utils/authHelper';

interface MobileBottomNavProps {
  activeSection: 'home' | 'football' | 'horseRacing' | 'stocks';
  activeTabMode: 'upcoming' | 'coupons' | 'finished';
  onSelectSection: (section: 'home' | 'football' | 'horseRacing' | 'stocks') => void;
  onSelectFootballTab: (tab: 'upcoming' | 'coupons' | 'finished') => void;
  onOpenStandings: () => void;
  onOpenProfile: () => void;
  onOpenAuth: () => void;
  onOpenVIP: () => void;
  user: UserType | null;
  betslipCount?: number;
  onOpenBetslip?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeSection,
  activeTabMode,
  onSelectSection,
  onSelectFootballTab,
  onOpenStandings,
  onOpenProfile,
  onOpenAuth,
  onOpenVIP,
  user,
  betslipCount = 0,
  onOpenBetslip
}) => {
  const isHome = activeSection === 'home';
  const isMatches = activeSection === 'football' && activeTabMode !== 'coupons';
  const isCoupons = activeSection === 'football' && activeTabMode === 'coupons';

  return (
    <nav
      aria-label="Mobil Alt Gezinme Çubuğu"
      className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 shadow-[0_-8px_25px_rgba(0,0,0,0.6)] px-2 py-1.5 pb-safe"
    >
      <div className="grid grid-cols-5 items-center justify-around max-w-md mx-auto">
        {/* TAB 1: ANA SAYFA */}
        <button
          onClick={() => onSelectSection('home')}
          className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer relative ${
            isHome ? 'text-emerald-400 font-extrabold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Home className={`w-5 h-5 ${isHome ? 'stroke-[2.5] scale-110' : 'stroke-[1.75]'}`} />
          <span className="text-[10px] mt-0.5 tracking-tight">Ana Sayfa</span>
          {isHome && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute -bottom-0.5 animate-pulse" />
          )}
        </button>

        {/* TAB 2: MAÇLAR */}
        <button
          onClick={() => {
            onSelectSection('football');
            onSelectFootballTab('upcoming');
          }}
          className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer relative ${
            isMatches ? 'text-emerald-400 font-extrabold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <span className={`text-base leading-none ${isMatches ? 'scale-125' : 'grayscale'}`}>⚽</span>
          <span className="text-[10px] mt-0.5 tracking-tight">Maçlar</span>
          {isMatches && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute -bottom-0.5 animate-pulse" />
          )}
        </button>

        {/* TAB 3: KUPONLAR */}
        <button
          onClick={() => {
            onSelectSection('football');
            onSelectFootballTab('coupons');
          }}
          className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer relative ${
            isCoupons ? 'text-amber-400 font-extrabold' : 'text-slate-400 hover:text-amber-300'
          }`}
        >
          <Flame className={`w-5 h-5 ${isCoupons ? 'text-amber-400 fill-current scale-110 animate-pulse' : 'stroke-[1.75]'}`} />
          <span className="text-[10px] mt-0.5 tracking-tight">Kuponlar</span>
          {isCoupons && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 absolute -bottom-0.5 animate-pulse" />
          )}
        </button>

        {/* TAB 4: PUAN DURUMU */}
        <button
          onClick={onOpenStandings}
          className="flex flex-col items-center justify-center py-1 transition-all cursor-pointer text-slate-400 hover:text-cyan-300 active:scale-95"
        >
          <Activity className="w-5 h-5 stroke-[1.75]" />
          <span className="text-[10px] mt-0.5 tracking-tight">Puan Durumu</span>
        </button>

        {/* TAB 5: PROFİL / VIP */}
        <button
          onClick={() => {
            if (user) {
              onOpenProfile();
            } else {
              onOpenAuth();
            }
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
    </nav>
  );
};

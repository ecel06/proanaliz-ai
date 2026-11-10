// src/components/GoalNotificationToast.tsx
// Floating celebratory banner when a live goal occurs.

import React from 'react';
import { Radio, X, Volume2, VolumeX } from 'lucide-react';

export interface LiveGoalEvent {
  id: string;
  matchId: string;
  scoringTeamName: string;
  homeTeamName: string;
  awayTeamName: string;
  scoreHome: number;
  scoreAway: number;
  league: string;
  minute?: string;
  timestamp: number;
}

interface GoalNotificationToastProps {
  goal: LiveGoalEvent | null;
  onClose: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const GoalNotificationToast: React.FC<GoalNotificationToastProps> = ({
  goal,
  onClose,
  isMuted,
  onToggleMute
}) => {
  React.useEffect(() => {
    if (!goal) return;
    const timer = setTimeout(() => {
      onClose();
    }, 7000);
    return () => clearTimeout(timer);
  }, [goal, onClose]);

  if (!goal) return null;

  return (
    <aside
      aria-label="Canlı Gol Bildirimi"
      className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-[999999] p-3.5 sm:p-4 rounded-2xl bg-slate-900/98 border border-emerald-500/80 shadow-2xl shadow-emerald-500/30 backdrop-blur-2xl transition-all duration-300 animate-fadeIn"
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left: Soccer ball badge & Info */}
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center shrink-0">
            <span className="text-xl">⚽</span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className="font-black text-xs text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
                <span>GOL!</span>
              </span>
              {goal.minute && (
                <span className="text-[10px] font-mono font-bold bg-slate-800 text-amber-300 border border-amber-400/30 px-1.5 py-0.2 rounded">
                  {goal.minute}
                </span>
              )}
            </div>

            <div className="text-xs sm:text-sm font-black text-white truncate mt-0.5">
              <span className="text-emerald-300 font-extrabold">{goal.scoringTeamName}</span>
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {goal.league}
            </div>
          </div>
        </div>

        {/* Center / Right: Live Score Badge like Nesine/İddaa */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950/90 border border-emerald-500/50 text-center font-mono shadow-inner">
            <div className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Skor</div>
            <div className="text-base sm:text-lg font-black text-emerald-400">
              {goal.scoreHome} - {goal.scoreAway}
            </div>
          </div>

          {/* Sound toggle & Close */}
          <div className="flex flex-col space-y-1">
            <button
              onClick={onToggleMute}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title={isMuted ? 'Gol sesini aç' : 'Gol sesini kapat'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Kapat"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};


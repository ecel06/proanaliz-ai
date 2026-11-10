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
  if (!goal) return null;

  return (
    <aside
      aria-label="Canlı Gol Bildirimi"
      className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-[99999] p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-2 border-emerald-400 shadow-2xl shadow-emerald-500/40 backdrop-blur-xl animate-bounce"
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left: Icon & Title */}
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center shrink-0 shadow-inner">
            <span className="text-xl animate-pulse">⚽</span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className="font-black text-sm text-emerald-300 uppercase tracking-wider flex items-center space-x-1">
                <span>GOL OLDU!</span>
              </span>
              {goal.minute && (
                <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                  {goal.minute}
                </span>
              )}
            </div>

            <div className="text-xs font-bold text-white truncate mt-0.5">
              <span className="text-emerald-400">{goal.scoringTeamName}</span> golü buldu!
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {goal.league}
            </div>
          </div>
        </div>

        {/* Center / Right: Score Badge */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-emerald-500/40 text-center font-mono">
            <div className="text-[9px] text-slate-400 uppercase tracking-wider">Skor</div>
            <div className="text-base font-black text-emerald-400">
              {goal.scoreHome} - {goal.scoreAway}
            </div>
          </div>

          {/* Sound toggle & Close */}
          <div className="flex flex-col space-y-1">
            <button
              onClick={onToggleMute}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title={isMuted ? 'Gol sesini aç' : 'Gol sesini kapat'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
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


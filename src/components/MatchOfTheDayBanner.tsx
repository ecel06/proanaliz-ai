// src/components/MatchOfTheDayBanner.tsx
// Featured Hero Showcase for the biggest match of the day with live countdown & AI insight.

import React, { useState, useEffect } from 'react';
import { Match, MatchAnalysis } from '../types';
import { BettingPickOption } from '../utils/oddsHelper';
import { parseMatchKickoffEpoch } from '../utils/liveMatchHelper';
import { Sparkles, Bot, Clock, ChevronDown, ChevronUp, Plus, Check } from 'lucide-react';

interface MatchOfTheDayBannerProps {
  match: Match | null;
  analysis: MatchAnalysis | null;
  onSelectMatch: (match: Match) => void;
  onAddToBetslip?: (match: Match, option: BettingPickOption) => void;
  isAlreadyInBetslip?: boolean;
}

export const MatchOfTheDayBanner: React.FC<MatchOfTheDayBannerProps> = ({
  match,
  analysis,
  onSelectMatch,
  onAddToBetslip,
  isAlreadyInBetslip = false
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    if (!match) return;

    const kickoffEpoch = parseMatchKickoffEpoch(match);

    const updateTimer = () => {
      const diff = kickoffEpoch - Date.now();
      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }
      const totalSec = Math.floor(diff / 1000);
      const days = Math.floor(totalSec / 86400);
      const hours = Math.floor((totalSec % 86400) / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      const seconds = totalSec % 60;
      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [match]);

  if (!match || !analysis) return null;

  const pred = analysis.primaryPrediction;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onAddToBetslip) return;

    const opt: BettingPickOption = {
      key: 'hero_primary',
      label: pred.label,
      marketKey: 'primary',
      marketName: pred.market || 'Günün Tercihi',
      odd: 1.85,
      probability: pred.confidence
    };
    onAddToBetslip(match, opt);
  };

  return (
    <div className="relative mb-6 rounded-3xl overflow-hidden border border-emerald-500/40 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/40 shadow-2xl shadow-emerald-950/30">
      {/* Decorative Glow Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 bg-slate-900/80 border-b border-emerald-500/20 backdrop-blur-md">
        <div className="flex items-center space-x-2">
          <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{timeLeft && timeLeft.days > 0 ? 'Sıradaki Vitrin Karşılaşması' : 'Günün Vitrin Karşılaşması'}</span>
          </span>
          <span className="text-xs text-slate-400 font-bold hidden sm:inline">•</span>
          <span className="text-xs text-emerald-400 font-bold hidden sm:inline">{match.league}</span>
        </div>

        <div className="flex items-center space-x-3">
          {timeLeft && (
            <div className="flex items-center space-x-1.5 text-xs font-mono font-bold text-amber-300 bg-amber-400/10 border border-amber-400/30 px-2.5 py-1 rounded-xl shadow-xs">
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>
                {timeLeft.days > 0 ? (
                  `${timeLeft.days} Gün ${timeLeft.hours} Sa`
                ) : (
                  `${String(timeLeft.hours).padStart(2, '0')}:${String(timeLeft.minutes).padStart(2, '0')}:${String(timeLeft.seconds).padStart(2, '0')}`
                )}
              </span>
            </div>
          )}

          <button
            onClick={() => setIsCollapsed(prev => !prev)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title={isCollapsed ? 'Genişlet' : 'Daralt'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Hero Body Content */}
      {!isCollapsed && (
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
            
            {/* Teams Matchup (Cols 1-7) */}
            <div
              onClick={() => onSelectMatch(match)}
              className="lg:col-span-7 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-emerald-500/50 transition-all cursor-pointer group"
            >
              {/* Home Team */}
              <div className="flex-1 text-center sm:text-left flex sm:flex-col items-center sm:items-start space-x-2 sm:space-x-0 sm:space-y-1">
                <div className="flex items-center space-x-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: match.homeTeam.primaryColor || '#10b981' }}
                  />
                  <h3 className="text-base sm:text-xl font-black text-white group-hover:text-emerald-300 transition-colors">
                    {match.homeTeam.name}
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Ev Sahibi Favorisi</span>
              </div>

              {/* VS & Kickoff Badge */}
              <div className="shrink-0 flex flex-col items-center">
                <span className="px-3 py-1 rounded-xl bg-slate-800/90 border border-slate-700 text-xs font-black text-amber-400 font-mono shadow-inner">
                  VS
                </span>
                <span className="text-[10px] text-slate-300 mt-1 font-mono font-bold">
                  {(() => {
                    const raw = match.utcDate || match.date;
                    if (!raw) return match.time || 'Canlı';
                    const d = new Date(raw);
                    if (isNaN(d.getTime())) return match.time || 'Canlı';
                    const now = new Date();
                    const isToday = d.toDateString() === now.toDateString();
                    const tomorrow = new Date(now);
                    tomorrow.setDate(now.getDate() + 1);
                    const isTomorrow = d.toDateString() === tomorrow.toDateString();
                    const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                    if (isToday) return `Bugün ${timeStr}`;
                    if (isTomorrow) return `Yarın ${timeStr}`;
                    const day = d.getDate();
                    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
                    return `${day} ${months[d.getMonth()]} ${timeStr}`;
                  })()}
                </span>
              </div>

              {/* Away Team */}
              <div className="flex-1 text-center sm:text-right flex sm:flex-col items-center sm:items-end space-x-2 sm:space-x-0 sm:space-y-1">
                <div className="flex items-center space-x-2 justify-end">
                  <h3 className="text-base sm:text-xl font-black text-white group-hover:text-indigo-300 transition-colors">
                    {match.awayTeam.name}
                  </h3>
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: match.awayTeam.primaryColor || '#6366f1' }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Deplasman Ekibi</span>
              </div>
            </div>

            {/* AI Recommendation & Actions (Cols 8-12) */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-3 p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-400">
                  <Bot className="w-4 h-4 text-emerald-400" />
                  <span>Yapay Zeka Ana Bankosu</span>
                </div>
                <span className="font-mono text-xs font-extrabold text-amber-400">
                  Beklenen xG: {analysis.expectedTotalGoals}
                </span>
              </div>

              {/* Pick Badge */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/90 border border-emerald-500/40">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-black text-white">
                    {pred.label}
                  </span>
                  <span className="text-[11px] text-slate-400">({pred.market})</span>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-black bg-emerald-500 text-slate-950 shadow-xs">
                  %{pred.confidence} Güven
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => onSelectMatch(match)}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors cursor-pointer text-center"
                >
                  Detaylı İncele 🔍
                </button>

                {onAddToBetslip && (
                  <button
                    onClick={handleQuickAdd}
                    disabled={isAlreadyInBetslip}
                    className={`py-2 px-3.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center space-x-1.5 shrink-0 ${
                      isAlreadyInBetslip
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/25 active:scale-95'
                    }`}
                  >
                    {isAlreadyInBetslip ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Kuponda</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Kupona Ekle</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

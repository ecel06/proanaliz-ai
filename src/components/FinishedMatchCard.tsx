// src/components/FinishedMatchCard.tsx
// Displays finished match results as well as live/in-progress matches with real-time score & minute,
// and real-time tracking of pre-match AI prediction (Green when hitting, Red when losing).

import React from 'react';
import { Match, MatchAnalysis } from '../types';
import { CheckCircle2, Flag, FileWarning, MapPin, Radio, Activity, Sparkles, Check, X } from 'lucide-react';
import { getMatchLiveState } from '../utils/liveMatchHelper';
import { formatDynamicMatchTime } from '../utils/dateHelper';
import { evaluatePredictionStatus } from '../utils/predictionTrackerHelper';

interface FinishedMatchCardProps {
  match: Match;
  now?: Date;
  analysis?: MatchAnalysis | null;
}

export const FinishedMatchCard: React.FC<FinishedMatchCardProps> = ({ match, now, analysis }) => {
  const { homeTeam, awayTeam } = match;
  const liveState = getMatchLiveState(match, now);
  const { isLive, isFinished, liveMinute, displayScore } = liveState;

  const isHomeWinner = displayScore.home > displayScore.away;
  const isAwayWinner = displayScore.away > displayScore.home;
  const isDraw = displayScore.home === displayScore.away;

  // Real-time evaluation of AI Pre-match Prediction
  const predStatus = analysis ? evaluatePredictionStatus(
    analysis.primaryPrediction.label,
    analysis.primaryPrediction.confidence,
    displayScore.home,
    displayScore.away,
    isLive,
    isFinished,
    displayScore.htHome,
    displayScore.htAway
  ) : null;

  return (
    <div
      className={`relative rounded-2xl p-2.5 sm:p-3 transition-all duration-200 backdrop-blur-md overflow-hidden ${
        isLive
          ? 'bg-gradient-to-r from-slate-900/90 via-rose-950/20 to-slate-900/90 border border-rose-500/40 shadow-md shadow-rose-950/20'
          : 'bg-slate-900/60 border border-slate-800 hover:border-slate-750'
      }`}
    >
      {/* Live Glowing Indicator */}
      {isLive && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
      )}

      {/* Header Info: League, Round, Status Badge */}
      <div className="flex items-center justify-between text-xs text-slate-400 mb-2 border-b border-slate-800/60 pb-1.5">
        <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0 truncate">
          {match.iddaaCode && (
            <span className="font-mono font-black text-amber-300 bg-amber-400/15 border border-amber-400/35 px-1.5 py-0.2 rounded text-[10px] tracking-wide shrink-0" title="İddaa Maç Kodu">
              KOD: {match.iddaaCode}
            </span>
          )}
          <span className="font-bold text-slate-200 bg-slate-800/90 px-2 py-0.2 rounded text-[10px] sm:text-[11px] border border-slate-700/60 truncate">
            {match.league}
          </span>
          <span className="text-slate-500 hidden sm:inline">•</span>
          <span className="text-slate-400 hidden sm:inline text-[11px] truncate">
            {match.round ? `${match.round} • ` : ''}{formatDynamicMatchTime(match, now)}
          </span>
        </div>

        <div className="flex items-center space-x-1.5 text-[10px] sm:text-[11px] shrink-0">
          {isLive ? (
            <span className={`flex items-center space-x-1 font-extrabold px-2 py-0.5 rounded-md border animate-pulse ${
              liveMinute === 'Devre Arası'
                ? 'text-amber-300 bg-amber-500/20 border-amber-500/40'
                : 'text-rose-300 bg-rose-500/20 border-rose-500/40'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full animate-ping inline-block ${
                liveMinute === 'Devre Arası' ? 'bg-amber-400' : 'bg-rose-500'
              }`} />
              <Radio className={`w-3 h-3 animate-pulse ${
                liveMinute === 'Devre Arası' ? 'text-amber-400' : 'text-rose-400'
              }`} />
              <span>{liveMinute === 'Devre Arası' ? 'DEVRE ARASI' : `CANLI • ${liveMinute || 'Oynanıyor'}`}</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1 text-slate-300 font-bold bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
              <CheckCircle2 className="w-3 h-3 text-slate-400" />
              <span>BİTTİ</span>
            </span>
          )}
        </div>
      </div>

      {/* Scoreboard Display - Sleek & Compact Single Row */}
      <div className="flex items-center justify-between gap-2 py-1 min-w-0">
        
        {/* Home Team */}
        <div className="flex-1 min-w-0 flex items-center space-x-1.5 sm:space-x-2">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: homeTeam?.primaryColor || '#10b981' }}
          />
          <span
            className={`font-black text-xs sm:text-sm truncate block ${
              isHomeWinner
                ? 'text-emerald-400 font-extrabold'
                : isLive
                ? 'text-white'
                : 'text-slate-200'
            }`}
            title={homeTeam?.name}
          >
            {homeTeam?.name}
          </span>
          {homeTeam?.rank !== undefined && homeTeam.rank !== null && (
            <span className="text-[9px] text-emerald-400/90 font-mono font-bold bg-slate-800 border border-slate-700/80 px-1 py-0.2 rounded shrink-0 hidden sm:inline">
              #{homeTeam.rank}
            </span>
          )}
        </div>

        {/* Center Score Badge */}
        <div className="shrink-0 flex items-center space-x-1 px-1 z-10">
          <div
            className={`inline-flex items-center justify-center min-w-[56px] sm:min-w-[64px] px-2 py-0.5 rounded-lg text-sm sm:text-base font-black font-mono shadow-inner ${
              isLive
                ? 'bg-rose-950/80 border border-rose-500/60 text-rose-300 ring-1 ring-rose-500/30'
                : 'bg-slate-950 border border-slate-700 text-white'
            }`}
          >
            <span className={isHomeWinner ? 'text-emerald-400' : ''}>{displayScore.home}</span>
            <span className={`mx-1 ${isLive ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`}>-</span>
            <span className={isAwayWinner ? 'text-emerald-400' : ''}>{displayScore.away}</span>
          </div>
        </div>

        {/* Away Team */}
        <div className="flex-1 min-w-0 flex items-center justify-end space-x-1.5 sm:space-x-2 text-right">
          {awayTeam?.rank !== undefined && awayTeam.rank !== null && (
            <span className="text-[9px] text-purple-400/90 font-mono font-bold bg-slate-800 border border-slate-700/80 px-1 py-0.2 rounded shrink-0 hidden sm:inline">
              #{awayTeam.rank}
            </span>
          )}
          <span
            className={`font-black text-xs sm:text-sm truncate block ${
              isAwayWinner
                ? 'text-emerald-400 font-extrabold'
                : isLive
                ? 'text-white'
                : 'text-slate-200'
            }`}
            title={awayTeam?.name}
          >
            {awayTeam?.name}
          </span>
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: awayTeam?.primaryColor || '#6366f1' }}
          />
        </div>

      </div>

      {/* AI Pre-Match Prediction Real-Time Tracker - Ultra Compact Single Line Pill */}
      {predStatus && (
        <div
          className={`mt-1.5 px-2.5 py-1 rounded-lg flex items-center justify-between gap-1.5 border transition-all text-xs ${
            predStatus.isWinning
              ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/50 border-rose-500/50 text-rose-200'
          }`}
        >
          <div className="flex items-center space-x-1.5 min-w-0 truncate">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider hidden sm:inline">Tahmin:</span>
            <span className="font-black text-white text-xs truncate">
              {predStatus.predictionLabel}
            </span>
            {analysis?.primaryPrediction.confidence ? (
              <span className="font-mono text-amber-300 font-black bg-amber-400/20 px-1 py-0.2 rounded text-[10px] shrink-0">
                %{analysis.primaryPrediction.confidence}
              </span>
            ) : null}
          </div>

          {/* Compact Status Indicator */}
          <span
            className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-black shrink-0 ${
              predStatus.isWinning
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-rose-600 text-white'
            }`}
          >
            {predStatus.isWinning ? (
              <>
                <Check className="w-3 h-3 stroke-[3]" />
                <span>{isLive ? 'Anlık Tutuyor' : 'Tuttu'}</span>
              </>
            ) : (
              <>
                <X className="w-3 h-3 stroke-[3]" />
                <span>{isLive ? 'Tutmuyor' : 'Yattı'}</span>
              </>
            )}
          </span>
        </div>
      )}

      {/* Outcome / Status Summary Footer */}
      <div className="mt-2 pt-1.5 border-t border-slate-800/50 flex flex-wrap items-center justify-between gap-1.5 text-[10px] text-slate-400">
        
        <div className="flex items-center space-x-1.5">
          {isLive ? (
            <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30 flex items-center space-x-1">
              <Activity className="w-2.5 h-2.5 text-rose-400 animate-pulse" />
              <span>Canlı</span>
            </span>
          ) : (
            <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-semibold font-mono">
              {isHomeWinner ? `MS 1` : isAwayWinner ? `MS 2` : `MS X`}
            </span>
          )}
          
          <span className="text-slate-500">•</span>
          <span>
            Toplam: <strong className="text-slate-200 font-mono">{displayScore.home + displayScore.away} Gol</strong>
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300 font-mono">
            {displayScore.home + displayScore.away > 2.5 ? '2.5 Üst' : '2.5 Alt'}
          </span>
        </div>

        {/* Stadium & Stats */}
        <div className="flex items-center space-x-3 text-slate-500">
          {match.finalScore?.actualCorners && (
            <span className="flex items-center space-x-1">
              <Flag className="w-3 h-3 text-amber-400" />
              <span className="font-mono text-slate-400">{match.finalScore.actualCorners} Korner</span>
            </span>
          )}
          {match.finalScore?.actualCards && (
            <span className="flex items-center space-x-1">
              <FileWarning className="w-3 h-3 text-rose-400" />
              <span className="font-mono text-slate-400">{match.finalScore.actualCards} Kart</span>
            </span>
          )}
          {match.stadium && (
            <span className="hidden sm:flex items-center space-x-1">
              <MapPin className="w-3 h-3 text-slate-500" />
              <span className="truncate max-w-[130px] text-slate-400">{match.stadium}</span>
            </span>
          )}
        </div>

      </div>

    </div>
  );
};

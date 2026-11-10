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
      className={`relative rounded-2xl p-4 sm:p-5 transition-all duration-200 backdrop-blur-md overflow-hidden ${
        isLive
          ? 'bg-gradient-to-r from-slate-900/90 via-rose-950/20 to-slate-900/90 border border-rose-500/40 shadow-lg shadow-rose-950/20'
          : 'bg-slate-900/60 border border-slate-800 hover:border-slate-700/80'
      }`}
    >
      {/* Live Glowing Indicator */}
      {isLive && (
        <div className="absolute top-0 right-0 w-28 h-28 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
      )}

      {/* Header Info: League, Round, Status Badge */}
      <div className="flex items-center justify-between text-xs text-slate-400 mb-3 border-b border-slate-800/60 pb-2.5">
        <div className="flex items-center space-x-2">
          {match.iddaaCode && (
            <span className="font-mono font-black text-amber-300 bg-amber-400/15 border border-amber-400/35 px-1.5 py-0.5 rounded text-[10px] tracking-wide" title="İddaa Maç Kodu">
              KOD: {match.iddaaCode}
            </span>
          )}
          <span className="font-bold text-slate-200 bg-slate-800/90 px-2 py-0.5 rounded-md text-[11px] border border-slate-700/60">
            {match.league}
          </span>
          <span className="text-slate-500 hidden sm:inline">•</span>
          <span className="text-slate-400 hidden sm:inline">
            {match.round ? `${match.round} • ` : ''}{formatDynamicMatchTime(match, now)}
          </span>
        </div>

        <div className="flex items-center space-x-2 text-[11px]">
          {isLive ? (
            <span className="flex items-center space-x-1.5 text-rose-300 font-extrabold bg-rose-500/20 px-2.5 py-0.5 rounded-md border border-rose-500/40 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
              <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span>CANLI {liveMinute ? `• ${liveMinute}` : ''}</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1 text-slate-300 font-bold bg-slate-800 px-2.5 py-0.5 rounded-md border border-slate-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
              <span>MAÇ SONUCU (BİTTİ)</span>
            </span>
          )}
        </div>
      </div>

      {/* Scoreboard Display */}
      <div className="flex items-center justify-between gap-2 sm:gap-4 py-2 min-w-0">
        
        {/* Home Team */}
        <div className="flex-1 min-w-0 flex items-center space-x-2 sm:space-x-2.5">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: homeTeam?.primaryColor || '#10b981' }}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-1.5 min-w-0">
              <span
                className={`font-black text-sm sm:text-base truncate block ${
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
                <span className="text-[10px] text-emerald-400/90 font-mono font-bold bg-slate-800 border border-slate-700/80 px-1.5 py-0.2 rounded shrink-0">
                  #{homeTeam.rank}
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-500 block truncate">Ev Sahibi</span>
          </div>
        </div>

        {/* Center Score Badge */}
        <div className="shrink-0 flex flex-col items-center justify-center px-1 sm:px-2 z-10">
          <div
            className={`inline-flex items-center justify-center min-w-[76px] sm:min-w-[88px] px-3 py-1 rounded-xl text-lg sm:text-xl font-black font-mono tracking-tight shadow-inner ${
              isLive
                ? 'bg-rose-950/80 border border-rose-500/60 text-rose-300 ring-2 ring-rose-500/20'
                : 'bg-slate-950 border border-slate-700 text-white'
            }`}
          >
            <span className={isHomeWinner ? 'text-emerald-400' : ''}>{displayScore.home}</span>
            <span className={`mx-1.5 ${isLive ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`}>-</span>
            <span className={isAwayWinner ? 'text-emerald-400' : ''}>{displayScore.away}</span>
          </div>
          {displayScore.htHome !== undefined && displayScore.htAway !== undefined && (
            <div className="text-[10px] text-slate-400 font-mono mt-1">
              İY: {displayScore.htHome}-{displayScore.htAway}
            </div>
          )}
          {isLive && (
            <div className="text-[10px] text-rose-400 font-bold font-mono mt-0.5 animate-pulse">
              {liveMinute || 'Oynanıyor'}
            </div>
          )}
        </div>

        {/* Away Team */}
        <div className="flex-1 min-w-0 flex items-center justify-end space-x-2 sm:space-x-2.5 text-right">
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-end space-x-1.5 min-w-0">
              {awayTeam?.rank !== undefined && awayTeam.rank !== null && (
                <span className="text-[10px] text-purple-400/90 font-mono font-bold bg-slate-800 border border-slate-700/80 px-1.5 py-0.2 rounded shrink-0">
                  #{awayTeam.rank}
                </span>
              )}
              <span
                className={`font-black text-sm sm:text-base truncate block ${
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
            </div>
            <span className="text-[10px] text-slate-500 block truncate">Deplasman</span>
          </div>
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: awayTeam?.primaryColor || '#6366f1' }}
          />
        </div>

      </div>

      {/* AI Pre-Match Prediction Real-Time Tracker */}
      {predStatus && (
        <div
          className={`mt-3 p-2.5 rounded-xl flex items-center justify-between gap-2 border transition-all duration-300 ${
            predStatus.isWinning
              ? 'bg-emerald-950/70 border-emerald-400/80 text-emerald-200 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-400/40'
              : 'bg-rose-950/70 border-rose-500/80 text-rose-200 shadow-lg shadow-rose-950/40 ring-1 ring-rose-500/40'
          }`}
        >
          <div className="flex items-center space-x-2.5 min-w-0">
            <div
              className={`p-1.5 rounded-lg shrink-0 ${
                predStatus.isWinning
                  ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30'
                  : 'bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/30'
              }`}
            >
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-300 flex items-center space-x-1.5">
                <span>Maç Önü Yapay Zeka Tahmini</span>
                {analysis?.primaryPrediction.confidence ? (
                  <span className="font-mono text-amber-300 font-extrabold bg-amber-400/20 px-1 py-0.2 rounded text-[10px]">
                    %{analysis.primaryPrediction.confidence}
                  </span>
                ) : null}
              </div>
              <div className="font-black text-sm sm:text-base text-white truncate tracking-wide mt-0.5">
                {predStatus.predictionLabel}
              </div>
            </div>
          </div>

          {/* Glowing Status Indicator (Green when winning/hit, Red when losing/missed) */}
          <div className="shrink-0">
            <span
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-black tracking-wide border shadow-md transition-all ${
                predStatus.isWinning
                  ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-emerald-500/40 ring-2 ring-emerald-400/50'
                  : 'bg-rose-600 text-white border-rose-400 shadow-rose-600/40 ring-2 ring-rose-500/40'
              }`}
            >
              {predStatus.isWinning ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{isLive ? '🟢 ANLIK TUTUYOR' : '✅ TAHMİN TUTTU'}</span>
                </>
              ) : (
                <>
                  <X className="w-4 h-4 stroke-[3]" />
                  <span>{isLive ? '🔴 ŞU AN TUTMUYOR' : '❌ TAHMİN YATTI'}</span>
                </>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Outcome / Status Summary Footer */}
      <div className="mt-3 pt-3 border-t border-slate-800/50 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
        
        <div className="flex items-center space-x-2">
          {isLive ? (
            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30 flex items-center space-x-1">
              <Activity className="w-3 h-3 text-rose-400 animate-pulse" />
              <span>Canlı Karşılaşma</span>
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold font-mono">
              {isHomeWinner ? `MS 1 Kazandı` : isAwayWinner ? `MS 2 Kazandı` : `MS X Berabere`}
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

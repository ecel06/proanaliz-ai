import React from 'react';
import { Match, MatchAnalysis } from '../types';
import { Clock, Flame, Sparkles, Star, Zap, ChevronRight, MapPin, Radio } from 'lucide-react';
import { FormBadgeTooltip } from './FormBadgeTooltip';
import { getFormDetails } from '../utils/formDetails';
import { formatDynamicMatchTime } from '../utils/dateHelper';
import { getMatchLiveState } from '../utils/liveMatchHelper';
import { computeRefereeCardProfile } from '../utils/matchInsightsHelper';

interface MatchCardProps {
  match: Match;
  analysis: MatchAnalysis;
  onSelect: (match: Match) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (matchId: string) => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  analysis,
  onSelect,
  isFavorite = false,
  onToggleFavorite
}) => {
  const { homeTeam, awayTeam } = match;
  const { primaryPrediction, ms1, msX, ms2, over25, bttsYes, topHtFt } = analysis;

  const homeFormDetails = getFormDetails(homeTeam, match.league);
  const awayFormDetails = getFormDetails(awayTeam, match.league);
  const liveState = getMatchLiveState(match);
  const refProfile = computeRefereeCardProfile(match, analysis);

  // Badge glow styling
  const isBanko = primaryPrediction.confidence >= 72 || primaryPrediction.badgeType === 'banko';
  const isSurpriz = primaryPrediction.badgeType === 'surpriz';

  return (
    <div
      onClick={() => onSelect(match)}
      className="group relative hover:z-[100] rounded-2xl bg-slate-900/80 border border-slate-800/90 hover:border-emerald-500/50 p-4 sm:p-5 transition-all duration-200 hover:shadow-xl hover:shadow-emerald-950/20 cursor-pointer overflow-visible backdrop-blur-md"
    >
      {/* Top Ambient Glow Gradient */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/15 transition-all duration-300 pointer-events-none rounded-2xl -z-10"></div>

      {/* Header Info: League, Round, Time & Mobile Prediction */}
      <div className="flex items-center justify-between text-xs text-slate-400 mb-3 sm:mb-4 border-b border-slate-800/60 pb-2.5">
        <div className="flex items-center space-x-2">
          {match.iddaaCode && (
            <span className="font-mono font-black text-amber-300 bg-amber-400/15 border border-amber-400/40 px-2 py-0.5 rounded-md text-[10px] tracking-wide shadow-xs" title="İddaa Maç Kodu">
              KOD: {match.iddaaCode}
            </span>
          )}
          <span className="font-bold text-slate-200 bg-slate-800/90 px-2 py-0.5 rounded-md text-[11px] border border-slate-700/60">
            {match.league}
          </span>
          <span className="text-slate-500 hidden sm:inline">•</span>
          <span className="text-slate-400 hidden sm:inline">{match.round}</span>

          {/* Mobile-Only Prominent Main Pick (Ensures it is NEVER hidden or at the bottom on mobile!) */}
          <span className="sm:hidden px-2 py-0.5 rounded-md text-[10px] font-black border bg-emerald-500/15 text-emerald-300 border-emerald-500/40 glow-emerald">
            {primaryPrediction.label} %{primaryPrediction.confidence}
          </span>
        </div>

        <div className="flex items-center space-x-3 text-[11px] text-slate-400">
          {liveState.isLive ? (
            <span className={`flex items-center space-x-1.5 font-extrabold px-2 py-0.5 rounded-md border animate-pulse ${
              liveState.liveMinute === 'Devre Arası'
                ? 'text-amber-300 bg-amber-500/20 border-amber-500/40'
                : 'text-rose-300 bg-rose-500/20 border-rose-500/40'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full animate-ping inline-block ${
                liveState.liveMinute === 'Devre Arası' ? 'bg-amber-400' : 'bg-rose-500'
              }`} />
              <span>
                {liveState.liveMinute === 'Devre Arası'
                  ? `DEVRE ARASI (${liveState.displayScore.home} - ${liveState.displayScore.away})`
                  : `CANLI ${liveState.liveMinute} (${liveState.displayScore.home} - ${liveState.displayScore.away})`}
              </span>
            </span>
          ) : (
            <span className="flex items-center space-x-1 text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              <Clock className="w-3 h-3 text-emerald-400" />
              <span>{formatDynamicMatchTime(match)}</span>
            </span>
          )}

          {onToggleFavorite && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(match.id);
              }}
              title={isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
              className={`p-1 rounded-lg transition-all cursor-pointer ${
                isFavorite
                  ? 'text-amber-400 bg-amber-400/10'
                  : 'text-slate-500 hover:text-amber-400 hover:bg-slate-800'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Prominent Match Fixture Header - "Kimin kiminle oynadığı açık ve net" */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-950/70 border border-slate-800/90 rounded-xl px-3.5 py-2.5 mb-3.5 shadow-inner">
        <div className="flex items-center space-x-2 text-sm sm:text-base font-black text-white">
          <span className="text-emerald-400 font-extrabold">{homeTeam.name}</span>
          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">VS</span>
          <span className="text-indigo-400 font-extrabold">{awayTeam.name}</span>
        </div>
        <div className="flex items-center space-x-2 text-xs text-slate-400 font-semibold">
          {match.iddaaCode && (
            <span className="font-mono font-black text-amber-300 bg-amber-400/15 border border-amber-400/35 px-1.5 py-0.5 rounded text-[11px] tracking-wider">
              #{match.iddaaCode}
            </span>
          )}
          {liveState.isLive ? (
            <span className={`flex items-center space-x-1.5 font-extrabold px-2 py-0.5 rounded text-xs border animate-pulse ${
              liveState.liveMinute === 'Devre Arası'
                ? 'text-amber-300 bg-amber-500/20 border-amber-500/40'
                : 'text-rose-300 bg-rose-500/20 border-rose-500/40'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full animate-ping inline-block ${
                liveState.liveMinute === 'Devre Arası' ? 'bg-amber-400' : 'bg-rose-500'
              }`} />
              <span>
                {liveState.liveMinute === 'Devre Arası'
                  ? `DEVRE ARASI • ${liveState.displayScore.home} - ${liveState.displayScore.away}`
                  : `CANLI ${liveState.liveMinute} • ${liveState.displayScore.home} - ${liveState.displayScore.away}`}
              </span>
            </span>
          ) : (
            <>
              <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{formatDynamicMatchTime(match)}</span>
            </>
          )}
        </div>
      </div>

      {/* Main Responsive Flex Layout: Teams & Form on Left, Prediction Box on Right with generous spacing */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5 md:gap-6">
        
        {/* Teams Section (Spacious team names & form badges) */}
        <div className="flex-1 min-w-0 space-y-2.5">
          
          {/* Subtle column label */}
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold px-0.5 pb-1 border-b border-slate-800/40">
            <span>Takım & Rolü</span>
            <div className="flex items-center space-x-1 shrink-0">
              <span>Son 5 Maç</span>
              <span className="text-[9px] text-amber-400/90 font-mono">(Sağ: Son Maç)</span>
            </div>
          </div>

          {/* Home Team */}
          <div className="flex items-center justify-between gap-3 min-w-0">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: homeTeam.primaryColor || '#10b981' }}
              />
              <span
                className="font-bold text-slate-100 text-sm sm:text-base group-hover:text-emerald-300 transition-colors truncate leading-tight"
                title={homeTeam.name}
              >
                {homeTeam.name}
              </span>
              <span className="text-[9px] text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.2 rounded font-semibold shrink-0">
                Ev Sahibi
              </span>
              {homeTeam.rank !== undefined && (
                <span className="text-[10px] text-emerald-400 font-mono font-bold bg-slate-800/90 border border-slate-700/80 px-1.5 py-0.5 rounded shrink-0">
                  #{homeTeam.rank}
                </span>
              )}
            </div>

            {/* Home Form (Guaranteed spacing, never overlapping prediction box) */}
            <div className="flex items-center space-x-1 shrink-0 ml-2">
              {homeFormDetails.map((detail, i) => (
                <FormBadgeTooltip
                  key={i}
                  detail={detail}
                  teamName={homeTeam.name}
                  isLast={i === homeFormDetails.length - 1}
                  size="sm"
                />
              ))}
            </div>
          </div>

          {/* Away Team */}
          <div className="flex items-center justify-between gap-3 min-w-0">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: awayTeam.primaryColor || '#6366f1' }}
              />
              <span
                className="font-bold text-slate-100 text-sm sm:text-base group-hover:text-emerald-300 transition-colors truncate leading-tight"
                title={awayTeam.name}
              >
                {awayTeam.name}
              </span>
              <span className="text-[9px] text-indigo-300 bg-indigo-950/60 border border-indigo-500/30 px-1.5 py-0.2 rounded font-semibold shrink-0">
                Deplasman
              </span>
              {awayTeam.rank !== undefined && (
                <span className="text-[10px] text-purple-400 font-mono font-bold bg-slate-800/90 border border-slate-700/80 px-1.5 py-0.5 rounded shrink-0">
                  #{awayTeam.rank}
                </span>
              )}
            </div>

            {/* Away Form */}
            <div className="flex items-center space-x-1 shrink-0 ml-2">
              {awayFormDetails.map((detail, i) => (
                <FormBadgeTooltip
                  key={i}
                  detail={detail}
                  teamName={awayTeam.name}
                  isLast={i === awayFormDetails.length - 1}
                  size="sm"
                />
              ))}
            </div>
          </div>

          {/* In-Play Dynamic AI Live Signal Pill */}
          {liveState.isLive && (() => {
            const minNum = parseInt(String(liveState.liveMinute || '').replace(/[^\d]/g, ''), 10) || 45;
            const hG = liveState.displayScore.home;
            const aG = liveState.displayScore.away;
            const totG = hG + aG;
            let insightText = '';
            let insightBg = 'bg-slate-900 border-slate-700 text-slate-300';

            if (minNum >= 58 && totG === 0 && analysis.over25 >= 50) {
              insightText = '⚡ Canlı AI Fırsatı: Maçta gol baskısı tavan yaptı! 0.5 Üst Gol bekleniyor (%82)';
              insightBg = 'bg-amber-500/15 border-amber-500/40 text-amber-300';
            } else if (totG >= 3) {
              insightText = '✅ Canlı Durum: Yüksek tempolu maçta gol barajı aşıldı (2.5 Üst Geldi)';
              insightBg = 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300';
            } else if (hG > aG && analysis.ms1 >= 46) {
              insightText = `⚡ Canlı Durum: ${homeTeam.name} üstünlüğünü koruyor (MS 1 İhtimali Yüksek)`;
              insightBg = 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300';
            } else if (aG > hG && analysis.ms2 >= 40) {
              insightText = `⚡ Canlı Durum: ${awayTeam.name} deplasmanda skoru koruyor (X2 / MS 2 Değeri)`;
              insightBg = 'bg-sky-500/15 border-sky-500/30 text-sky-300';
            } else {
              insightText = `⚡ Canlı Radar: ${minNum}'. dakika tempolu geçiş oyunu sürüyor`;
              insightBg = 'bg-slate-900 border-slate-800 text-slate-400';
            }

            return (
              <div className={`mt-2 px-2.5 py-1 rounded-xl text-[10px] font-bold border flex items-center gap-1.5 ${insightBg}`}>
                <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="truncate">{insightText}</span>
              </div>
            );
          })()}

        </div>

        {/* Prediction Glowing Badge Section (Always separated, dedicated side column with clean margin) */}
        <div className="relative z-10 shrink-0 md:min-w-[190px] lg:min-w-[210px] flex md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 md:border-l border-slate-800/80 pt-3 md:pt-0 md:pl-5 lg:pl-6">
          
          <div className="text-left md:text-right">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1 md:justify-end">
              {isBanko ? (
                <>
                  <Flame className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                  <span className="text-emerald-400">Ana Banko Tahmin</span>
                </>
              ) : isSurpriz ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-purple-400">Yüksek Değerli Seçenek</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-amber-400">Öne Çıkan Tercih</span>
                </>
              )}
            </div>

            {/* Glowing Main Pick Pill */}
            <div className="mt-1 flex items-center space-x-2 md:justify-end">
              <span
                className={`px-3 py-1 rounded-xl font-black text-xs sm:text-sm tracking-tight border flex items-center space-x-1.5 whitespace-nowrap shadow-sm ${
                  isBanko
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 glow-emerald'
                    : isSurpriz
                    ? 'bg-purple-500/15 text-purple-300 border-purple-500/40 glow-purple'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/40 glow-amber'
                }`}
              >
                <span>{primaryPrediction.label}</span>
                <span className="text-[11px] opacity-80 font-mono">%{primaryPrediction.confidence}</span>
              </span>
            </div>
          </div>

          {/* Quick Metrics preview pill */}
          <div className="flex items-center space-x-2 mt-0 md:mt-2 text-[11px]">
            <span className="text-slate-400 hidden xs:inline">
              İY/MS: <strong className="text-slate-200">{topHtFt[0]?.label || 'İY 1'}</strong>
            </span>
            <span className="flex items-center text-emerald-400 text-xs font-semibold group-hover:translate-x-1 transition-transform">
              <span>İncele</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>

        </div>

      </div>

      {/* Mini Probability Bar at Bottom of Card */}
      <div className="mt-4 pt-3 border-t border-slate-800/50 flex flex-col xs:flex-row xs:items-center justify-between gap-2 text-[11px] text-slate-400">
        
        {/* 1 - X - 2 Probs */}
        <div className="flex items-center space-x-3">
          <span className="text-slate-500 font-mono">MS İhtimali:</span>
          <span className="text-emerald-400 font-semibold font-mono">1: %{ms1}</span>
          <span className="text-amber-400 font-semibold font-mono">X: %{msX}</span>
          <span className="text-purple-400 font-semibold font-mono">2: %{ms2}</span>
        </div>

        {/* 2.5 Over / BTTS / Referee Card & Venue */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-slate-400">
          <span>2.5 Üst: <strong className="text-slate-200 font-mono">%{over25}</strong></span>
          <span>•</span>
          <span>KG Var: <strong className="text-slate-200 font-mono">%{bttsYes}</strong></span>
          <span>•</span>
          <span
            className={`px-1.5 py-0.5 rounded font-bold text-[10px] border ${
              refProfile.strictnessColor === 'rose'
                ? 'bg-rose-500/15 text-rose-300 border-rose-500/35'
                : refProfile.strictnessColor === 'amber'
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/35'
                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35'
            }`}
            title={`${refProfile.strictnessLabel} • Penaltı İhtimali: %${refProfile.penaltyPct}`}
          >
            🟨 ~{refProfile.avgYellowCards} Kart • Pen: %{refProfile.penaltyPct}
          </span>
          <span className="hidden md:inline">•</span>
          <span className="hidden md:flex items-center space-x-1 text-slate-500">
            <MapPin className="w-3 h-3" />
            <span className="truncate max-w-[130px]">{match.stadium}</span>
          </span>
        </div>

      </div>

    </div>
  );
};


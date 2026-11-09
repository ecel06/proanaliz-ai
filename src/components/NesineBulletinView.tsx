import React, { useMemo } from 'react';
import { Match, MatchAnalysis, UserBetslipItem } from '../types';
import { BettingPickOption, calcMarketOdd } from '../utils/oddsHelper';
import { formatDynamicMatchTime } from '../utils/dateHelper';
import { getMatchLiveState } from '../utils/liveMatchHelper';
import { Clock, Star, Sparkles, ChevronRight, Trophy, Bot, Radio } from 'lucide-react';

interface NesineBulletinViewProps {
  matches: Match[];
  matchAnalysesMap: Map<string, MatchAnalysis>;
  onSelectMatch: (match: Match) => void;
  favorites?: string[];
  onToggleFavorite?: (matchId: string) => void;
  betslipItems: UserBetslipItem[];
  onToggleBetslip: (match: Match, option: BettingPickOption) => void;
}

interface QuickOddDef {
  key: string;
  shortLabel: string;
  marketName: string;
  getFullLabel: (match: Match) => string;
  getProbAndOdd: (analysis: MatchAnalysis) => { prob: number; odd: number };
}

const QUICK_ODDS_DEFS: QuickOddDef[] = [
  {
    key: 'ms1',
    shortLabel: '1',
    marketName: 'Maç Sonucu',
    getFullLabel: (m) => `MS 1 (${m.homeTeam.shortName || m.homeTeam.name})`,
    getProbAndOdd: (a) => ({ prob: a.ms1, odd: calcMarketOdd(a.ms1) })
  },
  {
    key: 'msX',
    shortLabel: 'X',
    marketName: 'Maç Sonucu',
    getFullLabel: () => 'MS X (Beraberlik)',
    getProbAndOdd: (a) => ({ prob: a.msX, odd: calcMarketOdd(a.msX, 0.91) })
  },
  {
    key: 'ms2',
    shortLabel: '2',
    marketName: 'Maç Sonucu',
    getFullLabel: (m) => `MS 2 (${m.awayTeam.shortName || m.awayTeam.name})`,
    getProbAndOdd: (a) => ({ prob: a.ms2, odd: calcMarketOdd(a.ms2) })
  },
  {
    key: 'under25',
    shortLabel: '2.5 Alt',
    marketName: '2.5 Gol',
    getFullLabel: () => '2.5 Gol Alt',
    getProbAndOdd: (a) => ({ prob: a.under25, odd: calcMarketOdd(a.under25) })
  },
  {
    key: 'over25',
    shortLabel: '2.5 Üst',
    marketName: '2.5 Gol',
    getFullLabel: () => '2.5 Gol Üst',
    getProbAndOdd: (a) => ({ prob: a.over25, odd: calcMarketOdd(a.over25) })
  },
  {
    key: 'bttsYes',
    shortLabel: 'KG Var',
    marketName: 'Karşılıklı Gol',
    getFullLabel: () => 'KG Var',
    getProbAndOdd: (a) => ({ prob: a.bttsYes, odd: calcMarketOdd(a.bttsYes) })
  },
  {
    key: 'bttsNo',
    shortLabel: 'KG Yok',
    marketName: 'Karşılıklı Gol',
    getFullLabel: () => 'KG Yok',
    getProbAndOdd: (a) => ({ prob: a.bttsNo, odd: calcMarketOdd(a.bttsNo) })
  }
];

export const NesineBulletinView: React.FC<NesineBulletinViewProps> = ({
  matches,
  matchAnalysesMap,
  onSelectMatch,
  favorites = [],
  onToggleFavorite,
  betslipItems,
  onToggleBetslip
}) => {
  // Group matches by league for clean Nesine-style bulletin sections
  const groupedMatches = useMemo(() => {
    const groups: { league: string; matches: Match[] }[] = [];
    const leagueMap = new Map<string, Match[]>();

    matches.forEach((m) => {
      const lg = m.league || 'Diğer Ligler';
      if (!leagueMap.has(lg)) {
        leagueMap.set(lg, []);
      }
      leagueMap.get(lg)!.push(m);
    });

    leagueMap.forEach((mList, lg) => {
      groups.push({ league: lg, matches: mList });
    });

    return groups;
  }, [matches]);

  if (matches.length === 0) {
    return (
      <div className="p-12 text-center rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
        <Trophy className="w-10 h-10 text-slate-600 mx-auto" />
        <h4 className="text-base font-bold text-slate-200">
          Bu kriterlere uygun bülten maçı bulunamadı
        </h4>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Filtreleri veya arama kelimesini temizleyerek tüm bülteni görüntüleyebilirsiniz.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groupedMatches.map((group) => (
        <div
          key={group.league}
          className="rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-xl overflow-hidden backdrop-blur-md"
        >
          {/* League Header Strip (Nesine Style) */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 px-3.5 sm:px-5 py-2.5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block shadow-sm shadow-emerald-400/50" />
              <h3 className="text-xs sm:text-sm font-black text-white tracking-wide uppercase">
                {group.league}
              </h3>
              <span className="text-[10px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60">
                {group.matches.length} Maç
              </span>
            </div>

            {/* Desktop Table Headers Hint */}
            <div className="hidden xl:flex items-center space-x-8 text-[11px] font-bold text-slate-400 uppercase tracking-wider pr-2">
              <div className="w-24 text-center">Maç Sonucu</div>
              <div className="w-20 text-center">2.5 Gol</div>
              <div className="w-20 text-center">KG Var/Yok</div>
              <div className="w-14 text-center">Detay</div>
            </div>
          </div>

          {/* Matches List */}
          <div className="divide-y divide-slate-800/70">
            {group.matches.map((match) => {
              const analysis = matchAnalysesMap.get(match.id);
              if (!analysis) return null;

              const liveState = getMatchLiveState(match);
              const isFav = favorites.includes(match.id);
              const { primaryPrediction } = analysis;

              return (
                <div
                  key={match.id}
                  className="p-3 sm:p-3.5 hover:bg-slate-800/40 transition-colors flex flex-col xl:flex-row xl:items-center justify-between gap-3 group"
                >
                  {/* Left Section: Match Info (Code, Time, Teams & AI Badge) */}
                  <div
                    onClick={() => onSelectMatch(match)}
                    className="flex-1 min-w-0 cursor-pointer flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
                  >
                    {/* Time & Code */}
                    <div className="flex items-center space-x-2 shrink-0">
                      {onToggleFavorite && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(match.id);
                          }}
                          className={`p-1 rounded-md transition-colors ${
                            isFav ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'
                          }`}
                          title={isFav ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                        >
                          <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                        </button>
                      )}

                      {match.iddaaCode && (
                        <span className="font-mono font-black text-amber-300 bg-amber-400/10 border border-amber-400/30 px-1.5 py-0.5 rounded text-[11px]">
                          #{match.iddaaCode}
                        </span>
                      )}

                      {liveState.isLive ? (
                        <span className="flex items-center space-x-1 text-rose-400 font-extrabold text-[11px] bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-md animate-pulse">
                          <Radio className="w-3 h-3 text-rose-400" />
                          <span>CANLI {liveState.liveMinute}</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-1 text-emerald-400 font-semibold text-[11px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                          <Clock className="w-3 h-3 text-emerald-400" />
                          <span>{formatDynamicMatchTime(match)}</span>
                        </span>
                      )}
                    </div>

                    {/* Teams Display */}
                    <div className="flex items-center space-x-2 text-sm sm:text-base font-bold text-white min-w-0 flex-1">
                      <span className="truncate hover:text-emerald-300 transition-colors">
                        {match.homeTeam.name}
                      </span>
                      <span className="text-slate-500 text-xs font-normal shrink-0">vs</span>
                      <span className="truncate hover:text-indigo-300 transition-colors">
                        {match.awayTeam.name}
                      </span>

                      {liveState.isLive && (
                        <span className="font-mono font-black text-rose-400 text-sm ml-1 shrink-0">
                          ({liveState.displayScore.home} - {liveState.displayScore.away})
                        </span>
                      )}
                    </div>

                    {/* AI Pick Pill */}
                    <div className="shrink-0">
                      <span
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-black border bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-xs"
                        title="ProAnaliz Yapay Zeka Model Tahmini"
                      >
                        <Bot className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{primaryPrediction.label}</span>
                        <span className="text-emerald-400 font-mono">%{primaryPrediction.confidence}</span>
                      </span>
                    </div>
                  </div>

                  {/* Right Section: Quick Odds Grid (Nesine Click-to-Slip Format) */}
                  <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2 shrink-0 pt-2 xl:pt-0 border-t xl:border-t-0 border-slate-800/60">
                    <div className="grid grid-cols-7 gap-1 sm:gap-1.5 w-full sm:w-auto">
                      {QUICK_ODDS_DEFS.map((def) => {
                        const { prob, odd } = def.getProbAndOdd(analysis);
                        const isSelected = betslipItems.some(
                          (item) => item.matchId === match.id && item.pickKey === def.key
                        );

                        const option: BettingPickOption = {
                          key: def.key,
                          label: def.getFullLabel(match),
                          marketKey: def.key.startsWith('ms')
                            ? 'match_result'
                            : def.key.includes('25')
                            ? 'goals_25'
                            : 'btts',
                          marketName: def.marketName,
                          odd,
                          probability: prob
                        };

                        return (
                          <button
                            key={def.key}
                            type="button"
                            onClick={() => onToggleBetslip(match, option)}
                            title={`${def.getFullLabel(match)} - Oran: ${odd.toFixed(2)} (%${prob} Güven)`}
                            className={`flex flex-col items-center justify-center min-w-[42px] sm:min-w-[48px] px-1.5 py-1 sm:py-1.5 rounded-lg text-center transition-all cursor-pointer select-none active:scale-95 ${
                              isSelected
                                ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-300 scale-105'
                                : 'bg-slate-950/80 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-emerald-500/40 hover:text-emerald-300'
                            }`}
                          >
                            <span
                              className={`text-[9px] uppercase tracking-wider font-extrabold ${
                                isSelected ? 'text-slate-950' : 'text-slate-400'
                              }`}
                            >
                              {def.shortLabel}
                            </span>
                            <span
                              className={`font-mono text-xs sm:text-[13px] font-bold ${
                                isSelected ? 'text-slate-950 font-black' : 'text-white'
                              }`}
                            >
                              {odd.toFixed(2)}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Detail Modal Opener Button (+24 Oran & Analiz) */}
                    <button
                      type="button"
                      onClick={() => onSelectMatch(match)}
                      className="flex items-center justify-center p-2 rounded-lg bg-slate-950/70 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors shrink-0"
                      title="Tüm Bahis Oranları & Detaylı Analiz Raporu"
                    >
                      <span className="text-[11px] font-bold font-mono text-emerald-400 hidden sm:inline mr-1">
                        +24
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};


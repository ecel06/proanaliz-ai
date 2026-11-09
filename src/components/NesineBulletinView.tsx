import React, { useMemo } from 'react';
import { Match, MatchAnalysis, UserBetslipItem } from '../types';
import { BettingPickOption, calcMarketOdd } from '../utils/oddsHelper';
import { getMatchParsedDate, TURKISH_MONTHS } from '../utils/dateHelper';
import { getMatchLiveState, parseMatchKickoffEpoch } from '../utils/liveMatchHelper';
import { detectMatchValueBets } from '../utils/valueBetHelper';
import { Clock, Star, ChevronRight, Trophy, Bot, Radio, Target, Zap } from 'lucide-react';

interface NesineBulletinViewProps {
  matches: Match[];
  matchAnalysesMap: Map<string, MatchAnalysis>;
  onSelectMatch: (match: Match) => void;
  favorites?: string[];
  onToggleFavorite?: (matchId: string) => void;
  betslipItems: UserBetslipItem[];
  onToggleBetslip: (match: Match, option: BettingPickOption) => void;
  sortOption?: string;
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

/**
 * Returns a clean, short time & date string (e.g. time: "13:00", date: "14 Kas")
 * Prevents bloated raw ISO date strings from crushing team names.
 */
function getCleanTimeAndDate(match: Match): { time: string; date: string } {
  const d = getMatchParsedDate(match);
  const now = new Date();

  let time = '--:--';
  if (d) {
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    time = `${hh}:${mm}`;
  } else if (match.time && match.time.includes(':')) {
    const parts = match.time.split(':');
    time = `${parts[0].slice(-2)}:${parts[1].slice(0, 2)}`;
  }

  let date = '';
  if (d) {
    const isSameDay =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const isTomorrow =
      d.getDate() === tomorrow.getDate() &&
      d.getMonth() === tomorrow.getMonth() &&
      d.getFullYear() === tomorrow.getFullYear();

    if (isSameDay) {
      date = 'Bugün';
    } else if (isTomorrow) {
      date = 'Yarın';
    } else {
      const dayNum = d.getDate();
      const monthStr = TURKISH_MONTHS[d.getMonth()]?.slice(0, 3) || '';
      date = `${dayNum} ${monthStr}`;
    }
  }

  return { time, date };
}

export const NesineBulletinView: React.FC<NesineBulletinViewProps> = ({
  matches,
  matchAnalysesMap,
  onSelectMatch,
  favorites = [],
  onToggleFavorite,
  betslipItems,
  onToggleBetslip,
  sortOption = 'time'
}) => {
  // If user selected a Rank-based sort (confidence, goals, ms1), show a single unified ranked leaderboard!
  // If user selected 'time', group chronologically by league (traditional Nesine style).
  const isRankedSort = Boolean(sortOption && sortOption !== 'time');

  const groupedMatches = useMemo(() => {
    if (isRankedSort) {
      let title = '🏆 En Yüksek Güven Skoru Sıralaması';
      let subtitle = 'Yapay zeka başarı olasılığı en yüksek olan maçtan aşağıya doğru sıralanmıştır';
      if (sortOption === 'goals') {
        title = '⚡ En Yüksek Gol Beklentisi (xG) Sıralaması';
        subtitle = 'Maç başına beklenen toplam gol (xG) potansiyeli en yüksek olan maçlar başta';
      } else if (sortOption === 'ms1') {
        title = '👑 Ev Sahibi Üstünlüğü (MS 1) Sıralaması';
        subtitle = 'Ev sahibi galibiyet olasılığı en yüksek karşılaşmalar başta';
      }

      return [
        {
          league: title,
          subtitle,
          isRanked: true,
          matches // strictly in sorted order from App.tsx!
        }
      ];
    }

    const groups: { league: string; subtitle?: string; isRanked?: boolean; matches: Match[] }[] = [];
    const leagueMap = new Map<string, Match[]>();

    matches.forEach((m) => {
      const lg = m.league || 'Diğer Ligler';
      if (!leagueMap.has(lg)) {
        leagueMap.set(lg, []);
      }
      leagueMap.get(lg)!.push(m);
    });

    leagueMap.forEach((mList, lg) => {
      mList.sort((a, b) => parseMatchKickoffEpoch(a) - parseMatchKickoffEpoch(b));
      groups.push({ league: lg, matches: mList });
    });

    // Sort league blocks by their earliest kickoff time (next upcoming league at top!)
    groups.sort((g1, g2) => {
      const t1 = g1.matches[0] ? parseMatchKickoffEpoch(g1.matches[0]) : 0;
      const t2 = g2.matches[0] ? parseMatchKickoffEpoch(g2.matches[0]) : 0;
      return t1 - t2;
    });

    return groups;
  }, [matches, sortOption, isRankedSort]);

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
    <div className="space-y-5">
      {groupedMatches.map((group) => (
        <div
          key={group.league}
          className="rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-xl overflow-hidden backdrop-blur-md"
        >
          {/* League Header Strip (Nesine Style) or Ranked Leaderboard Strip */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 px-3.5 sm:px-5 py-2.5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <span className={`w-2.5 h-2.5 rounded-full inline-block shadow-sm ${
                group.isRanked ? 'bg-amber-400 shadow-amber-400/50' : 'bg-emerald-400 shadow-emerald-400/50'
              }`} />
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <h3 className="text-xs sm:text-sm font-black text-white tracking-wide uppercase">
                    {group.league}
                  </h3>
                  <span className="text-[10px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60">
                    {group.matches.length} Maç
                  </span>
                </div>
                {group.subtitle && (
                  <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 font-medium">
                    {group.subtitle}
                  </p>
                )}
              </div>
            </div>

            {/* Desktop Table Headers Hint */}
            <div className="hidden lg:flex items-center space-x-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider pr-1">
              <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center w-[360px]">
                <div>1</div>
                <div>X</div>
                <div>2</div>
                <div>2.5 Alt</div>
                <div>2.5 Üst</div>
                <div>KG Var</div>
                <div>KG Yok</div>
              </div>
              <div className="w-12 text-center">Detay</div>
            </div>
          </div>

          {/* Matches List */}
          <div className="divide-y divide-slate-800/70">
            {group.matches.map((match, matchIndex) => {
              const analysis = matchAnalysesMap.get(match.id);
              if (!analysis) return null;

              const liveState = getMatchLiveState(match);
              const isFav = favorites.includes(match.id);
              const { primaryPrediction } = analysis;
              const { time, date } = getCleanTimeAndDate(match);
              const valueSummary = detectMatchValueBets(match, analysis);

              const sortPill = (() => {
                if (sortOption === 'goals') {
                  return {
                    icon: <Zap className="w-3.5 h-3.5 text-amber-400" />,
                    label: `xG ${analysis.expectedTotalGoals.toFixed(1)}`,
                    sub: `%${analysis.over25} Üst`,
                    style: 'bg-amber-500/15 text-amber-300 border-amber-500/35'
                  };
                }
                if (sortOption === 'ms1') {
                  return {
                    icon: <Trophy className="w-3.5 h-3.5 text-emerald-400" />,
                    label: 'MS 1',
                    sub: `%${analysis.ms1}`,
                    style: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35'
                  };
                }
                return {
                  icon: <Bot className="w-3.5 h-3.5 text-emerald-400" />,
                  label: primaryPrediction.label,
                  sub: `%${primaryPrediction.confidence}`,
                  style: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                };
              })();

              return (
                <div
                  key={match.id}
                  className="p-3 sm:p-3.5 hover:bg-slate-800/40 transition-colors group"
                >
                  {/* DESKTOP & TABLET VIEW (lg and up): 3 clear non-colliding columns */}
                  <div className="hidden lg:flex items-center justify-between gap-4">
                    {/* Col 1: Star, Rank, Time & Code */}
                    <div className="flex items-center space-x-2 w-32 shrink-0">
                      {group.isRanked && (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-black font-mono shrink-0 ${
                            matchIndex === 0
                              ? 'bg-amber-400 text-slate-950 ring-1 ring-amber-300 shadow-xs'
                              : matchIndex === 1
                              ? 'bg-slate-300 text-slate-950 ring-1 ring-slate-200'
                              : matchIndex === 2
                              ? 'bg-amber-700 text-amber-100 ring-1 ring-amber-600'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                          title={`Sıralama: #${matchIndex + 1}`}
                        >
                          #{matchIndex + 1}
                        </span>
                      )}

                      {onToggleFavorite && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(match.id);
                          }}
                          className={`p-1 rounded-md transition-colors cursor-pointer ${
                            isFav ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'
                          }`}
                          title={isFav ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                        >
                          <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                        </button>
                      )}

                      <div className="flex flex-col min-w-0">
                        {liveState.isLive ? (
                          <span className="flex items-center space-x-1 text-rose-400 font-extrabold text-xs animate-pulse">
                            <Radio className="w-3 h-3 text-rose-400" />
                            <span>{liveState.liveMinute}</span>
                          </span>
                        ) : (match.status === 'postponed' || (match as any).isPostponed) ? (
                          <span className="font-bold text-amber-400 text-xs bg-amber-400/10 border border-amber-400/30 px-1.5 py-0.5 rounded">
                            Ertelendi
                          </span>
                        ) : (
                          <span className="font-mono font-black text-emerald-400 text-sm">
                            {time}
                          </span>
                        )}

                        <div className="flex items-center space-x-1 text-[10px] text-slate-400 font-medium truncate">
                          <span>{date}</span>
                          {group.isRanked && match.league && (
                            <>
                              <span className="text-slate-600">•</span>
                              <span className="text-emerald-400 font-semibold truncate max-w-[70px]" title={match.league}>
                                {match.league}
                              </span>
                            </>
                          )}
                          {match.iddaaCode && (
                            <>
                              <span className="text-slate-600">•</span>
                              <span className="font-mono text-amber-400/90 font-bold">#{match.iddaaCode}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Col 2: Teams & AI Pick (Flexible flex-1, min-w-0, CAN NEVER OVERLAP) */}
                    <div
                      onClick={() => onSelectMatch(match)}
                      className="flex-1 min-w-0 cursor-pointer flex items-center justify-between gap-3 pr-2"
                    >
                      {/* Teams (Stacked cleanly like Nesine so names are 100% visible) */}
                      <div className="flex flex-col space-y-1 min-w-0 flex-1">
                        <div className="flex items-center space-x-2 text-sm font-black text-white group-hover:text-emerald-300 transition-colors">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: match.homeTeam.primaryColor || '#10b981' }}
                          />
                          <span className="truncate">{match.homeTeam.name}</span>
                          {liveState.isLive && (
                            <span className="font-mono font-black text-rose-400 text-xs ml-auto pr-2">
                              {liveState.displayScore.home}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 text-sm font-black text-slate-200 group-hover:text-indigo-300 transition-colors">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: match.awayTeam.primaryColor || '#6366f1' }}
                          />
                          <span className="truncate">{match.awayTeam.name}</span>
                          {liveState.isLive && (
                            <span className="font-mono font-black text-rose-400 text-xs ml-auto pr-2">
                              {liveState.displayScore.away}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* AI & Value Recommendation Pills */}
                      <div className="shrink-0 pl-2 flex items-center space-x-1.5">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-black border whitespace-nowrap shadow-xs ${sortPill.style}`}
                          title="Yapay Zeka Poisson & Sıralama Değeri"
                        >
                          {sortPill.icon}
                          <span>{sortPill.label}</span>
                          <span className="font-mono font-bold opacity-90">{sortPill.sub}</span>
                        </span>

                        {valueSummary.hasValue && valueSummary.bestValuePick && (
                          <span
                            className="inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-[11px] font-black border bg-amber-500/15 text-amber-300 border-amber-500/40 whitespace-nowrap shadow-xs"
                            title={`Değer Bahsi: ${valueSummary.bestValuePick.pickLabel} (Piyasa oranından +%${valueSummary.bestValuePick.edgePercent} daha değerli!)`}
                          >
                            <Target className="w-3 h-3 text-amber-400" />
                            <span>+%{valueSummary.bestValuePick.edgePercent} Değer</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Col 3: Odds Grid + Detail Button (Fixed width, shrink-0) */}
                    <div className="flex items-center space-x-2 shrink-0">
                      <div className="grid grid-cols-7 gap-1 sm:gap-1.5 w-[360px]">
                        {QUICK_ODDS_DEFS.map((def) => {
                          const { prob, odd } = def.getProbAndOdd(analysis);
                          const isSelected = betslipItems.some(
                            (item) => item.matchId === match.id && item.pickKey === def.key
                          );
                          const isValueOdd = valueSummary.hasValue && valueSummary.bestValuePick?.pickKey === def.key;

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
                              title={`${def.getFullLabel(match)} - Oran: ${odd.toFixed(2)} (%${prob} Güven)${isValueOdd ? ' • 🎯 Değer Bahsi!' : ''}`}
                              className={`relative flex flex-col items-center justify-center min-w-[44px] px-1 py-1 sm:py-1.5 rounded-lg text-center transition-all cursor-pointer select-none active:scale-95 ${
                                isSelected
                                  ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-300 scale-105'
                                  : isValueOdd
                                  ? 'bg-amber-950/40 text-amber-200 border border-amber-500/60 ring-1 ring-amber-400/50 hover:bg-amber-900/40'
                                  : 'bg-slate-950/80 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-emerald-500/40 hover:text-emerald-300'
                              }`}
                            >
                              {isValueOdd && !isSelected && (
                                <span className="absolute -top-1 -right-0.5 w-2 h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400" />
                              )}
                              <span
                                className={`text-[9px] uppercase tracking-wider font-extrabold ${
                                  isSelected ? 'text-slate-950' : isValueOdd ? 'text-amber-300' : 'text-slate-400'
                                }`}
                              >
                                {def.shortLabel}
                              </span>
                              <span
                                className={`font-mono text-xs sm:text-[13px] font-bold ${
                                  isSelected ? 'text-slate-950 font-black' : isValueOdd ? 'text-amber-200 font-black' : 'text-white'
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
                        className="flex items-center justify-center p-2 w-12 rounded-lg bg-slate-950/70 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors shrink-0 cursor-pointer"
                        title="Tüm Bahis Oranları & Detaylı Analiz Raporu"
                      >
                        <span className="text-[11px] font-bold font-mono text-emerald-400 mr-0.5">
                          +24
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                      </button>
                    </div>
                  </div>

                  {/* MOBILE & TABLET COMPACT VIEW (< lg): 3 clean stacked rows */}
                  <div className="lg:hidden flex flex-col space-y-2.5">
                    {/* Row 1: Time, Rank, Code, Favorite on left, AI Pick on right */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                        {group.isRanked && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-black font-mono shrink-0 ${
                              matchIndex === 0
                                ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                                : matchIndex === 1
                                ? 'bg-slate-300 text-slate-950 font-black'
                                : matchIndex === 2
                                ? 'bg-amber-700 text-amber-100 font-black'
                                : 'bg-slate-800 text-slate-400 font-bold'
                            }`}
                          >
                            #{matchIndex + 1}
                          </span>
                        )}

                        {onToggleFavorite && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleFavorite(match.id);
                            }}
                            className={`p-1 rounded-md transition-colors ${
                              isFav ? 'text-amber-400' : 'text-slate-600'
                            }`}
                          >
                            <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                          </button>
                        )}

                        {group.isRanked && match.league && (
                          <span className="text-[10px] text-emerald-400 font-bold truncate max-w-[85px] bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                            {match.league}
                          </span>
                        )}

                        {match.iddaaCode && (
                          <span className="font-mono font-black text-amber-300 bg-amber-400/10 border border-amber-400/30 px-1.5 py-0.5 rounded text-[10px]">
                            #{match.iddaaCode}
                          </span>
                        )}

                        {liveState.isLive ? (
                          <span className="flex items-center space-x-1 text-rose-400 font-black text-[11px] bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-md animate-pulse">
                            <Radio className="w-3 h-3 text-rose-400" />
                            <span>CANLI {liveState.liveMinute}</span>
                          </span>
                        ) : (match.status === 'postponed' || (match as any).isPostponed) ? (
                          <span className="flex items-center space-x-1 text-amber-400 font-bold text-[11px] bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md">
                            <span>Ertelendi</span>
                          </span>
                        ) : (
                          <span className="flex items-center space-x-1 text-emerald-400 font-semibold text-[11px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                            <Clock className="w-3 h-3 text-emerald-400" />
                            <span>{time} ({date})</span>
                          </span>
                        )}
                      </div>

                      {/* AI & Value Pill on top right */}
                      <div className="flex items-center space-x-1 shrink-0">
                        <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-black border ${sortPill.style}`}>
                          {sortPill.icon}
                          <span>{sortPill.label}</span>
                          <span className="font-mono">{sortPill.sub}</span>
                        </span>

                        {valueSummary.hasValue && valueSummary.bestValuePick && (
                          <span className="inline-flex items-center space-x-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-black border bg-amber-500/15 text-amber-300 border-amber-500/40">
                            <Target className="w-2.5 h-2.5 text-amber-400" />
                            <span>+%{valueSummary.bestValuePick.edgePercent}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Row 2: Team Names (Large, bold, 100% visible, clicking opens modal) */}
                    <div
                      onClick={() => onSelectMatch(match)}
                      className="flex items-center justify-between cursor-pointer py-0.5 hover:text-emerald-300 transition-colors"
                    >
                      <div className="flex items-center space-x-2 text-sm sm:text-base font-black text-white truncate">
                        <span className="truncate">{match.homeTeam.name}</span>
                        <span className="text-slate-500 text-xs font-normal shrink-0">vs</span>
                        <span className="truncate">{match.awayTeam.name}</span>
                      </div>

                      {liveState.isLive && (
                        <span className="font-mono font-black text-rose-400 text-sm shrink-0 ml-2">
                          ({liveState.displayScore.home} - {liveState.displayScore.away})
                        </span>
                      )}
                    </div>

                    {/* Row 3: Quick Odds Bar (8 columns: 7 odds + 1 detail button) */}
                    <div className="grid grid-cols-8 gap-1 pt-1">
                      {QUICK_ODDS_DEFS.map((def) => {
                        const { prob, odd } = def.getProbAndOdd(analysis);
                        const isSelected = betslipItems.some(
                          (item) => item.matchId === match.id && item.pickKey === def.key
                        );
                        const isValueOdd = valueSummary.hasValue && valueSummary.bestValuePick?.pickKey === def.key;

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
                            title={`${def.getFullLabel(match)} - Oran: ${odd.toFixed(2)}${isValueOdd ? ' • 🎯 Değer Bahsi!' : ''}`}
                            className={`flex flex-col items-center justify-center p-1 rounded text-center transition-all cursor-pointer select-none active:scale-95 ${
                              isSelected
                                ? 'bg-emerald-500 text-slate-950 font-black ring-1 ring-emerald-300'
                                : isValueOdd
                                ? 'bg-amber-950/40 text-amber-200 border border-amber-500/60 ring-1 ring-amber-400/50'
                                : 'bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800'
                            }`}
                          >
                            <span
                              className={`text-[8px] uppercase tracking-wider font-extrabold leading-none mb-0.5 ${
                                isSelected ? 'text-slate-950' : 'text-slate-400'
                              }`}
                            >
                              {def.shortLabel}
                            </span>
                            <span
                              className={`font-mono text-[11px] font-bold leading-none ${
                                isSelected ? 'text-slate-950 font-black' : 'text-white'
                              }`}
                            >
                              {odd.toFixed(2)}
                            </span>
                          </button>
                        );
                      })}

                      {/* Detail button (+24) */}
                      <button
                        type="button"
                        onClick={() => onSelectMatch(match)}
                        className="flex flex-col items-center justify-center p-1 rounded bg-slate-950 hover:bg-slate-800 text-emerald-400 border border-slate-800 text-xs font-bold font-mono cursor-pointer"
                        title="Tüm Oranlar & Analiz"
                      >
                        <span className="text-[8px] text-slate-400 leading-none mb-0.5">TÜM</span>
                        <span className="text-[11px] text-emerald-400 font-bold leading-none">+24</span>
                      </button>
                    </div>
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

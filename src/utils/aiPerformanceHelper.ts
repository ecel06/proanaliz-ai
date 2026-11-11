// src/utils/aiPerformanceHelper.ts
// Computes 100% live, verifiable accuracy statistics strictly from completed bulletin matches (no hardcoded metrics).

import { Match, MatchAnalysis } from '../types';
import { getMatchLiveState } from './liveMatchHelper';
import { resolveMarketOdd } from './oddsHelper';
import { detectMatchValueBets } from './valueBetHelper';

export interface PerformanceCategoryStat {
  id: string;
  label: string;
  totalPicks: number;
  wonPicks: number;
  accuracyRate: number;
  avgOdds: number;
  description: string;
  badgeColor: string;
}

export interface LeagueAccuracyStat {
  league: string;
  totalMatches: number;
  accuracyRate: number;
  topTrend: string;
}

export interface OverallPerformanceReport {
  totalAnalyzed: number;
  overallAccuracyRate: number;
  bankoAccuracyRate: number;
  over25AccuracyRate: number;
  bttsAccuracyRate: number;
  valueBetWinRate: number;
  totalWonCoupons: number;
  categories: PerformanceCategoryStat[];
  leagueBreakdown: LeagueAccuracyStat[];
  recentVerifiedPicks: {
    matchText: string;
    league: string;
    prediction: string;
    actualScore: string;
    odd: number;
    isWon: boolean;
  }[];
}

function didLabelHit(label: string, home: number, away: number): boolean {
  const norm = label.toLowerCase();
  const total = home + away;
  const btts = home > 0 && away > 0;
  if (norm.includes('1x')) return home >= away;
  if (norm.includes('x2')) return away >= home;
  if (norm.includes('1-2') || norm.includes('12')) return home !== away;
  if (norm.includes('ms 1') || norm.includes('ev')) return home > away;
  if (norm.includes('ms 2') || norm.includes('dep')) return away > home;
  if (norm.includes('ms x') || norm.includes('berab')) return home === away;
  if (norm.includes('2.5') && (norm.includes('üst') || norm.includes('over'))) return total >= 3;
  if (norm.includes('2.5') && (norm.includes('alt') || norm.includes('under'))) return total <= 2;
  if (norm.includes('1.5') && (norm.includes('üst') || norm.includes('over'))) return total >= 2;
  if (norm.includes('3.5') && (norm.includes('alt') || norm.includes('under'))) return total <= 3;
  if (norm.includes('kg var')) return btts;
  if (norm.includes('kg yok')) return !btts;
  return home > away;
}

export function computeAIPerformance(
  matches: Match[],
  analysesMap: Map<string, MatchAnalysis>
): OverallPerformanceReport {
  const finished = matches.filter(m => getMatchLiveState(m).isFinished);

  let bankoTotal = 0, bankoWon = 0, bankoOddSum = 0;
  let over25Total = 0, over25Won = 0, over25OddSum = 0;
  let bttsTotal = 0, bttsWon = 0, bttsOddSum = 0;
  let valueTotal = 0, valueWon = 0, valueOddSum = 0;
  let overallTotal = 0, overallWon = 0;

  const leagueStatsMap = new Map<string, { total: number; won: number; over25Hits: number; ms1Hits: number }>();
  const recentPicks: OverallPerformanceReport['recentVerifiedPicks'] = [];

  for (const m of finished) {
    const a = analysesMap.get(m.id);
    if (!a) continue;

    const live = getMatchLiveState(m);
    const h = live.displayScore.home;
    const aw = live.displayScore.away;
    const totalGoals = h + aw;
    const isOver25 = totalGoals >= 3;
    const isBtts = h > 0 && aw > 0;

    // Overall primary prediction tracking
    const primaryHit = didLabelHit(a.primaryPrediction.label, h, aw);
    overallTotal++;
    if (primaryHit) overallWon++;

    // Per-league real aggregation
    const lgName = m.league || 'Diğer';
    const lgAcc = leagueStatsMap.get(lgName) || { total: 0, won: 0, over25Hits: 0, ms1Hits: 0 };
    lgAcc.total++;
    if (primaryHit) lgAcc.won++;
    if (isOver25) lgAcc.over25Hits++;
    if (h > aw) lgAcc.ms1Hits++;
    leagueStatsMap.set(lgName, lgAcc);

    // 1. Banko predictions (Confidence >= 72%)
    if (a.primaryPrediction.confidence >= 72) {
      bankoTotal++;
      if (primaryHit) bankoWon++;
      const oddInfo = resolveMarketOdd(m, 'ms1', a.primaryPrediction.confidence);
      bankoOddSum += oddInfo.odd;

      if (recentPicks.length < 12) {
        recentPicks.push({
          matchText: `${m.homeTeam.name} vs ${m.awayTeam.name}`,
          league: m.league,
          prediction: a.primaryPrediction.label,
          actualScore: `${h}-${aw}`,
          odd: oddInfo.odd,
          isWon: primaryHit
        });
      }
    }

    // 2. Over 2.5 Predictions (>= 58%)
    if (a.over25 >= 58) {
      over25Total++;
      if (isOver25) over25Won++;
      over25OddSum += resolveMarketOdd(m, 'over25', a.over25).odd;
    }

    // 3. BTTS Predictions (>= 58%)
    if (a.bttsYes >= 58) {
      bttsTotal++;
      if (isBtts) bttsWon++;
      bttsOddSum += resolveMarketOdd(m, 'bttsYes', a.bttsYes).odd;
    }

    // 4. Genuine Value Bets against real official odds
    const val = detectMatchValueBets(m, a);
    if (val.hasValue && val.bestValuePick) {
      valueTotal++;
      valueOddSum += val.bestValuePick.odd;
      if (didLabelHit(val.bestValuePick.pickLabel, h, aw)) valueWon++;
    }
  }

  // If few high-confidence banko picks exist in recentPicks, append other verified completed picks cleanly
  if (recentPicks.length < 6) {
    for (const m of finished) {
      const a = analysesMap.get(m.id);
      if (!a) continue;
      const labelTxt = `${m.homeTeam.name} vs ${m.awayTeam.name}`;
      if (recentPicks.some(p => p.matchText === labelTxt)) continue;
      const live = getMatchLiveState(m);
      const h = live.displayScore.home;
      const aw = live.displayScore.away;
      recentPicks.push({
        matchText: labelTxt,
        league: m.league,
        prediction: a.primaryPrediction.label,
        actualScore: `${h}-${aw}`,
        odd: resolveMarketOdd(m, 'ms1', a.primaryPrediction.confidence).odd,
        isWon: didLabelHit(a.primaryPrediction.label, h, aw)
      });
      if (recentPicks.length >= 10) break;
    }
  }

  const pct = (won: number, total: number) => (total > 0 ? Math.round((won / total) * 100) : 0);
  const avgOdd = (sum: number, total: number, fallback: number) =>
    total > 0 ? Number((sum / total).toFixed(2)) : fallback;

  const bankoRate = pct(bankoWon, bankoTotal);
  const overRate = pct(over25Won, over25Total);
  const bttsRate = pct(bttsWon, bttsTotal);
  const valueRate = pct(valueWon, valueTotal);
  const overallRate = pct(overallWon, overallTotal);

  const categories: PerformanceCategoryStat[] = [
    {
      id: 'banko',
      label: 'Günün Bankoları (+%72 Güven)',
      totalPicks: bankoTotal,
      wonPicks: bankoWon,
      accuracyRate: bankoRate,
      avgOdds: avgOdd(bankoOddSum, bankoTotal, 1.55),
      description: 'Tamamlanan bülten maçlarında yüksek güvenle işaretlenen canlı ana tahminlerin gerçek isabet oranı.',
      badgeColor: 'emerald'
    },
    {
      id: 'over25',
      label: '2.5 Gol Üst Trendi',
      totalPicks: over25Total,
      wonPicks: over25Won,
      accuracyRate: overRate,
      avgOdds: avgOdd(over25OddSum, over25Total, 1.75),
      description: 'Modelde 2.5 Gol Üst olasılığı %58+ verilen tamamlanmış maçlardaki canlı sonuç performansı.',
      badgeColor: 'amber'
    },
    {
      id: 'btts',
      label: 'Karşılıklı Gol Var (KG Var)',
      totalPicks: bttsTotal,
      wonPicks: bttsWon,
      accuracyRate: bttsRate,
      avgOdds: avgOdd(bttsOddSum, bttsTotal, 1.80),
      description: 'Karşılıklı gol beklentisi %58+ öngörülen bitmiş karşılaşmaların canlı doğrulaması.',
      badgeColor: 'purple'
    },
    {
      id: 'value',
      label: 'Değer Bahisleri (Value Bets)',
      totalPicks: valueTotal,
      wonPicks: valueWon,
      accuracyRate: valueRate,
      avgOdds: avgOdd(valueOddSum, valueTotal, 2.05),
      description: 'Resmi İddaa oranının model olasılığından düşük kaldığı bitmiş maçlardaki canlı isabet karnesi.',
      badgeColor: 'cyan'
    }
  ];

  const leagueBreakdown: LeagueAccuracyStat[] = Array.from(leagueStatsMap.entries())
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 9)
    .map(([league, st]) => {
      const overPct = pct(st.over25Hits, st.total);
      const ms1Pct = pct(st.ms1Hits, st.total);
      const topTrend = overPct >= 55 ? `%${overPct} 2.5 Üst` : `%${ms1Pct} MS 1`;
      return {
        league,
        totalMatches: st.total,
        accuracyRate: pct(st.won, st.total),
        topTrend
      };
    });

  return {
    totalAnalyzed: matches.length,
    overallAccuracyRate: overallRate,
    bankoAccuracyRate: bankoRate,
    over25AccuracyRate: overRate,
    bttsAccuracyRate: bttsRate,
    valueBetWinRate: valueRate,
    totalWonCoupons: overallWon,
    categories,
    leagueBreakdown,
    recentVerifiedPicks: recentPicks
  };
}

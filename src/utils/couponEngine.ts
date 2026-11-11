// src/utils/couponEngine.ts
// Intelligent daily coupon generation and live outcome tracking engine for ProAnaliz AI

import { Match, MatchAnalysis } from '../types';
import { getMatchIddaaCode } from './iddaaHelper';
import { formatDynamicMatchTime, isMatchOnDateFilter } from './dateHelper';
import { getMatchLiveState } from './liveMatchHelper';
import { resolveMarketOdd } from './oddsHelper';

export type PickStatus = 'upcoming' | 'live' | 'won' | 'lost';
export type CouponStatus = 'won' | 'lost' | 'pending';
export type CouponDayFilter = 'today' | 'yesterday' | 'all';

export interface CouponMatchItem {
  id: string;
  matchId: string;
  match: Match;
  homeTeamName: string;
  awayTeamName: string;
  league: string;
  iddaaCode: string;
  matchTimeText: string;
  pickLabel: string;
  pickType: 'ms1' | 'ms2' | 'msX' | 'over15' | 'under15' | 'over25' | 'under25' | 'over35' | 'under35' | 'btts' | 'htft';
  odd: number;
  confidence: number;
  reasoning: string;
  // Dynamic Live / Finished Outcome
  matchStatus: 'upcoming' | 'live' | 'finished';
  pickStatus: PickStatus;
  currentScore: { home: number; away: number };
  liveMinute?: string;
}

export interface CuratedCoupon {
  id: 'banko' | 'ideal' | 'surpriz';
  title: string;
  shortTitle: string;
  badge: string;
  riskRating: 'Düşük Risk' | 'Dengeli Değer' | 'Yüksek Oran';
  description: string;
  accentColor: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
  glowColor: string;
  items: CouponMatchItem[];
  totalOdds: number;
  avgConfidence: number;
  // Outcome state
  status: CouponStatus;
  wonCount: number;
  lostCount: number;
  liveCount: number;
  upcomingCount: number;
  totalCount: number;
}

/**
 * Evaluates whether a specific betting pick won, lost, is live, or upcoming.
 */
export function evaluatePickStatus(
  pickType: CouponMatchItem['pickType'],
  match: Match,
  now?: Date
): {
  matchStatus: 'upcoming' | 'live' | 'finished';
  pickStatus: PickStatus;
  score: { home: number; away: number; htHome?: number; htAway?: number };
  liveMinute?: string;
} {
  const liveState = getMatchLiveState(match, now);
  const { isLive, isFinished, isUpcoming, displayScore, liveMinute } = liveState;
  const home = displayScore.home;
  const away = displayScore.away;
  const totalGoals = home + away;

  let matchStatus: 'upcoming' | 'live' | 'finished' = 'upcoming';
  if (isFinished) {
    matchStatus = 'finished';
  } else if (isLive) {
    matchStatus = 'live';
  }

  let pickStatus: PickStatus = 'upcoming';

  if (isUpcoming) {
    pickStatus = 'upcoming';
  } else {
    switch (pickType) {
      case 'ms1':
        if (isFinished) {
          pickStatus = home > away ? 'won' : 'lost';
        } else {
          pickStatus = 'live';
        }
        break;

      case 'ms2':
        if (isFinished) {
          pickStatus = away > home ? 'won' : 'lost';
        } else {
          pickStatus = 'live';
        }
        break;

      case 'msX':
        if (isFinished) {
          pickStatus = home === away ? 'won' : 'lost';
        } else {
          pickStatus = 'live';
        }
        break;

      case 'over25':
        // Over 2.5 is guaranteed won once 3 goals are scored even if live!
        if (totalGoals > 2.5) {
          pickStatus = 'won';
        } else if (isFinished) {
          pickStatus = 'lost';
        } else {
          pickStatus = 'live';
        }
        break;

      case 'over15':
        if (totalGoals > 1.5) {
          pickStatus = 'won';
        } else if (isFinished) {
          pickStatus = 'lost';
        } else {
          pickStatus = 'live';
        }
        break;

      case 'under15':
        if (totalGoals >= 2) {
          pickStatus = 'lost';
        } else if (isFinished) {
          pickStatus = 'won';
        } else {
          pickStatus = 'live';
        }
        break;

      case 'over35':
        if (totalGoals > 3.5) {
          pickStatus = 'won';
        } else if (isFinished) {
          pickStatus = 'lost';
        } else {
          pickStatus = 'live';
        }
        break;

      case 'under35':
        if (totalGoals >= 4) {
          pickStatus = 'lost';
        } else if (isFinished) {
          pickStatus = 'won';
        } else {
          pickStatus = 'live';
        }
        break;

      case 'under25':
        if (totalGoals >= 3) {
          pickStatus = 'lost';
        } else if (isFinished) {
          pickStatus = 'won';
        } else {
          pickStatus = 'live';
        }
        break;

      case 'btts': // Karşılıklı Gol Var
        if (home > 0 && away > 0) {
          pickStatus = 'won';
        } else if (isFinished) {
          pickStatus = 'lost';
        } else {
          pickStatus = 'live';
        }
        break;

      case 'htft': // İY 0 / MS 1
        if (isFinished) {
          const htDraw = displayScore.htHome !== undefined && displayScore.htHome === displayScore.htAway;
          const ftHomeWin = home > away;
          pickStatus = htDraw && ftHomeWin ? 'won' : 'lost';
        } else {
          pickStatus = 'live';
        }
        break;

      default:
        pickStatus = isFinished ? (home > away ? 'won' : 'lost') : 'live';
    }
  }

  return {
    matchStatus,
    pickStatus,
    score: displayScore,
    liveMinute
  };
}

interface DynamicPickCandidate {
  match: Match;
  pickLabel: string;
  pickType: CouponMatchItem['pickType'];
  odd: number;
  confidence: number;
  reasoning: string;
  scoreRank: number;
}

function resolveBestCandidateForTier(
  match: Match,
  analysis: MatchAnalysis,
  tier: 'banko' | 'ideal' | 'surpriz'
): DynamicPickCandidate | null {
  const candidates: Array<{
    pickType: CouponMatchItem['pickType'];
    oddKey: string;
    pickLabel: string;
    prob: number;
    reasoning: string;
  }> = [
    {
      pickType: 'ms1',
      oddKey: 'ms1',
      pickLabel: `MS 1 (${match.homeTeam.shortName || match.homeTeam.name})`,
      prob: analysis.ms1,
      reasoning: `${match.homeTeam.name} saha ve xG avantajıyla (%${analysis.ms1}) maçın favorisi.`
    },
    {
      pickType: 'ms2',
      oddKey: 'ms2',
      pickLabel: `MS 2 (${match.awayTeam.shortName || match.awayTeam.name})`,
      prob: analysis.ms2,
      reasoning: `${match.awayTeam.name} deplasman formu ve hücum verimliliğiyle (%${analysis.ms2}) öne çıkıyor.`
    },
    {
      pickType: 'msX',
      oddKey: 'msX',
      pickLabel: 'MS X (Beraberlik)',
      prob: analysis.msX,
      reasoning: `İki takımın güç dengesi ve düşük fark beklentisi beraberliği (%${analysis.msX}) öne çıkarıyor.`
    },
    {
      pickType: 'over25',
      oddKey: 'over25',
      pickLabel: '2.5 Gol Üst',
      prob: analysis.over25,
      reasoning: `Beklenen toplam gol (${analysis.expectedTotalGoals} xG) yüksek; tempolu ve gollü maç beklentisi.`
    },
    {
      pickType: 'under25',
      oddKey: 'under25',
      pickLabel: '2.5 Gol Alt',
      prob: analysis.under25,
      reasoning: `Savunma kurguları ve kontrollü tempo nedeniyle 2.5 Alt (%${analysis.under25}) güvenli görünüyor.`
    },
    {
      pickType: 'btts',
      oddKey: 'bttsYes',
      pickLabel: 'KG Var (Karşılıklı Gol)',
      prob: analysis.bttsYes,
      reasoning: `Her iki takımın da gol bulma potansiyeli (%${analysis.bttsYes}) yüksek.`
    },
    {
      pickType: 'over15',
      oddKey: 'over15',
      pickLabel: '1.5 Gol Üst',
      prob: analysis.over15,
      reasoning: `Maçta en az 2 gol çıkma olasılığı (%${analysis.over15}) kasa güvenliği sağlıyor.`
    }
  ];

  const enriched = candidates.map(c => {
    const resolved = resolveMarketOdd(match, c.oddKey, c.prob);
    return { ...c, odd: resolved.odd, isOfficial: resolved.isOfficial };
  });

  if (tier === 'banko') {
    const bankoMatches = enriched
      .filter(c => c.prob >= 64 && c.odd >= 1.15 && c.odd <= 1.85)
      .sort((a, b) => (b.prob + (b.isOfficial ? 4 : 0)) - (a.prob + (a.isOfficial ? 4 : 0)));
    const pick = bankoMatches[0] || enriched.sort((a, b) => b.prob - a.prob)[0];
    if (!pick) return null;
    return {
      match,
      pickLabel: pick.pickLabel,
      pickType: pick.pickType,
      odd: pick.odd,
      confidence: pick.prob,
      reasoning: pick.reasoning,
      scoreRank: pick.prob + (pick.isOfficial ? 5 : 0)
    };
  }

  if (tier === 'ideal') {
    const idealMatches = enriched
      .filter(c => c.prob >= 52 && c.odd >= 1.48 && c.odd <= 2.35)
      .sort((a, b) => (b.prob * 1.1 + b.odd * 10 + (b.isOfficial ? 5 : 0)) - (a.prob * 1.1 + a.odd * 10 + (a.isOfficial ? 5 : 0)));
    const pick = idealMatches[0] || enriched.sort((a, b) => Math.abs(b.odd - 1.80) * -1 - Math.abs(a.odd - 1.80) * -1)[0];
    if (!pick) return null;
    return {
      match,
      pickLabel: pick.pickLabel,
      pickType: pick.pickType,
      odd: pick.odd,
      confidence: pick.prob,
      reasoning: pick.reasoning,
      scoreRank: pick.prob + pick.odd * 8 + (pick.isOfficial ? 5 : 0)
    };
  }

  // surpriz: High odd value picks (>= 2.30 odd with solid chance)
  const surprizMatches = enriched
    .filter(c => c.odd >= 2.30 && c.prob >= 28)
    .sort((a, b) => (b.prob * b.odd) - (a.prob * a.odd));
  const pick = surprizMatches[0] || enriched.sort((a, b) => b.odd - a.odd)[0];
  if (!pick) return null;
  return {
    match,
    pickLabel: pick.pickLabel,
    pickType: pick.pickType,
    odd: pick.odd,
    confidence: pick.prob,
    reasoning: pick.reasoning,
    scoreRank: pick.prob * pick.odd + (pick.isOfficial ? 10 : 0)
  };
}

function finalizeCoupon(
  id: CuratedCoupon['id'],
  title: string,
  shortTitle: string,
  badge: string,
  riskRating: CuratedCoupon['riskRating'],
  description: string,
  accentColor: string,
  borderColor: string,
  badgeBg: string,
  badgeText: string,
  glowColor: string,
  prefix: string,
  rawPicks: DynamicPickCandidate[],
  now: Date
): CuratedCoupon {
  const items: CouponMatchItem[] = rawPicks.map((raw, idx) => {
    const outcome = evaluatePickStatus(raw.pickType, raw.match, now);
    return {
      id: `${prefix}_${idx + 1}`,
      matchId: raw.match.id,
      match: raw.match,
      homeTeamName: raw.match.homeTeam.name,
      awayTeamName: raw.match.awayTeam.name,
      league: raw.match.league,
      iddaaCode: raw.match.iddaaCode || getMatchIddaaCode(raw.match),
      matchTimeText: formatDynamicMatchTime(raw.match, now),
      pickLabel: raw.pickLabel,
      pickType: raw.pickType,
      odd: raw.odd,
      confidence: raw.confidence,
      reasoning: raw.reasoning,
      matchStatus: outcome.matchStatus,
      pickStatus: outcome.pickStatus,
      currentScore: { home: outcome.score.home, away: outcome.score.away },
      liveMinute: outcome.liveMinute
    };
  });

  const totalOdds = Number(items.reduce((acc, item) => acc * item.odd, 1).toFixed(2));
  const avgConfidence = Math.round(items.reduce((acc, item) => acc + item.confidence, 0) / (items.length || 1));
  const wonCount = items.filter(p => p.pickStatus === 'won').length;
  const lostCount = items.filter(p => p.pickStatus === 'lost').length;
  const liveCount = items.filter(p => p.pickStatus === 'live').length;
  const upcomingCount = items.filter(p => p.pickStatus === 'upcoming').length;

  let status: CouponStatus = 'pending';
  if (lostCount > 0) status = 'lost';
  else if (wonCount === items.length && items.length > 0) status = 'won';

  return {
    id,
    title,
    shortTitle,
    badge,
    riskRating,
    description,
    accentColor,
    borderColor,
    badgeBg,
    badgeText,
    glowColor,
    items,
    totalOdds,
    avgConfidence,
    status,
    wonCount,
    lostCount,
    liveCount,
    upcomingCount,
    totalCount: items.length
  };
}

/**
 * Curates 3 live AI coupons dynamically from active bulletin matches + Poisson analyses + official İddaa odds.
 */
export function generateCuratedCoupons(
  allMatches: Match[],
  analysesMap: Map<string, MatchAnalysis>,
  now: Date = new Date(),
  selectedDay: CouponDayFilter = 'today'
): CuratedCoupon[] {
  let poolMatches = allMatches.filter(m => isMatchOnDateFilter(m, selectedDay, now));
  if (poolMatches.length < 9) {
    poolMatches = allMatches;
  }

  // Prefer upcoming/live matches when viewing 'today' or 'all' so daily coupons are playable
  const playablePool = selectedDay === 'yesterday'
    ? poolMatches
    : poolMatches.filter(m => {
        const st = getMatchLiveState(m, now);
        return st.isUpcoming || st.isLive;
      });
  const candidatePool = playablePool.length >= 9 ? playablePool : poolMatches;

  const usedMatchIds = new Set<string>();
  const pickTierMatches = (tier: 'banko' | 'ideal' | 'surpriz', count: number): DynamicPickCandidate[] => {
    const scored: DynamicPickCandidate[] = [];
    for (const m of candidatePool) {
      if (usedMatchIds.has(m.id)) continue;
      const a = analysesMap.get(m.id);
      if (!a) continue;
      const cand = resolveBestCandidateForTier(m, a, tier);
      if (cand) scored.push(cand);
    }
    scored.sort((a, b) => b.scoreRank - a.scoreRank);
    const chosen = scored.slice(0, count);
    chosen.forEach(c => usedMatchIds.add(c.match.id));
    return chosen;
  };

  const bankoRaw = pickTierMatches('banko', 3);
  const idealRaw = pickTierMatches('ideal', 3);
  const surprizRaw = pickTierMatches('surpriz', 3);

  const dayTitleSuffix = selectedDay === 'today' ? ' (Bugün)' : selectedDay === 'yesterday' ? ' (Dün)' : '';

  return [
    finalizeCoupon(
      'banko',
      `Günün Banko Kuponu${dayTitleSuffix}`,
      `Banko Kupon${dayTitleSuffix}`,
      'YÜKSEK GÜVEN',
      'Düşük Risk',
      'Canlı bültende Poisson & form modeline göre kazanma olasılığı en yüksek seçimler.',
      'text-emerald-400',
      'border-emerald-500/40 hover:border-emerald-400',
      'bg-emerald-500/15 border border-emerald-500/40',
      'text-emerald-300',
      'shadow-emerald-950/40',
      'b',
      bankoRaw,
      now
    ),
    finalizeCoupon(
      'ideal',
      `Günün İdeal Kuponu${dayTitleSuffix}`,
      `İdeal Kupon${dayTitleSuffix}`,
      'DENGELİ DEĞER',
      'Dengeli Değer',
      'Canlı oran/olasılık dengesinde gol ve taraf bahislerinden derlenen günlük ideal kupon.',
      'text-amber-400',
      'border-amber-500/40 hover:border-amber-400',
      'bg-amber-500/15 border border-amber-500/40',
      'text-amber-300',
      'shadow-amber-950/40',
      'i',
      idealRaw,
      now
    ),
    finalizeCoupon(
      'surpriz',
      `Günün Sürpriz Kuponu${dayTitleSuffix}`,
      `Sürpriz Kupon${dayTitleSuffix}`,
      'YÜKSEK ORAN',
      'Yüksek Oran',
      'Resmi yüksek oranlarda beklenen değeri öne çıkan sürpriz ve beraberlik tercihleri.',
      'text-purple-400',
      'border-purple-500/40 hover:border-purple-400',
      'bg-purple-500/15 border border-purple-500/40',
      'text-purple-300',
      'shadow-purple-950/40',
      's',
      surprizRaw,
      now
    )
  ];
}

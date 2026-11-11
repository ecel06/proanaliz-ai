// src/utils/valueBetHelper.ts
// Mathematical Value Bet (Değer Bahsi) Detector comparing Poisson probabilities against live official İddaa odds.

import { Match, MatchAnalysis } from '../types';
import { resolveMarketOdd } from './oddsHelper';

export interface ValueBetPick {
  marketKey: string;
  pickKey: string;
  pickLabel: string;
  marketName: string;
  odd: number;
  modelProb: number;       // Poisson model probability (%)
  impliedProb: number;     // Bookmaker implied probability (%)
  edgePercent: number;     // Value edge (%)
  reason: string;
}

export interface MatchValueSummary {
  hasValue: boolean;
  bestValuePick?: ValueBetPick;
  allValuePicks: ValueBetPick[];
}

/**
 * Calculates bookmaker implied probability from decimal odd.
 */
export function getImpliedProbability(odd: number): number {
  if (!odd || odd <= 1.0) return 99;
  return Math.round((1 / odd) * 100);
}

interface ValueMarketSpec {
  marketKey: string;
  pickKey: string;
  marketName: string;
  minProb: number;
  getLabel: (m: Match) => string;
  getProb: (a: MatchAnalysis) => number;
  buildReason: (edge: number, a: MatchAnalysis) => string;
}

const VALUE_MARKET_SPECS: ValueMarketSpec[] = [
  {
    marketKey: 'match_result',
    pickKey: 'ms1',
    marketName: 'Maç Sonucu',
    minProb: 36,
    getLabel: (m) => `MS 1 (${m.homeTeam.shortName || m.homeTeam.name})`,
    getProb: (a) => a.ms1,
    buildReason: (edge) => `İddaa oranı modelin Ev Sahibi galibiyet ihtimalinin +%${edge} altında fiyatlanmış.`
  },
  {
    marketKey: 'match_result',
    pickKey: 'msX',
    marketName: 'Maç Sonucu',
    minProb: 28,
    getLabel: () => 'MS X (Beraberlik)',
    getProb: (a) => a.msX,
    buildReason: (edge) => `Beraberlik ihtimali piyasa beklentisinden +%${edge} daha yüksek (Değer Oran).`
  },
  {
    marketKey: 'match_result',
    pickKey: 'ms2',
    marketName: 'Maç Sonucu',
    minProb: 36,
    getLabel: (m) => `MS 2 (${m.awayTeam.shortName || m.awayTeam.name})`,
    getProb: (a) => a.ms2,
    buildReason: (edge) => `Deplasman ekibinin form ve xG gücü piyasa oranına göre +%${edge} değer barındırıyor.`
  },
  {
    marketKey: 'goals_25',
    pickKey: 'over25',
    marketName: '2.5 Gol',
    minProb: 48,
    getLabel: () => '2.5 Gol Üst',
    getProb: (a) => a.over25,
    buildReason: (edge, a) => `Beklenen gol (${a.expectedTotalGoals} xG) yüksek; 2.5 Üst oranı +%${edge} pozitif değer sunuyor.`
  },
  {
    marketKey: 'goals_25',
    pickKey: 'under25',
    marketName: '2.5 Gol',
    minProb: 48,
    getLabel: () => '2.5 Gol Alt',
    getProb: (a) => a.under25,
    buildReason: (edge) => `Savunma dengesi düşük skor öngörüyor; 2.5 Alt oranı piyasadan +%${edge} avantajlı.`
  },
  {
    marketKey: 'btts',
    pickKey: 'bttsYes',
    marketName: 'Karşılıklı Gol',
    minProb: 50,
    getLabel: () => 'KG Var',
    getProb: (a) => a.bttsYes,
    buildReason: (edge) => `İki ekibin skor üretkenliği İddaa KG Var oranına göre +%${edge} daha yüksek.`
  },
  {
    marketKey: 'btts',
    pickKey: 'bttsNo',
    marketName: 'Karşılıklı Gol',
    minProb: 50,
    getLabel: () => 'KG Yok',
    getProb: (a) => a.bttsNo,
    buildReason: (edge) => `Takımlardan en az birinin gol bulamama ihtimali piyasa fiyatlamasından +%${edge} üstün.`
  }
];

/**
 * Detects genuine Value Bets strictly when live official İddaa odds are attached to the match
 * and model probability exceeds bookmaker implied probability by >= 5%.
 */
export function detectMatchValueBets(match: Match, analysis: MatchAnalysis): MatchValueSummary {
  const valuePicks: ValueBetPick[] = [];

  for (const spec of VALUE_MARKET_SPECS) {
    const modelProb = spec.getProb(analysis);
    if (!modelProb || modelProb < spec.minProb) continue;

    const resolved = resolveMarketOdd(match, spec.pickKey, modelProb);
    if (!resolved.isOfficial) continue;

    const impliedProb = getImpliedProbability(resolved.odd);
    const edgePercent = modelProb - impliedProb;

    if (edgePercent >= 5) {
      valuePicks.push({
        marketKey: spec.marketKey,
        pickKey: spec.pickKey,
        pickLabel: spec.getLabel(match),
        marketName: spec.marketName,
        odd: resolved.odd,
        modelProb,
        impliedProb,
        edgePercent,
        reason: spec.buildReason(edgePercent, analysis)
      });
    }
  }

  valuePicks.sort((a, b) => b.edgePercent - a.edgePercent);

  return {
    hasValue: valuePicks.length > 0,
    bestValuePick: valuePicks[0],
    allValuePicks: valuePicks
  };
}

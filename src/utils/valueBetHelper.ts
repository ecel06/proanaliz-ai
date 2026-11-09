// src/utils/valueBetHelper.ts
// Mathematical Value Bet (Değer Bahsi) Detector based on Poisson vs Bookmaker Implied Odds

import { Match, MatchAnalysis } from '../types';
import { calcMarketOdd } from './oddsHelper';

export interface ValueBetPick {
  marketKey: string;
  pickKey: string;
  pickLabel: string;
  marketName: string;
  odd: number;
  modelProb: number;       // Our Poisson model probability (e.g. 58%)
  impliedProb: number;     // Bookmaker implied probability (e.g. 45%)
  edgePercent: number;     // Value edge percentage (e.g. +13%)
  reason: string;
}

export interface MatchValueSummary {
  hasValue: boolean;
  bestValuePick?: ValueBetPick;
  allValuePicks: ValueBetPick[];
}

/**
 * Calculates bookmaker implied probability from decimal odd
 */
export function getImpliedProbability(odd: number): number {
  if (!odd || odd <= 1.0) return 99;
  return Math.round((1 / odd) * 100);
}

/**
 * Detects Value Bets across all major markets for a match
 * A value bet occurs when our Poisson model gives a significantly higher probability
 * than what the bookmaker odd implies (Edge >= 8% with model prob >= 38%)
 */
export function detectMatchValueBets(match: Match, analysis: MatchAnalysis): MatchValueSummary {
  const valuePicks: ValueBetPick[] = [];

  // Markets to evaluate:
  // 1. MS 1
  const ms1Odd = calcMarketOdd(analysis.ms1);
  const ms1Implied = getImpliedProbability(ms1Odd);
  const ms1Edge = analysis.ms1 - ms1Implied;
  if (ms1Edge >= 8 && analysis.ms1 >= 40) {
    valuePicks.push({
      marketKey: 'match_result',
      pickKey: 'ms1',
      pickLabel: `MS 1 (${match.homeTeam.shortName || match.homeTeam.name})`,
      marketName: 'Maç Sonucu',
      odd: ms1Odd,
      modelProb: analysis.ms1,
      impliedProb: ms1Implied,
      edgePercent: ms1Edge,
      reason: `Ev sahibi formu ve xG üstünlüğü piyasanın beklentisinden +%${ms1Edge} daha güçlü.`
    });
  }

  // 2. MS 2
  const ms2Odd = calcMarketOdd(analysis.ms2);
  const ms2Implied = getImpliedProbability(ms2Odd);
  const ms2Edge = analysis.ms2 - ms2Implied;
  if (ms2Edge >= 8 && analysis.ms2 >= 38) {
    valuePicks.push({
      marketKey: 'match_result',
      pickKey: 'ms2',
      pickLabel: `MS 2 (${match.awayTeam.shortName || match.awayTeam.name})`,
      marketName: 'Maç Sonucu',
      odd: ms2Odd,
      modelProb: analysis.ms2,
      impliedProb: ms2Implied,
      edgePercent: ms2Edge,
      reason: `Deplasman ekibinin form grafiği piyasa oranına göre +%${ms2Edge} değer barındırıyor.`
    });
  }

  // 3. 2.5 Gol Üst
  const over25Odd = calcMarketOdd(analysis.over25);
  const over25Implied = getImpliedProbability(over25Odd);
  const over25Edge = analysis.over25 - over25Implied;
  if (over25Edge >= 8 && analysis.over25 >= 50) {
    valuePicks.push({
      marketKey: 'goals_25',
      pickKey: 'over25',
      pickLabel: '2.5 Gol Üst',
      marketName: '2.5 Gol',
      odd: over25Odd,
      modelProb: analysis.over25,
      impliedProb: over25Implied,
      edgePercent: over25Edge,
      reason: `Beklenen gol sayısı (${analysis.expectedTotalGoals} xG) bol gole işaret ediyor; oran değerli (+%${over25Edge}).`
    });
  }

  // 4. 2.5 Gol Alt
  const under25Odd = calcMarketOdd(analysis.under25);
  const under25Implied = getImpliedProbability(under25Odd);
  const under25Edge = analysis.under25 - under25Implied;
  if (under25Edge >= 8 && analysis.under25 >= 50) {
    valuePicks.push({
      marketKey: 'goals_25',
      pickKey: 'under25',
      pickLabel: '2.5 Gol Alt',
      marketName: '2.5 Gol',
      odd: under25Odd,
      modelProb: analysis.under25,
      impliedProb: under25Implied,
      edgePercent: under25Edge,
      reason: `İki ekibin savunma kurgusu kısır maçı destekliyor; piyasa oranından +%${under25Edge} avantajlı.`
    });
  }

  // 5. KG Var
  const bttsYesOdd = calcMarketOdd(analysis.bttsYes);
  const bttsYesImplied = getImpliedProbability(bttsYesOdd);
  const bttsYesEdge = analysis.bttsYes - bttsYesImplied;
  if (bttsYesEdge >= 8 && analysis.bttsYes >= 52) {
    valuePicks.push({
      marketKey: 'btts',
      pickKey: 'bttsYes',
      pickLabel: 'KG Var',
      marketName: 'Karşılıklı Gol',
      odd: bttsYesOdd,
      modelProb: analysis.bttsYes,
      impliedProb: bttsYesImplied,
      edgePercent: bttsYesEdge,
      reason: `Karşılıklı gol ihtimali piyasa açılışının +%${bttsYesEdge} üzerinde seyrediyor.`
    });
  }

  // Sort picks by edge percentage descending
  valuePicks.sort((a, b) => b.edgePercent - a.edgePercent);

  return {
    hasValue: valuePicks.length > 0,
    bestValuePick: valuePicks[0] || undefined,
    allValuePicks: valuePicks
  };
}


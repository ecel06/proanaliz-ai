// src/utils/monteCarloHelper.ts
// Monte Carlo Simulation Engine & Coupon Risk Index for ProAnaliz AI

import { UserBetslipItem } from '../types';

export interface MonteCarloSimulationResult {
  simulationsCount: number;
  simulatedSuccessRate: number;      // e.g. 54.2 (%)
  combinedTheoreticalProb: number;   // e.g. 52.8 (%)
  riskTier: 'safe' | 'balanced' | 'risky' | 'high_reward';
  riskLabel: string;
  riskColor: string;
  safestItem?: { label: string; prob: number; matchTeams: string };
  riskiestItem?: { label: string; prob: number; matchTeams: string };
  aiAdvice: string;
}

/**
 * Runs 5,000 Monte Carlo simulation runs on user betslip items
 */
export function simulateBetslipMonteCarlo(
  items: UserBetslipItem[],
  numRuns: number = 5000
): MonteCarloSimulationResult | null {
  if (!items || items.length === 0) return null;

  // Extract individual probabilities (converted to 0.0 - 1.0)
  const pickProbs = items.map((it) => {
    let p = it.probability;
    if (!p || p <= 0) {
      // Fallback from odd if probability not directly present
      p = it.odd > 1.0 ? Math.round((1 / it.odd) * 0.93 * 100) : 50;
    }
    return Math.max(0.1, Math.min(0.95, p / 100));
  });

  // 1. Exact theoretical combined probability
  const theoreticalCombined = pickProbs.reduce((acc, p) => acc * p, 1.0);
  const combinedTheoreticalProb = Number((theoreticalCombined * 100).toFixed(1));

  // 2. Monte Carlo Stochastic Simulation
  let successRuns = 0;
  for (let run = 0; run < numRuns; run++) {
    let couponWon = true;
    for (let i = 0; i < pickProbs.length; i++) {
      if (Math.random() > pickProbs[i]) {
        couponWon = false;
        break; // One lost match fails the acca coupon
      }
    }
    if (couponWon) successRuns++;
  }

  const simulatedSuccessRate = Number(((successRuns / numRuns) * 100).toFixed(1));

  // 3. Find safest and riskiest pick
  let minProb = 1.0;
  let maxProb = 0.0;
  let riskiestIdx = 0;
  let safestIdx = 0;

  items.forEach((it, idx) => {
    const prob = pickProbs[idx];
    if (prob < minProb) {
      minProb = prob;
      riskiestIdx = idx;
    }
    if (prob > maxProb) {
      maxProb = prob;
      safestIdx = idx;
    }
  });

  const riskiestItem = {
    label: items[riskiestIdx].pickLabel,
    prob: Math.round(minProb * 100),
    matchTeams: `${items[riskiestIdx].match.homeTeam.name} - ${items[riskiestIdx].match.awayTeam.name}`
  };

  const safestItem = {
    label: items[safestIdx].pickLabel,
    prob: Math.round(maxProb * 100),
    matchTeams: `${items[safestIdx].match.homeTeam.name} - ${items[safestIdx].match.awayTeam.name}`
  };

  // 4. Determine risk tier and advice
  let riskTier: 'safe' | 'balanced' | 'risky' | 'high_reward' = 'balanced';
  let riskLabel = 'Dengeli Kupon';
  let riskColor = 'text-emerald-400 bg-emerald-500/15 border-emerald-500/40';
  let aiAdvice = '';

  if (combinedTheoreticalProb >= 50) {
    riskTier = 'safe';
    riskLabel = 'Yüksek Güven / Kasa Kuponu';
    riskColor = 'text-emerald-400 bg-emerald-500/20 border-emerald-500/50';
    aiAdvice = `Matematiksel tutma ihtimali çok güçlü (%${combinedTheoreticalProb}). Ana kasa yönetimi için ideal bir kombinasyon.`;
  } else if (combinedTheoreticalProb >= 25) {
    riskTier = 'balanced';
    riskLabel = 'Dengeli / Standart Kupon';
    riskColor = 'text-amber-400 bg-amber-500/15 border-amber-500/40';
    aiAdvice = `Risk ve getiri dengeli (%${combinedTheoreticalProb} ihtimal). En zayıf halka: ${riskiestItem.matchTeams} (${riskiestItem.label} %${riskiestItem.prob}).`;
  } else if (combinedTheoreticalProb >= 10) {
    riskTier = 'risky';
    riskLabel = 'Yüksek Oranlı / Riskli Kupon';
    riskColor = 'text-purple-400 bg-purple-500/15 border-purple-500/40';
    aiAdvice = `Oran tatmin edici ancak başarı ihtimali %${combinedTheoreticalProb}. Düşük misli ile denenmesi önerilir.`;
  } else {
    riskTier = 'high_reward';
    riskLabel = 'Sürpriz / Jackpot Kuponu';
    riskColor = 'text-rose-400 bg-rose-500/20 border-rose-500/50';
    aiAdvice = `Çok yüksek oranlı sürpriz kupon (%${combinedTheoreticalProb} simülasyon başarısı). Eğlencelik küçük meblağlarla oynanabilir.`;
  }

  return {
    simulationsCount: numRuns,
    simulatedSuccessRate,
    combinedTheoreticalProb,
    riskTier,
    riskLabel,
    riskColor,
    safestItem,
    riskiestItem,
    aiAdvice
  };
}

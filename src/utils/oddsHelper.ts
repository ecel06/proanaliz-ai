// src/utils/oddsHelper.ts
// Generates comprehensive betting markets and odds for any match based on Poisson probabilities

import { Match, MatchAnalysis } from '../types';

export interface BettingPickOption {
  key: string;            // e.g. 'ms1', 'over25', 'htft_1_1'
  label: string;          // e.g. 'MS 1', '2.5 Üst', 'İY 1 / MS 1'
  marketKey: string;      // e.g. 'match_result', 'goals_25'
  marketName: string;     // e.g. 'Maç Sonucu', '2.5 Gol Alt/Üst'
  odd: number;            // e.g. 1.82
  probability: number;    // e.g. 55 (%)
  isOfficial?: boolean;   // true when odd comes directly from official İddaa/Nesine bulletin
  recommendationBadge?: string; // e.g. 'Banko', 'Kasa', 'Değer'
}

export interface BettingMarketGroup {
  id: string;
  name: string;
  description?: string;
  options: BettingPickOption[];
}

/**
 * Calculates bookmaker-style odd from probability with ~7% standard vig
 */
export function calcMarketOdd(prob: number, vig: number = 0.93): number {
  if (!prob || prob <= 0) return 9.50;
  const p = Math.max(5, Math.min(95, prob)) / 100;
  const raw = Number((1 / p * vig).toFixed(2));
  return Math.max(1.12, raw);
}

/**
 * Returns official İddaa/Nesine odd when available on match.odds; otherwise falls back to Poisson odd.
 */
export function resolveMarketOdd(
  match: Match | undefined,
  pickKey: string,
  fallbackProb: number,
  vig: number = 0.93
): { odd: number; isOfficial: boolean } {
  const odds = match?.odds;
  if (odds) {
    let raw: number | undefined;
    if (pickKey === 'msX' || pickKey === 'ms0') {
      raw = odds.msX ?? odds.ms0;
    } else if (pickKey.startsWith('htft_')) {
      const code = pickKey.slice(5).replace(/_/g, '/');
      raw = odds.htft?.[code];
    } else {
      raw = (odds as Record<string, any>)[pickKey];
    }

    if (typeof raw === 'number' && Number.isFinite(raw) && raw > 1.01) {
      return { odd: Number(raw.toFixed(2)), isOfficial: true };
    }
  }

  return { odd: calcMarketOdd(fallbackProb, vig), isOfficial: false };
}

/**
 * Builds all betting markets and odds for a match (preferring live official İddaa odds)
 */
export function getMatchBettingMarkets(match: Match, analysis: MatchAnalysis): BettingMarketGroup[] {
  const groups: BettingMarketGroup[] = [];

  const optWithOdd = (
    key: string,
    label: string,
    marketKey: string,
    marketName: string,
    probability: number,
    vig: number = 0.93,
    recommendationBadge?: string
  ): BettingPickOption => {
    const resolved = resolveMarketOdd(match, key, probability, vig);
    return {
      key,
      label,
      marketKey,
      marketName,
      odd: resolved.odd,
      probability,
      isOfficial: resolved.isOfficial,
      recommendationBadge
    };
  };

  // 1. Maç Sonucu (MS 1 - X - 2)
  groups.push({
    id: 'match_result',
    name: 'Maç Sonucu (MS 1 - X - 2)',
    description: '90 dakika normal süre sonundaki galibiyet veya beraberlik',
    options: [
      optWithOdd('ms1', `MS 1 (${match.homeTeam.shortName || 'Ev'})`, 'match_result', 'Maç Sonucu', analysis.ms1, 0.93, analysis.ms1 >= 65 ? 'En Güçlü' : undefined),
      optWithOdd('msX', 'MS X (Beraberlik)', 'match_result', 'Maç Sonucu', analysis.msX, 0.91, analysis.msX >= 35 ? 'Değer' : undefined),
      optWithOdd('ms2', `MS 2 (${match.awayTeam.shortName || 'Dep'})`, 'match_result', 'Maç Sonucu', analysis.ms2, 0.93, analysis.ms2 >= 60 ? 'En Güçlü' : undefined)
    ]
  });

  // 2. 2.5 Gol Alt / Üst
  groups.push({
    id: 'goals_25',
    name: '2.5 Gol Alt / Üst',
    description: 'Karşılaşmada toplamda 3 veya daha fazla gol çıkar mı?',
    options: [
      optWithOdd('under25', '2.5 Gol Alt (En Fazla 2 Gol)', 'goals_25', '2.5 Gol', analysis.under25, 0.93, analysis.under25 >= 60 ? 'Kısır Maç' : undefined),
      optWithOdd('over25', '2.5 Gol Üst (En Az 3 Gol)', 'goals_25', '2.5 Gol', analysis.over25, 0.93, analysis.over25 >= 60 ? 'Bol Gollü' : undefined)
    ]
  });

  // 3. Karşılıklı Gol (KG Var / KG Yok)
  groups.push({
    id: 'btts',
    name: 'Karşılıklı Gol (KG Var / Yok)',
    description: 'Her iki takım da maçta en az birer gol atar mı?',
    options: [
      optWithOdd('bttsYes', 'KG Var (İki Takım da Gol Atar)', 'btts', 'Karşılıklı Gol', analysis.bttsYes, 0.93, analysis.bttsYes >= 62 ? 'Hücum Üretken' : undefined),
      optWithOdd('bttsNo', 'KG Yok (En Az Biri Atamaz)', 'btts', 'Karşılıklı Gol', analysis.bttsNo, 0.93, analysis.bttsNo >= 62 ? 'Kapanan Takım' : undefined)
    ]
  });

  // 4. 3.5 Gol Alt / Üst
  const probOver35 = analysis.over35 || Math.round((analysis.over25 || 55) * 0.65);
  const probUnder35 = analysis.under35 || (100 - probOver35);
  groups.push({
    id: 'goals_35',
    name: '3.5 Gol Alt / Üst',
    description: 'Karşılaşmada 4 veya daha fazla gol çıkar mı?',
    options: [
      optWithOdd('under35', '3.5 Gol Alt (En Fazla 3 Gol)', 'goals_35', '3.5 Gol', probUnder35, 0.93, probUnder35 >= 75 ? 'Güvenli Alt' : undefined),
      optWithOdd('over35', '3.5 Gol Üst (En Az 4 Gol)', 'goals_35', '3.5 Gol', probOver35, 0.93, probOver35 >= 45 ? 'Yüksek Oran' : undefined)
    ]
  });

  // 5. 1.5 Gol Alt / Üst
  const probOver15 = analysis.over15 || Math.min(95, Math.round((analysis.over25 || 55) * 1.35));
  const probUnder15 = analysis.under15 || (100 - probOver15);
  groups.push({
    id: 'goals_15',
    name: '1.5 Gol Alt / Üst',
    description: 'Karşılaşmada en az 2 gol atılır mı?',
    options: [
      optWithOdd('under15', '1.5 Gol Alt (En Fazla 1 Gol)', 'goals_15', '1.5 Gol', probUnder15, 0.93),
      optWithOdd('over15', '1.5 Gol Üst (En Az 2 Gol)', 'goals_15', '1.5 Gol', probOver15, 0.93, probOver15 >= 78 ? 'Kasa Bankosu' : undefined)
    ]
  });

  // 6. Çifte Şans (1-X, 1-2, X-2)
  const p1X = Math.min(94, Math.round(analysis.ms1 + analysis.msX * 0.95));
  const p12 = Math.min(92, Math.round(analysis.ms1 + analysis.ms2 * 0.95));
  const pX2 = Math.min(94, Math.round(analysis.msX * 0.95 + analysis.ms2));
  groups.push({
    id: 'double_chance',
    name: 'Çifte Şans',
    description: 'İki ihtimali birden kapsayan risksiz tercihler',
    options: [
      optWithOdd('dc_1x', `1-X (${match.homeTeam.shortName || 'Ev'} / Beraberlik)`, 'double_chance', 'Çifte Şans', p1X, 0.93),
      optWithOdd('dc_12', `1-2 (${match.homeTeam.shortName || 'Ev'} / ${match.awayTeam.shortName || 'Dep'})`, 'double_chance', 'Çifte Şans', p12, 0.93),
      optWithOdd('dc_x2', `X-2 (Beraberlik / ${match.awayTeam.shortName || 'Dep'})`, 'double_chance', 'Çifte Şans', pX2, 0.93)
    ]
  });

  // 7. İlk Yarı Sonucu (İY 1 - X - 2)
  const htH = Math.min(65, Math.max(15, Math.round(analysis.ms1 * 0.70)));
  const htA = Math.min(60, Math.max(12, Math.round(analysis.ms2 * 0.70)));
  const htX = Math.max(25, 100 - htH - htA);
  groups.push({
    id: 'first_half_result',
    name: 'İlk Yarı Sonucu (İY 1 - X - 2)',
    description: 'İlk 45 dakikanın sonucuna yönelik tahminler',
    options: [
      optWithOdd('ht_1', `İY 1 (${match.homeTeam.shortName || 'Ev'})`, 'first_half_result', 'İlk Yarı', htH, 0.93),
      optWithOdd('ht_X', 'İY X (İlk Yarı Beraberlik)', 'first_half_result', 'İlk Yarı', htX, 0.93, htX >= 48 ? 'Muhtemel' : undefined),
      optWithOdd('ht_2', `İY 2 (${match.awayTeam.shortName || 'Dep'})`, 'first_half_result', 'İlk Yarı', htA, 0.93)
    ]
  });

  // 8. İlk Yarı / Maç Sonucu (İY/MS)
  if (analysis.htFtRanked && analysis.htFtRanked.length > 0) {
    groups.push({
      id: 'ht_ft',
      name: 'İlk Yarı / Maç Sonucu (İY/MS)',
      description: 'İlk devre ve maç sonunun ortak kombinasyonu (Yüksek Oran)',
      options: analysis.htFtRanked.map((item, idx) =>
        optWithOdd(`htft_${item.code}`, item.label, 'ht_ft', 'İY / MS', item.prob, 0.90, idx === 0 ? 'En Muhtemel İY/MS' : undefined)
      )
    });
  }

  return groups;
}


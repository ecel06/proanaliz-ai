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
 * Builds all betting markets and odds for a match
 */
export function getMatchBettingMarkets(match: Match, analysis: MatchAnalysis): BettingMarketGroup[] {
  const groups: BettingMarketGroup[] = [];

  // 1. Maç Sonucu (MS 1 - X - 2)
  groups.push({
    id: 'match_result',
    name: 'Maç Sonucu (MS 1 - X - 2)',
    description: '90 dakika normal süre sonundaki galibiyet veya beraberlik',
    options: [
      {
        key: 'ms1',
        label: `MS 1 (${match.homeTeam.shortName || 'Ev'})`,
        marketKey: 'match_result',
        marketName: 'Maç Sonucu',
        odd: calcMarketOdd(analysis.ms1),
        probability: analysis.ms1,
        recommendationBadge: analysis.ms1 >= 65 ? 'En Güçlü' : undefined
      },
      {
        key: 'msX',
        label: 'MS X (Beraberlik)',
        marketKey: 'match_result',
        marketName: 'Maç Sonucu',
        odd: calcMarketOdd(analysis.msX, 0.91),
        probability: analysis.msX,
        recommendationBadge: analysis.msX >= 35 ? 'Değer' : undefined
      },
      {
        key: 'ms2',
        label: `MS 2 (${match.awayTeam.shortName || 'Dep'})`,
        marketKey: 'match_result',
        marketName: 'Maç Sonucu',
        odd: calcMarketOdd(analysis.ms2),
        probability: analysis.ms2,
        recommendationBadge: analysis.ms2 >= 60 ? 'En Güçlü' : undefined
      }
    ]
  });

  // 2. 2.5 Gol Alt / Üst
  groups.push({
    id: 'goals_25',
    name: '2.5 Gol Alt / Üst',
    description: 'Karşılaşmada toplamda 3 veya daha fazla gol çıkar mı?',
    options: [
      {
        key: 'under25',
        label: '2.5 Gol Alt (En Fazla 2 Gol)',
        marketKey: 'goals_25',
        marketName: '2.5 Gol',
        odd: calcMarketOdd(analysis.under25),
        probability: analysis.under25,
        recommendationBadge: analysis.under25 >= 60 ? 'Kısır Maç' : undefined
      },
      {
        key: 'over25',
        label: '2.5 Gol Üst (En Az 3 Gol)',
        marketKey: 'goals_25',
        marketName: '2.5 Gol',
        odd: calcMarketOdd(analysis.over25),
        probability: analysis.over25,
        recommendationBadge: analysis.over25 >= 60 ? 'Bol Gollü' : undefined
      }
    ]
  });

  // 3. Karşılıklı Gol (KG Var / KG Yok)
  groups.push({
    id: 'btts',
    name: 'Karşılıklı Gol (KG Var / Yok)',
    description: 'Her iki takım da maçta en az birer gol atar mı?',
    options: [
      {
        key: 'bttsYes',
        label: 'KG Var (İki Takım da Gol Atar)',
        marketKey: 'btts',
        marketName: 'Karşılıklı Gol',
        odd: calcMarketOdd(analysis.bttsYes),
        probability: analysis.bttsYes,
        recommendationBadge: analysis.bttsYes >= 62 ? 'Hücum Üretken' : undefined
      },
      {
        key: 'bttsNo',
        label: 'KG Yok (En Az Biri Atamaz)',
        marketKey: 'btts',
        marketName: 'Karşılıklı Gol',
        odd: calcMarketOdd(analysis.bttsNo),
        probability: analysis.bttsNo,
        recommendationBadge: analysis.bttsNo >= 62 ? 'Kapanan Takım' : undefined
      }
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
      {
        key: 'under35',
        label: '3.5 Gol Alt (En Fazla 3 Gol)',
        marketKey: 'goals_35',
        marketName: '3.5 Gol',
        odd: calcMarketOdd(probUnder35),
        probability: probUnder35,
        recommendationBadge: probUnder35 >= 75 ? 'Güvenli Alt' : undefined
      },
      {
        key: 'over35',
        label: '3.5 Gol Üst (En Az 4 Gol)',
        marketKey: 'goals_35',
        marketName: '3.5 Gol',
        odd: calcMarketOdd(probOver35),
        probability: probOver35,
        recommendationBadge: probOver35 >= 45 ? 'Yüksek Oran' : undefined
      }
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
      {
        key: 'under15',
        label: '1.5 Gol Alt (En Fazla 1 Gol)',
        marketKey: 'goals_15',
        marketName: '1.5 Gol',
        odd: calcMarketOdd(probUnder15),
        probability: probUnder15
      },
      {
        key: 'over15',
        label: '1.5 Gol Üst (En Az 2 Gol)',
        marketKey: 'goals_15',
        marketName: '1.5 Gol',
        odd: calcMarketOdd(probOver15),
        probability: probOver15,
        recommendationBadge: probOver15 >= 78 ? 'Kasa Bankosu' : undefined
      }
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
      {
        key: 'dc_1x',
        label: `1-X (${match.homeTeam.shortName || 'Ev'} / Beraberlik)`,
        marketKey: 'double_chance',
        marketName: 'Çifte Şans',
        odd: calcMarketOdd(p1X),
        probability: p1X
      },
      {
        key: 'dc_12',
        label: `1-2 (${match.homeTeam.shortName || 'Ev'} / ${match.awayTeam.shortName || 'Dep'})`,
        marketKey: 'double_chance',
        marketName: 'Çifte Şans',
        odd: calcMarketOdd(p12),
        probability: p12
      },
      {
        key: 'dc_x2',
        label: `X-2 (Beraberlik / ${match.awayTeam.shortName || 'Dep'})`,
        marketKey: 'double_chance',
        marketName: 'Çifte Şans',
        odd: calcMarketOdd(pX2),
        probability: pX2
      }
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
      {
        key: 'ht_1',
        label: `İY 1 (${match.homeTeam.shortName || 'Ev'})`,
        marketKey: 'first_half_result',
        marketName: 'İlk Yarı',
        odd: calcMarketOdd(htH),
        probability: htH
      },
      {
        key: 'ht_X',
        label: 'İY X (İlk Yarı Beraberlik)',
        marketKey: 'first_half_result',
        marketName: 'İlk Yarı',
        odd: calcMarketOdd(htX),
        probability: htX,
        recommendationBadge: htX >= 48 ? 'Muhtemel' : undefined
      },
      {
        key: 'ht_2',
        label: `İY 2 (${match.awayTeam.shortName || 'Dep'})`,
        marketKey: 'first_half_result',
        marketName: 'İlk Yarı',
        odd: calcMarketOdd(htA),
        probability: htA
      }
    ]
  });

  // 8. İlk Yarı / Maç Sonucu (İY/MS)
  if (analysis.htFtRanked && analysis.htFtRanked.length > 0) {
    groups.push({
      id: 'ht_ft',
      name: 'İlk Yarı / Maç Sonucu (İY/MS)',
      description: 'İlk devre ve maç sonunun ortak kombinasyonu (Yüksek Oran)',
      options: analysis.htFtRanked.map((item, idx) => ({
        key: `htft_${item.code}`,
        label: item.label,
        marketKey: 'ht_ft',
        marketName: 'İY / MS',
        odd: calcMarketOdd(item.prob, 0.90),
        probability: item.prob,
        recommendationBadge: idx === 0 ? 'En Muhtemel İY/MS' : undefined
      }))
    });
  }

  return groups;
}


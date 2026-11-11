// src/utils/horseRacingEngine.ts
import {
  BetLegMarkers,
  GeneratedAltiliCoupon,
  HorseAIAnalysis,
  HorseBetGameType,
  HorseRunner,
  ProgramDetail,
  RaceCard,
} from '../types/horseRacing';

export interface GameConfig {
  id: HorseBetGameType;
  label: string;
  shortLabel: string;
  legCount: number;
  startRace: number;
  defaultUnitPrice: number; // TL
}

export function getAvailableGames(detail: ProgramDetail | null): GameConfig[] {
  if (!detail) return [];
  const totalRaces = detail.races.length;
  const markers: BetLegMarkers = detail.betLegs || {};
  const games: GameConfig[] = [];

  if (markers.altili1Start && markers.altili1Start + 5 <= totalRaces) {
    games.push({
      id: 'ALTILI_1',
      label: markers.altili2Start ? "1. 6'lı Ganyan" : "6'lı Ganyan",
      shortLabel: markers.altili2Start ? "1.6'lı" : "6'lı",
      legCount: 6,
      startRace: markers.altili1Start,
      defaultUnitPrice: 1.0,
    });
  }
  if (markers.altili2Start && markers.altili2Start + 5 <= totalRaces) {
    games.push({
      id: 'ALTILI_2',
      label: "2. 6'lı Ganyan",
      shortLabel: "2.6'lı",
      legCount: 6,
      startRace: markers.altili2Start,
      defaultUnitPrice: 1.0,
    });
  }
  if (markers.besliStart && markers.besliStart + 4 <= totalRaces) {
    games.push({
      id: 'BESLI',
      label: "5'li Ganyan",
      shortLabel: "5'li",
      legCount: 5,
      startRace: markers.besliStart,
      defaultUnitPrice: 1.0,
    });
  }
  if (markers.dortluStart && markers.dortluStart + 3 <= totalRaces) {
    games.push({
      id: 'DORTLU',
      label: "4'lü Ganyan",
      shortLabel: "4'lü",
      legCount: 4,
      startRace: markers.dortluStart,
      defaultUnitPrice: 1.0,
    });
  }
  if (markers.yediliPlaseStart && markers.yediliPlaseStart + 6 <= totalRaces) {
    games.push({
      id: 'YEDILI_PLASE',
      label: "7'li Plase",
      shortLabel: "7'li P",
      legCount: 7,
      startRace: markers.yediliPlaseStart,
      defaultUnitPrice: 1.0,
    });
  }
  if (markers.uclu1Start && markers.uclu1Start + 2 <= totalRaces) {
    games.push({
      id: 'UCLU_1',
      label: markers.uclu2Start ? "1. 3'lü Ganyan" : "3'lü Ganyan",
      shortLabel: markers.uclu2Start ? "1.3'lü" : "3'lü",
      legCount: 3,
      startRace: markers.uclu1Start,
      defaultUnitPrice: 1.0,
    });
  }
  if (markers.uclu2Start && markers.uclu2Start + 2 <= totalRaces) {
    games.push({
      id: 'UCLU_2',
      label: "2. 3'lü Ganyan",
      shortLabel: "2.3'lü",
      legCount: 3,
      startRace: markers.uclu2Start,
      defaultUnitPrice: 1.0,
    });
  }

  // Fallback 6'li if program has >= 6 races and no explicit marker matched
  if (games.length === 0 && totalRaces >= 6) {
    games.push({
      id: 'ALTILI_1',
      label: "6'lı Ganyan",
      shortLabel: "6'lı",
      legCount: 6,
      startRace: totalRaces >= 8 ? 3 : 1,
      defaultUnitPrice: 1.0,
    });
  }

  return games;
}

export function getLegRaceNumbers(game: GameConfig): number[] {
  const arr: number[] = [];
  for (let i = 0; i < game.legCount; i++) {
    arr.push(game.startRace + i);
  }
  return arr;
}

export function getLegBadgeForRace(raceNo: number, game: GameConfig | null): number | null {
  if (!game) return null;
  const idx = raceNo - game.startRace;
  if (idx >= 0 && idx < game.legCount) {
    return idx + 1;
  }
  return null;
}

export function getHorsePrimaryAgf(horse: HorseRunner): { percentage: number; position: number; isFavorite: boolean } {
  if (!horse.agf || horse.agf.length === 0) {
    return { percentage: 0, position: 0, isFavorite: false };
  }
  // Pick highest AGF if multiple altili pools exist
  const sorted = [...horse.agf].sort((a, b) => b.percentage - a.percentage);
  return sorted[0];
}

export function calculateFormPoints(horse: HorseRunner, raceSurface: string): number {
  if (!horse.last6 || horse.last6.length === 0) return 0;
  let total = 0;
  const targetSurface = (raceSurface || '').toLowerCase();
  horse.last6.forEach((item, idx) => {
    // Index length-1 is usually most recent in TJK arrays (or index 0 in some cards), weight evenly + slight recency
    const pos = parseInt(item.result, 10);
    let pts = 0;
    if (pos === 1) pts = 18;
    else if (pos === 2) pts = 13;
    else if (pos === 3) pts = 9;
    else if (pos === 4) pts = 6;
    else if (pos === 5) pts = 3;
    else if (pos > 0 && pos <= 9) pts = 1;

    if (targetSurface && item.raceCourseType && item.raceCourseType.toLowerCase().includes(targetSurface)) {
      pts *= 1.15;
    }
    const recencyWeight = 0.8 + (idx / Math.max(1, horse.last6.length - 1)) * 0.4;
    total += pts * recencyWeight;
  });
  return Math.min(35, total * 0.42);
}

export function analyzeRaceHorses(race: RaceCard | null): Map<number, HorseAIAnalysis> {
  const result = new Map<number, HorseAIAnalysis>();
  if (!race || !race.horses || race.horses.length === 0) return result;

  const activeHorses = race.horses.filter((h) => h.status !== false);
  if (activeHorses.length === 0) return result;

  const maxHp = Math.max(1, ...activeHorses.map((h) => parseInt(h.handicap || '0', 10) || 0));
  const avgWeight =
    activeHorses.reduce((acc, h) => acc + (h.weight || 56), 0) / Math.max(1, activeHorses.length);

  const scored = activeHorses.map((h) => {
    const agf = getHorsePrimaryAgf(h);
    const hp = parseInt(h.handicap || '0', 10) || 0;
    const formPts = calculateFormPoints(h, race.raceCourseType);
    const ganyan = h.ganyan || 0;

    // Composite AI Score (0-100) using genuine TJK metrics
    let score = 20;
    const reasons: string[] = [];

    // 1. AGF market confidence (up to +32)
    if (agf.percentage > 0) {
      score += Math.min(32, agf.percentage * 0.72);
      if (agf.isFavorite) reasons.push(`AGF Favorisi (%${agf.percentage.toFixed(1)})`);
      else if (agf.percentage >= 15) reasons.push(`Güçlü AGF (%${agf.percentage.toFixed(1)})`);
    } else if (ganyan > 0) {
      const implied = Math.min(30, 65 / Math.max(1.2, ganyan));
      score += implied;
    }

    // 2. Last 6 race form on surface (up to +26)
    score += Math.min(26, formPts * 0.78);
    const winsLast6 = h.last6.filter((x) => x.result === '1').length;
    const top3Last6 = h.last6.filter((x) => ['1', '2', '3'].includes(x.result)).length;
    if (winsLast6 >= 2) reasons.push(`Son 6 yarışta ${winsLast6} birincilik`);
    else if (top3Last6 >= 3) reasons.push(`İstikrarlı form (Son 6'da ${top3Last6} tabela)`);

    // 3. Handicap Rating (up to +14)
    if (hp > 0) {
      const hpRatio = hp / maxHp;
      score += hpRatio * 14;
      if (hpRatio >= 0.92 && hp >= 45) reasons.push(`Yüksek Handikap (${hp} HP)`);
    }

    // 4. Weight & KGS & Jockey bonus (up to +8)
    if (h.weight > 0 && h.weight <= avgWeight - 2.5) {
      score += 4;
      reasons.push(`Kilo avantajı (${h.weight} kg)`);
    }
    if (h.jockey?.isJockeyChanged) {
      reasons.push(`Jokey değişikliği (${h.jockey.name})`);
    }
    if (h.kgs > 0 && h.kgs <= 21) {
      score += 3;
    }
    if (h.bestGrade?.value) {
      score += 2;
    }
    if (h.stablemate > 0) {
      score += 2;
      reasons.push(`Eküri avantajı (E${h.stablemate})`);
    }

    // 5. Value ganyan surprise indicator
    if (ganyan >= 8 && formPts >= 14) {
      reasons.push(`Yüksek ganyan sürpriz potansiyeli (${ganyan.toFixed(2)})`);
    }

    const clamped = Math.max(12, Math.min(98, Math.round(score)));
    if (reasons.length === 0) {
      reasons.push(
        ganyan > 0 ? `${ganyan.toFixed(2)} ganyan ile koşu içi şanslı` : 'Derece & pist uyumu takipte'
      );
    }

    return {
      horseNumber: h.number,
      score: clamped,
      agfPct: agf.percentage,
      ganyan,
      reasons: reasons.slice(0, 3),
    };
  });

  scored.sort((a, b) => b.score - a.score);

  const topScore = scored[0]?.score || 0;
  const secondScore = scored[1]?.score || 0;

  scored.forEach((item, idx) => {
    let tag: HorseAIAnalysis['tag'] = 'PLASE';
    if (idx === 0 && (item.score >= 72 || item.score - secondScore >= 7 || item.agfPct >= 34)) {
      tag = 'BANKO';
    } else if (idx <= 1 || item.score >= topScore - 8) {
      tag = 'ALTERNATİF';
    } else if (item.ganyan >= 12 || (item.agfPct > 0 && item.agfPct <= 5)) {
      tag = 'BOMBA';
    } else if (idx <= 4) {
      tag = 'SÜRPRİZ';
    }
    result.set(item.horseNumber, {
      horseNumber: item.horseNumber,
      score: item.score,
      tag,
      reasons: item.reasons,
    });
  });

  return result;
}

export function calculateCouponCombinations(
  selections: Record<number, number[]>,
  legRaceNumbers: number[]
): number {
  if (legRaceNumbers.length === 0) return 0;
  let combos = 1;
  for (const rNo of legRaceNumbers) {
    const count = selections[rNo]?.length || 0;
    if (count === 0) return 0;
    combos *= count;
  }
  return combos;
}

export function generateAICoupons(
  detail: ProgramDetail | null,
  game: GameConfig | null
): GeneratedAltiliCoupon[] {
  if (!detail || !game) return [];
  const legRaceNums = getLegRaceNumbers(game);
  const legRaces = legRaceNums
    .map((no) => detail.races.find((r) => r.number === no))
    .filter((r): r is RaceCard => Boolean(r));

  if (legRaces.length !== game.legCount) return [];

  const legAnalyses = legRaces.map((race) => {
    const map = analyzeRaceHorses(race);
    const ranked = Array.from(map.values()).sort((a, b) => b.score - a.score);
    return { raceNumber: race.number, ranked, gap: (ranked[0]?.score || 0) - (ranked[1]?.score || 0) };
  });

  // Identify strongest single-banko leg & second strongest leg
  const sortedByStrength = [...legAnalyses].sort(
    (a, b) => (b.ranked[0]?.score || 0) + b.gap - ((a.ranked[0]?.score || 0) + a.gap)
  );
  const primaryBankoRace = sortedByStrength[0]?.raceNumber;
  const secondaryBankoRace = sortedByStrength[1]?.raceNumber;

  const buildCoupon = (
    id: string,
    title: string,
    subtitle: string,
    strategy: GeneratedAltiliCoupon['strategy'],
    pickCountFn: (raceNo: number, ranked: HorseAIAnalysis[], gap: number) => number[]
  ): GeneratedAltiliCoupon => {
    const legs = legAnalyses.map((la, idx) => {
      const horses = pickCountFn(la.raceNumber, la.ranked, la.gap);
      return {
        legIndex: idx + 1,
        raceNumber: la.raceNumber,
        horses,
        banko: horses.length === 1 ? horses[0] : undefined,
      };
    });
    const totalCombinations = legs.reduce((acc, l) => acc * Math.max(1, l.horses.length), 1);
    const avgConfidence = Math.round(
      legAnalyses.reduce((acc, la) => acc + (la.ranked[0]?.score || 60), 0) / legAnalyses.length
    );

    return {
      id,
      title,
      subtitle,
      strategy,
      gameType: game.id,
      startRace: game.startRace,
      legs,
      totalCombinations,
      estimatedCost: Number((totalCombinations * game.defaultUnitPrice).toFixed(2)),
      avgConfidence,
    };
  };

  // 1. Ekonomik (2 Tek + dar ayaklar)
  const ekonomik = buildCoupon(
    'hr-eco',
    `Ekonomik ${game.label} Şablonu`,
    'En yüksek AGF + Form puanlı iki ayakta Tek/Banko, diğer ayaklarda güçlü ikili',
    'EKONOMİK',
    (raceNo, ranked) => {
      if (raceNo === primaryBankoRace || raceNo === secondaryBankoRace) {
        return ranked.slice(0, 1).map((x) => x.horseNumber);
      }
      return ranked.slice(0, 2).map((x) => x.horseNumber);
    }
  );

  // 2. İdeal (1 Net Banko + dengeli dağılım)
  const ideal = buildCoupon(
    'hr-ideal',
    `ProAnaliz İdeal ${game.label}`,
    'Günün en net favorisi Tek, kalabalık koşularda 3-4 atlı dengeli kurgu',
    'İDEAL',
    (raceNo, ranked, gap) => {
      if (raceNo === primaryBankoRace) {
        return ranked.slice(0, 1).map((x) => x.horseNumber);
      }
      if (gap >= 6) return ranked.slice(0, 2).map((x) => x.horseNumber);
      return ranked.slice(0, 3).map((x) => x.horseNumber);
    }
  );

  // 3. Geniş / Sürprizli Şablon
  const genis = buildCoupon(
    'hr-broad',
    `Geniş & Sürprizli ${game.label}`,
    '1 Banko yanında bomba & sürpriz adaylarını da kapsayan yüksek ikramiye kurgusu',
    'GENİŞ',
    (raceNo, ranked) => {
      if (raceNo === primaryBankoRace) {
        return ranked.slice(0, 1).map((x) => x.horseNumber);
      }
      const maxCount = Math.min(5, ranked.length);
      return ranked.slice(0, maxCount >= 4 ? 4 : maxCount).map((x) => x.horseNumber);
    }
  );

  return [ekonomik, ideal, genis];
}


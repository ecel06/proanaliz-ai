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
      label: markers.besli2Start ? "1. 5'li Ganyan" : "5'li Ganyan",
      shortLabel: markers.besli2Start ? "1.5'li" : "5'li",
      legCount: 5,
      startRace: markers.besliStart,
      defaultUnitPrice: 1.0,
    });
  }
  if (markers.besli2Start && markers.besli2Start + 4 <= totalRaces) {
    games.push({
      id: 'BESLI_2',
      label: "2. 5'li Ganyan",
      shortLabel: "2.5'li",
      legCount: 5,
      startRace: markers.besli2Start,
      defaultUnitPrice: 1.0,
    });
  }
  if (markers.dortluStart && markers.dortluStart + 3 <= totalRaces) {
    games.push({
      id: 'DORTLU',
      label: markers.dortlu2Start ? "1. 4'lü Ganyan" : "4'lü Ganyan",
      shortLabel: markers.dortlu2Start ? "1.4'lü" : "4'lü",
      legCount: 4,
      startRace: markers.dortluStart,
      defaultUnitPrice: 1.0,
    });
  }
  if (markers.dortlu2Start && markers.dortlu2Start + 3 <= totalRaces) {
    games.push({
      id: 'DORTLU_2',
      label: "2. 4'lü Ganyan",
      shortLabel: "2.4'lü",
      legCount: 4,
      startRace: markers.dortlu2Start,
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

  // Identify strongest single-banko leg & second strongest leg ONLY IF they meet true statistical superiority
  const sortedByStrength = [...legAnalyses].sort(
    (a, b) => (b.ranked[0]?.score || 0) + b.gap - ((a.ranked[0]?.score || 0) + a.gap)
  );

  const bestCandidate = sortedByStrength[0];
  const secondCandidate = sortedByStrength[1];

  // A leg is ONLY a legitimate primary single if it has a real gap (>=5) or high confidence (>=68)
  const hasLegitPrimaryBanko = Boolean(
    bestCandidate && (bestCandidate.gap >= 5 || (bestCandidate.ranked[0]?.score || 0) >= 68)
  );
  const primaryBankoRace = hasLegitPrimaryBanko ? bestCandidate.raceNumber : null;

  // A leg is ONLY a secondary banko if gap is >= 4 and score >= 64
  const hasLegitSecondaryBanko = Boolean(
    secondCandidate && (secondCandidate.gap >= 4 || (secondCandidate.ranked[0]?.score || 0) >= 64)
  );
  const secondaryBankoRace = hasLegitSecondaryBanko ? secondCandidate.raceNumber : null;

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

  // 1. Ekonomik (Güçlü ayakta Tek/Banko, diğer ayaklarda güçlü ikili)
  const ekonomik = buildCoupon(
    'hr-eco',
    `Ekonomik ${game.label} Şablonu`,
    hasLegitPrimaryBanko 
      ? 'En yüksek AGF + Form puanlı ayakta Tek/Banko, diğer ayaklarda güçlü ikili'
      : 'Denk ve zorlu koşularda sürprize kapalı dar ayaklı ekonomik şablon',
    'EKONOMİK',
    (raceNo, ranked) => {
      if (primaryBankoRace && raceNo === primaryBankoRace) {
        return ranked.slice(0, 1).map((x) => x.horseNumber);
      }
      if (secondaryBankoRace && raceNo === secondaryBankoRace) {
        return ranked.slice(0, 1).map((x) => x.horseNumber);
      }
      return ranked.slice(0, 2).map((x) => x.horseNumber);
    }
  );

  // 2. İdeal (1 Net Banko + dengeli dağılım)
  const ideal = buildCoupon(
    'hr-ideal',
    `ProAnaliz İdeal ${game.label}`,
    hasLegitPrimaryBanko 
      ? 'Günün en net favorisi Tek, kalabalık koşularda 3-4 atlı dengeli kurgu'
      : 'Zorlu programda her ayakta en şanslı 2-3 atlı dengeli kurgu',
    'İDEAL',
    (raceNo, ranked, gap) => {
      if (primaryBankoRace && raceNo === primaryBankoRace) {
        return ranked.slice(0, 1).map((x) => x.horseNumber);
      }
      if (gap >= 5) return ranked.slice(0, 2).map((x) => x.horseNumber);
      return ranked.slice(0, 3).map((x) => x.horseNumber);
    }
  );

  // 3. Geniş / Sürprizli Şablon
  const genis = buildCoupon(
    'hr-broad',
    `Geniş & Sürprizli ${game.label}`,
    'Banko adayı yanında bomba & sürpriz adaylarını da kapsayan yüksek ikramiye kurgusu',
    'GENİŞ',
    (raceNo, ranked) => {
      if (primaryBankoRace && raceNo === primaryBankoRace) {
        return ranked.slice(0, 1).map((x) => x.horseNumber);
      }
      const maxCount = Math.min(5, ranked.length);
      return ranked.slice(0, maxCount >= 4 ? 4 : maxCount).map((x) => x.horseNumber);
    }
  );

  return [ekonomik, ideal, genis];
}

export function generateBudgetHorseCoupon(
  detail: ProgramDetail | null,
  game: GameConfig | null,
  maxBudgetTL = 100,
  riskMode: 'ekonomik' | 'ideal' | 'surpriz' = 'ideal'
): GeneratedAltiliCoupon | null {
  if (!detail || !game) return null;
  const legRaceNums = getLegRaceNumbers(game);
  const legRaces = legRaceNums
    .map((no) => detail.races.find((r) => r.number === no))
    .filter((r): r is RaceCard => Boolean(r));
  if (legRaces.length !== game.legCount) return null;

  const legData = legRaces.map((race, idx) => {
    const map = analyzeRaceHorses(race);
    const ranked = Array.from(map.values()).sort((a, b) => b.score - a.score);
    const gap = (ranked[0]?.score || 0) - (ranked[1]?.score || 0);
    // Start with 1 horse for clearest leg or 2 for normal legs
    return {
      legIndex: idx + 1,
      raceNumber: race.number,
      ranked,
      confidence: (ranked[0]?.score || 50) + gap,
      count: 1,
    };
  });

  // Sort copy by competitiveness (most competitive / tightest gap gets extra horses first)
  const expansionOrder = [...legData].sort((a, b) => a.confidence - b.confidence);

  // Determine target ceiling per leg based on riskMode
  const maxPerLeg = riskMode === 'ekonomik' ? 3 : riskMode === 'ideal' ? 4 : 6;
  const minBankos = riskMode === 'ekonomik' ? 2 : 1;
  const lockedBankoRaces = new Set(
    [...legData]
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, minBankos)
      .map((x) => x.raceNumber)
  );

  let changed = true;
  while (changed) {
    changed = false;
    for (const item of expansionOrder) {
      if (lockedBankoRaces.has(item.raceNumber)) continue;
      if (item.count >= maxPerLeg || item.count >= item.ranked.length) continue;

      const nextCombos = legData.reduce(
        (acc, l) => acc * (l.raceNumber === item.raceNumber ? l.count + 1 : l.count),
        1
      );
      if (nextCombos * game.defaultUnitPrice <= maxBudgetTL) {
        item.count += 1;
        changed = true;
      }
    }
  }

  // If surprise mode, swap last slot of tightest leg to highest ganyan bomber if not already picked
  const legs = legData.map((l) => {
    let picks = l.ranked.slice(0, l.count).map((x) => x.horseNumber);
    if (riskMode === 'surpriz' && l.count >= 3 && l.ranked.length > l.count) {
      const bomber = l.ranked.slice(l.count).find((x) => x.tag === 'BOMBA' || x.tag === 'SÜRPRİZ');
      if (bomber) {
        picks = [...l.ranked.slice(0, l.count - 1).map((x) => x.horseNumber), bomber.horseNumber];
      }
    }
    picks.sort((a, b) => a - b);
    return {
      legIndex: l.legIndex,
      raceNumber: l.raceNumber,
      horses: picks,
      banko: picks.length === 1 ? picks[0] : undefined,
    };
  });

  const totalCombinations = legs.reduce((acc, l) => acc * Math.max(1, l.horses.length), 1);
  const avgConfidence = Math.round(
    legData.reduce((acc, l) => acc + (l.ranked[0]?.score || 60), 0) / legData.length
  );

  const strategyLabel: GeneratedAltiliCoupon['strategy'] =
    riskMode === 'ekonomik' ? 'EKONOMİK' : riskMode === 'surpriz' ? 'BANKOLU SÜRPRİZ' : 'İDEAL';

  return {
    id: `hr-ai-${Date.now()}`,
    title: `${detail.program.place} ${game.label} (${maxBudgetTL >= 9999 ? 'Limitsiz' : `${maxBudgetTL} ₺ Bütçe`})`,
    subtitle: `${strategyLabel} strateji • En net ayaklarda tek, zorlu ayaklarda geniş kurgu`,
    strategy: strategyLabel,
    gameType: game.id,
    startRace: game.startRace,
    legs,
    totalCombinations,
    estimatedCost: Number((totalCombinations * game.defaultUnitPrice).toFixed(2)),
    avgConfidence,
  };
}

export function getProgramHighlights(detail: ProgramDetail | null) {
  if (!detail) return null;
  const raceInsights = detail.races.map((race) => {
    const map = analyzeRaceHorses(race);
    const ranked = Array.from(map.values()).sort((a, b) => b.score - a.score);
    const top = ranked[0];
    const second = ranked[1];
    const gap = (top?.score || 0) - (second?.score || 0);
    const topHorse = race.horses.find((h) => h.number === top?.horseNumber);
    const sleeper = ranked.find((x) => x.tag === 'BOMBA' || x.tag === 'SÜRPRİZ');
    const sleeperHorse = race.horses.find((h) => h.number === sleeper?.horseNumber);
    return {
      race,
      ranked,
      gap,
      top,
      topHorse,
      sleeper,
      sleeperHorse,
    };
  });

  const bestBanko = [...raceInsights]
    .filter((r) => !r.race.isFinished && r.top)
    .sort((a, b) => (b.top!.score + b.gap) - (a.top!.score + a.gap))[0] || raceInsights[0];

  const surpriseRace = [...raceInsights]
    .filter((r) => !r.race.isFinished && r.sleeper)
    .sort((a, b) => a.gap - b.gap)[0] || raceInsights[0];

  return { raceInsights, bestBanko, surpriseRace };
}

export interface IkiliPick {
  raceNumber: number;
  type: 'SIRALI_IKILI' | 'DUZ_IKILI' | 'CIFTE' | 'TABELA';
  title: string;
  horses: { number: number; name: string; jockey?: string; tag: string; ganyan?: number }[];
  confidence: number;
  reason: string;
}

export function generateDailyIkiliAndCifte(detail: ProgramDetail | null): IkiliPick[] {
  if (!detail || !detail.races || detail.races.length === 0) return [];
  const picks: IkiliPick[] = [];

  detail.races.forEach((race, idx) => {
    if (race.isFinished) return;
    const map = analyzeRaceHorses(race);
    const ranked = Array.from(map.values()).sort((a, b) => b.score - a.score);
    if (ranked.length < 2) return;

    const h1 = race.horses.find((h) => h.number === ranked[0].horseNumber);
    const h2 = race.horses.find((h) => h.number === ranked[1].horseNumber);
    const sleeper = ranked.find((x) => x.tag === 'BOMBA' || x.tag === 'SÜRPRİZ');
    const sleeperHorse = race.horses.find((h) => h.number === sleeper?.horseNumber);

    if (h1 && h2) {
      // 1. Sıralı / Düz İkili
      const gap = (ranked[0]?.score || 0) - (ranked[1]?.score || 0);
      picks.push({
        raceNumber: race.number,
        type: gap >= 6 ? 'SIRALI_IKILI' : 'DUZ_IKILI',
        title: `${race.number}. Koşu: ${gap >= 6 ? 'Sıralı İkili' : 'İkili Bahis'} (${h1.number} - ${h2.number})`,
        horses: [
          { number: h1.number, name: h1.name, jockey: h1.jockey?.name, tag: ranked[0].tag, ganyan: h1.ganyan },
          { number: h2.number, name: h2.name, jockey: h2.jockey?.name, tag: ranked[1].tag, ganyan: h2.ganyan }
        ],
        confidence: Math.round(((ranked[0].score + ranked[1].score) / 2)),
        reason: `${h1.name} ve ${h2.name} pist ve form puanlarıyla koşunun ilk 2 sırasını almaya en yakın safkanlardır.`
      });

      // 2. Sürpriz / Cazip İkili
      if (sleeper && sleeperHorse && sleeper.horseNumber !== h1.number && sleeper.horseNumber !== h2.number) {
        picks.push({
          raceNumber: race.number,
          type: 'DUZ_IKILI',
          title: `${race.number}. Koşu: Sürpriz İkili (${h1.number} - ${sleeperHorse.number})`,
          horses: [
            { number: h1.number, name: h1.name, jockey: h1.jockey?.name, tag: ranked[0].tag, ganyan: h1.ganyan },
            { number: sleeperHorse.number, name: sleeperHorse.name, jockey: sleeperHorse.jockey?.name, tag: sleeper.tag, ganyan: sleeperHorse.ganyan }
          ],
          confidence: Math.round(sleeper.score * 0.85),
          reason: `${sleeperHorse.name} yüksek ganyan ve kilo avantajıyla ikiliye girerek ikramiyeyi katlayabilir.`
        });
      }
    }

    // 3. Çifte Bahis
    const nextRace = detail.races[idx + 1];
    if (nextRace && !nextRace.isFinished) {
      const nextMap = analyzeRaceHorses(nextRace);
      const nextRanked = Array.from(nextMap.values()).sort((a, b) => b.score - a.score);
      const nextH1 = nextRace.horses.find((h) => h.number === nextRanked[0]?.horseNumber);

      if (h1 && nextH1) {
        picks.push({
          raceNumber: race.number,
          type: 'CIFTE',
          title: `Günün Banko Çiftesi: ${race.number}. Koşu (${h1.number}) ✕ ${nextRace.number}. Koşu (${nextH1.number})`,
          horses: [
            { number: h1.number, name: `${race.number}. Koşu: ${h1.name}`, jockey: h1.jockey?.name, tag: ranked[0].tag },
            { number: nextH1.number, name: `${nextRace.number}. Koşu: ${nextH1.name}`, jockey: nextH1.jockey?.name, tag: nextRanked[0]?.tag || 'BANKO' }
          ],
          confidence: Math.round((ranked[0].score + (nextRanked[0]?.score || 60)) / 2),
          reason: 'Arka arkaya koşularda günün en net iki safkanını birleştiren yüksek getirili çifte tercihi.'
        });
      }
    }
  });

  return picks;
}



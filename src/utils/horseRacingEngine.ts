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

export function isRaceStartedOrFinished(race: RaceCard | null | undefined, programDateStr?: string): boolean {
  if (!race) return false;
  if (race.isFinished) return true;
  if (race.status === 'RESMİ' || race.status === 'BİTTİ' || race.isUnofficialResult) return true;
  if (race.horses && race.horses.some((h) => Number(h.order) > 0)) return true;

  const hourStr = String(race.hour || '').trim();
  if (hourStr && hourStr.includes(':')) {
    const [h, m] = hourStr.split(':').map((x) => parseInt(x, 10));
    if (!isNaN(h) && !isNaN(m)) {
      // Türkiye saati ile karşılaştırma (TJK saatleri İstanbul saatidir)
      const nowTr = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));
      const target = new Date(nowTr);

      if (programDateStr && programDateStr.includes('-')) {
        const [y, mon, d] = programDateStr.split('-').map((x) => parseInt(x, 10));
        if (!isNaN(y) && !isNaN(mon) && !isNaN(d)) {
          target.setFullYear(y, mon - 1, d);
        }
      }
      target.setHours(h, m, 0, 0);

      if (nowTr.getTime() >= target.getTime()) {
        return true;
      }
    }
  }

  return false;
}

export interface GameClosedStatus {
  isClosed: boolean;
  firstLegRace?: RaceCard;
  startedLegCount: number;
  totalLegs: number;
  nextOpenGame?: GameConfig | null;
  message: string;
}

export function checkGameClosedStatus(
  detail: ProgramDetail | null,
  game: GameConfig | null,
  availableGames: GameConfig[] = []
): GameClosedStatus {
  if (!detail || !game) {
    return { isClosed: false, startedLegCount: 0, totalLegs: 6, message: '' };
  }

  const legRaceNums = getLegRaceNumbers(game);
  const legRaces = legRaceNums
    .map((no) => detail.races.find((r) => r.number === no))
    .filter((r): r is RaceCard => Boolean(r));

  const firstRace = legRaces[0];
  const closedLegs = legRaces.filter((r) => isRaceStartedOrFinished(r, detail.program.date));
  const isClosed = closedLegs.length > 0;

  let nextOpenGame: GameConfig | null = null;
  if (isClosed && availableGames.length > 0) {
    nextOpenGame =
      availableGames.find((g) => {
        if (g.id === game.id) return false;
        const gFirstRace = detail.races.find((r) => r.number === g.startRace);
        return gFirstRace && !isRaceStartedOrFinished(gFirstRace, detail.program.date);
      }) || null;
  }

  let message = '';
  if (isClosed) {
    const isAllFinished = closedLegs.length === legRaces.length;
    if (isAllFinished) {
      message = `${game.label} tamamlandı (Tüm koşular koşuldu).`;
    } else {
      const firstHour = firstRace?.hour ? ` (${firstRace.hour})` : '';
      message = `${game.label} başladı (${closedLegs.length}/${legRaces.length} ayak koşuldu/başladı, 1. Ayak: ${firstRace?.number}. Koşu${firstHour}). TJK müşterek bahis kabulü kapanmıştır.`;
    }
  }

  return {
    isClosed,
    firstLegRace: firstRace,
    startedLegCount: closedLegs.length,
    totalLegs: legRaces.length,
    nextOpenGame,
    message,
  };
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

export interface RaceChaosAssessment {
  chaosScore: number; // 0 to 1
  tier: 'LOW' | 'MEDIUM' | 'HIGH' | 'CHAOTIC';
  isBankoFriendly: boolean;
  recommendedPicksMin: number;
  recommendedPicksMax: number;
  riskWarning: string;
}

export function calculateRaceChaosAssessment(race: RaceCard | null): RaceChaosAssessment {
  if (!race || !race.horses || race.horses.length === 0) {
    return {
      chaosScore: 0.38,
      tier: 'MEDIUM',
      isBankoFriendly: false,
      recommendedPicksMin: 2,
      recommendedPicksMax: 3,
      riskWarning: 'Dengeli Koşu',
    };
  }

  const typeDesc = (race.typeDescription || '').toLowerCase();
  const activeCount = race.horses.filter((h) => h.status !== false).length;

  let chaos = 0.38;
  let reason = 'Dengeli koşu';

  // 1. Koşu Türü ve Şartına Dayalı Risk Modeli
  if (typeDesc.includes('handikap') || typeDesc.includes('handicap')) {
    chaos += 0.22;
    reason = 'Handikap Koşusu: Kilo farkları nedeniyle sürprize açıktır, dikkatli kurgulanmalıdır';
  } else if (typeDesc.includes('dişi') || typeDesc.includes('disi')) {
    chaos += 0.16;
    reason = 'Dişi Koşusu: Dalgalı form grafikleri ve sürpriz olasılığı barındırır';
  } else if (typeDesc.includes('maiden')) {
    const hasStandout = race.horses.some((h) => {
      const agf = getHorsePrimaryAgf(h);
      return agf.percentage >= 38;
    });
    if (hasStandout) {
      chaos -= 0.18;
      reason = 'Maiden: Net favorisi olan, banko kurulmaya en uygun koşu';
    } else {
      chaos += 0.12;
      reason = 'Maiden: Birinciliği olmayan denk atlar, sürprize açık';
    }
  } else if (typeDesc.includes('kv-') || typeDesc.includes('grup') || typeDesc.includes('açık') || typeDesc.includes('acik')) {
    if (activeCount <= 8) {
      chaos -= 0.16;
      reason = 'Kısa Alan / Grup Koşusu: Kalite atların taktik yarışı, favori öncelikli';
    } else {
      chaos += 0.05;
      reason = 'Üst Düzey Koşu: Denk şampiyon atların mücadelesi';
    }
  }

  // 2. Koşan At Sayısı (Trafik & Kalabalık Faktörü)
  if (activeCount >= 14) {
    chaos += 0.12;
  } else if (activeCount <= 6) {
    chaos -= 0.12;
  }

  // 3. AGF Piyasa Yoğunlaşması (Fark Analizi)
  const agfs = race.horses.map((h) => getHorsePrimaryAgf(h).percentage).sort((a, b) => b - a);
  const topAgf = agfs[0] || 0;
  const secondAgf = agfs[1] || 0;
  const agfGap = topAgf - secondAgf;

  if (topAgf >= 42 && agfGap >= 18) {
    chaos -= 0.18;
  } else if (topAgf >= 34 && agfGap >= 12) {
    chaos -= 0.10;
  } else if (topAgf < 22 && agfGap < 6) {
    chaos += 0.16;
  }

  chaos = Math.max(0.12, Math.min(0.92, Number(chaos.toFixed(2))));

  let tier: RaceChaosAssessment['tier'] = 'MEDIUM';
  let isBankoFriendly = false;
  let recommendedPicksMin = 2;
  let recommendedPicksMax = 3;

  if (chaos <= 0.46) {
    tier = 'LOW';
    isBankoFriendly = true;
    recommendedPicksMin = 1;
    recommendedPicksMax = 2;
  } else if (chaos <= 0.64) {
    tier = 'MEDIUM';
    isBankoFriendly = topAgf >= 38 && agfGap >= 15;
    recommendedPicksMin = 2;
    recommendedPicksMax = 3;
  } else if (chaos <= 0.78) {
    tier = 'HIGH';
    isBankoFriendly = false;
    recommendedPicksMin = 3;
    recommendedPicksMax = 4;
  } else {
    tier = 'CHAOTIC';
    isBankoFriendly = false;
    recommendedPicksMin = 4;
    recommendedPicksMax = Math.min(6, activeCount);
  }

  return {
    chaosScore: chaos,
    tier,
    isBankoFriendly,
    recommendedPicksMin,
    recommendedPicksMax,
    riskWarning: reason,
  };
}

export function analyzeRaceHorses(race: RaceCard | null): Map<number, HorseAIAnalysis> {
  const result = new Map<number, HorseAIAnalysis>();
  if (!race || !race.horses || race.horses.length === 0) return result;

  const activeHorses = race.horses.filter((h) => h.status !== false);
  if (activeHorses.length === 0) return result;

  const chaosInfo = calculateRaceChaosAssessment(race);
  const isHandicap = (race.typeDescription || '').toLowerCase().includes('handikap');

  const maxHp = Math.max(1, ...activeHorses.map((h) => parseInt(h.handicap || '0', 10) || 0));
  const maxWeight = Math.max(1, ...activeHorses.map((h) => h.weight || 0));
  const avgWeight =
    activeHorses.reduce((acc, h) => acc + (h.weight || 56), 0) / Math.max(1, activeHorses.length);

  // Türkiye'nin elit/kazanma yüzdesi yüksek jokeyleri
  const ELITE_JOCKEYS = /kocakaya|abis|abiş|sözen|sozen|yıldırım|yildirim|karataş|karatas|çankaya|cankaya|akyavuz|kurşun|kursun|avcı|avci|çelik|celik|çizik|cizik|yardımcı|yardimci|çiçek|cicek|bilgin|özçelik|ozcelik|kaya|aktuğ|aktug|şimşek|simsek|kaplan|akçay|akcay|boyraz|tokaçoğlu|tokacoglu|sansar/i;

  const scored = activeHorses.map((h) => {
    const agf = getHorsePrimaryAgf(h);
    const hp = parseInt(h.handicap || '0', 10) || 0;
    const formPts = calculateFormPoints(h, race.raceCourseType);
    const ganyan = h.ganyan || 0;
    const jName = (h.jockey?.name || '').toLowerCase();

    // Kompozit AI Güç Puanı (0-100)
    let score = 20;
    const reasons: string[] = [];

    // 1. Kalibre Edilmiş AGF Puanı (Maks +30; TJK piyasa istatistiğine göre favori ağırlığı optimize edildi)
    if (agf.percentage > 0) {
      score += Math.min(30, agf.percentage * 0.65);
      if (agf.isFavorite) reasons.push(`AGF Favorisi (%${agf.percentage.toFixed(1)})`);
      else if (agf.percentage >= 15) reasons.push(`Güçlü AGF (%${agf.percentage.toFixed(1)})`);
    } else if (ganyan > 0) {
      const implied = Math.min(26, 60 / Math.max(1.1, ganyan));
      score += implied;
    }

    // 2. Pist ve Mesafe Formu (Maks +26)
    score += Math.min(26, formPts * 0.78);
    const winsLast6 = h.last6.filter((x) => x.result === '1').length;
    const top3Last6 = h.last6.filter((x) => ['1', '2', '3'].includes(x.result)).length;
    if (winsLast6 >= 2) reasons.push(`Son 6 yarışta ${winsLast6} birincilik`);
    else if (top3Last6 >= 3) reasons.push(`İstikrarlı tabela (Son 6'da ${top3Last6} derece)`);

    // 3. Handikap Kilo Avantajı (Handikap koşularda hafif kilo dev avantaj sağlar)
    if (isHandicap && h.weight > 0 && maxWeight > 0) {
      const weightDiff = maxWeight - h.weight;
      if (weightDiff >= 5.0) {
        score += Math.min(12, Math.round(weightDiff * 1.5));
        reasons.push(`Önemli kilo avantajı (-${weightDiff.toFixed(1)} kg)`);
      } else if (h.weight <= avgWeight - 2.0) {
        score += 5;
        reasons.push(`Hafif kilo avantajı (${h.weight} kg)`);
      }
    } else if (h.weight > 0 && h.weight <= avgWeight - 2.0) {
      score += 4;
      reasons.push(`Kilo avantajı (${h.weight} kg)`);
    }

    // 4. Resmi Handikap Puanı (HP) (Maks +15)
    if (hp > 0) {
      const hpRatio = hp / maxHp;
      score += hpRatio * 15;
      if (hpRatio >= 0.90 && hp >= 45) reasons.push(`Yüksek Handikap Puanı (${hp} HP)`);
    }

    // 5. Elit Jokey Faktörü (+6)
    if (ELITE_JOCKEYS.test(jName)) {
      score += 6;
      reasons.push(`Usta Jokey (${h.jockey.name})`);
    } else if (h.jockey?.isJockeyChanged) {
      reasons.push(`Jokey değişikliği (${h.jockey.name})`);
    }

    // 6. En İyi Pist Derecesi, Dinçlik & Son 20 Gün Puanı
    if (h.bestGrade?.value) {
      score += 4;
      reasons.push(`En İyi Derece: ${h.bestGrade.value}`);
    }
    if (h.kgs > 0 && h.kgs <= 21) {
      score += 3;
    }
    if (h.last20 > 0) {
      const l20Bonus = Math.min(5, Math.round(h.last20 / 4));
      score += l20Bonus;
      if (h.last20 >= 16) reasons.push(`Son 20 gün form puanı: ${h.last20}`);
    }
    if (h.stablemate > 0) {
      score += 3;
      reasons.push(`Eküri desteği (E${h.stablemate})`);
    }

    // 7. Cazip Sürpriz / Bomba Dedektörü (Value Longshot)
    const isValueBomber =
      (ganyan >= 6.5 || (agf.percentage > 0 && agf.percentage <= 10)) &&
      (formPts >= 14 || (isHandicap && h.weight <= avgWeight - 3.0));

    if (isValueBomber) {
      score += 4;
      reasons.unshift(
        `💣 Cazip Sürpriz (${ganyan > 0 ? `${ganyan.toFixed(2)} Ganyan` : `%${agf.percentage.toFixed(1)} AGF`})`
      );
    }

    const clamped = Math.max(15, Math.min(98, Math.round(score)));
    if (reasons.length === 0) {
      reasons.push(
        ganyan > 0 ? `${ganyan.toFixed(2)} ganyan ile şanslı plase` : 'Pist ve mesafe takibinde'
      );
    }

    return {
      horseNumber: h.number,
      score: clamped,
      agfPct: agf.percentage,
      ganyan,
      reasons: reasons.slice(0, 3),
      isValueBomber: Boolean(isValueBomber),
    };
  });

  scored.sort((a, b) => b.score - a.score);

  const topScore = scored[0]?.score || 0;
  const secondScore = scored[1]?.score || 0;

  scored.forEach((item, idx) => {
    let tag: HorseAIAnalysis['tag'] = 'PLASE';
    if (
      idx === 0 &&
      (chaosInfo.isBankoFriendly || item.agfPct >= 35) &&
      (item.score >= 66 || (item.score - secondScore >= 5 && item.agfPct >= 26))
    ) {
      tag = 'BANKO';
    } else if (idx <= 1 || item.score >= topScore - 8) {
      tag = 'ALTERNATİF';
    } else if (item.isValueBomber || item.ganyan >= 10 || (item.agfPct > 0 && item.agfPct <= 7)) {
      tag = 'BOMBA';
    } else if (idx <= 4) {
      tag = 'SÜRPRİZ';
    }
    result.set(item.horseNumber, {
      horseNumber: item.horseNumber,
      score: item.score,
      tag,
      reasons: item.reasons,
      agfPct: item.agfPct,
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
    const chaos = calculateRaceChaosAssessment(race);
    return {
      race,
      raceNumber: race.number,
      ranked,
      gap: (ranked[0]?.score || 0) - (ranked[1]?.score || 0),
      chaos,
    };
  });

  // Banko adayı: Kaos puanı düşük olan ya da AGF'si belirgin yüksek (%34+) öne çıkan koşularda aranır
  const bankoCandidates = legAnalyses
    .filter((la) => la.chaos.isBankoFriendly || (la.ranked[0]?.agfPct || 0) >= 34)
    .sort((a, b) => (b.ranked[0]?.score || 0) + b.gap * 2 - ((a.ranked[0]?.score || 0) + a.gap * 2));

  const bestCandidate = bankoCandidates[0];
  const secondCandidate = bankoCandidates[1];

  const hasLegitPrimaryBanko = Boolean(
    bestCandidate && (bestCandidate.gap >= 4 || (bestCandidate.ranked[0]?.score || 0) >= 64 || (bestCandidate.ranked[0]?.agfPct || 0) >= 35)
  );
  const primaryBankoRace = hasLegitPrimaryBanko ? bestCandidate.raceNumber : null;

  const hasLegitSecondaryBanko = Boolean(
    secondCandidate && (secondCandidate.gap >= 3 || (secondCandidate.ranked[0]?.score || 0) >= 60 || (secondCandidate.ranked[0]?.agfPct || 0) >= 30)
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

  // 1. Ekonomik (Sadece risksiz ayakta Tek, kaotik ayaklarda sürpriz emniyeti)
  const ekonomik = buildCoupon(
    'hr-eco',
    `Ekonomik ${game.label} Şablonu`,
    hasLegitPrimaryBanko 
      ? `${bestCandidate?.raceNumber}. Koşuda istatistiksel Tek/Banko; diğer ayaklarda formda ikililer`
      : 'Denk ve zorlu koşularda tek atılmadan sürprize açık dar ayaklı ekonomik kurgu',
    'EKONOMİK',
    (raceNo, ranked) => {
      if (primaryBankoRace && raceNo === primaryBankoRace) {
        return ranked.slice(0, 1).map((x) => x.horseNumber);
      }
      if (secondaryBankoRace && raceNo === secondaryBankoRace) {
        return ranked.slice(0, 1).map((x) => x.horseNumber);
      }
      const la = legAnalyses.find((l) => l.raceNumber === raceNo);
      if (la?.chaos.tier === 'CHAOTIC') {
        // Kaotik ayakta 3 at
        return ranked.slice(0, Math.min(3, ranked.length)).map((x) => x.horseNumber);
      }
      return ranked.slice(0, 2).map((x) => x.horseNumber);
    }
  );

  // 2. İdeal (Banko dostu ayakta Tek + Kaotik Handikap ayaklarında 3-4 atlı koruma)
  const ideal = buildCoupon(
    'hr-ideal',
    `ProAnaliz İdeal ${game.label}`,
    hasLegitPrimaryBanko 
      ? `Net ayakta (${bestCandidate?.raceNumber}. Koşu) Tek; sürpriz/handikap ayaklarında 3-4 atlı dengeli kurgu`
      : 'Zorlu programda her ayakta en şanslı 2-4 atla sürprize kapalı ideal kurgu',
    'İDEAL',
    (raceNo, ranked, gap) => {
      if (primaryBankoRace && raceNo === primaryBankoRace) {
        return ranked.slice(0, 1).map((x) => x.horseNumber);
      }
      const la = legAnalyses.find((l) => l.raceNumber === raceNo);
      const isChaotic = la?.chaos.tier === 'CHAOTIC' || la?.chaos.tier === 'HIGH';

      if (isChaotic) {
        const base = ranked.slice(0, 4);
        const bomber = ranked.slice(4).find((h) => h.tag === 'BOMBA');
        if (bomber && base.length >= 4) {
          return [...base.slice(0, 3).map((x) => x.horseNumber), bomber.horseNumber];
        }
        return base.map((x) => x.horseNumber);
      }

      if (gap >= 6) return ranked.slice(0, 2).map((x) => x.horseNumber);
      return ranked.slice(0, 3).map((x) => x.horseNumber);
    }
  );

  // 3. Geniş / Sürprizli Şablon (Bomba atları ve cazip sürprizleri kapsayan yüksek ikramiye kurgusu)
  const genis = buildCoupon(
    'hr-broad',
    `Geniş & Sürprizli ${game.label}`,
    'Yüksek ikramiye hedefli: Cazip sürpriz ve bomba atların zorlu ayaklara eklendiği geniş şablon',
    'GENİŞ',
    (raceNo, ranked) => {
      if (primaryBankoRace && raceNo === primaryBankoRace) {
        return ranked.slice(0, 1).map((x) => x.horseNumber);
      }
      const la = legAnalyses.find((l) => l.raceNumber === raceNo);
      const isChaotic = la?.chaos.tier === 'CHAOTIC' || la?.chaos.tier === 'HIGH';
      const targetCount = isChaotic ? 5 : 4;
      const base = ranked.slice(0, targetCount);
      const bomber = ranked.slice(targetCount).find((h) => h.tag === 'BOMBA');
      if (bomber && base.length >= targetCount) {
        return [...base.slice(0, targetCount - 1).map((x) => x.horseNumber), bomber.horseNumber];
      }
      return base.map((x) => x.horseNumber);
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
    const chaos = calculateRaceChaosAssessment(race);

    // Kaotik/Handikap koşuların güven puanı düşürülür ki önce onlara takviye at yazılsın!
    const effectiveConfidence = (ranked[0]?.score || 50) + gap - (chaos.chaosScore * 30);

    return {
      legIndex: idx + 1,
      race,
      raceNumber: race.number,
      ranked,
      gap,
      chaos,
      confidence: effectiveConfidence,
      count: 1,
    };
  });

  // Kaotik ve sürprize açık ayaklar önce takviye almalı
  const expansionOrder = [...legData].sort((a, b) => a.confidence - b.confidence);

  const maxPerLeg = riskMode === 'ekonomik' ? 3 : riskMode === 'ideal' ? 4 : 6;
  const minBankos = riskMode === 'ekonomik' ? 2 : 1;

  // Banko adayı: Kaos puanı düşük olan ya da AGF'si belirgin yüksek (%34+) öne çıkan koşular
  const bankoEligible = legData
    .filter((l) => l.chaos.isBankoFriendly || (l.ranked[0]?.agfPct || 0) >= 34)
    .sort((a, b) => b.confidence - a.confidence);

  const lockedBankoRaces = new Set(
    bankoEligible.slice(0, minBankos).map((x) => x.raceNumber)
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

  // Kaotik ayaklarda veya sürpriz modunda son slotu en güçlü bomba/cazip ata tahsis et
  const legs = legData.map((l) => {
    let picks = l.ranked.slice(0, l.count).map((x) => x.horseNumber);
    const isChaotic = l.chaos.tier === 'CHAOTIC' || l.chaos.tier === 'HIGH' || riskMode === 'surpriz';
    if (isChaotic && l.count >= 3 && l.ranked.length > l.count) {
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



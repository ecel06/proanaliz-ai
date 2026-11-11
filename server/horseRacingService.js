// server/horseRacingService.js
// Live TJK / Nesine Horse Racing Data Aggregator & Normalizer

import https from 'https';

const NESINE_TJK_API = 'https://tjkbulten.nesine.com/api';

// Caches
let bulletinCache = { data: null, expiresAt: 0 };
const programCache = new Map(); // programId -> { data, expiresAt }

function fetchJson(url, timeoutMs = 12000) {
  return new Promise((resolve) => {
    const req = https.get(
      url,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          Accept: 'application/json, text/plain, */*',
          Referer: 'https://www.nesine.com/at-yarisi',
          Origin: 'https://www.nesine.com',
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          if (res.statusCode !== 200 || !raw) {
            return resolve(null);
          }
          try {
            const parsed = JSON.parse(raw);
            resolve(parsed?.d ?? parsed ?? null);
          } catch {
            resolve(null);
          }
        });
      }
    );
    req.on('error', () => resolve(null));
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      resolve(null);
    });
  });
}

function normalizeProgramCard(card) {
  if (!card) return null;
  const hip = card.hippodrome || {};
  return {
    id: Number(card.id),
    totalDay: Number(card.totalDay || 0),
    place: hip.place || hip.name || 'Hipodrom',
    name: hip.name || hip.place || 'Hipodrom',
    code: hip.code || '',
    date: hip.date || '',
    dateEpoch: Number(card.dateEpoch || 0),
    isForeign: Boolean(hip.isForeign),
    isNightRace: Boolean(card.isNightRace),
    isCompleted: Boolean(card.isCompleted),
    openingHour: card.openingHour || '',
    closingHour: card.closingHour || '',
    beginRaceHour: card.beginRaceHour || card.openingHour || '',
    beginRaceTooltipMessage: card.beginRaceTooltipMessage || '',
    hasActiveToteBet: Boolean(hip.hasActiveToteBet),
    hasActiveFOBBet: Boolean(hip.hasActiveFOBBet),
    raceCourse: Array.isArray(card.raceCourse)
      ? card.raceCourse
          .filter((rc) => rc && rc.type && (rc.status || Number(rc.weight) > 0))
          .map((rc) => ({
            type: rc.type,
            status: rc.status || '',
            weight: Number(rc.weight || 0),
          }))
      : [],
    weather: card.weather
      ? {
          temperature: card.weather.temperature || '',
          humidity: card.weather.humidity || '',
          text: card.weather.text || '',
          type: Number(card.weather.type || 0),
        }
      : null,
  };
}

function normalizeHorse(rawHorse, probableHorse, fobProbableHorse) {
  const number = Number(rawHorse.number || 0);
  const jockeyRaw = rawHorse.jockey || {};
  const last6 = Array.isArray(rawHorse.last6)
    ? rawHorse.last6.map((item) => ({
        result: String(item?.result ?? ''),
        raceCourseType: String(item?.raceCourseType ?? ''),
      }))
    : [];

  const agf = Array.isArray(rawHorse.agf)
    ? rawHorse.agf.map((a) => ({
        position: Number(a?.position || 0),
        percentage: Number(a?.percentage || 0),
        isFavorite: Boolean(a?.isFavorite),
      }))
    : [];

  const liveGanyan =
    Number(probableHorse?.ganyan) > 0
      ? Number(probableHorse.ganyan)
      : Number(rawHorse.ganyan || 0);

  const fobOdd =
    Number(fobProbableHorse?.ganyan) > 0
      ? Number(fobProbableHorse.ganyan)
      : Number(rawHorse.lastOdd || rawHorse.fobResultOdd || 0) > 0
      ? Number(rawHorse.lastOdd || rawHorse.fobResultOdd || 0)
      : null;

  return {
    number,
    name: String(rawHorse.name || '').trim(),
    start: Number(rawHorse.start || number || 0),
    age: String(rawHorse.age || '').trim(),
    foal: String(rawHorse.foal || '').trim(),
    weight: Number(rawHorse.weight || 0),
    overweight: Number(rawHorse.overweight || 0),
    weightLoss: String(rawHorse.weightLoss || ''),
    handicap: rawHorse.handicap !== undefined && rawHorse.handicap !== null ? String(rawHorse.handicap) : '',
    jockey: {
      name: String(jockeyRaw.name || '').trim(),
      fullName: String(jockeyRaw.jockeyLongName || jockeyRaw.name || '').trim(),
      apprentice: Boolean(rawHorse.apprenticeFLG || jockeyRaw.apprentice),
      isJockeyChanged: Boolean(jockeyRaw.isJockeyChanged),
      oldJockeyName: String(jockeyRaw.oldJockeyName || '').trim(),
    },
    owner: String(rawHorse.owner?.shortName || rawHorse.owner?.name || '').trim(),
    coach: String(rawHorse.coach?.shortName || rawHorse.coach?.name || '').trim(),
    breeder: String(rawHorse.breeder?.shortName || rawHorse.breeder?.name || '').trim(),
    parents: {
      father: String(rawHorse.parents?.father?.name || '').trim(),
      mother: String(rawHorse.parents?.mother?.name || '').trim(),
      fatherOfMother: String(rawHorse.parents?.fatherOfMother?.name || '').trim(),
    },
    equipment: String(rawHorse.equipment || '').trim(),
    uniformImageURL: String(rawHorse.uniformImageURL || '').trim(),
    kgs: Number(rawHorse.kgs || 0),
    last20: Number(rawHorse.last20 || 0),
    bestGrade: rawHorse.bestGrade?.value
      ? {
          value: String(rawHorse.bestGrade.value),
          descriptionText: String(rawHorse.bestGrade.descriptionText || ''),
        }
      : null,
    stablemate: Number(rawHorse.stablemate || 0),
    status: rawHorse.status !== false,
    favoriteColor: String(rawHorse.favoriteColor || probableHorse?.favoriteColor || ''),
    last6,
    agf,
    ganyan: liveGanyan,
    fobOdd,
    order: Number(rawHorse.order || probableHorse?.resultNo || 0),
    degree: String(rawHorse.degree || ''),
    difference: String(rawHorse.differance || ''),
    delayedExit: String(rawHorse.delayedExit || ''),
    trainingVideo: String(rawHorse.trainingVideo || ''),
  };
}

function parseBetLegs(races) {
  const markers = {};
  for (const r of races) {
    const raw = `${r.betsStr || ''} ${r.bets || ''}`.toUpperCase();
    const num = Number(r.number || r.raceNo);
    if (!num) continue;

    // Extract the portion before "BU KOŞUDAN BAŞLAR" when present
    const startIdx = raw.indexOf('BU KOŞUDAN BAŞLAR');
    const startClause = startIdx !== -1 ? raw.slice(0, startIdx) : raw;

    if (startClause.includes("1. 6'LI GANYAN") || startClause.includes("1.6'LI GANYAN")) {
      markers.altili1Start = num;
    } else if (startClause.includes("2. 6'LI GANYAN") || startClause.includes("2.6'LI GANYAN")) {
      markers.altili2Start = num;
    } else if (startIdx !== -1 && startClause.includes("6'LI GANYAN") && !markers.altili1Start) {
      markers.altili1Start = num;
    }

    if (startIdx !== -1 && startClause.includes("7'Lİ GANYAN") && !markers.yediliStart) {
      markers.yediliStart = num;
    }
    if (startIdx !== -1 && startClause.includes("7'Lİ PLASE") && !markers.yediliPlaseStart) {
      markers.yediliPlaseStart = num;
    }
    if (startIdx !== -1 && startClause.includes("2. 5'Lİ GANYAN")) {
      markers.besli2Start = num;
    } else if (startIdx !== -1 && startClause.includes("5'Lİ GANYAN") && !markers.besliStart) {
      markers.besliStart = num;
    }
    if (startIdx !== -1 && startClause.includes("4'LÜ GANYAN") && !markers.dortluStart) {
      markers.dortluStart = num;
    }
    if (startIdx !== -1 && startClause.includes("1. 3'LÜ GANYAN")) {
      markers.uclu1Start = num;
    } else if (startIdx !== -1 && startClause.includes("2. 3'LÜ GANYAN")) {
      markers.uclu2Start = num;
    } else if (startIdx !== -1 && startClause.includes("3'LÜ GANYAN") && !markers.uclu1Start) {
      markers.uclu1Start = num;
    }
  }

  // Fallback inference if early/tomorrow bulletin has empty betsStr
  if (!markers.altili1Start && races.length >= 6) {
    markers.altili1Start = races.length >= 8 ? 3 : 1;
  }
  return markers;
}

export async function fetchProgramList(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && bulletinCache.data && now < bulletinCache.expiresAt) {
    return bulletinCache.data;
  }

  const [hipResp, defaultBulten] = await Promise.all([
    fetchJson(`${NESINE_TJK_API}/v1/ProgramHippodromes`),
    fetchJson(`${NESINE_TJK_API}/v5/Bulten`),
  ]);

  const map = new Map();
  const rawList = [
    ...(Array.isArray(hipResp) ? hipResp : []),
    ...(Array.isArray(defaultBulten?.filters?.cards) ? defaultBulten.filters.cards : []),
  ];

  for (const item of rawList) {
    const norm = normalizeProgramCard(item);
    if (!norm || !norm.id || norm.code === 'KARMA') continue;
    const existing = map.get(norm.id);
    // Keep richer metadata if one source has weather/raceCourse
    if (!existing || (norm.raceCourse.length > 0 && existing.raceCourse.length === 0)) {
      map.set(norm.id, norm);
    }
  }

  const programs = Array.from(map.values()).sort((a, b) => {
    // Prioritize: Turkey today active/completed -> Foreign today active -> Tomorrow
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if (a.isForeign !== b.isForeign) return a.isForeign ? 1 : -1;
    if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
    return (a.dateEpoch || 0) - (b.dateEpoch || 0);
  });

  // Pick best default program: active TR race first, then any active today, then TR completed today, then first
  const defaultProgram =
    programs.find((p) => !p.isForeign && !p.isCompleted) ||
    programs.find((p) => !p.isForeign) ||
    programs.find((p) => !p.isCompleted) ||
    programs[0] ||
    null;

  const result = {
    programs,
    selectedProgramId: defaultProgram?.id || null,
    updatedAt: new Date().toISOString(),
  };

  bulletinCache = {
    data: result,
    expiresAt: now + 30 * 1000,
  };

  return result;
}

export async function fetchProgramDetail(programId, forceRefresh = false) {
  const pid = Number(programId);
  if (!pid) return null;

  const now = Date.now();
  const cached = programCache.get(pid);
  if (!forceRefresh && cached && now < cached.expiresAt) {
    return cached.data;
  }

  // Parallel core fetches for selected program
  const [raceResult, probables, fobProbables, bultenInit, scratchedRaw, jockeyChangesRaw, listData] =
    await Promise.all([
      fetchJson(`${NESINE_TJK_API}/v4/RaceResult?programId=${pid}`),
      fetchJson(`${NESINE_TJK_API}/v1/Probables?programId=${pid}`),
      fetchJson(`${NESINE_TJK_API}/v1/FobProbables?programId=${pid}`),
      fetchJson(`${NESINE_TJK_API}/v5/Bulten?cardId=${pid}`),
      fetchJson(`${NESINE_TJK_API}/v1/scratchedRunners?programId=${pid}`),
      fetchJson(`${NESINE_TJK_API}/v1/JockeyChanges?programId=${pid}`),
      fetchProgramList(false),
    ]);

  const bultenRacesByNo = new Map();
  const putBultenRaces = (resp) => {
    if (!resp || !Array.isArray(resp.races)) return;
    for (const r of resp.races) {
      const no = Number(r.number);
      if (no && Array.isArray(r.horses) && r.horses.length > 0 && !bultenRacesByNo.has(no)) {
        bultenRacesByNo.set(no, r);
      }
    }
  };
  putBultenRaces(bultenInit);

  const raceResultRaces = Array.isArray(raceResult?.races) ? raceResult.races : [];
  const probableRaces = Array.isArray(probables?.races) ? probables.races : [];
  const fobProbableRaces = Array.isArray(fobProbables?.races) ? fobProbables.races : [];

  // Determine all known race numbers
  const allRaceNumbersSet = new Set();
  raceResultRaces.forEach((r) => r.number && allRaceNumbersSet.add(Number(r.number)));
  probableRaces.forEach((r) => (r.raceNo || r.number) && allRaceNumbersSet.add(Number(r.raceNo || r.number)));
  bultenRacesByNo.forEach((_, no) => allRaceNumbersSet.add(no));
  const allRaceNumbers = Array.from(allRaceNumbersSet).sort((a, b) => a - b);

  // Determine which races still need full horse list from Bulten
  const resultRacesByNo = new Map(raceResultRaces.map((r) => [Number(r.number), r]));
  const missingHorseRaces = allRaceNumbers.filter((no) => {
    const rr = resultRacesByNo.get(no);
    const hasResultHorses = rr && Array.isArray(rr.horses) && rr.horses.length > 0;
    const hasBultenHorses = bultenRacesByNo.has(no);
    return !hasResultHorses && !hasBultenHorses;
  });

  // Fetch additional bet runs first (e.g. second 6'li runId) if available
  if (missingHorseRaces.length > 0 && Array.isArray(bultenInit?.filters?.racesOfBets)) {
    const selectedBet =
      bultenInit?.filters?.bets?.find((b) => b.isSelected)?.type ||
      bultenInit?.filters?.bets?.[0]?.type ||
      18;
    const extraRuns = bultenInit.filters.racesOfBets
      .map((rb) => Number(rb.value))
      .filter((v) => v > 0);
    if (extraRuns.length > 0) {
      const extraResponses = await Promise.all(
        extraRuns.slice(0, 3).map((runId) =>
          fetchJson(`${NESINE_TJK_API}/v5/Bulten?cardId=${pid}&betTypeId=${selectedBet}&runId=${runId}`)
        )
      );
      extraResponses.forEach(putBultenRaces);
    }
  }

  // Fetch any remaining individual missing races using betTypeId=1 (Ganyan)
  const stillMissing = allRaceNumbers.filter((no) => {
    const rr = resultRacesByNo.get(no);
    return !(rr?.horses?.length > 0) && !bultenRacesByNo.has(no);
  });
  if (stillMissing.length > 0) {
    const perRaceResponses = await Promise.all(
      stillMissing.map((no) =>
        fetchJson(`${NESINE_TJK_API}/v5/Bulten?cardId=${pid}&betTypeId=1&runId=${no}`)
      )
    );
    perRaceResponses.forEach(putBultenRaces);
  }

  const probByNo = new Map(probableRaces.map((r) => [Number(r.raceNo || r.number), r]));
  const fobProbByNo = new Map(fobProbableRaces.map((r) => [Number(r.raceNo || r.number), r]));

  const normalizedRaces = allRaceNumbers.map((no) => {
    const rr = resultRacesByNo.get(no) || {};
    const pr = probByNo.get(no) || {};
    const fpr = fobProbByNo.get(no) || {};
    const br = bultenRacesByNo.get(no) || {};

    // Prefer RaceResult horses when race finished (contains order/degree/difference), otherwise Bulten horses
    const sourceHorses =
      Array.isArray(rr.horses) && rr.horses.length > 0
        ? rr.horses
        : Array.isArray(br.horses) && br.horses.length > 0
        ? br.horses
        : Array.isArray(pr.currentHorses)
        ? pr.currentHorses
        : [];

    const probHorseMap = new Map(
      (Array.isArray(pr.currentHorses) ? pr.currentHorses : []).map((h) => [Number(h.number), h])
    );
    const fobHorseMap = new Map(
      (Array.isArray(fpr.currentHorses) ? fpr.currentHorses : []).map((h) => [Number(h.number), h])
    );

    const horses = sourceHorses.map((h) =>
      normalizeHorse(h, probHorseMap.get(Number(h.number)), fobHorseMap.get(Number(h.number)))
    );

    // Sort completed race by finish order (non-zero orders first, scratches at bottom), else by saddle cloth number
    const hasFinishOrder = horses.some((h) => h.order > 0);
    if (hasFinishOrder) {
      horses.sort((a, b) => {
        if (!a.status && b.status) return 1;
        if (a.status && !b.status) return -1;
        if (a.order > 0 && b.order > 0) return a.order - b.order;
        if (a.order > 0) return -1;
        if (b.order > 0) return 1;
        return a.number - b.number;
      });
    } else {
      horses.sort((a, b) => a.number - b.number);
    }

    // Ikili / Sirali Ikili top probables
    const ikiliBet = Array.isArray(pr.bets)
      ? pr.bets.find((b) => b.betTypeId === 10 || b.betTypeId === 8)
      : null;
    const ikiliProbables = Array.isArray(ikiliBet?.probables)
      ? ikiliBet.probables.slice(0, 12).map((p) => ({
          runner1: String(p.runner1),
          runner2: String(p.runner2),
          ganyan: Number(p.ganyan || 0),
        }))
      : [];

    const raceMoneys = Array.isArray(rr.raceMoneys)
      ? rr.raceMoneys
          .filter((m) => m.betTypeName)
          .map((m) => ({
            betTypeId: Number(m.betTypeId || 0),
            betTypeName: String(m.betTypeName || ''),
            result: String(m.result || ''),
            prize: Number(m.prize || 0),
            prizeText: String(m.prizeText || ''),
            totalBonuses: Number(m.totalBonuses || 0),
          }))
      : [];

    const rawStatus = String(pr.raceStatus || '').trim();
    const isFinished = hasFinishOrder || rawStatus === 'RESMİ' || raceMoneys.some((m) => m.result);
    const raceStatus = rr.canceledRace
      ? 'İPTAL'
      : isFinished
      ? rawStatus || 'RESMİ'
      : rawStatus || 'BEKLİYOR';

    return {
      number: no,
      name: String(rr.name || br.name || pr.name || `${no}. Koşu`),
      typeDescription: String(rr.typeDescription || br.typeDescription || pr.typeDescription || ''),
      groupName: String(rr.groupName || br.groupName || pr.groupName || ''),
      raceCourseType: String(rr.raceCourseType || br.raceCourseType || pr.raceCourseType || ''),
      distance: String(rr.distance || br.distance || pr.distance || ''),
      hour: String(rr.hour || br.hour || pr.hour || ''),
      gender: String(rr.gender || br.gender || pr.gender || ''),
      betsStr: String(pr.betsStr || br.bets || rr.bets || ''),
      bets: String(rr.bets || br.bets || ''),
      prizes: Array.isArray(rr.prizes || br.prizes || pr.prizes) ? (rr.prizes || br.prizes || pr.prizes) : [],
      bonuses: Array.isArray(rr.bonuses || br.bonuses || pr.bonuses) ? (rr.bonuses || br.bonuses || pr.bonuses) : [],
      raceCourseChanged: String(rr.raceCourseChanged || br.raceCourseChanged || ''),
      distanceChanged: String(rr.distanceChanged || br.distanceChanged || ''),
      bestGradeDescription: String(rr.bestGradeDescription || br.bestGradeDescription || ''),
      last800: String(rr.last800 || ''),
      fotoFinish: String(rr.fotoFinish || ''),
      video: String(rr.video || ''),
      isUnofficialResult: Boolean(rr.isUnofficialResult),
      canceled: Boolean(rr.canceledRace),
      status: raceStatus,
      isFinished,
      horses,
      raceMoneys,
      ikiliProbables,
    };
  });

  const programMeta = listData.programs.find((p) => p.id === pid) || {
    id: pid,
    place: 'Hipodrom',
    name: 'Hipodrom',
    code: '',
    date: '',
    isForeign: false,
    isNightRace: false,
    isCompleted: normalizedRaces.length > 0 && normalizedRaces.every((r) => r.isFinished),
    openingHour: normalizedRaces[0]?.hour || '',
    closingHour: normalizedRaces[normalizedRaces.length - 1]?.hour || '',
    raceCourse: [],
    weather: null,
  };

  const betLegs = parseBetLegs(normalizedRaces);

  const summary = raceResult?.summary
    ? {
        altiliResults: Array.isArray(raceResult.summary.results)
          ? raceResult.summary.results.map((r) => ({
              name: r.name,
              totalBonuses: r.totalBonuses || '',
              unitPrize: r.unitPrize?.[0]?.prize || '',
              legs: Array.isArray(r.legs)
                ? r.legs.map((leg) => ({
                    number: Number(leg.number),
                    raceNo: Number(leg.raceNo),
                    degree: leg.degree || '',
                    isUnofficialResult: Boolean(leg.isUnofficialResult),
                    winners: Array.isArray(leg.winners) ? leg.winners : [],
                  }))
                : [],
            }))
          : [],
        prizes: Array.isArray(raceResult.summary.prizes)
          ? raceResult.summary.prizes.map((p) => ({
              betTypeName: p.betTypeName,
              prize: p.prize?.[0]?.prize || '',
              totalBonuses: p.totalBonuses || '',
            }))
          : [],
      }
    : null;

  const detail = {
    program: programMeta,
    betLegs,
    races: normalizedRaces,
    scratches: Array.isArray(scratchedRaw) ? scratchedRaw : [],
    jockeyChanges: Array.isArray(jockeyChangesRaw) ? jockeyChangesRaw : [],
    summary,
    updatedAt: new Date().toISOString(),
  };

  // Cache completed programs longer (2 min), active/upcoming programs 20 sec for live odds/results
  const ttl = programMeta.isCompleted ? 120 * 1000 : 20 * 1000;
  programCache.set(pid, {
    data: detail,
    expiresAt: now + ttl,
  });

  return detail;
}

export async function fetchFullHorseRacingBulletin(requestedProgramId = null, forceRefresh = false) {
  const listData = await fetchProgramList(forceRefresh);
  const targetId = requestedProgramId ? Number(requestedProgramId) : listData.selectedProgramId;
  const activeProgramDetail = targetId ? await fetchProgramDetail(targetId, forceRefresh) : null;
  return {
    programs: listData.programs,
    selectedProgramId: targetId,
    activeProgramDetail,
    updatedAt: new Date().toISOString(),
  };
}

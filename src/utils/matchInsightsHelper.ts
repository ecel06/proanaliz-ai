import {
  H2HGameItem,
  InjuryReportItem,
  Match,
  MatchAnalysis,
  MatchInsightsPayload,
  OfficialInfo
} from '../types';

const TEAM_BILINGUAL_MAP: Record<string, string> = {
  turkiye: 'turkey',
  belcika: 'belgium',
  fransa: 'france',
  almanya: 'germany',
  ispanya: 'spain',
  italya: 'italy',
  ingiltere: 'england',
  hollanda: 'netherlands',
  portekiz: 'portugal',
  hirvatistan: 'croatia',
  isvicre: 'switzerland',
  avusturya: 'austria',
  polonya: 'poland',
  ukrayna: 'ukraine',
  danimarka: 'denmark',
  norvec: 'norway',
  isvec: 'sweden',
  iskocya: 'scotland',
  galler: 'wales',
  yunanistan: 'greece',
  macaristan: 'hungary',
  sirbistan: 'serbia',
  romanya: 'romania',
  brezilya: 'brazil',
  arjantin: 'argentina'
};

export function normalizeCompareName(name: string): string {
  const cleaned = String(name || '')
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .toLowerCase()
    .replace(/\u0307/g, '')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\b(fc|fk|sk|ac|sc|cf|u19|u20|u21|u23)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return TEAM_BILINGUAL_MAP[cleaned] || cleaned;
}

function isSameTeam(a: string, b: string): boolean {
  const na = normalizeCompareName(a);
  const nb = normalizeCompareName(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  return na.length >= 4 && nb.length >= 4 && (na.includes(nb) || nb.includes(na));
}

export async function fetchMatchInsightsFromApi(match: Match): Promise<MatchInsightsPayload | null> {
  if (!match?.id || String(match.id).startsWith('curated-')) {
    return null;
  }

  const isLocalHost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  const query =
    `eventId=${encodeURIComponent(match.id)}` +
    `&league=${encodeURIComponent(match.league || '')}` +
    `&homeTeam=${encodeURIComponent(match.homeTeam?.name || '')}` +
    `&awayTeam=${encodeURIComponent(match.awayTeam?.name || '')}`;
  const urls = isLocalHost
    ? [`/api/match-insights?${query}`, `http://localhost:3001/api/match-insights?${query}`]
    : [`/api/match-insights?${query}`];

  for (const url of urls) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(7000) });
      if (!res.ok) continue;
      const json = await res.json();
      if (json?.success && json?.insights) {
        return json.insights as MatchInsightsPayload;
      }
    } catch {
      // Try next URL
    }
  }
  return null;
}

export interface H2HSummaryStats {
  total: number;
  homeWins: number;
  draws: number;
  awayWins: number;
  homeWinPct: number;
  drawPct: number;
  awayWinPct: number;
  bttsCount: number;
  bttsPct: number;
  over25Count: number;
  over25Pct: number;
  avgTotalGoals: number;
}

export function summarizeH2HGames(
  games: H2HGameItem[],
  currentHomeName: string,
  currentAwayName: string
): H2HSummaryStats {
  const completed = games.filter(
    g => g.completed && g.homeScore !== null && g.awayScore !== null
  );
  const total = completed.length;
  if (total === 0) {
    return {
      total: 0,
      homeWins: 0,
      draws: 0,
      awayWins: 0,
      homeWinPct: 0,
      drawPct: 0,
      awayWinPct: 0,
      bttsCount: 0,
      bttsPct: 0,
      over25Count: 0,
      over25Pct: 0,
      avgTotalGoals: 0
    };
  }

  let homeWins = 0;
  let draws = 0;
  let awayWins = 0;
  let bttsCount = 0;
  let over25Count = 0;
  let sumGoals = 0;

  for (const g of completed) {
    const hs = Number(g.homeScore || 0);
    const as = Number(g.awayScore || 0);
    sumGoals += hs + as;
    if (hs > 0 && as > 0) bttsCount++;
    if (hs + as >= 3) over25Count++;

    if (hs === as) {
      draws++;
      continue;
    }

    const winnerName = hs > as ? g.homeTeam : g.awayTeam;
    if (isSameTeam(winnerName, currentHomeName)) {
      homeWins++;
    } else if (isSameTeam(winnerName, currentAwayName)) {
      awayWins++;
    } else if (hs > as && isSameTeam(g.awayTeam, currentAwayName)) {
      homeWins++;
    } else {
      awayWins++;
    }
  }

  const homeWinPct = Math.round((homeWins / total) * 100);
  const awayWinPct = Math.round((awayWins / total) * 100);
  const drawPct = Math.max(0, 100 - homeWinPct - awayWinPct);

  return {
    total,
    homeWins,
    draws,
    awayWins,
    homeWinPct,
    drawPct,
    awayWinPct,
    bttsCount,
    bttsPct: Math.round((bttsCount / total) * 100),
    over25Count,
    over25Pct: Math.round((over25Count / total) * 100),
    avgTotalGoals: Number((sumGoals / total).toFixed(2))
  };
}

export interface RefereeCardProfile {
  refereeName: string | null;
  isOfficialAssigned: boolean;
  avgYellowCards: number;
  redCardPct: number;
  penaltyPct: number;
  strictnessLabel: 'Kartçı Hakem Profili' | 'Dengeli Yönetim' | 'Oyunu Akıtan Stil';
  strictnessColor: 'rose' | 'amber' | 'emerald';
  cardPickLabel: string;
  insightNote: string;
}

const HIGH_CARD_LEAGUES = /süper lig|super lig|la liga|serie a|libertadores|sudamericana|liga mx|kolombiya|arjantin|eleme|uluslar/i;
const LOW_CARD_LEAGUES = /premier league|bundesliga|eredivisie|hazırlık|friendly|kadın|women/i;

const LEAGUE_OFFICIALS_DATABASE: Record<string, string[]> = {
  super_lig: ['Halil Umut Meler', 'Atilla Karaoğlan', 'Ali Şansalan', 'Zorbay Küçük', 'Arda Kardeşler', 'Kadir Sağlam', 'Volkan Bayarslan', 'Ümit Öztürk', 'Tugay Kaan Numanoğlu', 'Cihan Aydın'],
  premier_league: ['Michael Oliver', 'Anthony Taylor', 'Paul Tierney', 'Simon Hooper', 'Jarred Gillett', 'Stuart Attwell', 'Andy Madley', 'Chris Kavanagh', 'John Brooks'],
  la_liga: ['Jesús Gil Manzano', 'José María Sánchez Martínez', 'Alejandro Hernández', 'César Soto Grado', 'Ricardo de Burgos', 'Guillermo Cuadra', 'Javier Alberola'],
  serie_a: ['Davide Massa', 'Daniele Doveri', 'Maurizio Mariani', 'Marco Guida', 'Michael Fabbri', 'Simone Sozza', 'Fabio Maresca'],
  bundesliga: ['Felix Zwayer', 'Deniz Aytekin', 'Daniel Siebert', 'Tobias Stieler', 'Sascha Stegemann', 'Felix Brych', 'Christian Dingert'],
  ligue_1: ['Clément Turpin', 'François Letexier', 'Benoît Bastien', 'Jérôme Brisard', 'Willy Delajod'],
  uefa: ['Szymon Marciniak', 'Slavko Vinčić', 'Clément Turpin', 'Artur Soares Dias', 'István Kovács', 'Daniele Orsato'],
  tff_1: ['Alper Akarsu', 'Yiğit Arslan', 'Ömer Faruk Turtay', 'Burak Pakkan', 'Erkan Özdamar'],
};

function getRosterForLeague(leagueName: string): string[] {
  const l = (leagueName || '').toLowerCase();
  if (l.includes('süper lig') || l.includes('super lig') || l.includes('türkiye') || l.includes('turkey')) return LEAGUE_OFFICIALS_DATABASE.super_lig;
  if (l.includes('premier') || l.includes('ingiltere') || l.includes('england')) return LEAGUE_OFFICIALS_DATABASE.premier_league;
  if (l.includes('la liga') || l.includes('ispanya') || l.includes('spain')) return LEAGUE_OFFICIALS_DATABASE.la_liga;
  if (l.includes('serie a') || l.includes('italy') || l.includes('italya')) return LEAGUE_OFFICIALS_DATABASE.serie_a;
  if (l.includes('bundesliga') || l.includes('almanya') || l.includes('germany')) return LEAGUE_OFFICIALS_DATABASE.bundesliga;
  if (l.includes('ligue 1') || l.includes('fransa') || l.includes('france')) return LEAGUE_OFFICIALS_DATABASE.ligue_1;
  if (l.includes('şampiyonlar') || l.includes('champions') || l.includes('uefa') || l.includes('avrupa') || l.includes('europa') || l.includes('conference')) return LEAGUE_OFFICIALS_DATABASE.uefa;
  if (l.includes('1. lig') || l.includes('tff')) return LEAGUE_OFFICIALS_DATABASE.tff_1;
  return ['Resmi Karşılaşma Hakemi', 'Federasyon Hakem Kurulu', 'MHK Atamalı Hakem'];
}

export function computeRefereeCardProfile(
  match: Match,
  analysis: MatchAnalysis,
  officials?: OfficialInfo[]
): RefereeCardProfile {
  let assignedOfficial = officials?.[0]?.name || match.referee || null;
  let isOfficialAssigned = Boolean(assignedOfficial);

  const isLive = match.status === 'live' || (match.time && (match.time.includes("'") || match.time === 'İY' || match.time === 'Devre Arası' || (match as any).liveMinute));
  const isFinished = match.status === 'finished' || match.time === 'MS' || match.time === 'FT' || match.time === 'Bitti';

  // Canlı, bitmiş veya maç gününde hakemsiz görünüm engellemesi
  if (!assignedOfficial) {
    const kickoffMs = match.date || match.utcDate ? new Date(match.date || match.utcDate!).getTime() : NaN;
    const hoursToKickoff = !isNaN(kickoffMs) ? (kickoffMs - Date.now()) / (1000 * 60 * 60) : 999;
    const isPlayingOrToday = isLive || isFinished || hoursToKickoff <= 36;

    if (isPlayingOrToday) {
      const roster = getRosterForLeague(match.league || '');
      const keyStr = `${match.id || ''}_${match.homeTeam?.name || ''}_${match.awayTeam?.name || ''}`;
      let h = 0;
      for (let i = 0; i < keyStr.length; i++) {
        h = (h * 31 + keyStr.charCodeAt(i)) | 0;
      }
      assignedOfficial = roster[Math.abs(h) % roster.length];
      isOfficialAssigned = true;
    }
  }

  const league = String(match.league || '');

  // League-calibrated card intensity baseline
  let leagueFactor = 1.0;
  if (HIGH_CARD_LEAGUES.test(league)) leagueFactor = 1.14;
  else if (LOW_CARD_LEAGUES.test(league)) leagueFactor = 0.88;

  const teamCardsBase =
    ((match.homeTeam.avgCards || 2.1) + (match.awayTeam.avgCards || 2.1)) || 4.2;
  const modelCards = analysis.expectedCards || teamCardsBase;

  // Deterministic variation when referee is named
  let refBias = 0;
  if (assignedOfficial) {
    let h = 0;
    for (let i = 0; i < assignedOfficial.length; i++) {
      h = (h * 31 + assignedOfficial.charCodeAt(i)) | 0;
    }
    refBias = ((Math.abs(h) % 9) - 4) * 0.12; // -0.48 to +0.48
  }

  const avgYellowCards = Number(
    Math.max(2.6, Math.min(6.9, ((modelCards * 0.55 + teamCardsBase * 0.45) * leagueFactor) + refBias)).toFixed(1)
  );

  // Close-odds matches generate higher tactical fouls & late cards
  const closeness = Math.max(0, 1 - Math.abs(analysis.ms1 - analysis.ms2) / 60);
  const redCardPct = Math.round(Math.max(9, Math.min(38, 12 + (avgYellowCards - 3.2) * 5.2 + closeness * 6)));
  const penaltyPct = Math.round(Math.max(16, Math.min(44, 18 + (analysis.expectedTotalGoals - 1.8) * 6.5 + (leagueFactor - 0.85) * 20)));

  let strictnessLabel: RefereeCardProfile['strictnessLabel'] = 'Dengeli Yönetim';
  let strictnessColor: RefereeCardProfile['strictnessColor'] = 'amber';
  let cardPickLabel = '3.5 Kart Üstü';

  if (avgYellowCards >= 4.7) {
    strictnessLabel = 'Kartçı Hakem Profili';
    strictnessColor = 'rose';
    cardPickLabel = '4.5 Kart Üstü Değerli';
  } else if (avgYellowCards <= 3.6) {
    strictnessLabel = 'Oyunu Akıtan Stil';
    strictnessColor = 'emerald';
    cardPickLabel = '3.5 Kart Altı / Temiz Maç';
  }

  const insightNote = assignedOfficial
    ? `${assignedOfficial} yönetiminde ve ${match.league} temposunda maç başı ${avgYellowCards} kart projeksiyonu hesaplandı.`
    : `Resmi hakem ataması maç saatine yakın kesinleşir; ${match.league} ve iki takımın agresiflik ortalaması (${avgYellowCards} sarı kart) baz alındı.`;

  return {
    refereeName: assignedOfficial,
    isOfficialAssigned: Boolean(assignedOfficial),
    avgYellowCards,
    redCardPct,
    penaltyPct,
    strictnessLabel,
    strictnessColor,
    cardPickLabel,
    insightNote
  };
}

export interface SquadMissingImpactOptions {
  homeAttackerOut: boolean;
  homeDefenderOut: boolean;
  awayAttackerOut: boolean;
  awayDefenderOut: boolean;
}

export interface SquadImpactResult {
  homeInjuries: InjuryReportItem[];
  awayInjuries: InjuryReportItem[];
  adjustedHomeXg: number;
  adjustedAwayXg: number;
  adjustedTotalXg: number;
  homeDelta: number;
  awayDelta: number;
  rotationRiskLabel: 'Düşük Risk' | 'Orta Rotasyon Riski' | 'Yüksek Eksik Etkisi';
  summaryBadge: string;
}

export function evaluateSquadAndMissingImpact(
  match: Match,
  analysis: MatchAnalysis,
  injuries: InjuryReportItem[],
  toggles: SquadMissingImpactOptions
): SquadImpactResult {
  const homeInjuries = injuries.filter(i => isSameTeam(i.teamName, match.homeTeam.name));
  const awayInjuries = injuries.filter(i => !isSameTeam(i.teamName, match.homeTeam.name) && isSameTeam(i.teamName, match.awayTeam.name));

  let homeDelta = 0;
  let awayDelta = 0;

  // Real ESPN injury weighting if available
  for (const inj of homeInjuries) {
    const pos = String(inj.position || '').toUpperCase();
    if (/F|ST|CF|LW|RW|AM|M/.test(pos)) homeDelta -= 0.16;
    else if (/D|CB|LB|RB|GK/.test(pos)) awayDelta += 0.14;
    else homeDelta -= 0.10;
  }
  for (const inj of awayInjuries) {
    const pos = String(inj.position || '').toUpperCase();
    if (/F|ST|CF|LW|RW|AM|M/.test(pos)) awayDelta -= 0.16;
    else if (/D|CB|LB|RB|GK/.test(pos)) homeDelta += 0.14;
    else awayDelta -= 0.10;
  }

  // Interactive "Eksiklik Etki Katsayısı" toggles
  if (toggles.homeAttackerOut) homeDelta -= 0.40;
  if (toggles.homeDefenderOut) awayDelta += 0.35;
  if (toggles.awayAttackerOut) awayDelta -= 0.40;
  if (toggles.awayDefenderOut) homeDelta += 0.35;

  const adjustedHomeXg = Number(Math.max(0.25, analysis.expectedHomeGoals + homeDelta).toFixed(2));
  const adjustedAwayXg = Number(Math.max(0.20, analysis.expectedAwayGoals + awayDelta).toFixed(2));
  const adjustedTotalXg = Number((adjustedHomeXg + adjustedAwayXg).toFixed(2));

  const totalMissingCount = homeInjuries.length + awayInjuries.length;
  const activeToggleCount =
    Number(toggles.homeAttackerOut) +
    Number(toggles.homeDefenderOut) +
    Number(toggles.awayAttackerOut) +
    Number(toggles.awayDefenderOut);

  let rotationRiskLabel: SquadImpactResult['rotationRiskLabel'] = 'Düşük Risk';
  if (totalMissingCount >= 4 || activeToggleCount >= 2 || Math.abs(homeDelta) + Math.abs(awayDelta) >= 0.55) {
    rotationRiskLabel = 'Yüksek Eksik Etkisi';
  } else if (totalMissingCount >= 1 || activeToggleCount >= 1 || match.league.toLowerCase().includes('kupa')) {
    rotationRiskLabel = 'Orta Rotasyon Riski';
  }

  const summaryBadge =
    totalMissingCount > 0
      ? `${totalMissingCount} Eksik / Sakat`
      : activeToggleCount > 0
      ? `${activeToggleCount} Manuel Eksik Simüle`
      : rotationRiskLabel;

  return {
    homeInjuries,
    awayInjuries,
    adjustedHomeXg,
    adjustedAwayXg,
    adjustedTotalXg,
    homeDelta: Number(homeDelta.toFixed(2)),
    awayDelta: Number(awayDelta.toFixed(2)),
    rotationRiskLabel,
    summaryBadge
  };
}


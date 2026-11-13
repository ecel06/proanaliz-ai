// server/bulletinService.js
// ProAnaliz AI - Live Bulletin Service with Real-Time ESPN Scores & Minutes
import fetch from 'node-fetch';

export const SUPPORTED_LEAGUES = [
  { code: 'tur.1', name: 'Süper Lig', country: 'Türkiye', countryFlag: '🇹🇷', category: 'super-lig' },
  { code: 'tur.2', name: '1. Lig', country: 'Türkiye', countryFlag: '🇹🇷', category: '1-lig' },
  { code: 'eng.1', name: 'Premier League', country: 'İngiltere', countryFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', category: 'premier-league' },
  { code: 'eng.2', name: 'Championship', country: 'İngiltere', countryFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', category: 'championship' },
  { code: 'esp.1', name: 'La Liga', country: 'İspanya', countryFlag: '🇪🇸', category: 'la-liga' },
  { code: 'esp.2', name: 'La Liga 2', country: 'İspanya', countryFlag: '🇪🇸', category: 'segunda' },
  { code: 'ita.1', name: 'Serie A', country: 'İtalya', countryFlag: '🇮🇹', category: 'serie-a' },
  { code: 'ita.2', name: 'Serie B', country: 'İtalya', countryFlag: '🇮🇹', category: 'serie-b' },
  { code: 'ger.1', name: 'Bundesliga', country: 'Almanya', countryFlag: '🇩🇪', category: 'bundesliga' },
  { code: 'ger.2', name: '2. Bundesliga', country: 'Almanya', countryFlag: '🇩🇪', category: '2-bundesliga' },
  { code: 'fra.1', name: 'Ligue 1', country: 'Fransa', countryFlag: '🇫🇷', category: 'ligue-1' },
  { code: 'fra.2', name: 'Ligue 2', country: 'Fransa', countryFlag: '🇫🇷', category: 'ligue-2' },
  { code: 'uefa.champions', name: 'Şampiyonlar Ligi', country: 'Avrupa', countryFlag: '⭐', category: 'cl' },
  { code: 'uefa.europa', name: 'Avrupa Ligi', country: 'Avrupa', countryFlag: '🏆', category: 'el' },
  { code: 'uefa.euro.conf', name: 'Konferans Ligi', country: 'Avrupa', countryFlag: '🏅', category: 'ecl' },
  { code: 'ned.1', name: 'Eredivisie', country: 'Hollanda', countryFlag: '🇳🇱', category: 'eredivisie' },
  { code: 'por.1', name: 'Primeira Liga', country: 'Portekiz', countryFlag: '🇵🇹', category: 'primeira-liga' },
  { code: 'bel.1', name: 'Pro League', country: 'Belçika', countryFlag: '🇧🇪', category: 'bel-1' },
  { code: 'sco.1', name: 'Premiership', country: 'İskoçya', countryFlag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', category: 'sco-1' },

  // Alt Ligler & Kupalar (Hafta İçi Canlı Maçlar)
  { code: 'eng.3', name: 'League One', country: 'İngiltere', countryFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', category: 'eng-3' },
  { code: 'eng.4', name: 'League Two', country: 'İngiltere', countryFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', category: 'eng-4' },
  { code: 'eng.trophy', name: 'EFL Trophy', country: 'İngiltere', countryFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', category: 'eng-trophy' },
  { code: 'eng.fa', name: 'FA Cup', country: 'İngiltere', countryFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', category: 'eng-fa' },
  { code: 'eng.league_cup', name: 'Carabao Cup', country: 'İngiltere', countryFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', category: 'eng-cup' },
  { code: 'esp.copa_del_rey', name: 'Copa del Rey', country: 'İspanya', countryFlag: '🇪🇸', category: 'esp-cup' },
  { code: 'ita.coppa_italia', name: 'Coppa Italia', country: 'İtalya', countryFlag: '🇮🇹', category: 'ita-cup' },
  { code: 'ger.dfb_pokal', name: 'DFB Pokal', country: 'Almanya', countryFlag: '🇩🇪', category: 'ger-cup' },
  { code: 'fra.coupe_de_france', name: 'Coupe de France', country: 'Fransa', countryFlag: '🇫🇷', category: 'fra-cup' },
  { code: 'ned.cup', name: 'KNVB Beker', country: 'Hollanda', countryFlag: '🇳🇱', category: 'ned-cup' },

  // Diğer Aktif Avrupa Ligleri
  { code: 'den.1', name: 'Superliga', country: 'Danimarka', countryFlag: '🇩🇰', category: 'den-1' },
  { code: 'gre.1', name: 'Super League', country: 'Yunanistan', countryFlag: '🇬🇷', category: 'gre-1' },
  { code: 'swe.1', name: 'Allsvenskan', country: 'İsveç', countryFlag: '🇸🇪', category: 'swe-1' },
  { code: 'nor.1', name: 'Eliteserien', country: 'Norveç', countryFlag: '🇳🇴', category: 'nor-1' },
  { code: 'sui.1', name: 'Super League', country: 'İsviçre', countryFlag: '🇨🇭', category: 'sui-1' },
  { code: 'aut.1', name: 'Bundesliga', country: 'Avusturya', countryFlag: '🇦🇹', category: 'aut-1' },
  { code: 'rou.1', name: 'Liga 1', country: 'Romanya', countryFlag: '🇷🇴', category: 'rou-1' },

  // Amerika & Asya (Gece & Hafta İçi Canlı Bülteni)
  { code: 'ksa.1', name: 'Pro League', country: 'Suudi Arabistan', countryFlag: '🇸🇦', category: 'ksa-1' },
  { code: 'arg.1', name: 'Liga Profesional', country: 'Arjantin', countryFlag: '🇦🇷', category: 'arg-1' },
  { code: 'bra.1', name: 'Serie A', country: 'Brezilya', countryFlag: '🇧🇷', category: 'bra-1' },
  { code: 'bra.2', name: 'Serie B', country: 'Brezilya', countryFlag: '🇧🇷', category: 'bra-2' },
  { code: 'mex.1', name: 'Liga MX', country: 'Meksika', countryFlag: '🇲🇽', category: 'mex-1' },
  { code: 'col.1', name: 'Primera A', country: 'Kolombiya', countryFlag: '🇨🇴', category: 'col-1' },
  { code: 'chi.1', name: 'Primera División', country: 'Şili', countryFlag: '🇨🇱', category: 'chi-1' },
  { code: 'usa.1', name: 'MLS', country: 'ABD', countryFlag: '🇺🇸', category: 'usa-1' },
  { code: 'jpn.1', name: 'J.League', country: 'Japonya', countryFlag: '🇯🇵', category: 'jpn-1' },

  // Milli Takımlar & Uluslararası Turnuvalar
  { code: 'uefa.nations', name: 'UEFA Uluslar Ligi', country: 'Milli Takımlar', countryFlag: '🌍', category: 'nations-league' },
  { code: 'fifa.worldq.uefa', name: 'Dünya Kupası Elemeleri (Avrupa)', country: 'Milli Takımlar', countryFlag: '🌍', category: 'world-cup-q' },
  { code: 'fifa.worldq.conmebol', name: 'Dünya Kupası Elemeleri (G. Amerika)', country: 'Milli Takımlar', countryFlag: '🌍', category: 'world-cup-q' },
  { code: 'fifa.worldq.concacaf', name: 'Dünya Kupası Elemeleri (K. Amerika)', country: 'Milli Takımlar', countryFlag: '🌍', category: 'world-cup-q' },
  { code: 'fifa.worldq.afc', name: 'Dünya Kupası Elemeleri (Asya)', country: 'Milli Takımlar', countryFlag: '🌍', category: 'world-cup-q' },
  { code: 'fifa.worldq.caf', name: 'Dünya Kupası Elemeleri (Afrika)', country: 'Milli Takımlar', countryFlag: '🌍', category: 'world-cup-q' },
  { code: 'fifa.friendly', name: 'Milli Takımlar Hazırlık', country: 'Milli Takımlar', countryFlag: '🌍', category: 'friendly' },
  { code: 'concacaf.nations.league', name: 'CONCACAF Uluslar Ligi', country: 'Milli Takımlar', countryFlag: '🌍', category: 'nations-league' },
  { code: 'caf.nations', name: 'Afrika Uluslar Kupası', country: 'Milli Takımlar', countryFlag: '🌍', category: 'afcon' },
  { code: 'uefa.wchampions', name: 'Kadınlar Şampiyonlar Ligi', country: 'Avrupa', countryFlag: '⭐', category: 'wcl' },
  { code: 'conmebol.libertadores', name: 'Copa Libertadores', country: 'G. Amerika', countryFlag: '🏆', category: 'libertadores' },
  { code: 'conmebol.sudamericana', name: 'Copa Sudamericana', country: 'G. Amerika', countryFlag: '🏆', category: 'sudamericana' }
];

/** Map ESPN event to our internal Match schema with live scores & minutes */
export function mapEvent(event, league) {
  const competition = event.competitions?.[0] || {};
  const statusObj = competition.status || {};
  const state = statusObj.type?.state || 'pre'; // 'pre', 'in', 'post'
  const typeName = String(statusObj.type?.name || '').toUpperCase();
  const desc = String(statusObj.type?.description || statusObj.type?.detail || '').toLowerCase();

  const isPostponed = typeName.includes('POSTPONED') || desc.includes('postponed') || desc.includes('ertelendi');
  const isCanceled = typeName.includes('CANCEL') || desc.includes('cancel') || desc.includes('iptal');
  const isSuspended = typeName.includes('SUSPENDED') || desc.includes('suspended');

  // Kickoff time check: A match whose kickoff is in the future can NEVER be finished
  const eventTime = event.date ? new Date(event.date).getTime() : NaN;
  const nowMs = Date.now();
  const isFuture = !isNaN(eventTime) && eventTime > (nowMs + 60 * 60 * 1000); // 1 hour buffer

  // A match is truly completed ONLY IF it is not postponed/canceled/suspended/future
  // and either explicitly completed or in post-match state
  const isCompleted = !isPostponed && !isCanceled && !isSuspended && !isFuture &&
    (statusObj.type?.completed === true || (state === 'post' && !isPostponed && !isCanceled));

  const isLive = !isCompleted && !isPostponed && !isCanceled && state === 'in';

  const homeComp = (competition.competitors || []).find(c => c.homeAway === 'home') || {};
  const awayComp = (competition.competitors || []).find(c => c.homeAway === 'away') || {};
  const homeTeam = homeComp.team || {};
  const awayTeam = awayComp.team || {};

  // Extract real live and final scores from competitors ONLY if match is finished or currently live
  let parsedHomeScore = null;
  let parsedAwayScore = null;

  if (isCompleted || isLive) {
    if (homeComp.score !== undefined && homeComp.score !== null && homeComp.score !== '') {
      const s = parseInt(homeComp.score, 10);
      if (!isNaN(s)) parsedHomeScore = s;
    }
    if (awayComp.score !== undefined && awayComp.score !== null && awayComp.score !== '') {
      const s = parseInt(awayComp.score, 10);
      if (!isNaN(s)) parsedAwayScore = s;
    }
  }

  const hasScores = (isCompleted || isLive) && parsedHomeScore !== null && parsedAwayScore !== null;
  const currentScore = hasScores ? { home: parsedHomeScore, away: parsedAwayScore } : undefined;

  // Extract real half-time score & card count from ESPN competition.details when timeline is complete
  let htHome;
  let htAway;
  let actualCards;
  const rawDetails = Array.isArray(competition.details) ? competition.details : [];
  if (rawDetails.length > 0) {
    actualCards = rawDetails.filter(d => d?.yellowCard || d?.redCard).length;
  }
  if (isCompleted && hasScores) {
    if (parsedHomeScore + parsedAwayScore === 0) {
      htHome = 0;
      htAway = 0;
    } else {
      const scoringPlays = rawDetails.filter(d => d?.scoringPlay && !d?.shootout);
      if (scoringPlays.length >= parsedHomeScore + parsedAwayScore) {
        let hHt = 0;
        let aHt = 0;
        const homeIdStr = String(homeTeam.id || '');
        const awayIdStr = String(awayTeam.id || '');
        for (const play of scoringPlays) {
          const clockVal = Number(play?.clock?.value);
          const disp = String(play?.clock?.displayValue || '');
          const isFirstHalf = Number.isFinite(clockVal)
            ? clockVal <= 2700 && !disp.startsWith('46')
            : /^([1-3]?\d|4[0-5])(\+\d+)?'$/.test(disp.trim());
          if (!isFirstHalf) continue;
          const teamIdStr = String(play?.team?.id || '');
          if (teamIdStr && teamIdStr === homeIdStr) hHt++;
          else if (teamIdStr && teamIdStr === awayIdStr) aHt++;
        }
        htHome = Math.min(parsedHomeScore, hHt);
        htAway = Math.min(parsedAwayScore, aHt);
      }
    }
  }

  const finalScore = isCompleted && hasScores
    ? {
        home: parsedHomeScore,
        away: parsedAwayScore,
        ...(htHome !== undefined && htAway !== undefined ? { htHome, htAway } : {}),
        ...(actualCards !== undefined ? { actualCards } : {})
      }
    : undefined;

  // Real-time live minute (e.g. "72'", "Devre Arası")
  let liveMinute = '';
  if (isLive) {
    const rawClock = String(statusObj.displayClock || statusObj.type?.shortDetail || statusObj.type?.detail || '').trim();
    const isHalftime = 
      typeName === 'STATUS_HALFTIME' ||
      desc.includes('halftime') ||
      desc.includes('devre') ||
      rawClock === 'HT' ||
      rawClock.toLowerCase().includes('half') ||
      rawClock.toLowerCase().includes('devre') ||
      (statusObj.period === 1 && (statusObj.clock === 0 || statusObj.clock === 2700) && !statusObj.displayClock);

    if (isHalftime) {
      liveMinute = 'Devre Arası';
    } else if (rawClock) {
      liveMinute = rawClock.includes("'") ? rawClock : `${rawClock}'`;
    } else {
      liveMinute = 'Canlı';
    }
  }

  let dayCategory = 'upcoming';
  let status = 'upcoming';

  if (isCompleted) {
    status = 'finished';
    dayCategory = 'completed';
  } else if (isLive) {
    status = 'live';
    dayCategory = 'live';
  } else if (isPostponed) {
    status = 'postponed';
    dayCategory = 'upcoming';
  } else if (isCanceled) {
    status = 'cancelled';
    dayCategory = 'upcoming';
  } else {
    status = 'upcoming';
    dayCategory = 'upcoming';
  }

  const parseFormLetters = (formStr) => {
    if (!formStr || typeof formStr !== 'string') return [];
    return formStr.toUpperCase().split('').filter(c => c === 'W' || c === 'D' || c === 'L');
  };
  const homeForm = parseFormLetters(homeComp.form || homeComp.team?.form);
  const awayForm = parseFormLetters(awayComp.form || awayComp.team?.form);

  const idStr = String(event.id || '');
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    hash = ((hash << 5) - hash + idStr.charCodeAt(i)) | 0;
  }
  const iddaaCode = String(10000 + (Math.abs(hash) % 89900));

  const rawOfficials = Array.isArray(competition.officials) ? competition.officials : [];
  const primaryRef = rawOfficials.find(o => {
    const pos = String(o.position?.name || o.position?.displayName || '').toLowerCase();
    return pos.includes('referee') || pos.includes('orta');
  }) || rawOfficials[0];
  const parsedReferee = primaryRef?.displayName || primaryRef?.fullName || primaryRef?.name || '';

  return {
    id: event.id,
    iddaaCode,
    league: league.name,
    leagueCategory: league.category,
    country: league.country,
    countryFlag: league.countryFlag,
    round: competition.type?.name || '',
    date: event.date,
    time: event.date,
    utcDate: event.date,
    dayCategory,
    stadium: competition.venue?.fullName || '',
    referee: parsedReferee || undefined,
    status,
    liveMinute,
    currentScore,
    finalScore,
    homeScore: hasScores ? parsedHomeScore : null,
    awayScore: hasScores ? parsedAwayScore : null,
    isPostponed: isPostponed || undefined,
    homeTeam: {
      id: homeTeam.id?.toString() || '',
      name: homeTeam.displayName || homeTeam.name || '',
      shortName: homeTeam.abbreviation || '',
      rank: null,
      form: homeForm,
      recentMatches: [],
      avgGoalsScored: 0,
      avgGoalsConceded: 0,
      firstHalfGoalRate: 0,
      firstHalfLeadingRate: 0,
      avgCorners: 0,
      avgCards: 0,
      shotsOnTargetAvg: 0,
      cleanSheetRate: 0,
      primaryColor: '#10B981'
    },
    awayTeam: {
      id: awayTeam.id?.toString() || '',
      name: awayTeam.displayName || awayTeam.name || '',
      shortName: awayTeam.abbreviation || '',
      rank: null,
      form: awayForm,
      recentMatches: [],
      avgGoalsScored: 0,
      avgGoalsConceded: 0,
      firstHalfGoalRate: 0,
      firstHalfLeadingRate: 0,
      avgCorners: 0,
      avgCards: 0,
      shotsOnTargetAvg: 0,
      cleanSheetRate: 0,
      primaryColor: '#10B981'
    }
  };
}

const COUNTRY_CODE_MAP = {
  TR: { country: 'Türkiye', countryFlag: '🇹🇷' },
  ENG: { country: 'İngiltere', countryFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  GB: { country: 'İngiltere', countryFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  UK: { country: 'İngiltere', countryFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  ESP: { country: 'İspanya', countryFlag: '🇪🇸' },
  ES: { country: 'İspanya', countryFlag: '🇪🇸' },
  ITA: { country: 'İtalya', countryFlag: '🇮🇹' },
  IT: { country: 'İtalya', countryFlag: '🇮🇹' },
  GER: { country: 'Almanya', countryFlag: '🇩🇪' },
  DE: { country: 'Almanya', countryFlag: '🇩🇪' },
  FRA: { country: 'Fransa', countryFlag: '🇫🇷' },
  FR: { country: 'Fransa', countryFlag: '🇫🇷' },
  NED: { country: 'Hollanda', countryFlag: '🇳🇱' },
  NL: { country: 'Hollanda', countryFlag: '🇳🇱' },
  POR: { country: 'Portekiz', countryFlag: '🇵🇹' },
  PT: { country: 'Portekiz', countryFlag: '🇵🇹' },
  BEL: { country: 'Belçika', countryFlag: '🇧🇪' },
  BE: { country: 'Belçika', countryFlag: '🇧🇪' },
  SCO: { country: 'İskoçya', countryFlag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  UEFA: { country: 'Milli Takımlar', countryFlag: '🌍' },
  EUR: { country: 'Milli Takımlar', countryFlag: '🌍' },
  EU: { country: 'Milli Takımlar', countryFlag: '🌍' },
  INT: { country: 'Milli Takımlar', countryFlag: '🌍' },
  FIFA: { country: 'Milli Takımlar', countryFlag: '🌍' },
  CAF: { country: 'Milli Takımlar', countryFlag: '🌍' },
  CONCACAF: { country: 'Milli Takımlar', countryFlag: '🌍' },
  CONMEBOL: { country: 'G. Amerika', countryFlag: '🌎' },
  AFC: { country: 'Milli Takımlar', countryFlag: '🌍' },
  US: { country: 'ABD', countryFlag: '🇺🇸' },
  BR: { country: 'Brezilya', countryFlag: '🇧🇷' },
  AR: { country: 'Arjantin', countryFlag: '🇦🇷' },
  MX: { country: 'Meksika', countryFlag: '🇲🇽' },
  CO: { country: 'Kolombiya', countryFlag: '🇨🇴' },
  SV: { country: 'El Salvador', countryFlag: '🇸🇻' },
  GT: { country: 'Guatemala', countryFlag: '🇬🇹' },
  BO: { country: 'Bolivya', countryFlag: '🇧🇴' },
  CZ: { country: 'Çekya', countryFlag: '🇨🇿' },
  DK: { country: 'Danimarka', countryFlag: '🇩🇰' },
  SE: { country: 'İsveç', countryFlag: '🇸🇪' },
  NO: { country: 'Norveç', countryFlag: '🇳🇴' },
  RO: { country: 'Romanya', countryFlag: '🇷🇴' },
  GR: { country: 'Yunanistan', countryFlag: '🇬🇷' },
  CH: { country: 'İsviçre', countryFlag: '🇨🇭' },
  AT: { country: 'Avusturya', countryFlag: '🇦🇹' },
  SA: { country: 'Suudi Arabistan', countryFlag: '🇸🇦' },
  EG: { country: 'Mısır', countryFlag: '🇪🇬' },
  JO: { country: 'Ürdün', countryFlag: '🇯🇴' },
  KE: { country: 'Kenya', countryFlag: '🇰🇪' },
  AU: { country: 'Avustralya', countryFlag: '🇦🇺' },
  JP: { country: 'Japonya', countryFlag: '🇯🇵' },
  RU: { country: 'Rusya', countryFlag: '🇷🇺' }
};

function resolveIddaaLeagueMeta(cc, rawLeagueName) {
  const name = rawLeagueName || 'Uluslararası Futbol';
  const low = name.toLowerCase();
  const isInternational =
    low.includes('uluslar') ||
    low.includes('milli') ||
    low.includes('hazırlık') ||
    low.includes('dünya') ||
    low.includes('eleme') ||
    low.includes('avrupa şampiyona') ||
    low.includes('afrika') ||
    low.includes('u19') ||
    low.includes('u20') ||
    low.includes('u21') ||
    low.includes('u23');

  if (isInternational) {
    return {
      league: name,
      leagueCategory: 'nations-league',
      country: 'Milli Takımlar',
      countryFlag: '🌍'
    };
  }

  let leagueCategory = 'other';
  if (low.includes('süper lig') && low.includes('türkiye')) leagueCategory = 'super-lig';
  else if (low.includes('1. lig') && low.includes('türkiye')) leagueCategory = '1-lig';
  else if (low.includes('premier lig') && (cc === 'ENG' || cc === 'GB')) leagueCategory = 'premier-league';
  else if (low.includes('championship')) leagueCategory = 'championship';
  else if (low.includes('la liga')) leagueCategory = 'la-liga';
  else if (low.includes('italya serie a')) leagueCategory = 'serie-a';
  else if (low.includes('almanya bundesliga')) leagueCategory = 'bundesliga';
  else if (low.includes('fransa lig 1') || low.includes('ligue 1')) leagueCategory = 'ligue-1';
  else if (low.includes('şampiyonlar ligi')) leagueCategory = low.includes('kadın') ? 'wcl' : 'cl';
  else if (low.includes('avrupa ligi')) leagueCategory = 'el';

  const mappedCc = COUNTRY_CODE_MAP[String(cc || '').toUpperCase()] || { country: 'Dünya', countryFlag: '🌐' };
  return {
    league: name,
    leagueCategory,
    country: mappedCc.country,
    countryFlag: mappedCc.countryFlag
  };
}

const TR_TO_EN_TEAM_MAP = {
  'turkiye': 'turkey',
  'belcika': 'belgium',
  'almanya': 'germany',
  'fransa': 'france',
  'ispanya': 'spain',
  'ingiltere': 'england',
  'italya': 'italy',
  'hollanda': 'netherlands',
  'portekiz': 'portugal',
  'hirvatistan': 'croatia',
  'isvicre': 'switzerland',
  'avusturya': 'austria',
  'yunanistan': 'greece',
  'cekya': 'czech',
  'finlandiya': 'finland',
  'arnavutluk': 'albania',
  'karadag': 'montenegro',
  'letonya': 'latvia',
  'ermenistan': 'armenia',
  'kibris': 'cyprus',
  'galler': 'wales',
  'isvec': 'sweden',
  'norvec': 'norway',
  'danimarka': 'denmark',
  'polonya': 'poland',
  'ukrayna': 'ukraine',
  'rusya': 'russia',
  'sirbistan': 'serbia',
  'iskocya': 'scotland',
  'macaristan': 'hungary',
  'slovakya': 'slovakia',
  'kuba': 'cuba',
  'kamerun': 'cameroon',
  'fildisi sahili': 'ivory coast',
  'misir': 'egypt',
  'fas': 'morocco',
  'cezayir': 'algeria',
  'tunus': 'tunisia',
  'nijerya': 'nigeria',
  'gana': 'ghana',
  'guney afrika': 'south africa',
  'brezilya': 'brazil',
  'arjantin': 'argentina',
  'kolombiya': 'colombia',
  'sili': 'chile',
  'katar': 'qatar',
  'japonya': 'japan',
  'tayland': 'thailand',
  'hindistan': 'india',
  'yeni zelanda': 'new zealand'
};

function normalizeTeamName(name) {
  let s = String(name || '')
    .toLowerCase()
    .replace(/\u0307/g, '')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u')
    .replace(/ø/g, 'o')
    .replace(/æ/g, 'ae')
    .replace(/å/g, 'a')
    .replace(/[áàâãä]/g, 'a')
    .replace(/[éèêë]/g, 'e')
    .replace(/[íìîï]/g, 'i')
    .replace(/[óòôõ]/g, 'o')
    .replace(/[úùû]/g, 'u')
    .replace(/ñ/g, 'n')
    .replace(/\(k\)|\(w\)/g, '')
    .replace(/\b(fc|fk|sc|sk|ac|cd|cf|ca|afc|utd|united|city|pr|pe|mg|rj|sp)\b/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (s === 's wednesday') s = 'sheffield wednesday';
  if (s === 'ol lyonnes' || s === 'o lyon') s = 'lyon';
  if (s === 'hb koge' || s === 'hb koege') s = 'hb koge';
  return TR_TO_EN_TEAM_MAP[s] || s;
}

function areTeamsEquivalent(a, b) {
  const na = normalizeTeamName(a);
  const nb = normalizeTeamName(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.length >= 4 && nb.length >= 4 && (na.includes(nb) || nb.includes(na))) return true;
  return false;
}

/**
 * Fetches full official İddaa pre-match bulletin (including National Teams, World Cup Qualifiers,
 * Nations League, U19/U21, Cups, and Regional Leagues) with real İddaa codes & odds.
 */
async function fetchOfficialIddaaBulletin() {
  try {
    const res = await fetch('https://bulten.nesine.com/api/bulten/getprebultenfull', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      },
      timeout: 7000
    });
    if (!res.ok) return [];
    const data = await res.json();
    const sg = data?.sg;
    if (!sg || !Array.isArray(sg.EA)) return [];

    const leagueMap = new Map();
    if (Array.isArray(sg.LA)) {
      for (const l of sg.LA) {
        leagueMap.set(l.LID, l);
      }
    }

    const mapped = [];
    for (const ev of sg.EA) {
      // Only genuine Football single matches (GT === 1, TYPE === 1)
      if (ev.GT !== 1 || ev.TYPE !== 1 || !ev.HN || !ev.AN) continue;
      if (ev.HN.includes('/') || ev.AN.includes('/') || ev.AN.includes('Maçları') || ev.HN.includes('Maçları')) continue;

      const leagueInfo = leagueMap.get(ev.LC);
      const meta = resolveIddaaLeagueMeta(leagueInfo?.CC, leagueInfo?.N || 'Uluslararası Futbol');

      // Extract real official İddaa odds across all main markets (only genuine odds > 1.01)
      const ma = Array.isArray(ev.MA) ? ev.MA : [];
      const readOdd = (market, outcomeNum) => {
        const raw = Number(market?.OCA?.find(o => o.N === outcomeNum)?.O);
        return Number.isFinite(raw) && raw > 1.01 ? Number(raw.toFixed(2)) : undefined;
      };

      const msMarket = ma.find(m => m.MT === 1 && m.MST === 1);
      const dcMarket = ma.find(m => m.MST === 92);
      const ou15Market = ma.find(m => m.MST === 101 && Number(m.SOV) === 1.5);
      const ou25Market = ma.find(m => m.MST === 101 && Number(m.SOV) === 2.5);
      const ou35Market = ma.find(m => m.MST === 101 && Number(m.SOV) === 3.5);
      const bttsMarket = ma.find(m => m.MST === 89);
      const htMarket = ma.find(m => m.MST === 88);
      const htftMarket = ma.find(m => m.MST === 90);

      const odd1 = readOdd(msMarket, 1);
      const oddX = readOdd(msMarket, 2);
      const odd2 = readOdd(msMarket, 3);
      const oddUnder15 = readOdd(ou15Market, 1);
      const oddOver15 = readOdd(ou15Market, 2);
      const oddUnder25 = readOdd(ou25Market, 1);
      const oddOver25 = readOdd(ou25Market, 2);
      const oddUnder35 = readOdd(ou35Market, 1);
      const oddOver35 = readOdd(ou35Market, 2);
      const oddBttsYes = readOdd(bttsMarket, 1);
      const oddBttsNo = readOdd(bttsMarket, 2);
      const oddDc1X = readOdd(dcMarket, 1);
      const oddDc12 = readOdd(dcMarket, 2);
      const oddDcX2 = readOdd(dcMarket, 3);
      const oddHt1 = readOdd(htMarket, 1);
      const oddHtX = readOdd(htMarket, 2);
      const oddHt2 = readOdd(htMarket, 3);

      const htftKeys = ['1/1', '1/X', '1/2', 'X/1', 'X/X', 'X/2', '2/1', '2/X', '2/2'];
      const htftOdds = {};
      if (htftMarket) {
        htftKeys.forEach((k, idx) => {
          const val = readOdd(htftMarket, idx + 1);
          if (val !== undefined) htftOdds[k] = val;
        });
      }

      const oddsObj = {};
      if (odd1 !== undefined) oddsObj.ms1 = odd1;
      if (oddX !== undefined) {
        oddsObj.msX = oddX;
        oddsObj.ms0 = oddX;
      }
      if (odd2 !== undefined) oddsObj.ms2 = odd2;
      if (oddDc1X !== undefined) oddsObj.dc_1x = oddDc1X;
      if (oddDc12 !== undefined) oddsObj.dc_12 = oddDc12;
      if (oddDcX2 !== undefined) oddsObj.dc_x2 = oddDcX2;
      if (oddOver15 !== undefined) oddsObj.over15 = oddOver15;
      if (oddUnder15 !== undefined) oddsObj.under15 = oddUnder15;
      if (oddOver25 !== undefined) oddsObj.over25 = oddOver25;
      if (oddUnder25 !== undefined) oddsObj.under25 = oddUnder25;
      if (oddOver35 !== undefined) oddsObj.over35 = oddOver35;
      if (oddUnder35 !== undefined) oddsObj.under35 = oddUnder35;
      if (oddBttsYes !== undefined) oddsObj.bttsYes = oddBttsYes;
      if (oddBttsNo !== undefined) oddsObj.bttsNo = oddBttsNo;
      if (oddHt1 !== undefined) oddsObj.ht_1 = oddHt1;
      if (oddHtX !== undefined) oddsObj.ht_X = oddHtX;
      if (oddHt2 !== undefined) oddsObj.ht_2 = oddHt2;
      if (Object.keys(htftOdds).length > 0) oddsObj.htft = htftOdds;

      // Implied market strength so base goal/form fallback aligns with official İddaa favorite & totals
      const p1Raw = 1 / Math.max(1.05, odd1 || 2.15);
      const pxRaw = 1 / Math.max(1.5, oddX || 3.20);
      const p2Raw = 1 / Math.max(1.05, odd2 || 2.65);
      const pSum = p1Raw + pxRaw + p2Raw;
      const p1 = p1Raw / pSum;

      const overProb = (1 / Math.max(1.05, oddOver25 || 1.75)) / ((1 / Math.max(1.05, oddOver25 || 1.75)) + (1 / Math.max(1.05, oddUnder25 || 1.85)));
      const expectedTotalGoals = 1.6 + overProb * 1.9; // ~2.0 to 3.2
      const homeShare = Math.max(0.25, Math.min(0.75, p1 / Math.max(0.15, p1 + (p2Raw / pSum))));

      const homeAvgScored = Number((expectedTotalGoals * homeShare * 1.05).toFixed(2));
      const awayAvgScored = Number((expectedTotalGoals * (1 - homeShare) * 1.05).toFixed(2));

      const isoDate = ev.ESD ? new Date(ev.ESD).toISOString() : new Date().toISOString();
      const shortHome = ev.HN.replace(/[^A-Za-zÇĞİÖŞÜçğıöşü]/g, '').slice(0, 3).toUpperCase() || 'EV';
      const shortAway = ev.AN.replace(/[^A-Za-zÇĞİÖŞÜçğıöşü]/g, '').slice(0, 3).toUpperCase() || 'DEP';

      mapped.push({
        id: `iddaa-${ev.C}`,
        iddaaCode: String(ev.C),
        league: meta.league,
        leagueCategory: meta.leagueCategory,
        country: meta.country,
        countryFlag: meta.countryFlag,
        round: 'İddaa Resmi Bülteni',
        date: isoDate,
        time: ev.T || isoDate,
        utcDate: isoDate,
        dayCategory: 'upcoming',
        stadium: 'Resmi İddaa Programı',
        status: 'upcoming',
        ...(Object.keys(oddsObj).length > 0 ? { odds: oddsObj } : {}),
        homeTeam: {
          id: `iddaa-h-${ev.C}`,
          name: ev.HN,
          shortName: shortHome,
          rank: null,
          form: homeShare >= 0.55 ? ['W', 'W', 'D', 'W', 'L'] : homeShare <= 0.42 ? ['L', 'D', 'L', 'W', 'L'] : ['W', 'D', 'L', 'D', 'W'],
          recentMatches: [],
          avgGoalsScored: homeAvgScored,
          avgGoalsConceded: Number((awayAvgScored * 0.95).toFixed(2)),
          firstHalfGoalRate: 52,
          firstHalfLeadingRate: Math.round(homeShare * 60),
          avgCorners: 4.8,
          avgCards: 2.1,
          shotsOnTargetAvg: 4.5,
          cleanSheetRate: 30,
          primaryColor: '#10B981'
        },
        awayTeam: {
          id: `iddaa-a-${ev.C}`,
          name: ev.AN,
          shortName: shortAway,
          rank: null,
          form: (1 - homeShare) >= 0.55 ? ['W', 'W', 'D', 'W', 'L'] : (1 - homeShare) <= 0.42 ? ['L', 'D', 'L', 'W', 'L'] : ['D', 'W', 'L', 'D', 'W'],
          recentMatches: [],
          avgGoalsScored: awayAvgScored,
          avgGoalsConceded: Number((homeAvgScored * 0.95).toFixed(2)),
          firstHalfGoalRate: 48,
          firstHalfLeadingRate: Math.round((1 - homeShare) * 55),
          avgCorners: 4.2,
          avgCards: 2.3,
          shotsOnTargetAvg: 3.9,
          cleanSheetRate: 28,
          primaryColor: '#6366F1'
        }
      });
    }
    return mapped;
  } catch (err) {
    console.warn('⚠️ İddaa/Nesine pre-bulletin fetch warning:', err.message);
    return [];
  }
}

/** Fetch live bulletin with real-time scores across all ESPN + Official İddaa leagues */
export async function fetchLiveBulletin() {
  const matchesMap = new Map();

  // Target key dates: yesterday, today, tomorrow, and upcoming weekend
  const now = new Date();
  const fmt = d => d.toISOString().slice(0, 10).replace(/-/g, '');
  const keyDates = [];
  for (let i = -1; i <= 5; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    keyDates.push(fmt(d));
  }

  // Start fetching Official İddaa Bulletin concurrently with ESPN leagues
  const iddaaPromise = fetchOfficialIddaaBulletin();

  // Batch leagues in small concurrent chunks to prevent CDN rate limits (HTTP 403)
  const CHUNK_SIZE = 6;
  for (let i = 0; i < SUPPORTED_LEAGUES.length; i += CHUNK_SIZE) {
    const chunk = SUPPORTED_LEAGUES.slice(i, i + CHUNK_SIZE);
    await Promise.all(
      chunk.map(async (league) => {
        // 1. Fetch live active round scoreboard
        try {
          const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league.code}/scoreboard`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 5000
          });
          if (res.ok) {
            const data = await res.json();
            if (data && Array.isArray(data.events)) {
              for (const ev of data.events) {
                const mapped = mapEvent(ev, league);
                matchesMap.set(String(mapped.id), mapped);
              }
            }
          }
        } catch (_) {}

        // 2. Fetch specific key dates for major & international leagues
        const isMajor = [
          'tur.1', 'tur.2', 'eng.1', 'eng.2', 'esp.1', 'esp.2', 'ita.1', 'ger.1', 'fra.1',
          'uefa.champions', 'uefa.nations', 'fifa.worldq.uefa', 'fifa.friendly'
        ].includes(league.code);
        if (isMajor) {
          for (const dt of keyDates) {
            try {
              const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league.code}/scoreboard?dates=${dt}`, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                timeout: 5000
              });
              if (res.ok) {
                const data = await res.json();
                if (data && Array.isArray(data.events)) {
                  for (const ev of data.events) {
                    const mapped = mapEvent(ev, league);
                    matchesMap.set(String(mapped.id), mapped);
                  }
                }
              }
            } catch (_) {}
          }
        }
      })
    );
  }

  // Also fetch ESPN global 'all/scoreboard' for yesterday/today/tomorrow to capture smaller leagues & cups
  const globalDates = keyDates.slice(0, 3);
  await Promise.all(
    globalDates.map(async (dt) => {
      try {
        const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard?dates=${dt}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          timeout: 5500
        });
        if (!res.ok) return;
        const data = await res.json();
        const leaguesBySlug = new Map();
        if (Array.isArray(data?.leagues)) {
          for (const lg of data.leagues) {
            if (lg?.slug) leaguesBySlug.set(lg.slug, lg);
          }
        }
        if (data && Array.isArray(data.events)) {
          for (const ev of data.events) {
            const evId = String(ev.id || '');
            if (!evId || matchesMap.has(evId)) continue;
            const slug = ev?.season?.slug || ev?.competitions?.[0]?.league?.slug || 'global';
            const supported = SUPPORTED_LEAGUES.find(l => l.code === slug);
            const rawLg = leaguesBySlug.get(slug);
            const leagueMeta = supported || {
              code: slug,
              name: rawLg?.shortName || rawLg?.name || 'Uluslararası Futbol',
              country: 'Dünya',
              countryFlag: '🌍',
              category: 'world'
            };
            const mapped = mapEvent(ev, leagueMeta);
            matchesMap.set(evId, mapped);
          }
        }
      } catch (_) {}
    })
  );

  // Cache ESPN matches for fallback team lookup in fetchMatchInsights
  const esnListSnapshot = Array.from(matchesMap.values());
  recentEspnMatchesCache = esnListSnapshot.map(m => ({
    id: String(m.id),
    league: m.league,
    homeName: m.homeTeam?.name || '',
    awayName: m.awayTeam?.name || ''
  }));

  // Merge Official İddaa Matches (enrich duplicates with real İddaa codes & odds, add all missing ones)
  const iddaaMatches = await iddaaPromise;
  const existingEspnList = Array.from(matchesMap.values());

  for (const idd of iddaaMatches) {
    const iddTime = new Date(idd.utcDate).getTime();
    const matchedEspn = existingEspnList.find(espn => {
      const espnTime = new Date(espn.utcDate || espn.date).getTime();
      if (!isNaN(iddTime) && !isNaN(espnTime)) {
        if (Math.abs(iddTime - espnTime) > 18 * 60 * 60 * 1000) return false;
      }
      return (
        areTeamsEquivalent(espn.homeTeam?.name, idd.homeTeam.name) &&
        areTeamsEquivalent(espn.awayTeam?.name, idd.awayTeam.name)
      );
    });

    if (matchedEspn) {
      // Enrich existing ESPN match with official İddaa code & odds while preserving live score tracking
      const origHome = matchedEspn.homeTeam?.name || '';
      const origAway = matchedEspn.awayTeam?.name || '';
      matchedEspn.searchAlias = `${origHome} ${origAway} ${idd.homeTeam?.name || ''} ${idd.awayTeam?.name || ''}`.trim();
      if (idd.country === 'Milli Takımlar') {
        if (matchedEspn.homeTeam && idd.homeTeam?.name) matchedEspn.homeTeam.name = idd.homeTeam.name;
        if (matchedEspn.awayTeam && idd.awayTeam?.name) matchedEspn.awayTeam.name = idd.awayTeam.name;
      }
      matchedEspn.iddaaCode = idd.iddaaCode;
      matchedEspn.odds = idd.odds;
    } else {
      matchesMap.set(String(idd.id), idd);
    }
  }

  const allMatches = Array.from(matchesMap.values());
  const leagueCounts = {};
  for (const m of allMatches) {
    leagueCounts[m.league] = (leagueCounts[m.league] || 0) + 1;
  }

  return {
    updatedAt: new Date().toISOString(),
    totalMatches: allMatches.length,
    leagueCounts,
    leagues: SUPPORTED_LEAGUES,
    matches: allMatches
  };
}

let recentEspnMatchesCache = [];
const matchInsightsCache = new Map();
const INSIGHTS_CACHE_TTL_MS = 15 * 60 * 1000;

function mapEspnLastFiveBlock(teamBlock) {
  const teamId = String(teamBlock?.team?.id || '');
  const events = Array.isArray(teamBlock?.events) ? teamBlock.events : [];
  return events.slice(-5).map(ev => {
    const isHome = ev.atVs === 'vs' || String(ev.homeTeamId || '') === teamId;
    const hScore = ev.homeTeamScore ?? '';
    const aScore = ev.awayTeamScore ?? '';
    const rawRes = String(ev.gameResult || '').toUpperCase();
    const result = rawRes === 'W' || rawRes === 'D' || rawRes === 'L' ? rawRes : 'D';
    const dStr = ev.gameDate ? new Date(ev.gameDate).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
    return {
      result,
      opponent: ev.opponent?.displayName || ev.opponent?.shortDisplayName || '',
      score: hScore !== '' && aScore !== '' ? `${hScore} - ${aScore}` : (ev.score || ''),
      isHome,
      weekOrDate: dStr ? `${dStr}${ev.leagueAbbreviation ? ` • ${ev.leagueAbbreviation}` : ''}` : (ev.competitionName || '')
    };
  });
}

/**
 * Fetches rich on-demand match insights (Real H2H series, Officials, Venue, Injuries, Last 5 Games)
 * from ESPN summary API with 15-minute memory cache.
 */
export async function fetchMatchInsights(eventId, leagueName = '', homeTeamName = '', awayTeamName = '') {
  let id = String(eventId || '').trim();
  const emptyPayload = {
    source: 'none',
    h2hSummary: '',
    h2hGames: [],
    officials: [],
    injuries: [],
    lastFiveHome: [],
    lastFiveAway: [],
    venue: null
  };

  if (!id || id.startsWith('curated-')) {
    return emptyPayload;
  }

  // Fallback team lookup for İddaa-only IDs against cached ESPN matches
  if (id.startsWith('iddaa-')) {
    if (homeTeamName && awayTeamName) {
      const matched = recentEspnMatchesCache.find(
        m => areTeamsEquivalent(m.homeName, homeTeamName) && areTeamsEquivalent(m.awayName, awayTeamName)
      );
      if (matched) {
        id = matched.id;
      } else {
        return emptyPayload;
      }
    } else {
      return emptyPayload;
    }
  }

  const cached = matchInsightsCache.get(id);
  if (cached && (Date.now() - cached.fetchedAt) < INSIGHTS_CACHE_TTL_MS) {
    return cached.payload;
  }

  const normalizedLeague = String(leagueName || '').toLowerCase().trim();
  const matchedLeague = SUPPORTED_LEAGUES.find(
    l => l.name.toLowerCase() === normalizedLeague || l.code.toLowerCase() === normalizedLeague
  );
  const leagueSlug = matchedLeague?.code || 'all';

  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueSlug}/summary?event=${encodeURIComponent(id)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(5500)
    });

    if (!res.ok) {
      return emptyPayload;
    }

    const data = await res.json();
    const series = Array.isArray(data?.seasonseries) ? data.seasonseries[0] : null;
    const rawEvents = Array.isArray(series?.events) ? series.events : [];

    const h2hGames = rawEvents
      .filter(ev => Array.isArray(ev?.competitors) && ev.competitors.length >= 2)
      .slice(0, 10)
      .map(ev => {
        const home = ev.competitors.find(c => c.homeAway === 'home') || ev.competitors[0];
        const away = ev.competitors.find(c => c.homeAway === 'away') || ev.competitors[1];
        const homeScore = home?.score !== undefined && home?.score !== '' ? Number(home.score) : null;
        const awayScore = away?.score !== undefined && away?.score !== '' ? Number(away.score) : null;
        return {
          id: String(ev.id || ''),
          date: ev.date || '',
          competition: ev.competitionName || ev.roundName || leagueName || 'Resmi Karşılaşma',
          homeTeam: home?.team?.displayName || home?.team?.shortDisplayName || 'Ev Sahibi',
          awayTeam: away?.team?.displayName || away?.team?.shortDisplayName || 'Deplasman',
          homeScore: Number.isFinite(homeScore) ? homeScore : null,
          awayScore: Number.isFinite(awayScore) ? awayScore : null,
          completed: Boolean(ev?.statusType?.completed ?? (ev.status === 'post'))
        };
      });

    const officials = Array.isArray(data?.gameInfo?.officials)
      ? data.gameInfo.officials
          .map(off => ({
            name: off.fullName || off.displayName || '',
            position: off.position?.displayName || off.position?.name || 'Orta Hakem'
          }))
          .filter(off => Boolean(off.name))
      : [];

    const venueObj = data?.gameInfo?.venue;
    const venue = venueObj?.fullName
      ? {
          name: venueObj.fullName,
          city: venueObj.address?.city || '',
          country: venueObj.address?.country || ''
        }
      : null;

    const injuries = [];
    if (Array.isArray(data?.injuries)) {
      for (const teamBlock of data.injuries) {
        const tName = teamBlock?.team?.displayName || '';
        const list = Array.isArray(teamBlock?.injuries) ? teamBlock.injuries : [];
        for (const inj of list) {
          const playerName = inj?.athlete?.displayName || inj?.athlete?.shortName || '';
          if (!playerName) continue;
          injuries.push({
            teamName: tName,
            playerName,
            position: inj?.athlete?.position?.abbreviation || inj?.athlete?.position?.displayName || '',
            status: inj?.status || inj?.type?.description || 'Şüpheli / Sakat',
            detail: inj?.shortComment || inj?.longComment || inj?.details?.type || ''
          });
        }
      }
    }

    // Extract real last 5 games for home and away teams from ESPN summary
    const lastFiveBlocks = Array.isArray(data?.lastFiveGames) ? data.lastFiveGames : [];
    const headerCompetitors = data?.header?.competitions?.[0]?.competitors || [];
    const homeCompHeader = headerCompetitors.find(c => c.homeAway === 'home');
    const awayCompHeader = headerCompetitors.find(c => c.homeAway === 'away');
    const homeIdHeader = String(homeCompHeader?.team?.id || homeCompHeader?.id || '');
    const awayIdHeader = String(awayCompHeader?.team?.id || awayCompHeader?.id || '');

    const homeLastBlock =
      lastFiveBlocks.find(b => homeIdHeader && String(b?.team?.id || '') === homeIdHeader) ||
      (homeTeamName ? lastFiveBlocks.find(b => areTeamsEquivalent(b?.team?.displayName, homeTeamName)) : null) ||
      lastFiveBlocks[0];
    const awayLastBlock =
      lastFiveBlocks.find(b => awayIdHeader && String(b?.team?.id || '') === awayIdHeader) ||
      (awayTeamName ? lastFiveBlocks.find(b => areTeamsEquivalent(b?.team?.displayName, awayTeamName)) : null) ||
      (lastFiveBlocks[1] !== homeLastBlock ? lastFiveBlocks[1] : null);

    const lastFiveHome = homeLastBlock ? mapEspnLastFiveBlock(homeLastBlock) : [];
    const lastFiveAway = awayLastBlock ? mapEspnLastFiveBlock(awayLastBlock) : [];

    const payload = {
      source: h2hGames.length > 0 || officials.length > 0 || injuries.length > 0 || lastFiveHome.length > 0 ? 'espn' : 'partial',
      h2hSummary: series?.summary || '',
      h2hGames,
      officials,
      injuries,
      lastFiveHome,
      lastFiveAway,
      venue
    };

    matchInsightsCache.set(id, { fetchedAt: Date.now(), payload });
    return payload;
  } catch (err) {
    return emptyPayload;
  }
}

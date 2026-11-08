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
  { code: 'sco.1', name: 'Premiership', country: 'İskoçya', countryFlag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', category: 'sco-1' }
];

/** Map ESPN event to our internal Match schema with live scores & minutes */
export function mapEvent(event, league) {
  const competition = event.competitions?.[0] || {};
  const statusObj = competition.status || {};
  const state = statusObj.type?.state || 'pre'; // 'pre', 'in', 'post'
  const isCompleted = state === 'post' || statusObj.type?.completed === true;
  const isLive = state === 'in';

  const homeComp = (competition.competitors || []).find(c => c.homeAway === 'home') || {};
  const awayComp = (competition.competitors || []).find(c => c.homeAway === 'away') || {};
  const homeTeam = homeComp.team || {};
  const awayTeam = awayComp.team || {};

  // Extract real live and final scores from competitors
  let parsedHomeScore = null;
  let parsedAwayScore = null;

  if (homeComp.score !== undefined && homeComp.score !== null && homeComp.score !== '') {
    const s = parseInt(homeComp.score, 10);
    if (!isNaN(s)) parsedHomeScore = s;
  }
  if (awayComp.score !== undefined && awayComp.score !== null && awayComp.score !== '') {
    const s = parseInt(awayComp.score, 10);
    if (!isNaN(s)) parsedAwayScore = s;
  }

  const hasScores = parsedHomeScore !== null && parsedAwayScore !== null;
  const currentScore = hasScores ? { home: parsedHomeScore, away: parsedAwayScore } : undefined;
  const finalScore = isCompleted && hasScores ? { home: parsedHomeScore, away: parsedAwayScore } : currentScore;

  // Real-time live minute (e.g. "72'", "İY", "HT")
  let liveMinute = '';
  if (isLive) {
    const rawClock = statusObj.displayClock || statusObj.type?.shortDetail || statusObj.type?.detail || '';
    if (rawClock === 'HT' || rawClock.toLowerCase().includes('half') || rawClock.toLowerCase().includes('devre')) {
      liveMinute = 'İY (Devre Arası)';
    } else if (rawClock) {
      liveMinute = rawClock.includes("'") ? rawClock : `${rawClock}'`;
    } else {
      liveMinute = 'Canlı';
    }
  }

  const dayCategory = state === 'pre' ? 'upcoming' : isLive ? 'live' : 'completed';
  const status = isCompleted ? 'finished' : isLive ? 'live' : 'upcoming';

  const idStr = String(event.id || '');
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    hash = ((hash << 5) - hash + idStr.charCodeAt(i)) | 0;
  }
  const iddaaCode = String(10000 + (Math.abs(hash) % 89900));

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
    status,
    liveMinute,
    currentScore,
    finalScore,
    homeScore: parsedHomeScore ?? 0,
    awayScore: parsedAwayScore ?? 0,
    homeTeam: {
      id: homeTeam.id?.toString() || '',
      name: homeTeam.displayName || homeTeam.name || '',
      shortName: homeTeam.abbreviation || '',
      rank: null,
      form: [],
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
      form: [],
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

/** Fetch live bulletin with real-time scores across all leagues */
export async function fetchLiveBulletin() {
  const matchesMap = new Map();

  // Build target date strings: yesterday, today, and future dates for full weekly fixture
  const now = new Date();
  const fmt = d => d.toISOString().slice(0, 10).replace(/-/g, '');
  const dates = [];
  for (let i = -2; i <= 6; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    dates.push(fmt(d));
  }

  const fetchTasks = [];

  for (const league of SUPPORTED_LEAGUES) {
    // 1. Live active round scoreboard (always includes current in-progress live games)
    fetchTasks.push(
      fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league.code}/scoreboard`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 4500
      })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d && Array.isArray(d.events)) {
          for (const ev of d.events) {
            const mapped = mapEvent(ev, league);
            matchesMap.set(String(mapped.id), mapped);
          }
        }
      })
      .catch(() => {})
    );

    // 2. Specific dates for weekly fixture
    for (const dt of dates) {
      fetchTasks.push(
        fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league.code}/scoreboard?dates=${dt}`, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          timeout: 4500
        })
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if (d && Array.isArray(d.events)) {
            for (const ev of d.events) {
              const mapped = mapEvent(ev, league);
              matchesMap.set(String(mapped.id), mapped);
            }
          }
        })
        .catch(() => {})
      );
    }
  }

  // Execute all fetches in parallel
  await Promise.all(fetchTasks);

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

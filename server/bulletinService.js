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
  { code: 'jpn.1', name: 'J.League', country: 'Japonya', countryFlag: '🇯🇵', category: 'jpn-1' }
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
  const finalScore = isCompleted && hasScores ? { home: parsedHomeScore, away: parsedAwayScore } : undefined;

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
    homeScore: hasScores ? parsedHomeScore : null,
    awayScore: hasScores ? parsedAwayScore : null,
    isPostponed: isPostponed || undefined,
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

  // Target key dates: yesterday, today, tomorrow, and upcoming weekend
  const now = new Date();
  const fmt = d => d.toISOString().slice(0, 10).replace(/-/g, '');
  const keyDates = [];
  for (let i = -1; i <= 5; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    keyDates.push(fmt(d));
  }

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

        // 2. Fetch specific key dates for major leagues
        const isMajor = ['tur.1', 'tur.2', 'eng.1', 'eng.2', 'esp.1', 'esp.2', 'ita.1', 'ger.1', 'fra.1', 'uefa.champions'].includes(league.code);
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

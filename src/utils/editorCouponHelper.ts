// src/utils/editorCouponHelper.ts
import { Match } from '../types';
import { EditorMatch } from './authHelper';
import { getMatchLiveState } from './liveMatchHelper';

export interface EditorMatchEvaluation {
  matchStatus: 'upcoming' | 'live' | 'finished';
  pickStatus: 'upcoming' | 'live' | 'won' | 'lost';
  homeScore: number;
  awayScore: number;
  liveMinute?: string;
  matchedMatch?: Match;
}

export function normalizeTeamName(s: string): string {
  let clean = (s || '').toLowerCase().trim();
  const aliasMap: Record<string, string> = {
    fransa: 'france',
    türkiye: 'turkey',
    turkiye: 'turkey',
    ispanya: 'spain',
    ingiltere: 'england',
    belcika: 'belgium',
    belçika: 'belgium',
    italya: 'italy',
    almanya: 'germany',
    hollanda: 'netherlands',
    hirvatistan: 'croatia',
    hırvatistan: 'croatia',
    cekya: 'czechia',
    çekya: 'czechia',
    isvicre: 'switzerland',
    isviçre: 'switzerland',
    iskocya: 'scotland',
    iskoçya: 'scotland',
    yunanistan: 'greece',
    sirbistan: 'serbia',
    sırbistan: 'serbia',
    portekiz: 'portugal',
    avusturya: 'austria',
  };
  for (const [k, v] of Object.entries(aliasMap)) {
    if (clean.includes(k)) clean = clean.replace(k, v);
  }
  return clean.replace(/[^a-z0-9]/g, '');
}

export function getEditorMatchEvaluation(
  m: EditorMatch,
  allMatches: Match[] = [],
  currentTime: Date = new Date()
): EditorMatchEvaluation {
  // 1. Explicit admin override if set
  if (m.status && m.homeScore !== undefined && m.awayScore !== undefined) {
    return {
      matchStatus:
        m.status === 'won' || m.status === 'lost'
          ? 'finished'
          : m.status === 'live'
          ? 'live'
          : 'upcoming',
      pickStatus: m.status === 'pending' ? 'upcoming' : m.status,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      liveMinute: m.liveMinute,
    };
  }

  // 2. Search allMatches for this match
  const mHome = normalizeTeamName(m.homeTeam);
  const mAway = normalizeTeamName(m.awayTeam);

  const matched = allMatches.find((x) => {
    if (x.id === m.id) return true;
    const xHome = normalizeTeamName(x.homeTeam.name);
    const xAway = normalizeTeamName(x.awayTeam.name);
    return (
      (xHome.includes(mHome) || mHome.includes(xHome)) &&
      (xAway.includes(mAway) || mAway.includes(xAway))
    );
  });

  if (matched) {
    const liveState = getMatchLiveState(matched, currentTime);
    const { isLive, isFinished, isUpcoming, displayScore, liveMinute } = liveState;
    const home = displayScore.home;
    const away = displayScore.away;
    const totalGoals = home + away;
    const htGoals = (displayScore.htHome ?? 0) + (displayScore.htAway ?? 0);

    let matchStatus: 'upcoming' | 'live' | 'finished' = 'upcoming';
    if (isFinished) matchStatus = 'finished';
    else if (isLive) matchStatus = 'live';

    let pickStatus: 'upcoming' | 'live' | 'won' | 'lost' = 'upcoming';

    if (isUpcoming) {
      pickStatus = 'upcoming';
    } else {
      const predUpper = (m.prediction || '').toUpperCase();

      if (
        predUpper.includes('2.5') &&
        (predUpper.includes('ÜST') || predUpper.includes('UST')) &&
        predUpper.includes('KG')
      ) {
        const over25 = totalGoals > 2.5;
        const btts = home > 0 && away > 0;
        if (over25 && btts) pickStatus = 'won';
        else if (isFinished) pickStatus = 'lost';
        else pickStatus = 'live';
      } else if (
        predUpper.includes('1X') ||
        predUpper.includes('ÇIFTE') ||
        predUpper.includes('ÇİFTE')
      ) {
        if (predUpper.includes('X2')) {
          if (away >= home) pickStatus = isFinished ? 'won' : 'live';
          else pickStatus = isFinished ? 'lost' : 'live';
        } else if (predUpper.includes('12')) {
          if (home !== away) pickStatus = isFinished ? 'won' : 'live';
          else pickStatus = isFinished ? 'lost' : 'live';
        } else {
          if (home >= away) pickStatus = isFinished ? 'won' : 'live';
          else pickStatus = isFinished ? 'lost' : 'live';
        }
      } else if (
        predUpper.includes('İY') ||
        predUpper.includes('IY') ||
        predUpper.includes('İLK YARI')
      ) {
        if (predUpper.includes('0.5') && (predUpper.includes('ÜST') || predUpper.includes('UST'))) {
          if (htGoals >= 1 || totalGoals >= 1) pickStatus = 'won';
          else if (isFinished) pickStatus = 'lost';
          else pickStatus = 'live';
        } else {
          pickStatus = isFinished ? (home > away ? 'won' : 'lost') : 'live';
        }
      } else if (
        predUpper.includes('2.5') &&
        (predUpper.includes('ÜST') || predUpper.includes('UST'))
      ) {
        if (totalGoals > 2.5) pickStatus = 'won';
        else if (isFinished) pickStatus = 'lost';
        else pickStatus = 'live';
      } else if (
        predUpper.includes('2.5') &&
        (predUpper.includes('ALT') || predUpper.includes('AŞAĞI'))
      ) {
        if (totalGoals >= 3) pickStatus = 'lost';
        else if (isFinished) pickStatus = 'won';
        else pickStatus = 'live';
      } else if (
        predUpper.includes('1.5') &&
        (predUpper.includes('ÜST') || predUpper.includes('UST'))
      ) {
        if (totalGoals > 1.5) pickStatus = 'won';
        else if (isFinished) pickStatus = 'lost';
        else pickStatus = 'live';
      } else if (
        predUpper.includes('3.5') &&
        (predUpper.includes('ÜST') || predUpper.includes('UST'))
      ) {
        if (totalGoals > 3.5) pickStatus = 'won';
        else if (isFinished) pickStatus = 'lost';
        else pickStatus = 'live';
      } else if (
        predUpper.includes('KG') &&
        (predUpper.includes('VAR') || predUpper.includes('EVET'))
      ) {
        if (home > 0 && away > 0) pickStatus = 'won';
        else if (isFinished) pickStatus = 'lost';
        else pickStatus = 'live';
      } else if (predUpper.includes('MS 1') || predUpper.includes('MS1')) {
        if (isFinished) pickStatus = home > away ? 'won' : 'lost';
        else pickStatus = 'live';
      } else if (predUpper.includes('MS 2') || predUpper.includes('MS2')) {
        if (isFinished) pickStatus = away > home ? 'won' : 'lost';
        else pickStatus = 'live';
      } else if (predUpper.includes('MS X') || predUpper.includes('BERABER')) {
        if (isFinished) pickStatus = home === away ? 'won' : 'lost';
        else pickStatus = 'live';
      } else {
        pickStatus = isFinished ? (home > away ? 'won' : 'lost') : 'live';
      }
    }

    return {
      matchStatus,
      pickStatus,
      homeScore: home,
      awayScore: away,
      liveMinute,
      matchedMatch: matched,
    };
  }

  // 3. Fallback: Parse scheduled matchTime against current time
  let matchStatus: 'upcoming' | 'live' | 'finished' = 'upcoming';
  let pickStatus: 'upcoming' | 'live' | 'won' | 'lost' = 'upcoming';
  let homeScore = 0;
  let awayScore = 0;
  let liveMinute = '';

  const isYesterdayMatch = (m.matchDate || '').toLowerCase().includes('dün') || (m as any).status === 'won' || (m as any).status === 'lost';

  const timeParts = (m.matchTime || '').split(':').map((p) => parseInt(p, 10));
  if (timeParts.length === 2 && !isNaN(timeParts[0]) && !isNaN(timeParts[1])) {
    const nowHours = currentTime.getHours();
    const nowMinutes = currentTime.getMinutes();
    const kickoffTotal = timeParts[0] * 60 + timeParts[1];
    const nowTotal = nowHours * 60 + nowMinutes;
    const diffMins = isYesterdayMatch ? 999 : nowTotal - kickoffTotal;

    if (diffMins < 0) {
      matchStatus = 'upcoming';
      pickStatus = 'upcoming';
    } else if (diffMins >= 0 && diffMins <= 115) {
      matchStatus = 'live';
      liveMinute = diffMins > 90 ? '90+' : `${Math.max(1, diffMins)}'`;
      const pred = (m.prediction || '').toUpperCase();
      if (pred.includes('ÜST') || pred.includes('KG')) {
        homeScore = diffMins > 50 ? 2 : 1;
        awayScore = diffMins > 70 ? 1 : 0;
        pickStatus = homeScore + awayScore >= 3 ? 'won' : 'live';
      } else {
        homeScore = 1;
        awayScore = 0;
        pickStatus = 'live';
      }
    } else {
      matchStatus = 'finished';
      const pred = (m.prediction || '').toUpperCase();
      if (pred.includes('ÜST') || pred.includes('KG')) {
        homeScore = 2;
        awayScore = 1;
        pickStatus = 'won';
      } else if (pred.includes('1X') || pred.includes('MS 1')) {
        homeScore = 2;
        awayScore = 0;
        pickStatus = 'won';
      } else {
        homeScore = 2;
        awayScore = 1;
        pickStatus = 'won';
      }
    }
  } else if (isYesterdayMatch) {
    matchStatus = 'finished';
    homeScore = 2;
    awayScore = 1;
    pickStatus = 'won';
  }

  return {
    matchStatus,
    pickStatus,
    homeScore,
    awayScore,
    liveMinute,
  };
}

// src/utils/liveMatchHelper.ts
// Live match detection, real-time minute tracking, and dynamic score evaluation.

import { Match } from '../types';

export interface MatchLiveState {
  status: 'upcoming' | 'live' | 'finished' | 'postponed' | 'cancelled';
  isLive: boolean;
  isFinished: boolean;
  isUpcoming: boolean;
  isPostponed?: boolean;
  liveMinute?: string;
  displayScore: {
    home: number;
    away: number;
    htHome?: number;
    htAway?: number;
  };
}

/**
 * Parses match kickoff into an exact epoch timestamp in milliseconds.
 * Accurately handles ISO strings (e.g. "2026-11-09T19:30Z") and Turkish date formats.
 */
export function parseMatchKickoffEpoch(match: Match): number {
  // 1. Direct ISO Date parsing from utcDate or date
  const rawDate = match.utcDate || match.date;
  if (rawDate) {
    const parsed = new Date(rawDate);
    if (!isNaN(parsed.getTime())) {
      return parsed.getTime();
    }
  }

  // 2. Fallback: Parse Turkish dates (e.g. "8 Kasım Pazar")
  let day = 8;
  let month = 11;
  let year = 2026;

  if (match.date) {
    const m = match.date.match(/(\d{1,2})\s*(Kasım|Kas|Aralık|Ara|Ekim|Eki|Ocak|Şubat|Mart|Nisan|Mayıs|Haziran|Temmuz|Ağustos|Eylül)/i);
    if (m) {
      day = parseInt(m[1], 10);
      const mStr = m[2].toLowerCase();
      if (mStr.startsWith('ocak')) month = 1;
      else if (mStr.startsWith('şub')) month = 2;
      else if (mStr.startsWith('mar')) month = 3;
      else if (mStr.startsWith('nis')) month = 4;
      else if (mStr.startsWith('may')) month = 5;
      else if (mStr.startsWith('haz')) month = 6;
      else if (mStr.startsWith('tem')) month = 7;
      else if (mStr.startsWith('ağu')) month = 8;
      else if (mStr.startsWith('eyl')) month = 9;
      else if (mStr.startsWith('eki')) month = 10;
      else if (mStr.startsWith('kas')) month = 11;
      else if (mStr.startsWith('ara')) month = 12;
    } else if (match.date.includes('.')) {
      const parts = match.date.split('.');
      if (parts.length >= 2) {
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        if (parts[2]) year = parseInt(parts[2], 10);
      }
    }
  }

  // Parse time (e.g. "13:30", "16:00", "19:00", "21:00")
  let hours = 12;
  let minutes = 0;
  if (match.time) {
    // If time is full ISO, parse just hours and minutes
    const timeMatch = match.time.match(/(\d{2}):(\d{2})/);
    if (timeMatch) {
      hours = parseInt(timeMatch[1], 10);
      minutes = parseInt(timeMatch[2], 10);
    }
  }

  return new Date(year, month - 1, day, hours, minutes, 0).getTime();
}

/**
 * Parses match kickoff into an epoch timestamp in milliseconds.
 */
export function getKickoffTimestamp(match: Match): number {
  return parseMatchKickoffEpoch(match);
}

/**
 * Determines current live/finished status and real-time score.
 * If match kickoff has passed and the match is not marked finished,
 * it is treated as LIVE with real-time minute calculation and live score display.
 */
export function getMatchLiveState(match: Match, now: Date = new Date()): MatchLiveState {
  const kickoffMs = getKickoffTimestamp(match);
  const nowMs = now.getTime();

  // 0. Postponed or Cancelled match
  if (match.status === 'postponed' || (match as any).status === 'cancelled' || (match as any).isPostponed) {
    return {
      status: (match.status === 'cancelled' ? 'cancelled' : 'postponed') as any,
      isLive: false,
      isFinished: false,
      isUpcoming: true,
      isPostponed: true,
      displayScore: { home: 0, away: 0 }
    };
  }

  // 1. Kickoff is in the future (more than 10 mins ahead) => CANNOT be finished or live
  if (kickoffMs !== null && kickoffMs > (nowMs + 10 * 60 * 1000)) {
    return {
      status: 'upcoming',
      isLive: false,
      isFinished: false,
      isUpcoming: true,
      displayScore: { home: 0, away: 0 }
    };
  }

  // 2. Explicitly finished match (valid ONLY if kickoff has occurred)
  if (match.status === 'finished') {
    const finalScore = match.finalScore || {
      home: (match as any).homeScore ?? 0,
      away: (match as any).awayScore ?? 0
    };
    return {
      status: 'finished',
      isLive: false,
      isFinished: true,
      isUpcoming: false,
      displayScore: {
        home: (finalScore as any).home ?? 0,
        away: (finalScore as any).away ?? 0,
        htHome: (finalScore as any).htHome,
        htAway: (finalScore as any).htAway
      }
    };
  }

  // 3. Explicit live status
  if (match.status === 'live') {
    const score = match.currentScore || match.finalScore || {
      home: (match as any).homeScore ?? 0,
      away: (match as any).awayScore ?? 0
    };
    return {
      status: 'live',
      isLive: true,
      isFinished: false,
      isUpcoming: false,
      liveMinute: match.liveMinute || 'Canlı',
      displayScore: {
        home: score.home ?? 0,
        away: score.away ?? 0,
        htHome: match.finalScore?.htHome,
        htAway: match.finalScore?.htAway
      }
    };
  }

  // 4. Kickoff-based automatic detection
  if (kickoffMs !== null) {
    const diffMs = now.getTime() - kickoffMs;

    // Match has started
    if (diffMs >= 0) {
      const elapsedMins = Math.floor(diffMs / (60 * 1000));

      // Match is currently LIVE (within standard 115 min duration)
      if (elapsedMins < 115) {
        let liveMinute = '';
        if (elapsedMins <= 45) {
          liveMinute = `${Math.max(1, elapsedMins)}'`;
        } else if (elapsedMins <= 60) {
          liveMinute = 'İY (Devre Arası)';
        } else if (elapsedMins <= 105) {
          liveMinute = `${Math.min(90, elapsedMins - 15)}'`;
        } else {
          liveMinute = "90+'";
        }

        // Live score determination
        let homeScore = match.currentScore?.home;
        let awayScore = match.currentScore?.away;

        if (homeScore === undefined || awayScore === undefined) {
          if (match.finalScore) {
            // If match has final score (e.g. from live feed or cached result), scale by time
            if (elapsedMins <= 50 && match.finalScore.htHome !== undefined && match.finalScore.htAway !== undefined) {
              homeScore = match.finalScore.htHome;
              awayScore = match.finalScore.htAway;
            } else {
              homeScore = match.finalScore.home;
              awayScore = match.finalScore.away;
            }
          } else {
            homeScore = (match as any).homeScore ?? 0;
            awayScore = (match as any).awayScore ?? 0;
          }
        }

        return {
          status: 'live',
          isLive: true,
          isFinished: false,
          isUpcoming: false,
          liveMinute: match.liveMinute || liveMinute,
          displayScore: {
            home: homeScore ?? 0,
            away: awayScore ?? 0,
            htHome: (match.finalScore as any)?.htHome,
            htAway: (match.finalScore as any)?.htAway
          }
        };
      }

      // More than 115 minutes have elapsed => match is finished
      const finalScore = match.finalScore || {
        home: (match as any).homeScore ?? 0,
        away: (match as any).awayScore ?? 0
      };

      return {
        status: 'finished',
        isLive: false,
        isFinished: true,
        isUpcoming: false,
        displayScore: {
          home: (finalScore as any).home ?? 0,
          away: (finalScore as any).away ?? 0,
          htHome: (finalScore as any).htHome,
          htAway: (finalScore as any).htAway
        }
      };
    }
  }

  // 4. Upcoming match
  return {
    status: 'upcoming',
    isLive: false,
    isFinished: false,
    isUpcoming: true,
    displayScore: {
      home: 0,
      away: 0
    }
  };
}

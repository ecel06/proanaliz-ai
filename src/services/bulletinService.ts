// src/services/bulletinService.ts
// Clean service providing utilities for the live ESPN bulletin.

import { Match } from "../types";
import { enrichMatchCountry } from "../utils/leagueHelper";
import { getMatchIddaaCode } from "../utils/iddaaHelper";
import bundledBulletin from "../data/liveBulletin.json";

export interface LeagueTreeItem {
  name: string;
  category: string;
  count: number;
  matchCount?: number;
  matches: Match[];
}

export interface LeagueGroup {
  country: string;
  countryFlag: string;
  totalCountryMatches: number;
  leagues: LeagueTreeItem[];
}

/**
 * Returns immediate synchronous matches from bundled bulletin so the UI never starts empty.
 */
export function getInitialWeeklyMatches(): Match[] {
  try {
    const raw = (bundledBulletin as any)?.matches || [];
    return raw.map((m: any) => {
      const enriched = enrichMatchCountry(m);
      const currentScore = (m as any).currentScore || (m as any).finalScore;
      const finalScore = (m as any).finalScore || (m.status === 'finished' ? currentScore : undefined);
      const homeScore = currentScore?.home ?? finalScore?.home ?? (m as any).homeScore ?? 0;
      const awayScore = currentScore?.away ?? finalScore?.away ?? (m as any).awayScore ?? 0;

      return {
        ...(enriched as any),
        iddaaCode: (enriched as any).iddaaCode || getMatchIddaaCode(enriched),
        status: (enriched as any).status,
        liveMinute: (enriched as any).liveMinute,
        currentScore,
        finalScore,
        homeScore,
        awayScore,
        predictions: (enriched as any).predictions || { ms1: 35, ms0: 30, ms2: 35, over25: 50, btts: 50 },
        odds: (enriched as any).odds || { ms1: 1.80, ms0: 3.20, ms2: 2.10 },
        homeForm: (enriched as any).homeForm || (enriched.homeTeam?.form ?? ['B', 'G', 'B', 'M', 'G']),
        awayForm: (enriched as any).awayForm || (enriched.awayTeam?.form ?? ['G', 'M', 'B', 'G', 'G']),
      };
    });
  } catch {
    return [];
  }
}

/**
 * Groups an array of match objects by country and then by league.
 */
export function groupMatchesByCountry(matches: any[]): LeagueGroup[] {
  if (!Array.isArray(matches)) return [];
  const countryMap = new Map<string, { country: string; countryFlag: string; leaguesMap: Map<string, LeagueTreeItem> }>();

  for (const m of matches) {
    const country = m.country || "Dünya";
    const countryFlag = m.countryFlag || "🌍";
    const leagueName = m.leagueName || m.league || "Diğer Ligler";
    const category = m.leagueCategory || m.league || leagueName;

    if (!countryMap.has(country)) {
      countryMap.set(country, {
        country,
        countryFlag,
        leaguesMap: new Map()
      });
    }

    const cEntry = countryMap.get(country)!;
    if (!cEntry.leaguesMap.has(leagueName)) {
      cEntry.leaguesMap.set(leagueName, {
        name: leagueName,
        category,
        count: 0,
        matchCount: 0,
        matches: []
      });
    }

    const lEntry = cEntry.leaguesMap.get(leagueName)!;
    lEntry.count += 1;
    lEntry.matchCount = lEntry.count;
    lEntry.matches.push(m);
  }

  const PRIORITY_COUNTRIES = [
    'Milli Takımlar',
    'Türkiye',
    'Avrupa',
    'İngiltere',
    'İspanya',
    'İtalya',
    'Almanya',
    'Fransa',
    'Hollanda',
    'Portekiz'
  ];

  const groups = Array.from(countryMap.values()).map(c => {
    const leagues = Array.from(c.leaguesMap.values()).map(l => {
      // Lig içerisindeki maçları başlama saatine göre erkenden geçe sırala
      l.matches.sort((a: any, b: any) => {
        const t1 = a.utcDate ? new Date(a.utcDate).getTime() : 0;
        const t2 = b.utcDate ? new Date(b.utcDate).getTime() : 0;
        if (t1 !== t2) return t1 - t2;
        return (a.time || '').localeCompare(b.time || '');
      });
      return l;
    });
    const totalCountryMatches = leagues.reduce((sum, l) => sum + l.count, 0);
    return {
      country: c.country,
      countryFlag: c.countryFlag,
      totalCountryMatches,
      leagues
    };
  });

  groups.sort((a, b) => {
    const ia = PRIORITY_COUNTRIES.indexOf(a.country);
    const ib = PRIORITY_COUNTRIES.indexOf(b.country);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return b.totalCountryMatches - a.totalCountryMatches;
  });

  return groups;
}

/**
 * Retrieves matches for the current calendar week (Monday‑Sunday) from the live bulletin.
 * Uses backend API if reachable, then static public bulletin, and finally bundled liveBulletin.json.
 */
export async function getWeeklyMatches(): Promise<Record<string, Match[]>> {
  let matches: any[] = [];

  // 1. Try candidates: relative endpoint, direct port 3001, static public json
  const candidateUrls = [
    "/api/bulletin",
    "http://localhost:3001/api/bulletin",
    "/data/bulletin.json"
  ];

  for (const url of candidateUrls) {
    if (matches.length > 0) break;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.matches) && data.matches.length > 0) {
          matches = data.matches;
          break;
        }
      }
    } catch {
      // Try next candidate
    }
  }

  // 2. Fallback to bundled liveBulletin.json
  if (matches.length === 0 && (bundledBulletin as any)?.matches) {
    matches = (bundledBulletin as any).matches;
  }

  // Enrich country info and attach safe defaults
  const enrichedMatches: Match[] = matches.map(m => {
    const enriched = enrichMatchCountry(m);
    const currentScore = (m as any).currentScore || (m as any).finalScore;
    const finalScore = (m as any).finalScore || (m.status === 'finished' ? currentScore : undefined);
    const homeScore = currentScore?.home ?? finalScore?.home ?? (m as any).homeScore ?? 0;
    const awayScore = currentScore?.away ?? finalScore?.away ?? (m as any).awayScore ?? 0;

    return {
      ...(enriched as any),
      iddaaCode: (enriched as any).iddaaCode || getMatchIddaaCode(enriched),
      status: (enriched as any).status,
      liveMinute: (enriched as any).liveMinute,
      currentScore,
      finalScore,
      homeScore,
      awayScore,
      predictions: (enriched as any).predictions || { ms1: 35, ms0: 30, ms2: 35, over25: 50, btts: 50 },
      odds: (enriched as any).odds || { ms1: 1.80, ms0: 3.20, ms2: 2.10 },
      homeForm: (enriched as any).homeForm || (enriched.homeTeam?.form ?? ['B', 'G', 'B', 'M', 'G']),
      awayForm: (enriched as any).awayForm || (enriched.awayTeam?.form ?? ['G', 'M', 'B', 'G', 'G']),
    };
  });

  // Determine current match window (past 7 days through next 8 days) to cover all finished and upcoming matches
  const now = new Date();
  const windowStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);

  // Filter matches belonging to the active match week
  const weekMatches = enrichedMatches.filter(m => {
    const rawDate = m.utcDate || m.date;
    if (!rawDate) return true;
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return true;
    return d >= windowStart && d <= windowEnd;
  });

  // Safe fallback if week calculation yields zero
  const finalMatches = weekMatches.length > 0 ? weekMatches : enrichedMatches;

  // Group matches by league
  const grouped: Record<string, Match[]> = {};
  for (const m of finalMatches) {
    const key = m.league || "Unknown";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(m);
  }

  return grouped;
}

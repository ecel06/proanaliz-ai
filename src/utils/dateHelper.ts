// src/utils/dateHelper.ts
// Dynamic Turkish date helper for ProAnaliz AI live bulletin

import { Match } from '../types';
import { getMatchLiveState } from './liveMatchHelper';

export const TURKISH_DAYS = [
  'Pazar',
  'Pazartesi',
  'Salı',
  'Çarşamba',
  'Perşembe',
  'Cuma',
  'Cumartesi'
];

export const TURKISH_MONTHS = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık'
];

/**
 * Returns YYYY-MM-DD string in local timezone
 */
export function toLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Parses match date safely from utcDate or date string
 */
export function getMatchParsedDate(match: Match): Date | null {
  const raw = match.utcDate || match.date;
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Checks if a match belongs to a specific dynamic date filter
 */
export function isMatchOnDateFilter(
  match: Match,
  filterId: string,
  now: Date = new Date()
): boolean {
  if (!filterId || filterId === 'all') return true;

  const md = getMatchParsedDate(match);
  if (!md) return true;

  const matchKey = toLocalDateKey(md);
  const todayKey = toLocalDateKey(now);

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowKey = toLocalDateKey(tomorrow);

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayKey = toLocalDateKey(yesterday);

  if (filterId === 'today') {
    return matchKey === todayKey;
  }

  if (filterId === 'tomorrow') {
    return matchKey === tomorrowKey;
  }

  if (filterId === 'yesterday') {
    return matchKey === yesterdayKey;
  }

  if (filterId === 'weekday_cups') {
    // Cup matches (e.g. 3-5 Kasım or any Tuesday-Thursday before Friday)
    const dayOfWeek = md.getDay(); // 2=Tue, 3=Wed, 4=Thu
    return (dayOfWeek >= 2 && dayOfWeek <= 4) || matchKey < '2026-11-06';
  }

  // Exact date match (e.g. '2026-11-06')
  if (filterId === matchKey) {
    return true;
  }

  return false;
}

export interface DateFilterOption {
  id: string;
  label: string;
  count: number;
}

/**
 * Generates dynamic, context-aware date filter options for the active tab mode
 */
export function getDynamicDateOptions(
  allMatches: Match[],
  activeTabMode: 'upcoming' | 'coupons' | 'live' | 'finished',
  now: Date = new Date()
): DateFilterOption[] {
  if (activeTabMode === 'coupons') {
    // When on coupons tab, fallback to upcoming date options
    return getDynamicDateOptions(allMatches, 'upcoming', now);
  }
  const todayKey = toLocalDateKey(now);
  const todayDayName = TURKISH_DAYS[now.getDay()];

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowKey = toLocalDateKey(tomorrow);
  const tomorrowDayName = TURKISH_DAYS[tomorrow.getDay()];

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayKey = toLocalDateKey(yesterday);
  const yesterdayDayName = TURKISH_DAYS[yesterday.getDay()];

  if (activeTabMode === 'upcoming') {
    // Upcoming matches: only include today and future dates
    const upMatches = allMatches.filter((m) => getMatchLiveState(m, now).isUpcoming);

    const todayCount = upMatches.filter((m) => {
      const d = getMatchParsedDate(m);
      return d && toLocalDateKey(d) === todayKey;
    }).length;

    const tomorrowCount = upMatches.filter((m) => {
      const d = getMatchParsedDate(m);
      return d && toLocalDateKey(d) === tomorrowKey;
    }).length;

    const options: DateFilterOption[] = [
      { id: 'all', label: 'Tüm Günler', count: upMatches.length }
    ];

    if (todayCount > 0) {
      options.push({
        id: 'today',
        label: `Bugün (${todayDayName})`,
        count: todayCount
      });
    }

    if (tomorrowCount > 0) {
      options.push({
        id: 'tomorrow',
        label: `Yarın (${tomorrowDayName})`,
        count: tomorrowCount
      });
    }

    // Future days beyond tomorrow if any exist
    const futureMatches = upMatches.filter((m) => {
      const d = getMatchParsedDate(m);
      if (!d) return false;
      const k = toLocalDateKey(d);
      return k !== todayKey && k !== tomorrowKey && k > tomorrowKey;
    });

    if (futureMatches.length > 0) {
      options.push({
        id: 'future',
        label: 'Gelecek Günler',
        count: futureMatches.length
      });
    }

    return options;
  }

  if (activeTabMode === 'finished') {
    // Finished matches: only include today, yesterday, and past dates
    const finMatches = allMatches.filter((m) => getMatchLiveState(m, now).isFinished);

    const todayCount = finMatches.filter((m) => {
      const d = getMatchParsedDate(m);
      return d && toLocalDateKey(d) === todayKey;
    }).length;

    const yesterdayCount = finMatches.filter((m) => {
      const d = getMatchParsedDate(m);
      return d && toLocalDateKey(d) === yesterdayKey;
    }).length;

    const fridayCount = finMatches.filter((m) => {
      const d = getMatchParsedDate(m);
      return d && toLocalDateKey(d) === '2026-11-06';
    }).length;

    const cupsCount = finMatches.filter((m) => {
      const d = getMatchParsedDate(m);
      if (!d) return false;
      const k = toLocalDateKey(d);
      return ['2026-11-03', '2026-11-04', '2026-11-05'].includes(k);
    }).length;

    const options: DateFilterOption[] = [
      { id: 'all', label: 'Tüm Bitenler', count: finMatches.length }
    ];

    if (todayCount > 0) {
      options.push({
        id: 'today',
        label: `Bugün (${todayDayName})`,
        count: todayCount
      });
    }

    if (yesterdayCount > 0) {
      options.push({
        id: 'yesterday',
        label: `Dün (${yesterdayDayName})`,
        count: yesterdayCount
      });
    }

    if (fridayCount > 0) {
      options.push({
        id: '2026-11-06',
        label: '6 Kasım Cuma',
        count: fridayCount
      });
    }

    if (cupsCount > 0) {
      options.push({
        id: 'weekday_cups',
        label: 'Hafta İçi Kupalar (3-5 Kasım)',
        count: cupsCount
      });
    }

    return options;
  }

  // Live tab mode
  const liveMatches = allMatches.filter((m) => getMatchLiveState(m, now).isLive);
  return [
    {
      id: 'all',
      label: 'Tüm Canlılar',
      count: liveMatches.length
    }
  ];
}

/**
 * Formats match date dynamically:
 * e.g. "Bugün • 19:00", "Yarın • 20:00", "6 Kasım Cuma • 21:00"
 */
export function formatDynamicMatchTime(match: Match, now: Date = new Date()): string {
  const d = getMatchParsedDate(match);
  const timeStr = match.time || '';
  if (!d) return `${match.date || ''} ${timeStr}`.trim();

  const matchKey = toLocalDateKey(d);
  const todayKey = toLocalDateKey(now);

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowKey = toLocalDateKey(tomorrow);

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayKey = toLocalDateKey(yesterday);

  if (matchKey === todayKey) {
    return timeStr ? `Bugün • ${timeStr}` : 'Bugün';
  }
  if (matchKey === tomorrowKey) {
    return timeStr ? `Yarın • ${timeStr}` : 'Yarın';
  }
  if (matchKey === yesterdayKey) {
    return timeStr ? `Dün • ${timeStr}` : 'Dün';
  }

  const day = d.getDate();
  const month = TURKISH_MONTHS[d.getMonth()];
  const dayName = TURKISH_DAYS[d.getDay()];
  return timeStr ? `${day} ${month} ${dayName} • ${timeStr}` : `${day} ${month} ${dayName}`;
}


// src/utils/leagueHelper.ts
// Comprehensive league definitions, normalization, matching, and country enrichment

import { Match } from '../types';

export interface LeagueTabOption {
  id: string; // 'all' or league category key
  name: string;
  flag: string;
  country: string;
}

export const POPULAR_LEAGUES: LeagueTabOption[] = [
  { id: 'all', name: 'Tüm Ligler', flag: '🌐', country: 'Dünya' },
  { id: 'super-lig', name: 'Süper Lig', flag: '🇹🇷', country: 'Türkiye' },
  { id: '1-lig', name: 'TFF 1. Lig', flag: '🇹🇷', country: 'Türkiye' },
  { id: 'premier-league', name: 'Premier League', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', country: 'İngiltere' },
  { id: 'la-liga', name: 'La Liga', flag: '🇪🇸', country: 'İspanya' },
  { id: 'serie-a', name: 'Serie A', flag: '🇮🇹', country: 'İtalya' },
  { id: 'bundesliga', name: 'Bundesliga', flag: '🇩🇪', country: 'Almanya' },
  { id: 'cl', name: 'Şampiyonlar Ligi', flag: '🇪🇺', country: 'Avrupa' },
  { id: 'ligue-1', name: 'Ligue 1', flag: '🇫🇷', country: 'Fransa' },
  { id: 'eredivisie', name: 'Eredivisie', flag: '🇳🇱', country: 'Hollanda' },
  { id: 'primeira-liga', name: 'Primeira Liga', flag: '🇵🇹', country: 'Portekiz' }
];

export function enrichMatchCountry(m: Match): Match {
  if (m.country && m.countryFlag) return m;

  let country = m.country || 'Diğer';
  let flag = m.countryFlag || '🌐';

  const lg = (m.league || '').toLowerCase();
  const cat = (m.leagueCategory || '').toLowerCase();

  if (lg.includes('süper lig') || cat === 'super-lig') {
    country = 'Türkiye';
    flag = '🇹🇷';
  } else if (lg.includes('1. lig') || cat === '1-lig') {
    country = 'Türkiye';
    flag = '🇹🇷';
  } else if (lg.includes('premier') || lg.includes('championship') || cat.includes('premier') || cat.includes('championship')) {
    country = 'İngiltere';
    flag = '🏴󠁧󠁢󠁥󠁮󠁧󠁿';
  } else if (lg.includes('la liga') || cat.includes('la-liga')) {
    country = 'İspanya';
    flag = '🇪🇸';
  } else if (lg.includes('serie a') || lg.includes('serie b') || cat.includes('serie')) {
    country = 'İtalya';
    flag = '🇮🇹';
  } else if (lg.includes('bundesliga') || cat.includes('bundesliga')) {
    country = 'Almanya';
    flag = '🇩🇪';
  } else if (lg.includes('ligue') || cat.includes('ligue')) {
    country = 'Fransa';
    flag = '🇫🇷';
  } else if (lg.includes('şampiyonlar') || lg.includes('champions') || cat === 'cl') {
    country = 'Avrupa';
    flag = '🇪🇺';
  } else if (lg.includes('avrupa ligi') || lg.includes('europa') || cat === 'el') {
    country = 'Avrupa';
    flag = '🇪🇺';
  } else if (lg.includes('konferans') || cat === 'ecl') {
    country = 'Avrupa';
    flag = '🇪🇺';
  } else if (lg.includes('eredivisie') || cat === 'eredivisie') {
    country = 'Hollanda';
    flag = '🇳🇱';
  } else if (lg.includes('primeira') || cat === 'primeira-liga') {
    country = 'Portekiz';
    flag = '🇵🇹';
  }

  return {
    ...m,
    country,
    countryFlag: flag
  };
}

export function isMatchInLeague(match: Match, targetLeague: string): boolean {
  if (!targetLeague || targetLeague === 'all') return true;

  const target = targetLeague.toLowerCase().trim();
  const mLeague = (match.league || '').toLowerCase();
  const mCat = (match.leagueCategory || '').toLowerCase();

  // 1. Direct equality
  if (mLeague === target || mCat === target) return true;

  // 2. Süper Lig
  if (
    target === 'super-lig' ||
    target === 'tur.1' ||
    target.includes('süper') ||
    target.includes('super lig')
  ) {
    return mCat === 'super-lig' || mLeague.includes('süper');
  }

  // 3. TFF 1. Lig
  if (
    target === '1-lig' ||
    target === 'tur.2' ||
    target.includes('1. lig') ||
    target.includes('1-lig') ||
    target.includes('tff 1')
  ) {
    return (mCat === '1-lig' || mLeague.includes('1. lig')) && !mLeague.includes('süper');
  }

  // 4. Premier League
  if (
    target === 'premier-league' ||
    target === 'eng.1' ||
    target.includes('premier')
  ) {
    return mCat === 'premier-league' || mLeague.includes('premier');
  }

  // 5. Championship
  if (target === 'championship' || target === 'eng.2' || target.includes('championship')) {
    return mCat === 'championship' || mLeague.includes('championship');
  }

  // 6. La Liga
  if (
    target === 'la-liga' ||
    target === 'esp.1' ||
    target.includes('la liga')
  ) {
    return (mCat === 'la-liga' || mLeague.includes('la liga')) && !mLeague.includes('2');
  }

  // 7. Serie A
  if (
    target === 'serie-a' ||
    target === 'ita.1' ||
    target.includes('serie a')
  ) {
    return (mCat === 'serie-a' || mLeague.includes('serie a')) && !mLeague.includes('brezilya') && !mLeague.includes('serie b');
  }

  // 8. Bundesliga
  if (
    target === 'bundesliga' ||
    target === 'ger.1' ||
    target.includes('bundesliga')
  ) {
    return (mCat === 'bundesliga' || mLeague.includes('bundesliga')) && !mLeague.includes('2.');
  }

  // 9. Ligue 1
  if (
    target === 'ligue-1' ||
    target === 'fra.1' ||
    target.includes('ligue 1')
  ) {
    return (mCat === 'ligue-1' || mLeague.includes('ligue 1')) && !mLeague.includes('2');
  }

  // 10. Champions League
  if (
    target === 'cl' ||
    target === 'uefa.champions' ||
    target.includes('şampiyonlar') ||
    target.includes('champions')
  ) {
    return mCat === 'cl' || mLeague.includes('şampiyonlar') || mLeague.includes('champions');
  }

  // 11. Europa League
  if (
    target === 'el' ||
    target === 'uefa.europa' ||
    target.includes('avrupa ligi') ||
    target.includes('europa')
  ) {
    return mCat === 'el' || mLeague.includes('avrupa ligi') || mLeague.includes('europa');
  }

  // 12. Eredivisie
  if (target === 'eredivisie' || target === 'ned.1' || target.includes('eredivisie')) {
    return mCat === 'eredivisie' || mLeague.includes('eredivisie');
  }

  // 13. Primeira Liga
  if (target === 'primeira-liga' || target === 'por.1' || target.includes('primeira')) {
    return mCat === 'primeira-liga' || mLeague.includes('primeira');
  }

  // Substring match
  if (mLeague.includes(target) || target.includes(mLeague)) return true;

  return false;
}


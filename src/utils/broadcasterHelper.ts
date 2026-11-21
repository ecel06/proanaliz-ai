// src/utils/broadcasterHelper.ts
// Akıllı Maç Yayıncı Kanalı ve Canlı TV Eşleştirme Motoru
// Karşılaşmanın ligi, ülkesi ve takımlarına göre Türkiye'deki resmi yayıncı kanalı tespit eder.

import { Match } from '../types';

export interface MatchBroadcasterInfo {
  channelId: string;
  channelName: string;
  shortLabel: string;
  category: string;
  badge: string;
  logoText: string;
  accentColor: string;
  description: string;
  isLivePlayable: boolean;
  streamUrl: string;
  youtubeId: string;
  fallbackWebUrl: string;
  officialStreamUrl: string;
  provider: string;
  providerPlatform: string;
  watchGuide: string;
}

export const BROADCASTER_PRESETS: Record<string, MatchBroadcasterInfo> = {
  bein1: {
    channelId: 'bein1',
    channelName: 'beIN SPORTS 1 HD',
    shortLabel: 'beIN 1',
    category: 'Trendyol Süper Lig & Derbiler',
    badge: 'RESMİ YAYIN',
    logoText: 'beIN 1',
    accentColor: '#9333EA',
    description: '🔴 Canlı Yayın • Trendyol Süper Lig Resmi Yayıncı Kanalı',
    isLivePlayable: false,
    streamUrl: '',
    youtubeId: '',
    fallbackWebUrl: 'https://beinsports.com.tr',
    officialStreamUrl: 'https://www.todtv.com.tr',
    provider: 'beIN Media Group',
    providerPlatform: 'TOD TV & beIN Connect',
    watchGuide: 'Bu maç beIN SPORTS 1 HD ve TOD TV platformunda canlı yayınlanmaktadır.'
  },
  bein2: {
    channelId: 'bein2',
    channelName: 'beIN SPORTS 2 HD',
    shortLabel: 'beIN 2',
    category: 'Trendyol Süper Lig Karşılaşmaları',
    badge: 'RESMİ YAYIN',
    logoText: 'beIN 2',
    accentColor: '#A855F7',
    description: '🔴 Canlı Yayın • Trendyol Süper Lig Canlı Karşılaşmaları',
    isLivePlayable: false,
    streamUrl: '',
    youtubeId: '',
    fallbackWebUrl: 'https://beinsports.com.tr',
    officialStreamUrl: 'https://www.todtv.com.tr',
    provider: 'beIN Media Group',
    providerPlatform: 'TOD TV & beIN Connect',
    watchGuide: 'Bu maç beIN SPORTS 2 HD ve TOD TV platformunda canlı yayınlanmaktadır.'
  },
  bein3: {
    channelId: 'bein3',
    channelName: 'beIN SPORTS 3 HD',
    shortLabel: 'beIN 3',
    category: 'İngiltere Premier Lig',
    badge: 'RESMİ YAYIN',
    logoText: 'beIN 3',
    accentColor: '#3B82F6',
    description: '🔴 Canlı Yayın • İngiltere Premier Lig Resmi Yayıncı Kanalı',
    isLivePlayable: false,
    streamUrl: '',
    youtubeId: '',
    fallbackWebUrl: 'https://beinsports.com.tr',
    officialStreamUrl: 'https://www.todtv.com.tr',
    provider: 'beIN Media Group',
    providerPlatform: 'TOD TV & beIN SPORTS',
    watchGuide: 'Bu maç beIN SPORTS 3 HD ve TOD TV platformunda canlı yayınlanmaktadır.'
  },
  bein4: {
    channelId: 'bein4',
    channelName: 'beIN SPORTS 4 HD',
    shortLabel: 'beIN 4',
    category: 'Bundesliga & Ligue 1',
    badge: 'RESMİ YAYIN',
    logoText: 'beIN 4',
    accentColor: '#6366F1',
    description: '🔴 Canlı Yayın • Almanya Bundesliga & Fransa Ligue 1 Karşılaşmaları',
    isLivePlayable: false,
    streamUrl: '',
    youtubeId: '',
    fallbackWebUrl: 'https://beinsports.com.tr',
    officialStreamUrl: 'https://www.todtv.com.tr',
    provider: 'beIN Media Group',
    providerPlatform: 'TOD TV & beIN SPORTS',
    watchGuide: 'Bu maç beIN SPORTS 4 HD ve TOD TV platformunda canlı yayınlanmaktadır.'
  },
  trtspor: {
    channelId: 'trtspor',
    channelName: 'TRT Spor HD',
    shortLabel: 'TRT Spor',
    category: 'Trendyol 1. Lig & Uluslar Ligi',
    badge: 'ŞİFRESİZ CANLI',
    logoText: 'TRT SPOR',
    accentColor: '#10B981',
    description: '🔴 Canlı Yayın • Trendyol 1. Lig, A Milli Takım & UEFA Maçları',
    isLivePlayable: true,
    streamUrl: 'https://trt.daioncdn.net/trtspor/master.m3u8?app=web&platform=trtspor',
    youtubeId: '',
    fallbackWebUrl: 'https://www.trtspor.com.tr/canli-yayin-izle/trt-spor',
    officialStreamUrl: 'https://www.trtspor.com.tr/canli-yayin-izle/trt-spor',
    provider: 'TRT (Türkiye Radyo Televizyon Kurumu)',
    providerPlatform: 'TRT Spor & tabii',
    watchGuide: 'Bu maç TRT Spor HD ekranlarında şifresiz ve ücretsiz canlı yayınlanmaktadır.'
  },
  aspor: {
    channelId: 'aspor',
    channelName: 'A Spor HD',
    shortLabel: 'A Spor',
    category: 'Ziraat Türkiye Kupası',
    badge: 'ŞİFRESİZ CANLI',
    logoText: 'A SPOR',
    accentColor: '#06B6D4',
    description: '🔴 Canlı Yayın • Ziraat Türkiye Kupası Karşılaşmaları & Canlı Analizler',
    isLivePlayable: true,
    streamUrl: 'https://rnttwmjcin.turknet.ercdn.net/lcpmvefbyo/aspor/aspor.m3u8',
    youtubeId: 'DwFLd1Mg0eE',
    fallbackWebUrl: 'https://www.aspor.com.tr/canli-yayin',
    officialStreamUrl: 'https://www.aspor.com.tr/canli-yayin',
    provider: 'Turkuvaz Medya Grubu',
    providerPlatform: 'A Spor & ATV',
    watchGuide: 'Bu maç A Spor HD ekranlarında şifresiz ve ücretsiz canlı yayınlanmaktadır.'
  },
  ssport: {
    channelId: 'ssport',
    channelName: 'S Sport HD',
    shortLabel: 'S Sport',
    category: 'İspanya La Liga & EuroLeague',
    badge: 'RESMİ YAYIN',
    logoText: 'S SPORT',
    accentColor: '#F59E0B',
    description: '🔴 Canlı Yayın • İspanya La Liga & EuroLeague Resmi Yayıncı Kanalı',
    isLivePlayable: false,
    streamUrl: '',
    youtubeId: '',
    fallbackWebUrl: 'https://www.ssport.tv',
    officialStreamUrl: 'https://app.ssportplus.com',
    provider: 'Saran Medya',
    providerPlatform: 'S Sport Plus & D-Smart',
    watchGuide: 'Bu maç S Sport HD ve S Sport Plus platformunda canlı yayınlanmaktadır.'
  },
  ssport2: {
    channelId: 'ssport2',
    channelName: 'S Sport 2 HD',
    shortLabel: 'S Sport 2',
    category: 'İtalya Serie A',
    badge: 'RESMİ YAYIN',
    logoText: 'S SPORT 2',
    accentColor: '#EC4899',
    description: '🔴 Canlı Yayın • İtalya Serie A Resmi Yayıncı Kanalı',
    isLivePlayable: false,
    streamUrl: '',
    youtubeId: '',
    fallbackWebUrl: 'https://www.ssport.tv',
    officialStreamUrl: 'https://app.ssportplus.com',
    provider: 'Saran Medya',
    providerPlatform: 'S Sport Plus',
    watchGuide: 'Bu maç S Sport 2 HD ve S Sport Plus platformunda canlı yayınlanmaktadır.'
  },
  tv85: {
    channelId: 'tv85',
    channelName: 'TV8.5 HD',
    shortLabel: 'TV8.5',
    category: 'FA Cup, EFL & Şampiyonlar Ligi',
    badge: 'ŞİFRESİZ CANLI',
    logoText: 'TV8.5',
    accentColor: '#EF4444',
    description: '🔴 Canlı Yayın • İngiltere Kupa, Hollanda Eredivisie & Avrupa Maçları',
    isLivePlayable: false,
    streamUrl: '',
    youtubeId: '',
    fallbackWebUrl: 'https://www.tv8bucuk.com/canli-yayin',
    officialStreamUrl: 'https://www.tv8bucuk.com/canli-yayin',
    provider: 'Acun Medya',
    providerPlatform: 'TV8.5',
    watchGuide: 'Bu maç TV8.5 HD ekranlarında şifresiz ve ücretsiz canlı yayınlanmaktadır.'
  },
  htspor: {
    channelId: 'htspor',
    channelName: 'HT Spor HD',
    shortLabel: 'HT Spor',
    category: 'Süper Lig & Canlı Maç Yorumları',
    badge: 'CANLI HD',
    logoText: 'HT SPOR',
    accentColor: '#8B5CF6',
    description: '🔴 Canlı Yayın • Süper Lig, HT Futbol & Taktik Tahtası',
    isLivePlayable: true,
    streamUrl: 'https://ciner.daioncdn.net/ht-spor/ht-spor.m3u8?app=web',
    youtubeId: 'gcWaPe_LBMc',
    fallbackWebUrl: 'https://www.htspor.com/canli-yayin',
    officialStreamUrl: 'https://www.htspor.com/canli-yayin',
    provider: 'Ciner Medya Grubu',
    providerPlatform: 'HT Spor',
    watchGuide: 'HT Spor canlı yayınında anlık maç yorumları ve taktik analizler yapılmaktadır.'
  },
  sportsdigitale: {
    channelId: 'sportsdigitale',
    channelName: 'Sports Digitale',
    shortLabel: 'Digitale',
    category: 'Canlı Derbi & Maç Analizleri',
    badge: 'CANLI HD',
    logoText: 'DIGITALE',
    accentColor: '#F59E0B',
    description: '🔴 Canlı Yayın • Canlı Maç Önü ve Maç Sonu Derbi Analizleri',
    isLivePlayable: false,
    streamUrl: '',
    youtubeId: '5PvmYQcOKu4',
    fallbackWebUrl: 'https://www.youtube.com/@SportsDigitale',
    officialStreamUrl: 'https://www.youtube.com/@SportsDigitale',
    provider: 'Sports Digitale',
    providerPlatform: 'YouTube',
    watchGuide: 'Canlı maç yorumları, stüdyo tartışmaları ve flaş açıklamalar.'
  }
};

/**
 * Karşılaşmanın ligi, takımları ve turnuvasına göre resmi yayıncı kanalını tespit eder.
 */
export function getMatchBroadcaster(match?: Match | null): MatchBroadcasterInfo {
  if (!match) return BROADCASTER_PRESETS.aspor;

  // 1. Maç üzerinde elle atanmış özel kanal tanımlıysa
  const explicit = (match.broadcastChannel || match.broadcaster || '').toLowerCase();
  if (explicit.includes('bein 1') || explicit.includes('bein sports 1')) return BROADCASTER_PRESETS.bein1;
  if (explicit.includes('bein 2') || explicit.includes('bein sports 2')) return BROADCASTER_PRESETS.bein2;
  if (explicit.includes('bein 3') || explicit.includes('bein sports 3')) return BROADCASTER_PRESETS.bein3;
  if (explicit.includes('bein 4') || explicit.includes('bein sports 4')) return BROADCASTER_PRESETS.bein4;
  if (explicit.includes('trt spor') || explicit.includes('trtspor')) return BROADCASTER_PRESETS.trtspor;
  if (explicit.includes('a spor') || explicit.includes('aspor')) return BROADCASTER_PRESETS.aspor;
  if (explicit.includes('s sport 2') || explicit.includes('ssport2')) return BROADCASTER_PRESETS.ssport2;
  if (explicit.includes('s sport') || explicit.includes('ssport')) return BROADCASTER_PRESETS.ssport;
  if (explicit.includes('tv8.5') || explicit.includes('tv85')) return BROADCASTER_PRESETS.tv85;

  const lg = (match.league || '').toLowerCase();
  const cat = (match.leagueCategory || '').toLowerCase();
  const country = (match.country || '').toLowerCase();

  // 2. Trendyol 1. Lig (TRT Spor HD şifresiz canlı verir)
  if (
    lg.includes('1. lig') ||
    lg.includes('1.lig') ||
    lg.includes('tff 1') ||
    cat === '1-lig' ||
    (country.includes('türkiye') && lg.includes('1.'))
  ) {
    return BROADCASTER_PRESETS.trtspor;
  }

  // 3. Ziraat Türkiye Kupası (A Spor HD şifresiz canlı verir)
  if (
    lg.includes('kupa') ||
    lg.includes('ziraat') ||
    lg.includes('turkiye kupasi') ||
    lg.includes('türkiye kupası')
  ) {
    return BROADCASTER_PRESETS.aspor;
  }

  // 4. Trendyol Süper Lig (beIN SPORTS 1 HD)
  if (
    lg.includes('süper lig') ||
    lg.includes('super lig') ||
    cat === 'super-lig' ||
    (country.includes('türkiye') && !lg.includes('1.'))
  ) {
    return BROADCASTER_PRESETS.bein1;
  }

  // 5. İngiltere Kupa & Lig Kupası (FA Cup, Carabao Cup, EFL Trophy, Championship) -> TV8.5 HD
  if (
    lg.includes('fa cup') ||
    lg.includes('efl') ||
    lg.includes('carabao') ||
    lg.includes('league cup') ||
    lg.includes('trophy') ||
    lg.includes('championship') ||
    lg.includes('league one') ||
    lg.includes('league two')
  ) {
    return BROADCASTER_PRESETS.tv85;
  }

  // 6. İngiltere Premier Lig (beIN SPORTS 3 HD)
  if (
    lg.includes('premier') ||
    cat === 'premier-league' ||
    (country.includes('ingiltere') && !lg.includes('fa'))
  ) {
    return BROADCASTER_PRESETS.bein3;
  }

  // 7. İspanya La Liga (S Sport HD)
  if (
    lg.includes('la liga') ||
    lg.includes('laliga') ||
    lg.includes('primera') ||
    cat === 'la-liga' ||
    country.includes('ispanya')
  ) {
    return BROADCASTER_PRESETS.ssport;
  }

  // 8. İtalya Serie A (S Sport 2 HD)
  if (
    lg.includes('serie a') ||
    lg.includes('italya') ||
    cat === 'serie-a' ||
    country.includes('italya')
  ) {
    return BROADCASTER_PRESETS.ssport2;
  }

  // 9. Almanya Bundesliga (beIN SPORTS 4 HD)
  if (
    lg.includes('bundesliga') ||
    cat === 'bundesliga' ||
    country.includes('almanya')
  ) {
    return BROADCASTER_PRESETS.bein4;
  }

  // 10. Fransa Ligue 1 (beIN SPORTS 4 HD)
  if (
    lg.includes('ligue 1') ||
    lg.includes('ligue1') ||
    cat === 'ligue-1' ||
    country.includes('fransa')
  ) {
    return BROADCASTER_PRESETS.bein4;
  }

  // 11. UEFA Şampiyonlar Ligi / Avrupa Ligi / Konferans Ligi (TRT Spor & tabii)
  if (
    lg.includes('şampiyonlar') ||
    lg.includes('champions') ||
    lg.includes('avrupa ligi') ||
    lg.includes('europa') ||
    lg.includes('konferans') ||
    cat === 'cl' ||
    cat === 'el' ||
    cat === 'ecl'
  ) {
    return BROADCASTER_PRESETS.trtspor;
  }

  // 12. UEFA Uluslar Ligi & Milli Maçlar (TRT Spor HD)
  if (
    lg.includes('nations') ||
    lg.includes('uluslar') ||
    lg.includes('milli') ||
    cat === 'nations-league'
  ) {
    return BROADCASTER_PRESETS.trtspor;
  }

  // 13. Hollanda Eredivisie & Suudi Ligi (TV8.5 HD)
  if (
    lg.includes('eredivisie') ||
    cat === 'eredivisie' ||
    country.includes('hollanda')
  ) {
    return BROADCASTER_PRESETS.tv85;
  }

  // Genel Varsayılan: İngiltere maçıysa beIN 3, Avrupa maçıysa S Sport, Türkiye maçıysa beIN 1
  if (country.includes('ingiltere')) return BROADCASTER_PRESETS.bein3;
  if (country.includes('türkiye')) return BROADCASTER_PRESETS.bein1;
  if (country.includes('ispanya')) return BROADCASTER_PRESETS.ssport;

  return BROADCASTER_PRESETS.bein3;
}

/**
 * Buton ve rozetlerde gösterilmek üzere kısa yayıncı etiketini döner.
 * Örnek: "beIN 1", "beIN 3", "TRT Spor", "A Spor", "S Sport", "TV8.5"
 */
export function getBroadcasterShortLabel(match?: Match | null): string {
  const info = getMatchBroadcaster(match);
  return info.shortLabel;
}

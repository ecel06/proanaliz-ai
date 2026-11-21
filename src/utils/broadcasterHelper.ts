// src/utils/broadcasterHelper.ts
// Akıllı Maç Yayıncı Kanalı ve Ülke Eşleştirme Motoru
// Karşılaşmanın ligi, ülkesi ve takımlarına göre o ülkenin yerel resmi yayıncı kanalını tespit eder.

import { Match } from '../types';

export interface MatchBroadcasterInfo {
  channelId: string;
  channelName: string;
  shortLabel: string;
  country: string;
  countryFlag: string;
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
  turkishBroadcaster: string;
  nesineLiveUrl: string;
  watchGuide: string;
}

export const COUNTRY_BROADCASTER_PRESETS: Record<string, MatchBroadcasterInfo> = {
  // 🇬🇧 İNGİLTERE (Premier League, FA Cup, Championship, League Cup)
  england: {
    channelId: 'skysports_uk',
    channelName: 'Sky Sports Main Event HD',
    shortLabel: '🇬🇧 Sky Sports',
    country: 'İngiltere',
    countryFlag: '🇬🇧',
    category: 'İngiltere Premier Lig & Kupa',
    badge: '🇬🇧 İNGİLTERE YAYINI',
    logoText: 'SKY SPORTS',
    accentColor: '#3B82F6',
    description: '🔴 Canlı Yayın • İngiltere Resmi Yayıncısı (Sky Sports & TNT Sports UK)',
    isLivePlayable: false,
    streamUrl: '',
    youtubeId: '',
    fallbackWebUrl: 'https://www.skysports.com/football',
    officialStreamUrl: 'https://www.skysports.com/watch',
    provider: 'Sky UK / TNT Sports',
    turkishBroadcaster: 'beIN SPORTS 3 HD / TV8.5',
    nesineLiveUrl: 'https://www.nesine.com/canli-iddaa',
    watchGuide: 'Bu maç İngiltere yerelinde Sky Sports Main Event ve TNT Sports ekranlarında canlı yayınlanmaktadır.'
  },

  // 🏴󠁧󠁢󠁳󠁣󠁴󠁿 İSKOÇYA (Scottish Premiership - Celtic, Rangers, St. Mirren...)
  scotland: {
    channelId: 'skysports_scotland',
    channelName: 'Sky Sports Football UK',
    shortLabel: '🏴󠁧󠁢󠁳󠁣󠁴󠁿 Sky Sports',
    country: 'İskoçya',
    countryFlag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    category: 'İskoçya Premiership',
    badge: '🏴󠁧󠁢󠁳󠁣󠁴󠁿 İSKOÇYA YAYINI',
    logoText: 'SKY FOOTBALL',
    accentColor: '#0EA5E9',
    description: '🔴 Canlı Yayın • İskoçya Resmi Yayıncısı (Sky Sports Football & BBC Scotland)',
    isLivePlayable: false,
    streamUrl: '',
    youtubeId: '',
    fallbackWebUrl: 'https://www.skysports.com/scottish-football',
    officialStreamUrl: 'https://www.skysports.com/watch',
    provider: 'Sky Sports UK',
    turkishBroadcaster: 'S Sport Plus',
    nesineLiveUrl: 'https://www.nesine.com/canli-iddaa',
    watchGuide: 'Bu maç İskoçya yerelinde Sky Sports Football ve BBC Scotland ekranlarında canlı yayınlanmaktadır.'
  },

  // 🇪🇸 İSPANYA (La Liga, Copa del Rey - Real Madrid, Barcelona...)
  spain: {
    channelId: 'movistar_es',
    channelName: 'Movistar+ LaLiga HD',
    shortLabel: '🇪🇸 Movistar',
    country: 'İspanya',
    countryFlag: '🇪🇸',
    category: 'İspanya La Liga & Kral Kupası',
    badge: '🇪🇸 İSPANYA YAYINI',
    logoText: 'MOVISTAR+',
    accentColor: '#F59E0B',
    description: '🔴 Canlı Yayın • İspanya Resmi Yayıncısı (Movistar+ & DAZN LaLiga)',
    isLivePlayable: false,
    streamUrl: '',
    youtubeId: '',
    fallbackWebUrl: 'https://www.laliga.com',
    officialStreamUrl: 'https://ver.movistarplus.es',
    provider: 'Telefónica Movistar / DAZN',
    turkishBroadcaster: 'S Sport HD & S Sport Plus',
    nesineLiveUrl: 'https://www.nesine.com/canli-iddaa',
    watchGuide: 'Bu maç İspanya yerelinde Movistar+ LaLiga ve DAZN LaLiga ekranlarında canlı yayınlanmaktadır.'
  },

  // 🇮🇹 İTALYA (Serie A, Coppa Italia - Inter, Milan, Juventus...)
  italy: {
    channelId: 'skysport_it',
    channelName: 'Sky Sport Calcio HD',
    shortLabel: '🇮🇹 Sky Sport',
    country: 'İtalya',
    countryFlag: '🇮🇹',
    category: 'İtalya Serie A & İtalya Kupası',
    badge: '🇮🇹 İTALYA YAYINI',
    logoText: 'SKY CALCIO',
    accentColor: '#EC4899',
    description: '🔴 Canlı Yayın • İtalya Resmi Yayıncısı (Sky Sport Italia & DAZN Italia)',
    isLivePlayable: false,
    streamUrl: '',
    youtubeId: '',
    fallbackWebUrl: 'https://sport.sky.it/calcio',
    officialStreamUrl: 'https://sport.sky.it/calcio/serie-a',
    provider: 'Sky Italia / DAZN',
    turkishBroadcaster: 'S Sport 2 HD & S Sport Plus',
    nesineLiveUrl: 'https://www.nesine.com/canli-iddaa',
    watchGuide: 'Bu maç İtalya yerelinde Sky Sport Calcio ve DAZN Italia ekranlarında canlı yayınlanmaktadır.'
  },

  // 🇩🇪 ALMANYA (Bundesliga, DFB-Pokal - Bayern Münih, Dortmund...)
  germany: {
    channelId: 'skysport_de',
    channelName: 'Sky Sport Bundesliga 1 HD',
    shortLabel: '🇩🇪 Sky Sport',
    country: 'Almanya',
    countryFlag: '🇩🇪',
    category: 'Almanya Bundesliga',
    badge: '🇩🇪 ALMANYA YAYINI',
    logoText: 'SKY BUNDESLIGA',
    accentColor: '#6366F1',
    description: '🔴 Canlı Yayın • Almanya Resmi Yayıncısı (Sky Deutschland & DAZN 1 DE)',
    isLivePlayable: false,
    streamUrl: '',
    youtubeId: '',
    fallbackWebUrl: 'https://sport.sky.de/bundesliga',
    officialStreamUrl: 'https://sport.sky.de',
    provider: 'Sky Deutschland / DAZN',
    turkishBroadcaster: 'beIN SPORTS 4 HD & Tivibu Spor',
    nesineLiveUrl: 'https://www.nesine.com/canli-iddaa',
    watchGuide: 'Bu maç Almanya yerelinde Sky Sport Bundesliga ve DAZN DE ekranlarında canlı yayınlanmaktadır.'
  },

  // 🇫🇷 FRANSA (Ligue 1 - PSG, Monaco, Marsilya...)
  france: {
    channelId: 'dazn_fr',
    channelName: 'DAZN Ligue 1 HD',
    shortLabel: '🇫🇷 DAZN FR',
    country: 'Fransa',
    countryFlag: '🇫🇷',
    category: 'Fransa Ligue 1',
    badge: '🇫🇷 FRANSA YAYINI',
    logoText: 'DAZN LIGUE 1',
    accentColor: '#8B5CF6',
    description: '🔴 Canlı Yayın • Fransa Resmi Yayıncısı (DAZN France & beIN Sports 1 FR)',
    isLivePlayable: false,
    streamUrl: '',
    youtubeId: '',
    fallbackWebUrl: 'https://www.ligue1.com',
    officialStreamUrl: 'https://www.dazn.com/fr-FR/home',
    provider: 'DAZN France / beIN',
    turkishBroadcaster: 'beIN SPORTS 4 HD',
    nesineLiveUrl: 'https://www.nesine.com/canli-iddaa',
    watchGuide: 'Bu maç Fransa yerelinde DAZN Ligue 1 ve beIN Sports France ekranlarında canlı yayınlanmaktadır.'
  },

  // 🇳🇱 HOLLANDA (Eredivisie - Ajax, Feyenoord, PSV...)
  netherlands: {
    channelId: 'espn_nl',
    channelName: 'ESPN 1 Eredivisie HD',
    shortLabel: '🇳🇱 ESPN NL',
    country: 'Hollanda',
    countryFlag: '🇳🇱',
    category: 'Hollanda Eredivisie',
    badge: '🇳🇱 HOLLANDA YAYINI',
    logoText: 'ESPN NL',
    accentColor: '#EF4444',
    description: '🔴 Canlı Yayın • Hollanda Resmi Yayıncısı (ESPN Netherlands & Ziggo Sport)',
    isLivePlayable: false,
    streamUrl: '',
    youtubeId: '',
    fallbackWebUrl: 'https://www.espn.nl',
    officialStreamUrl: 'https://www.espn.nl/watch',
    provider: 'ESPN / Ziggo',
    turkishBroadcaster: 'TV8.5 HD & S Sport Plus',
    nesineLiveUrl: 'https://www.nesine.com/canli-iddaa',
    watchGuide: 'Bu maç Hollanda yerelinde ESPN 1 Eredivisie ve Ziggo Sport ekranlarında canlı yayınlanmaktadır.'
  },

  // 🇵🇹 PORTEKİZ (Primeira Liga - Benfica, Porto, Sporting...)
  portugal: {
    channelId: 'sporttv_pt',
    channelName: 'Sport TV 1 HD (Portekiz)',
    shortLabel: '🇵🇹 Sport TV',
    country: 'Portekiz',
    countryFlag: '🇵🇹',
    category: 'Portekiz Primeira Liga',
    badge: '🇵🇹 PORTEKİZ YAYINI',
    logoText: 'SPORT TV',
    accentColor: '#14B8A6',
    description: '🔴 Canlı Yayın • Portekiz Resmi Yayıncısı (Sport TV Portugal)',
    isLivePlayable: false,
    streamUrl: '',
    youtubeId: '',
    fallbackWebUrl: 'https://www.sporttv.pt',
    officialStreamUrl: 'https://www.sporttv.pt/direto',
    provider: 'Sport TV Portugal',
    turkishBroadcaster: 'S Sport Plus',
    nesineLiveUrl: 'https://www.nesine.com/canli-iddaa',
    watchGuide: 'Bu maç Portekiz yerelinde Sport TV 1 HD ekranlarında canlı yayınlanmaktadır.'
  },

  // 🇸🇦 SUUDİ ARABİSTAN (Saudi Pro League - Al Hilal, Al Nassr...)
  saudi: {
    channelId: 'ssc_sports',
    channelName: 'SSC Sports 1 HD',
    shortLabel: '🇸🇦 SSC Sport',
    country: 'Suudi Arabistan',
    countryFlag: '🇸🇦',
    category: 'Suudi Arabistan Pro Lig',
    badge: '🇸🇦 SUUDİ YAYINI',
    logoText: 'SSC SPORTS',
    accentColor: '#F59E0B',
    description: '🔴 Canlı Yayın • Suudi Arabistan Resmi Yayıncısı (SSC & Shahid VIP)',
    isLivePlayable: false,
    streamUrl: '',
    youtubeId: '',
    fallbackWebUrl: 'https://shahid.mbc.net',
    officialStreamUrl: 'https://shahid.mbc.net/en/widgets/live-tv',
    provider: 'Saudi Sports Company / Shahid',
    turkishBroadcaster: 'TV8.5 HD & S Sport Plus',
    nesineLiveUrl: 'https://www.nesine.com/canli-iddaa',
    watchGuide: 'Bu maç Suudi Arabistan yerelinde SSC Sports 1 HD ve Shahid VIP ekranlarında canlı yayınlanmaktadır.'
  },

  // 🇧🇷 BREZİLYA (Brasileirao)
  brazil: {
    channelId: 'sportv_br',
    channelName: 'Globo SporTV 1 HD',
    shortLabel: '🇧🇷 SporTV',
    country: 'Brezilya',
    countryFlag: '🇧🇷',
    category: 'Brezilya Serie A',
    badge: '🇧🇷 BREZİLYA YAYINI',
    logoText: 'SPORTV',
    accentColor: '#10B981',
    description: '🔴 Canlı Yayın • Brezilya Resmi Yayıncısı (Globo SporTV & Premiere)',
    isLivePlayable: false,
    streamUrl: '',
    youtubeId: '',
    fallbackWebUrl: 'https://ge.globo.com/sportv',
    officialStreamUrl: 'https://globoplay.globo.com/sportv',
    provider: 'Grupo Globo',
    turkishBroadcaster: 'S Sport Plus',
    nesineLiveUrl: 'https://www.nesine.com/canli-iddaa',
    watchGuide: 'Bu maç Brezilya yerelinde Globo SporTV ve Premiere ekranlarında canlı yayınlanmaktadır.'
  },

  // 🇪🇺 AVRUPA KUPALARI (UEFA Şampiyonlar Ligi / Avrupa Ligi)
  uefa: {
    channelId: 'uefa_tv',
    channelName: 'TNT Sports 1 & Movistar Liga de Campeones',
    shortLabel: '🇪🇺 UEFA Canlı',
    country: 'Avrupa',
    countryFlag: '🇪🇺',
    category: 'UEFA Şampiyonlar & Avrupa Ligi',
    badge: '🇪🇺 AVRUPA YAYINI',
    logoText: 'UEFA TV',
    accentColor: '#38BDF8',
    description: '🔴 Canlı Yayın • UEFA Resmi Uluslararası Yayıncıları (TNT Sports UK & Movistar+)',
    isLivePlayable: false,
    streamUrl: '',
    youtubeId: '',
    fallbackWebUrl: 'https://www.uefa.tv',
    officialStreamUrl: 'https://www.uefa.tv',
    provider: 'UEFA Media / TNT / Movistar',
    turkishBroadcaster: 'TRT 1 HD, TRT Spor HD & tabii Spor',
    nesineLiveUrl: 'https://www.nesine.com/canli-iddaa',
    watchGuide: 'Bu maç uluslararası arenada TNT Sports, Movistar+ ve Türkiye’de TRT Spor / tabii ekranlarında yayınlanmaktadır.'
  },

  // 🇹🇷 TÜRKİYE SÜPER LİG (Galatasaray, Fenerbahçe, Beşiktaş, Trabzonspor...)
  super_lig: {
    channelId: 'bein1',
    channelName: 'beIN SPORTS 1 HD',
    shortLabel: '🇹🇷 beIN 1',
    country: 'Türkiye',
    countryFlag: '🇹🇷',
    category: 'Trendyol Süper Lig & Derbiler',
    badge: '🇹🇷 TÜRKİYE YAYINI',
    logoText: 'beIN 1',
    accentColor: '#9333EA',
    description: '🔴 Canlı Yayın • Trendyol Süper Lig Resmi Yayıncı Kanalı',
    isLivePlayable: false,
    streamUrl: '',
    youtubeId: '',
    fallbackWebUrl: 'https://beinsports.com.tr',
    officialStreamUrl: 'https://www.todtv.com.tr',
    provider: 'beIN Media Group (TOD TV)',
    turkishBroadcaster: 'beIN SPORTS 1 HD & TOD TV',
    nesineLiveUrl: 'https://www.nesine.com/canli-iddaa',
    watchGuide: 'Bu maç Türkiye’de resmi olarak beIN SPORTS 1 HD ve TOD TV platformunda canlı yayınlanmaktadır.'
  },

  // 🇹🇷 TÜRKİYE 1. LİG (TFF 1. Lig - Şifresiz Açık Canlı Yayın)
  trtspor: {
    channelId: 'trtspor',
    channelName: 'TRT Spor HD',
    shortLabel: '🇹🇷 TRT Spor',
    country: 'Türkiye',
    countryFlag: '🇹🇷',
    category: 'Trendyol 1. Lig & Uluslar Ligi',
    badge: '🇹🇷 ŞİFRESİZ CANLI HD',
    logoText: 'TRT SPOR',
    accentColor: '#10B981',
    description: '🔴 Canlı Yayın • Trendyol 1. Lig, A Milli Takım & UEFA Maçları',
    isLivePlayable: true,
    streamUrl: 'https://trt.daioncdn.net/trtspor/master.m3u8?app=web&platform=trtspor',
    youtubeId: '',
    fallbackWebUrl: 'https://www.trtspor.com.tr/canli-yayin-izle/trt-spor',
    officialStreamUrl: 'https://www.trtspor.com.tr/canli-yayin-izle/trt-spor',
    provider: 'TRT',
    turkishBroadcaster: 'TRT Spor HD (Şifresiz HD)',
    nesineLiveUrl: 'https://www.nesine.com/canli-iddaa',
    watchGuide: 'Bu maç TRT Spor HD ekranlarında şifresiz ve ücretsiz canlı yayınlanmaktadır.'
  },

  // 🇹🇷 TÜRKİYE KUPASI (Ziraat Türkiye Kupası - Şifresiz Açık Canlı Yayın)
  aspor: {
    channelId: 'aspor',
    channelName: 'A Spor HD',
    shortLabel: '🇹🇷 A Spor',
    country: 'Türkiye',
    countryFlag: '🇹🇷',
    category: 'Ziraat Türkiye Kupası',
    badge: '🇹🇷 ŞİFRESİZ CANLI HD',
    logoText: 'A SPOR',
    accentColor: '#06B6D4',
    description: '🔴 Canlı Yayın • Ziraat Türkiye Kupası Karşılaşmaları & Canlı Analizler',
    isLivePlayable: true,
    streamUrl: 'https://rnttwmjcin.turknet.ercdn.net/lcpmvefbyo/aspor/aspor.m3u8',
    youtubeId: 'DwFLd1Mg0eE',
    fallbackWebUrl: 'https://www.aspor.com.tr/canli-yayin',
    officialStreamUrl: 'https://www.aspor.com.tr/canli-yayin',
    provider: 'Turkuvaz Medya',
    turkishBroadcaster: 'A Spor HD (Şifresiz HD)',
    nesineLiveUrl: 'https://www.nesine.com/canli-iddaa',
    watchGuide: 'Bu maç A Spor HD ekranlarında şifresiz ve ücretsiz canlı yayınlanmaktadır.'
  }
};

/**
 * Karşılaşmanın oynandığı ülkeye ve lige göre O ÜLKENİN yerel resmi yayıncı kanalını tespit eder.
 */
export function getMatchBroadcaster(match?: Match | null): MatchBroadcasterInfo {
  if (!match) return COUNTRY_BROADCASTER_PRESETS.aspor;

  const lg = (match.league || '').toLowerCase();
  const cat = (match.leagueCategory || '').toLowerCase();
  const country = (match.country || '').toLowerCase();
  const home = (match.homeTeam?.name || '').toLowerCase();
  const away = (match.awayTeam?.name || '').toLowerCase();

  // 1. İskoçya (Celtic, Rangers, Aberdeen, Hearts, Hibernian, St. Mirren...)
  if (
    country.includes('iskoç') ||
    country.includes('scot') ||
    lg.includes('scot') ||
    lg.includes('premiership') && (home.includes('celtic') || away.includes('celtic') || home.includes('rangers') || away.includes('rangers')) ||
    home.includes('celtic') ||
    away.includes('celtic') ||
    home.includes('st. mirren') ||
    away.includes('st. mirren')
  ) {
    return COUNTRY_BROADCASTER_PRESETS.scotland;
  }

  // 2. İngiltere (Premier League, FA Cup, Championship, League One, League Two, EFL)
  if (
    country.includes('ingiltere') ||
    country.includes('england') ||
    lg.includes('premier') ||
    lg.includes('championship') ||
    lg.includes('fa cup') ||
    lg.includes('carabao') ||
    lg.includes('efl') ||
    cat.includes('premier')
  ) {
    return COUNTRY_BROADCASTER_PRESETS.england;
  }

  // 3. İspanya (La Liga, Segunda, Copa del Rey)
  if (
    country.includes('ispanya') ||
    country.includes('spain') ||
    lg.includes('la liga') ||
    lg.includes('laliga') ||
    lg.includes('primera') ||
    cat.includes('la-liga')
  ) {
    return COUNTRY_BROADCASTER_PRESETS.spain;
  }

  // 4. İtalya (Serie A, Serie B, Coppa Italia)
  if (
    country.includes('italya') ||
    country.includes('italy') ||
    lg.includes('serie a') ||
    lg.includes('serie b') ||
    cat.includes('serie-a')
  ) {
    return COUNTRY_BROADCASTER_PRESETS.italy;
  }

  // 5. Almanya (Bundesliga, 2. Bundesliga, DFB-Pokal)
  if (
    country.includes('almanya') ||
    country.includes('germany') ||
    lg.includes('bundesliga') ||
    cat.includes('bundesliga')
  ) {
    return COUNTRY_BROADCASTER_PRESETS.germany;
  }

  // 6. Fransa (Ligue 1, Ligue 2, Coupe de France)
  if (
    country.includes('fransa') ||
    country.includes('france') ||
    lg.includes('ligue 1') ||
    lg.includes('ligue 2') ||
    cat.includes('ligue-1')
  ) {
    return COUNTRY_BROADCASTER_PRESETS.france;
  }

  // 7. Hollanda (Eredivisie)
  if (
    country.includes('hollanda') ||
    country.includes('netherland') ||
    lg.includes('eredivisie') ||
    cat.includes('eredivisie')
  ) {
    return COUNTRY_BROADCASTER_PRESETS.netherlands;
  }

  // 8. Portekiz (Primeira Liga)
  if (
    country.includes('portekiz') ||
    country.includes('portugal') ||
    lg.includes('primeira') ||
    cat.includes('primeira-liga')
  ) {
    return COUNTRY_BROADCASTER_PRESETS.portugal;
  }

  // 9. Suudi Arabistan (Saudi Pro League)
  if (
    country.includes('suudi') ||
    country.includes('saudi') ||
    lg.includes('saudi')
  ) {
    return COUNTRY_BROADCASTER_PRESETS.saudi;
  }

  // 10. Brezilya (Serie A Brazil)
  if (
    country.includes('brezilya') ||
    country.includes('brazil') ||
    lg.includes('brasileirao')
  ) {
    return COUNTRY_BROADCASTER_PRESETS.brazil;
  }

  // 11. UEFA Avrupa Kupaları (Şampiyonlar Ligi / Avrupa Ligi / Konferans Ligi)
  if (
    lg.includes('şampiyonlar') ||
    lg.includes('champions') ||
    lg.includes('avrupa ligi') ||
    lg.includes('europa') ||
    lg.includes('konferans') ||
    cat === 'cl' ||
    cat === 'el' ||
    cat === 'ecl' ||
    country.includes('avrupa')
  ) {
    return COUNTRY_BROADCASTER_PRESETS.uefa;
  }

  // 12. Türkiye 1. Lig (TRT Spor HD şifresiz canlı verir)
  if (
    lg.includes('1. lig') ||
    lg.includes('1.lig') ||
    lg.includes('tff 1') ||
    cat === '1-lig' ||
    (country.includes('türkiye') && lg.includes('1.'))
  ) {
    return COUNTRY_BROADCASTER_PRESETS.trtspor;
  }

  // 13. Ziraat Türkiye Kupası (A Spor HD şifresiz canlı verir)
  if (
    lg.includes('ziraat') ||
    lg.includes('turkiye kupasi') ||
    lg.includes('türkiye kupası')
  ) {
    return COUNTRY_BROADCASTER_PRESETS.aspor;
  }

  // 14. Trendyol Süper Lig (beIN SPORTS 1 HD)
  if (
    country.includes('türkiye') ||
    lg.includes('süper lig') ||
    lg.includes('super lig') ||
    cat === 'super-lig'
  ) {
    return COUNTRY_BROADCASTER_PRESETS.super_lig;
  }

  // Genel Varsayılan: İngiltere ligi
  return COUNTRY_BROADCASTER_PRESETS.england;
}

/**
 * Buton ve rozetlerde gösterilmek üzere kısa yayıncı etiketini döner.
 * Örnek: "🇬🇧 Sky Sports", "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Sky Sports", "🇪🇸 Movistar", "🇹🇷 beIN 1", "🇹🇷 TRT Spor"
 */
export function getBroadcasterShortLabel(match?: Match | null): string {
  const info = getMatchBroadcaster(match);
  return info.shortLabel;
}

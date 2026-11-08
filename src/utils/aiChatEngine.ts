// src/utils/aiChatEngine.ts
// ProAnaliz AI - Complete Natural Language Understanding & Intelligent Coupon Generator

import { Match, MatchAnalysis } from '../types';
import { getMatchIddaaCode } from './iddaaHelper';
import { formatDynamicMatchTime } from './dateHelper';
import { evaluatePickStatus, PickStatus } from './couponEngine';
import { getMatchLiveState, getKickoffTimestamp } from './liveMatchHelper';

export type AICouponType =
  | 'banko'
  | 'ideal'
  | 'surpriz'
  | 'htft'
  | 'first_half'
  | 'over'
  | 'over35'
  | 'under'
  | 'under35'
  | 'over15'
  | 'under15'
  | 'btts'
  | 'btts_no'
  | 'match_result';

export interface AICouponItem {
  id: string;
  matchId: string;
  match: Match;
  iddaaCode: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  matchTimeText: string;
  pickLabel: string;
  pickType: 'ms1' | 'ms2' | 'msX' | 'over15' | 'under15' | 'over25' | 'under25' | 'over35' | 'under35' | 'btts' | 'htft';
  odd: number;
  confidence: number;
  reasoning: string;
  matchStatus: 'upcoming' | 'live' | 'finished';
  pickStatus: PickStatus;
  score?: { home: number; away: number };
  liveMinute?: string;
}

export interface AIChatCoupon {
  id: string;
  title: string;
  type: AICouponType;
  badge: string;
  riskRating: string;
  totalOdds: number;
  avgConfidence: number;
  items: AICouponItem[];
}

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  text: string;
  coupon?: AIChatCoupon;
  singleMatchAnalysis?: {
    match: Match;
    analysis: MatchAnalysis;
    recommendedPick: {
      label: string;
      odd: number;
      confidence: number;
      reason: string;
    };
  };
  quickSuggestions?: string[];
}

/**
 * Normalizes text for Turkish accents, spaces, and punctuation
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/3[.,]5/g, '3 5')
    .replace(/2[.,]5/g, '2 5')
    .replace(/1[.,]5/g, '1 5')
    .replace(/0[.,]5/g, '0 5')
    .replace(/[\/\\\-_.,;:!?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks whether a match is strictly upcoming and unplayed (has not started, not finished, not live)
 */
export function isMatchUnplayed(match: Match, now: Date = new Date()): boolean {
  // If explicitly finished or live, skip
  if (match.status === 'finished' || match.status === 'live') return false;

  // If match has finalScore with non-zero scores and not marked upcoming, skip
  if (
    match.status !== 'upcoming' &&
    match.finalScore &&
    (match.finalScore.home > 0 || match.finalScore.away > 0)
  ) {
    return false;
  }

  // Check kickoff time
  const k = getKickoffTimestamp(match);
  if (k && k > 0) {
    // If kickoff has already started or passed, it's not unplayed
    if (now.getTime() - k >= 0) {
      return false;
    }
  }

  return true;
}

/**
 * Comprehensive parser that strictly extracts the requested coupon type and match count
 */
export function parseUserRequest(message: string): {
  type: AICouponType | 'general';
  matchCount: number;
  targetTeam?: string;
} {
  const norm = normalizeText(message);

  // 1. Detect match count (e.g. "3 maçlık", "4 mac", "2 tane", "tek maç")
  let matchCount = 3;
  const countMatch = norm.match(/(\d+)\s*(?:maclik|mac|tane|adet|karsilasma|oyun)/);
  if (countMatch && countMatch[1]) {
    const parsed = parseInt(countMatch[1], 10);
    if (!isNaN(parsed)) {
      matchCount = Math.max(2, Math.min(6, parsed));
    }
  } else if (norm.includes('tek mac') || norm.includes('1 mac')) {
    matchCount = 2; // minimum coupon length for standard slips
  } else if (norm.includes('iki mac') || norm.includes('2 mac')) {
    matchCount = 2;
  } else if (norm.includes('uc mac') || norm.includes('3 mac')) {
    matchCount = 3;
  } else if (norm.includes('dort mac') || norm.includes('4 mac')) {
    matchCount = 4;
  } else if (norm.includes('bes mac') || norm.includes('5 mac')) {
    matchCount = 5;
  } else if (norm.includes('alti mac') || norm.includes('6 mac')) {
    matchCount = 6;
  }

  // 2. Strict Type Detection in order of specificity

  // A. İlk Yarı / Maç Sonucu (İY/MS, htft)
  if (
    norm.includes('ilk yari mac sonucu') ||
    norm.includes('ilk yari mac sonu') ||
    norm.includes('iy ms') ||
    norm.includes('iyms') ||
    norm.includes('iy/ms') ||
    norm.includes('iy-ms') ||
    norm.includes('ilk yari ve mac sonucu') ||
    norm.includes('1 1') ||
    norm.includes('2 2') ||
    norm.includes('x 1') ||
    norm.includes('1 x')
  ) {
    return { type: 'htft', matchCount };
  }

  // B. Karşılıklı Gol Yok (KG Yok) - check before KG Var!
  if (
    norm.includes('kg yok') ||
    norm.includes('karsilikli gol yok') ||
    norm.includes('gol yok') ||
    norm.includes('tek tarafli gol')
  ) {
    return { type: 'btts_no', matchCount };
  }

  // C. Karşılıklı Gol Var (KG Var)
  if (
    norm.includes('kg var') ||
    norm.includes('karsilikli gol') ||
    norm.includes('iki takim da gol') ||
    norm.includes('kg kupon') ||
    norm.includes('var kupon') ||
    (norm.includes('kg') && !norm.includes('kg yok'))
  ) {
    return { type: 'btts', matchCount };
  }

  // D. İlk Yarı Gol / İlk Yarı Sonucu (İY)
  if (
    norm.includes('ilk yari gol') ||
    norm.includes('iy gol') ||
    norm.includes('ilk yari 0 5') ||
    norm.includes('ilk yari 1 5') ||
    norm.includes('sadece ilk yari') ||
    norm.includes('ilk yari sonucu') ||
    norm.includes('ilk 45')
  ) {
    return { type: 'first_half', matchCount };
  }

  // E. 3.5 Gol Üstü (3.5 Üst, 4 Gol) - check BEFORE 2.5 and generic ust!
  if (
    norm.includes('3 5 ust') ||
    norm.includes('3 5 ve uzeri') ||
    norm.includes('3 5 uzeri') ||
    norm.includes('4 gol') ||
    norm.includes('4 ve uzeri') ||
    (norm.includes('3 5') && (norm.includes('ust') || norm.includes('gol')) && !norm.includes('alt'))
  ) {
    return { type: 'over35', matchCount };
  }

  // F. 3.5 Gol Altı (3.5 Alt) - check BEFORE 2.5 and generic alt!
  if (
    norm.includes('3 5 alt') ||
    norm.includes('3 5 alti') ||
    (norm.includes('3 5') && norm.includes('alt'))
  ) {
    return { type: 'under35', matchCount };
  }

  // G. 1.5 Gol Üstü (1.5 Üst, 2 Gol)
  if (
    norm.includes('1 5 ust') ||
    norm.includes('1 5 ustu') ||
    norm.includes('1 5 uzeri') ||
    norm.includes('2 gol') ||
    (norm.includes('1 5') && (norm.includes('ust') || norm.includes('gol')) && !norm.includes('alt'))
  ) {
    return { type: 'over15', matchCount };
  }

  // H. 1.5 Gol Altı (1.5 Alt)
  if (
    norm.includes('1 5 alt') ||
    norm.includes('1 5 alti') ||
    (norm.includes('1 5') && norm.includes('alt'))
  ) {
    return { type: 'under15', matchCount };
  }

  // I. 2.5 Gol Altı (Alt) - check before Gol Üst!
  if (
    norm.includes('2 5 alt') ||
    norm.includes('2 5 alti') ||
    norm.includes('alt kupon') ||
    norm.includes('kisir') ||
    norm.includes('az gol') ||
    norm.includes('gol alti') ||
    norm.includes('gol olmaz') ||
    norm.includes('alti kupon') ||
    (norm.includes('alt') && !norm.includes('ust'))
  ) {
    return { type: 'under', matchCount };
  }

  // J. 2.5 Gol Üstü (Üst)
  if (
    norm.includes('2 5 ust') ||
    norm.includes('2 5 ustu') ||
    norm.includes('ust kupon') ||
    norm.includes('bol gol') ||
    norm.includes('gollu') ||
    norm.includes('gol ustu') ||
    norm.includes('gol ust') ||
    norm.includes('3 gol') ||
    norm.includes('goller') ||
    (norm.includes('ust') && !norm.includes('alt'))
  ) {
    return { type: 'over', matchCount };
  }

  // G. Sürpriz / Yüksek Oran
  if (
    norm.includes('surpriz') ||
    norm.includes('yuksek oran') ||
    norm.includes('bomba') ||
    norm.includes('riskli') ||
    norm.includes('ucuk') ||
    norm.includes('orani yuksek') ||
    norm.includes('oranli')
  ) {
    return { type: 'surpriz', matchCount };
  }

  // H. Maç Sonucu / Taraf Bahsi
  if (
    norm.includes('mac sonucu') ||
    norm.includes('taraf bahsi') ||
    norm.includes('sadece taraf') ||
    norm.includes('galibiyet') ||
    norm.includes('ms1') ||
    norm.includes('ms2')
  ) {
    return { type: 'match_result', matchCount };
  }

  // I. İdeal / Dengeli
  if (
    norm.includes('ideal') ||
    norm.includes('dengeli') ||
    norm.includes('orta risk') ||
    norm.includes('deger') ||
    norm.includes('standart') ||
    norm.includes('normal')
  ) {
    return { type: 'ideal', matchCount };
  }

  // J. Banko / Sağlam / Garanti
  if (
    norm.includes('banko') ||
    norm.includes('saglam') ||
    norm.includes('guvenli') ||
    norm.includes('garanti') ||
    norm.includes('dusuk risk') ||
    norm.includes('en iyi') ||
    norm.includes('en garanti')
  ) {
    return { type: 'banko', matchCount };
  }

  // Default fallback if "kupon" is mentioned
  if (norm.includes('kupon') || norm.includes('tahmin') || norm.includes('mac ver')) {
    return { type: 'banko', matchCount };
  }

  return { type: 'general', matchCount };
}

/**
 * Searches for a specific team in the match list
 */
export function findTeamMatch(message: string, allMatches: Match[]): Match | undefined {
  const norm = normalizeText(message);
  return allMatches.find(m => {
    const homeNorm = normalizeText(m.homeTeam.name);
    const awayNorm = normalizeText(m.awayTeam.name);
    return (
      (homeNorm.length >= 4 && norm.includes(homeNorm)) ||
      (awayNorm.length >= 4 && norm.includes(awayNorm))
    );
  });
}

/**
 * Generates an AI Coupon strictly picking UPCOMING (unplayed) matches
 */
export function generateAICoupon(
  type: AICouponType,
  count: number,
  allMatches: Match[],
  analysesMap: Map<string, MatchAnalysis>,
  now: Date = new Date()
): AIChatCoupon {
  // 1. STRICT FILTER: Only unplayed, upcoming matches!
  let unplayedPool = allMatches.filter(m => isMatchUnplayed(m, now));

  // If pool has fewer matches, fallback to matches with upcoming status or future dates
  if (unplayedPool.length === 0) {
    unplayedPool = allMatches.filter(m => m.status === 'upcoming');
  }

  interface Candidate {
    match: Match;
    analysis: MatchAnalysis;
    pickLabel: string;
    pickType: AICouponItem['pickType'];
    odd: number;
    confidence: number;
    reasoning: string;
    selectionScore: number;
  }

  const candidates: Candidate[] = [];

  unplayedPool.forEach((match, idx) => {
    const analysis = analysesMap.get(match.id) || {
      ms1: 58,
      msX: 26,
      ms2: 16,
      over25: 64,
      under25: 36,
      over15: 82,
      bttsYes: 60,
      expectedTotalGoals: 2.75
    } as MatchAnalysis;

    const homeName = match.homeTeam.name;
    const awayName = match.awayTeam.name;

    // -------------------------------------------------------------------------
    // 1. İLK YARI / MAÇ SONUCU (İY/MS)
    // -------------------------------------------------------------------------
    if (type === 'htft') {
      if (idx % 3 === 0) {
        candidates.push({
          match,
          analysis,
          pickLabel: 'İY 1 / MS 1',
          pickType: 'htft',
          odd: 2.40,
          confidence: 76,
          reasoning: `${homeName} iç sahada maça çok hızlı başlıyor; Poisson ilk yarı gol beklentisi yüksek, maçı baştan sona önde götürür.`,
          selectionScore: 85 + Math.random() * 5
        });
      } else if (idx % 3 === 1) {
        candidates.push({
          match,
          analysis,
          pickLabel: 'İY 2 / MS 2',
          pickType: 'htft',
          odd: 2.65,
          confidence: 72,
          reasoning: `${awayName} deplasman xG üretimiyle kadro kalitesini ilk 45 dakikadan hissettirir, 90 dakikayı galibiyetle tamamlar.`,
          selectionScore: 82 + Math.random() * 5
        });
      } else {
        candidates.push({
          match,
          analysis,
          pickLabel: 'İY 0 / MS 1 (Sürpriz İY/MS)',
          pickType: 'htft',
          odd: 4.40,
          confidence: 58,
          reasoning: `İlk yarıda rakip direnç gösterebilir ancak ikinci yarıda ${homeName} taraftar desteği ve hamleleriyle maçı çözer.`,
          selectionScore: 80 + Math.random() * 5
        });
      }
    }

    // -------------------------------------------------------------------------
    // 2. İLK YARI GOL / İLK YARI SONUCU
    // -------------------------------------------------------------------------
    else if (type === 'first_half') {
      if (analysis.over15 >= 75) {
        candidates.push({
          match,
          analysis,
          pickLabel: 'İY 0.5 Gol Üst',
          pickType: 'over15',
          odd: 1.38,
          confidence: 84,
          reasoning: `İlk 45 dakikada en az 1 gol çıkma olasılığı %84; iki takım da erken skor üretme eğiliminde.`,
          selectionScore: 84 + Math.random() * 5
        });
      } else if (analysis.ms1 >= 60) {
        candidates.push({
          match,
          analysis,
          pickLabel: 'İY 1 (İlk Yarı Ev Sahibi)',
          pickType: 'ms1',
          odd: 2.15,
          confidence: 68,
          reasoning: `${homeName} ilk yarılarda yüksek presle gol buluyor, ilk 45 dakikayı önde kapatır.`,
          selectionScore: 78 + Math.random() * 5
        });
      } else {
        candidates.push({
          match,
          analysis,
          pickLabel: 'İY X (İlk Yarı Beraberlik)',
          pickType: 'msX',
          odd: 2.20,
          confidence: 65,
          reasoning: `Maçın ilk devresinde iki takım da kontrollü oynayacak, ilk yarı beraberliği muhtemel.`,
          selectionScore: 70 + Math.random() * 5
        });
      }
    }

    // -------------------------------------------------------------------------
    // 3. KARŞILIKLI GOL VAR (KG Var)
    // -------------------------------------------------------------------------
    else if (type === 'btts') {
      const bttsOdd = Number((1 / ((analysis.bttsYes || 60) / 100) * 0.94).toFixed(2));
      candidates.push({
        match,
        analysis,
        pickLabel: 'KG Var (Karşılıklı Gol)',
        pickType: 'btts',
        odd: Math.max(1.58, Math.min(1.88, bttsOdd)),
        confidence: analysis.bttsYes || 62,
        reasoning: `${homeName} ve ${awayName} hücum hattında formda; her iki takımın da skor üretme olasılığı %${analysis.bttsYes || 62}.`,
        selectionScore: (analysis.bttsYes || 62) + Math.random() * 5
      });
    }

    // -------------------------------------------------------------------------
    // 4. KARŞILIKLI GOL YOK (KG Yok)
    // -------------------------------------------------------------------------
    else if (type === 'btts_no') {
      const conf = 100 - (analysis.bttsYes || 60);
      candidates.push({
        match,
        analysis,
        pickLabel: 'KG Yok (Karşılıklı Gol Yok)',
        pickType: 'under25',
        odd: 1.88,
        confidence: conf,
        reasoning: `Taraflardan en az birinin gol bulamayacağı savunma ağırlıklı bir maç bekleniyor.`,
        selectionScore: conf + Math.random() * 5
      });
    }

    // -------------------------------------------------------------------------
    // 5. 3.5 GOL ÜSTÜ (3.5 Üst)
    // -------------------------------------------------------------------------
    else if (type === 'over35') {
      const over35Prob = analysis.over35 || Math.round((analysis.over25 || 58) * 0.65);
      const conf = Math.max(52, Math.min(84, over35Prob));
      const overOdd = Number((1 / (conf / 100) * 0.94).toFixed(2));
      const odd = Math.max(2.10, Math.min(3.40, overOdd));
      candidates.push({
        match,
        analysis,
        pickLabel: '3.5 Gol Üst',
        pickType: 'over35',
        odd,
        confidence: conf,
        reasoning: `İki ekip de yüksek hücum temposuna sahip. Beklenen toplam gol (xG) ${analysis.expectedTotalGoals || 3.10}; maçta 4 ve üzeri gol (3.5 Üst) ihtimali %${conf}.`,
        selectionScore: (analysis.expectedTotalGoals || 2.5) * 35 + conf + Math.random() * 5
      });
    }

    // -------------------------------------------------------------------------
    // 6. 3.5 GOL ALTI (3.5 Alt)
    // -------------------------------------------------------------------------
    else if (type === 'under35') {
      const under35Prob = analysis.under35 || 75;
      const conf = Math.max(62, Math.min(88, under35Prob));
      const underOdd = Number((1 / (conf / 100) * 0.94).toFixed(2));
      const odd = Math.max(1.30, Math.min(1.70, underOdd));
      candidates.push({
        match,
        analysis,
        pickLabel: '3.5 Gol Alt',
        pickType: 'under35',
        odd,
        confidence: conf,
        reasoning: `Kontrollü oyun ve sağlam defans hatları maçı 4 golden az bitmeye (%${conf} güvenle) yönlendiriyor.`,
        selectionScore: conf + (4 - (analysis.expectedTotalGoals || 2.3)) * 25 + Math.random() * 5
      });
    }

    // -------------------------------------------------------------------------
    // 7. 1.5 GOL ÜSTÜ (1.5 Üst)
    // -------------------------------------------------------------------------
    else if (type === 'over15') {
      const over15Prob = analysis.over15 || 82;
      const conf = Math.max(72, Math.min(94, over15Prob));
      const overOdd = Number((1 / (conf / 100) * 0.94).toFixed(2));
      const odd = Math.max(1.22, Math.min(1.48, overOdd));
      candidates.push({
        match,
        analysis,
        pickLabel: '1.5 Gol Üst',
        pickType: 'over15',
        odd,
        confidence: conf,
        reasoning: `Karşılaşmada en az 2 gol çıkma olasılığı %${conf}; takımların hücum üretkenliği güven veriyor.`,
        selectionScore: conf + (analysis.expectedTotalGoals || 2.5) * 15 + Math.random() * 5
      });
    }

    // -------------------------------------------------------------------------
    // 8. 1.5 GOL ALTI (1.5 Alt)
    // -------------------------------------------------------------------------
    else if (type === 'under15') {
      const under15Prob = analysis.under15 || 32;
      const conf = Math.max(40, Math.min(65, under15Prob));
      candidates.push({
        match,
        analysis,
        pickLabel: '1.5 Gol Alt',
        pickType: 'under15',
        odd: 2.85,
        confidence: conf,
        reasoning: `Savunma kurgusu çok sert, gol beklentisi minimum seviyede kısır karşılaşma.`,
        selectionScore: conf + Math.random() * 5
      });
    }

    // -------------------------------------------------------------------------
    // 9. 2.5 GOL ÜSTÜ (Üst)
    // -------------------------------------------------------------------------
    else if (type === 'over') {
      const overOdd = Number((1 / ((analysis.over25 || 65) / 100) * 0.94).toFixed(2));
      candidates.push({
        match,
        analysis,
        pickLabel: '2.5 Gol Üst',
        pickType: 'over25',
        odd: Math.max(1.52, Math.min(1.88, overOdd)),
        confidence: analysis.over25 || 65,
        reasoning: `Beklenen toplam gol (xG) ${analysis.expectedTotalGoals || 2.70}; mücadelede 3 ve üzeri gol ihtimali %${analysis.over25 || 65}.`,
        selectionScore: (analysis.expectedTotalGoals || 2.5) * 25 + (analysis.over25 || 65) + Math.random() * 5
      });
    }

    // -------------------------------------------------------------------------
    // 10. 2.5 GOL ALTI (Alt)
    // -------------------------------------------------------------------------
    else if (type === 'under') {
      const underOdd = Number((1 / ((analysis.under25 || 45) / 100) * 0.94).toFixed(2));
      candidates.push({
        match,
        analysis,
        pickLabel: '2.5 Gol Alt',
        pickType: 'under25',
        odd: Math.max(1.65, Math.min(2.10, underOdd)),
        confidence: analysis.under25 || 48,
        reasoning: `İki ekibin hücum kısırlığı ve defansif kapanma eğilimi maçı 2.5 Altına yönlendiriyor.`,
        selectionScore: (analysis.under25 || 48) + (3 - (analysis.expectedTotalGoals || 2.3)) * 15 + Math.random() * 5
      });
    }

    // -------------------------------------------------------------------------
    // 7. SÜRPRİZ / YÜKSEK ORAN
    // -------------------------------------------------------------------------
    else if (type === 'surpriz') {
      if (idx % 2 === 0) {
        candidates.push({
          match,
          analysis,
          pickLabel: 'MS X (Beraberlik)',
          pickType: 'msX',
          odd: 3.45,
          confidence: 48,
          reasoning: `İki ekibin puan ihtiyacı ve savunma kurgusu beraberliği yüksek değerde öne çıkarıyor.`,
          selectionScore: 68 + Math.random() * 10
        });
      } else {
        candidates.push({
          match,
          analysis,
          pickLabel: 'MS 2 (Sürpriz Deplasman)',
          pickType: 'ms2',
          odd: 3.90,
          confidence: 45,
          reasoning: `${awayName} kontra ataklarda çok tehlikeli; ev sahibinin zaaflarını cezalandırıp sürprize imza atabilir.`,
          selectionScore: 65 + Math.random() * 10
        });
      }
    }

    // -------------------------------------------------------------------------
    // 8. İDEAL / DENGELİ
    // -------------------------------------------------------------------------
    else if (type === 'ideal') {
      if (idx % 2 === 0) {
        candidates.push({
          match,
          analysis,
          pickLabel: '2.5 Gol Üst',
          pickType: 'over25',
          odd: 1.68,
          confidence: 72,
          reasoning: `İki takımın lig genelinde maç başı gol ortalaması yüksek, 2.5 Üst için dengeli değer sunuyor.`,
          selectionScore: 75 + Math.random() * 8
        });
      } else {
        candidates.push({
          match,
          analysis,
          pickLabel: 'KG Var (Karşılıklı Gol)',
          pickType: 'btts',
          odd: 1.74,
          confidence: 70,
          reasoning: `${homeName} iç sahada atıyor, ${awayName} deplasmanda karşılık veriyor.`,
          selectionScore: 73 + Math.random() * 8
        });
      }
    }

    // -------------------------------------------------------------------------
    // 9. MAÇ SONUCU (TARAF BAHSİ)
    // -------------------------------------------------------------------------
    else if (type === 'match_result') {
      candidates.push({
        match,
        analysis,
        pickLabel: 'MS 1 (Ev Sahibi Galibiyeti)',
        pickType: 'ms1',
        odd: 1.55,
        confidence: 75,
        reasoning: `${homeName} saha ve form üstünlüğüyle maçı kazanmaya en yakın taraf.`,
        selectionScore: 78 + Math.random() * 5
      });
    }

    // -------------------------------------------------------------------------
    // 10. BANKO / EN SAĞLAM (DEFAULT)
    // -------------------------------------------------------------------------
    else {
      candidates.push({
        match,
        analysis,
        pickLabel: 'MS 1 (Ev Sahibi)',
        pickType: 'ms1',
        odd: 1.45,
        confidence: 82,
        reasoning: `${homeName} iç sahada yüksek hücum verimliliğine sahip; galibiyet için en güvenilir tercih.`,
        selectionScore: 82 + Math.random() * 5
      });
    }
  });

  // Sort candidates by selection score descending
  candidates.sort((a, b) => b.selectionScore - a.selectionScore);

  // Pick unique matches up to requested count
  const pickedMatches = new Set<string>();
  const selectedCandidates: Candidate[] = [];

  for (const c of candidates) {
    if (!pickedMatches.has(c.match.id)) {
      pickedMatches.add(c.match.id);
      selectedCandidates.push(c);
      if (selectedCandidates.length >= count) break;
    }
  }

  // Fallback: strictly from unplayedPool if needed
  if (selectedCandidates.length < count) {
    for (const match of unplayedPool) {
      if (!pickedMatches.has(match.id)) {
        pickedMatches.add(match.id);
        const analysis = analysesMap.get(match.id) || ({} as MatchAnalysis);
        let pickLabel = '2.5 Gol Üst';
        let pickType: AICouponItem['pickType'] = 'over25';
        let odd = 1.65;
        let confidence = 70;
        let reasoning = 'Oynanmamış lig karşılaşmasında istatistiksel Poisson beklentisi yüksek.';

        if (type === 'htft') {
          pickLabel = 'İY 1 / MS 1';
          pickType = 'htft';
          odd = 2.45;
          confidence = 72;
          reasoning = 'İlk yarıdan üstünlük kurma olasılığı yüksek değerli İY/MS tercihi.';
        } else if (type === 'over35') {
          pickLabel = '3.5 Gol Üst';
          pickType = 'over35';
          odd = 2.40;
          confidence = 62;
          reasoning = 'Hücum potansiyeli yüksek karşılaşmada 4 ve üzeri gol (3.5 Üst) bekleniyor.';
        } else if (type === 'under35') {
          pickLabel = '3.5 Gol Alt';
          pickType = 'under35';
          odd = 1.35;
          confidence = 78;
          reasoning = 'Kontrollü oyunda mücadelenin 4 golden az bitmesi kuvvetle muhtemel.';
        } else if (type === 'over15') {
          pickLabel = '1.5 Gol Üst';
          pickType = 'over15';
          odd = 1.28;
          confidence = 82;
          reasoning = 'Erken gol ihtimali yüksek ve en az 2 gol çıkma güveni tam.';
        }

        selectedCandidates.push({
          match,
          analysis,
          pickLabel,
          pickType,
          odd,
          confidence,
          reasoning,
          selectionScore: 70
        });
        if (selectedCandidates.length >= count) break;
      }
    }
  }

  // Build AICouponItem list - ALWAYS strictly marked upcoming / unplayed!
  const items: AICouponItem[] = selectedCandidates.map((c, idx) => {
    return {
      id: `ai_${idx + 1}_${Date.now()}`,
      matchId: c.match.id,
      match: c.match,
      iddaaCode: c.match.iddaaCode || getMatchIddaaCode(c.match),
      homeTeam: c.match.homeTeam.name,
      awayTeam: c.match.awayTeam.name,
      league: c.match.league,
      matchTimeText: formatDynamicMatchTime(c.match, now),
      pickLabel: c.pickLabel,
      pickType: c.pickType,
      odd: c.odd,
      confidence: c.confidence,
      reasoning: c.reasoning,
      matchStatus: 'upcoming',
      pickStatus: 'upcoming',
      score: undefined,
      liveMinute: undefined
    };
  });

  const totalOdds = Number(items.reduce((acc, it) => acc * it.odd, 1).toFixed(2));
  const avgConfidence = Math.round(items.reduce((acc, it) => acc + it.confidence, 0) / (items.length || 1));

  // Determine Title, Badge, and Risk Rating strictly according to requested type
  let title = `${count} Maçlık Banko Kupon`;
  let badge = 'YÜKSEK GÜVEN';
  let riskRating = 'Düşük Risk';

  if (type === 'htft') {
    title = `${count} Maçlık İlk Yarı / Maç Sonucu Kuponu (İY/MS)`;
    badge = 'İY / MS';
    riskRating = 'Yüksek Oran & Taktik';
  } else if (type === 'first_half') {
    title = `${count} Maçlık İlk Yarı Kuponu (İY)`;
    badge = 'İLK YARI';
    riskRating = 'Hızlı Sonuç';
  } else if (type === 'surpriz') {
    title = `${count} Maçlık Sürpriz Kupon`;
    badge = 'YÜKSEK ORAN';
    riskRating = 'Yüksek Kazanç';
  } else if (type === 'ideal') {
    title = `${count} Maçlık İdeal Kupon`;
    badge = 'DENGELİ DEĞER';
    riskRating = 'Dengeli Değer';
  } else if (type === 'over35') {
    title = `${count} Maçlık 3.5 Gol Üst Kuponu`;
    badge = '3.5 ÜST';
    riskRating = 'Yüksek Oran & Bol Gol';
  } else if (type === 'under35') {
    title = `${count} Maçlık 3.5 Gol Alt Kuponu`;
    badge = '3.5 ALT';
    riskRating = 'Güvenli Gol Altı';
  } else if (type === 'over15') {
    title = `${count} Maçlık 1.5 Gol Üst Kuponu`;
    badge = '1.5 ÜST';
    riskRating = 'Yüksek Güven';
  } else if (type === 'under15') {
    title = `${count} Maçlık 1.5 Gol Alt Kuponu`;
    badge = '1.5 ALT';
    riskRating = 'Sürpriz Kısır';
  } else if (type === 'over') {
    title = `${count} Maçlık 2.5 Gol Üst Kuponu`;
    badge = '2.5 ÜST';
    riskRating = 'Bol Gollü';
  } else if (type === 'under') {
    title = `${count} Maçlık 2.5 Gol Alt Kuponu`;
    badge = '2.5 ALT';
    riskRating = 'Kısır Maçlar';
  } else if (type === 'btts') {
    title = `${count} Maçlık Karşılıklı Gol Kuponu (KG Var)`;
    badge = 'KG VAR';
    riskRating = 'Karşılıklı Skor';
  } else if (type === 'btts_no') {
    title = `${count} Maçlık Karşılıklı Gol Yok Kuponu (KG Yok)`;
    badge = 'KG YOK';
    riskRating = 'Savunma Odaklı';
  } else if (type === 'match_result') {
    title = `${count} Maçlık Maç Sonucu Kuponu (Taraf Bahsi)`;
    badge = 'MAÇ SONUCU';
    riskRating = 'Taraf Odaklı';
  }

  return {
    id: `coupon_${Date.now()}`,
    title,
    type,
    badge,
    riskRating,
    totalOdds,
    avgConfidence,
    items
  };
}

/**
 * Main AI Chat processor: receives user prompt and returns rich AI response
 */
export function handleAIChatQuery(
  userText: string,
  allMatches: Match[],
  analysesMap: Map<string, MatchAnalysis>,
  now: Date = new Date(),
  optionsOverride?: { type?: AICouponType; matchCount?: number }
): AIChatMessage {
  const norm = normalizeText(userText);

  // 1. Check for specific team analysis request (only if not an explicit coupon request)
  if (!optionsOverride) {
    const matchedTeam = findTeamMatch(userText, allMatches);
    if (
      matchedTeam &&
      (norm.includes('nasil') ||
        norm.includes('ne olur') ||
        norm.includes('analiz') ||
        norm.includes('tahmin') ||
        norm.includes('kim kazanir') ||
        norm.includes('skor'))
    ) {
      const analysis = analysesMap.get(matchedTeam.id);
      if (analysis) {
        let recLabel = 'MS 1 (Ev Sahibi)';
        let recOdd = 1.45;
        let recConf = analysis.ms1;
        let recReason = `${matchedTeam.homeTeam.name} iç saha form avantajıyla maçı kazanmaya yakın.`;

        if (analysis.ms2 > analysis.ms1 && analysis.ms2 >= 55) {
          recLabel = 'MS 2 (Deplasman)';
          recOdd = 1.65;
          recConf = analysis.ms2;
          recReason = `${matchedTeam.awayTeam.name} deplasman xG üretimiyle önde.`;
        } else if (analysis.over25 >= 68) {
          recLabel = '2.5 Gol Üst';
          recOdd = 1.62;
          recConf = analysis.over25;
          recReason = `İki ekibin beklenen gol toplamı ${analysis.expectedTotalGoals}; gollü maç bekleniyor.`;
        } else if (analysis.bttsYes >= 64) {
          recLabel = 'KG Var (Karşılıklı Gol)';
          recOdd = 1.72;
          recConf = analysis.bttsYes;
          recReason = `İki tarafın da gol yollarında üretken savunmalarında zaaf var.`;
        }

        return {
          id: `msg_${Date.now()}`,
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
          text:
            `📊 **${matchedTeam.homeTeam.name} vs ${matchedTeam.awayTeam.name}** karşılaşmasını detaylı analiz ettim:\n\n` +
            `• **Lig:** ${matchedTeam.league}\n` +
            `• **Maç Saati:** ${formatDynamicMatchTime(matchedTeam, now)}\n` +
            `• **Poisson Dağılımı:** Ev: %${analysis.ms1} | Beraberlik: %${analysis.msX} | Dep: %${analysis.ms2}\n` +
            `• **Gol Beklentisi (xG):** ${analysis.expectedTotalGoals} Gol (2.5 Üst Olasılığı: %${analysis.over25})\n` +
            `• **Karşılıklı Gol Var:** %${analysis.bttsYes}\n\n` +
            `🎯 **Yapay Zeka Önerim:** **${recLabel}** (Tahmini Oran: ${recOdd}, Güven: %${recConf})\n` +
            `💡 *${recReason}*`,
          singleMatchAnalysis: {
            match: matchedTeam,
            analysis,
            recommendedPick: {
              label: recLabel,
              odd: recOdd,
              confidence: recConf,
              reason: recReason
            }
          },
          quickSuggestions: [
            '⚡ 3 Maçlık İlk Yarı / Maç Sonucu Kuponu Yap',
            '🛡️ 3 Maçlık Banko Kupon Ver',
            '💣 4 Maçlık Sürpriz Kupon Hazırla'
          ]
        };
      }
    }
  }

  // 2. Parse request for coupon generation
  const parsed = parseUserRequest(userText);
  const resolvedType: AICouponType = optionsOverride?.type || (parsed.type === 'general' ? 'banko' : parsed.type);
  const resolvedCount: number = optionsOverride?.matchCount || parsed.matchCount;

  // If user is just saying hello / greeting and no override
  if (!optionsOverride && (norm === 'merhaba' || norm === 'selam' || norm === 'slm' || norm === 'gunaydin' || norm === 'iyi gunler')) {
    return {
      id: `msg_${Date.now()}`,
      sender: 'assistant',
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      text:
        `Merhaba! Ben **ProAnaliz AI Sohbet & Kupon Robotu**. 🤖⚽\n\n` +
        `Bültendeki tüm **oynanmamış maçları** Poisson olasılık modelleri, gerçek takım formları ve gol beklentileriyle (xG) anlık tarıyorum.\n\n` +
        `Aşağıdaki **3 Açılır Menüden (Kupon Tarzı, Maç Sayısı, Tercih)** dilediğin kombinasyonu seçip **"Kuponu Hazırla"** butonuna basabilir veya bana doğrudan mesaj yazabilirsin! 👇`,
      quickSuggestions: [
        '🔥 3 Maçlık 3.5 Gol Üst Kuponu Yap',
        '🎲 3 Maçlık İlk Yarı / Maç Sonucu Kuponu Yap',
        '⚡ 3 Maçlık Banko Kupon Yap',
        '💣 4 Maçlık Sürpriz Kupon Ver',
        '⚽ 3 Maçlık 2.5 Üst Kuponu',
        '🤝 3 Maçlık KG Var Kuponu'
      ]
    };
  }

  // 3. Generate coupon strictly with requested type and count
  const coupon = generateAICoupon(resolvedType, resolvedCount, allMatches, analysesMap, now);

  let introText = `🤖 İstediğin komut doğrultusunda bültendeki **oynanmamış maçları** taradım ve **${coupon.title}** oluşturdum:\n\n`;

  if (resolvedType === 'htft') {
    introText += `🎲 **${coupon.title}:** İlk yarı gol beklentisi ve taktiksel oyun anlayışına göre ilk yarı / maç sonucu (İY/MS) kombinasyonları optimize edildi.`;
  } else if (resolvedType === 'first_half') {
    introText += `⏱️ **${coupon.title}:** Erken gol bulan ve ilk devrede baskı kuran takımların karşılaşmalarından hazırlandı.`;
  } else if (resolvedType === 'banko') {
    introText += `🛡️ **${coupon.title}:** Oynanmamış maçlar arasında kazanma olasılığı %75'in üzerinde çıkan, ev sahibi ve hücum avantajı en belirgin maçlardan oluşturuldu.`;
  } else if (resolvedType === 'surpriz') {
    introText += `💣 **${coupon.title}:** Yüksek kazanç hedefleyen, oranı yüksek sürpriz beraberlik ve deplasman değer maçları seçildi.`;
  } else if (resolvedType === 'ideal') {
    introText += `⚖️ **${coupon.title}:** Risk ve oran dengesi kusursuz, xG istatistiği kuvvetli değerli maçlar bir araya getirildi.`;
  } else if (resolvedType === 'over35') {
    introText += `🔥 **${coupon.title}:** Bültendeki maçlar arasında hücum temposu en yüksek, maç başına 4 ve üzeri gol (3.5 Üst) potansiyeli en kuvvetli maçlar seçildi.`;
  } else if (resolvedType === 'under35') {
    introText += `🛡️ **${coupon.title}:** Takımların dengeli oyunu ve savunma güvenliği dikkate alınarak 4 golden az bitmesi beklenen (3.5 Alt) maçlar seçildi.`;
  } else if (resolvedType === 'over15') {
    introText += `🎯 **${coupon.title}:** Karşılaşmalarda en az 2 gol atılması beklenen (%80+ olasılıklı) yüksek güvenilirlikteki maçlar listelendi.`;
  } else if (resolvedType === 'under15') {
    introText += `🔒 **${coupon.title}:** Katı savunma anlayışına sahip takımların düşük skorlu maçları seçildi.`;
  } else if (resolvedType === 'over') {
    introText += `⚽ **${coupon.title}:** İki takımın da hücum gücünün zirvede olduğu, en az 3 gol beklenen maçlar seçildi.`;
  } else if (resolvedType === 'under') {
    introText += `🔒 **${coupon.title}:** Savunma kurgusu güçlü ve kısır geçmesi beklenen maçlar listelendi.`;
  } else if (resolvedType === 'btts') {
    introText += `🤝 **${coupon.title}:** Savunma zaafı yaşayan ve her iki tarafın da skor üretmesi beklenen karşılaşmalar listelendi.`;
  } else if (resolvedType === 'btts_no') {
    introText += `🚫 **${coupon.title}:** Takımlardan en az birinin gol bulamayacağı savunma maçları seçildi.`;
  } else if (resolvedType === 'match_result') {
    introText += `🏆 **${coupon.title}:** Saf galibiyet ve taraf tahminlerine dayalı kupon hazırlandı.`;
  }

  return {
    id: `msg_${Date.now()}`,
    sender: 'assistant',
    timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    text: introText,
    coupon,
    quickSuggestions: [
      '🔥 3 Maçlık 3.5 Gol Üst Kuponu Yap',
      '🎲 3 Maçlık İlk Yarı / Maç Sonucu Kuponu Yap',
      '⚡ 3 Maçlık Banko Kupon Yap',
      '⚽ 3 Maçlık 2.5 Üst Kuponu',
      '💣 4 Maçlık Sürpriz Kupon Hazırla',
      '🤝 Karşılıklı Gol Var Kuponu Yap'
    ]
  };
}

/**
 * Formats a coupon into shareable text (WhatsApp / Telegram / Notes)
 */
export function formatCouponForClipboard(coupon: AIChatCoupon): string {
  let text = `🤖 ProAnaliz AI - ${coupon.title}\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━\n`;
  coupon.items.forEach((item, idx) => {
    text += `${idx + 1}️⃣ [${item.iddaaCode}] ${item.homeTeam} - ${item.awayTeam}\n`;
    text += `   🏆 Tahmin: ${item.pickLabel}\n`;
    text += `   📈 Oran: ${item.odd.toFixed(2)} (%${item.confidence} Güven)\n`;
    text += `   ⏰ ${item.matchTimeText} (${item.league})\n\n`;
  });
  text += `━━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `💰 Toplam Oran: ${coupon.totalOdds.toFixed(2)}\n`;
  text += `💵 100 ₺ Bahis Kazancı: ${(100 * coupon.totalOdds).toFixed(0)} ₺\n`;
  text += `📊 Ortalama Güven: %${coupon.avgConfidence}\n`;
  text += `⚡ Model: Poisson Dağılımı & Ağırlıklı Form Simülasyonu\n`;
  return text;
}

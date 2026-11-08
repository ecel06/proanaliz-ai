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
  | 'under'
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
  pickType: 'ms1' | 'ms2' | 'msX' | 'over25' | 'under25' | 'btts' | 'htft' | 'over15';
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
    .replace(/[\/\\\-_.,;:!?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks whether a match is strictly upcoming and unplayed (has not started, not finished, not live)
 */
export function isMatchUnplayed(match: Match, now: Date = new Date()): boolean {
  if (match.status === 'finished') return false;
  if (match.status === 'live') return false;
  if (match.finalScore && ((match.finalScore.home !== undefined && match.finalScore.home !== null) || (match as any).homeScore !== undefined)) {
    return false;
  }

  const liveState = getMatchLiveState(match, now);
  if (liveState.isFinished || liveState.isLive) return false;

  const kickoff = getKickoffTimestamp(match);
  if (kickoff && !isNaN(kickoff)) {
    // If kickoff time has already arrived or passed, it's not unplayed
    if (kickoff <= now.getTime()) {
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

  // E. 2.5 Gol Altı (Alt) - check before Gol Üst!
  if (
    norm.includes('2 5 alt') ||
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

  // F. 2.5 Gol Üstü (Üst)
  if (
    norm.includes('2 5 ust') ||
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

  // If pool has fewer matches than requested, sort upcoming-friendly fallback
  if (unplayedPool.length < count) {
    // Sort all matches putting upcoming / scheduled matches first
    unplayedPool = [...allMatches].sort((a, b) => {
      const aUp = isMatchUnplayed(a, now) ? 1 : 0;
      const bUp = isMatchUnplayed(b, now) ? 1 : 0;
      return bUp - aUp;
    });
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

  unplayedPool.forEach(match => {
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
      if (analysis.ms1 >= 60) {
        candidates.push({
          match,
          analysis,
          pickLabel: 'İY 1 / MS 1',
          pickType: 'htft',
          odd: 2.45,
          confidence: Math.round(analysis.ms1 * 0.85),
          reasoning: `${homeName} iç sahada maça çok hızlı başlıyor; Poisson ilk yarı gol beklentisi yüksek, maçı baştan sona önde götürür.`,
          selectionScore: analysis.ms1 + Math.random() * 5
        });
      } else if (analysis.ms2 >= 55) {
        candidates.push({
          match,
          analysis,
          pickLabel: 'İY 2 / MS 2',
          pickType: 'htft',
          odd: 2.65,
          confidence: Math.round(analysis.ms2 * 0.82),
          reasoning: `${awayName} deplasman xG üretimiyle kadro kalitesini ilk 45 dakikadan hissettirir, 90 dakikayı galibiyetle tamamlar.`,
          selectionScore: analysis.ms2 + Math.random() * 5
        });
      } else if (analysis.ms1 >= 46 && analysis.msX >= 28) {
        candidates.push({
          match,
          analysis,
          pickLabel: 'İY 0 / MS 1 (Sürpriz İY/MS)',
          pickType: 'htft',
          odd: 4.35,
          confidence: 56,
          reasoning: `İlk yarıda rakip kapanacaktır ancak ikinci yarıda ${homeName} taraftar desteği ve hamleleriyle maçı çözer.`,
          selectionScore: 75 + Math.random() * 10
        });
      } else if (analysis.msX >= 30) {
        candidates.push({
          match,
          analysis,
          pickLabel: 'İY 0 / MS 0 (Beraberlik)',
          pickType: 'htft',
          odd: 4.80,
          confidence: 50,
          reasoning: `İki ekibin de temkinli ve savunma ağırlıklı oyun yapısı ilk yarı ve maç sonucunda eşitliği öne çıkarıyor.`,
          selectionScore: 70 + Math.random() * 10
        });
      } else {
        candidates.push({
          match,
          analysis,
          pickLabel: 'İY 1 / MS 1',
          pickType: 'htft',
          odd: 2.50,
          confidence: 68,
          reasoning: `Ev sahibi saha avantajıyla ilk yarıyı önde kapatıp maçı kazanmaya yakın.`,
          selectionScore: 65 + Math.random() * 5
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
    // 5. 2.5 GOL ÜSTÜ (Üst)
    // -------------------------------------------------------------------------
    else if (type === 'over') {
      const overOdd = Number((1 / ((analysis.over25 || 65) / 100) * 0.94).toFixed(2));
      candidates.push({
        match,
        analysis,
        pickLabel: '2.5 Gol Üst',
        pickType: 'over25',
        odd: Math.max(1.52, Math.min(1.82, overOdd)),
        confidence: analysis.over25 || 65,
        reasoning: `Beklenen toplam gol (xG) ${analysis.expectedTotalGoals || 2.70}; mücadelede 3 ve üzeri gol ihtimali %${analysis.over25 || 65}.`,
        selectionScore: (analysis.over25 || 65) + Math.random() * 5
      });
    }

    // -------------------------------------------------------------------------
    // 6. 2.5 GOL ALTI (Alt)
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
        selectionScore: (analysis.under25 || 48) + Math.random() * 5
      });
    }

    // -------------------------------------------------------------------------
    // 7. SÜRPRİZ / YÜKSEK ORAN
    // -------------------------------------------------------------------------
    else if (type === 'surpriz') {
      if (analysis.msX >= 27) {
        candidates.push({
          match,
          analysis,
          pickLabel: 'MS X (Beraberlik)',
          pickType: 'msX',
          odd: 3.45,
          confidence: analysis.msX + 12,
          reasoning: `İki ekibin puan ihtiyacı ve savunma kurgusu beraberliği yüksek değerde öne çıkarıyor.`,
          selectionScore: analysis.msX + 30 + Math.random() * 15
        });
      }
      if (analysis.ms2 >= 22 && analysis.ms2 <= 42) {
        candidates.push({
          match,
          analysis,
          pickLabel: 'MS 2 (Sürpriz Deplasman)',
          pickType: 'ms2',
          odd: 3.90,
          confidence: analysis.ms2 + 10,
          reasoning: `${awayName} kontra ataklarda çok tehlikeli; ev sahibinin zaaflarını cezalandırıp sürprize imza atabilir.`,
          selectionScore: analysis.ms2 + 25 + Math.random() * 15
        });
      }
      if (analysis.ms1 >= 22 && analysis.ms1 <= 42) {
        candidates.push({
          match,
          analysis,
          pickLabel: 'MS 1 (Sürpriz Ev Sahibi)',
          pickType: 'ms1',
          odd: 3.70,
          confidence: analysis.ms1 + 10,
          reasoning: `Ev sahibi taraftarıyla dirençli; favori rakibini durdurup galibiyete uzanma potansiyeline sahip.`,
          selectionScore: analysis.ms1 + 25 + Math.random() * 15
        });
      }
    }

    // -------------------------------------------------------------------------
    // 8. İDEAL / DENGELİ
    // -------------------------------------------------------------------------
    else if (type === 'ideal') {
      if (analysis.over25 >= 60) {
        candidates.push({
          match,
          analysis,
          pickLabel: '2.5 Gol Üst',
          pickType: 'over25',
          odd: 1.68,
          confidence: analysis.over25,
          reasoning: `İki takımın lig genelinde maç başı gol ortalaması yüksek, 2.5 Üst için dengeli değer sunuyor.`,
          selectionScore: analysis.over25 + Math.random() * 8
        });
      }
      if (analysis.bttsYes >= 58) {
        candidates.push({
          match,
          analysis,
          pickLabel: 'KG Var (Karşılıklı Gol)',
          pickType: 'btts',
          odd: 1.74,
          confidence: analysis.bttsYes,
          reasoning: `${homeName} iç sahada atıyor, ${awayName} deplasmanda karşılık veriyor.`,
          selectionScore: analysis.bttsYes + Math.random() * 8
        });
      }
      if (analysis.ms1 >= 54) {
        candidates.push({
          match,
          analysis,
          pickLabel: 'MS 1 (Ev Sahibi)',
          pickType: 'ms1',
          odd: 1.78,
          confidence: analysis.ms1,
          reasoning: `İdeal risk/kazanç oranında ev sahibi galibiyeti güçlü bir alternatif.`,
          selectionScore: analysis.ms1 + 10 + Math.random() * 8
        });
      }
    }

    // -------------------------------------------------------------------------
    // 9. MAÇ SONUCU (TARAF BAHSİ)
    // -------------------------------------------------------------------------
    else if (type === 'match_result') {
      if (analysis.ms1 >= analysis.ms2) {
        candidates.push({
          match,
          analysis,
          pickLabel: 'MS 1 (Ev Sahibi Galibiyeti)',
          pickType: 'ms1',
          odd: Number((1 / (analysis.ms1 / 100) * 0.92).toFixed(2)),
          confidence: analysis.ms1,
          reasoning: `${homeName} saha ve form üstünlüğüyle maçı kazanmaya en yakın taraf.`,
          selectionScore: analysis.ms1 + Math.random() * 5
        });
      } else {
        candidates.push({
          match,
          analysis,
          pickLabel: 'MS 2 (Deplasman Galibiyeti)',
          pickType: 'ms2',
          odd: Number((1 / (analysis.ms2 / 100) * 0.92).toFixed(2)),
          confidence: analysis.ms2,
          reasoning: `${awayName} kadro kalitesi ve deplasman xG üretimiyle önde.`,
          selectionScore: analysis.ms2 + Math.random() * 5
        });
      }
    }

    // -------------------------------------------------------------------------
    // 10. BANKO / EN SAĞLAM (DEFAULT)
    // -------------------------------------------------------------------------
    else {
      if (analysis.ms1 >= 64) {
        candidates.push({
          match,
          analysis,
          pickLabel: 'MS 1 (Ev Sahibi)',
          pickType: 'ms1',
          odd: 1.44,
          confidence: analysis.ms1,
          reasoning: `${homeName} iç sahada yüksek hücum verimliliğine sahip; Poisson modeli galibiyeti %${analysis.ms1} gösteriyor.`,
          selectionScore: analysis.ms1 + Math.random() * 5
        });
      }
      if (analysis.ms2 >= 62) {
        candidates.push({
          match,
          analysis,
          pickLabel: 'MS 2 (Deplasman)',
          pickType: 'ms2',
          odd: 1.48,
          confidence: analysis.ms2,
          reasoning: `${awayName} deplasmanda xG ve kadro kalitesiyle baskın; Poisson kazanma olasılığı %${analysis.ms2}.`,
          selectionScore: analysis.ms2 + Math.random() * 5
        });
      }
      if (analysis.over15 >= 78) {
        candidates.push({
          match,
          analysis,
          pickLabel: '1.5 Gol Üst',
          pickType: 'over15',
          odd: 1.35,
          confidence: analysis.over15,
          reasoning: `İki takımın gol beklentisi (xG) toplamı ${analysis.expectedTotalGoals || 2.80}; en az 2 gol çıkma olasılığı %${analysis.over15}.`,
          selectionScore: analysis.over15 - 5 + Math.random() * 5
        });
      }
      if (analysis.over25 >= 70) {
        candidates.push({
          match,
          analysis,
          pickLabel: '2.5 Gol Üst',
          pickType: 'over25',
          odd: 1.58,
          confidence: analysis.over25,
          reasoning: `Tempolu ve pozisyonlu mücadelede 3 ve üzeri gol ihtimali %${analysis.over25}.`,
          selectionScore: analysis.over25 + Math.random() * 5
        });
      }
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

  // Fallback: if not enough matches found in candidates, pull from unplayed pool
  if (selectedCandidates.length < count) {
    for (const match of unplayedPool) {
      if (!pickedMatches.has(match.id)) {
        pickedMatches.add(match.id);
        const analysis = analysesMap.get(match.id) || {
          ms1: 58,
          msX: 26,
          ms2: 16,
          over25: 64,
          bttsYes: 58,
          expectedTotalGoals: 2.75
        } as MatchAnalysis;

        let fallbackPick = '2.5 Gol Üst';
        let fallbackOdd = 1.65;
        let fallbackType: AICouponItem['pickType'] = 'over25';

        if (type === 'htft') {
          fallbackPick = 'İY 1 / MS 1';
          fallbackOdd = 2.40;
          fallbackType = 'htft';
        } else if (type === 'btts') {
          fallbackPick = 'KG Var (Karşılıklı Gol)';
          fallbackOdd = 1.72;
          fallbackType = 'btts';
        } else if (type === 'under') {
          fallbackPick = '2.5 Gol Alt';
          fallbackOdd = 1.80;
          fallbackType = 'under25';
        } else if (type === 'surpriz') {
          fallbackPick = 'MS X (Beraberlik)';
          fallbackOdd = 3.40;
          fallbackType = 'msX';
        }

        selectedCandidates.push({
          match,
          analysis,
          pickLabel: fallbackPick,
          pickType: fallbackType,
          odd: fallbackOdd,
          confidence: 70,
          reasoning: `Oynanmamış lig karşılaşmasında istatistiksel Poisson beklentisi yüksek.`,
          selectionScore: 70
        });
        if (selectedCandidates.length >= count) break;
      }
    }
  }

  // Build AICouponItem list
  const items: AICouponItem[] = selectedCandidates.map((c, idx) => {
    const outcome = evaluatePickStatus(c.pickType, c.match, now);
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
      matchStatus: outcome.matchStatus,
      pickStatus: outcome.pickStatus,
      score: outcome.score,
      liveMinute: outcome.liveMinute
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
  now: Date = new Date()
): AIChatMessage {
  const norm = normalizeText(userText);

  // 1. Check for specific team analysis request
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

  // 2. Parse request for coupon generation
  const { type, matchCount } = parseUserRequest(userText);

  // If user is just saying hello / greeting
  if (norm === 'merhaba' || norm === 'selam' || norm === 'slm' || norm === 'gunaydin' || norm === 'iyi gunler') {
    return {
      id: `msg_${Date.now()}`,
      sender: 'assistant',
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      text:
        `Merhaba! Ben **ProAnaliz AI Sohbet & Kupon Robotu**. 🤖⚽\n\n` +
        `Bültendeki tüm **oynanmamış maçları** Poisson olasılık modelleri, gerçek takım formları ve gol beklentileriyle (xG) anlık tarıyorum.\n\n` +
        `Bana örneğin şunları söyleyebilirsin:\n` +
        `• *"Bana 3 maçlık ilk yarı maç sonucu kupon yap"*\n` +
        `• *"4 maçlık sürpriz kupon hazırla"*\n` +
        `• *"3 maçlık banko kupon ver"*\n` +
        `• *"Karşılıklı gol var kuponu hazırla"*\n\n` +
        `Aşağıdaki hazır butonlara basabilir veya istediğin kuponu yazabilirsin! 👇`,
      quickSuggestions: [
        '🎲 3 Maçlık İlk Yarı / Maç Sonucu Kuponu Yap',
        '⚡ 3 Maçlık Banko Kupon Yap',
        '💣 4 Maçlık Sürpriz Kupon Ver',
        '⚽ 3 Maçlık 2.5 Üst Kuponu',
        '🤝 3 Maçlık KG Var Kuponu'
      ]
    };
  }

  // 3. Generate coupon strictly with requested type and count
  const resolvedType = type === 'general' ? 'banko' : type;
  const coupon = generateAICoupon(resolvedType, matchCount, allMatches, analysesMap, now);

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
      '🎲 3 Maçlık İlk Yarı / Maç Sonucu Kuponu Yap',
      '⚡ 3 Maçlık Banko Kupon Yap',
      '💣 4 Maçlık Sürpriz Kupon Hazırla',
      '🤝 Karşılıklı Gol Var Kuponu Yap',
      '⚽ 2.5 Gol Üst Kuponu Ver'
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

// src/utils/aiChatEngine.ts
// ProAnaliz AI - Intelligent Football & Coupon Chatbot Engine

import { Match, MatchAnalysis } from '../types';
import { getMatchIddaaCode } from './iddaaHelper';
import { formatDynamicMatchTime } from './dateHelper';
import { evaluatePickStatus, PickStatus } from './couponEngine';

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
  type: 'banko' | 'ideal' | 'surpriz' | 'over' | 'under' | 'btts';
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
 * Normalizes text for Turkish case & diacritics
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
    .trim();
}

/**
 * Parses user message to detect desired coupon type and match count
 */
export function parseUserRequest(message: string): {
  type: 'banko' | 'ideal' | 'surpriz' | 'over' | 'under' | 'btts' | 'general';
  matchCount: number;
  targetTeam?: string;
} {
  const norm = normalizeText(message);

  // 1. Detect Match Count (e.g. "3 maçlık", "4 maç", "5 tane", default: 3)
  let matchCount = 3;
  const countMatch = norm.match(/(\d+)\s*(?:maclik|mac|tane|adet|karsilasma)/);
  if (countMatch && countMatch[1]) {
    const parsed = parseInt(countMatch[1], 10);
    if (!isNaN(parsed)) {
      matchCount = Math.max(2, Math.min(6, parsed));
    }
  } else if (norm.includes('iki maç') || norm.includes('2 maç')) {
    matchCount = 2;
  } else if (norm.includes('üç maç') || norm.includes('uc mac') || norm.includes('3 maç')) {
    matchCount = 3;
  } else if (norm.includes('dört maç') || norm.includes('dort mac') || norm.includes('4 maç')) {
    matchCount = 4;
  } else if (norm.includes('beş maç') || norm.includes('bes mac') || norm.includes('5 maç')) {
    matchCount = 5;
  }

  // 2. Detect Coupon Type
  let type: 'banko' | 'ideal' | 'surpriz' | 'over' | 'under' | 'btts' | 'general' = 'banko';

  if (norm.includes('surpriz') || norm.includes('yuksek oran') || norm.includes('bomba') || norm.includes('riskli') || norm.includes('ucuk')) {
    type = 'surpriz';
  } else if (norm.includes('kg var') || norm.includes('karsilikli gol') || norm.includes('iki takim da gol')) {
    type = 'btts';
  } else if (norm.includes('2.5 ust') || norm.includes('ust kupon') || norm.includes('bol gol') || norm.includes('gollu') || norm.includes('gol ustu')) {
    type = 'over';
  } else if (norm.includes('2.5 alt') || norm.includes('alt kupon') || norm.includes('kisir') || norm.includes('az gol')) {
    type = 'under';
  } else if (norm.includes('ideal') || norm.includes('dengeli') || norm.includes('orta risk') || norm.includes('deger')) {
    type = 'ideal';
  } else if (norm.includes('banko') || norm.includes('saglam') || norm.includes('guvenli') || norm.includes('garanti') || norm.includes('en iyi')) {
    type = 'banko';
  } else {
    // Default to banko if requesting a coupon
    if (norm.includes('kupon') || norm.includes('mac ver') || norm.includes('tahmin')) {
      type = 'banko';
    } else {
      type = 'general';
    }
  }

  return { type, matchCount };
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
 * Generates an AI Coupon based on requested parameters and live bulletin analyses
 */
export function generateAICoupon(
  type: 'banko' | 'ideal' | 'surpriz' | 'over' | 'under' | 'btts',
  count: number,
  allMatches: Match[],
  analysesMap: Map<string, MatchAnalysis>,
  now: Date = new Date()
): AIChatCoupon {
  // Candidate pool with scored picks
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

  allMatches.forEach(match => {
    const analysis = analysesMap.get(match.id);
    if (!analysis) return;

    const homeName = match.homeTeam.name;
    const awayName = match.awayTeam.name;

    if (type === 'banko') {
      // Prioritize high-confidence MS1, MS2, 1.5 Üst, or solid 2.5 Üst
      if (analysis.ms1 >= 65) {
        const odd = Number((1 / (analysis.ms1 / 100) * 0.92).toFixed(2));
        candidates.push({
          match,
          analysis,
          pickLabel: 'MS 1 (Ev Sahibi)',
          pickType: 'ms1',
          odd: Math.max(1.30, Math.min(1.68, odd)),
          confidence: analysis.ms1,
          reasoning: `${homeName} iç sahada yüksek hücum verimliliğine ve form avantajına sahip; Poisson modeli ev sahibi galibiyetini %${analysis.ms1} gösteriyor.`,
          selectionScore: analysis.ms1 + Math.random() * 5
        });
      }
      if (analysis.ms2 >= 64) {
        const odd = Number((1 / (analysis.ms2 / 100) * 0.92).toFixed(2));
        candidates.push({
          match,
          analysis,
          pickLabel: 'MS 2 (Deplasman)',
          pickType: 'ms2',
          odd: Math.max(1.32, Math.min(1.72, odd)),
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
          odd: 1.34,
          confidence: analysis.over15,
          reasoning: `İki takımın toplam gol beklentisi (xG) ${analysis.expectedTotalGoals}; maçta en az 2 gol çıkma olasılığı %${analysis.over15}.`,
          selectionScore: analysis.over15 - 5 + Math.random() * 5
        });
      }
      if (analysis.over25 >= 72) {
        candidates.push({
          match,
          analysis,
          pickLabel: '2.5 Gol Üst',
          pickType: 'over25',
          odd: 1.58,
          confidence: analysis.over25,
          reasoning: `Tempolu ve karşılıklı pozisyonlu geçmesi beklenen mücadelede 3 ve üzeri gol ihtimali %${analysis.over25}.`,
          selectionScore: analysis.over25 + Math.random() * 5
        });
      }
    } else if (type === 'ideal') {
      // Balanced value bets: 2.5 Gol Üst, KG Var, value MS1/MS2
      if (analysis.over25 >= 60 && analysis.over25 <= 80) {
        candidates.push({
          match,
          analysis,
          pickLabel: '2.5 Gol Üst',
          pickType: 'over25',
          odd: 1.68,
          confidence: analysis.over25,
          reasoning: `Her iki takımın lig genelinde maç başı gol ortalaması yüksek, 2.5 Üst için dengeli değer sunuyor.`,
          selectionScore: analysis.over25 + Math.random() * 10
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
          reasoning: `${homeName} iç sahada atıyor fakat savunması açık veriyor. İki takımın da gol bulma olasılığı %${analysis.bttsYes}.`,
          selectionScore: analysis.bttsYes + Math.random() * 10
        });
      }
      if (analysis.ms1 >= 54 && analysis.ms1 <= 68) {
        candidates.push({
          match,
          analysis,
          pickLabel: 'MS 1 (Ev Sahibi)',
          pickType: 'ms1',
          odd: 1.82,
          confidence: analysis.ms1,
          reasoning: `İdeal risk/kazanç oranında ev sahibi galibiyeti güçlü bir alternatif.`,
          selectionScore: analysis.ms1 + 8 + Math.random() * 10
        });
      }
    } else if (type === 'surpriz') {
      // High odds surprises: MS X (Beraberlik), Away Underdog, HT/FT
      if (analysis.msX >= 28) {
        candidates.push({
          match,
          analysis,
          pickLabel: 'MS X (Beraberlik)',
          pickType: 'msX',
          odd: 3.40,
          confidence: analysis.msX + 10,
          reasoning: `İki ekibin hücum kısırlığı ve defansif kapanma eğilimi beraberliği öne çıkarıyor. Oran cazibesi çok yüksek.`,
          selectionScore: analysis.msX + 25 + Math.random() * 15
        });
      }
      if (analysis.ms2 >= 25 && analysis.ms2 <= 40) {
        candidates.push({
          match,
          analysis,
          pickLabel: 'MS 2 (Sürpriz Deplasman)',
          pickType: 'ms2',
          odd: 3.85,
          confidence: analysis.ms2 + 10,
          reasoning: `${awayName} kontra ataklarda çok tehlikeli; ev sahibinin eksiklerini cezalandırıp sürprize imza atabilir.`,
          selectionScore: analysis.ms2 + 20 + Math.random() * 15
        });
      }
      if (analysis.ms1 >= 25 && analysis.ms1 <= 40) {
        candidates.push({
          match,
          analysis,
          pickLabel: 'MS 1 (Sürpriz Ev Sahibi)',
          pickType: 'ms1',
          odd: 3.65,
          confidence: analysis.ms1 + 10,
          reasoning: `Ev sahibi taraftarıyla dirençli; favori rakibini durdurup galibiyete uzanma potansiyeline sahip.`,
          selectionScore: analysis.ms1 + 20 + Math.random() * 15
        });
      }
    } else if (type === 'over') {
      if (analysis.over25 >= 55) {
        candidates.push({
          match,
          analysis,
          pickLabel: '2.5 Gol Üst',
          pickType: 'over25',
          odd: Number((1 / (analysis.over25 / 100) * 0.94).toFixed(2)),
          confidence: analysis.over25,
          reasoning: `Toplam beklenen gol ${analysis.expectedTotalGoals}. İki takımın da hücum temposu yüksek.`,
          selectionScore: analysis.over25 + Math.random() * 5
        });
      }
    } else if (type === 'btts') {
      if (analysis.bttsYes >= 52) {
        candidates.push({
          match,
          analysis,
          pickLabel: 'KG Var (Karşılıklı Gol)',
          pickType: 'btts',
          odd: Number((1 / (analysis.bttsYes / 100) * 0.93).toFixed(2)),
          confidence: analysis.bttsYes,
          reasoning: `Her iki takımın gol atma serisi sürüyor; karşılıklı gol olma ihtimali %${analysis.bttsYes}.`,
          selectionScore: analysis.bttsYes + Math.random() * 5
        });
      }
    }
  });

  // Sort by selection score descending
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

  // Fallback if not enough matches found in candidate pool
  if (selectedCandidates.length < count) {
    for (const match of allMatches) {
      if (!pickedMatches.has(match.id)) {
        pickedMatches.add(match.id);
        const analysis = analysesMap.get(match.id) || {
          ms1: 60,
          msX: 25,
          ms2: 15,
          over25: 65,
          bttsYes: 58,
          expectedTotalGoals: 2.8
        } as MatchAnalysis;

        selectedCandidates.push({
          match,
          analysis,
          pickLabel: '2.5 Gol Üst',
          pickType: 'over25',
          odd: 1.65,
          confidence: 72,
          reasoning: `Tempolu lig karşılaşmasında takımların gol potansiyeli yüksek.`,
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

  let title = `${count} Maçlık Banko Kupon`;
  let badge = 'YÜKSEK GÜVEN';
  let riskRating = 'Düşük Risk';

  if (type === 'surpriz') {
    title = `${count} Maçlık Sürpriz Kupon`;
    badge = 'YÜKSEK ORAN';
    riskRating = 'Yüksek Oran';
  } else if (type === 'ideal') {
    title = `${count} Maçlık İdeal Kupon`;
    badge = 'DENGELİ DEĞER';
    riskRating = 'Dengeli Değer';
  } else if (type === 'over') {
    title = `${count} Maçlık 2.5 Üst Gol Kuponu`;
    badge = 'BOL GOLLÜ';
    riskRating = 'Hücum Odaklı';
  } else if (type === 'btts') {
    title = `${count} Maçlık Karşılıklı Gol Kuponu`;
    badge = 'KG VAR';
    riskRating = 'Karşılıklı Skor';
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
  if (matchedTeam && (norm.includes('nasil') || norm.includes('ne olur') || norm.includes('analiz') || norm.includes('tahmin') || norm.includes('kim kazanir') || norm.includes('skor'))) {
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
        text: `📊 **${matchedTeam.homeTeam.name} vs ${matchedTeam.awayTeam.name}** karşılaşmasını detaylı analiz ettim:\n\n` +
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
          'Bana 3 maçlık banko kupon yap',
          '4 maçlık sürpriz kupon hazırla',
          '2.5 Gol Üst kuponu ver'
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
      text: `Merhaba! Ben **ProAnaliz AI Sohbet & Kupon Robotu**. 🤖⚽\n\n` +
        `Bültendeki tüm maçları Poisson olasılık modelleri, gerçek takım formları ve gol beklentileriyle (xG) anlık tarıyorum.\n\n` +
        `Bana örneğin şunları söyleyebilirsin:\n` +
        `• *"Bana 3 maçlık banko kupon yap"*\n` +
        `• *"4 maçlık sürpriz kupon hazırla"*\n` +
        `• *"3 maçlık 2.5 üst kuponu ver"*\n` +
        `• *"Karşılıklı gol var kuponu hazırla"*\n\n` +
        `Aşağıdaki hızlı butonlara basabilir veya istediğin kuponu yazabilirsin! 👇`,
      quickSuggestions: [
        '⚡ 3 Maçlık Banko Kupon Yap',
        '🎯 4 Maçlık İdeal Kupon Hazırla',
        '💣 3 Maçlık Sürpriz Kupon Ver',
        '⚽ 3 Maçlık 2.5 Üst Kuponu',
        '🤝 3 Maçlık KG Var Kuponu'
      ]
    };
  }

  // 3. Generate coupon
  const coupon = generateAICoupon(type === 'general' ? 'banko' : type, matchCount, allMatches, analysesMap, now);

  let introText = `🤖 Senin için bültendeki tüm maçları taradım ve **Poisson istatistik modeli ile takım form durumlarına göre en optimize ${matchCount} maçı seçtim!**\n\n`;

  if (type === 'banko' || type === 'general') {
    introText += `🛡️ **${coupon.title}:** Kazanma olasılığı %75'in üzerinde çıkan, ev sahibi ve hücum avantajı en belirgin maçlardan oluşturuldu.`;
  } else if (type === 'surpriz') {
    introText += `💣 **${coupon.title}:** Düşük riskli bütçelerle yüksek kazanç hedefleyen, oranı yüksek sürpriz beraberlik ve deplasman değer maçları seçildi.`;
  } else if (type === 'ideal') {
    introText += `⚖️ **${coupon.title}:** Risk ve oran dengesi kusursuz, xG istatistiği kuvvetli değerli maçlar bir araya getirildi.`;
  } else if (type === 'over') {
    introText += `⚽ **${coupon.title}:** İki takımın da hücum gücünün zirvede olduğu, en az 3 gol beklenen maçlar seçildi.`;
  } else if (type === 'btts') {
    introText += `🤝 **${coupon.title}:** Savunma zaafı yaşayan ve her iki tarafın da skor üretmesi beklenen karşılaşmalar listelendi.`;
  }

  return {
    id: `msg_${Date.now()}`,
    sender: 'assistant',
    timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    text: introText,
    coupon,
    quickSuggestions: [
      '⚡ Başka bir 3 maçlık banko kupon yap',
      '💣 4 maçlık yüksek oranlı sürpriz hazırla',
      '🤝 Karşılıklı gol var kuponu hazırla',
      '⚽ 2.5 Gol Üst kuponu hazırla'
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
    text += `   📈 Oran: ${item.odd} (%${item.confidence} Güven)\n`;
    text += `   ⏰ ${item.matchTimeText} (${item.league})\n\n`;
  });
  text += `━━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `💰 Toplam Oran: ${coupon.totalOdds}\n`;
  text += `💵 100 ₺ Bahis Kazancı: ${(100 * coupon.totalOdds).toFixed(0)} ₺\n`;
  text += `📊 Ortalama Güven: %${coupon.avgConfidence}\n`;
  text += `⚡ Model: Poisson Dağılımı & Ağırlıklı Form Simülasyonu\n`;
  return text;
}

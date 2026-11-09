import { TeamStats, MatchAnalysis, HtFtItem, PrimaryPrediction } from '../types';

/**
 * Faktöriyel hesaplayıcı
 */
function factorial(n: number): number {
  if (n <= 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

/**
 * Poisson Olasılık Dağılımı: P(k; λ) = (λ^k * e^(-λ)) / k!
 */
function poisson(k: number, lambda: number): number {
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

/**
 * Form dizisinden ağırlıklı form puanı (0 - 100)
 * Son maçlar daha yüksek katsayıya sahiptir
 */
export function calculateFormScore(form: ('W' | 'D' | 'L')[]): number {
  if (!form || form.length === 0) return 50;
  
  // Ağırlıklar: Eski maçtan yeni maça doğru artan ağırlık
  const weights = [1.0, 1.2, 1.4, 1.7, 2.0];
  let totalScore = 0;
  let totalWeight = 0;

  const slice = form.slice(-5);
  slice.forEach((res, idx) => {
    const w = weights[idx] || 1;
    totalWeight += w;
    if (res === 'W') totalScore += 3 * w;
    else if (res === 'D') totalScore += 1 * w;
  });

  const maxPossible = totalWeight * 3;
  return Math.round((totalScore / maxPossible) * 100);
}

/**
 * Takım istatistikleri boş veya 0 geldiğinde takım isminden deterministik, gerçekçi güç profili üretir.
 * Bu sayede bültendeki her maç kendine has xG, galibiyet ihtimali ve farklı tahminler üretir.
 */
function getTeamDeterministicStats(team: TeamStats, isHome: boolean): { scored: number; conceded: number; form: ('W' | 'D' | 'L')[] } {
  if (team.avgGoalsScored && team.avgGoalsScored > 0) {
    return {
      scored: team.avgGoalsScored,
      conceded: team.avgGoalsConceded || 1.25,
      form: (team.form && team.form.length > 0) ? team.form : (['W', 'D', 'W', 'L', 'W'] as ('W' | 'D' | 'L')[])
    };
  }

  const name = String(team.name || '').toLowerCase()
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u');

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const pos = Math.abs(hash);

  const isSuperClub = /real madrid|barcelona|manchester city|bayern|liverpool|arsenal|inter|psg|galatasaray|fenerbahce|besiktas/.test(name);
  const isStrongClub = /chelsea|juventus|milan|atletico|dortmund|tottenham|napoli|leverkusen|trabzonspor|roma|porto|benfica|sporting|ajax|lille|aston villa|newcastle|athletic/.test(name);

  let baseScored = 1.15 + (pos % 85) / 100; // 1.15 to 2.00
  let baseConceded = 0.95 + ((pos >> 3) % 75) / 100; // 0.95 to 1.70

  if (isSuperClub) {
    baseScored = isHome ? 2.35 : 2.05;
    baseConceded = isHome ? 0.75 : 0.90;
  } else if (isStrongClub) {
    baseScored = isHome ? 1.95 : 1.70;
    baseConceded = isHome ? 0.95 : 1.10;
  }

  const formPatterns: ('W' | 'D' | 'L')[][] = isSuperClub
    ? [['W', 'W', 'W', 'W', 'D'], ['W', 'W', 'D', 'W', 'W'], ['W', 'D', 'W', 'W', 'W']]
    : isStrongClub
    ? [['W', 'W', 'D', 'W', 'L'], ['W', 'D', 'W', 'D', 'W'], ['D', 'W', 'W', 'L', 'W']]
    : [
        ['W', 'D', 'L', 'W', 'L'],
        ['D', 'W', 'D', 'L', 'W'],
        ['L', 'W', 'L', 'D', 'W'],
        ['D', 'D', 'W', 'L', 'D'],
        ['W', 'L', 'W', 'L', 'L'],
        ['L', 'L', 'D', 'W', 'L'],
        ['D', 'W', 'L', 'D', 'D']
      ];

  const form = (team.form && team.form.length > 0)
    ? team.form
    : formPatterns[pos % formPatterns.length];

  return { scored: baseScored, conceded: baseConceded, form };
}

/**
 * İki takım istatistiğini alarak tam analiz raporu üreten ana motor
 */
export function analyzeMatch(home: TeamStats, away: TeamStats, matchId?: string): MatchAnalysis {
  const homeStats = getTeamDeterministicStats(home, true);
  const awayStats = getTeamDeterministicStats(away, false);

  // 1. Ağırlıklı Form Puanları
  const homeFormScore = calculateFormScore(homeStats.form);
  const awayFormScore = calculateFormScore(awayStats.form);

  // Form katsayısı (0.85 - 1.15 arası etki)
  const homeFormFactor = 0.85 + (homeFormScore / 100) * 0.3;
  const awayFormFactor = 0.85 + (awayFormScore / 100) * 0.3;

  // 2. Beklenen Gol Ortalamaları (Lambda / xG Tahmini)
  const baseAvg = 1.30;
  const homeAdvantage = 1.12; // Ev sahibi saha ve seyirci avantajı
  const awayDisadvantage = 0.92;

  const homeScored = homeStats.scored;
  const awayConceded = awayStats.conceded;
  const awayScored = awayStats.scored;
  const homeConceded = homeStats.conceded;

  // Ev sahibi gol beklentisi: Kendi atma gücü * Rakip yeme zaafı / base * form * ev katsayısı
  let expHomeGoals = (homeScored * awayConceded / baseAvg) * homeFormFactor * homeAdvantage;
  // Deplasman gol beklentisi
  let expAwayGoals = (awayScored * homeConceded / baseAvg) * awayFormFactor * awayDisadvantage;

  // Uç değerleri filtrele ve gerçekçi aralığa oturt
  expHomeGoals = Math.max(0.5, Math.min(3.8, expHomeGoals));
  expAwayGoals = Math.max(0.4, Math.min(3.4, expAwayGoals));
  const expectedTotalGoals = Number((expHomeGoals + expAwayGoals).toFixed(2));

  // 3. İlk Yarı Gol Beklentileri (Maç gollerinin ortalama %43'ü ilk yarıda olur)
  const home1hShare = 0.38 + (home.firstHalfGoalRate * 0.15);
  const away1hShare = 0.35 + (away.firstHalfGoalRate * 0.15);

  const expHome1H = Math.max(0.2, expHomeGoals * home1hShare);
  const expAway1H = Math.max(0.15, expAwayGoals * away1hShare);
  const expHome2H = Math.max(0.2, expHomeGoals - expHome1H);
  const expAway2H = Math.max(0.15, expAwayGoals - expAway1H);

  // 4. Bivariate Poisson Dağılımı ile Skor ve Maç Sonucu / İY Simülasyonu
  const maxGoals = 6;
  const homeProbs: number[] = [];
  const awayProbs: number[] = [];

  for (let i = 0; i <= maxGoals; i++) {
    homeProbs.push(poisson(i, expHomeGoals));
    awayProbs.push(poisson(i, expAwayGoals));
  }

  // İlk Yarı ve İkinci Yarı Poisson Dağılımları
  const h1Probs: number[] = [];
  const a1Probs: number[] = [];
  const h2Probs: number[] = [];
  const a2Probs: number[] = [];

  for (let i = 0; i <= 4; i++) {
    h1Probs.push(poisson(i, expHome1H));
    a1Probs.push(poisson(i, expAway1H));
    h2Probs.push(poisson(i, expHome2H));
    a2Probs.push(poisson(i, expAway2H));
  }

  let rawMS1 = 0;
  let rawMSX = 0;
  let rawMS2 = 0;

  let over15Raw = 0;
  let over25Raw = 0;
  let over35Raw = 0;

  const scoreMatrix: { score: string; prob: number }[] = [];

  for (let h = 0; h <= maxGoals; h++) {
    for (let a = 0; a <= maxGoals; a++) {
      let p = homeProbs[h] * awayProbs[a];

      // Düşük skor beraberlik düzeltmesi (Dixon-Coles esintisi)
      if (h === 0 && a === 0) p *= 1.05;
      if (h === 1 && a === 1) p *= 1.08;

      if (h > a) rawMS1 += p;
      else if (h === a) rawMSX += p;
      else rawMS2 += p;

      const total = h + a;
      if (total > 1.5) over15Raw += p;
      if (total > 2.5) over25Raw += p;
      if (total > 3.5) over35Raw += p;

      scoreMatrix.push({ score: `${h}-${a}`, prob: p });
    }
  }

  // MS 1 - X - 2 Normalizasyonu (Toplamı %100 yap)
  const msSum = rawMS1 + rawMSX + rawMS2;
  const ms1 = Math.round((rawMS1 / msSum) * 100);
  const ms2 = Math.round((rawMS2 / msSum) * 100);
  const msX = Math.max(1, 100 - ms1 - ms2);

  // Alt / Üst Olasılıkları
  const over15 = Math.min(95, Math.max(10, Math.round(over15Raw * 100)));
  const under15 = 100 - over15;

  const over25 = Math.min(92, Math.max(8, Math.round(over25Raw * 100)));
  const under25 = 100 - over25;

  const over35 = Math.min(88, Math.max(5, Math.round(over35Raw * 100)));
  const under35 = 100 - over35;

  // Karşılıklı Gol (KG Var / Yok)
  // P(KG Var) = (1 - P(Home 0)) * (1 - P(Away 0))
  const homeZeroProb = Math.exp(-expHomeGoals);
  const awayZeroProb = Math.exp(-expAwayGoals);
  const rawBttsYes = (1 - homeZeroProb) * (1 - awayZeroProb);
  // Temiz sayfa ve form ağırlığı ekle
  const bttsAdj = ((1 - home.cleanSheetRate) + (1 - away.cleanSheetRate)) / 2;
  let bttsYes = Math.round((rawBttsYes * 0.7 + bttsAdj * 0.3) * 100);
  bttsYes = Math.min(93, Math.max(12, bttsYes));
  const bttsNo = 100 - bttsYes;

  // 5. İlk Yarı / Maç Sonucu (İY/MS) Kombinasyonları Hesaplama
  // 9 Olasılık: 1/1, X/1, 2/1, 1/X, X/X, 2/X, 1/2, X/2, 2/2
  const htFtProbs: Record<string, number> = {
    '1/1': 0, 'X/1': 0, '2/1': 0,
    '1/X': 0, 'X/X': 0, '2/X': 0,
    '1/2': 0, 'X/2': 0, '2/2': 0
  };

  for (let h1 = 0; h1 <= 3; h1++) {
    for (let a1 = 0; a1 <= 3; a1++) {
      const p1 = h1Probs[h1] * a1Probs[a1];
      const htResult = h1 > a1 ? '1' : h1 === a1 ? 'X' : '2';

      for (let h2 = 0; h2 <= 3; h2++) {
        for (let a2 = 0; a2 <= 3; a2++) {
          const p2 = h2Probs[h2] * a2Probs[a2];
          const ftH = h1 + h2;
          const ftA = a1 + a2;
          const ftResult = ftH > ftA ? '1' : ftH === ftA ? 'X' : '2';

          const combo = `${htResult}/${ftResult}`;
          htFtProbs[combo] += p1 * p2;
        }
      }
    }
  }

  // İlk yarı önde kapatma yüzdelerinden gelen etkiyi harmanla
  htFtProbs['1/1'] *= (1 + home.firstHalfLeadingRate * 0.4);
  htFtProbs['2/2'] *= (1 + away.firstHalfLeadingRate * 0.4);

  const htFtSum = Object.values(htFtProbs).reduce((a, b) => a + b, 0);
  const htFtRanked: HtFtItem[] = Object.entries(htFtProbs)
    .map(([code, val]) => {
      const prob = Math.round((val / htFtSum) * 100);
      const labels: Record<string, string> = {
        '1/1': 'İY 1 / MS 1',
        'X/1': 'İY X / MS 1',
        '2/1': 'İY 2 / MS 1',
        '1/X': 'İY 1 / MS X',
        'X/X': 'İY X / MS X',
        '2/X': 'İY 2 / MS X',
        '1/2': 'İY 1 / MS 2',
        'X/2': 'İY X / MS 2',
        '2/2': 'İY 2 / MS 2'
      };
      return { code, label: labels[code] || code, prob };
    })
    .sort((a, b) => b.prob - a.prob);

  // En yüksek 2 İY/MS tercihi
  const topHtFt = [htFtRanked[0], htFtRanked[1]];

  // 6. En Muhtemel Kesin Skorlar
  const topExactScores = scoreMatrix
    .sort((a, b) => b.prob - a.prob)
    .slice(0, 4)
    .map(s => ({ score: s.score, prob: Math.round(s.prob * 100) }));

  // 7. Korner ve Kart Beklentileri
  const expectedCorners = Number(((home.avgCorners + away.avgCorners) / 2 * (0.95 + (expHomeGoals + expAwayGoals) * 0.04)).toFixed(1));
  const expectedCards = Number(((home.avgCards + away.avgCards) / 2).toFixed(1));

  // 8. Karşılaştırmalı Güç Puanları (0 - 100)
  const homeAttackScore = Math.min(99, Math.round((home.avgGoalsScored / 2.8) * 60 + (home.shotsOnTargetAvg / 8) * 40));
  const awayAttackScore = Math.min(99, Math.round((away.avgGoalsScored / 2.8) * 60 + (away.shotsOnTargetAvg / 8) * 40));

  const homeDefenseScore = Math.min(99, Math.round((1 - (home.avgGoalsConceded / 2.5)) * 60 + home.cleanSheetRate * 40));
  const awayDefenseScore = Math.min(99, Math.round((1 - (away.avgGoalsConceded / 2.5)) * 60 + away.cleanSheetRate * 40));

  const homeHtImpactScore = Math.round(home.firstHalfGoalRate * 60 + home.firstHalfLeadingRate * 40);
  const awayHtImpactScore = Math.round(away.firstHalfGoalRate * 60 + away.firstHalfLeadingRate * 40);

  // 9. Ana Banko ve En Güçlü Tahmini Belirleme
  // Tüm piyasaları tarayıp en yüksek güven ve istatistiksel üstünlüğü olan seçeneği çıkar
  interface Candidate {
    label: string;
    market: string;
    confidence: number;
    badgeType: 'banko' | 'guclu' | 'surpriz';
    reason: string;
  }

  const candidates: Candidate[] = [];

  // MS 1 (Ev Sahibi Galibiyeti)
  if (ms1 >= 45 && ms1 >= ms2 + 8) {
    candidates.push({
      label: `MS 1 (${home.shortName || home.name})`,
      market: 'Maç Sonucu',
      confidence: ms1,
      badgeType: ms1 >= 68 ? 'banko' : 'guclu',
      reason: `${home.name} evinde net üstünlüğe ve yüksek kazanma olasılığına (%${ms1}) sahip.`
    });
  }

  // MS 2 (Deplasman Galibiyeti)
  if (ms2 >= 42 && ms2 >= ms1 + 6) {
    candidates.push({
      label: `MS 2 (${away.shortName || away.name})`,
      market: 'Maç Sonucu',
      confidence: ms2,
      badgeType: ms2 >= 66 ? 'banko' : 'guclu',
      reason: `${away.name} deplasmanda üstün hücum performansı ve form grafiğiyle öne çıkıyor (%${ms2}).`
    });
  }

  // 2.5 Gol Üst (Yüksek Tempolu Maçlar)
  if (over25 >= 50 && expectedTotalGoals >= 2.5) {
    candidates.push({
      label: '2.5 Gol Üst',
      market: 'Toplam Gol',
      confidence: over25,
      badgeType: over25 >= 66 ? 'banko' : 'guclu',
      reason: `İki takımın ${expectedTotalGoals} gol beklentisi (xG) ve tempolu hücum hatları 2.5 üstünü destekliyor.`
    });
  }

  // 2.5 Gol Alt (Kontrollü / Düşük Skorlu Maçlar)
  if (under25 >= 51 && expectedTotalGoals <= 2.35) {
    candidates.push({
      label: '2.5 Gol Alt',
      market: 'Toplam Gol',
      confidence: under25,
      badgeType: under25 >= 66 ? 'banko' : 'guclu',
      reason: `Katı savunma anlayışı ve ${expectedTotalGoals} düşük xG beklentisi sebebiyle az gollü bir maç öngörülüyor.`
    });
  }

  // KG Var (Karşılıklı Gol)
  if (bttsYes >= 52) {
    candidates.push({
      label: 'KG Var',
      market: 'Karşılıklı Gol',
      confidence: bttsYes,
      badgeType: bttsYes >= 66 ? 'banko' : 'guclu',
      reason: `İki takımın da hücum gücü yüksek, karşılıklı gol bulma olasılıkları %${bttsYes} seviyesinde.`
    });
  }

  // KG Yok
  if (bttsNo >= 54) {
    candidates.push({
      label: 'KG Yok',
      market: 'Karşılıklı Gol',
      confidence: bttsNo,
      badgeType: bttsNo >= 66 ? 'banko' : 'guclu',
      reason: `Savunma kurgusu ve gol kısırlığı nedeniyle en az bir ekibin gol atamayacağı öngörülüyor.`
    });
  }

  // Çifte Şans 1X (Ev Sahibi Kaybetmez)
  if (ms1 + msX >= 66 && ms1 >= 38) {
    candidates.push({
      label: 'ÇŞ 1X',
      market: 'Çifte Şans',
      confidence: Math.min(88, Math.round(ms1 + msX - 6)),
      badgeType: 'banko',
      reason: `${home.name} saha avantajıyla maçtan puan çıkarma ihtimali çok kuvvetli.`
    });
  }

  // Çifte Şans X2 (Deplasman Kaybetmez)
  if (ms2 + msX >= 64 && ms2 >= 34) {
    candidates.push({
      label: 'ÇŞ X2',
      market: 'Çifte Şans',
      confidence: Math.min(86, Math.round(ms2 + msX - 6)),
      badgeType: 'banko',
      reason: `${away.name} deplasmanda puan ya da galibiyet almaya daha yakın.`
    });
  }

  // En iyi İY/MS
  if (topHtFt[0] && topHtFt[0].prob >= 50) {
    candidates.push({
      label: topHtFt[0].label,
      market: 'İlk Yarı / Maç Sonucu',
      confidence: topHtFt[0].prob,
      badgeType: topHtFt[0].prob >= 60 ? 'guclu' : 'surpriz',
      reason: `İlk yarı dominasyonu doğrultusunda ${topHtFt[0].label} kombinasyonu değer taşıyor.`
    });
  }

  // Sırala ve en yüksek güvene sahip olanı ana banko yap
  candidates.sort((a, b) => b.confidence - a.confidence);
  
  const primaryPrediction: PrimaryPrediction = candidates[0] || {
    label: ms1 >= ms2 ? 'MS 1 (Ev Sahibi)' : 'MS X2 (Çifte Şans)',
    market: 'Genel Değerlendirme',
    confidence: Math.max(56, Math.round(Math.max(ms1, ms2) + 5)),
    badgeType: 'guclu',
    reason: 'İstatistiksel veriler dengeli ancak risk minimize edildiğinde en olası senaryodur.'
  };

  // -------------------------------------------------------------------------
  // 2. KASA / GÜVENLİ ALTERNATİF TERCİH (Ana Banko ile KESİNLİKLE aynı olamaz)
  // -------------------------------------------------------------------------
  const safeCandidates: PrimaryPrediction[] = [];

  // A. Çifte Şans 1X (Ev sahibi kaybetmez)
  if (ms1 + msX >= 65) {
    safeCandidates.push({
      label: 'Çifte Şans (1X)',
      market: 'Çifte Şans',
      confidence: Math.min(95, Math.round(ms1 + msX)),
      badgeType: 'banko',
      reason: `${home.name} takımının saha avantajıyla maçtan en az 1 puan alma olasılığı %${Math.round(ms1 + msX)} seviyesindedir.`
    });
  }

  // B. Çifte Şans X2 (Deplasman kaybetmez)
  if (ms2 + msX >= 65) {
    safeCandidates.push({
      label: 'Çifte Şans (X2)',
      market: 'Çifte Şans',
      confidence: Math.min(95, Math.round(ms2 + msX)),
      badgeType: 'banko',
      reason: `${away.name} ekibinin form üstünlüğüyle maçı kaybetmeme ihtimali %${Math.round(ms2 + msX)} civarındadır.`
    });
  }

  // C. 1.5 Gol Üst (Eğer Ana Banko 1.5 Gol Üst DEĞİLSE)
  if (over15 >= 70 && primaryPrediction.label !== '1.5 Gol Üst') {
    safeCandidates.push({
      label: '1.5 Gol Üst',
      market: 'Güvenli Gol Barajı',
      confidence: over15,
      badgeType: 'banko',
      reason: 'Maçın en az 2 golle sonuçlanma ihtimali yüksek; kombine kuponlar için en emniyetli liman.'
    });
  }

  // D. İlk Yarı 0.5 Gol Üst
  const htGoalProb = Math.min(94, Math.round((1 - (h1Probs[0] * a1Probs[0])) * 100));
  if (htGoalProb >= 70) {
    safeCandidates.push({
      label: 'İY 0.5 Gol Üst',
      market: 'İlk Yarı Gol',
      confidence: htGoalProb,
      badgeType: 'banko',
      reason: `İlk 45 dakikada en az 1 gol çıkma olasılığı %${htGoalProb} olarak oldukça güçlüdür.`
    });
  }

  // E. Ev Sahibi 0.5 Gol Üst
  const homeScoresProb = Math.min(95, Math.round((1 - homeProbs[0]) * 100));
  if (homeScoresProb >= 78) {
    safeCandidates.push({
      label: `${home.shortName} 0.5 Gol Üst`,
      market: 'Takım Golü',
      confidence: homeScoresProb,
      badgeType: 'banko',
      reason: `${home.name} ekibinin seyircisi önünde en az 1 gol bulma olasılığı %${homeScoresProb} seviyesindedir.`
    });
  }

  // F. 3.5 Gol Alt
  if (under35 >= 68) {
    safeCandidates.push({
      label: '3.5 Gol Alt',
      market: 'Güvenli Gol Sınırı',
      confidence: under35,
      badgeType: 'banko',
      reason: 'Savunma ağırlıklı dengeli oyunda maçın 4 golün altında kalma ihtimali çok kuvvetlidir.'
    });
  }

  // Ana Banko ile aynı etikete sahip olanları kesinlikle çıkar
  const validSafeCandidates = safeCandidates.filter(c => c.label !== primaryPrediction.label);
  validSafeCandidates.sort((a, b) => b.confidence - a.confidence);

  const safePrediction: PrimaryPrediction = validSafeCandidates[0] || {
    label: primaryPrediction.label.includes('1.5') ? 'Çifte Şans (1X)' : '1.5 Gol Üst',
    market: 'Alternatif Kasa',
    confidence: Math.max(76, Math.min(92, over15)),
    badgeType: 'banko',
    reason: 'Kombine kuponlarda riski minimize eden, yüksek tutma ihtimalli güvenli alternatif.'
  };

  // --------------------------------------------------------------------------------
  // 3. DEĞER / SÜRPRİZ TERCİH (Ana Banko ve Kasa Tercihinden KESİNLİKLE farklı olmalı)
  // --------------------------------------------------------------------------------
  const surpriseCandidates: PrimaryPrediction[] = [];

  // A. Yüksek çarpanlı İY/MS
  if (topHtFt[0] && topHtFt[0].prob >= 22) {
    surpriseCandidates.push({
      label: `${topHtFt[0].label}`,
      market: 'İlk Yarı / Maç Sonucu',
      confidence: topHtFt[0].prob,
      badgeType: 'surpriz',
      reason: 'Taktiksel ilk yarı direnci ve ikinci yarıdaki maç çözülmesi senaryosunda yüksek çarpanlı değer taşıyor.'
    });
  }

  // B. Beraberlik (MS X)
  if (msX >= 27) {
    surpriseCandidates.push({
      label: 'MS X (Beraberlik)',
      market: 'Maç Sonucu',
      confidence: msX,
      badgeType: 'surpriz',
      reason: 'İki takımın güç dengesi birbirini kilitlemeye son derece müsait; cazip oran fırsatı.'
    });
  }

  // C. 2.5 Üst & KG Var Kombini
  if (over25 >= 50 && bttsYes >= 50) {
    const comboProb = Math.round((over25 * bttsYes) / 100);
    surpriseCandidates.push({
      label: '2.5 Üst & KG Var',
      market: 'Kombine Bahis',
      confidence: Math.max(25, comboProb),
      badgeType: 'surpriz',
      reason: 'Açık futbol yapısı ve karşılıklı gol beklentisiyle yüksek oran vadeden değer kombini.'
    });
  }

  // D. Doğru Skor
  if (topExactScores[0]) {
    surpriseCandidates.push({
      label: `${topExactScores[0].score} Skor Tahmini`,
      market: 'Doğru Skor',
      confidence: Math.max(16, topExactScores[0].prob),
      badgeType: 'surpriz',
      reason: 'Poisson simülasyon matrisinde en yüksek frekansla tekrarlanan nihai skor senaryosu.'
    });
  }

  // Hem Ana Banko'dan hem de Kasa Tercihinden FARKLI olan sürpriz adayı seç
  const validSurpriseCandidates = surpriseCandidates.filter(
    c => c.label !== primaryPrediction.label && c.label !== safePrediction.label
  );

  const surprisePrediction: PrimaryPrediction = validSurpriseCandidates[0] || {
    label: `${topExactScores[0]?.score || '2-1'} Skor Tahmini`,
    market: 'Doğru Skor',
    confidence: topExactScores[0]?.prob || 18,
    badgeType: 'surpriz',
    reason: 'Yüksek kazanç katsayısı sunan istatistiksel sürpriz değer seçeneği.'
  };

  // Taktiksel ve Anlaşılır Rapor Kırılımı
  const tacticalBreakdown = {
    overview: `${home.name} evinde %${homeFormScore} form katsayısıyla sahaya çıkarken, ${away.name} deplasmanlarda %${awayFormScore} direnç seviyesinde. Karşılaşmada ${ms1 > ms2 ? home.name + ' oyun inisiyatifini elinde tutan taraf' : ms2 > ms1 ? away.name + ' geçiş hücumlarıyla etkili olan taraf' : 'her iki takım dengeli güç mücadelesi'} sergileyecektir.`,
    attackVsDefense: `Ev sahibi hücum gücü ${homeAttackScore}/100, deplasman hücum gücü ${awayAttackScore}/100. Poisson xG beklentisi ${home.name} için ${expHomeGoals.toFixed(2)} gol, ${away.name} için ${expAwayGoals.toFixed(2)} gol olarak hesaplanmıştır (Toplam: ${expectedTotalGoals} gol).`,
    tempoTempo: `${home.name} ilk yarılarda %${Math.round(home.firstHalfGoalRate * 100)} oranında gol bulurken, ${away.name} ilk yarılarda %${Math.round(away.firstHalfGoalRate * 100)} gol potansiyeline sahip. ${expectedTotalGoals >= 2.7 ? 'Maçın erken dakikalardan itibaren yüksek tempolu ve açık geçmesi' : 'İlk 45 dakikanın kontrollü taktiksel satranç şeklinde geçmesi'} bekleniyor.`,
    keyRisk: `${expectedCards >= 4.5 ? 'Hakem ve takımların sertlik seviyesi nedeniyle kart sayısı yüksek olabilir; duran top fırsatlarına dikkat edilmeli.' : expectedCorners >= 9.5 ? 'Kanat akınlarının yoğunluğuyla korner sayısı 10 bandını aşabilir.' : 'Savunma bloklarının disiplinli kalması gol sayısını sınırlandırabilir.'}`
  };

  // 10. Otomatik AI Maç Yorumu (2-3 analitik cümle)
  let aiComment = '';
  if (ms1 > 58) {
    aiComment = `${home.name}, evinde yakaladığı %${Math.round(home.firstHalfGoalRate * 100)}'lik ilk yarı skor üretme hızı ve %${homeFormScore} form endeksiyle maça ağırlığını koyacaktır. `;
  } else if (ms2 > 52) {
    aiComment = `${away.name}, deplasmandaki maç başı ${away.avgGoalsScored} gol ortalaması ve ${away.shotsOnTargetAvg} isabetli şut temposuyla rakip savunmayı zor durumda bırakacaktır. `;
  } else {
    aiComment = `İki ekibin de dengeli form puanları (${homeFormScore} vs ${awayFormScore}) ve savunma disiplinleri, maçın taktiksel bir satranç şeklinde geçeceğini gösteriyor. `;
  }

  if (over25 >= 60) {
    aiComment += `Toplam ${expectedTotalGoals} beklenen gol eşiği ve zayıf savunma dirençleri göz önüne alındığında 2.5 Üst ve KG Var ihtimalleri fazlasıyla öne çıkıyor. `;
  } else if (under25 >= 60) {
    aiComment += `Düşük gol beklentisi (${expectedTotalGoals}) ve takımların kontrollü geçiş oyunu tercihi maçı 2.5 Alt çizgisine çekiyor. `;
  } else {
    aiComment += `Karşılaşmada ilk yarının çözülüş senaryosuna göre ${topHtFt[0].label} ve 1.5 Üst seçenekleri en makul istatistiksel fırsatı sunuyor. `;
  }

  aiComment += `Modelimize göre maçın en sağlam tercihi %${primaryPrediction.confidence} güven endeksiyle "${primaryPrediction.label}".`;

  return {
    matchId,
    ms1,
    msX,
    ms2,
    over15,
    under15,
    over25,
    under25,
    over35,
    under35,
    bttsYes,
    bttsNo,
    htFtRanked,
    topHtFt,
    expectedHomeGoals: Number(expHomeGoals.toFixed(2)),
    expectedAwayGoals: Number(expAwayGoals.toFixed(2)),
    expectedTotalGoals,
    expectedCorners,
    expectedCards,
    topExactScores,
    homeAttackScore,
    awayAttackScore,
    homeDefenseScore,
    awayDefenseScore,
    homeHtImpactScore,
    awayHtImpactScore,
    primaryPrediction,
    safePrediction,
    surprisePrediction,
    tacticalBreakdown,
    aiComment
  };
}

/**
 * Monte Carlo Maç Simülasyonu (Poisson bazlı 1.000 iterasyon)
 */
export interface MonteCarloResult {
  iterations: number;
  homeWins: number;
  draws: number;
  awayWins: number;
  homeWinPct: number;
  drawPct: number;
  awayWinPct: number;
  over25Count: number;
  over25Pct: number;
  bttsCount: number;
  bttsPct: number;
  avgTotalGoals: number;
  scoreFrequency: { score: string; count: number; pct: number }[];
}

export function runMonteCarloSimulation(
  lambdaHome: number,
  lambdaAway: number,
  iterations: number = 1000
): MonteCarloResult {
  let homeWins = 0;
  let draws = 0;
  let awayWins = 0;
  let over25Count = 0;
  let bttsCount = 0;
  let totalGoalsSum = 0;
  const scoreMap: Record<string, number> = {};

  // Knuth's algorithm for Poisson random number generation
  const samplePoisson = (lambda: number): number => {
    const L = Math.exp(-lambda);
    let k = 0;
    let p = 1.0;
    do {
      k++;
      p *= Math.random();
    } while (p > L);
    return k - 1;
  };

  for (let i = 0; i < iterations; i++) {
    const gHome = samplePoisson(lambdaHome);
    const gAway = samplePoisson(lambdaAway);
    const tot = gHome + gAway;
    totalGoalsSum += tot;

    if (gHome > gAway) homeWins++;
    else if (gHome === gAway) draws++;
    else awayWins++;

    if (tot > 2.5) over25Count++;
    if (gHome > 0 && gAway > 0) bttsCount++;

    const key = `${gHome}-${gAway}`;
    scoreMap[key] = (scoreMap[key] || 0) + 1;
  }

  const scoreFrequency = Object.entries(scoreMap)
    .map(([score, count]) => ({
      score,
      count,
      pct: Number(((count / iterations) * 100).toFixed(1))
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    iterations,
    homeWins,
    draws,
    awayWins,
    homeWinPct: Math.round((homeWins / iterations) * 100),
    drawPct: Math.round((draws / iterations) * 100),
    awayWinPct: Math.round((awayWins / iterations) * 100),
    over25Count,
    over25Pct: Math.round((over25Count / iterations) * 100),
    bttsCount,
    bttsPct: Math.round((bttsCount / iterations) * 100),
    avgTotalGoals: Number((totalGoalsSum / iterations).toFixed(2)),
    scoreFrequency
  };
}

/**
 * Yüzdelik olasılığı Saf Matematiksel Adil Orana (Fair Odds) çevirir
 * Örn: %75 -> 1.33, %50 -> 2.00, %30 -> 3.33
 */
export function toFairOdds(probPercentage: number): string {
  if (probPercentage <= 0) return '99.00';
  const odds = 100 / probPercentage;
  return odds.toFixed(2);
}

export interface CompoundProbabilityItem {
  matchName: string;
  predictionLabel: string;
  confidence: number; // 0 - 100
}

export interface CompoundProbabilityResult {
  totalJointProbability: number; // e.g. 41.2%
  fairOddsEquivalent: string; // e.g. 2.43
  weakestLink: CompoundProbabilityItem | null;
  strongestLink: CompoundProbabilityItem | null;
  riskRating: 'Düşük Risk' | 'Dengeli' | 'Yüksek Risk' | 'Ekstrem Risk';
  summaryComment: string;
}

/**
 * Bağımsız olasılık teorisi ile seçilen maçların bileşik gerçekleşme ihtimalini hesaplar
 * P(A ∩ B ∩ C) = P(A) * P(B) * P(C)
 */
export function calculateCompoundProbability(items: CompoundProbabilityItem[]): CompoundProbabilityResult {
  if (!items || items.length === 0) {
    return {
      totalJointProbability: 0,
      fairOddsEquivalent: '1.00',
      weakestLink: null,
      strongestLink: null,
      riskRating: 'Dengeli',
      summaryComment: 'Hesaplama için en az 1 maç seçiniz.'
    };
  }

  // Bağımsız olasılıkların çarpımı: (P1 / 100) * (P2 / 100) * ...
  let jointProb = 1.0;
  let minItem = items[0];
  let maxItem = items[0];

  items.forEach(item => {
    const p = Math.max(0.05, Math.min(0.99, item.confidence / 100));
    jointProb *= p;
    if (item.confidence < minItem.confidence) minItem = item;
    if (item.confidence > maxItem.confidence) maxItem = item;
  });

  const finalPercentage = Number((jointProb * 100).toFixed(1));
  const fairOdds = toFairOdds(finalPercentage);

  let riskRating: 'Düşük Risk' | 'Dengeli' | 'Yüksek Risk' | 'Ekstrem Risk' = 'Dengeli';
  if (finalPercentage >= 55) riskRating = 'Düşük Risk';
  else if (finalPercentage >= 35) riskRating = 'Dengeli';
  else if (finalPercentage >= 15) riskRating = 'Yüksek Risk';
  else riskRating = 'Ekstrem Risk';

  let summaryComment = '';
  if (items.length === 1) {
    summaryComment = `Tek maçlık analiz: %${finalPercentage} matematiksel ihtimal.`;
  } else if (finalPercentage >= 50) {
    summaryComment = `Güçlü bileşik güven: ${items.length} karşılaşmanın ortak Poisson olasılığı %${finalPercentage}.`;
  } else if (finalPercentage >= 30) {
    summaryComment = `Dengeli istatistiksel kombinasyon: En zayıf halka "${minItem.matchName}" (%${minItem.confidence}).`;
  } else {
    summaryComment = `Varyansı yüksek: ${items.length} bağımsız maçın birlikte gerçekleşmesi istatistiksel olarak zordur (%${finalPercentage}).`;
  }

  return {
    totalJointProbability: finalPercentage,
    fairOddsEquivalent: fairOdds,
    weakestLink: minItem,
    strongestLink: maxItem,
    riskRating,
    summaryComment
  };
}



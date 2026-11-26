// src/utils/stockAnalysisEngine.ts
import {
  IndicatorSignalRow,
  StockDeepAnalysis,
  StockItem,
  StockPortfolioPosition,
  StockQuantAnalysis,
  StockSignalType,
  TavanPotentialResult,
  TavanCategoryType,
  TavanStreakInfo,
  TavanStreakTargetStep,
} from '../types/stocks';

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

export function formatStockPrice(price: number, currency = 'TRY'): string {
  if (!Number.isFinite(price)) return '-';
  const sym = currency === 'TRY' ? '₺' : currency === 'USD' ? '$' : '';
  if (price >= 1000) {
    return `${price.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${sym}`.trim();
  }
  if (price >= 1) {
    return `${price.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${sym}`.trim();
  }
  return `${price.toPrecision(4)} ${sym}`.trim();
}

export function formatLargeNumber(num: number | null, currency = 'TRY'): string {
  if (num === null || !Number.isFinite(num) || num === 0) return '-';
  const sym = currency === 'TRY' ? '₺' : '$';
  if (num >= 1e12) return `${(num / 1e12).toFixed(2)} Tn ${sym}`;
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)} Mr ${sym}`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)} Mn ${sym}`;
  return `${num.toLocaleString('tr-TR')} ${sym}`;
}

export interface StockAnalysisOptions {
  sessionPhase?: 'in_session' | 'post_market' | 'pre_market' | 'call_auction' | 'weekend';
  sectorLeader?: { symbol: string; changePct: number; sector: string };
  hasKapCatalyst?: boolean;
  kapCatalystSummary?: string;
}

export function analyzeStockQuant(
  stock: StockItem,
  options?: StockAnalysisOptions
): StockQuantAnalysis {
  const price = stock.close || 1;
  const bullReasons: string[] = [];
  const bearReasons: string[] = [];
  const indicators: IndicatorSignalRow[] = [];

  // --- 1. TREND SCORE (EMA20, EMA50, EMA200, ADX) ---
  let trendScore = 50;
  if (stock.ema20 !== null) {
    const above20 = price > stock.ema20;
    trendScore += above20 ? 10 : -10;
    indicators.push({
      name: 'EMA (20)',
      value: formatStockPrice(stock.ema20, ''),
      action: above20 ? 'AL' : 'SAT',
      note: above20 ? 'Fiyat kısa vade ortalamanın üzerinde' : 'Fiyat EMA20 altında baskıda',
    });
  }
  if (stock.ema50 !== null) {
    const above50 = price > stock.ema50;
    trendScore += above50 ? 12 : -12;
    indicators.push({
      name: 'EMA (50)',
      value: formatStockPrice(stock.ema50, ''),
      action: above50 ? 'AL' : 'SAT',
      note: above50 ? 'Orta vade yükseliş trendi korunuyor' : 'Orta vade trend zayıf',
    });
  }
  if (stock.ema200 !== null) {
    const above200 = price > stock.ema200;
    trendScore += above200 ? 14 : -14;
    indicators.push({
      name: 'EMA (200)',
      value: formatStockPrice(stock.ema200, ''),
      action: above200 ? 'AL' : 'SAT',
      note: above200 ? 'Ana boğa bölgesi (EMA200 üstü)' : 'Uzun vade ortalamanın altında',
    });
    if (above200 && stock.ema50 && stock.ema50 > stock.ema200) {
      trendScore += 8;
      bullReasons.push('Golden Cross dizilimi aktif (EMA50 > EMA200, fiyat ortalamaların üstünde)');
    } else if (!above200 && stock.ema50 && stock.ema50 < stock.ema200) {
      bearReasons.push('Orta/uzun vade ortalamalar düşüş diziliminde (EMA50 < EMA200)');
    }
  }
  if (stock.adx !== null) {
    const strongTrend = stock.adx >= 25;
    if (strongTrend && trendScore > 55) {
      trendScore += 6;
      bullReasons.push(`Güçlü trend teyidi (ADX: ${stock.adx.toFixed(1)})`);
    } else if (strongTrend && trendScore < 45) {
      trendScore -= 6;
      bearReasons.push(`Güçlü düşüş momentumu (ADX: ${stock.adx.toFixed(1)})`);
    }
    indicators.push({
      name: 'ADX (14)',
      value: stock.adx.toFixed(1),
      action: strongTrend ? (trendScore >= 50 ? 'AL' : 'SAT') : 'NÖTR',
      note: strongTrend ? 'Belirgin trend gücü' : 'Yatay / zayıf trend',
    });
  }
  trendScore = clamp(Math.round(trendScore));

  // --- 2. MOMENTUM & OSCILLATOR SCORE (RSI, MACD, Stochastic, Bollinger) ---
  let momentumScore = 50;
  if (stock.rsi !== null) {
    let rsiAction: 'AL' | 'NÖTR' | 'SAT' = 'NÖTR';
    let rsiNote = 'Dengeli bölge';
    if (stock.rsi <= 32) {
      momentumScore += 18;
      rsiAction = 'AL';
      rsiNote = 'Aşırı satım (tepki bölgesi)';
      bullReasons.push(`RSI (${stock.rsi.toFixed(1)}) aşırı satım dip bölgesinde, tepki potansiyeli yüksek`);
    } else if (stock.rsi > 32 && stock.rsi <= 65) {
      if (stock.rsi >= 48) {
        momentumScore += 10;
        rsiAction = 'AL';
        rsiNote = 'Sağlıklı alıcı momentumu';
      }
    } else if (stock.rsi > 74) {
      momentumScore -= 15;
      rsiAction = 'SAT';
      rsiNote = 'Aşırı alım / kâr realizasyonu riski';
      bearReasons.push(`RSI (${stock.rsi.toFixed(1)}) aşırı alım bölgesinde, düzeltme riski artmış`);
    }
    indicators.push({
      name: 'RSI (14)',
      value: stock.rsi.toFixed(1),
      action: rsiAction,
      note: rsiNote,
    });
  }

  if (stock.macd !== null && stock.macdSignal !== null) {
    const macdBull = stock.macd > stock.macdSignal;
    momentumScore += macdBull ? 14 : -12;
    if (macdBull) {
      bullReasons.push('MACD çizgisi Sinyal çizgisinin üzerinde pozitif kesişimde');
    } else {
      bearReasons.push('MACD Sinyal çizgisinin altında negatif bölgede');
    }
    indicators.push({
      name: 'MACD (12,26)',
      value: stock.macd.toFixed(2),
      action: macdBull ? 'AL' : 'SAT',
      note: macdBull ? 'Pozitif momentum' : 'Negatif momentum',
    });
  }

  if (stock.stochK !== null && stock.stochD !== null) {
    let stAction: 'AL' | 'NÖTR' | 'SAT' = 'NÖTR';
    if (stock.stochK < 25 && stock.stochK > stock.stochD) {
      momentumScore += 10;
      stAction = 'AL';
    } else if (stock.stochK > 80 && stock.stochK < stock.stochD) {
      momentumScore -= 10;
      stAction = 'SAT';
    }
    indicators.push({
      name: 'Stochastic %K',
      value: stock.stochK.toFixed(1),
      action: stAction,
      note: `Sinyal %D: ${stock.stochD.toFixed(1)}`,
    });
  }

  if (stock.bbLower !== null && stock.bbUpper !== null) {
    let bbAction: 'AL' | 'NÖTR' | 'SAT' = 'NÖTR';
    let bbNote = 'Bant orta bölgesi';
    if (price <= stock.bbLower * 1.015) {
      momentumScore += 10;
      bbAction = 'AL';
      bbNote = 'Alt Bollinger desteğine yakın';
      bullReasons.push('Fiyat Alt Bollinger bandı destek seviyesinde');
    } else if (price >= stock.bbUpper * 0.99) {
      momentumScore -= 8;
      bbAction = 'SAT';
      bbNote = 'Üst Bollinger direncine dayandı';
    }
    indicators.push({
      name: 'Bollinger (20,2)',
      value: `${formatStockPrice(stock.bbLower, '')} - ${formatStockPrice(stock.bbUpper, '')}`,
      action: bbAction,
      note: bbNote,
    });
  }

  if (stock.tvRecommendAll !== null) {
    momentumScore += stock.tvRecommendAll * 16;
  }
  momentumScore = clamp(Math.round(momentumScore));

  // --- 3. FUNDAMENTAL SCORE (F/K, PD/DD, ROE, Borç/Özsermaye, Temettü) ---
  let fundamentalScore = 55;
  let hasFundamentals = false;
  if (stock.pe !== null && stock.pe > 0) {
    hasFundamentals = true;
    const goodPe = stock.market === 'bist' ? 10 : 24;
    const highPe = stock.market === 'bist' ? 25 : 48;
    if (stock.pe <= goodPe) {
      fundamentalScore += 15;
      bullReasons.push(`Cazip F/K çarpanı (${stock.pe.toFixed(2)}x) ile ucuz değerleme`);
    } else if (stock.pe >= highPe) {
      fundamentalScore -= 10;
      bearReasons.push(`Yüksek F/K oranı (${stock.pe.toFixed(1)}x) primli fiyatlamaya işaret ediyor`);
    }
  } else if (stock.pe !== null && stock.pe < 0) {
    hasFundamentals = true;
    fundamentalScore -= 14;
    bearReasons.push('Negatif son dönem kârlılığı (zarar)');
  }

  if (stock.pb !== null && stock.pb > 0) {
    hasFundamentals = true;
    if (stock.pb <= (stock.market === 'bist' ? 1.8 : 4)) {
      fundamentalScore += 10;
      bullReasons.push(`Makul PD/DD oranı (${stock.pb.toFixed(2)}x)`);
    } else if (stock.pb >= (stock.market === 'bist' ? 6 : 15)) {
      fundamentalScore -= 8;
    }
  }

  if (stock.roe !== null) {
    hasFundamentals = true;
    if (stock.roe >= 22) {
      fundamentalScore += 14;
      bullReasons.push(`Güçlü Özsermaye Kârlılığı (ROE: %${stock.roe.toFixed(1)})`);
    } else if (stock.roe < 5) {
      fundamentalScore -= 10;
    }
  }

  if (stock.dividendYield !== null && stock.dividendYield >= 2.5) {
    hasFundamentals = true;
    fundamentalScore += 7;
    bullReasons.push(`Yüksek temettü verimi (%${stock.dividendYield.toFixed(2)})`);
  }

  if (stock.debtToEquity !== null && stock.debtToEquity > 2.2) {
    fundamentalScore -= 8;
    bearReasons.push(`Borç/Özsermaye oranı yüksek (${stock.debtToEquity.toFixed(2)}x)`);
  }

  fundamentalScore = hasFundamentals ? clamp(Math.round(fundamentalScore)) : 50;

  // --- 4. COMPOSITE QUANT SCORE & SIGNAL HARMONIZATION ---
  let score = clamp(
    Math.round(
      stock.market === 'crypto'
        ? trendScore * 0.5 + momentumScore * 0.5
        : trendScore * 0.4 + momentumScore * 0.35 + fundamentalScore * 0.25
    )
  );

  // 🛡️ ÖNCÜ SİNYAL vs. GEÇ KALINMIŞ SİNYAL AYRIMI:
  // Fiyat zaten +%5.5 ve üstü uçmuşsa, yatırımcıya YENİ ALIM yaptırmak tepeyi satın alma riski doğurur!
  // 1. Öncü Sinyal (Erken Evre): Hisse henüz +%0 ile +%4.5 arasındayken dip dönüşü veya sıkışma kırılımı yapıyorsa gerçek GÜÇLÜ AL / AL üretilir.
  // 2. İleri Evre (+%5.5 ve üstü): Eğer hisse zaten tavan koşusundaysa sinyal zorlanmaz; tradePlan bias'ı "POZİSYONU KORU (TAVANI İZLE)" olarak ayarlanır.
  const isLateSurge = (stock.changePct || 0) >= 5.5;
  const isEarlyBreakout = (stock.changePct || 0) >= 0.8 && (stock.changePct || 0) < 5.5;

  if (isEarlyBreakout) {
    bullReasons.unshift(`🎯 Erken Kırılım İvmesi: Fiyat kontrollü primle (+%${(stock.changePct || 0).toFixed(2)}) erken alım bölgesinde.`);
  } else if (isLateSurge) {
    bearReasons.unshift(`⚠️ İleri Aşama Prim (+%${(stock.changePct || 0).toFixed(2)}): Fiyat tavan marjına yakın. Yeni alım riski yüksektir; mevcut pozisyonlar izleyen stopla korunmalıdır.`);
  }

  // Overbought & Top Reversal Guard
  const isOverbought = Boolean(
    (stock.rsi !== null && stock.rsi >= 75) ||
    (stock.bbUpper !== null && price >= stock.bbUpper * 1.02)
  );

  if (isOverbought && score >= 60) {
    bearReasons.push('Fiyat aşırı alım / direnç tavanında. Yeni pozisyon açmak yerine kâr realizasyonu veya düzeltme beklenmeli.');
  }

  // 1. Tavan potansiyelini önceden hesapla
  const tavanPotential = calculateTavanPotential(stock, {
    rawScore: score,
    rawSignal: score >= 76 ? 'GÜÇLÜ AL' : score >= 64 ? 'AL' : score <= 38 ? 'SAT' : 'TUT',
    trendScore,
    sessionPhase: options?.sessionPhase,
    sectorLeader: options?.sectorLeader,
    hasKapCatalyst: options?.hasKapCatalyst,
    kapCatalystSummary: options?.kapCatalystSummary,
  });

  // 🛡️ MUTLAK SİNYAL TUTARLILIĞI:
  // Bir hisse "Tavan Adayı" ise, sistemin ona "SAT" veya "TUT" demesi TAM BİR ÇELİŞKİDİR!
  // Tavan adayı olan hisse doğrudan alım yönlü (GÜÇLÜ AL veya AL) olmak zorundadır!
  let signal: StockSignalType = 'TUT';
  if (tavanPotential.isCandidate && !tavanPotential.isAlreadyCeiling) {
    signal = tavanPotential.score >= 80 ? 'GÜÇLÜ AL' : 'AL';
    score = Math.max(score, tavanPotential.score >= 80 ? 84 : 74);
    bullReasons.unshift(`🎯 ${tavanPotential.categoryLabel}: Tavan potansiyeli (%${tavanPotential.score}) ile kurumsal alım bölgesine girdi.`);
  } else if (tavanPotential.isAlreadyCeiling) {
    signal = 'TUT'; // Tavan marjına kilitlenmiş hisse pozisyonu koruyarak izlenir
  } else if (score >= 76 && !isOverbought && !isLateSurge) {
    signal = 'GÜÇLÜ AL';
  } else if (score >= 64 && !isOverbought && !isLateSurge) {
    signal = 'AL';
  } else if (isLateSurge && score >= 64) {
    signal = 'TUT'; // Uçmuş hissede yeni AL yok, TUT ve izle!
  } else if (score <= 26) {
    signal = 'GÜÇLÜ SAT';
  } else if (score <= 38) {
    signal = 'SAT';
  } else {
    signal = 'TUT'; // Healthy neutral/hold range (39 - 63)
  }

  // --- 5. PIVOTS, FIBONACCI & ATR RISK/REWARD TRADE PLAN ---
  const highDay = stock.high || price * 1.015;
  const lowDay = stock.low || price * 0.985;
  const pivot = (highDay + lowDay + price) / 3;
  const r1 = 2 * pivot - lowDay;
  const s1 = 2 * pivot - highDay;
  const r2 = pivot + (highDay - lowDay);
  const s2 = pivot - (highDay - lowDay);

  const fib382 =
    stock.high52W && stock.low52W
      ? stock.high52W - (stock.high52W - stock.low52W) * 0.382
      : null;
  const fib618 =
    stock.high52W && stock.low52W
      ? stock.high52W - (stock.high52W - stock.low52W) * 0.618
      : null;

  const atr = stock.atr && stock.atr > 0 ? stock.atr : price * 0.025;
  const atrPct = (atr / price) * 100;
  const riskLevel: StockQuantAnalysis['riskLevel'] =
    atrPct >= 4.2 ? 'YÜKSEK' : atrPct >= 2.1 ? 'ORTA' : 'DÜŞÜK';

  const isBullBias = signal === 'GÜÇLÜ AL' || signal === 'AL';
  const isBearBias = signal === 'SAT' || signal === 'GÜÇLÜ SAT';

  const entryLow = Number((price - atr * 0.35).toFixed(price < 1 ? 5 : 2));
  const entryHigh = Number((price + atr * 0.2).toFixed(price < 1 ? 5 : 2));

  const stopLoss = isBearBias
    ? Number((price + atr * 1.7).toFixed(price < 1 ? 5 : 2))
    : Number(Math.max(price * 0.75, price - atr * 1.7).toFixed(price < 1 ? 5 : 2));

  const tp1 = isBearBias
    ? Number((price - atr * 2.2).toFixed(price < 1 ? 5 : 2))
    : Number((price + atr * 2.4).toFixed(price < 1 ? 5 : 2));

  const tp2 = isBearBias
    ? Number((price - atr * 3.8).toFixed(price < 1 ? 5 : 2))
    : Number((price + atr * 4.2).toFixed(price < 1 ? 5 : 2));

  const stopLossPct = Number((((stopLoss - price) / price) * 100).toFixed(2));
  const tp1Pct = Number((((tp1 - price) / price) * 100).toFixed(2));
  const tp2Pct = Number((((tp2 - price) / price) * 100).toFixed(2));
  const riskReward = Number(
    (Math.abs(tp2 - price) / Math.max(0.00001, Math.abs(price - stopLoss))).toFixed(2)
  );

  if (bullReasons.length === 0) {
    bullReasons.push('Fiyat kısa/orta vade destek seviyelerine yakın dengeleniyor');
  }
  if (bearReasons.length === 0) {
    bearReasons.push('Kısa vadede belirgin aşırı satım/direnç kırılım riski görülmüyor');
  }

  const summaryText = tavanPotential.isCandidate && !tavanPotential.isAlreadyCeiling
    ? `${stock.symbol}, ${tavanPotential.categoryLabel} olarak tespit edildi. Sistem tavan potansiyeli (%${tavanPotential.score}) doğrultusunda ${formatStockPrice(tavanPotential.targetCeilingPrice, stock.currency)} tavan hedefiyle (${signal}) yönünde pozisyonlanmaktadır.`
    : isBullBias
    ? `${stock.symbol}, Trend (%${trendScore}) ve Momentum (%${momentumScore}) uyumuyla kurumsal alım bölgesinde. ${formatStockPrice(stopLoss, stock.currency)} zarar-kes korunarak ${formatStockPrice(tp1, stock.currency)} ve ${formatStockPrice(tp2, stock.currency)} hedefleri takip edilebilir.`
    : isBearBias
    ? `${stock.symbol}, teknik göstergelerde (${signal}) zayıflama veya aşırı alım baskısı taşıyor. Pozisyon yönetimi için ${formatStockPrice(s1, stock.currency)} desteği kritik eşik konumunda.`
    : `${stock.symbol} şu anda kararsız / yatay denge bölgesinde (Nötr). Yön teyidi için ${formatStockPrice(r1, stock.currency)} direnci üstü kırılım veya ${formatStockPrice(s1, stock.currency)} desteği tepkisi beklenmelidir.`;

  return {
    symbol: stock.symbol,
    signal,
    score,
    trendScore,
    momentumScore,
    fundamentalScore,
    riskLevel,
    tradePlan: {
      bias: isLateSurge
        ? 'POZİSYONU KORU (TAVANI İZLE)'
        : isBullBias
        ? 'LONG (AL)'
        : isBearBias
        ? 'SHORT / KAR AL'
        : 'BEKLE',
      entryLow,
      entryHigh,
      stopLoss,
      stopLossPct,
      tp1,
      tp1Pct,
      tp2,
      tp2Pct,
      riskReward,
    },
    pivots: {
      s2: Number(s2.toFixed(price < 1 ? 5 : 2)),
      s1: Number(s1.toFixed(price < 1 ? 5 : 2)),
      pivot: Number(pivot.toFixed(price < 1 ? 5 : 2)),
      r1: Number(r1.toFixed(price < 1 ? 5 : 2)),
      r2: Number(r2.toFixed(price < 1 ? 5 : 2)),
      fib382: fib382 ? Number(fib382.toFixed(2)) : null,
      fib618: fib618 ? Number(fib618.toFixed(2)) : null,
    },
    indicators,
    bullReasons,
    bearReasons,
    summaryText,
    tavanPotential,
  };
}

export interface TavanQuantContext {
  rawScore?: number;
  rawSignal?: StockSignalType;
  trendScore?: number;
  sessionPhase?: 'in_session' | 'post_market' | 'pre_market' | 'call_auction' | 'weekend';
  sectorLeader?: { symbol: string; changePct: number; sector: string };
  hasKapCatalyst?: boolean;
  kapCatalystSummary?: string;
}

export function computeTavanStreakInfo(
  stock: StockItem,
  price: number,
  changePct: number,
  isAlreadyCeiling: boolean
): TavanStreakInfo {
  // 1. Determine currentStreak
  let currentStreak = 0;
  const perfW = stock.perfW || 0;
  const perf1M = stock.perf1M || 0;

  if (changePct >= 9.4) {
    if (perfW >= 28 || perf1M >= 50) {
      currentStreak = 3;
    } else if (perfW >= 17 || perf1M >= 22) {
      currentStreak = 2;
    } else {
      currentStreak = 1;
    }
  } else if (perfW >= 18 && changePct >= 2.5) {
    currentStreak = Math.min(3, Math.max(1, Math.round(perfW / 10)));
  }

  let streakStage: TavanStreakInfo['streakStage'] = 'ERKEN_ADAY';
  let streakStageLabel = '🌱 Tavan Serisi Başlangıç Adayı';

  if (currentStreak >= 3) {
    streakStage = 'MEGA_SERI';
    streakStageLabel = '🚀 3. Tavan+ (Mega Seri Koşusu)';
  } else if (currentStreak === 2) {
    streakStage = 'IVME_TEYIDI';
    streakStageLabel = '🔥 2. Tavan (İvme Teyidi & Devam)';
  } else if (currentStreak === 1) {
    streakStage = 'KOPUS_TAVANI';
    streakStageLabel = '🎯 1. Tavan (Taze Kopuş Evresi)';
  }

  // Base price calculation before the streak
  let basePrice = price / (1 + (changePct || 0) / 100);
  if (currentStreak > 1) {
    basePrice = price / Math.pow(1.10, currentStreak);
  }

  const p1 = Number((basePrice * 1.10).toFixed(price < 1 ? 4 : 2));
  const p2 = Number((basePrice * 1.21).toFixed(price < 1 ? 4 : 2));
  const p3 = Number((basePrice * 1.331).toFixed(price < 1 ? 4 : 2));
  const p4 = Number((basePrice * 1.4641).toFixed(price < 1 ? 4 : 2));
  const p5 = Number((basePrice * 1.6105).toFixed(price < 1 ? 4 : 2));

  const targetSteps: TavanStreakTargetStep[] = [
    {
      step: 1,
      label: '1. Tavan (Kopuş)',
      price: p1,
      cumulativePct: 10.0,
      status: currentStreak >= 1 ? 'TAMAMLANDI' : 'HEDEF',
    },
    {
      step: 2,
      label: '2. Tavan (İvme)',
      price: p2,
      cumulativePct: 21.0,
      status: currentStreak >= 2 ? 'TAMAMLANDI' : currentStreak === 1 ? 'HEDEF' : 'BEKLEMEDE',
    },
    {
      step: 3,
      label: '3. Tavan (Seri)',
      price: p3,
      cumulativePct: 33.1,
      status: currentStreak >= 3 ? 'TAMAMLANDI' : currentStreak === 2 ? 'HEDEF' : 'BEKLEMEDE',
    },
    {
      step: 4,
      label: '4. Tavan (Ralli)',
      price: p4,
      cumulativePct: 46.4,
      status: currentStreak >= 4 ? 'TAMAMLANDI' : currentStreak === 3 ? 'HEDEF' : 'BEKLEMEDE',
    },
    {
      step: 5,
      label: '5. Tavan (Zirve)',
      price: p5,
      cumulativePct: 61.1,
      status: currentStreak >= 5 ? 'TAMAMLANDI' : currentStreak === 4 ? 'HEDEF' : 'BEKLEMEDE',
    },
  ];

  let nextCeilingPrice = p1;
  let nextCeilingCumulativePct = 10.0;
  if (currentStreak === 1) {
    nextCeilingPrice = p2;
    nextCeilingCumulativePct = 21.0;
  } else if (currentStreak === 2) {
    nextCeilingPrice = p3;
    nextCeilingCumulativePct = 33.1;
  } else if (currentStreak === 3) {
    nextCeilingPrice = p4;
    nextCeilingCumulativePct = 46.4;
  } else if (currentStreak >= 4) {
    nextCeilingPrice = p5;
    nextCeilingCumulativePct = 61.1;
  }

  const cumulativeReturnPct = Number((((price - basePrice) / basePrice) * 100).toFixed(1));

  // Dinamik İzleyen Kâr Koruma Stopu (-%4.5 alt seviye)
  const trailingStopPrice = Number((price * 0.955).toFixed(price < 1 ? 4 : 2));
  const trailingStopPct = -4.5;

  // Çözülme Riski
  let breakdownRiskLevel: TavanStreakInfo['breakdownRiskLevel'] = 'DÜŞÜK';
  if ((stock.rsi || 50) > 82 || (stock.perfW || 0) > 45) {
    breakdownRiskLevel = 'YÜKSEK';
  } else if ((stock.rsi || 50) > 72 || currentStreak >= 3) {
    breakdownRiskLevel = 'ORTA';
  }

  // Kilit Gücü
  let queueLockStrength: TavanStreakInfo['queueLockStrength'] = 'ZAYIF';
  if (changePct >= 9.7) queueLockStrength = 'ÇOK GÜÇLÜ';
  else if (changePct >= 9.4) queueLockStrength = 'GÜÇLÜ';
  else if (changePct >= 5.0) queueLockStrength = 'NORMAL';

  return {
    currentStreak,
    streakStage,
    streakStageLabel,
    cumulativeReturnPct,
    nextCeilingPrice,
    nextCeilingCumulativePct,
    trailingStopPrice,
    trailingStopPct,
    breakdownRiskLevel,
    queueLockStrength,
    targetSteps,
  };
}

export function calculateTavanPotential(
  stock: StockItem,
  quantContext?: TavanQuantContext
): TavanPotentialResult {
  const price = stock.close || 1;
  const changePct = stock.changePct || 0;
  const reasons: string[] = [];

  // Determine current market session context
  let isLiveSession = false;
  let isCallAuction = false;
  if (quantContext?.sessionPhase) {
    isLiveSession = quantContext.sessionPhase === 'in_session';
    isCallAuction = quantContext.sessionPhase === 'call_auction';
  } else {
    // Auto-detect BIST market hours (UTC+3, 10:00 - 18:10 weekdays)
    const now = new Date();
    const trHour = (now.getUTCHours() + 3) % 24;
    const trMin = now.getUTCMinutes();
    const day = now.getUTCDay();
    const mins = trHour * 60 + trMin;
    isCallAuction = day >= 1 && day <= 5 && mins >= 9 * 60 + 40 && mins < 9 * 60 + 55;
    isLiveSession = day >= 1 && day <= 5 && mins >= 9 * 60 + 55 && mins <= 18 * 60 + 10;
  }

  // Tavan hedef fiyatı hesabı (Dünkü kapanışın +%10'u)
  const prevClose = price / (1 + changePct / 100);
  const targetCeilingPrice = Number((prevClose * 1.1).toFixed(2));
  const tavanMargin = Number(Math.max(0, 10 - changePct).toFixed(2));

  // Tavan Serisi ve Çoklu Tavan Projeksiyon Analizi
  const streakInfo = computeTavanStreakInfo(stock, price, changePct, changePct >= 9.7);

  // 1. Zaten tavan kitlemiş hisseler (+%9.7 ve üstü)
  if (changePct >= 9.7) {
    return {
      score: 100,
      isCandidate: false,
      isHighProbability: true,
      isAlreadyCeiling: true,
      category: 'TAVAN_KILIT',
      categoryLabel: streakInfo.currentStreak >= 2 ? streakInfo.streakStageLabel : 'Tavan Kilitli 🚀',
      reasons: [
        `Hisse bugün BIST tavan marjına (%10) kilitledi.`,
        streakInfo.currentStreak >= 2
          ? `${streakInfo.streakStageLabel}: Kümülatif getiri +%${streakInfo.cumulativeReturnPct}. Bir sonraki tavan hedefi ${formatStockPrice(streakInfo.nextCeilingPrice, stock.currency)} (+%${streakInfo.nextCeilingCumulativePct}).`
          : `Tavan kilit gücü: ${streakInfo.queueLockStrength}. İzleyen kâr koruma stopu: ${formatStockPrice(streakInfo.trailingStopPrice, stock.currency)}.`
      ],
      relativeVolume: 1.0,
      squeezeStatus: 'Patlama Başladı',
      targetCeilingPrice: Number(price.toFixed(2)),
      tavanMargin: 0,
      primaryReason: 'Hisse günün tavan marjını kilitledi.',
      streakInfo,
    };
  }

  // --- 1.5 TAVAN SERİSİ / ARDIŞIK TAVAN İVMESİ (KATMR Tipi Peş Peşe Tavan Koşusu) ---
  const isNearCeilingClose = changePct >= 9.4;
  if (isNearCeilingClose && !isLiveSession) {
    return {
      score: 92,
      isCandidate: true,
      isHighProbability: true,
      isAlreadyCeiling: false,
      category: 'TAVAN_SERISI',
      categoryLabel: streakInfo.streakStageLabel,
      reasons: [
        `Günün tavan marjına (+%${changePct.toFixed(2)}) kilitlendi.`,
        `${streakInfo.streakStageLabel}: Bir sonraki tavan hedefi ${formatStockPrice(streakInfo.nextCeilingPrice, stock.currency)} (Kümülatif +%${streakInfo.nextCeilingCumulativePct}).`,
        `Kâr koruma izleyen stop seviyesi: ${formatStockPrice(streakInfo.trailingStopPrice, stock.currency)} (${streakInfo.trailingStopPct}%). Tavan çözülme riski: ${streakInfo.breakdownRiskLevel}.`
      ],
      relativeVolume: 2.5,
      squeezeStatus: 'Patlama Başladı',
      targetCeilingPrice,
      tavanMargin: 0,
      primaryReason: 'Dünü tavanda kilitledi; açılışta tavan serisi potansiyeli yüksek.',
      streakInfo,
    };
  }

  let score = 10;

  // --- 2. VOLATİLİTE SIKIŞMASI (Bollinger Squeeze - Tavanların %36.8'i bu modelden çıkar) ---
  let squeezeStatus: 'Daralma / Yay Eşiğinde' | 'Patlama Başladı' | 'Normal' = 'Normal';
  if (stock.bbLower !== null && stock.bbUpper !== null && stock.bbUpper > 0) {
    const bbMid = (stock.bbUpper + stock.bbLower) / 2;
    const bbWidth = (stock.bbUpper - stock.bbLower) / (bbMid || 1);
    if (bbWidth <= 0.075) {
      squeezeStatus = 'Daralma / Yay Eşiğinde';
      score += 24;
      reasons.push('Bollinger bantları aşırı daralmış (yay gibi sıkışmış); kırılım patlaması eşiğinde');
    } else if (price >= stock.bbUpper * 0.99 && changePct >= 2.5) {
      squeezeStatus = 'Patlama Başladı';
      score += 18;
      reasons.push('Üst Bollinger bandı hacimli deliniyor; ivme kırılımı teyitli');
    }
  }

  // --- 3. DİP TEPKİ & AŞIRI SATIM DÖNÜŞÜ (BIST Tavanlarının %57.5'i bu modelden çıkar - HEKTS/ASTOR/TCKRC Modeli) ---
  let isDipReversal = false;
  if (stock.rsi !== null && stock.rsi <= 32) {
    score += 26;
    isDipReversal = true;
    reasons.push(`Aşırı satım dip seviyesi (RSI: ${stock.rsi.toFixed(1)}). Satıcıların tükendiği seviyede kurumsal dip tepkisi eşiği.`);
  } else if (stock.rsi !== null && stock.rsi <= 38 && changePct >= 1.0) {
    score += 16;
    isDipReversal = true;
    reasons.push(`Dipten pozitif dönüş mumuyla (RSI: ${stock.rsi.toFixed(1)}) ivmelenme`);
  }

  // --- 4. HACİM VE DEVİR HIZI ANOMALİSİ (RVol & Turnover) ---
  let rvol = 1.0;
  if (stock.valueTraded && stock.marketCap && stock.marketCap > 0) {
    const turnoverRate = (stock.valueTraded / stock.marketCap) * 100;
    if (turnoverRate >= 3.5) {
      rvol = Number((turnoverRate / 1.5).toFixed(1));
      score += 20;
      reasons.push(`Kuvvetli para girişi ve hacim anomalisi (${rvol}x RVol, %${turnoverRate.toFixed(1)} devir hızı)`);
    } else if (turnoverRate >= 1.8) {
      rvol = Number((turnoverRate / 1.2).toFixed(1));
      score += 10;
      reasons.push(`Hacim desteğiyle kurumsal alım ilgisi (${rvol}x RVol)`);
    }
  }

  // --- 5. SEANS FAZINA GÖRE FİYAT VE KÂR REALİZASYONU DİNAMİĞİ ---
  if (isLiveSession) {
    // CANLI SEANS (09:55 - 18:10): Gün içi tavan marjına (+%10) koşan hisseler
    if (changePct >= 5.5 && changePct < 9.7) {
      score += 32;
      reasons.push(`Canlı seansta tavan marjına yakın kuvvetli alıcı baskısı (+%${changePct.toFixed(2)})`);
    } else if (changePct >= 2.5 && changePct < 5.5) {
      score += 20;
      reasons.push(`Günün tavanına doğru canlı ivmelenme (+%${changePct.toFixed(2)})`);
    } else if (changePct <= 0) {
      score -= 25;
    }
    // Günün en yükseğine kilitlenme
    if (stock.high && stock.low && stock.high > stock.low) {
      const pos = (price - stock.low) / (stock.high - stock.low);
      if (pos >= 0.88 && changePct >= 2.5) {
        score += 14;
        reasons.push('Fiyat günün zirvesine yakın işlem görüyor (Satıcılar karşılanıyor)');
      }
    }
  } else if (isCallAuction) {
    // 09:40 - 09:55 TEORİK EŞLEŞME SEANSI: Sürekli müzayede öncesi tavan derinliği
    score += 16;
    reasons.unshift('🌅 09:40–09:55 Açılış Teorik Eşleşmesi: Sürekli müzayede öncesi emir toplama aşamasında tavanda bekleyen alıcı derinliği tespit edildi.');
    if (changePct >= 2.5) {
      score += 15;
    }
  } else {
    // SEANS KAPALI / AKŞAM (18:10 - 09:40): YARININ TAVAN ADAYI SEÇİMİ
    // 🛡️ DÜN TAVAN KİLİTLEYEMEYİP AŞIRI PRİMLENENLERE KÂR SATIŞI UYARISI:
    if (changePct >= 6.5 && !isNearCeilingClose) {
      score -= 35; // Tavana kilitleyememiş hisse yarın sabah kâr satışına uğrar!
      reasons.push(`⚠️ Kâr Realizasyonu Riski: Hisse bugün +%${changePct.toFixed(2)} primlendi ancak tavan kilitleyemedi; ertesi seans açılışında kâr satışı riski yüksektir.`);
    } else if (changePct >= 0.8 && changePct <= 4.2 && squeezeStatus === 'Daralma / Yay Eşiğinde') {
      score += 26; // İDEAL SIKIŞMA ADAYI: Dinlenmiş, sıkışmış, henüz kopmamış!
      reasons.push(`🎯 İdeal Sıkışma Kurulumu: Dengeli primlenme (+%${changePct.toFixed(2)}) ve daralan bant ile yarın seans açılışında patlama adayı.`);
    } else if (isDipReversal && changePct >= -3.5 && changePct <= 3.0) {
      score += 24; // İDEAL DİP DÖNÜŞ ADAYI (HEKTS / ASTOR / TCKRC Modeli - %57.5 İstatistiği)
      reasons.push(`🎯 İdeal Dip Reversal (Satıcı Tükenişi): Aşırı satım tabanında satıcılar karşılandı; yarınki seansın dip sıçrama tavan adayı.`);
    } else if (changePct <= -4.0 && !isDipReversal) {
      score -= 25;
    }
  }

  // --- 6. PİYASA DEĞERİ & TAHTA AĞIRLIĞI DİNAMİĞİ (MEGA-CAP DEV KORUMASI) ---
  // MGROS, BIMAS, THYAO, TUPRS, KCHOL, SAHOL, EREGL, GARAN vb. BIST 30 devleri tek günde tavan yapamaz!
  const isMegaCap = Boolean(stock.marketCap && stock.marketCap > 65e9);
  if (isMegaCap) {
    score = Math.min(score, 50); // Asla tavan adayı eşiğini (78) geçemez!
    reasons.push('Yüksek piyasa değeri (BIST 30 ağır sıklet dev tahta); tek seanslık tavan dinamiğine uygun değildir.');
  } else if (stock.marketCap && stock.marketCap < 35e9 && stock.marketCap > 1.5e9) {
    score += 8; // Çevik orta/küçük ölçekli tavan dinamizmi
  }

  // --- 6.5. KAP HABER KATALİZÖRÜ & EPISODIC PIVOT ---
  let hasKapCatalyst = false;
  if (!isMegaCap && quantContext?.hasKapCatalyst) {
    hasKapCatalyst = true;
    score += 24;
    reasons.unshift(
      `⚡ KAP Katalizörü (Episodic Pivot): ${quantContext.kapCatalystSummary || 'Yeni yüksek tutarlı sözleşme / sipariş bildirimi'} ile kurumsal tavan akışı teyit edildi.`
    );
  }

  // --- 6.6. SEKTÖREL DOMİNO & KARDEŞ HİSSE SİNERJİSİ (Sympathy Sector Momentum) ---
  let isSectorDomino = false;
  const leader = quantContext?.sectorLeader;
  if (
    !isMegaCap &&
    leader &&
    leader.symbol !== stock.symbol &&
    leader.changePct >= 7.5 &&
    changePct >= 1.2 &&
    changePct <= 6.2
  ) {
    isSectorDomino = true;
    score += 22;
    reasons.unshift(
      `🔗 Sektörel Domino: Sektör lideri ${leader.symbol} (+%${leader.changePct.toFixed(2)}) tavan koşusundayken aynı sektördeki ${stock.symbol} (+%${changePct.toFixed(2)}) gecikmeli takip ivmesiyle (sympathy momentum) tavan çekim alanında.`
    );
  }

  // --- 7. QUANT MODELİ & TREND UYUMU ---
  if (quantContext) {
    const { rawSignal, rawScore } = quantContext;
    if (rawSignal === 'SAT' || rawSignal === 'GÜÇLÜ SAT' || (rawScore !== undefined && rawScore <= 38)) {
      if (!isDipReversal && !hasKapCatalyst && !isSectorDomino) {
        score -= 30;
        reasons.push('Ana teknik trend düşüş yönünde (SAT); tavan potansiyeli baskılanıyor');
      }
    } else if (rawSignal === 'GÜÇLÜ AL' || (rawScore !== undefined && rawScore >= 76)) {
      score += 12;
      reasons.push('AI Quant ana modeli (GÜÇLÜ AL) ile tam uyumlu');
    }
  }

  // Clamp maximum score to 92 for candidate setups (only 100 for already locked ceiling)
  score = clamp(Math.round(score), 0, 92);

  let category: TavanCategoryType = 'NORMAL';
  let categoryLabel = 'Normal Seyir';

  if (!isMegaCap) {
    if (isCallAuction && score >= 75) {
      category = 'TAVAN_SERISI';
      categoryLabel = '🌅 Açılış Eşleşme Tavanı';
    } else if (hasKapCatalyst && score >= 75) {
      category = 'HABER_KATALIZOR';
      categoryLabel = '⚡ KAP Katalizör Tavanı (Episodic Pivot)';
    } else if (isSectorDomino && score >= 75) {
      category = 'SEKTOR_DOMINO';
      categoryLabel = `🔗 Sektörel Domino (${leader?.symbol} Sürüklemesi)`;
    } else if (isDipReversal && score >= 75) {
      category = 'DIP_TEPKI_TAVANI';
      categoryLabel = '🎯 Dip Tepki Tavanı Adayı';
    } else if (squeezeStatus === 'Daralma / Yay Eşiğinde' && score >= 75) {
      category = 'SIKISMA_PATLAMASI';
      categoryLabel = '⚡ Sıkışma Patlaması Adayı';
    } else if (score >= 80) {
      category = 'KIRILIM_TAVANI';
      categoryLabel = '🚀 Güçlü Tavan Adayı';
    } else if (score >= 70) {
      category = 'HACIM_PATLAMASI';
      categoryLabel = '🔥 Hacim & İvme Adayı';
    }
  }

  // Adaylık Kriteri (Sıkı & Elit Filtreleme - En Fazla 3-5 Hisse Seçilir):
  // 1. Asla Mega-Cap dev olamaz (MGROS, BIMAS, THYAO elenir)
  // 2. Canlı seansta / Eşleşmede: %2.0+ primli (veya Domino/KAP) ve skoru >= 75
  // 3. Seans dışında: Skoru >= 78 ve (Gerçek Dip RSI <= 32 veya Sıkışma + kontrollü prim veya Domino veya KAP veya Tavan Serisi)
  const isCandidate = !isMegaCap && (
    isLiveSession || isCallAuction
      ? score >= 75 && (changePct >= 2.0 || category === 'SEKTOR_DOMINO' || category === 'HABER_KATALIZOR') && changePct < 9.7 && quantContext?.rawSignal !== 'SAT'
      : score >= 78 && (
          (changePct >= -3.5 && changePct <= 3.0 && isDipReversal && stock.rsi !== null && stock.rsi <= 32) ||
          (changePct >= 0.8 && changePct <= 4.2 && squeezeStatus === 'Daralma / Yay Eşiğinde') ||
          category === 'SEKTOR_DOMINO' ||
          category === 'HABER_KATALIZOR' ||
          isNearCeilingClose
        ) && (quantContext?.rawSignal !== 'SAT' || isDipReversal || category === 'HABER_KATALIZOR' || category === 'SEKTOR_DOMINO')
  );

  const isHighProbability = score >= 82 && isCandidate;

  return {
    score,
    isCandidate,
    isHighProbability,
    isAlreadyCeiling: false,
    category,
    categoryLabel,
    reasons,
    relativeVolume: rvol,
    squeezeStatus,
    targetCeilingPrice,
    tavanMargin,
    primaryReason: reasons[0] || 'Dengeli seyir',
    streakInfo,
  };
}

export interface AIResearchMemo {
  headline: string;
  convictionBadge: string;
  sections: { title: string; body: string }[];
  actionCallout: string;
}

export function buildInstitutionalAIMemo(
  stock: StockItem,
  quant: StockQuantAnalysis,
  deep: StockDeepAnalysis | null
): AIResearchMemo {
  const cur = stock.currency;
  const tp1Str = formatStockPrice(quant.tradePlan.tp1, cur);
  const tp2Str = formatStockPrice(quant.tradePlan.tp2, cur);
  const slStr = formatStockPrice(quant.tradePlan.stopLoss, cur);
  const entryStr = `${formatStockPrice(quant.tradePlan.entryLow, '')}–${formatStockPrice(
    quant.tradePlan.entryHigh,
    cur
  )}`;

  const sections: { title: string; body: string }[] = [];

  // 1. MTF & Price Action Structure
  if (deep) {
    const tfSummary = deep.mtf
      .map((m) => `${m.timeframe.split(' ')[0]}: ${m.signal} (RSI ${m.rsi ?? '-'})`)
      .join(' | ');
    const patternTxt =
      deep.patterns.length > 0
        ? `Son mumlarda ${deep.patterns.map((p) => p.name).join(', ')} tespit edildi.`
        : 'Mum yapısında ani ters dönüş formasyonu yok.';
    const volTxt =
      deep.volumeRatio >= 1.5
        ? `İşlem hacmi 20 günlük ortalamanın ${deep.volumeRatio}x katına çıkarak kurumsal katılımı doğruluyor.`
        : deep.volumeRatio <= 0.65
        ? `Hacim ortalamanın altında (${deep.volumeRatio}x); kırılım öncesi enerji birikimi izleniyor.`
        : `Hacim 20 günlük normal seyrinde (${deep.volumeRatio}x).`;
    sections.push({
      title: '1. Çoklu Zaman Dilimi (MTF) & Hacim Akışı',
      body: `${deep.mtfSummary.alignment} (${tfSummary}). ${patternTxt} ${volTxt}`,
    });
  } else {
    sections.push({
      title: '1. Teknik Yapı & Momentum',
      body: `${stock.symbol} günlük bazda %${quant.trendScore} trend ve %${quant.momentumScore} momentum skoru üretiyor (RSI: ${
        stock.rsi?.toFixed(1) ?? '-'
      }, ADX: ${stock.adx?.toFixed(1) ?? '-'}).`,
    });
  }

  // 2. Analyst Valuation & Backtest Edge
  const valParts: string[] = [];
  if (deep?.financials?.targetMeanPrice) {
    const targetStr = formatStockPrice(deep.financials.targetMeanPrice, cur);
    const up = deep.financials.upsidePct ?? 0;
    valParts.push(
      `${deep.financials.numberOfAnalystOpinions ?? 'Piyasa'} analist konsensüsü ortalama ${targetStr} (%${
        up >= 0 ? '+' : ''
      }${up} potansiyel) hedefliyor.`
    );
  }
  if (stock.pe && stock.pe > 0) {
    valParts.push(
      `Cari F/K ${stock.pe.toFixed(2)}x ve PD/DD ${stock.pb?.toFixed(2) ?? '-'}x çarpanlarıyla işlem görüyor.`
    );
  }
  if (deep?.backtest && deep.backtest.totalTrades > 0) {
    valParts.push(
      `Son 1 yıllık gerçek strateji backtestinde ${deep.backtest.totalTrades} işlemde %${deep.backtest.winRate} kazanma oranı ve %${
        deep.backtest.strategyReturnPct >= 0 ? '+' : ''
      }${deep.backtest.strategyReturnPct} bileşik getiri elde edildi (Profit Factor: ${deep.backtest.profitFactor}).`
    );
  }
  if (valParts.length > 0) {
    sections.push({
      title: '2. Değerleme, Analist Hedefi & Backtest Kanıtı',
      body: valParts.join(' '),
    });
  }

  // 3. News Catalyst
  if (deep && deep.news.length > 0) {
    const pos = deep.news.filter((n) => n.sentiment === 'Pozitif').length;
    const neg = deep.news.filter((n) => n.sentiment === 'Negatif').length;
    const topHeadline = deep.news[0].title;
    sections.push({
      title: '3. Güncel Haber & Duygu Analizi',
      body: `Son ${deep.news.length} haberde ${pos} Pozitif / ${neg} Negatif başlık öne çıkıyor. Gündemdeki başlık: "${topHeadline}"`,
    });
  }

  // Actionable Verdict
  const strongMtfBull = deep ? deep.mtfSummary.bullCount >= 2 : quant.score >= 62;
  const convictionBadge =
    quant.signal === 'GÜÇLÜ AL' && strongMtfBull
      ? 'Yüksek İnançlı Boğa Kurulumu'
      : quant.signal === 'GÜÇLÜ SAT' || quant.signal === 'SAT'
      ? 'Defansif / Satış Baskısı'
      : quant.signal === 'AL'
      ? 'Kademeli Toplama Uygun'
      : 'Teyit Bekleyen Yatay Bölge';

  const headline = `${stock.symbol} Kurumsal AI Raporu: ${quant.signal} (${quant.score}/100)`;
  const actionCallout =
    quant.tradePlan.bias === 'LONG (AL)'
      ? `Uygulama Planı: ${entryStr} bandından kademeli giriş, ${slStr} altı kapanışta kesin Stop-Loss (%${quant.tradePlan.stopLossPct}), hedefler ${tp1Str} (TP1) ve ${tp2Str} (TP2). Risk/Ödül 1:${quant.tradePlan.riskReward}.`
      : quant.tradePlan.bias === 'SHORT / KAR AL'
      ? `Risk Yönetimi: Mevcut momentum zayıf. ${formatStockPrice(
          quant.pivots.s1,
          cur
        )} desteği korunamazsa aşağı yönlü baskı derinleşebilir; tepki alımları için ${formatStockPrice(
          quant.pivots.r1,
          cur
        )} üstü hacimli kapanış beklenmeli.`
      : `Bekle-Gör Stratejisi: Net kırılım için ${formatStockPrice(
          quant.pivots.r1,
          cur
        )} direncinin aşılması veya ${formatStockPrice(quant.pivots.s1, cur)} desteğine geri çekilme takip edilmelidir.`;

  return {
    headline,
    convictionBadge,
    sections,
    actionCallout,
  };
}

export interface PortfolioPositionRisk {
  position: StockPortfolioPosition;
  stock?: StockItem;
  quant?: StockQuantAnalysis;
  currentPrice: number;
  pnlVal: number;
  pnlPct: number;
  alertType: 'GÜÇLÜ SAT' | 'SAT' | 'DİKKAT' | 'GÜVENLİ';
  reasons: string[];
  primaryReason: string;
  recommendedAction: 'ZARAR KES (STOP)' | 'KÂR REALİZASYONU' | 'POZİSYONU BOŞALT' | 'İZLE';
  isSevere: boolean;
}

export function evaluatePortfolioPositionRisk(
  pos: StockPortfolioPosition,
  stock?: StockItem,
  quant?: StockQuantAnalysis
): PortfolioPositionRisk {
  const curPrice = stock?.close || pos.currentPrice || pos.entryPrice;
  const pnlVal = (curPrice - pos.entryPrice) * pos.units;
  const pnlPct = pos.entryPrice > 0 ? ((curPrice - pos.entryPrice) / pos.entryPrice) * 100 : 0;
  const reasons: string[] = [];

  const effectiveStop = pos.stopLoss ?? quant?.tradePlan?.stopLoss ?? null;
  const effectiveTarget = pos.targetPrice ?? quant?.tradePlan?.tp1 ?? null;

  let alertType: 'GÜÇLÜ SAT' | 'SAT' | 'DİKKAT' | 'GÜVENLİ' = 'GÜVENLİ';
  let recommendedAction: 'ZARAR KES (STOP)' | 'KÂR REALİZASYONU' | 'POZİSYONU BOŞALT' | 'İZLE' = 'İZLE';

  // 1. Critical Stop Breach
  const isStopBreached = effectiveStop !== null && curPrice <= effectiveStop;
  if (isStopBreached) {
    reasons.push(`Stop-Loss seviyesi (${effectiveStop.toFixed(2)}) kırıldı (Güncel: ${curPrice.toFixed(2)})`);
  }

  // 2. Severe Drawdown
  const isSevereLoss = pnlPct <= -5.0;
  if (isSevereLoss && !isStopBreached) {
    reasons.push(`%${Math.abs(pnlPct).toFixed(1)} derin kayıp eşiği aşıldı`);
  }

  // 3. AI Quant Signal deterioration
  const quantSignal = quant?.signal;
  if (quantSignal === 'GÜÇLÜ SAT') {
    reasons.push('AI Quant algoritması GÜÇLÜ SAT üretti (Trend bozuldu)');
  } else if (quantSignal === 'SAT') {
    reasons.push('AI Quant algoritması SAT sinyaline döndü');
  }

  // 4. Target Reached (Take Profit)
  const isTargetHit = effectiveTarget !== null && curPrice >= effectiveTarget;
  if (isTargetHit) {
    reasons.push(`Kâr alma hedefi (${effectiveTarget.toFixed(2)}) gerçekleşti (%+${pnlPct.toFixed(1)})`);
  }

  // 5. Momentum Exhaustion / Overbought Reversal
  if (stock?.rsi && stock.rsi >= 75) {
    reasons.push(`RSI ${stock.rsi.toFixed(0)} ile aşırı alım doyumunda, düzeltme riski yüksek`);
  }

  // 6. High Risk level with negative return
  if (quant?.riskLevel === 'YÜKSEK' && pnlPct < 0) {
    reasons.push('Yüksek risk seviyesi ve negatif getiri trendi');
  }

  // Decision Logic:
  if (isStopBreached || quantSignal === 'GÜÇLÜ SAT' || pnlPct <= -7.0) {
    alertType = 'GÜÇLÜ SAT';
    recommendedAction = isStopBreached ? 'ZARAR KES (STOP)' : 'POZİSYONU BOŞALT';
  } else if (quantSignal === 'SAT' || isSevereLoss || (isTargetHit && pnlPct > 0)) {
    alertType = 'SAT';
    recommendedAction = isTargetHit ? 'KÂR REALİZASYONU' : 'POZİSYONU BOŞALT';
  } else if ((stock?.rsi && stock.rsi >= 75) || (quant?.riskLevel === 'YÜKSEK' && pnlPct < 0)) {
    alertType = 'DİKKAT';
    recommendedAction = 'İZLE';
  }

  return {
    position: pos,
    stock,
    quant,
    currentPrice: curPrice,
    pnlVal,
    pnlPct,
    alertType,
    reasons,
    primaryReason: reasons[0] || 'Pozisyon normal seyrediyor',
    recommendedAction,
    isSevere: alertType === 'GÜÇLÜ SAT',
  };
}

export function evaluateAllPortfolioRisks(
  positions: StockPortfolioPosition[],
  stocks: StockItem[],
  analysesMap?: Map<string, StockQuantAnalysis>
): PortfolioPositionRisk[] {
  return positions
    .filter((p) => p.status === 'open')
    .map((pos) => {
      const stock = stocks.find((s) => s.symbol === pos.symbol);
      const quant = analysesMap?.get(pos.symbol) || (stock ? analyzeStockQuant(stock) : undefined);
      return evaluatePortfolioPositionRisk(pos, stock, quant);
    });
}



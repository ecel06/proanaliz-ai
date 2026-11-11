// src/utils/stockAnalysisEngine.ts
import {
  IndicatorSignalRow,
  StockItem,
  StockQuantAnalysis,
  StockSignalType,
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

export function analyzeStockQuant(stock: StockItem): StockQuantAnalysis {
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

  // --- 4. COMPOSITE QUANT SCORE & SIGNAL ---
  const score = clamp(
    Math.round(
      stock.market === 'crypto'
        ? trendScore * 0.5 + momentumScore * 0.5
        : trendScore * 0.4 + momentumScore * 0.35 + fundamentalScore * 0.25
    )
  );

  let signal: StockSignalType = 'TUT';
  if (score >= 74) signal = 'GÜÇLÜ AL';
  else if (score >= 60) signal = 'AL';
  else if (score <= 28) signal = 'GÜÇLÜ SAT';
  else if (score <= 42) signal = 'SAT';

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

  const summaryText = isBullBias
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
      bias: isBullBias ? 'LONG (AL)' : isBearBias ? 'SHORT / KAR AL' : 'BEKLE',
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
  };
}


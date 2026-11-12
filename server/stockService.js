// server/stockService.js
// Live Institutional Stock & Technical Screener Data Service (BIST, US NASDAQ/NYSE, Crypto, Macro)
// Primary: TradingView Institutional Scanner API
// Automatic Cloud Fallback: Yahoo Finance Real-Time OHLCV + Quantitative Indicator Engine

import https from 'https';

const SCREENER_CACHE = new Map(); // key -> { data, expiresAt }
const CHART_CACHE = new Map(); // key -> { data, expiresAt }
const DEEP_CACHE = new Map(); // key -> { data, expiresAt }
let macroCache = { data: null, expiresAt: 0 };
let yahooSessionCache = { cookie: '', crumb: '', expiresAt: 0 };

const TV_COLUMNS = [
  'name',
  'description',
  'close',
  'change',
  'volume',
  'Value.Traded',
  'market_cap_basic',
  'price_earnings_ttm',
  'price_book_fq',
  'dividends_yield_current',
  'return_on_equity',
  'debt_to_equity',
  'RSI',
  'MACD.macd',
  'MACD.signal',
  'Stoch.K',
  'Stoch.D',
  'ADX',
  'ATR',
  'BB.lower',
  'BB.upper',
  'EMA20',
  'EMA50',
  'EMA200',
  'SMA20',
  'SMA50',
  'SMA200',
  'Recommend.All',
  'Recommend.MA',
  'Recommend.Other',
  'high',
  'low',
  'open',
  'price_52_week_high',
  'price_52_week_low',
  'Perf.W',
  'Perf.1M',
  'Perf.3M',
  'Perf.6M',
  'Perf.Y',
  'sector',
  'exchange',
  'currency',
];

const BIST_UNIVERSE = [
  { symbol: 'THYAO', name: 'Türk Hava Yolları', sector: 'Havacılık & Ulaştırma' },
  { symbol: 'ASELS', name: 'Aselsan Elektronik', sector: 'Savunma & Teknoloji' },
  { symbol: 'GARAN', name: 'Garanti BBVA', sector: 'Bankacılık' },
  { symbol: 'AKBNK', name: 'Akbank', sector: 'Bankacılık' },
  { symbol: 'YKBNK', name: 'Yapı Kredi Bankası', sector: 'Bankacılık' },
  { symbol: 'ISCTR', name: 'İş Bankası (C)', sector: 'Bankacılık' },
  { symbol: 'KCHOL', name: 'Koç Holding', sector: 'Holding & Yatırım' },
  { symbol: 'SAHOL', name: 'Sabancı Holding', sector: 'Holding & Yatırım' },
  { symbol: 'TUPRS', name: 'Tüpraş', sector: 'Enerji & Rafineri' },
  { symbol: 'EREGL', name: 'Ereğli Demir Çelik', sector: 'Demir Çelik' },
  { symbol: 'BIMAS', name: 'BİM Birleşik Mağazalar', sector: 'Perakende' },
  { symbol: 'FROTO', name: 'Ford Otosan', sector: 'Otomotiv' },
  { symbol: 'TOASO', name: 'Tofaş Oto Fabrika', sector: 'Otomotiv' },
  { symbol: 'TCELL', name: 'Turkcell İletişim', sector: 'Telekomünikasyon' },
  { symbol: 'TTKOM', name: 'Türk Telekom', sector: 'Telekomünikasyon' },
  { symbol: 'SISE', name: 'Şişecam', sector: 'Cam & Sanayi' },
  { symbol: 'PGSUS', name: 'Pegasus Hava Taşımacılığı', sector: 'Havacılık & Ulaştırma' },
  { symbol: 'ASTOR', name: 'Astor Enerji', sector: 'Enerji Ekipmanları' },
  { symbol: 'ARCLK', name: 'Arçelik', sector: 'Dayanıklı Tüketim' },
  { symbol: 'MGROS', name: 'Migros Ticaret', sector: 'Perakende' },
  { symbol: 'TAVHL', name: 'TAV Havalimanları', sector: 'Havacılık & Ulaştırma' },
  { symbol: 'ENKAI', name: 'Enka İnşaat', sector: 'İnşaat & Enerji' },
  { symbol: 'PETKM', name: 'Petkim Petrokimya', sector: 'Petrokimya' },
  { symbol: 'SASA', name: 'Sasa Polyester', sector: 'Kimya & Tekstil' },
  { symbol: 'HEKTS', name: 'Hektaş Ticaret', sector: 'Tarım & Kimya' },
  { symbol: 'GUBRF', name: 'Gübre Fabrikaları', sector: 'Tarım & Kimya' },
  { symbol: 'KOZAL', name: 'Koza Altın İşletmeleri', sector: 'Madencilik' },
  { symbol: 'DOAS', name: 'Doğuş Otomotiv', sector: 'Otomotiv' },
  { symbol: 'ALARK', name: 'Alarko Holding', sector: 'Holding & Enerji' },
  { symbol: 'KONTR', name: 'Kontrolmatik Teknoloji', sector: 'Teknoloji & Enerji' },
  { symbol: 'EKGYO', name: 'Emlak Konut GYO', sector: 'Gayrimenkul GYO' },
  { symbol: 'AEFES', name: 'Anadolu Efes', sector: 'Gıda & İçecek' },
  { symbol: 'CCOLA', name: 'Coca-Cola İçecek', sector: 'Gıda & İçecek' },
  { symbol: 'ULKER', name: 'Ülker Bisküvi', sector: 'Gıda & İçecek' },
  { symbol: 'SOKM', name: 'Şok Marketler', sector: 'Perakende' },
  { symbol: 'HALKB', name: 'Halkbank', sector: 'Bankacılık' },
  { symbol: 'VAKBN', name: 'VakıfBank', sector: 'Bankacılık' },
  { symbol: 'KRDMD', name: 'Kardemir (D)', sector: 'Demir Çelik' },
  { symbol: 'ODAS', name: 'Odaş Elektrik', sector: 'Elektrik & Enerji' },
  { symbol: 'VESTL', name: 'Vestel Elektronik', sector: 'Dayanıklı Tüketim' },
];

const US_UNIVERSE = [
  { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Yarı İletken & AI' },
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Tüketici Teknolojisi' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Bulut & Yazılım' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'E-Ticaret & Bulut' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Dijital Reklam & AI' },
  { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Sosyal Medya & AI' },
  { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Elektrikli Araç & Otonomi' },
  { symbol: 'AVGO', name: 'Broadcom Inc.', sector: 'Yarı İletken' },
  { symbol: 'AMD', name: 'Advanced Micro Devices', sector: 'Yarı İletken & AI' },
  { symbol: 'PLTR', name: 'Palantir Technologies', sector: 'Veri & AI Yazılım' },
  { symbol: 'NFLX', name: 'Netflix Inc.', sector: 'Dijital Yayın' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Finans & Bankacılık' },
  { symbol: 'V', name: 'Visa Inc.', sector: 'Ödeme Sistemleri' },
  { symbol: 'WMT', name: 'Walmart Inc.', sector: 'Perakende' },
  { symbol: 'COST', name: 'Costco Wholesale', sector: 'Perakende' },
  { symbol: 'ORCL', name: 'Oracle Corporation', sector: 'Kurumsal Yazılım' },
  { symbol: 'CRM', name: 'Salesforce Inc.', sector: 'Bulut CRM' },
  { symbol: 'COIN', name: 'Coinbase Global', sector: 'FinTech & Kripto' },
  { symbol: 'ARM', name: 'Arm Holdings plc', sector: 'Çip Mimarisi' },
  { symbol: 'MU', name: 'Micron Technology', sector: 'Bellek & Yarı İletken' },
  { symbol: 'SMCI', name: 'Super Micro Computer', sector: 'AI Sunucu Altyapısı' },
  { symbol: 'LLY', name: 'Eli Lilly and Co.', sector: 'Biyoteknoloji & Sağlık' },
  { symbol: 'BA', name: 'The Boeing Company', sector: 'Havacılık & Savunma' },
  { symbol: 'INTC', name: 'Intel Corporation', sector: 'Yarı İletken' },
];

const CRYPTO_UNIVERSE = [
  { symbol: 'BTCUSDT', yf: 'BTC-USD', name: 'Bitcoin / USD', sector: 'Layer 1' },
  { symbol: 'ETHUSDT', yf: 'ETH-USD', name: 'Ethereum / USD', sector: 'Layer 1' },
  { symbol: 'SOLUSDT', yf: 'SOL-USD', name: 'Solana / USD', sector: 'Layer 1' },
  { symbol: 'BNBUSDT', yf: 'BNB-USD', name: 'BNB / USD', sector: 'Exchange & L1' },
  { symbol: 'XRPUSDT', yf: 'XRP-USD', name: 'Ripple XRP / USD', sector: 'Ödeme Ağı' },
  { symbol: 'AVAXUSDT', yf: 'AVAX-USD', name: 'Avalanche / USD', sector: 'Layer 1' },
  { symbol: 'DOGEUSDT', yf: 'DOGE-USD', name: 'Dogecoin / USD', sector: 'Meme Coin' },
  { symbol: 'ADAUSDT', yf: 'ADA-USD', name: 'Cardano / USD', sector: 'Layer 1' },
  { symbol: 'LINKUSDT', yf: 'LINK-USD', name: 'Chainlink / USD', sector: 'Oracle / DeFi' },
  { symbol: 'SUIUSDT', yf: 'SUI-USD', name: 'Sui / USD', sector: 'Layer 1' },
  { symbol: 'TRXUSDT', yf: 'TRX-USD', name: 'TRON / USD', sector: 'Layer 1' },
  { symbol: 'DOTUSDT', yf: 'DOT-USD', name: 'Polkadot / USD', sector: 'Layer 0' },
  { symbol: 'NEARUSDT', yf: 'NEAR-USD', name: 'NEAR Protocol / USD', sector: 'AI & Layer 1' },
  { symbol: 'LTCUSDT', yf: 'LTC-USD', name: 'Litecoin / USD', sector: 'Ödeme Ağı' },
  { symbol: 'UNIUSDT', yf: 'UNI-USD', name: 'Uniswap / USD', sector: 'DeFi' },
  { symbol: 'AAVEUSDT', yf: 'AAVE-USD', name: 'Aave / USD', sector: 'DeFi' },
  { symbol: 'ARBUSDT', yf: 'ARB-USD', name: 'Arbitrum / USD', sector: 'Layer 2' },
  { symbol: 'OPUSDT', yf: 'OP-USD', name: 'Optimism / USD', sector: 'Layer 2' },
  { symbol: 'APTUSDT', yf: 'APT-USD', name: 'Aptos / USD', sector: 'Layer 1' },
  { symbol: 'TONUSDT', yf: 'TON-USD', name: 'Toncoin / USD', sector: 'Layer 1' },
];

const TOP_CRYPTO_TICKERS = CRYPTO_UNIVERSE.map((c) => `BINANCE:${c.symbol}`);

function httpRequestJson(url, method = 'GET', body = null, timeoutMs = 12000, extraHeaders = {}) {
  return new Promise((resolve) => {
    const payloadStr = body
      ? typeof body === 'string'
        ? body
        : JSON.stringify(body)
      : null;

    const headers = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      Accept: 'application/json, text/plain, */*',
      ...extraHeaders,
    };

    if (payloadStr !== null) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payloadStr);
    }

    const req = https.request(
      url,
      {
        method,
        headers,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          if (res.statusCode !== 200 || !raw) {
            return resolve(null);
          }
          try {
            resolve(JSON.parse(raw));
          } catch {
            resolve(null);
          }
        });
      }
    );
    req.on('error', () => resolve(null));
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      resolve(null);
    });
    if (payloadStr !== null) req.write(payloadStr);
    req.end();
  });
}

function httpRequestRaw(url, timeoutMs = 10000, extraHeaders = {}) {
  return new Promise((resolve) => {
    const req = https.request(
      url,
      {
        method: 'GET',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          Accept: '*/*',
          ...extraHeaders,
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => {
          raw += c;
        });
        res.on('end', () => {
          resolve({ status: res.statusCode, headers: res.headers, body: raw });
        });
      }
    );
    req.on('error', () => resolve({ status: 0, headers: {}, body: '' }));
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      resolve({ status: 0, headers: {}, body: '' });
    });
    req.end();
  });
}

async function getYahooSession() {
  const now = Date.now();
  if (yahooSessionCache.crumb && now < yahooSessionCache.expiresAt) {
    return yahooSessionCache;
  }
  try {
    const r1 = await httpRequestRaw('https://fc.yahoo.com', 7000);
    const cookie = (r1.headers?.['set-cookie'] || [])
      .map((c) => c.split(';')[0])
      .filter(Boolean)
      .join('; ');
    if (!cookie) return null;
    const r2 = await httpRequestRaw('https://query1.finance.yahoo.com/v1/test/getcrumb', 7000, {
      Cookie: cookie,
    });
    if (r2.status === 200 && r2.body && !r2.body.includes('<')) {
      yahooSessionCache = {
        cookie,
        crumb: r2.body.trim(),
        expiresAt: now + 15 * 60 * 1000,
      };
      return yahooSessionCache;
    }
  } catch {}
  return null;
}

async function enrichWithYahooQuotes(stocks, market) {
  if (!Array.isArray(stocks) || stocks.length === 0 || market === 'crypto') return stocks;
  const sess = await getYahooSession();
  if (!sess) return stocks;

  const symbols = stocks.map((s) => s.ticker).filter(Boolean);
  if (symbols.length === 0) return stocks;

  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(
    symbols.join(',')
  )}&crumb=${encodeURIComponent(sess.crumb)}`;
  const r = await httpRequestRaw(url, 9000, { Cookie: sess.cookie });
  if (r.status !== 200 || !r.body) return stocks;

  try {
    const parsed = JSON.parse(r.body);
    const rows = parsed?.quoteResponse?.result || [];
    const bySym = new Map(rows.map((row) => [row.symbol, row]));
    return stocks.map((st) => {
      const q = bySym.get(st.ticker);
      if (!q) return st;
      return {
        ...st,
        marketCap: st.marketCap ?? (typeof q.marketCap === 'number' ? q.marketCap : null),
        pe: st.pe ?? (typeof q.trailingPE === 'number' ? q.trailingPE : typeof q.forwardPE === 'number' ? q.forwardPE : null),
        pb: st.pb ?? (typeof q.priceToBook === 'number' ? q.priceToBook : null),
        dividendYield:
          st.dividendYield ??
          (typeof q.trailingAnnualDividendYield === 'number' && q.trailingAnnualDividendYield > 0
            ? Number((q.trailingAnnualDividendYield * 100).toFixed(2))
            : typeof q.dividendYield === 'number' && q.dividendYield > 0
            ? Number(q.dividendYield.toFixed(2))
            : null),
      };
    });
  } catch {
    return stocks;
  }
}

// --- QUANTITATIVE INDICATOR MATH FROM OHLCV ---

function calcSMA(arr, period) {
  if (arr.length < period || period <= 0) return null;
  let sum = 0;
  for (let i = arr.length - period; i < arr.length; i++) sum += arr[i];
  return sum / period;
}

function calcEMASeries(arr, period) {
  if (arr.length < period || period <= 0) return [];
  const k = 2 / (period + 1);
  let ema = 0;
  for (let i = 0; i < period; i++) ema += arr[i];
  ema /= period;
  const out = new Array(arr.length).fill(null);
  out[period - 1] = ema;
  for (let i = period; i < arr.length; i++) {
    ema = arr[i] * k + ema * (1 - k);
    out[i] = ema;
  }
  return out;
}

function calcRSI(closes, period = 14) {
  if (closes.length <= period) return null;
  let gainSum = 0;
  let lossSum = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gainSum += diff;
    else lossSum += Math.abs(diff);
  }
  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff >= 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function calcMACD(closes) {
  if (closes.length < 35) return { macd: null, signal: null };
  const ema12 = calcEMASeries(closes, 12);
  const ema26 = calcEMASeries(closes, 26);
  const macdSeries = [];
  for (let i = 0; i < closes.length; i++) {
    if (ema12[i] !== null && ema26[i] !== null) {
      macdSeries.push(ema12[i] - ema26[i]);
    }
  }
  if (macdSeries.length < 9) return { macd: null, signal: null };
  const sigSeries = calcEMASeries(macdSeries, 9);
  const macdVal = macdSeries[macdSeries.length - 1];
  const sigVal = sigSeries[sigSeries.length - 1];
  return {
    macd: macdVal ?? null,
    signal: sigVal ?? null,
  };
}

function calcATR(highs, lows, closes, period = 14) {
  if (closes.length <= period) return null;
  const trs = [];
  for (let i = 1; i < closes.length; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    trs.push(tr);
  }
  if (trs.length < period) return null;
  let atr = 0;
  for (let i = 0; i < period; i++) atr += trs[i];
  atr /= period;
  for (let i = period; i < trs.length; i++) {
    atr = (atr * (period - 1) + trs[i]) / period;
  }
  return atr;
}

function calcADX(highs, lows, closes, period = 14) {
  if (closes.length < period * 2 + 2) return null;
  const plusDM = [];
  const minusDM = [];
  const tr = [];
  for (let i = 1; i < closes.length; i++) {
    const up = highs[i] - highs[i - 1];
    const down = lows[i - 1] - lows[i];
    plusDM.push(up > down && up > 0 ? up : 0);
    minusDM.push(down > up && down > 0 ? down : 0);
    tr.push(
      Math.max(
        highs[i] - lows[i],
        Math.abs(highs[i] - closes[i - 1]),
        Math.abs(lows[i] - closes[i - 1])
      )
    );
  }
  let smTR = 0;
  let smPlus = 0;
  let smMinus = 0;
  for (let i = 0; i < period; i++) {
    smTR += tr[i];
    smPlus += plusDM[i];
    smMinus += minusDM[i];
  }
  const dxList = [];
  for (let i = period; i < tr.length; i++) {
    smTR = smTR - smTR / period + tr[i];
    smPlus = smPlus - smPlus / period + plusDM[i];
    smMinus = smMinus - smMinus / period + minusDM[i];
    const pDI = smTR ? (100 * smPlus) / smTR : 0;
    const mDI = smTR ? (100 * smMinus) / smTR : 0;
    const denom = pDI + mDI;
    dxList.push(denom ? (100 * Math.abs(pDI - mDI)) / denom : 0);
  }
  if (dxList.length < period) return null;
  let adx = 0;
  for (let i = 0; i < period; i++) adx += dxList[i];
  adx /= period;
  for (let i = period; i < dxList.length; i++) {
    adx = (adx * (period - 1) + dxList[i]) / period;
  }
  return adx;
}

function calcStoch(highs, lows, closes, kPeriod = 14, dPeriod = 3) {
  if (closes.length < kPeriod + dPeriod) return { k: null, d: null };
  const kList = [];
  for (let i = kPeriod - 1; i < closes.length; i++) {
    let hi = -Infinity;
    let lo = Infinity;
    for (let j = i - kPeriod + 1; j <= i; j++) {
      if (highs[j] > hi) hi = highs[j];
      if (lows[j] < lo) lo = lows[j];
    }
    const denom = hi - lo;
    kList.push(denom > 0 ? ((closes[i] - lo) / denom) * 100 : 50);
  }
  const k = kList[kList.length - 1];
  const d = calcSMA(kList, dPeriod);
  return { k: k ?? null, d: d ?? null };
}

function calcBollinger(closes, period = 20, mult = 2) {
  if (closes.length < period) return { upper: null, lower: null };
  const mid = calcSMA(closes, period);
  let variance = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - mid;
    variance += diff * diff;
  }
  const std = Math.sqrt(variance / period);
  return {
    upper: mid + mult * std,
    lower: mid - mult * std,
  };
}

function calcPerf(closes, lookbackDays) {
  if (closes.length <= lookbackDays) return null;
  const past = closes[closes.length - 1 - lookbackDays];
  const curr = closes[closes.length - 1];
  if (!past) return null;
  return Number((((curr - past) / past) * 100).toFixed(2));
}

async function fetchYahooScreenerItem(entry, market) {
  const yfSymbol =
    entry.yf ||
    (market === 'bist'
      ? `${entry.symbol}.IS`
      : market === 'crypto'
      ? entry.symbol.replace(/USDT$/, '-USD')
      : entry.symbol);

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    yfSymbol
  )}?range=1y&interval=1d`;
  const resp = await httpRequestJson(url);
  const resObj = resp?.chart?.result?.[0];
  if (!resObj || !Array.isArray(resObj.timestamp)) return null;

  const timestamps = resObj.timestamp;
  const quote = resObj.indicators?.quote?.[0] || {};
  const opens = [];
  const highs = [];
  const lows = [];
  const closes = [];
  const volumes = [];

  for (let i = 0; i < timestamps.length; i++) {
    const o = quote.open?.[i];
    const h = quote.high?.[i];
    const l = quote.low?.[i];
    const c = quote.close?.[i];
    const v = quote.volume?.[i] ?? 0;
    if (
      typeof o === 'number' &&
      typeof h === 'number' &&
      typeof l === 'number' &&
      typeof c === 'number' &&
      Number.isFinite(c) &&
      c > 0
    ) {
      opens.push(o);
      highs.push(h);
      lows.push(l);
      closes.push(c);
      volumes.push(typeof v === 'number' && Number.isFinite(v) ? v : 0);
    }
  }

  if (closes.length < 5) return null;

  const meta = resObj.meta || {};
  const lastClose = meta.regularMarketPrice || closes[closes.length - 1];
  // Sync latest bar close with live regularMarketPrice if present
  closes[closes.length - 1] = lastClose;

  const prevClose = closes.length >= 2 ? closes[closes.length - 2] : meta.chartPreviousClose || lastClose;
  const changePct = prevClose ? ((lastClose - prevClose) / prevClose) * 100 : 0;

  const lastVol = meta.regularMarketVolume || volumes[volumes.length - 1] || 0;
  const lastOpen = opens[opens.length - 1] || lastClose;
  const lastHigh = meta.regularMarketDayHigh || highs[highs.length - 1] || lastClose;
  const lastLow = meta.regularMarketDayLow || lows[lows.length - 1] || lastClose;

  const ema20Series = calcEMASeries(closes, 20);
  const ema50Series = calcEMASeries(closes, 50);
  const ema200Series = calcEMASeries(closes, 200);
  const ema20 = ema20Series.length ? ema20Series[ema20Series.length - 1] : null;
  const ema50 = ema50Series.length ? ema50Series[ema50Series.length - 1] : null;
  const ema200 = ema200Series.length ? ema200Series[ema200Series.length - 1] : null;

  const sma20 = calcSMA(closes, 20);
  const sma50 = calcSMA(closes, 50);
  const sma200 = calcSMA(closes, 200);

  const rsi = calcRSI(closes, 14);
  const { macd, signal: macdSignal } = calcMACD(closes);
  const atr = calcATR(highs, lows, closes, 14);
  const adx = calcADX(highs, lows, closes, 14);
  const stoch = calcStoch(highs, lows, closes, 14, 3);
  const bb = calcBollinger(closes, 20, 2);

  const high52W = meta.fiftyTwoWeekHigh || Math.max(...highs);
  const low52W = meta.fiftyTwoWeekLow || Math.min(...lows);

  return {
    ticker: yfSymbol,
    symbol: entry.symbol,
    name: entry.name || meta.shortName || meta.longName || entry.symbol,
    market,
    close: Number(lastClose.toFixed(lastClose >= 1 ? 2 : 4)),
    changePct: Number(changePct.toFixed(2)),
    volume: lastVol,
    valueTraded: Math.round(lastClose * lastVol),
    marketCap: null,
    pe: null,
    pb: null,
    dividendYield: null,
    roe: null,
    debtToEquity: null,
    rsi: rsi !== null ? Number(rsi.toFixed(2)) : null,
    macd: macd !== null ? Number(macd.toFixed(3)) : null,
    macdSignal: macdSignal !== null ? Number(macdSignal.toFixed(3)) : null,
    stochK: stoch.k !== null ? Number(stoch.k.toFixed(2)) : null,
    stochD: stoch.d !== null ? Number(stoch.d.toFixed(2)) : null,
    adx: adx !== null ? Number(adx.toFixed(2)) : null,
    atr: atr !== null ? Number(atr.toFixed(4)) : null,
    bbLower: bb.lower !== null ? Number(bb.lower.toFixed(4)) : null,
    bbUpper: bb.upper !== null ? Number(bb.upper.toFixed(4)) : null,
    ema20: ema20 !== null ? Number(ema20.toFixed(4)) : null,
    ema50: ema50 !== null ? Number(ema50.toFixed(4)) : null,
    ema200: ema200 !== null ? Number(ema200.toFixed(4)) : null,
    sma20: sma20 !== null ? Number(sma20.toFixed(4)) : null,
    sma50: sma50 !== null ? Number(sma50.toFixed(4)) : null,
    sma200: sma200 !== null ? Number(sma200.toFixed(4)) : null,
    tvRecommendAll: null,
    tvRecommendMA: null,
    tvRecommendOsc: null,
    high: lastHigh,
    low: lastLow,
    open: lastOpen,
    high52W,
    low52W,
    perfW: calcPerf(closes, 5),
    perf1M: calcPerf(closes, 21),
    perf3M: calcPerf(closes, 63),
    perf6M: calcPerf(closes, 126),
    perf1Y: calcPerf(closes, 250),
    sector: entry.sector || meta.instrumentType || '',
    exchange: meta.exchangeName || (market === 'bist' ? 'BIST' : market === 'crypto' ? 'CRYPTO' : 'NASDAQ'),
    currency: meta.currency || (market === 'bist' ? 'TRY' : 'USD'),
  };
}

async function fetchYahooScreenerFallback(market, cleanSearch) {
  let baseList =
    market === 'bist'
      ? BIST_UNIVERSE
      : market === 'us'
      ? US_UNIVERSE
      : CRYPTO_UNIVERSE;

  let targets = baseList;
  if (cleanSearch) {
    const q = cleanSearch.toUpperCase();
    const matched = baseList.filter(
      (item) =>
        item.symbol.toUpperCase().includes(q) || item.name.toUpperCase().includes(q)
    );
    if (matched.length > 0) {
      targets = matched;
    } else {
      // Query the raw searched ticker directly from Yahoo Finance
      const rawSym = q.replace(/\.IS$/, '').replace(/-USD$/, '');
      targets = [
        {
          symbol: market === 'crypto' && !rawSym.endsWith('USDT') ? `${rawSym}USDT` : rawSym,
          name: rawSym,
          sector: market === 'bist' ? 'BIST Hisse' : market === 'crypto' ? 'Kripto' : 'US Hisse',
        },
      ];
    }
  }

  // Concurrency 8 batched fetch
  const results = [];
  const batchSize = 8;
  for (let i = 0; i < targets.length; i += batchSize) {
    const slice = targets.slice(i, i + batchSize);
    const chunk = await Promise.all(slice.map((entry) => fetchYahooScreenerItem(entry, market)));
    for (const row of chunk) {
      if (row) results.push(row);
    }
  }

  // Sort by Value Traded descending
  results.sort((a, b) => (b.valueTraded || 0) - (a.valueTraded || 0));
  return enrichWithYahooQuotes(results, market);
}

function mapTvRow(item, market) {
  if (!item || !Array.isArray(item.d)) return null;
  const d = item.d;
  const val = (i) => (d[i] !== undefined && d[i] !== null ? d[i] : null);
  const num = (i) => (typeof d[i] === 'number' && Number.isFinite(d[i]) ? d[i] : null);

  return {
    ticker: item.s || val(0),
    symbol: String(val(0) || ''),
    name: String(val(1) || val(0) || ''),
    market,
    close: num(2) ?? 0,
    changePct: num(3) ?? 0,
    volume: num(4) ?? 0,
    valueTraded: num(5) ?? 0,
    marketCap: num(6),
    pe: num(7),
    pb: num(8),
    dividendYield: num(9),
    roe: num(10),
    debtToEquity: num(11),
    rsi: num(12),
    macd: num(13),
    macdSignal: num(14),
    stochK: num(15),
    stochD: num(16),
    adx: num(17),
    atr: num(18),
    bbLower: num(19),
    bbUpper: num(20),
    ema20: num(21),
    ema50: num(22),
    ema200: num(23),
    sma20: num(24),
    sma50: num(25),
    sma200: num(26),
    tvRecommendAll: num(27),
    tvRecommendMA: num(28),
    tvRecommendOsc: num(29),
    high: num(30) ?? 0,
    low: num(31) ?? 0,
    open: num(32) ?? 0,
    high52W: num(33),
    low52W: num(34),
    perfW: num(35),
    perf1M: num(36),
    perf3M: num(37),
    perf6M: num(38),
    perf1Y: num(39),
    sector: String(val(40) || ''),
    exchange: String(val(41) || ''),
    currency: String(val(42) || (market === 'bist' ? 'TRY' : 'USD')),
  };
}

export async function fetchMacroOverview(force = false) {
  const now = Date.now();
  if (!force && macroCache.data && now < macroCache.expiresAt) {
    return macroCache.data;
  }

  const macroSymbols = [
    { symbol: 'XU100.IS', label: 'BIST 100', unit: '' },
    { symbol: 'USDTRY=X', label: 'Dolar (USD/TRY)', unit: '₺' },
    { symbol: 'EURTRY=X', label: 'Euro (EUR/TRY)', unit: '₺' },
    { symbol: 'GBPTRY=X', label: 'Sterlin (GBP/TRY)', unit: '₺' },
    { symbol: 'GC=F', label: 'Altın (Ons)', unit: '$' },
    { symbol: '^GSPC', label: 'S&P 500', unit: '' },
    { symbol: 'BTC-USD', label: 'Bitcoin', unit: '$' },
  ];

  const results = await Promise.all(
    macroSymbols.map(async (m) => {
      const resp = await httpRequestJson(
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(m.symbol)}?range=5d&interval=1d`
      );
      const meta = resp?.chart?.result?.[0]?.meta;
      const price = meta?.regularMarketPrice;
      const prev = meta?.chartPreviousClose || meta?.previousClose;
      if (!price) return null;
      const changePct = prev ? ((price - prev) / prev) * 100 : 0;
      return {
        symbol: m.symbol,
        label: m.label,
        unit: m.unit,
        price: Number(price),
        changePct: Number(changePct.toFixed(2)),
      };
    })
  );

  const filtered = results.filter(Boolean);

  // Compute Live Gram Altın and Çeyrek Altın based on real-time ONS Gold & USD/TRY
  const usdObj = filtered.find(r => r.symbol === 'USDTRY=X');
  const onsObj = filtered.find(r => r.symbol === 'GC=F');
  if (usdObj && onsObj && usdObj.price > 0 && onsObj.price > 0) {
    const gramPrice = (onsObj.price / 31.1034768) * usdObj.price;
    const gramChange = Number((onsObj.changePct + usdObj.changePct).toFixed(2));
    const ceyrekPrice = gramPrice * 1.635;

    // Insert Gram and Çeyrek right after Euro
    filtered.splice(3, 0, 
      {
        symbol: 'GRAM_ALTIN',
        label: 'Gram Altın',
        unit: '₺',
        price: Number(gramPrice.toFixed(2)),
        changePct: gramChange,
      },
      {
        symbol: 'CEYREK_ALTIN',
        label: 'Çeyrek Altın',
        unit: '₺',
        price: Number(Math.round(ceyrekPrice)),
        changePct: gramChange,
      }
    );
  }
  macroCache = {
    data: filtered,
    expiresAt: now + 45 * 1000,
  };
  return filtered;
}

export async function fetchStockScreener(market = 'bist', search = '', force = false) {
  const mkt = ['bist', 'us', 'crypto'].includes(market) ? market : 'bist';
  const cleanSearch = String(search || '').trim();
  const cacheKey = `${mkt}::${cleanSearch.toUpperCase()}`;
  const now = Date.now();

  const cached = SCREENER_CACHE.get(cacheKey);
  if (!force && cached && now < cached.expiresAt) {
    return cached.data;
  }

  let endpoint = 'https://scanner.tradingview.com/turkey/scan';
  const filter = [];
  let sortBy = 'Value.Traded';
  let limit = 100;

  if (mkt === 'bist') {
    endpoint = 'https://scanner.tradingview.com/turkey/scan';
    filter.push(
      { left: 'type', operation: 'in_range', right: ['stock', 'dr'] },
      { left: 'exchange', operation: 'equal', right: 'BIST' }
    );
  } else if (mkt === 'us') {
    endpoint = 'https://scanner.tradingview.com/america/scan';
    filter.push(
      { left: 'type', operation: 'in_range', right: ['stock', 'dr'] },
      { left: 'exchange', operation: 'in_range', right: ['NASDAQ', 'NYSE'] },
      { left: 'market_cap_basic', operation: 'greater', right: 10000000000 }
    );
    sortBy = 'market_cap_basic';
    limit = 60;
  } else {
    endpoint = 'https://scanner.tradingview.com/crypto/scan';
    filter.push(
      { left: 'exchange', operation: 'equal', right: 'BINANCE' },
      { left: 'name', operation: 'match', right: 'USDT$' }
    );
    sortBy = '24h_vol_cmc';
    limit = 40;
  }

  if (cleanSearch) {
    filter.push({
      left: 'name',
      operation: 'match',
      right: cleanSearch.toUpperCase(),
    });
    limit = 40;
  }

  const payload =
    mkt === 'crypto' && !cleanSearch
      ? {
          symbols: { tickers: TOP_CRYPTO_TICKERS },
          options: { lang: 'tr' },
          columns: TV_COLUMNS,
        }
      : {
          filter,
          options: { lang: 'tr' },
          markets: [mkt === 'bist' ? 'turkey' : mkt === 'us' ? 'america' : 'crypto'],
          columns: TV_COLUMNS,
          sort: { sortBy: mkt === 'crypto' ? 'close' : sortBy, sortOrder: 'desc' },
          range: [0, limit],
        };

  const tvHeaders = {
    Origin: 'https://www.tradingview.com',
    Referer: 'https://www.tradingview.com/',
  };

  const [scanResp, macro] = await Promise.all([
    httpRequestJson(endpoint, 'POST', payload, 10000, tvHeaders),
    fetchMacroOverview(force),
  ]);

  let stocks = Array.isArray(scanResp?.data)
    ? scanResp.data.map((item) => mapTvRow(item, mkt)).filter(Boolean)
    : [];

  // Fallback description match if name match returned 0 on search
  if (cleanSearch && stocks.length === 0 && scanResp !== null) {
    const descPayload = {
      ...payload,
      filter: [
        ...filter.slice(0, -1),
        { left: 'description', operation: 'match', right: cleanSearch },
      ],
    };
    const descResp = await httpRequestJson(endpoint, 'POST', descPayload, 10000, tvHeaders);
    if (Array.isArray(descResp?.data)) {
      stocks = descResp.data.map((item) => mapTvRow(item, mkt)).filter(Boolean);
    }
  }

  let dataSource = 'tradingview';

  // Automatic Yahoo Finance Quant Engine Fallback if TradingView fails (e.g. cloud IP block)
  if (stocks.length === 0) {
    stocks = await fetchYahooScreenerFallback(mkt, cleanSearch);
    dataSource = 'yahoo-quant';
  }

  const result = {
    market: mkt,
    source: dataSource,
    totalAvailable: scanResp?.totalCount || stocks.length,
    stocks,
    macro,
    updatedAt: new Date().toISOString(),
  };

  SCREENER_CACHE.set(cacheKey, {
    data: result,
    expiresAt: now + (stocks.length > 0 ? 45 : 10) * 1000,
  });

  return result;
}

export async function fetchStockChart(symbol, market = 'bist', range = '6mo', interval = '1d') {
  let cleanSym = String(symbol || '').trim().toUpperCase();
  if (!cleanSym) return null;

  let yfSymbol = cleanSym;
  if (market === 'bist' && !cleanSym.endsWith('.IS') && !cleanSym.includes('=')) {
    yfSymbol = `${cleanSym}.IS`;
  } else if (market === 'crypto') {
    yfSymbol = cleanSym.replace(/USDT$/, '-USD');
  }

  const validRanges = ['1mo', '3mo', '6mo', '1y', '2y'];
  const safeRange = validRanges.includes(range) ? range : '6mo';
  const safeInterval = ['1d', '1wk', '1h'].includes(interval) ? interval : '1d';

  const cacheKey = `${yfSymbol}::${safeRange}::${safeInterval}`;
  const now = Date.now();
  const cached = CHART_CACHE.get(cacheKey);
  if (cached && now < cached.expiresAt) {
    return cached.data;
  }

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yfSymbol)}?range=${safeRange}&interval=${safeInterval}`;
  const resp = await httpRequestJson(url);
  const resObj = resp?.chart?.result?.[0];

  if (!resObj || !Array.isArray(resObj.timestamp)) {
    return null;
  }

  const timestamps = resObj.timestamp;
  const quote = resObj.indicators?.quote?.[0] || {};
  const candles = [];

  for (let i = 0; i < timestamps.length; i++) {
    const o = quote.open?.[i];
    const h = quote.high?.[i];
    const l = quote.low?.[i];
    const c = quote.close?.[i];
    const v = quote.volume?.[i] ?? 0;
    if (
      typeof o === 'number' &&
      typeof h === 'number' &&
      typeof l === 'number' &&
      typeof c === 'number' &&
      Number.isFinite(c)
    ) {
      candles.push({
        time: timestamps[i],
        open: Number(o.toFixed(4)),
        high: Number(h.toFixed(4)),
        low: Number(l.toFixed(4)),
        close: Number(c.toFixed(4)),
        volume: Number(v || 0),
      });
    }
  }

  const result = {
    symbol: cleanSym,
    yfSymbol,
    currency: resObj.meta?.currency || (market === 'bist' ? 'TRY' : 'USD'),
    regularMarketPrice: resObj.meta?.regularMarketPrice || candles[candles.length - 1]?.close || 0,
    previousClose: resObj.meta?.chartPreviousClose || resObj.meta?.previousClose || 0,
    candles,
  };

  CHART_CACHE.set(cacheKey, {
    data: result,
    expiresAt: now + 60 * 1000,
  });

  return result;
}

// --- DEEP INSTITUTIONAL RESEARCH ENGINE ---
// Multi-Timeframe Confluence, Candle Patterns, Volume Anomaly, Real 1Y Backtest, Analyst Consensus, Live News

function evaluateTimeframeSnapshot(candles, timeframeLabel) {
  if (!candles || candles.length < 25) {
    return {
      timeframe: timeframeLabel,
      signal: 'NÖTR',
      trend: 'YATAY',
      score: 50,
      rsi: null,
      macd: null,
      macdSignal: null,
      ema20: null,
      ema50: null,
      adx: null,
    };
  }
  const closes = candles.map((c) => c.close);
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);
  const lastClose = closes[closes.length - 1];

  const rsi = calcRSI(closes, 14);
  const { macd, signal: macdSignal } = calcMACD(closes);
  const adx = calcADX(highs, lows, closes, 14);
  const ema20Arr = calcEMASeries(closes, 20);
  const ema50Arr = calcEMASeries(closes, 50);
  const ema20 = ema20Arr.length ? ema20Arr[ema20Arr.length - 1] : null;
  const ema50 = ema50Arr.length ? ema50Arr[ema50Arr.length - 1] : null;

  let score = 50;
  if (ema20 !== null) score += lastClose > ema20 ? 12 : -12;
  if (ema50 !== null) score += lastClose > ema50 ? 12 : -12;
  if (ema20 !== null && ema50 !== null) score += ema20 > ema50 ? 6 : -6;
  if (macd !== null && macdSignal !== null) score += macd > macdSignal ? 10 : -10;
  if (rsi !== null) {
    if (rsi <= 33) score += 10;
    else if (rsi >= 48 && rsi <= 68) score += 6;
    else if (rsi > 75) score -= 8;
  }
  score = Math.max(0, Math.min(100, Math.round(score)));

  let signal = 'NÖTR';
  if (score >= 76) signal = 'GÜÇLÜ AL';
  else if (score >= 60) signal = 'AL';
  else if (score <= 26) signal = 'GÜÇLÜ SAT';
  else if (score <= 42) signal = 'SAT';

  const trend =
    ema20 !== null && lastClose > ema20 && (ema50 === null || ema20 >= ema50)
      ? 'YÜKSELİŞ'
      : ema20 !== null && lastClose < ema20 && (ema50 === null || ema20 <= ema50)
      ? 'DÜŞÜŞ'
      : 'YATAY';

  return {
    timeframe: timeframeLabel,
    signal,
    trend,
    score,
    rsi: rsi !== null ? Number(rsi.toFixed(1)) : null,
    macd: macd !== null ? Number(macd.toFixed(3)) : null,
    macdSignal: macdSignal !== null ? Number(macdSignal.toFixed(3)) : null,
    ema20: ema20 !== null ? Number(ema20.toFixed(3)) : null,
    ema50: ema50 !== null ? Number(ema50.toFixed(3)) : null,
    adx: adx !== null ? Number(adx.toFixed(1)) : null,
  };
}

function detectPatternsAndVolume(candles) {
  const patterns = [];
  if (!candles || candles.length < 22) {
    return { volumeRatio: 1, patterns };
  }

  const len = candles.length;
  const last = candles[len - 1];
  const prev = candles[len - 2];

  // 20-day average volume (excluding last partial/current bar to avoid skew)
  const prev20Vols = candles.slice(len - 21, len - 1).map((c) => c.volume || 0);
  const avgVol20 = prev20Vols.reduce((s, v) => s + v, 0) / Math.max(1, prev20Vols.length);
  const volumeRatio = avgVol20 > 0 ? Number((last.volume / avgVol20).toFixed(2)) : 1;

  if (volumeRatio >= 1.75) {
    patterns.push({
      name: `Hacim Patlaması (${volumeRatio}x Ortalama)`,
      bias: last.close >= last.open ? 'bull' : 'bear',
      description:
        last.close >= last.open
          ? '20 günlük ortalamanın üzerinde güçlü alıcı hacmiyle kırılım teyidi.'
          : 'Ortalamanın çok üzerinde satıcı ağırlıklı hacim baskısı tespit edildi.',
    });
  } else if (volumeRatio <= 0.55) {
    patterns.push({
      name: `Hacim Daralması (${volumeRatio}x Ortalama)`,
      bias: 'neutral',
      description: 'Düşük hacimle sıkışma; yön kırılımı öncesi bekle-gör evresi.',
    });
  }

  const body = Math.abs(last.close - last.open);
  const range = Math.max(0.0001, last.high - last.low);
  const upperWick = last.high - Math.max(last.open, last.close);
  const lowerWick = Math.min(last.open, last.close) - last.low;
  const prevBody = Math.abs(prev.close - prev.open);

  // Bullish Engulfing
  if (
    prev.close < prev.open &&
    last.close > last.open &&
    last.open <= prev.close &&
    last.close >= prev.open &&
    body > prevBody * 0.9
  ) {
    patterns.push({
      name: 'Yutan Boğa (Bullish Engulfing)',
      bias: 'bull',
      description: 'Son yeşil mum önceki düşüş mumunu tamamen yutarak alıcı dönüşü veriyor.',
    });
  }

  // Bearish Engulfing
  if (
    prev.close > prev.open &&
    last.close < last.open &&
    last.open >= prev.close &&
    last.close <= prev.open &&
    body > prevBody * 0.9
  ) {
    patterns.push({
      name: 'Yutan Ayı (Bearish Engulfing)',
      bias: 'bear',
      description: 'Satış mumu önceki alım mumunu örttü; kısa vadeli kâr realizasyonu riski.',
    });
  }

  // Hammer
  if (lowerWick > body * 2 && upperWick < body * 0.6 && body > 0) {
    patterns.push({
      name: 'Çekiç Formasyonu (Hammer)',
      bias: 'bull',
      description: 'Gün içi dip seviyelerden gelen alımlarla alt fitil uzadı, destek savunuluyor.',
    });
  }

  // Shooting Star
  if (upperWick > body * 2 && lowerWick < body * 0.6 && body > 0) {
    patterns.push({
      name: 'Kayan Yıldız (Shooting Star)',
      bias: 'bear',
      description: 'Yukarı denemede dirençten satış geldi ve üst fitil uzun kaldı.',
    });
  }

  // Doji
  if (body / range < 0.12) {
    patterns.push({
      name: 'Kararsızlık Doji Mumu',
      bias: 'neutral',
      description: 'Alıcı ve satıcı dengede; sıradaki mum yönü belirleyecek.',
    });
  }

  // 3 White Soldiers / Momentum Streak
  if (len >= 4) {
    const c1 = candles[len - 3];
    const c2 = candles[len - 2];
    const c3 = candles[len - 1];
    if (c1.close > c1.open && c2.close > c2.open && c3.close > c3.open && c3.close > c2.close && c2.close > c1.close) {
      patterns.push({
        name: '3 Beyaz Asker (Momentum Serisi)',
        bias: 'bull',
        description: 'Üst üste 3 gün artan kapanışla kurumsal alım ivmesi sürüyor.',
      });
    } else if (c1.close < c1.open && c2.close < c2.open && c3.close < c3.open && c3.close < c2.close && c2.close < c1.close) {
      patterns.push({
        name: '3 Siyah Karga (Satış Baskısı)',
        bias: 'bear',
        description: 'Üst üste 3 gün düşen kapanışla kısa vade satıcı hâkimiyeti.',
      });
    }
  }

  return { volumeRatio, patterns };
}

function runHistoricalBacktest(candles) {
  if (!candles || candles.length < 80) {
    return null;
  }

  const closes = candles.map((c) => c.close);
  const ema20Arr = calcEMASeries(closes, 20);
  const ema50Arr = calcEMASeries(closes, 50);

  // Precompute rolling RSI & MACD step-by-step without lookahead
  let inPos = false;
  let entryIdx = -1;
  let entryPrice = 0;

  let equity = 100;
  let peakEquity = 100;
  let maxDrawdown = 0;
  const trades = [];

  for (let i = 55; i < candles.length - 1; i++) {
    const c = candles[i];
    const slice = closes.slice(0, i + 1);
    const rsiVal = calcRSI(slice, 14);
    const { macd, signal } = calcMACD(slice);
    const ema20 = ema20Arr[i];
    const ema50 = ema50Arr[i];

    if (!inPos) {
      const trendUp = ema20 !== null && c.close > ema20 && (ema50 === null || ema20 >= ema50 * 0.99);
      const macdBull = macd !== null && signal !== null ? macd > signal : true;
      const rsiHealthy = rsiVal !== null ? rsiVal >= 42 && rsiVal <= 68 : false;
      const rsiBounce = rsiVal !== null && rsiVal <= 34;

      if ((trendUp && macdBull && rsiHealthy) || rsiBounce) {
        inPos = true;
        entryIdx = i;
        entryPrice = c.close;
      }
    } else {
      const barsHeld = i - entryIdx;
      const pct = ((c.close - entryPrice) / entryPrice) * 100;
      let exitReason = null;

      if (pct >= 10) exitReason = 'Hedef Kâr (+10%)';
      else if (pct <= -5) exitReason = 'Stop-Loss (-5%)';
      else if (ema20 !== null && c.close < ema20 && barsHeld >= 3) exitReason = 'EMA20 Altı Kırılım';
      else if (barsHeld >= 20) exitReason = 'Süre Sonu (20 Bar)';

      if (exitReason || i === candles.length - 2) {
        const netPct = Number(pct.toFixed(2));
        equity = equity * (1 + netPct / 100);
        if (equity > peakEquity) peakEquity = equity;
        const dd = ((peakEquity - equity) / peakEquity) * 100;
        if (dd > maxDrawdown) maxDrawdown = dd;

        trades.push({
          entryDate: new Date(candles[entryIdx].time * 1000).toISOString().slice(0, 10),
          exitDate: new Date(c.time * 1000).toISOString().slice(0, 10),
          entryPrice: Number(entryPrice.toFixed(2)),
          exitPrice: Number(c.close.toFixed(2)),
          returnPct: netPct,
          reason: exitReason || 'Açık Pozisyon Simülasyonu',
        });
        inPos = false;
      }
    }
  }

  const wins = trades.filter((t) => t.returnPct > 0);
  const losses = trades.filter((t) => t.returnPct <= 0);
  const grossWin = wins.reduce((s, t) => s + t.returnPct, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.returnPct, 0));

  const firstBar = candles[55].close;
  const lastBar = candles[candles.length - 1].close;
  const buyHoldPct = firstBar > 0 ? ((lastBar - firstBar) / firstBar) * 100 : 0;

  return {
    strategyName: 'Quant Trend + RSI Geri Çekilme (Son 1 Yıl)',
    totalTrades: trades.length,
    wins: wins.length,
    winRate: trades.length > 0 ? Number(((wins.length / trades.length) * 100).toFixed(1)) : 0,
    avgReturnPct:
      trades.length > 0
        ? Number((trades.reduce((s, t) => s + t.returnPct, 0) / trades.length).toFixed(2))
        : 0,
    profitFactor: grossLoss > 0 ? Number((grossWin / grossLoss).toFixed(2)) : grossWin > 0 ? 9.9 : 1,
    strategyReturnPct: Number((equity - 100).toFixed(2)),
    buyHoldReturnPct: Number(buyHoldPct.toFixed(2)),
    maxDrawdownPct: Number(maxDrawdown.toFixed(2)),
    recentTrades: trades.slice(-6).reverse(),
  };
}

function classifyNewsSentiment(title) {
  const t = String(title || '').toLowerCase();
  const bullWords = [
    'rekor',
    'artış',
    'yükseliş',
    'büyüme',
    'kâr',
    'karını',
    'ihale',
    'anlaşma',
    'temettü',
    'hedef fiyat',
    'al önerisi',
    'endeks üzeri',
    'onay',
    'yatırım',
    'rally',
    'surge',
    'beat',
    'upgrade',
    'record',
    'growth',
    'bullish',
    'breakout',
  ];
  const bearWords = [
    'zarar',
    'düşüş',
    'gerileme',
    'ceza',
    'soruşturma',
    'dava',
    'borç',
    'iflas',
    'satış baskısı',
    'hedef düşür',
    'sat tavsiyesi',
    'risk',
    'drop',
    'plunge',
    'miss',
    'downgrade',
    'lawsuit',
    'cut',
    'bearish',
    'selloff',
  ];
  let score = 0;
  for (const w of bullWords) if (t.includes(w)) score += 1;
  for (const w of bearWords) if (t.includes(w)) score -= 1;
  if (score > 0) return 'Pozitif';
  if (score < 0) return 'Negatif';
  return 'Nötr';
}

function decodeXmlEntities(str) {
  return String(str || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

async function fetchStockNews(cleanSym, yfSymbol, market) {
  const items = [];

  // 1. Yahoo Search News (great for US & Crypto)
  if (market !== 'bist') {
    try {
      const yUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(
        yfSymbol
      )}&quotesCount=1&newsCount=6`;
      const yResp = await httpRequestJson(yUrl, 'GET', null, 7000);
      const yNews = yResp?.news || [];
      for (const n of yNews) {
        if (!n?.title || !n?.link) continue;
        items.push({
          title: n.title,
          link: n.link,
          publisher: n.publisher || 'Yahoo Finance',
          publishedAt: n.providerPublishTime
            ? new Date(n.providerPublishTime * 1000).toISOString()
            : new Date().toISOString(),
          sentiment: classifyNewsSentiment(n.title),
        });
      }
    } catch {}
  }

  // 2. Google News Turkish RSS (essential for BIST & Turkish macro/crypto news)
  if (items.length < 4) {
    try {
      const query =
        market === 'bist'
          ? `${cleanSym} hisse borsa`
          : market === 'crypto'
          ? `${cleanSym.replace(/USDT$/, '')} kripto`
          : `${cleanSym} stock`;
      const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(
        query
      )}&hl=tr&gl=TR&ceid=TR:tr`;
      const r = await httpRequestRaw(rssUrl, 8000);
      if (r.status === 200 && r.body) {
        const matches = [...r.body.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 6);
        for (const m of matches) {
          const block = m[1];
          const titleRaw = block.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '';
          const linkRaw = block.match(/<link>([\s\S]*?)<\/link>/)?.[1] || '';
          const pubRaw = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || '';
          const srcRaw = block.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] || 'Piyasa Haberleri';
          const title = decodeXmlEntities(titleRaw);
          if (!title) continue;
          items.push({
            title,
            link: decodeXmlEntities(linkRaw),
            publisher: decodeXmlEntities(srcRaw),
            publishedAt: pubRaw ? new Date(pubRaw).toISOString() : new Date().toISOString(),
            sentiment: classifyNewsSentiment(title),
          });
        }
      }
    } catch {}
  }

  return items.slice(0, 6);
}

async function fetchStockKapAnnouncements(cleanSym, market) {
  const items = [];
  try {
    let query = '';
    if (market === 'bist') {
      query = `KAP ${cleanSym} OR "Kamuyu Aydınlatma" ${cleanSym}`;
    } else if (market === 'us') {
      query = `${cleanSym} stock SEC filing OR earnings OR press release`;
    } else {
      query = `${cleanSym.replace(/USDT$/, '')} protocol OR upgrade OR announcement`;
    }

    const hl = market === 'bist' ? 'tr' : 'en-US';
    const gl = market === 'bist' ? 'TR' : 'US';
    const ceid = market === 'bist' ? 'TR:tr' : 'US:en';
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(
      query
    )}&hl=${hl}&gl=${gl}&ceid=${ceid}`;

    const r = await httpRequestRaw(rssUrl, 7000);
    if (r.status === 200 && r.body) {
      const matches = [...r.body.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 8);
      let idx = 0;
      for (const m of matches) {
        idx++;
        const block = m[1];
        const titleRaw = block.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '';
        const linkRaw = block.match(/<link>([\s\S]*?)<\/link>/)?.[1] || '';
        const pubRaw = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || '';
        const srcRaw = block.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] || 'KAP Duyurusu';
        let title = decodeXmlEntities(titleRaw);
        if (!title) continue;

        title = title.replace(/\s*-\s*[^-]+$/, '').trim();

        let category = 'KAP Bildirimi';
        const low = title.toLowerCase();
        if (low.includes('özel durum') || low.includes('ozel durum')) {
          category = 'Özel Durum';
        } else if (
          low.includes('finansal rapor') ||
          low.includes('bilanço') ||
          low.includes('bilanco') ||
          low.includes('kar') ||
          low.includes('zarar')
        ) {
          category = 'Finansal Rapor';
        } else if (
          low.includes('temettü') ||
          low.includes('temettu') ||
          low.includes('pay') ||
          low.includes('sermaye') ||
          low.includes('bedelsiz') ||
          low.includes('dividend')
        ) {
          category = 'Temettü / Sermaye';
        } else if (low.includes('genel kurul')) {
          category = 'Genel Kurul';
        } else if (low.includes('kredi') || low.includes('derecelendirme') || low.includes('not')) {
          category = 'Kredi / Not';
        } else if (
          low.includes('viop') ||
          low.includes('işlem iptali') ||
          low.includes('pay alım') ||
          low.includes('geri alım')
        ) {
          category = 'Piyasa Duyurusu';
        }

        items.push({
          id: `kap-${cleanSym}-${idx}`,
          title,
          link: decodeXmlEntities(linkRaw),
          publisher: decodeXmlEntities(srcRaw),
          publishedAt: pubRaw ? new Date(pubRaw).toISOString() : new Date().toISOString(),
          category,
        });
      }
    }
  } catch {}
  return items;
}

async function fetchYahooDeepFinancials(yfSymbol, currentPrice) {
  try {
    const sess = await getYahooSession();
    if (!sess) return { financials: null, calendar: null };
    const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(
      yfSymbol
    )}?modules=financialData,defaultKeyStatistics,calendarEvents&crumb=${encodeURIComponent(sess.crumb)}`;
    const r = await httpRequestRaw(url, 8000, { Cookie: sess.cookie });
    if (r.status !== 200 || !r.body) return { financials: null, calendar: null };
    const res = JSON.parse(r.body)?.quoteSummary?.result?.[0];
    if (!res) return { financials: null, calendar: null };

    const fd = res.financialData || {};
    const ks = res.defaultKeyStatistics || {};
    const ce = res.calendarEvents || {};
    const numRaw = (obj) => (typeof obj?.raw === 'number' && Number.isFinite(obj.raw) ? obj.raw : null);

    const targetMean = numRaw(fd.targetMeanPrice);
    const upsidePct =
      targetMean && currentPrice > 0
        ? Number((((targetMean - currentPrice) / currentPrice) * 100).toFixed(1))
        : null;

    const earningsDateFmt = ce.earnings?.earningsDate?.[0]?.fmt || null;
    const exDividendDateFmt = ce.exDividendDate?.fmt || null;
    const dividendDateFmt = ce.dividendDate?.fmt || null;

    const calendar = {
      nextEarningsDate: earningsDateFmt,
      earningsAverage: numRaw(ce.earnings?.earningsAverage),
      earningsLow: numRaw(ce.earnings?.earningsLow),
      earningsHigh: numRaw(ce.earnings?.earningsHigh),
      revenueAverage: numRaw(ce.earnings?.revenueAverage),
      exDividendDate: exDividendDateFmt,
      dividendDate: dividendDateFmt,
    };

    const financials = {
      targetLowPrice: numRaw(fd.targetLowPrice),
      targetMeanPrice: targetMean,
      targetHighPrice: numRaw(fd.targetHighPrice),
      upsidePct,
      recommendationKey: fd.recommendationKey || null,
      numberOfAnalystOpinions: numRaw(fd.numberOfAnalystOpinions),
      returnOnEquityPct: numRaw(fd.returnOnEquity) !== null ? Number((numRaw(fd.returnOnEquity) * 100).toFixed(1)) : null,
      profitMarginsPct: numRaw(fd.profitMargins) !== null ? Number((numRaw(fd.profitMargins) * 100).toFixed(1)) : null,
      operatingMarginsPct: numRaw(fd.operatingMargins) !== null ? Number((numRaw(fd.operatingMargins) * 100).toFixed(1)) : null,
      revenueGrowthPct: numRaw(fd.revenueGrowth) !== null ? Number((numRaw(fd.revenueGrowth) * 100).toFixed(1)) : null,
      earningsGrowthPct: numRaw(fd.earningsGrowth) !== null ? Number((numRaw(fd.earningsGrowth) * 100).toFixed(1)) : null,
      debtToEquity: numRaw(fd.debtToEquity) !== null ? Number(numRaw(fd.debtToEquity).toFixed(1)) : null,
      currentRatio: numRaw(fd.currentRatio) !== null ? Number(numRaw(fd.currentRatio).toFixed(2)) : null,
      forwardPE: numRaw(ks.forwardPE) !== null ? Number(numRaw(ks.forwardPE).toFixed(2)) : null,
      beta: numRaw(ks.beta) !== null ? Number(numRaw(ks.beta).toFixed(2)) : null,
    };

    return { financials, calendar };
  } catch {
    return { financials: null, calendar: null };
  }
}

export async function fetchStockDeepAnalysis(symbol, market = 'bist') {
  const cleanSym = String(symbol || '').trim().toUpperCase();
  if (!cleanSym) return null;

  const cacheKey = `${cleanSym}::${market}`;
  const now = Date.now();
  const cached = DEEP_CACHE.get(cacheKey);
  if (cached && now < cached.expiresAt) {
    return cached.data;
  }

  let yfSymbol = cleanSym;
  if (market === 'bist' && !cleanSym.endsWith('.IS') && !cleanSym.includes('=')) {
    yfSymbol = `${cleanSym}.IS`;
  } else if (market === 'crypto') {
    yfSymbol = cleanSym.replace(/USDT$/, '-USD');
  }

  const [chart1h, chart1d, chart1wk, news, kap] = await Promise.all([
    fetchStockChart(cleanSym, market, '1mo', '1h'),
    fetchStockChart(cleanSym, market, '1y', '1d'),
    fetchStockChart(cleanSym, market, '2y', '1wk'),
    fetchStockNews(cleanSym, yfSymbol, market),
    fetchStockKapAnnouncements(cleanSym, market),
  ]);

  const currentPrice = chart1d?.regularMarketPrice || chart1h?.regularMarketPrice || 0;
  const finObj = market === 'crypto' ? null : await fetchYahooDeepFinancials(yfSymbol, currentPrice);

  const mtf = [
    evaluateTimeframeSnapshot(chart1h?.candles, '1 Saatlik (Kısa)'),
    evaluateTimeframeSnapshot(chart1d?.candles, 'Günlük (Ana)'),
    evaluateTimeframeSnapshot(chart1wk?.candles, 'Haftalık (Uzun)'),
  ];

  const bullCount = mtf.filter((m) => m.signal === 'AL' || m.signal === 'GÜÇLÜ AL').length;
  const bearCount = mtf.filter((m) => m.signal === 'SAT' || m.signal === 'GÜÇLÜ SAT').length;
  const mtfScore = Math.round(mtf.reduce((s, m) => s + m.score, 0) / mtf.length);

  const patternAnalysis = detectPatternsAndVolume(chart1d?.candles);
  const backtest = runHistoricalBacktest(chart1d?.candles);

  const deepData = {
    symbol: cleanSym,
    market,
    yfSymbol,
    mtf,
    mtfSummary: {
      bullCount,
      bearCount,
      mtfScore,
      alignment:
        bullCount === 3
          ? '3/3 Tam Boğa Uyumu'
          : bullCount === 2
          ? '2/3 Yukarı Eğilim'
          : bearCount === 3
          ? '3/3 Tam Ayı Uyumu'
          : bearCount === 2
          ? '2/3 Aşağı Baskı'
          : 'Karışık / Konsolidasyon',
    },
    volumeRatio: patternAnalysis.volumeRatio,
    patterns: patternAnalysis.patterns,
    backtest,
    financials: finObj?.financials || null,
    calendar: finObj?.calendar || null,
    news,
    kap: kap || [],
    updatedAt: new Date().toISOString(),
  };

  DEEP_CACHE.set(cacheKey, {
    data: deepData,
    expiresAt: now + 60 * 1000,
  });

  return deepData;
}

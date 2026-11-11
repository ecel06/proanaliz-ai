// server/stockService.js
// Live Institutional Stock & Technical Screener Data Service (BIST, US NASDAQ/NYSE, Crypto, Macro)

import https from 'https';

const SCREENER_CACHE = new Map(); // key -> { data, expiresAt }
const CHART_CACHE = new Map(); // key -> { data, expiresAt }
let macroCache = { data: null, expiresAt: 0 };

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

function httpRequestJson(url, method = 'GET', body = null, timeoutMs = 12000) {
  return new Promise((resolve) => {
    const req = https.request(
      url,
      {
        method,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          Accept: 'application/json, text/plain, */*',
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
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
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
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
    { symbol: 'USDTRY=X', label: 'USD/TRY', unit: '₺' },
    { symbol: 'EURTRY=X', label: 'EUR/TRY', unit: '₺' },
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

  const TOP_CRYPTO_TICKERS = [
    'BINANCE:BTCUSDT',
    'BINANCE:ETHUSDT',
    'BINANCE:SOLUSDT',
    'BINANCE:BNBUSDT',
    'BINANCE:XRPUSDT',
    'BINANCE:AVAXUSDT',
    'BINANCE:DOGEUSDT',
    'BINANCE:ADAUSDT',
    'BINANCE:LINKUSDT',
    'BINANCE:SUIUSDT',
    'BINANCE:TRXUSDT',
    'BINANCE:DOTUSDT',
    'BINANCE:NEARUSDT',
    'BINANCE:LTCUSDT',
    'BINANCE:UNIUSDT',
    'BINANCE:AAVEUSDT',
    'BINANCE:ARBUSDT',
    'BINANCE:OPUSDT',
    'BINANCE:APTUSDT',
    'BINANCE:RENDERUSDT',
    'BINANCE:FETUSDT',
    'BINANCE:PEPEUSDT',
    'BINANCE:SHIBUSDT',
    'BINANCE:TONUSDT',
  ];

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

  const [scanResp, macro] = await Promise.all([
    httpRequestJson(endpoint, 'POST', payload),
    fetchMacroOverview(force),
  ]);

  let stocks = Array.isArray(scanResp?.data)
    ? scanResp.data.map((item) => mapTvRow(item, mkt)).filter(Boolean)
    : [];

  // Fallback description match if name match returned 0 on search
  if (cleanSearch && stocks.length === 0) {
    const descPayload = {
      ...payload,
      filter: [
        ...filter.slice(0, -1),
        { left: 'description', operation: 'match', right: cleanSearch },
      ],
    };
    const descResp = await httpRequestJson(endpoint, 'POST', descPayload);
    if (Array.isArray(descResp?.data)) {
      stocks = descResp.data.map((item) => mapTvRow(item, mkt)).filter(Boolean);
    }
  }

  const result = {
    market: mkt,
    totalAvailable: scanResp?.totalCount || stocks.length,
    stocks,
    macro,
    updatedAt: new Date().toISOString(),
  };

  SCREENER_CACHE.set(cacheKey, {
    data: result,
    expiresAt: now + 25 * 1000,
  });

  return result;
}

export async function fetchStockChart(symbol, market = 'bist', range = '6mo', interval = '1d') {
  let cleanSym = String(symbol || '').trim().toUpperCase();
  if (!cleanSym) return null;

  // Map to Yahoo Finance symbol format
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

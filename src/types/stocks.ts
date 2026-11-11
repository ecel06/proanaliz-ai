// src/types/stocks.ts

export type StockMarketType = 'bist' | 'us' | 'crypto';

export interface MacroTicker {
  symbol: string;
  label: string;
  unit: string;
  price: number;
  changePct: number;
}

export interface StockItem {
  ticker: string;
  symbol: string;
  name: string;
  market: StockMarketType;
  close: number;
  changePct: number;
  volume: number;
  valueTraded: number;
  marketCap: number | null;
  pe: number | null; // F/K
  pb: number | null; // PD/DD
  dividendYield: number | null;
  roe: number | null; // Özsermaye Kârlılığı %
  debtToEquity: number | null;
  rsi: number | null;
  macd: number | null;
  macdSignal: number | null;
  stochK: number | null;
  stochD: number | null;
  adx: number | null;
  atr: number | null;
  bbLower: number | null;
  bbUpper: number | null;
  ema20: number | null;
  ema50: number | null;
  ema200: number | null;
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  tvRecommendAll: number | null;
  tvRecommendMA: number | null;
  tvRecommendOsc: number | null;
  high: number;
  low: number;
  open: number;
  high52W: number | null;
  low52W: number | null;
  perfW: number | null;
  perf1M: number | null;
  perf3M: number | null;
  perf6M: number | null;
  perf1Y: number | null;
  sector: string;
  exchange: string;
  currency: string;
}

export interface StockCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockChartResponse {
  symbol: string;
  yfSymbol: string;
  currency: string;
  regularMarketPrice: number;
  previousClose: number;
  candles: StockCandle[];
}

export interface StockScreenerResponse {
  success: boolean;
  market: StockMarketType;
  totalAvailable: number;
  stocks: StockItem[];
  macro: MacroTicker[];
  updatedAt: string;
}

export type StockSignalType = 'GÜÇLÜ AL' | 'AL' | 'TUT' | 'SAT' | 'GÜÇLÜ SAT';

export interface IndicatorSignalRow {
  name: string;
  value: string;
  action: 'AL' | 'NÖTR' | 'SAT';
  note: string;
}

export interface StockQuantAnalysis {
  symbol: string;
  signal: StockSignalType;
  score: number; // 0-100 composite
  trendScore: number; // 0-100
  momentumScore: number; // 0-100
  fundamentalScore: number; // 0-100
  riskLevel: 'DÜŞÜK' | 'ORTA' | 'YÜKSEK';
  tradePlan: {
    bias: 'LONG (AL)' | 'SHORT / KAR AL' | 'BEKLE';
    entryLow: number;
    entryHigh: number;
    stopLoss: number;
    stopLossPct: number;
    tp1: number;
    tp1Pct: number;
    tp2: number;
    tp2Pct: number;
    riskReward: number;
  };
  pivots: {
    s2: number;
    s1: number;
    pivot: number;
    r1: number;
    r2: number;
    fib382: number | null;
    fib618: number | null;
  };
  indicators: IndicatorSignalRow[];
  bullReasons: string[];
  bearReasons: string[];
  summaryText: string;
}

export interface TimeframeSnapshot {
  timeframe: string;
  signal: 'GÜÇLÜ AL' | 'AL' | 'NÖTR' | 'SAT' | 'GÜÇLÜ SAT';
  trend: 'YÜKSELİŞ' | 'YATAY' | 'DÜŞÜŞ';
  score: number;
  rsi: number | null;
  macd: number | null;
  macdSignal: number | null;
  ema20: number | null;
  ema50: number | null;
  adx: number | null;
}

export interface CandlePatternItem {
  name: string;
  bias: 'bull' | 'bear' | 'neutral';
  description: string;
}

export interface BacktestTradeRecord {
  entryDate: string;
  exitDate: string;
  entryPrice: number;
  exitPrice: number;
  returnPct: number;
  reason: string;
}

export interface StockBacktestResult {
  strategyName: string;
  totalTrades: number;
  wins: number;
  winRate: number;
  avgReturnPct: number;
  profitFactor: number;
  strategyReturnPct: number;
  buyHoldReturnPct: number;
  maxDrawdownPct: number;
  recentTrades: BacktestTradeRecord[];
}

export interface StockDeepFinancials {
  targetLowPrice: number | null;
  targetMeanPrice: number | null;
  targetHighPrice: number | null;
  upsidePct: number | null;
  recommendationKey: string | null;
  numberOfAnalystOpinions: number | null;
  returnOnEquityPct: number | null;
  profitMarginsPct: number | null;
  operatingMarginsPct: number | null;
  revenueGrowthPct: number | null;
  earningsGrowthPct: number | null;
  debtToEquity: number | null;
  currentRatio: number | null;
  forwardPE: number | null;
  beta: number | null;
}

export interface StockNewsItem {
  title: string;
  link: string;
  publisher: string;
  publishedAt: string;
  sentiment: 'Pozitif' | 'Negatif' | 'Nötr';
}

export interface StockDeepAnalysis {
  symbol: string;
  market: StockMarketType;
  yfSymbol: string;
  mtf: TimeframeSnapshot[];
  mtfSummary: {
    bullCount: number;
    bearCount: number;
    mtfScore: number;
    alignment: string;
  };
  volumeRatio: number;
  patterns: CandlePatternItem[];
  backtest: StockBacktestResult | null;
  financials: StockDeepFinancials | null;
  news: StockNewsItem[];
  updatedAt: string;
}


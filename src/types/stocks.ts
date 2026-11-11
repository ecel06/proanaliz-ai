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


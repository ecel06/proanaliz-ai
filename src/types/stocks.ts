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

export interface StockKapItem {
  id: string;
  title: string;
  link: string;
  publisher: string;
  publishedAt: string;
  category:
    | 'Özel Durum'
    | 'Finansal Rapor'
    | 'Temettü / Sermaye'
    | 'Genel Kurul'
    | 'Kredi / Not'
    | 'Piyasa Duyurusu'
    | 'KAP Bildirimi';
}

export interface StockCorporateCalendar {
  nextEarningsDate: string | null;
  earningsAverage: number | null;
  earningsLow: number | null;
  earningsHigh: number | null;
  revenueAverage: number | null;
  exDividendDate: string | null;
  dividendDate: string | null;
}

export type AlertConditionType = 'price_above' | 'price_below' | 'rsi_below' | 'rsi_above';

export interface StockAlertItem {
  id: string;
  symbol: string;
  name: string;
  market: StockMarketType;
  condition: AlertConditionType;
  targetValue: number;
  initialValue?: number;
  note?: string;
  createdAt: string;
  triggered: boolean;
  triggeredAt?: string;
}

export interface StockPortfolioPosition {
  id: string;
  symbol: string;
  name: string;
  market: StockMarketType;
  units: number;
  entryPrice: number;
  currentPrice: number;
  stopLoss?: number | null;
  targetPrice?: number | null;
  entryDate: string;
  exitPrice?: number | null;
  exitDate?: string | null;
  status: 'open' | 'closed';
  notes?: string;
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
  calendar?: StockCorporateCalendar | null;
  news: StockNewsItem[];
  kap?: StockKapItem[];
  updatedAt: string;
}

// --- BIST Endeks & Universe Türleri ---
export type BistIndexType =
  | 'ALL'
  | 'BIST30'
  | 'BIST50'
  | 'BIST100'
  | 'DIVIDEND25'
  | 'XBANK'
  | 'XUSIN'
  | 'XUTEK';

// --- Halka Arz (IPO Hub) Veri Tipleri ---
export type IpoStatus = 'active' | 'upcoming' | 'recent' | 'draft';

export interface EstimatedLotItem {
  participants: number;
  participantsLabel: string;
  lots: number;
  totalCostTl: number;
}

export interface StockIpoItem {
  id: string;
  code: string; // örn: ONURT, KOTON, LILAK, HOROZ
  companyName: string;
  logoUrl?: string;
  status: IpoStatus;
  offerPrice: number; // ₺
  totalShares: number; // Toplam Lot
  totalSizeTl: number; // Toplam Halka Arz Büyüklüğü ₺
  bookBuildingDates: string; // örn: "13 - 14 - 15 Kasım 2026"
  firstTradingDate?: string; // örn: "20 Kasım 2026"
  distributionMethod: 'Eşit Dağıtım (Tamamı)' | 'Bireysele Eşit' | 'Oransal' | 'Borsada Satış - Eşit Dağıtım';
  katilimEndeksineUygun: boolean; // Helal / Faizsiz finans
  katilimNotu?: string; // Diyanet / BIST Katılım kriterleri açıklaması
  t1t2Kullanilabilir: boolean; // T1 / T2 kullanılabilir mi
  bistKod: string;
  pazar: 'Yıldız Pazar' | 'Ana Pazar' | 'Girişim Sermayesi';
  leadUnderwriter: string; // Konsorsiyum Lideri (Aracı Kurum)
  consortiumMembers: string[]; // Başvuru yapılabilecek banka & kurumlar
  useOfProceeds: { category: string; pct: number }[]; // Fon kullanım yeri
  lockupCommitment: string; // 1 Yıl ortak satışı yok taahhüdü
  // Son halka arzlar için canlı performans
  currentPrice?: number;
  initialPrice?: number;
  ceilingCount?: number; // Kaç tavan yaptı
  isCeilingBroke?: boolean;
  returnFromIpoPct?: number; // %+125.4 vb.
  // Tahmini kişi başı lot tablosu
  estimatedLotsByParticipants: EstimatedLotItem[];
}



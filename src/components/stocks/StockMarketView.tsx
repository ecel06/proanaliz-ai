// src/components/stocks/StockMarketView.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Bot,
  Briefcase,
  Calendar,
  Calculator,
  CandlestickChart,
  CheckCircle2,
  DollarSign,
  ExternalLink,
  Flame,
  Globe,
  Layers,
  Megaphone,
  Newspaper,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Lock,
  Crown,
} from 'lucide-react';
import { User } from '../../utils/authHelper';
import {
  MacroTicker,
  StockAlertItem,
  StockChartResponse,
  StockDeepAnalysis,
  StockItem,
  StockMarketType,
  StockPortfolioPosition,
  StockQuantAnalysis,
} from '../../types/stocks';
import {
  fetchStockChart,
  fetchStockDeepAnalysis,
  fetchStockScreener,
} from '../../services/stockService';
import {
  analyzeStockQuant,
  buildInstitutionalAIMemo,
  formatLargeNumber,
  formatStockPrice,
} from '../../utils/stockAnalysisEngine';
import { StockChart } from './StockChart';
import { StockAIChatModal } from './StockAIChatModal';
import { StockPerformanceModal } from './StockPerformanceModal';
import { StockAlertsModal, playAlertSound } from './StockAlertsModal';
import { StockPortfolioModal } from './StockPortfolioModal';

type PresetFilter = 'all' | 'strong_buy' | 'buy' | 'value' | 'rsi_dip' | 'sell' | 'watchlist';
type StockSort = 'ai_desc' | 'change_desc' | 'volume_desc' | 'rsi_asc' | 'pe_asc';

interface StockMarketViewProps {
  user?: User | null;
  onOpenVIP?: () => void;
  onShowToast?: (msg: string) => void;
}

export const StockMarketView: React.FC<StockMarketViewProps> = ({ user, onOpenVIP, onShowToast }) => {
  const [market, setMarket] = useState<StockMarketType>('bist');
  const [searchInput, setSearchInput] = useState<string>('');
  const [activeSearch, setActiveSearch] = useState<string>('');
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [macro, setMacro] = useState<MacroTicker[]>([]);
  const [totalAvailable, setTotalAvailable] = useState<number>(0);
  const [updatedAt, setUpdatedAt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [preset, setPreset] = useState<PresetFilter>('all');
  const [sortBy, setSortBy] = useState<StockSort>('ai_desc');
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [chartRange, setChartRange] = useState<'1mo' | '3mo' | '6mo' | '1y'>('6mo');
  const [chartData, setChartData] = useState<StockChartResponse | null>(null);
  const [chartLoading, setChartLoading] = useState<boolean>(false);
  const [deepData, setDeepData] = useState<StockDeepAnalysis | null>(null);
  const [deepLoading, setDeepLoading] = useState<boolean>(false);
  const [capitalInput, setCapitalInput] = useState<string>('100000');
  const [riskPctInput, setRiskPctInput] = useState<string>('2');
  const [isAIChatOpen, setIsAIChatOpen] = useState<boolean>(false);

  // Elite Extension Modals: Karnesi, Alarmlar, Sanal Portföy
  const [isPerformanceModalOpen, setIsPerformanceModalOpen] = useState<boolean>(false);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState<boolean>(false);
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState<boolean>(false);

  const [alerts, setAlerts] = useState<StockAlertItem[]>(() => {
    try {
      const raw = localStorage.getItem('proanaliz_stock_alerts_v1');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [portfolio, setPortfolio] = useState<StockPortfolioPosition[]>(() => {
    try {
      const raw = localStorage.getItem('proanaliz_stock_portfolio_v1');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const saveAlerts = (next: StockAlertItem[]) => {
    setAlerts(next);
    try {
      localStorage.setItem('proanaliz_stock_alerts_v1', JSON.stringify(next));
    } catch {}
  };

  const savePortfolio = (next: StockPortfolioPosition[]) => {
    setPortfolio(next);
    try {
      localStorage.setItem('proanaliz_stock_portfolio_v1', JSON.stringify(next));
    } catch {}
  };

  const activeAlertsCount = alerts.filter((a) => !a.triggered).length;
  const openPositionsCount = portfolio.filter((p) => p.status === 'open').length;

  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('proanaliz_stock_watchlist');
      return raw ? JSON.parse(raw) : ['THYAO', 'ASELS', 'TUPRS', 'NVDA', 'BTCUSDT'];
    } catch {
      return ['THYAO', 'ASELS', 'TUPRS', 'NVDA', 'BTCUSDT'];
    }
  });

  const toggleWatchlist = (sym: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setWatchlist((prev) => {
      const next = prev.includes(sym) ? prev.filter((x) => x !== sym) : [...prev, sym];
      try {
        localStorage.setItem('proanaliz_stock_watchlist', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Debounce live backend search
  useEffect(() => {
    const t = setTimeout(() => {
      setActiveSearch(searchInput.trim());
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const loadMarketData = async (mkt: StockMarketType, query: string, force = false) => {
    try {
      if (stocks.length === 0) setLoading(true);
      setErrorMsg(null);
      const resp = await fetchStockScreener(mkt, query, force);
      setStocks(resp.stocks || []);
      setMacro(resp.macro || []);
      setTotalAvailable(resp.totalAvailable || resp.stocks?.length || 0);
      setUpdatedAt(resp.updatedAt || '');
      if (resp.stocks && resp.stocks.length > 0) {
        setSelectedSymbol((prev) =>
          prev && resp.stocks.some((s) => s.symbol === prev) ? prev : resp.stocks[0].symbol
        );
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Borsa verileri yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMarketData(market, activeSearch, false);
    // Auto refresh every 45s
    const timer = setInterval(() => {
      loadMarketData(market, activeSearch, false);
    }, 45000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [market, activeSearch]);

  // Check active alerts whenever live stock data updates
  useEffect(() => {
    if (!stocks || stocks.length === 0 || alerts.length === 0) return;
    let anyTriggered = false;
    const nowStr = new Date().toISOString();
    const nextAlerts = alerts.map((a) => {
      if (a.triggered) return a;
      const s = stocks.find((item) => item.symbol === a.symbol);
      if (!s) return a;

      let triggered = false;
      if (a.condition === 'price_above' && s.close >= a.targetValue) triggered = true;
      else if (a.condition === 'price_below' && s.close <= a.targetValue) triggered = true;
      else if (a.condition === 'rsi_below' && typeof s.rsi === 'number' && s.rsi <= a.targetValue) triggered = true;
      else if (a.condition === 'rsi_above' && typeof s.rsi === 'number' && s.rsi >= a.targetValue) triggered = true;

      if (triggered) {
        anyTriggered = true;
        playAlertSound();
        onShowToast?.(`🔔 ALARM TETİKLENDİ: ${a.symbol} (${s.close.toFixed(2)}) hedefe ulaştı!`);
        return { ...a, triggered: true, triggeredAt: nowStr };
      }
      return a;
    });

    if (anyTriggered) {
      saveAlerts(nextAlerts);
    }
  }, [stocks]);

  // Update open portfolio position current prices from live stock feed
  useEffect(() => {
    if (!stocks || stocks.length === 0 || portfolio.length === 0) return;
    let changed = false;
    const nextPortfolio = portfolio.map((pos) => {
      if (pos.status !== 'open') return pos;
      const s = stocks.find((item) => item.symbol === pos.symbol);
      if (s && s.close > 0 && s.close !== pos.currentPrice) {
        changed = true;
        return { ...pos, currentPrice: s.close };
      }
      return pos;
    });
    if (changed) {
      savePortfolio(nextPortfolio);
    }
  }, [stocks]);

  const analysesMap = useMemo(() => {
    const map = new Map<string, StockQuantAnalysis>();
    stocks.forEach((s) => {
      map.set(s.symbol, analyzeStockQuant(s));
    });
    return map;
  }, [stocks]);

  const selectedStock: StockItem | null = useMemo(() => {
    return stocks.find((s) => s.symbol === selectedSymbol) || stocks[0] || null;
  }, [stocks, selectedSymbol]);

  const selectedAnalysis: StockQuantAnalysis | null = useMemo(() => {
    if (!selectedStock) return null;
    return analysesMap.get(selectedStock.symbol) || null;
  }, [selectedStock, analysesMap]);

  // Fetch OHLCV candles when selected stock or chartRange changes
  useEffect(() => {
    if (!selectedStock) return;
    let cancelled = false;
    setChartLoading(true);
    fetchStockChart(selectedStock.symbol, selectedStock.market, chartRange, '1d')
      .then((res) => {
        if (!cancelled) setChartData(res);
      })
      .finally(() => {
        if (!cancelled) setChartLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedStock?.symbol, selectedStock?.market, chartRange]);

  // Fetch Deep Research (MTF 1h/1d/1wk, Candle Patterns, Backtest, Analyst Targets, Live News)
  useEffect(() => {
    if (!selectedStock) return;
    let cancelled = false;
    setDeepLoading(true);
    setDeepData(null);
    fetchStockDeepAnalysis(selectedStock.symbol, selectedStock.market)
      .then((res) => {
        if (!cancelled) setDeepData(res);
      })
      .finally(() => {
        if (!cancelled) setDeepLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedStock?.symbol, selectedStock?.market]);

  const aiMemo = useMemo(() => {
    if (!selectedStock || !selectedAnalysis) return null;
    return buildInstitutionalAIMemo(selectedStock, selectedAnalysis, deepData);
  }, [selectedStock, selectedAnalysis, deepData]);

  const alphaHighlights = useMemo(() => {
    if (stocks.length === 0) return null;
    const byScore = [...stocks].sort(
      (a, b) => (analysesMap.get(b.symbol)?.score || 0) - (analysesMap.get(a.symbol)?.score || 0)
    );
    const byChange = [...stocks].sort((a, b) => b.changePct - a.changePct);
    const byOversold = [...stocks]
      .filter((s) => s.rsi !== null && s.rsi <= 40)
      .sort((a, b) => (a.rsi ?? 99) - (b.rsi ?? 99));
    const byVol = [...stocks].sort((a, b) => (b.valueTraded || 0) - (a.valueTraded || 0));
    return {
      topQuant: byScore[0] || null,
      topGainer: byChange[0] || null,
      topDip: byOversold[0] || null,
      topVol: byVol[0] || null,
    };
  }, [stocks, analysesMap]);

  const positionCalc = useMemo(() => {
    if (!selectedStock || !selectedAnalysis) return null;
    const cap = Math.max(0, Number(capitalInput) || 0);
    const rPct = Math.max(0.1, Math.min(20, Number(riskPctInput) || 2));
    const entry = selectedStock.close;
    const sl = selectedAnalysis.tradePlan.stopLoss;
    const riskPerShare = Math.abs(entry - sl);
    if (!entry || !riskPerShare) return null;
    const maxRiskMoney = cap * (rPct / 100);
    const maxAffordUnits = Math.floor(cap / entry);
    const riskBasedUnits = Math.floor(maxRiskMoney / riskPerShare);
    const units = Math.max(0, Math.min(maxAffordUnits, riskBasedUnits));
    const totalCost = units * entry;
    const slLoss = units * riskPerShare;
    const tp1Profit = units * Math.max(0, selectedAnalysis.tradePlan.tp1 - entry);
    const tp2Profit = units * Math.max(0, selectedAnalysis.tradePlan.tp2 - entry);
    return { units, totalCost, slLoss, tp1Profit, tp2Profit };
  }, [capitalInput, riskPctInput, selectedStock, selectedAnalysis]);

  const filteredStocks = useMemo(() => {
    let list = [...stocks];
    if (preset === 'strong_buy') {
      list = list.filter((s) => analysesMap.get(s.symbol)?.signal === 'GÜÇLÜ AL');
    } else if (preset === 'buy') {
      list = list.filter((s) => {
        const sig = analysesMap.get(s.symbol)?.signal;
        return sig === 'GÜÇLÜ AL' || sig === 'AL';
      });
    } else if (preset === 'value') {
      list = list.filter(
        (s) => s.pe !== null && s.pe > 0 && s.pe <= 14 && (analysesMap.get(s.symbol)?.fundamentalScore || 0) >= 60
      );
    } else if (preset === 'rsi_dip') {
      list = list.filter((s) => s.rsi !== null && s.rsi <= 38);
    } else if (preset === 'sell') {
      list = list.filter((s) => {
        const sig = analysesMap.get(s.symbol)?.signal;
        return sig === 'SAT' || sig === 'GÜÇLÜ SAT';
      });
    } else if (preset === 'watchlist') {
      list = list.filter((s) => watchlist.includes(s.symbol));
    }

    list.sort((a, b) => {
      if (sortBy === 'change_desc') return b.changePct - a.changePct;
      if (sortBy === 'volume_desc') return b.valueTraded - a.valueTraded;
      if (sortBy === 'rsi_asc') return (a.rsi ?? 999) - (b.rsi ?? 999);
      if (sortBy === 'pe_asc') {
        const pa = a.pe && a.pe > 0 ? a.pe : 9999;
        const pb = b.pe && b.pe > 0 ? b.pe : 9999;
        return pa - pb;
      }
      return (analysesMap.get(b.symbol)?.score || 0) - (analysesMap.get(a.symbol)?.score || 0);
    });
    return list;
  }, [stocks, analysesMap, preset, sortBy, watchlist]);

  const statsSummary = useMemo(() => {
    let strongBuy = 0;
    let buy = 0;
    let sell = 0;
    stocks.forEach((s) => {
      const sig = analysesMap.get(s.symbol)?.signal;
      if (sig === 'GÜÇLÜ AL') strongBuy++;
      else if (sig === 'AL') buy++;
      else if (sig === 'SAT' || sig === 'GÜÇLÜ SAT') sell++;
    });
    return { strongBuy, buy, sell };
  }, [stocks, analysesMap]);

  const getSignalStyle = (sig: StockQuantAnalysis['signal']) => {
    switch (sig) {
      case 'GÜÇLÜ AL':
        return 'bg-emerald-500 text-slate-950 border-emerald-400 font-black shadow-md shadow-emerald-500/20';
      case 'AL':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-extrabold';
      case 'SAT':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-extrabold';
      case 'GÜÇLÜ SAT':
        return 'bg-rose-500 text-white border-rose-400 font-black shadow-md shadow-rose-500/25';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700 font-bold';
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. MACRO INDICES & FX LIVE TICKER STRIP */}
      {macro.length > 0 && (
        <section className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {macro.map((m) => (
            <div
              key={m.symbol}
              className="shrink-0 px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center space-x-3 shadow-sm"
            >
              <div>
                <div className="text-[10px] font-bold text-slate-400">{m.label}</div>
                <div className="text-xs sm:text-sm font-mono font-black text-white">
                  {m.price.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} {m.unit}
                </div>
              </div>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-black ${
                  m.changePct >= 0
                    ? 'bg-emerald-500/15 text-emerald-300'
                    : 'bg-rose-500/15 text-rose-300'
                }`}
              >
                {m.changePct >= 0 ? '+' : ''}
                {m.changePct.toFixed(2)}%
              </span>
            </div>
          ))}
        </section>
      )}

      {/* 2. TOP TERMINAL CONTROLS: MARKET SWITCHER + SEARCH + QUANT PRESETS */}
      <section className="rounded-2xl bg-slate-900/90 border border-slate-800 p-3 sm:p-4 shadow-xl space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Market Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'bist', label: '🇹🇷 BIST (Türkiye)', sub: '625+ Hisse' },
              { id: 'us', label: '🇺🇸 ABD (NASDAQ/NYSE)', sub: 'Devler' },
              { id: 'crypto', label: '🪙 Kripto (Binance)', sub: '7/24' },
            ].map((m) => {
              const active = market === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    setMarket(m.id as StockMarketType);
                    setSearchInput('');
                    setActiveSearch('');
                    setPreset('all');
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center space-x-1.5 ${
                    active
                      ? 'bg-cyan-400 text-slate-950 border-cyan-300 shadow-lg shadow-cyan-500/20'
                      : 'bg-slate-950/70 hover:bg-slate-800 text-slate-300 border-slate-800'
                  }`}
                >
                  <span>{m.label}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded ${
                      active ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {m.sub}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Live Search & Toolbar Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-60 min-w-[180px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={
                  market === 'bist'
                    ? 'Hisse ara (THYAO, ASELS...)'
                    : market === 'us'
                    ? 'Ticker ara (NVDA, AAPL...)'
                    : 'Coin ara (BTC, SOL...)'
                }
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* 🏆 Başarı Karnesi */}
            <button
              onClick={() => setIsPerformanceModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-emerald-500/30 text-emerald-300 text-xs font-bold cursor-pointer flex items-center space-x-1.5 transition-all shadow-sm"
              title="Doğrulanmış Model Başarı Karnesi ve Sinyal İstatistikleri"
            >
              <Trophy className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Başarı Karnesi</span>
            </button>

            {/* 🔔 Alarmlar */}
            <button
              onClick={() => setIsAlertsModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-amber-500/30 text-amber-300 text-xs font-bold cursor-pointer flex items-center space-x-1.5 transition-all shadow-sm"
              title="Akıllı Fiyat & RSI Alarmları"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Alarmlar</span>
              {activeAlertsCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center">
                  {activeAlertsCount}
                </span>
              )}
            </button>

            {/* 💼 Sanal Portföy */}
            <button
              onClick={() => setIsPortfolioModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-sky-500/30 text-sky-300 text-xs font-bold cursor-pointer flex items-center space-x-1.5 transition-all shadow-sm"
              title="Sanal Portföy & İşlem Defteri (Paper Trading)"
            >
              <Briefcase className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Sanal Portföy</span>
              {openPositionsCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-sky-500 text-slate-950 text-[10px] font-black flex items-center justify-center">
                  {openPositionsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                loadMarketData(market, activeSearch, true);
                onShowToast?.('Borsa fiyatları & indikatörler canlı yenilendi');
              }}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 text-xs font-bold cursor-pointer flex items-center space-x-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Yenile</span>
            </button>
          </div>
        </div>

        {/* Live Session Status & Feed Transparency Strip */}
        {(() => {
          const trNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));
          const day = trNow.getDay();
          const mins = trNow.getHours() * 60 + trNow.getMinutes();
          const isWeekday = day >= 1 && day <= 5;
          const bistOpen = isWeekday && mins >= 10 * 60 && mins <= 18 * 60 + 10;
          const usOpen = isWeekday && mins >= 16 * 60 + 30 && mins <= 23 * 60;
          const isOpen = market === 'crypto' ? true : market === 'bist' ? bistOpen : usOpen;
          const label =
            market === 'crypto'
              ? '7/24 Kesintisiz Canlı Piyasa (Anlık)'
              : market === 'bist'
              ? bistOpen
                ? 'BIST Seansı Açık (10:00–18:10) • Gün Boyu Canlı Akış'
                : 'BIST Seansı Kapalı (10:00–18:10 arası canlı güncellenir)'
              : usOpen
              ? 'ABD Borsaları Açık (16:30–23:00 TRT) • Anlık Akış'
              : 'ABD Borsaları Kapalı (16:30–23:00 TRT)';
          const latencyNote =
            market === 'bist'
              ? '15 dk BIST yasal akış • 45sn otomatik tarama'
              : 'Anlık fiyat • 45sn otomatik tarama';
          return (
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-slate-950/75 border border-slate-800/80 text-[10px]">
              <div className="flex items-center space-x-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <span className={isOpen ? 'font-bold text-emerald-300' : 'font-bold text-amber-300'}>
                  {label}
                </span>
              </div>
              <span className="text-slate-400 font-mono">{latencyNote}</span>
            </div>
          );
        })()}

        {/* 🛡️ YASAL UYARI & SPK SORUMLULUK REDDİ (YTD) - Belirgin & Prestijli Görünüm */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/15 via-slate-900 to-amber-500/10 border-2 border-amber-400/40 p-3 sm:p-3.5 shadow-lg shadow-amber-500/10">
          <div className="pointer-events-none absolute -right-6 -bottom-6 w-28 h-28 bg-amber-400/15 rounded-full blur-2xl animate-pulse" />
          <div className="flex items-start sm:items-center gap-3 relative z-10">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center shrink-0 shadow-inner mt-0.5 sm:mt-0">
              <ShieldAlert className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div className="text-[11px] sm:text-xs leading-relaxed text-slate-200">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow">
                  SPK MEVZUATI • YASAL UYARI
                </span>
                <span className="font-black text-amber-300 tracking-wide text-xs">
                  Yatırım Tavsiyesi Değildir (YTD)
                </span>
              </div>
              <p className="text-slate-300">
                Bu sayfadaki tüm Quant algoritmaları, RSI/MACD sinyalleri ve yapay zeka analizleri istatistiksel simülasyondur;{' '}
                <strong className="text-amber-300 font-black underline decoration-amber-400 underline-offset-2">
                  kesinlikle yatırım danışmanlığı veya alım-satım tavsiyesi niteliği taşımaz (YTD)
                </strong>
                . Yatırım kararlarınızı kendi bağımsız araştırmanıza ve risk profilinize göre vermelisiniz.
              </p>
            </div>
          </div>
        </div>

        {/* Quant Presets + Live Counts + Sort */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: `Tümü (${stocks.length})` },
              { id: 'strong_buy', label: `🔥 Güçlü AL (${statsSummary.strongBuy})` },
              { id: 'buy', label: `✅ AL (${statsSummary.strongBuy + statsSummary.buy})` },
              { id: 'value', label: '💎 Ucuz Değer' },
              { id: 'rsi_dip', label: '⚡ RSI Dip' },
              { id: 'sell', label: `⚠️ SAT (${statsSummary.sell})` },
              { id: 'watchlist', label: `⭐ Takip (${watchlist.length})` },
            ].map((p) => {
              const active = preset === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setPreset(p.id as PresetFilter)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold border transition-all cursor-pointer ${
                    active
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                      : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {updatedAt && (
              <span className="text-[10px] text-slate-500 font-mono hidden xl:inline">
                Piyasa: {totalAvailable} •{' '}
                {new Date(updatedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as StockSort)}
              className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-[11px] font-bold text-slate-200 cursor-pointer"
            >
              <option value="ai_desc">Sıra: Quant AI Skor (Yüksek)</option>
              <option value="change_desc">Sıra: Günlük Getiri (%)</option>
              <option value="volume_desc">Sıra: İşlem Hacmi</option>
              <option value="rsi_asc">Sıra: RSI (En Düşükten)</option>
              <option value="pe_asc">Sıra: F/K (En Ucuzdan)</option>
            </select>
          </div>
        </div>

        {/* Live Alpha Radar Quick Jumps */}
        {alphaHighlights && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80">
            {[
              alphaHighlights.topQuant && {
                tag: 'En Güçlü AI Sinyali',
                sym: alphaHighlights.topQuant.symbol,
                meta: `Skor ${analysesMap.get(alphaHighlights.topQuant.symbol)?.score}/100`,
                tone: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300',
              },
              alphaHighlights.topGainer && {
                tag: 'Günün Lideri',
                sym: alphaHighlights.topGainer.symbol,
                meta: `${alphaHighlights.topGainer.changePct >= 0 ? '+' : ''}${alphaHighlights.topGainer.changePct.toFixed(2)}%`,
                tone: 'border-cyan-500/30 bg-cyan-500/5 text-cyan-300',
              },
              alphaHighlights.topDip && {
                tag: 'RSI Dip Fırsatı',
                sym: alphaHighlights.topDip.symbol,
                meta: `RSI ${alphaHighlights.topDip.rsi?.toFixed(1)}`,
                tone: 'border-amber-500/30 bg-amber-500/5 text-amber-300',
              },
              alphaHighlights.topVol && {
                tag: 'Hacim Kralı',
                sym: alphaHighlights.topVol.symbol,
                meta: formatLargeNumber(alphaHighlights.topVol.valueTraded, alphaHighlights.topVol.currency),
                tone: 'border-indigo-500/30 bg-indigo-500/5 text-indigo-300',
              },
            ]
              .filter(Boolean)
              .map((card: any) => (
                <button
                  key={card.tag}
                  onClick={() => setSelectedSymbol(card.sym)}
                  className={`px-3 py-2 rounded-xl border text-left transition-all hover:brightness-125 cursor-pointer flex items-center justify-between gap-2 ${card.tone}`}
                >
                  <div className="min-w-0">
                    <div className="text-[9px] font-bold uppercase tracking-wider opacity-80">
                      {card.tag}
                    </div>
                    <div className="text-xs font-black text-white">{card.sym}</div>
                  </div>
                  <span className="text-[11px] font-mono font-black shrink-0">{card.meta}</span>
                </button>
              ))}
          </div>
        )}
      </section>

      {errorMsg && stocks.length === 0 ? (
        <div className="rounded-2xl bg-rose-950/30 border border-rose-500/30 p-8 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
          <div className="text-sm font-bold text-rose-200">{errorMsg}</div>
        </div>
      ) : (
        /* 3. TWO-COLUMN PRO TERMINAL WORKSTATION */
        <div className="flex flex-col xl:flex-row gap-4 items-start">
          {/* LEFT: SCREENER LIST */}
          <div className="w-full xl:w-[440px] shrink-0 rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
            <div className="px-3.5 py-2.5 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
              <span>Hisse / Varlık ({filteredStocks.length})</span>
              <span>Fiyat &bull; RSI &bull; Sinyal</span>
            </div>

            {loading && stocks.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-400 animate-pulse">
                Canlı borsa taraması yapılıyor...
              </div>
            ) : filteredStocks.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                <div>Seçili filtrede hisse bulunamadı.</div>
                <button
                  onClick={() => {
                    setPreset('all');
                    setSearchInput('');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-white font-bold cursor-pointer"
                >
                  Filtreleri Sıfırla
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80 max-h-[760px] overflow-y-auto">
                {filteredStocks.map((st) => {
                  const qa = analysesMap.get(st.symbol)!;
                  const isSel = selectedStock?.symbol === st.symbol;
                  const isFav = watchlist.includes(st.symbol);
                  return (
                    <div
                      key={st.symbol}
                      onClick={() => setSelectedSymbol(st.symbol)}
                      className={`px-3 py-2.5 cursor-pointer transition-all flex items-center justify-between gap-2 ${
                        isSel
                          ? 'bg-cyan-500/15 border-l-4 border-l-cyan-400'
                          : 'hover:bg-slate-800/50 border-l-4 border-l-transparent'
                      }`}
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        <button
                          onClick={(e) => toggleWatchlist(st.symbol, e)}
                          className="p-1 text-slate-500 hover:text-amber-400 cursor-pointer shrink-0"
                          title="İzleme Listesine Ekle / Çıkar"
                        >
                          <Star
                            className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`}
                          />
                        </button>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-black text-xs text-white">{st.symbol}</span>
                            <span className="text-[10px] font-mono text-slate-400">
                              RSI:{st.rsi !== null ? st.rsi.toFixed(0) : '-'}
                            </span>
                            {st.pe && st.pe > 0 && (
                              <span className="text-[9px] text-cyan-400 font-mono hidden sm:inline">
                                F/K:{st.pe.toFixed(1)}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[175px]">
                            {st.name}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2.5 shrink-0">
                        <div className="text-right">
                          <div className="font-mono font-black text-xs text-white">
                            {formatStockPrice(st.close, st.currency)}
                          </div>
                          <div
                            className={`text-[10px] font-mono font-bold flex items-center justify-end ${
                              st.changePct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {st.changePct >= 0 ? (
                              <ArrowUpRight className="w-3 h-3" />
                            ) : (
                              <ArrowDownRight className="w-3 h-3" />
                            )}
                            <span>
                              {st.changePct >= 0 ? '+' : ''}
                              {st.changePct.toFixed(2)}%
                            </span>
                          </div>
                        </div>

                        <div className="text-right min-w-[74px]">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded border text-[9px] ${getSignalStyle(
                              qa.signal
                            )}`}
                          >
                            {qa.signal}
                          </span>
                          <div className="text-[9px] font-mono text-slate-400 mt-0.5">
                            Skor: <strong className="text-white">{qa.score}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT: DEEP QUANT & TECHNICAL TERMINAL FOR SELECTED STOCK */}
          {selectedStock && selectedAnalysis && (
            <div className="flex-1 w-full min-w-0 space-y-4">
              {/* Top Signal & Price Header */}
              <div className="rounded-2xl bg-slate-900/95 border border-slate-800 p-4 sm:p-5 shadow-xl space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
                        {selectedStock.symbol}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold">
                        {selectedStock.exchange || market.toUpperCase()}
                      </span>
                      {selectedStock.sector && (
                        <span className="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold">
                          {selectedStock.sector}
                        </span>
                      )}
                    </div>
                    <h2 className="text-xs sm:text-sm text-slate-400 font-semibold mt-0.5">
                      {selectedStock.name}
                    </h2>

                    {/* Quick Stock Actions: Alarm Kur, Takip Et, AI Raporu */}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <button
                        onClick={() => setIsAlertsModalOpen(true)}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        title="Bu hisse için fiyat / RSI alarmı kur"
                      >
                        <Bell className="w-3.5 h-3.5 text-amber-400" />
                        <span>Alarm Kur</span>
                      </button>

                      <button
                        onClick={(e) => toggleWatchlist(selectedStock.symbol, e)}
                        className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                          watchlist.includes(selectedStock.symbol)
                            ? 'bg-amber-500/20 border-amber-400/40 text-amber-300'
                            : 'bg-slate-800/90 border-slate-700 text-slate-300 hover:text-white'
                        }`}
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${
                            watchlist.includes(selectedStock.symbol)
                              ? 'fill-amber-400 text-amber-400'
                              : ''
                          }`}
                        />
                        <span>
                          {watchlist.includes(selectedStock.symbol) ? 'Takipte' : 'Takibe Al'}
                        </span>
                      </button>

                      <button
                        onClick={() => setIsAIChatOpen(true)}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                      >
                        <Bot className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Kurumsal AI Raporu</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="text-xl sm:text-2xl font-mono font-black text-white">
                        {formatStockPrice(selectedStock.close, selectedStock.currency)}
                      </div>
                      <div
                        className={`text-xs font-mono font-black ${
                          selectedStock.changePct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {selectedStock.changePct >= 0 ? '+' : ''}
                        {selectedStock.changePct.toFixed(2)}% Bugün
                      </div>
                    </div>

                    <div
                      className={`px-3.5 py-2 rounded-2xl border text-center ${getSignalStyle(
                        selectedAnalysis.signal
                      )}`}
                    >
                      <div className="text-xs font-black tracking-wide">{selectedAnalysis.signal}</div>
                      <div className="text-[10px] opacity-90 font-mono">
                        AI Skor: {selectedAnalysis.score}/100
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3 Sub-Scores: Trend | Momentum | Temel */}
                <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-slate-800">
                  {[
                    { label: 'Trend Gücü', val: selectedAnalysis.trendScore, col: 'bg-cyan-400' },
                    { label: 'Momentum', val: selectedAnalysis.momentumScore, col: 'bg-emerald-400' },
                    { label: 'Temel / Bilanço', val: selectedAnalysis.fundamentalScore, col: 'bg-amber-400' },
                  ].map((b) => (
                    <div key={b.label} className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-bold">{b.label}</span>
                        <span className="font-mono font-black text-white">%{b.val}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div className={`h-full rounded-full ${b.col}`} style={{ width: `${b.val}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Interactive Candlestick / EMA / BB / RSI Chart */}
                <StockChart
                  candles={chartData?.candles || []}
                  currency={selectedStock.currency}
                  stopLoss={selectedAnalysis.tradePlan.stopLoss}
                  tp1={selectedAnalysis.tradePlan.tp1}
                  analystTarget={deepData?.financials?.targetMeanPrice ?? null}
                  range={chartRange}
                  onChangeRange={setChartRange}
                  loading={chartLoading}
                />

                {/* MULTI-TIMEFRAME CONFLUENCE STRIP (1S / 1G / 1H) */}
                <div className="rounded-xl bg-slate-950/75 border border-slate-800 p-3 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[11px] font-black uppercase tracking-wider text-cyan-300 flex items-center space-x-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      <span>Çoklu Zaman Dilimi Uyum Radarı (MTF)</span>
                    </div>
                    {deepLoading ? (
                      <span className="text-[10px] text-slate-400 animate-pulse">
                        1S / 1G / 1H taranıyor...
                      </span>
                    ) : deepData ? (
                      <span className="px-2.5 py-0.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-[10px] font-black text-cyan-200">
                        {deepData.mtfSummary.alignment} &bull; MTF Skor: {deepData.mtfSummary.mtfScore}/100
                      </span>
                    ) : null}
                  </div>

                  {deepData && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {deepData.mtf.map((tf) => {
                        const isBull = tf.signal === 'GÜÇLÜ AL' || tf.signal === 'AL';
                        const isBear = tf.signal === 'GÜÇLÜ SAT' || tf.signal === 'SAT';
                        return (
                          <div
                            key={tf.timeframe}
                            className="px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between"
                          >
                            <div>
                              <div className="text-[10px] font-bold text-slate-400">{tf.timeframe}</div>
                              <div className="text-[11px] font-mono text-slate-300">
                                RSI: <strong>{tf.rsi ?? '-'}</strong> &bull; Trend:{' '}
                                <strong
                                  className={
                                    tf.trend === 'YÜKSELİŞ'
                                      ? 'text-emerald-400'
                                      : tf.trend === 'DÜŞÜŞ'
                                      ? 'text-rose-400'
                                      : 'text-slate-300'
                                  }
                                >
                                  {tf.trend}
                                </strong>
                              </div>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                                isBull
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : isBear
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                  : 'bg-slate-800 text-slate-300 border-slate-700'
                              }`}
                            >
                              {tf.signal}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Candlestick Patterns & Volume Ratio */}
                  {deepData && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/80">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono text-slate-300">
                        <CandlestickChart className="w-3 h-3 text-cyan-400" />
                        <span>
                          Hacim Oranı: <strong className="text-white">{deepData.volumeRatio}x</strong>
                        </span>
                      </span>
                      {deepData.patterns.map((p, idx) => (
                        <span
                          key={idx}
                          title={p.description}
                          className={`px-2 py-0.5 rounded border text-[10px] font-bold ${
                            p.bias === 'bull'
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : p.bias === 'bear'
                              ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {p.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Institutional AI Research Memo */}
                {aiMemo && (
                  <div className="p-4 rounded-xl bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/25 border border-cyan-500/30 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span className="text-xs font-black text-white">{aiMemo.headline}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-[10px] font-bold text-cyan-200">
                        {aiMemo.convictionBadge}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {aiMemo.sections.map((sec) => (
                        <div key={sec.title} className="text-xs leading-relaxed">
                          <div className="font-bold text-cyan-300">{sec.title}</div>
                          <div className="text-slate-300">{sec.body}</div>
                        </div>
                      ))}
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950/90 border border-emerald-500/30 text-[11px] font-bold text-emerald-200">
                      {aiMemo.actionCallout}
                    </div>
                  </div>
                )}
              </div>

              {/* TRADE PLAN + PIVOTS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* AI Trade Setup */}
                <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
                      <Target className="w-4 h-4" />
                      <span>AI İşlem Planı ({selectedAnalysis.tradePlan.bias})</span>
                    </h3>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-slate-300">
                      Risk: {selectedAnalysis.riskLevel} &bull; R/R 1:{selectedAnalysis.tradePlan.riskReward}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                      <div className="text-[10px] text-slate-400">Optimal Giriş</div>
                      <div className="font-mono font-black text-white mt-0.5">
                        {formatStockPrice(selectedAnalysis.tradePlan.entryLow, '')} –{' '}
                        {formatStockPrice(selectedAnalysis.tradePlan.entryHigh, selectedStock.currency)}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-rose-950/25 border border-rose-500/30">
                      <div className="text-[10px] text-rose-300">Stop-Loss (Zarar Kes)</div>
                      <div className="font-mono font-black text-rose-400 mt-0.5">
                        {formatStockPrice(selectedAnalysis.tradePlan.stopLoss, selectedStock.currency)}{' '}
                        <span className="text-[10px]">({selectedAnalysis.tradePlan.stopLossPct}%)</span>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-emerald-950/25 border border-emerald-500/30">
                      <div className="text-[10px] text-emerald-300">Hedef 1 (TP1)</div>
                      <div className="font-mono font-black text-emerald-400 mt-0.5">
                        {formatStockPrice(selectedAnalysis.tradePlan.tp1, selectedStock.currency)}{' '}
                        <span className="text-[10px]">
                          ({selectedAnalysis.tradePlan.tp1Pct >= 0 ? '+' : ''}
                          {selectedAnalysis.tradePlan.tp1Pct}%)
                        </span>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-400/40">
                      <div className="text-[10px] text-emerald-200">Hedef 2 (TP2)</div>
                      <div className="font-mono font-black text-emerald-300 mt-0.5">
                        {formatStockPrice(selectedAnalysis.tradePlan.tp2, selectedStock.currency)}{' '}
                        <span className="text-[10px]">
                          ({selectedAnalysis.tradePlan.tp2Pct >= 0 ? '+' : ''}
                          {selectedAnalysis.tradePlan.tp2Pct}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Position Size & Risk Calculator */}
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <div className="text-[10px] font-black uppercase tracking-wider text-cyan-300 flex items-center space-x-1">
                      <Calculator className="w-3.5 h-3.5" />
                      <span>Pozisyon &amp; Lot Mühendisi (Stop-Loss Riskine Göre)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] text-slate-400 mb-0.5">
                          Sermaye ({selectedStock.currency})
                        </label>
                        <input
                          type="number"
                          value={capitalInput}
                          onChange={(e) => setCapitalInput(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-slate-400 mb-0.5">
                          Maks Risk (%)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          value={riskPctInput}
                          onChange={(e) => setRiskPctInput(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-white"
                        />
                      </div>
                    </div>
                    {positionCalc && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-1.5 text-[10px] bg-slate-950/80 p-2 rounded-xl border border-slate-800">
                          <div>
                            <div className="text-slate-400">Önerilen Adet</div>
                            <div className="font-mono font-black text-white">
                              {positionCalc.units.toLocaleString('tr-TR')} Lot
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-400">İşlem Tutarı</div>
                            <div className="font-mono font-black text-cyan-300">
                              {formatStockPrice(positionCalc.totalCost, selectedStock.currency)}
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-400">TP1 Kâr / Stop</div>
                            <div className="font-mono font-black">
                              <span className="text-emerald-400">
                                +{formatStockPrice(positionCalc.tp1Profit, '')}
                              </span>{' '}
                              /{' '}
                              <span className="text-rose-400">
                                -{formatStockPrice(positionCalc.slLoss, '')}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Add to Virtual Portfolio Button */}
                        <button
                          type="button"
                          onClick={() => {
                            const newPos: StockPortfolioPosition = {
                              id: `pos-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                              symbol: selectedStock.symbol,
                              name: selectedStock.name,
                              market: selectedStock.market,
                              units: positionCalc.units,
                              entryPrice: selectedStock.close,
                              currentPrice: selectedStock.close,
                              stopLoss: selectedAnalysis?.tradePlan.stopLoss || null,
                              targetPrice: selectedAnalysis?.tradePlan.tp1 || null,
                              entryDate: new Date().toISOString(),
                              status: 'open',
                              notes: `${selectedAnalysis?.signal} sinyaliyle Lot Mühendisinden eklendi`,
                            };
                            savePortfolio([newPos, ...portfolio]);
                            onShowToast?.(`💼 ${selectedStock.symbol} (${positionCalc.units} lot) Sanal Portföye Eklendi!`);
                          }}
                          className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 hover:brightness-110 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-sky-600/20 transition-all cursor-pointer"
                        >
                          <Briefcase className="w-3.5 h-3.5" />
                          <span>💼 Sanal Portföye Ekle ({positionCalc.units.toLocaleString('tr-TR')} Lot)</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Supports, Resistances & 52W Range */}
                <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center space-x-1.5">
                    <BarChart3 className="w-4 h-4" />
                    <span>Pivot Destek / Direnç &amp; 52H Aralık</span>
                  </h3>

                  <div className="grid grid-cols-5 gap-1.5 text-center">
                    {[
                      { k: 'S2', v: selectedAnalysis.pivots.s2, c: 'text-emerald-400' },
                      { k: 'S1', v: selectedAnalysis.pivots.s1, c: 'text-emerald-300' },
                      { k: 'PIVOT', v: selectedAnalysis.pivots.pivot, c: 'text-white' },
                      { k: 'R1', v: selectedAnalysis.pivots.r1, c: 'text-rose-300' },
                      { k: 'R2', v: selectedAnalysis.pivots.r2, c: 'text-rose-400' },
                    ].map((p) => (
                      <div key={p.k} className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                        <div className="text-[9px] font-bold text-slate-400">{p.k}</div>
                        <div className={`text-[11px] font-mono font-black ${p.c}`}>
                          {formatStockPrice(p.v, '')}
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedStock.low52W && selectedStock.high52W && (
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[10px] font-mono text-slate-400">
                        <span>52H Dip: {formatStockPrice(selectedStock.low52W, '')}</span>
                        <span>52H Zirve: {formatStockPrice(selectedStock.high52W, '')}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 relative overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full"
                          style={{
                            width: `${Math.max(
                              4,
                              Math.min(
                                100,
                                ((selectedStock.close - selectedStock.low52W) /
                                  Math.max(0.01, selectedStock.high52W - selectedStock.low52W)) *
                                  100
                              )
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* FUNDAMENTALS + TECHNICAL INDICATORS MATRIX */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Fundamentals */}
                <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
                    <Globe className="w-4 h-4" />
                    <span>Temel Analiz &amp; Performans</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { k: 'Piyasa Değeri', v: formatLargeNumber(selectedStock.marketCap, selectedStock.currency) },
                      { k: 'İşlem Hacmi', v: formatLargeNumber(selectedStock.valueTraded, selectedStock.currency) },
                      { k: 'F/K (P/E)', v: selectedStock.pe ? `${selectedStock.pe.toFixed(2)}x` : '-' },
                      { k: 'PD/DD (P/B)', v: selectedStock.pb ? `${selectedStock.pb.toFixed(2)}x` : '-' },
                      { k: 'Özsermaye Kâr. (ROE)', v: selectedStock.roe ? `%${selectedStock.roe.toFixed(1)}` : '-' },
                      { k: 'Temettü Verimi', v: selectedStock.dividendYield ? `%${selectedStock.dividendYield.toFixed(2)}` : '-' },
                    ].map((row) => (
                      <div
                        key={row.k}
                        className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between"
                      >
                        <span className="text-[11px] text-slate-400">{row.k}</span>
                        <span className="font-mono font-black text-white">{row.v}</span>
                      </div>
                    ))}
                  </div>

                  {/* Multi-Period Returns */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {[
                      { k: '1 Hafta', v: selectedStock.perfW },
                      { k: '1 Ay', v: selectedStock.perf1M },
                      { k: '6 Ay', v: selectedStock.perf6M },
                      { k: '1 Yıl', v: selectedStock.perf1Y },
                    ].map((p) => (
                      <div
                        key={p.k}
                        className="p-2 rounded-xl bg-slate-950/70 border border-slate-800 text-center"
                      >
                        <div className="text-[9px] text-slate-400">{p.k}</div>
                        <div
                          className={`text-[11px] font-mono font-black ${
                            (p.v ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {p.v !== null ? `${p.v >= 0 ? '+' : ''}${p.v.toFixed(1)}%` : '-'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Technical Indicators Matrix */}
                <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
                    <Activity className="w-4 h-4" />
                    <span>Teknik İndikatör Matrisi</span>
                  </h3>
                  <div className="space-y-1.5">
                    {selectedAnalysis.indicators.map((ind) => (
                      <div
                        key={ind.name}
                        className="px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-200">{ind.name}</div>
                          <div className="text-[10px] text-slate-500">{ind.note}</div>
                        </div>
                        <div className="flex items-center space-x-2 shrink-0">
                          <span className="font-mono text-slate-300 font-bold">{ind.value}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black ${
                              ind.action === 'AL'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : ind.action === 'SAT'
                                ? 'bg-rose-500/20 text-rose-300'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {ind.action}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* BULL VS BEAR REASONS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl bg-emerald-950/20 border border-emerald-500/25 p-4 space-y-2">
                  <div className="text-xs font-black text-emerald-300 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Güçlü Yönler &amp; Alım Katalizörleri</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-200">
                    {selectedAnalysis.bullReasons.map((r, i) => (
                      <li key={i} className="flex items-start space-x-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl bg-rose-950/20 border border-rose-500/25 p-4 space-y-2">
                  <div className="text-xs font-black text-rose-300 flex items-center space-x-1.5">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Riskler &amp; Dikkat Noktaları</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-200">
                    {selectedAnalysis.bearReasons.map((r, i) => (
                      <li key={i} className="flex items-start space-x-1.5">
                        <Flame className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* ANALYST CONSENSUS + 1Y REAL BACKTEST LAB */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Wall Street / Institutional Analyst Consensus */}
                <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center space-x-1.5">
                      <Target className="w-4 h-4" />
                      <span>Kurumsal Analist Hedefleri &amp; Bilanço</span>
                    </h3>
                    {deepData?.financials?.recommendationKey && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30 text-[10px] font-black uppercase text-emerald-300">
                        {deepData.financials.recommendationKey.replace(/_/g, ' ')} (
                        {deepData.financials.numberOfAnalystOpinions ?? '-'} Kurum)
                      </span>
                    )}
                  </div>

                  {deepData?.financials?.targetMeanPrice ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Ortalama Analist Hedefi</span>
                        <span className="font-mono font-black text-white">
                          {formatStockPrice(deepData.financials.targetMeanPrice, selectedStock.currency)}{' '}
                          {deepData.financials.upsidePct !== null && (
                            <span
                              className={
                                deepData.financials.upsidePct >= 0
                                  ? 'text-emerald-400'
                                  : 'text-rose-400'
                              }
                            >
                              ({deepData.financials.upsidePct >= 0 ? '+' : ''}
                              {deepData.financials.upsidePct}%)
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                        <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800">
                          <div className="text-slate-500">En Düşük</div>
                          <div className="font-mono font-bold text-slate-300">
                            {formatStockPrice(deepData.financials.targetLowPrice ?? 0, '')}
                          </div>
                        </div>
                        <div className="p-2 rounded-lg bg-cyan-950/30 border border-cyan-500/30">
                          <div className="text-cyan-400">Mevcut</div>
                          <div className="font-mono font-black text-white">
                            {formatStockPrice(selectedStock.close, '')}
                          </div>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800">
                          <div className="text-slate-500">En Yüksek</div>
                          <div className="font-mono font-bold text-emerald-300">
                            {formatStockPrice(deepData.financials.targetHighPrice ?? 0, '')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400">
                      {deepLoading
                        ? 'Kurumsal analist hedefleri sorgulanıyor...'
                        : 'Bu varlık için analist konsensüsü bulunmuyor (veya kripto varlık).'}
                    </div>
                  )}

                  {deepData?.financials && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                      {[
                        {
                          k: 'ROE',
                          v:
                            deepData.financials.returnOnEquityPct !== null
                              ? `%${deepData.financials.returnOnEquityPct}`
                              : '-',
                        },
                        {
                          k: 'Net Kâr Marjı',
                          v:
                            deepData.financials.profitMarginsPct !== null
                              ? `%${deepData.financials.profitMarginsPct}`
                              : '-',
                        },
                        {
                          k: 'Gelir Büyümesi',
                          v:
                            deepData.financials.revenueGrowthPct !== null
                              ? `%${deepData.financials.revenueGrowthPct}`
                              : '-',
                        },
                        {
                          k: 'İleri F/K',
                          v: deepData.financials.forwardPE ? `${deepData.financials.forwardPE}x` : '-',
                        },
                        {
                          k: 'Borç / Özkaynak',
                          v:
                            deepData.financials.debtToEquity !== null
                              ? `%${deepData.financials.debtToEquity}`
                              : '-',
                        },
                        {
                          k: 'Beta',
                          v: deepData.financials.beta !== null ? `${deepData.financials.beta}` : '-',
                        },
                      ].map((item) => (
                        <div
                          key={item.k}
                          className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 flex justify-between"
                        >
                          <span className="text-slate-400">{item.k}</span>
                          <strong className="font-mono text-white">{item.v}</strong>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Real 1-Year Strategy Backtest Lab */}
                <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
                      <Activity className="w-4 h-4" />
                      <span>1 Yıllık Gerçek Backtest Laboratuvarı</span>
                    </h3>
                    {deepData?.backtest && (
                      <span className="text-[10px] font-mono text-slate-400">
                        {deepData.backtest.totalTrades} İşlem Test Edildi
                      </span>
                    )}
                  </div>

                  {deepData?.backtest ? (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                        <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                          <div className="text-[9px] text-slate-400">Kazanma Oranı</div>
                          <div className="font-mono font-black text-sm text-emerald-400">
                            %{deepData.backtest.winRate}
                          </div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                          <div className="text-[9px] text-slate-400">Strateji Getiri</div>
                          <div
                            className={`font-mono font-black text-sm ${
                              deepData.backtest.strategyReturnPct >= 0
                                ? 'text-emerald-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {deepData.backtest.strategyReturnPct >= 0 ? '+' : ''}
                            {deepData.backtest.strategyReturnPct}%
                          </div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                          <div className="text-[9px] text-slate-400">Al-Tut Kıyas</div>
                          <div className="font-mono font-black text-sm text-slate-200">
                            {deepData.backtest.buyHoldReturnPct >= 0 ? '+' : ''}
                            {deepData.backtest.buyHoldReturnPct}%
                          </div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                          <div className="text-[9px] text-slate-400">Profit Factor</div>
                          <div className="font-mono font-black text-sm text-cyan-300">
                            {deepData.backtest.profitFactor}
                          </div>
                        </div>
                      </div>

                      {deepData.backtest.recentTrades.length > 0 && (
                        <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                          {deepData.backtest.recentTrades.map((tr, i) => (
                            <div
                              key={i}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between text-[10px] font-mono"
                            >
                              <div className="text-slate-300">
                                {tr.entryDate} &rarr; {tr.exitDate}{' '}
                                <span className="text-slate-500">({tr.reason})</span>
                              </div>
                              <span
                                className={`font-black ${
                                  tr.returnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                {tr.returnPct >= 0 ? '+' : ''}
                                {tr.returnPct}%
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-xs text-slate-400">
                      {deepLoading
                        ? 'Son 1 yıllık tarihsel sinyaller test ediliyor...'
                        : 'Backtest için yeterli tarihsel mum bulunamadı.'}
                    </div>
                  )}
                </div>
              </div>

              {/* LIVE FINANCIAL NEWS & SENTIMENT */}
              <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
                    <Newspaper className="w-4 h-4" />
                    <span>Canlı Piyasa Haberleri &amp; Duygu Analizi</span>
                  </h3>
                  <span className="text-[10px] text-slate-500">Otomatik Başlık Taraması</span>
                </div>
                {deepLoading && !deepData ? (
                  <div className="text-xs text-slate-400 animate-pulse">Haber akışı çekiliyor...</div>
                ) : deepData && deepData.news.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {deepData.news.map((n, idx) => (
                      <a
                        key={idx}
                        href={n.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-xl bg-slate-950/75 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between gap-2 group"
                      >
                        <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 leading-snug line-clamp-2">
                          {n.title}
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-500 truncate max-w-[160px]">
                            {n.publisher} &bull;{' '}
                            {new Date(n.publishedAt).toLocaleDateString('tr-TR')}
                          </span>
                          <div className="flex items-center space-x-1.5 shrink-0">
                            <span
                              className={`px-1.5 py-0.5 rounded font-black ${
                                n.sentiment === 'Pozitif'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : n.sentiment === 'Negatif'
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {n.sentiment}
                            </span>
                            <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-cyan-400" />
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400">Güncel haber başlığı bulunamadı.</div>
                )}
              </div>

              {/* LIVE KAP PUBLIC DISCLOSURES & CORPORATE CALENDAR */}
              <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Megaphone className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                        <span>📢 Canlı KAP Bildirimleri &amp; Kurumsal Takvim</span>
                        <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-emerald-500/20 text-emerald-300">
                          RESMİ AKIŞ
                        </span>
                      </h3>
                      <p className="text-[10px] text-slate-400">
                        {selectedStock.symbol} için Kamuyu Aydınlatma Platformu bildirimleri ve bilanço/temettü takvimi
                      </p>
                    </div>
                  </div>

                  {/* Calendar Badges: Next Earnings Date & Ex-Dividend Date */}
                  <div className="flex items-center gap-2">
                    {deepData?.calendar?.nextEarningsDate && (
                      <div className="px-2.5 py-1 rounded-xl bg-slate-950 border border-cyan-500/30 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                        <div className="text-[10px]">
                          <span className="text-slate-400 block text-[9px]">Sonraki Bilanço</span>
                          <span className="font-bold text-white font-mono">
                            {deepData.calendar.nextEarningsDate}
                          </span>
                        </div>
                      </div>
                    )}
                    {deepData?.calendar?.exDividendDate && (
                      <div className="px-2.5 py-1 rounded-xl bg-slate-950 border border-emerald-500/30 flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                        <div className="text-[10px]">
                          <span className="text-slate-400 block text-[9px]">Temettü Tarihi</span>
                          <span className="font-bold text-emerald-300 font-mono">
                            {deepData.calendar.exDividendDate}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {deepLoading && !deepData ? (
                  <div className="text-xs text-slate-400 animate-pulse">KAP bildirimleri ve kurumsal takvim taranıyor...</div>
                ) : deepData?.kap && deepData.kap.length > 0 ? (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {deepData.kap.map((item) => {
                      const catBadge =
                        item.category === 'Özel Durum'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : item.category === 'Finansal Rapor'
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                          : item.category === 'Temettü / Sermaye'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : item.category === 'Genel Kurul'
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                          : 'bg-slate-800 text-slate-300 border-slate-700';

                      return (
                        <a
                          key={item.id}
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2.5 rounded-xl bg-slate-950/70 hover:bg-slate-850 border border-slate-800/80 hover:border-emerald-500/40 transition-all flex items-start justify-between gap-3 group"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${catBadge}`}>
                                {item.category}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium truncate">
                                {item.publisher}
                              </span>
                            </div>
                            <div className="text-xs font-semibold text-slate-200 group-hover:text-emerald-300 transition-colors leading-snug">
                              {item.title}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 text-slate-500 group-hover:text-emerald-400 text-[10px]">
                            <span>{new Date(item.publishedAt).toLocaleDateString('tr-TR')}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </div>
                        </a>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 text-center rounded-xl bg-slate-950/50 border border-slate-800/60 text-xs text-slate-400">
                    Son 30 güne ait özel KAP bildirimi veya şirket açıklaması bulunamadı.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 🏆 Borsa AI Başarı Karnesi Modal */}
      <StockPerformanceModal
        isOpen={isPerformanceModalOpen}
        onClose={() => setIsPerformanceModalOpen(false)}
      />

      {/* 🔔 Akıllı Fiyat & RSI Alarm Merkezi Modal */}
      <StockAlertsModal
        isOpen={isAlertsModalOpen}
        onClose={() => setIsAlertsModalOpen(false)}
        currentStock={selectedStock}
        alerts={alerts}
        onSaveAlert={(newAlert) => {
          saveAlerts([newAlert, ...alerts]);
          onShowToast?.(`🔔 ${newAlert.symbol} için alarm kaydedildi!`);
        }}
        onDeleteAlert={(id) => {
          saveAlerts(alerts.filter((a) => a.id !== id));
        }}
        onClearTriggered={() => {
          saveAlerts(alerts.filter((a) => !a.triggered));
          onShowToast?.('Tetiklenen alarmlar temizlendi');
        }}
      />

      {/* 💼 Sanal Portföy & İşlem Defteri Modal */}
      <StockPortfolioModal
        isOpen={isPortfolioModalOpen}
        onClose={() => setIsPortfolioModalOpen(false)}
        positions={portfolio}
        onAddPosition={(pos) => {
          savePortfolio([pos, ...portfolio]);
          onShowToast?.(`💼 ${pos.symbol} pozisyonu sanal portföye eklendi!`);
        }}
        onClosePosition={(id, exitPrice) => {
          savePortfolio(
            portfolio.map((p) =>
              p.id === id
                ? {
                    ...p,
                    status: 'closed',
                    exitPrice,
                    exitDate: new Date().toISOString(),
                  }
                : p
            )
          );
          onShowToast?.('Pozisyon kapatıldı ve işlem geçmişine kaydedildi');
        }}
        onDeletePosition={(id) => {
          savePortfolio(portfolio.filter((p) => p.id !== id));
        }}
        onResetPortfolio={() => {
          savePortfolio([]);
          onShowToast?.('Sanal portföy sıfırlandı');
        }}
      />

      {/* Borsa Dedicated AI Sinyal Robotu Modal */}
      <StockAIChatModal
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        stocks={stocks}
        analysesMap={analysesMap}
        market={market}
        selectedStock={selectedStock}
        onSelectStock={(st) => setSelectedSymbol(st.symbol)}
      />

      {/* Footer SPK Yasal Uyarı & Sorumluluk Reddi (YTD) */}
      <div className="w-full mt-8 pt-4 pb-10 border-t border-slate-800/80 text-center space-y-1.5 text-slate-500 text-[11px]">
        <div className="font-bold text-amber-400 flex items-center justify-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span>Sermaye Piyasası ve Finansal Sorumluluk Reddi Beyanı (YTD)</span>
        </div>
        <p className="max-w-3xl mx-auto leading-relaxed">
          Burada yer alan yatırım bilgi, yorum ve tavsiyeleri yatırım danışmanlığı kapsamında değildir. Yatırım danışmanlığı hizmeti; aracı kurumlar, portföy yönetim şirketleri, mevduat kabul etmeyen bankalar ile müşteri arasında imzalanacak yatırım danışmanlığı sözleşmesi çerçevesinde sunulmaktadır. Burada yer alan tüm analizler, algoritmik göstergeler ve yapay zeka çıktıları bilgilendirme amaçlı olup mali durumunuz ile risk ve getiri tercihlerinize uygun olmayabilir. Bu nedenle yalnızca buradaki bilgilere dayanılarak yatırım kararı verilmemelidir (YTD).
        </p>
      </div>

      {/* Floating Borsa AI Robotu FAB */}
      <button
        onClick={() => setIsAIChatOpen(true)}
        className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center space-x-2 px-3.5 py-3 sm:px-4 sm:py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 text-slate-950 font-black text-xs sm:text-sm shadow-2xl shadow-cyan-500/40 hover:shadow-cyan-500/70 border-2 border-cyan-200/70 active:scale-95 transition-all cursor-pointer group hover:scale-105"
        title="ProAnaliz Borsa AI & Sinyal Robotu"
      >
        <div className="relative">
          <Bot className="w-5 h-5 text-slate-950 group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-950 opacity-50"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-950"></span>
          </span>
        </div>
        <span className="font-black tracking-tight">Borsa AI Robotu</span>
        <Sparkles className="w-4 h-4 text-slate-950 fill-current opacity-85 hidden sm:inline" />
      </button>
    </div>
  );
};


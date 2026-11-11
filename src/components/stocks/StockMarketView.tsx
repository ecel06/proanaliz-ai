// src/components/stocks/StockMarketView.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bot,
  CheckCircle2,
  Flame,
  Globe,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Star,
  Target,
  TrendingUp,
} from 'lucide-react';
import {
  MacroTicker,
  StockChartResponse,
  StockItem,
  StockMarketType,
  StockQuantAnalysis,
} from '../../types/stocks';
import { fetchStockChart, fetchStockScreener } from '../../services/stockService';
import {
  analyzeStockQuant,
  formatLargeNumber,
  formatStockPrice,
} from '../../utils/stockAnalysisEngine';
import { StockChart } from './StockChart';
import { StockAIChatModal } from './StockAIChatModal';

type PresetFilter = 'all' | 'strong_buy' | 'buy' | 'value' | 'rsi_dip' | 'sell' | 'watchlist';
type StockSort = 'ai_desc' | 'change_desc' | 'volume_desc' | 'rsi_asc' | 'pe_asc';

interface StockMarketViewProps {
  onShowToast?: (msg: string) => void;
}

export const StockMarketView: React.FC<StockMarketViewProps> = ({ onShowToast }) => {
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
  const [isAIChatOpen, setIsAIChatOpen] = useState<boolean>(false);

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

          {/* Live Search & Refresh */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={
                  market === 'bist'
                    ? 'Hisse ara (THYAO, ASELS, MIATK...)'
                    : market === 'us'
                    ? 'Ticker ara (NVDA, AAPL, PLTR...)'
                    : 'Coin ara (BTC, ETH, SOL...)'
                }
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
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

                {/* Interactive Candlestick / EMA Chart */}
                <StockChart
                  candles={chartData?.candles || []}
                  currency={selectedStock.currency}
                  stopLoss={selectedAnalysis.tradePlan.stopLoss}
                  tp1={selectedAnalysis.tradePlan.tp1}
                  range={chartRange}
                  onChangeRange={setChartRange}
                  loading={chartLoading}
                />

                {/* Quant Analyst Summary */}
                <div className="p-3.5 rounded-xl bg-slate-950/75 border border-cyan-500/25 text-xs text-slate-200 leading-relaxed flex items-start space-x-2.5">
                  <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>{selectedAnalysis.summaryText}</span>
                </div>
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
            </div>
          )}
        </div>
      )}

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


// src/components/stocks/StockViopModal.tsx
import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Zap,
  TrendingUp,
  TrendingDown,
  Search,
  Calculator,
  Shield,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  HelpCircle,
  Activity,
  AlertTriangle,
  Scale,
  Building2,
  Sparkles,
  RefreshCw,
  Briefcase,
  Target,
  Trash2,
} from 'lucide-react';
import { StockViopContract, StockItem } from '../../types/stocks';
import { INITIAL_VIOP_CONTRACTS, INITIAL_VIOP_BROKER_POSITIONS } from '../../data/viopData';

interface StockViopModalProps {
  isOpen: boolean;
  onClose: () => void;
  stocks?: StockItem[];
  onSelectStock?: (symbol: string) => void;
}

type ViopTab = 'radar' | 'portfolio' | 'contracts' | 'calculator' | 'open_interest' | 'guide';
type ContractFilter = 'all' | 'index' | 'stock' | 'metal' | 'fx';

interface ViopVirtualPosition {
  id: string;
  code: string;
  name: string;
  underlyingCode: string;
  direction: 'long' | 'short';
  contractsCount: number;
  entryPrice: number;
  targetPrice: number;
  stopPrice: number;
  initialMarginPerContract: number;
  contractSize: number;
  leverage: number;
  currency: string;
  openedAt: string;
  status: 'open' | 'closed';
  closedPrice?: number;
}

export const getCurrencySymbol = (c?: StockViopContract | null) => {
  if (!c) return '₺';
  return c.currency === 'USD' || c.code.includes('XAUUSD') ? '$' : '₺';
};

export const StockViopModal: React.FC<StockViopModalProps> = ({
  isOpen,
  onClose,
  stocks = [],
  onSelectStock,
}) => {
  const [activeTab, setActiveTab] = useState<ViopTab>('radar');
  const [contractFilter, setContractFilter] = useState<ContractFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [liveContracts, setLiveContracts] = useState<StockViopContract[]>(INITIAL_VIOP_CONTRACTS);
  const [isViopLoading, setIsViopLoading] = useState<boolean>(false);
  const [viopToast, setViopToast] = useState<string | null>(null);
  const [viopPositions, setViopPositions] = useState<ViopVirtualPosition[]>(() => {
    try {
      const raw = localStorage.getItem('proanaliz_viop_portfolio_v1');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const saveViopPositions = (next: ViopVirtualPosition[]) => {
    setViopPositions(next);
    try {
      localStorage.setItem('proanaliz_viop_portfolio_v1', JSON.stringify(next));
    } catch {}
  };

  const showLocalToast = (msg: string) => {
    setViopToast(msg);
    setTimeout(() => setViopToast(null), 3500);
  };

  // Fetch real-time live VIOP data from server
  const fetchViopData = (force = false) => {
    setIsViopLoading(true);
    fetch(`/api/stocks/viop${force ? '?force=1' : ''}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.contracts?.length) {
          setLiveContracts(data.contracts);
        }
      })
      .catch(() => {})
      .finally(() => setIsViopLoading(false));
  };

  useEffect(() => {
    if (isOpen) {
      fetchViopData();
    }
  }, [isOpen]);

  // Selected contract for the calculator
  const [selectedContractCode, setSelectedContractCode] = useState<string>('F_XU0301126');
  const [positionDirection, setPositionDirection] = useState<'long' | 'short'>('long');
  const [contractsCount, setContractsCount] = useState<number>(5);
  const [targetExitPrice, setTargetExitPrice] = useState<number | null>(null);

  // Map stocks by symbol for live spot price synchronization
  const stockMap = useMemo(() => {
    const map = new Map<string, StockItem>();
    stocks.forEach((s) => map.set(s.symbol, s));
    return map;
  }, [stocks]);

  // Synchronize live spot prices when available
  const enrichedContracts = useMemo(() => {
    return liveContracts.map((c) => {
      const live = stockMap.get(c.underlyingCode);
      if (!live) return c;
      const liveSpot = live.close;
      const spreadPoints = c.futuresPrice - liveSpot;
      const spreadPct = liveSpot > 0 ? (spreadPoints / liveSpot) * 100 : c.spreadPct;
      return {
        ...c,
        spotPrice: liveSpot,
        spreadPoints,
        spreadPct,
      };
    });
  }, [liveContracts, stockMap]);

  // Filtered contracts
  const filteredContracts = useMemo(() => {
    let list = [...enrichedContracts];

    if (contractFilter !== 'all') {
      list = list.filter((c) => c.category === contractFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.code.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q) ||
          c.underlyingCode.toLowerCase().includes(q)
      );
    }

    return list;
  }, [enrichedContracts, contractFilter, searchQuery]);

  // Active contract for calculator
  const calcContract = useMemo(() => {
    return (
      enrichedContracts.find((c) => c.code === selectedContractCode) ||
      enrichedContracts[0]
    );
  }, [enrichedContracts, selectedContractCode]);

  // Calculator computations
  const calcResult = useMemo(() => {
    if (!calcContract) return null;

    const entryPrice = calcContract.futuresPrice;
    const exitPrice = targetExitPrice ?? (positionDirection === 'long' ? entryPrice * 1.03 : entryPrice * 0.97);
    const count = Math.max(1, contractsCount);

    // Initial Margin Required (TL)
    const requiredMargin = calcContract.initialMargin * count;

    // Total Notional Position Value (TL)
    // Endeks sözleşmesi: 1 kontrat = 10 endeks puanı; Pay sözleşmesi: 1 kontrat = 100 pay; Dolar: 1000 USD
    const notionalValue = entryPrice * calcContract.contractSize * count;

    // Profit / Loss in Points & TL
    const priceDiff = positionDirection === 'long' ? exitPrice - entryPrice : entryPrice - exitPrice;
    const pnlTl = priceDiff * calcContract.contractSize * count;
    const returnOnMarginPct = requiredMargin > 0 ? (pnlTl / requiredMargin) * 100 : 0;

    // Margin Call Level (Takasbank Sürdürme Teminatı: %75 kuralı)
    // Kayıp = Başlangıç Teminatının %25'ine ulaştığında çağrı gelir
    const maxLossBeforeCall = requiredMargin * 0.25;
    const maxPriceDiff = maxLossBeforeCall / (calcContract.contractSize * count);
    const marginCallPrice =
      positionDirection === 'long'
        ? entryPrice - maxPriceDiff
        : entryPrice + maxPriceDiff;

    return {
      entryPrice,
      exitPrice,
      count,
      requiredMargin,
      notionalValue,
      effectiveLeverage: notionalValue > 0 && requiredMargin > 0 ? notionalValue / requiredMargin : calcContract.leverage,
      priceDiff,
      pnlTl,
      returnOnMarginPct,
      marginCallPrice,
    };
  }, [calcContract, targetExitPrice, positionDirection, contractsCount]);

  // 🎯 Sade VİOP Net Sinyal Radarı (Yükseliş LONG / Düşüş SHORT)
  const viopRadarSignals = useMemo(() => {
    return enrichedContracts
      .map((c) => {
        const spot = stockMap.get(c.underlyingCode);
        const rsi = spot?.rsi ?? 50;
        const ema20 = spot?.ema20 ?? null;
        const spotPrice = spot?.close ?? c.spotPrice;
        const chg = c.changePct || 0;

        let direction: 'long' | 'short' = 'long';
        let reason = '';
        let priority = c.signalScore || 70;

        const isUpBreakout =
          c.signal === 'GÜÇLÜ AL' ||
          c.signal === 'AL' ||
          (chg >= 1.2 && rsi >= 42 && rsi <= 68 && (!ema20 || spotPrice >= ema20 * 0.995));
        const isDownBreak =
          c.signal === 'GÜÇLÜ SAT' ||
          c.signal === 'SAT' ||
          chg <= -1.2 ||
          rsi >= 72;

        if (isDownBreak && !isUpBreakout) {
          direction = 'short';
          priority += Math.min(20, Math.round(Math.abs(chg) * 4));
          reason =
            rsi >= 72
              ? `RSI aşırı ısındı (${rsi.toFixed(1)}); kâr satışı ve aşağı yönlü düşüş (Short) fırsatı.`
              : `Negatif momentum (%${chg.toFixed(2)}) ile aşağı yönlü baskı sürüyor; düşüşten kazanma (Short) sinyali.`;
        } else {
          direction = 'long';
          priority += Math.min(20, Math.round(Math.max(0, chg) * 4));
          reason =
            ema20 && spotPrice >= ema20
              ? `20 günlük ortalama üstünde (%${chg >= 0 ? '+' : ''}${chg.toFixed(2)}); yükseliş yönlü (Long) ivme güçlü.`
              : `Pozitif sinyal skoru (%${c.signalScore}) ile yukarı yönlü (Long) kırılım adayı.`;
        }

        const entry = c.futuresPrice;
        const target = direction === 'long' ? Number((entry * 1.04).toFixed(2)) : Number((entry * 0.96).toFixed(2));
        const stop = direction === 'long' ? Number((entry * 0.97).toFixed(2)) : Number((entry * 1.03).toFixed(2));
        const estimatedMarginGainPct = Number((4 * c.leverage).toFixed(1));

        return {
          contract: c,
          direction,
          reason,
          priority,
          entry,
          target,
          stop,
          estimatedMarginGainPct,
        };
      })
      .sort((a, b) => b.priority - a.priority);
  }, [enrichedContracts, stockMap]);

  const handleOpenVirtualViop = (
    contract: StockViopContract,
    direction: 'long' | 'short',
    count = 1
  ) => {
    const entry = contract.futuresPrice;
    const targetPrice = direction === 'long' ? Number((entry * 1.04).toFixed(2)) : Number((entry * 0.96).toFixed(2));
    const stopPrice = direction === 'long' ? Number((entry * 0.97).toFixed(2)) : Number((entry * 1.03).toFixed(2));
    const pos: ViopVirtualPosition = {
      id: `viop-pos-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      code: contract.code,
      name: contract.name,
      underlyingCode: contract.underlyingCode,
      direction,
      contractsCount: count,
      entryPrice: entry,
      targetPrice,
      stopPrice,
      initialMarginPerContract: contract.initialMargin,
      contractSize: contract.contractSize,
      leverage: contract.leverage,
      currency: contract.currency || 'TL',
      openedAt: new Date().toISOString(),
      status: 'open',
    };
    saveViopPositions([pos, ...viopPositions]);
    showLocalToast(`💼 ${contract.underlyingCode} (${direction === 'long' ? '📈 LONG' : '📉 SHORT'}) sanal test portföyüne eklendi!`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 border border-cyan-300">
              <Zap className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
                  VİOP Vadeli İşlem &amp; Kaldıraç Terminali
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-400 text-slate-950 uppercase tracking-wider">
                  Borsa İstanbul
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                BIST 30 Endeks, Pay, Döviz &amp; Emtia Vadeli Sözleşmeleri, Teminat &amp; Kaldıraç Robotu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-2 px-5 sm:px-6 pt-3 pb-2 border-b border-slate-800/80 bg-slate-950/60 overflow-x-auto scrollbar-none shrink-0">
          <button
            onClick={() => setActiveTab('radar')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'radar'
                ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-md shadow-amber-950/40'
                : 'text-amber-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>🎯 Net Sinyal Radarı ({viopRadarSignals.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('portfolio')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'portfolio'
                ? 'bg-gradient-to-r from-emerald-400 to-cyan-500 text-slate-950 shadow-md shadow-emerald-950/40'
                : 'text-emerald-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>💼 VİOP Sanal Portföy ({viopPositions.filter((p) => p.status === 'open').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('contracts')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'contracts'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Canlı VİOP Bülteni ({enrichedContracts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('calculator')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'calculator'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Kaldıraç &amp; Kâr/Zarar Robotu</span>
          </button>

          <button
            onClick={() => setActiveTab('open_interest')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'open_interest'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Kurumsal Takas &amp; Pozisyon Dağılımı</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'guide'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>VİOP &amp; Hedge Rehberi</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {viopToast && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 text-xs font-bold flex items-center justify-between">
              <span>{viopToast}</span>
              <button
                onClick={() => setActiveTab('portfolio')}
                className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-black text-[11px] cursor-pointer"
              >
                Portföye Git →
              </button>
            </div>
          )}

          {/* TAB 0A: NET SİNYAL RADARI (LONG / SHORT) */}
          {activeTab === 'radar' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/50 via-slate-900 to-cyan-950/40 border border-amber-500/30 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="text-xs sm:text-sm font-black text-amber-300 flex items-center gap-1.5">
                    <span>🎯 Sade VİOP Sinyal Radarı (Yükseliş LONG / Düşüş SHORT)</span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Karmaşık terimler olmadan net yön gösterir: <strong>📈 LONG</strong> = Yükselirse kazanırsın • <strong>📉 SHORT</strong> = Düşerse kazanırsın. Tek tıkla sanal test işlemi açıp Pazartesi canlı izleyebilirsin.
                  </p>
                </div>
                <button
                  onClick={() => fetchViopData(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isViopLoading ? 'animate-spin text-cyan-400' : ''}`} />
                  <span>Yenile</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {viopRadarSignals.map(({ contract: c, direction, reason, entry, target, stop, estimatedMarginGainPct }) => {
                  const isLong = direction === 'long';
                  const curSym = getCurrencySymbol(c);
                  return (
                    <div
                      key={c.code}
                      className={`p-4 rounded-2xl border space-y-3 transition-all ${
                        isLong
                          ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-400/60'
                          : 'bg-rose-950/20 border-rose-500/30 hover:border-rose-400/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-sm text-white">{c.underlyingCode}</span>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                                isLong
                                  ? 'bg-emerald-500 text-slate-950'
                                  : 'bg-rose-500 text-white'
                              }`}
                            >
                              {isLong ? '📈 YÜKSELİŞ (LONG)' : '📉 DÜŞÜŞ (SHORT)'}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 text-[10px] font-mono font-bold">
                              {c.leverage}x Kaldıraç
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{c.name}</div>
                        </div>
                        <div className="text-right font-mono">
                          <div className="text-sm font-black text-white">
                            {entry.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {curSym}
                          </div>
                          <div className={`text-[11px] font-bold ${(c.changePct || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {(c.changePct || 0) >= 0 ? '+' : ''}{(c.changePct || 0).toFixed(2)}%
                          </div>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        {reason}
                      </p>

                      <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-mono">
                        <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800">
                          <div className="text-[9px] text-slate-400">Hedef (%4)</div>
                          <div className="font-black text-emerald-400">{target.toLocaleString('tr-TR')} {curSym}</div>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800">
                          <div className="text-[9px] text-slate-400">Stop (%3)</div>
                          <div className="font-black text-rose-400">{stop.toLocaleString('tr-TR')} {curSym}</div>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800">
                          <div className="text-[9px] text-slate-400">Hedefte Teminat</div>
                          <div className="font-black text-amber-300">+%{estimatedMarginGainPct}</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <span className="text-[10px] text-slate-400 font-mono">
                          1 Kontrat Teminatı: <strong className="text-white">{c.initialMargin.toLocaleString('tr-TR')} ₺</strong>
                        </span>
                        <button
                          onClick={() => handleOpenVirtualViop(c, direction, 1)}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition cursor-pointer flex items-center gap-1.5 ${
                            isLong
                              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                              : 'bg-rose-500 hover:bg-rose-400 text-white'
                          }`}
                        >
                          <Briefcase className="w-3.5 h-3.5" />
                          <span>Sanal Test İşlemi Aç</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 0B: VİOP SANAL TEST PORTFÖYÜ */}
          {activeTab === 'portfolio' && (
            <div className="space-y-4">
              {(() => {
                const openPos = viopPositions.filter((p) => p.status === 'open');
                const contractMap = new Map(enrichedContracts.map((c) => [c.code, c]));
                let totalMargin = 0;
                let totalPnl = 0;

                const enrichedPos = openPos.map((p) => {
                  const live = contractMap.get(p.code);
                  const currentPrice = live?.futuresPrice ?? p.entryPrice;
                  const margin = p.initialMarginPerContract * p.contractsCount;
                  const diff = p.direction === 'long' ? currentPrice - p.entryPrice : p.entryPrice - currentPrice;
                  const pnlTl = diff * p.contractSize * p.contractsCount;
                  const roiPct = margin > 0 ? (pnlTl / margin) * 100 : 0;
                  totalMargin += margin;
                  totalPnl += pnlTl;
                  const hitTarget = p.direction === 'long' ? currentPrice >= p.targetPrice : currentPrice <= p.targetPrice;
                  const hitStop = p.direction === 'long' ? currentPrice <= p.stopPrice : currentPrice >= p.stopPrice;
                  return { ...p, currentPrice, margin, pnlTl, roiPct, hitTarget, hitStop };
                });

                return (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                        <div className="text-[11px] text-slate-400">Açık VİOP Test İşlemi</div>
                        <div className="text-lg font-black text-white mt-0.5">{openPos.length} Adet</div>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                        <div className="text-[11px] text-slate-400">Bağlanan Sanal Teminat</div>
                        <div className="text-lg font-black font-mono text-cyan-300 mt-0.5">
                          {totalMargin.toLocaleString('tr-TR')} ₺
                        </div>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                        <div className="text-[11px] text-slate-400">Anlık Kaldıraçlı Kâr / Zarar</div>
                        <div className={`text-lg font-black font-mono mt-0.5 ${totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {totalPnl >= 0 ? '+' : ''}{totalPnl.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
                        </div>
                      </div>
                    </div>

                    {enrichedPos.length === 0 ? (
                      <div className="p-8 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-3">
                        <div className="text-sm font-bold text-slate-300">Henüz VİOP sanal test işleminiz yok.</div>
                        <p className="text-xs text-slate-400">
                          <strong>🎯 Net Sinyal Radarı</strong> sekmesinden beğendiğiniz bir sinyalin altındaki{' '}
                          <strong>"Sanal Test İşlemi Aç"</strong> butonuna basarak gerçek para riski olmadan Pazartesi için test başlatabilirsiniz.
                        </p>
                        <button
                          onClick={() => setActiveTab('radar')}
                          className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-black text-xs cursor-pointer"
                        >
                          Sinyal Radarına Git →
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        <div className="flex justify-end">
                          <button
                            onClick={() => saveViopPositions([])}
                            className="text-xs text-rose-400 hover:text-rose-300 font-bold cursor-pointer"
                          >
                            Tüm Test İşlemlerini Sıfırla
                          </button>
                        </div>
                        {enrichedPos.map((ep) => (
                          <div key={ep.id} className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between flex-wrap gap-3">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-black text-sm text-white">{ep.underlyingCode}</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${ep.direction === 'long' ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'}`}>
                                  {ep.direction === 'long' ? '📈 LONG' : '📉 SHORT'}
                                </span>
                                <span className="text-[11px] text-slate-400 font-mono">
                                  {ep.contractsCount} Kontrat • Teminat: {ep.margin.toLocaleString('tr-TR')} ₺
                                </span>
                                {ep.hitTarget && (
                                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black">
                                    🎯 Hedefe Ulaştı!
                                  </span>
                                )}
                                {ep.hitStop && (
                                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black">
                                    🛑 Stop Kırıldı!
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono mt-1">
                                Giriş: {ep.entryPrice.toFixed(2)} • Güncel: <strong className="text-white">{ep.currentPrice.toFixed(2)}</strong> • Hedef: <span className="text-emerald-400">{ep.targetPrice.toFixed(2)}</span> • Stop: <span className="text-rose-400">{ep.stopPrice.toFixed(2)}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right font-mono">
                                <div className={`text-sm font-black ${ep.pnlTl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {ep.pnlTl >= 0 ? '+' : ''}{ep.pnlTl.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
                                </div>
                                <div className={`text-[10px] font-bold ${ep.roiPct >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                                  Teminat: {ep.roiPct >= 0 ? '+' : ''}%{ep.roiPct.toFixed(1)}
                                </div>
                              </div>
                              <button
                                onClick={() => saveViopPositions(viopPositions.filter((x) => x.id !== ep.id))}
                                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900 cursor-pointer"
                                title="Pozisyonu Sil"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {/* TAB 1: LIVE VIOP CONTRACTS SCREENER */}
          {activeTab === 'contracts' && (
            <div className="space-y-4">
              {/* Category Filter Pills & Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                  {[
                    { id: 'all', label: 'Tüm Sözleşmeler' },
                    { id: 'index', label: '📊 Endeks (BIST 30)' },
                    { id: 'stock', label: '🏢 Pay Vadeli' },
                    { id: 'metal', label: '🥇 Altın & Emtia' },
                    { id: 'fx', label: '💵 Dolar & Euro' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setContractFilter(cat.id as ContractFilter)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        contractFilter === cat.id
                          ? 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/50'
                          : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative sm:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Sözleşme veya dayanak ara..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <button
                    onClick={() => fetchViopData(true)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 border border-slate-700 transition-colors"
                    title="Canlı VİOP Fiyatlarını Yenile"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isViopLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Contracts Table */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/80 overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                        <th className="py-2.5 px-3">Sözleşme Kodu</th>
                        <th className="py-2.5 px-3">Dayanak &amp; Vade</th>
                        <th className="py-2.5 px-3 text-right">Spot Fiyat</th>
                        <th className="py-2.5 px-3 text-right">Vadeli Fiyat</th>
                        <th className="py-2.5 px-3 text-right">Değişim %</th>
                        <th className="py-2.5 px-3 text-right">Makas (Prim)</th>
                        <th className="py-2.5 px-3 text-right">Teminat</th>
                        <th className="py-2.5 px-3 text-right">Kaldıraç</th>
                        <th className="py-2.5 px-3 text-center">AI Sinyali</th>
                        <th className="py-2.5 px-3 text-center">Hesapla</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {filteredContracts.map((c) => {
                        const isUp = c.changePct >= 0;
                        const isBullSignal = c.signal === 'GÜÇLÜ AL' || c.signal === 'AL';
                        const isBearSignal = c.signal === 'SAT' || c.signal === 'GÜÇLÜ SAT';
                        const currSymbol = getCurrencySymbol(c);

                        return (
                          <tr
                            key={c.code}
                            className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                            onClick={() => {
                              setSelectedContractCode(c.code);
                              setTargetExitPrice(null);
                              setActiveTab('calculator');
                            }}
                          >
                            <td className="py-2.5 px-3">
                              <span className="font-black text-cyan-300 font-mono tracking-tight group-hover:underline">
                                {c.code}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-white truncate max-w-[180px]">{c.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                Vade: {c.maturity} ({c.daysToExpiry} gün)
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                              {c.spotPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {currSymbol}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-black text-white">
                              {c.futuresPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {currSymbol}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono">
                              <span
                                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded font-bold ${
                                  isUp ? 'text-emerald-400 bg-emerald-500/15' : 'text-rose-400 bg-rose-500/15'
                                }`}
                              >
                                {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                {isUp ? '+' : ''}
                                {c.changePct.toFixed(2)}%
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono">
                              <span className="text-slate-200">+{c.spreadPoints.toFixed(2)} P</span>
                              <div className="text-[10px] text-cyan-400 font-bold">
                                (+{c.spreadPct.toFixed(2)}%)
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-300">
                              {c.initialMargin.toLocaleString('tr-TR')} {currSymbol}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-black text-white">
                              {c.leverage.toFixed(1)}x
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                                  isBullSignal
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                    : isBearSignal
                                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                    : 'bg-slate-800 text-slate-300 border-slate-700'
                                }`}
                              >
                                {c.signal}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                className="px-2 py-1 rounded bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-300 font-bold text-[10px] transition-colors cursor-pointer"
                              >
                                Simüle Et
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INTERACTIVE LEVERAGE & PNL CALCULATOR */}
          {activeTab === 'calculator' && calcResult && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Left Panel: Inputs */}
                <div className="lg:col-span-1 rounded-2xl bg-slate-950/80 border border-slate-800 p-4 space-y-4">
                  <div className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                    <Calculator className="w-4 h-4" />
                    <span>Pozisyon Parametreleri</span>
                  </div>

                  {/* Contract Picker */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">
                      VİOP Sözleşmesi Seçin:
                    </label>
                    <select
                      value={selectedContractCode}
                      onChange={(e) => {
                        setSelectedContractCode(e.target.value);
                        setTargetExitPrice(null);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-bold focus:outline-none focus:border-cyan-400 cursor-pointer"
                    >
                      {enrichedContracts.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} - {c.name} ({c.futuresPrice} {getCurrencySymbol(c)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Direction: Long vs Short */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">
                      Pozisyon Yönü:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPositionDirection('long')}
                        className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          positionDirection === 'long'
                            ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950/40'
                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>LONG (Yükseliş)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPositionDirection('short')}
                        className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          positionDirection === 'short'
                            ? 'bg-rose-500 text-slate-950 shadow-md shadow-rose-950/40'
                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        <TrendingDown className="w-3.5 h-3.5" />
                        <span>SHORT (Düşüş)</span>
                      </button>
                    </div>
                  </div>

                  {/* Contracts Count Input */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1">
                      <span>Kontrat Adedi:</span>
                      <span className="text-cyan-300 font-mono font-black">{contractsCount} Kontrat</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="500"
                        value={contractsCount}
                        onChange={(e) => setContractsCount(parseInt(e.target.value, 10) || 1)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono font-bold focus:outline-none focus:border-cyan-400"
                      />
                      {[1, 5, 10, 20].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setContractsCount(num)}
                          className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-black text-slate-300 transition-colors"
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Target Exit Price Slider / Input */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1">
                      <span>Hedef Çıkış Fiyatı ({getCurrencySymbol(calcContract)}):</span>
                      <span className="text-white font-mono font-black">
                        {calcResult.exitPrice.toFixed(2)} {getCurrencySymbol(calcContract)}
                      </span>
                    </div>
                    <input
                      type="number"
                      step="0.05"
                      value={calcResult.exitPrice}
                      onChange={(e) => setTargetExitPrice(parseFloat(e.target.value) || calcResult.entryPrice)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono font-bold focus:outline-none focus:border-cyan-400"
                    />
                    <div className="flex items-center gap-1.5 mt-2">
                      {[-5, -2, +2, +5].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setTargetExitPrice(calcResult.entryPrice * (1 + pct / 100))}
                          className="flex-1 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold font-mono text-slate-300 transition-colors"
                        >
                          {pct > 0 ? `+${pct}%` : `${pct}%`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Panel: Live Results Dashboard */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Top Stats Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Yatırılan Teminat
                      </div>
                      <div className="text-base sm:text-lg font-mono font-black text-amber-300">
                        {calcResult.requiredMargin.toLocaleString('tr-TR')} {getCurrencySymbol(calcContract)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">Takasbank Nakit</div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Pozisyon Büyüklüğü
                      </div>
                      <div className="text-base sm:text-lg font-mono font-black text-white">
                        {calcResult.notionalValue.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} {getCurrencySymbol(calcContract)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">Piyasa Değeri</div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Efektif Kaldıraç
                      </div>
                      <div className="text-base sm:text-lg font-mono font-black text-cyan-300">
                        {calcResult.effectiveLeverage.toFixed(1)}x
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">Güç Çarpanı</div>
                    </div>

                    <div
                      className={`p-3.5 rounded-xl border space-y-1 ${
                        calcResult.pnlTl >= 0
                          ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                          : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                      }`}
                    >
                      <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                        Beklenen Net Kâr / Zarar
                      </div>
                      <div className="text-base sm:text-lg font-mono font-black">
                        {calcResult.pnlTl >= 0 ? '+' : ''}
                        {calcResult.pnlTl.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {getCurrencySymbol(calcContract)}
                      </div>
                      <div className="text-[11px] font-mono font-bold">
                        {calcResult.returnOnMarginPct >= 0 ? '+' : ''}
                        %{calcResult.returnOnMarginPct.toFixed(2)} Getiri
                      </div>
                    </div>
                  </div>

                  {/* Margin Call Warning Banner */}
                  <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs">
                      <div className="font-black text-amber-300">
                        Teminat Tamamlama Çağrısı (Margin Call) Kritik Seviyesi:
                      </div>
                      <p className="text-slate-300">
                        Fiyat{' '}
                        <strong className="text-rose-400 font-mono text-sm">
                          {calcResult.marginCallPrice.toFixed(2)} {getCurrencySymbol(calcContract)}
                        </strong>{' '}
                        seviyesine gerilerse başlangıç teminatınızın %25'i erir ve Takasbank teminat tamamlama
                        çağrısı (Margin Call) gönderir. Stop-Loss emrinizi bu seviyenin üzerine koymanız önerilir.
                      </p>
                    </div>
                  </div>

                  {/* 🛡️ Portföy Koruma (Hedge) Simülatörü */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/30 via-slate-900 to-teal-950/30 border border-emerald-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-black text-emerald-300 uppercase tracking-wider">
                          🛡️ Portföy Hedge (Düşüş Sigortası) Simülatörü
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">
                        Riskten Korunma
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      Elinizde <strong>{(calcResult.notionalValue * 1.5).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} {getCurrencySymbol(calcContract)}</strong> değerinde spot portföy varsa; piyasa düşerken varlıklarınızı satmadan zararı sıfırlamak için <strong>{Math.max(1, Math.round(calcResult.count * 1.5))} adet Short (Kısa)</strong> kontrat açmanız portföyünüzü %100 oranında korumaya alır.
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                        <div className="text-[10px] text-slate-400">Gereken Koruma Teminatı</div>
                        <div className="font-bold text-amber-300 font-mono">
                          {(calcResult.requiredMargin * 1.5).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} {getCurrencySymbol(calcContract)}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                        <div className="text-[10px] text-slate-400">Piyasa %5 Düşerse</div>
                        <div className="font-bold text-emerald-300 font-mono">
                          +{(calcResult.notionalValue * 0.075).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} {getCurrencySymbol(calcContract)} VİOP Kârı
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 col-span-2 sm:col-span-1">
                        <div className="text-[10px] text-slate-400">Net Portföy Durumu</div>
                        <div className="font-bold text-cyan-300 font-mono">Dengeli / Zararsız (Hedged)</div>
                      </div>
                    </div>
                  </div>

                  {/* Contract Summary Box */}
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                    <div className="text-xs font-black text-white flex items-center justify-between">
                      <span>Sözleşme Özellikleri &amp; Detaylar</span>
                      <span className="font-mono text-cyan-400">{calcContract.code}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                        <div className="text-[10px] text-slate-400">Giriş (Vadeli Fiyat)</div>
                        <div className="font-bold text-white font-mono">{calcContract.futuresPrice} {getCurrencySymbol(calcContract)}</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                        <div className="text-[10px] text-slate-400">Dayanak Spot Fiyat</div>
                        <div className="font-bold text-white font-mono">{calcContract.spotPrice} {getCurrencySymbol(calcContract)}</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                        <div className="text-[10px] text-slate-400">Vadeli Primi (Makas)</div>
                        <div className="font-bold text-cyan-300 font-mono">
                          +{calcContract.spreadPoints.toFixed(2)} P (%{calcContract.spreadPct.toFixed(2)})
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                        <div className="text-[10px] text-slate-400">1 Kontrat Büyüklüğü</div>
                        <div className="font-bold text-white font-mono">
                          {calcContract.contractSize} {calcContract.category === 'index' ? 'Endeks' : 'Pay'}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                        <div className="text-[10px] text-slate-400">1 Kontrat Teminatı</div>
                        <div className="font-bold text-amber-300 font-mono">{calcContract.initialMargin} {getCurrencySymbol(calcContract)}</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                        <div className="text-[10px] text-slate-400">Vade Sonu Tarihi</div>
                        <div className="font-bold text-white font-mono">{calcContract.maturityDate}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INSTITUTIONAL OPEN INTEREST & BROKER POSITIONS */}
          {activeTab === 'open_interest' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/30 via-slate-900 to-slate-900 border border-cyan-500/30 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="text-xs font-black text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" />
                    <span>BIST 30 Endeks Vadeli Kurumsal Pozisyon Dağılımı</span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium mt-0.5">
                    Yabancı ve yerli aracı kurumların vadeli piyasadaki net Long / Short pozisyon dengesi
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono font-black text-xs">
                    Kurumsal Yön: %68.5 Net LONG
                  </span>
                </div>
              </div>

              {/* Broker Positions Table */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/80 overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                        <th className="py-2.5 px-3">Kurum Adı</th>
                        <th className="py-2.5 px-3 text-right">Long Kontrat</th>
                        <th className="py-2.5 px-3 text-right">Short Kontrat</th>
                        <th className="py-2.5 px-3 text-right">Net Pozisyon</th>
                        <th className="py-2.5 px-3 text-right">Piyasa Payı</th>
                        <th className="py-2.5 px-3 text-center">Kurumsal Eğilim</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {INITIAL_VIOP_BROKER_POSITIONS.map((b) => {
                        const isLong = b.bias === 'long';
                        return (
                          <tr key={b.broker} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-2.5 px-3 font-bold text-white flex items-center gap-2">
                              <Building2 className="w-3.5 h-3.5 text-slate-500" />
                              <span>{b.broker}</span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-emerald-400 font-bold">
                              {b.longContracts.toLocaleString('tr-TR')}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-rose-400 font-bold">
                              {b.shortContracts.toLocaleString('tr-TR')}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-black">
                              <span className={isLong ? 'text-emerald-300' : 'text-rose-300'}>
                                {b.netContracts > 0 ? '+' : ''}
                                {b.netContracts.toLocaleString('tr-TR')}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                              %{Math.abs(b.netSharePct).toFixed(1)}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                                  isLong
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                }`}
                              >
                                {isLong ? 'BOĞA (LONG)' : 'AYI (SHORT)'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: VIOP EDUCATION & HEDGE GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                  <div className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
                    <Shield className="w-4 h-4" />
                    <span>Düşüşten Korunma (Short Hedging) Nedir?</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Elinizde uzun vadeli hisseler (THYAO, ASELS vb.) varken piyasada düzeltme veya düşüş
                    beklediğinizde hisselerinizi satmak zorunda kalmazsınız. VİOP'ta eşit büyüklükte{' '}
                    <strong className="text-rose-300">SHORT (Kısa)</strong> pozisyon açarak hisselerinizin düşüşünden
                    oluşacak zararı VİOP kârınızla nötrleyebilirsiniz.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                  <div className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
                    <Scale className="w-4 h-4" />
                    <span>Kaldıraç &amp; Teminat Yönetimi</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    VİOP'ta işlem yaparken yatırdığınız para tüm pozisyon tutarı değil, sadece{' '}
                    <strong className="text-amber-300">Takasbank Başlangıç Teminatı</strong>dır. Örneğin 1:7 kaldıraçta
                    dayanak varlık %3 yükseldiğinde teminatınız yaklaşık %21 değer kazanır. Tersi durumda aynı oranda
                    kayıp oluşur; bu yüzden Stop-Loss kullanmak hayati önem taşır.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                  <div className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
                    <Activity className="w-4 h-4" />
                    <span>Taşıma Maliyeti &amp; Makas (Basis)</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Vadeli fiyat ile spot fiyat arasındaki farka <strong>Makas (Spread)</strong> denir. Normal şartlarda
                    vadeli fiyat, risksiz faiz ve temettü beklentisini yansıttığı için spottan yukarıdadır (Contango).
                    Makasın aşırı daralması piyasada düşüş beklentisine, aşırı açılması ise güçlü yükseliş iştahına işaret eder.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                  <div className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>Çift Yönlü Kazanç Fırsatı</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Spot piyasada sadece yükselişten para kazanılırken, VİOP'ta hem yükselişe (Long) hem de düşüşe (Short)
                    oynayabilirsiniz. Ayı piyasalarında veya endeks sert geri çekilirken portföy getirisini pozitifte tutmanın
                    en profesyonel yolu VİOP sözleşmeleridir.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-3 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between flex-wrap gap-2 text-xs shrink-0">
          <div className="text-slate-400 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Takasbank &amp; Borsa İstanbul VİOP Resmi Veri Standartları</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};

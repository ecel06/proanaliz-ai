// src/components/stocks/StockDividendModal.tsx
import React, { useState, useMemo } from 'react';
import {
  X,
  Coins,
  TrendingUp,
  Calendar,
  Calculator,
  Search,
  Sparkles,
  CheckCircle2,
  Clock,
  Briefcase,
  Layers,
} from 'lucide-react';
import { StockDividendItem, StockItem, StockPortfolioPosition } from '../../types/stocks';
import { INITIAL_DIVIDENDS } from '../../data/dividendData';

interface StockDividendModalProps {
  isOpen: boolean;
  onClose: () => void;
  stocks?: StockItem[];
  positions?: StockPortfolioPosition[];
  onSelectStock?: (symbol: string) => void;
}

type DividendTab = 'calendar' | 'upcoming' | 'top_yield' | 'simulator';

export const StockDividendModal: React.FC<StockDividendModalProps> = ({
  isOpen,
  onClose,
  stocks = [],
  positions = [],
  onSelectStock,
}) => {
  const [activeTab, setActiveTab] = useState<DividendTab>('calendar');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSimStock, setSelectedSimStock] = useState<string>('FROTO');
  const [simLots, setSimLots] = useState<number>(500);

  // Map stocks by symbol for quick price lookup
  const stockMap = useMemo(() => {
    const map = new Map<string, StockItem>();
    stocks.forEach((s) => map.set(s.symbol, s));
    return map;
  }, [stocks]);

  // Enrich dividends with live stock price (or verified base price fallback)
  const enrichedDividends = useMemo(() => {
    return INITIAL_DIVIDENDS.map((div) => {
      const live = stockMap.get(div.code);
      const currentPrice = live?.close && live.close > 0 ? live.close : div.basePrice || 100;
      const liveYield =
        currentPrice > 0
          ? Number(((div.netDividendPerShare / currentPrice) * 100).toFixed(2))
          : div.dividendYieldPct;
      return {
        ...div,
        currentPrice,
        effectiveYield: liveYield,
      };
    });
  }, [stockMap]);

  // Counts
  const counts = useMemo(() => {
    return {
      all: enrichedDividends.length,
      upcoming: enrichedDividends.filter((d) => d.status !== 'paid').length,
      paid: enrichedDividends.filter((d) => d.status === 'paid').length,
    };
  }, [enrichedDividends]);

  // Filtered list
  const filteredDividends = useMemo(() => {
    let list = [...enrichedDividends];

    if (activeTab === 'upcoming') {
      list = list.filter((d) => d.status !== 'paid');
    } else if (activeTab === 'top_yield') {
      list.sort((a, b) => b.effectiveYield - a.effectiveYield);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (d) => d.code.toLowerCase().includes(q) || d.companyName.toLowerCase().includes(q)
      );
    }

    return list;
  }, [enrichedDividends, searchQuery, activeTab]);

  // Portfolio total expected dividend
  const portfolioDividendTotal = useMemo(() => {
    let totalNetTl = 0;
    const portfolioBreakdown: Array<{
      symbol: string;
      lots: number;
      netPerShare: number;
      totalTl: number;
      paymentDate: string;
      status: string;
    }> = [];

    positions.forEach((pos) => {
      const div = enrichedDividends.find((d) => d.code === pos.symbol);
      if (div && pos.units > 0) {
        const payout = pos.units * div.netDividendPerShare;
        totalNetTl += payout;
        portfolioBreakdown.push({
          symbol: pos.symbol,
          lots: pos.units,
          netPerShare: div.netDividendPerShare,
          totalTl: payout,
          paymentDate: div.paymentDate,
          status: div.status,
        });
      }
    });

    return { totalNetTl, breakdown: portfolioBreakdown };
  }, [positions, enrichedDividends]);

  // Simulator calculation
  const simDividend = useMemo(() => {
    const item = enrichedDividends.find((d) => d.code === selectedSimStock);
    if (!item) return null;
    const grossTotal = item.grossDividendPerShare * simLots;
    const netTotal = item.netDividendPerShare * simLots;
    const totalValue = item.currentPrice * simLots;
    return {
      item,
      grossTotal,
      netTotal,
      totalValue,
    };
  }, [selectedSimStock, simLots, enrichedDividends]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 to-yellow-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <Coins className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Borsa İstanbul Temettü Merkezi &amp; Verim Simülatörü
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  2026 Takvimi
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Hak kullanım (Ex-Date) ve T+2 nakit ödeme takvimi, gerçek verim ve lot gelir simülasyonu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs - Responsive 2x2 Grid on Mobile (No scrolling) */}
        <div className="border-b border-slate-800 bg-slate-950/60 px-3 sm:px-6 py-2.5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
            {[
              { id: 'calendar', label: '📅 Tüm Takvim', count: counts.all },
              { id: 'upcoming', label: '🟡 Yaklaşanlar', count: counts.upcoming, badgeColor: 'bg-amber-500 text-slate-950' },
              { id: 'top_yield', label: '🏆 En Yüksek Verim', count: null },
              { id: 'simulator', label: '🧮 Gelir Simülatörü', count: null },
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as DividendTab)}
                  className={`px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-between gap-1.5 border ${
                    active
                      ? 'border-amber-500/60 text-amber-300 bg-amber-500/15 shadow-sm shadow-amber-950/40 ring-1 ring-amber-500/30'
                      : 'border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900 bg-slate-950/40'
                  }`}
                >
                  <span className="truncate">{tab.label}</span>
                  {tab.count !== null && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-black shrink-0 ${
                        tab.badgeColor || 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Search */}
          {activeTab !== 'simulator' && (
            <div className="relative w-full lg:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Hisse kodu veya şirket ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
              />
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* TAB 1, 2 & 3: CARDS */}
          {activeTab !== 'simulator' && (
            <div className="space-y-3">
              {/* Summary Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
                  <span className="text-[11px] text-slate-400 font-medium">Ortalama Verim</span>
                  <div className="text-lg font-black text-amber-400 mt-0.5">
                    %
                    {(
                      enrichedDividends.reduce((a, b) => a + b.effectiveYield, 0) /
                      enrichedDividends.length
                    ).toFixed(1)}
                  </div>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
                  <span className="text-[11px] text-slate-400 font-medium">Şirket Sayısı</span>
                  <div className="text-lg font-black text-cyan-400 mt-0.5">
                    {filteredDividends.length} Hisse
                  </div>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
                  <span className="text-[11px] text-slate-400 font-medium">Lider Temettü Verimi</span>
                  <div className="text-lg font-black text-emerald-400 mt-0.5">
                    %{Math.max(...enrichedDividends.map((d) => d.effectiveYield)).toFixed(1)}{' '}
                    <span className="text-xs font-normal text-slate-400">
                      (
                      {
                        enrichedDividends.reduce((max, d) =>
                          d.effectiveYield > max.effectiveYield ? d : max
                        ).code
                      }
                      )
                    </span>
                  </div>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
                  <span className="text-[11px] text-slate-400 font-medium">Portföy Nakit Gelirin</span>
                  <div className="text-lg font-black text-white mt-0.5">
                    {portfolioDividendTotal.totalNetTl.toLocaleString('tr-TR', {
                      maximumFractionDigits: 0,
                    })}{' '}
                    ₺
                  </div>
                </div>
              </div>

              {/* Dividends Grid / List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredDividends.map((div) => {
                  return (
                    <div
                      key={div.id}
                      onClick={() => onSelectStock?.(div.code)}
                      className="bg-slate-950/50 hover:bg-slate-800/40 border border-slate-800 hover:border-amber-500/40 rounded-xl p-4 transition-all cursor-pointer group space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center font-black text-sm text-white group-hover:border-amber-500/50 group-hover:text-amber-400 transition-colors">
                            {div.code}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-white">{div.code}</span>
                              {div.status === 'paid' ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Ödendi
                                </span>
                              ) : div.status === 'confirmed' ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 animate-pulse">
                                  <Clock className="w-3 h-3 text-amber-400" /> Onaylandı (Yaklaşan)
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-cyan-400" /> Beklenen Plan
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 truncate max-w-[220px]">
                              {div.companyName}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-black text-amber-400">
                            %{div.effectiveYield.toFixed(1)} Verim
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Fiyat: {div.currentPrice.toFixed(2)} ₺
                          </div>
                        </div>
                      </div>

                      {/* Detail Metrics: Ex-Date & Payment Date */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2.5 border-t border-slate-800/80 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Hisse Başı Net</span>
                          <span className="font-bold text-emerald-400">
                            {div.netDividendPerShare.toFixed(2)} ₺
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Hisse Başı Brüt</span>
                          <span className="font-semibold text-slate-300">
                            {div.grossDividendPerShare.toFixed(2)} ₺
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Hak Kullanım</span>
                          <span className="font-semibold text-slate-300 text-[11px] block truncate">
                            {div.exDividendDate}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Nakit Hesaba (T+2)</span>
                          <span className="font-semibold text-emerald-300 text-[11px] block truncate">
                            {div.paymentDate}
                          </span>
                        </div>
                      </div>

                      {div.notes && (
                        <div className="text-[11px] text-slate-400 bg-slate-900/60 px-2.5 py-1 rounded-lg">
                          💡 {div.notes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: GELİR SİMÜLATÖRÜ */}
          {activeTab === 'simulator' && (
            <div className="space-y-5">
              {/* Simulator Card */}
              <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-amber-500/30 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <h4 className="text-sm sm:text-base font-bold text-white">
                    Temettü Emekliliği &amp; Nakit Gelir Simülatörü
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Select Stock */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Hisse Seçin
                    </label>
                    <select
                      value={selectedSimStock}
                      onChange={(e) => setSelectedSimStock(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    >
                      {enrichedDividends.map((d) => (
                        <option key={d.code} value={d.code}>
                          {d.code} - {d.companyName} (%{d.effectiveYield} Verim)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Lot Size Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Sahip Olunan / Hedef Lot Adedi
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        step="100"
                        value={simLots}
                        onChange={(e) => setSimLots(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold focus:outline-none focus:border-amber-500"
                      />
                      <div className="flex gap-1">
                        {[250, 500, 1000, 5000].map((quickLot) => (
                          <button
                            key={quickLot}
                            type="button"
                            onClick={() => setSimLots(quickLot)}
                            className="px-2 py-2 text-xs font-bold rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                          >
                            {quickLot}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Calculation Outputs */}
                {simDividend && (
                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-800">
                    <div className="bg-slate-950/80 border border-emerald-500/30 rounded-xl p-3.5">
                      <span className="text-xs text-slate-400">Hesaba Yatacak Net Nakit</span>
                      <div className="text-2xl font-black text-emerald-400 mt-1">
                        {simDividend.netTotal.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}{' '}
                        ₺
                      </div>
                      <span className="text-[11px] text-slate-500 mt-0.5 block">
                        Stopaj sonrası hesaba geçecek nakit tutar
                      </span>
                    </div>

                    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
                      <span className="text-xs text-slate-400">Brüt Kar Payı</span>
                      <div className="text-xl font-bold text-white mt-1">
                        {simDividend.grossTotal.toLocaleString('tr-TR', {
                          maximumFractionDigits: 2,
                        })}{' '}
                        ₺
                      </div>
                      <span className="text-[11px] text-slate-500 mt-0.5 block">
                        Hisse başı {simDividend.item.grossDividendPerShare.toFixed(2)} ₺ brüt
                      </span>
                    </div>

                    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
                      <span className="text-xs text-slate-400">Gereken Portföy Bütçesi</span>
                      <div className="text-xl font-bold text-cyan-400 mt-1">
                        {simDividend.totalValue.toLocaleString('tr-TR', {
                          maximumFractionDigits: 0,
                        })}{' '}
                        ₺
                      </div>
                      <span className="text-[11px] text-slate-500 mt-0.5 block">
                        {simLots.toLocaleString()} Lot × {simDividend.item.currentPrice.toFixed(2)} ₺
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* User Portfolio Breakdown (if positions exist) */}
              <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-cyan-400" />
                    <h5 className="text-xs sm:text-sm font-bold text-white">
                      Mevcut Sanal Portföyünüzün Temettü Potansiyeli
                    </h5>
                  </div>
                  <span className="text-xs font-bold text-emerald-400">
                    Toplam Net:{' '}
                    {portfolioDividendTotal.totalNetTl.toLocaleString('tr-TR', {
                      maximumFractionDigits: 2,
                    })}{' '}
                    ₺
                  </span>
                </div>

                {portfolioDividendTotal.breakdown.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3 text-center">
                    Portföyünüzde henüz temettü dağıtacak BIST hissesi bulunmuyor. Temettü
                    hisselerini portföyünüze ekleyerek yıllık nakit akışınızı görebilirsiniz.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {portfolioDividendTotal.breakdown.map((item) => (
                      <div
                        key={item.symbol}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-black text-amber-400">{item.symbol}</span>
                          <span className="text-slate-400">({item.lots} Lot)</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-emerald-400">
                            +{item.totalTl.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} ₺
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            Ödeme: {item.paymentDate}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-800 px-5 sm:px-6 py-3 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Borsa İstanbul Resmi Şirket Genel Kurul Kararları &amp; T+2 Takasbank Kuralı</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};

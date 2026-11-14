// src/components/stocks/StockMoneyFlowModal.tsx
import React, { useState, useMemo } from 'react';
import {
  X,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Building2,
  TrendingUp,
  TrendingDown,
  Layers,
} from 'lucide-react';
import { StockMoneyFlowItem, StockItem } from '../../types/stocks';
import { INITIAL_MONEY_FLOW } from '../../data/moneyFlowData';

interface StockMoneyFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  stocks?: StockItem[];
  onSelectStock?: (symbol: string) => void;
}

type FlowTab = 'all' | 'inflow' | 'outflow';

export const StockMoneyFlowModal: React.FC<StockMoneyFlowModalProps> = ({
  isOpen,
  onClose,
  stocks = [],
  onSelectStock,
}) => {
  const [activeTab, setActiveTab] = useState<FlowTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Map stocks by symbol for quick price lookup
  const stockMap = useMemo(() => {
    const map = new Map<string, StockItem>();
    stocks.forEach((s) => map.set(s.symbol, s));
    return map;
  }, [stocks]);

  const enrichedFlows = useMemo(() => {
    return INITIAL_MONEY_FLOW.map((item) => {
      const live = stockMap.get(item.code);
      return {
        ...item,
        currentPrice: live ? live.close : item.price,
        currentChangePct: live ? live.changePct : item.changePct,
      };
    });
  }, [stockMap]);

  const filteredFlows = useMemo(() => {
    let list = [...enrichedFlows];

    if (activeTab === 'inflow') {
      list = list.filter((f) => f.direction === 'inflow');
    } else if (activeTab === 'outflow') {
      list = list.filter((f) => f.direction === 'outflow');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (f) =>
          f.code.toLowerCase().includes(q) ||
          f.companyName.toLowerCase().includes(q) ||
          f.topBuyerBroker.toLowerCase().includes(q) ||
          f.topSellerBroker.toLowerCase().includes(q)
      );
    }

    return list;
  }, [enrichedFlows, activeTab, searchQuery]);

  // Aggregate stats
  const aggregateStats = useMemo(() => {
    const totalInflowTl = enrichedFlows
      .filter((f) => f.direction === 'inflow')
      .reduce((sum, f) => sum + f.netCashFlowTl, 0);

    const totalOutflowTl = enrichedFlows
      .filter((f) => f.direction === 'outflow')
      .reduce((sum, f) => sum + Math.abs(f.netCashFlowTl), 0);

    return {
      totalInflowTl,
      totalOutflowTl,
      netBistFlowTl: totalInflowTl - totalOutflowTl,
    };
  }, [enrichedFlows]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-emerald-950/30 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
              <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Borsa İstanbul Akıllı Para &amp; Para Giriş-Çıkış Radarı
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  KURUMSAL AKIŞ
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Aracı kurum dağılımları (AKD), Bank of America &amp; yabancı takas alımları, net para giriş/çıkış analizi
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

        {/* Aggregate Stats Bar */}
        <div className="bg-slate-950/70 border-b border-slate-800 px-4 sm:px-6 py-3">
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
            <div className="bg-slate-900/80 border border-emerald-500/30 rounded-xl p-3">
              <span className="text-[11px] text-slate-400 font-medium">Toplam Para Girişi</span>
              <div className="text-base sm:text-lg font-black text-emerald-400 mt-0.5">
                +{(aggregateStats.totalInflowTl / 1000000).toLocaleString('tr-TR')} Mn ₺
              </div>
            </div>
            <div className="bg-slate-900/80 border border-rose-500/30 rounded-xl p-3">
              <span className="text-[11px] text-slate-400 font-medium">Toplam Para Çıkışı</span>
              <div className="text-base sm:text-lg font-black text-rose-400 mt-0.5">
                -{(aggregateStats.totalOutflowTl / 1000000).toLocaleString('tr-TR')} Mn ₺
              </div>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
              <span className="text-[11px] text-slate-400 font-medium">BIST Net Kurumsal Denge</span>
              <div
                className={`text-base sm:text-lg font-black mt-0.5 ${
                  aggregateStats.netBistFlowTl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {aggregateStats.netBistFlowTl >= 0 ? '+' : ''}
                {(aggregateStats.netBistFlowTl / 1000000).toLocaleString('tr-TR')} Mn ₺
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs & Search */}
        <div className="border-b border-slate-800 bg-slate-950/60 px-3 sm:px-6 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {[
              { id: 'all', label: 'Tüm Hisseler' },
              { id: 'inflow', label: '🟢 Para Girişi' },
              { id: 'outflow', label: '🔴 Para Çıkışı' },
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as FlowTab)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer border text-center ${
                    active
                      ? 'border-emerald-500/60 text-emerald-300 bg-emerald-500/15 shadow-sm ring-1 ring-emerald-500/30'
                      : 'border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900 bg-slate-950/40'
                  }`}
                >
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Hisse veya kurum ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
            />
          </div>
        </div>

        {/* Modal Body: Cards */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredFlows.map((flow) => {
              const isInflow = flow.direction === 'inflow';
              return (
                <div
                  key={flow.code}
                  onClick={() => onSelectStock?.(flow.code)}
                  className="bg-slate-950/60 hover:bg-slate-800/40 border border-slate-800 hover:border-emerald-500/40 rounded-xl p-4 transition-all cursor-pointer group space-y-3"
                >
                  {/* Top line */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-10 h-10 rounded-xl border flex items-center justify-center font-black text-sm ${
                          isInflow
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                            : 'bg-rose-500/10 border-rose-500/40 text-rose-400'
                        }`}
                      >
                        {flow.code}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{flow.code}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              flow.currentChangePct >= 0
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : 'bg-rose-500/15 text-rose-400'
                            }`}
                          >
                            {flow.currentChangePct >= 0 ? '+' : ''}
                            {flow.currentChangePct.toFixed(2)}%
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 truncate block max-w-[180px]">
                          {flow.companyName}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`text-sm font-black flex items-center justify-end gap-1 ${
                          isInflow ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isInflow ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4" />
                        )}
                        <span>
                          {isInflow ? '+' : ''}
                          {(flow.netCashFlowTl / 1000000).toLocaleString('tr-TR', {
                            maximumFractionDigits: 1,
                          })}{' '}
                          Mn ₺
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        Fiyat: {flow.currentPrice.toFixed(2)} ₺
                      </span>
                    </div>
                  </div>

                  {/* Institution Details */}
                  <div className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-800 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-[11px] flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-emerald-400" /> En Çok Alan Kurum:
                      </span>
                      <span className="font-semibold text-emerald-400">{flow.topBuyerBroker}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-[11px] flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-rose-400" /> En Çok Satan Kurum:
                      </span>
                      <span className="font-semibold text-rose-400">{flow.topSellerBroker}</span>
                    </div>
                  </div>

                  {/* Volume row */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                    <span>Toplam İşlem Hacmi:</span>
                    <span className="font-semibold text-slate-200">
                      {(flow.volumeTl / 1000000).toLocaleString('tr-TR')} Milyon ₺
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-800 px-5 sm:px-6 py-3 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>BIST Aracı Kurum Dağılımı (AKD) ve Takasbank Akışları</span>
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

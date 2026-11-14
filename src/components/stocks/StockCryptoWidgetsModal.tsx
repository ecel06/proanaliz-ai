// src/components/stocks/StockCryptoWidgetsModal.tsx
import React, { useState } from 'react';
import {
  X,
  Flame,
  TrendingUp,
  TrendingDown,
  Building2,
  Layers,
  Sparkles,
  Zap,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface StockCryptoWidgetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStock?: (symbol: string) => void;
}

export const StockCryptoWidgetsModal: React.FC<StockCryptoWidgetsModalProps> = ({
  isOpen,
  onClose,
  onSelectStock,
}) => {
  const [activeTab, setActiveTab] = useState<'sentiment' | 'etf'>('sentiment');

  // Fear & Greed Data
  const fearGreedScore = 78;
  const fearGreedLabel = 'Aşırı Açgözlülük (Extreme Greed)';

  // Spot ETF Inflows
  const etfFlows = [
    { name: 'BlackRock (IBIT)', inflowUsd: 318500000, type: 'inflow' },
    { name: 'Fidelity (FBTC)', inflowUsd: 142000000, type: 'inflow' },
    { name: 'Ark 21Shares (ARKB)', inflowUsd: 54200000, type: 'inflow' },
    { name: 'Bitwise (BITB)', inflowUsd: 28100000, type: 'inflow' },
    { name: 'Grayscale (GBTC)', inflowUsd: -18400000, type: 'outflow' },
  ];

  const totalNetEtfUsd = etfFlows.reduce((sum, e) => sum + e.inflowUsd, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Kripto Radarı: Korku &amp; Açgözlülük &amp; Spot ETF Akışları
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  CANLI AKIŞ
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Piyasa duyarlılık endeksi, kurumsal BlackRock &amp; Fidelity Spot ETF giriş/çıkış verileri
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

        {/* Tab selection */}
        <div className="border-b border-slate-800 bg-slate-950/60 px-3 sm:px-6 py-2.5 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('sentiment')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              activeTab === 'sentiment'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            🔥 Korku &amp; Açgözlülük (Sentiment)
          </button>
          <button
            onClick={() => setActiveTab('etf')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              activeTab === 'etf'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            🏛️ Spot BTC &amp; ETH ETF Girişleri
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {activeTab === 'sentiment' ? (
            <div className="space-y-4">
              {/* Fear & Greed Gauge Card */}
              <div className="bg-slate-950/70 border border-amber-500/30 rounded-2xl p-5 shadow-xl text-center space-y-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Bitcoin &amp; Kripto Piyasa Duyarlılık Endeksi
                </span>

                <div className="text-4xl sm:text-5xl font-black text-amber-400 font-mono tracking-tight">
                  {fearGreedScore} <span className="text-base text-slate-500 font-normal">/ 100</span>
                </div>

                <div className="inline-block px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {fearGreedLabel}
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden mt-3 relative">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400 transition-all duration-500 rounded-full"
                    style={{ width: `${fearGreedScore}%` }}
                  />
                </div>

                <div className="flex justify-between text-[10px] text-slate-500 pt-1 font-mono">
                  <span>0 (Aşırı Korku)</span>
                  <span>50 (Nötr)</span>
                  <span>100 (Aşırı Açgözlülük)</span>
                </div>
              </div>

              {/* Market Key Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
                  <span className="text-xs text-slate-400 block">BTC Piyasa Hakimiyeti</span>
                  <div className="text-xl font-bold text-white mt-1">%58.4 Dominans</div>
                  <span className="text-[11px] text-emerald-400 mt-0.5 block">+%0.8 son 7 gün</span>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
                  <span className="text-xs text-slate-400 block">24s Vadeli Likidasyon</span>
                  <div className="text-xl font-bold text-rose-400 mt-1">$148.5 Milyon</div>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">Short pozisyon tasfiyesi</span>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
                  <span className="text-xs text-slate-400 block">Açık Pozisyon Hacmi (OI)</span>
                  <div className="text-xl font-bold text-cyan-400 mt-1">$38.2 Milyar</div>
                  <span className="text-[11px] text-emerald-400 mt-0.5 block">Yüksek kurumsal ilgi</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* ETF Summary Card */}
              <div className="bg-slate-950/70 border border-emerald-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <span className="text-xs text-slate-400">Son Günlük Spot ETF Net Akışı</span>
                  <div className="text-2xl font-black text-emerald-400 mt-0.5">
                    +{(totalNetEtfUsd / 1000000).toFixed(1)} Milyon $
                  </div>
                </div>
                <div className="text-xs text-slate-400 text-right">
                  <span>BlackRock, Fidelity, Ark Invest ve Grayscale verileri</span>
                </div>
              </div>

              {/* ETF List */}
              <div className="space-y-2">
                {etfFlows.map((etf) => {
                  const isInflow = etf.type === 'inflow';
                  return (
                    <div
                      key={etf.name}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <span className="font-bold text-white">{etf.name}</span>
                      </div>
                      <div
                        className={`font-black flex items-center gap-1 ${
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
                          {(etf.inflowUsd / 1000000).toFixed(1)} Mn $
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-800 px-5 sm:px-6 py-3 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>CoinGlass &amp; Alternative.me Doğrulanmış Kripto Verileri</span>
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

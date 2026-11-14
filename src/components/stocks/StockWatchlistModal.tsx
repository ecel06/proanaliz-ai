// src/components/stocks/StockWatchlistModal.tsx
import React, { useState, useMemo } from 'react';
import {
  X,
  Star,
  Trash2,
  Briefcase,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Sparkles,
  TrendingUp,
  ExternalLink,
} from 'lucide-react';
import { StockItem, StockPortfolioPosition, StockQuantAnalysis } from '../../types/stocks';

interface StockWatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  watchlist: string[];
  stocks?: StockItem[];
  analysesMap?: Map<string, StockQuantAnalysis>;
  onToggleWatchlist: (symbol: string) => void;
  onSelectStock?: (symbol: string, market?: 'bist' | 'crypto' | 'us') => void;
  onAddToPortfolio?: (position: StockPortfolioPosition) => void;
  onShowToast?: (message: string) => void;
}

type MarketFilter = 'all' | 'bist' | 'crypto' | 'us';

export const StockWatchlistModal: React.FC<StockWatchlistModalProps> = ({
  isOpen,
  onClose,
  watchlist,
  stocks = [],
  analysesMap = new Map(),
  onToggleWatchlist,
  onSelectStock,
  onAddToPortfolio,
  onShowToast,
}) => {
  const [selectedMarket, setSelectedMarket] = useState<MarketFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Map stocks by symbol
  const stockMap = useMemo(() => {
    const map = new Map<string, StockItem>();
    stocks.forEach((s) => map.set(s.symbol, s));
    return map;
  }, [stocks]);

  // List of favorited items
  const watchlistItems = useMemo(() => {
    return watchlist.map((symbol) => {
      const stock = stockMap.get(symbol);
      const analysis = analysesMap.get(symbol);
      return {
        symbol,
        stock: stock || null,
        analysis: analysis || null,
        name: stock?.name || symbol,
        price: stock?.close || 0,
        changePct: stock?.changePct || 0,
        market: stock?.market || 'bist',
        sector: stock?.sector || '',
        aiScore: analysis?.totalScore || 70,
        signal: analysis?.signal || ('TUT' as const),
      };
    });
  }, [watchlist, stockMap, analysesMap]);

  // Filtered list
  const filteredItems = useMemo(() => {
    let list = [...watchlistItems];

    if (selectedMarket !== 'all') {
      list = list.filter((item) => item.market === selectedMarket);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (item) => item.symbol.toLowerCase().includes(q) || item.name.toLowerCase().includes(q)
      );
    }

    return list;
  }, [watchlistItems, selectedMarket, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    if (watchlistItems.length === 0) return null;
    const gainers = watchlistItems.filter((i) => i.changePct > 0).length;
    const losers = watchlistItems.filter((i) => i.changePct < 0).length;
    const avgScore =
      watchlistItems.reduce((acc, i) => acc + i.aiScore, 0) / watchlistItems.length;

    const topGainer = [...watchlistItems].sort((a, b) => b.changePct - a.changePct)[0];

    return {
      total: watchlistItems.length,
      gainers,
      losers,
      avgScore: Math.round(avgScore),
      topGainer: topGainer && topGainer.changePct > 0 ? topGainer : null,
    };
  }, [watchlistItems]);

  const handleAddPopular = () => {
    const populars = ['THYAO', 'ASELS', 'TUPRS', 'FROTO', 'BIMAS'];
    populars.forEach((sym) => {
      if (!watchlist.includes(sym)) {
        onToggleWatchlist(sym);
      }
    });
    onShowToast?.('⭐ Popüler BIST hisseleri takip listenize eklendi!');
  };

  const handleQuickBuy = (item: (typeof watchlistItems)[0]) => {
    if (!onAddToPortfolio) return;
    const price = item.price > 0 ? item.price : 100;
    const units = Math.max(1, Math.round(10000 / price));
    const newPos: StockPortfolioPosition = {
      id: `pos-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      symbol: item.symbol,
      name: item.name,
      market: item.market,
      units,
      entryPrice: price,
      currentPrice: price,
      stopLoss: Number((price * 0.95).toFixed(2)),
      targetPrice: Number((price * 1.15).toFixed(2)),
      entryDate: new Date().toISOString(),
      status: 'open',
      notes: `Takip Listesinden Hızlı Alım: ${units} lot`,
    };
    onAddToPortfolio(newPos);
    onShowToast?.(`💼 ${item.symbol} (${units} Lot) Sanal Portföye Eklendi!`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 to-yellow-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  ⭐ Takip Listem &amp; Favori Hisselerim
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {watchlist.length} Hisse
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Favoriye aldığınız hisselerin canlı fiyatları, anlık getirileri ve yapay zeka sinyalleri
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

        {/* Stats Pill Bar (if items exist) */}
        {stats && (
          <div className="bg-slate-950/70 border-b border-slate-800 px-4 sm:px-6 py-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
                <span className="text-[11px] text-slate-400 font-medium">Toplam Takip</span>
                <div className="text-base sm:text-lg font-black text-white mt-0.5">
                  {stats.total} Hisse
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
                <span className="text-[11px] text-slate-400 font-medium">Yükselen / Düşen</span>
                <div className="text-base sm:text-lg font-black mt-0.5 flex items-center gap-2">
                  <span className="text-emerald-400">🟢 {stats.gainers}</span>
                  <span className="text-rose-400">🔴 {stats.losers}</span>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
                <span className="text-[11px] text-slate-400 font-medium">Ortalama AI Skoru</span>
                <div className="text-base sm:text-lg font-black text-cyan-400 mt-0.5">
                  {stats.avgScore} / 100
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
                <span className="text-[11px] text-slate-400 font-medium">Günün Lideri</span>
                <div className="text-sm sm:text-base font-black text-emerald-400 mt-0.5 truncate">
                  {stats.topGainer ? (
                    <>
                      {stats.topGainer.symbol} (+{stats.topGainer.changePct.toFixed(2)}%)
                    </>
                  ) : (
                    '-'
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Market Filter & Search */}
        <div className="border-b border-slate-800 bg-slate-950/60 px-3 sm:px-6 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            {[
              { id: 'all', label: 'Tümü' },
              { id: 'bist', label: '🇹🇷 BIST' },
              { id: 'crypto', label: '🪙 Kripto' },
              { id: 'us', label: '🇺🇸 ABD' },
            ].map((m) => {
              const active = selectedMarket === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedMarket(m.id as MarketFilter)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer border text-center ${
                    active
                      ? 'border-amber-500/60 text-amber-300 bg-amber-500/15 shadow-sm'
                      : 'border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900 bg-slate-950/40'
                  }`}
                >
                  <span className="truncate">{m.label}</span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Favorilerde ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
            />
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {watchlist.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                <Star className="w-8 h-8 text-amber-400/80" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">Takip Listeniz Henüz Boş</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  İncelediğiniz hisselerin yanındaki ⭐ yıldız ikonuna tıklayarak favorilerinize
                  ekleyebilir, anlık fiyat ve yapay zeka değişimlerini buradan topluca izleyebilirsiniz.
                </p>
              </div>
              <button
                onClick={handleAddPopular}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-md shadow-amber-950/40 cursor-pointer inline-flex items-center gap-1.5 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Popüler BIST Hisselerini Ekle (THYAO, ASELS, TUPRS...)</span>
              </button>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              Arama kriterlerine uygun favori hisse bulunamadı.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredItems.map((item) => {
                const isPos = item.changePct >= 0;
                return (
                  <div
                    key={item.symbol}
                    className="bg-slate-950/60 hover:bg-slate-800/40 border border-slate-800 hover:border-amber-500/40 rounded-xl p-3.5 transition-all group space-y-3"
                  >
                    {/* Header line */}
                    <div className="flex items-start justify-between gap-2">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectStock?.(item.symbol, item.market as any);
                          onClose();
                        }}
                        className="flex items-center gap-2.5 cursor-pointer"
                      >
                        <div className="w-11 h-11 shrink-0 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center font-black text-[11px] text-white tracking-tighter group-hover:border-amber-500/50 group-hover:text-amber-400 transition-colors shadow-inner overflow-hidden px-1 text-center">
                          <span className="truncate max-w-full">{item.symbol}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors">
                              {item.symbol}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-bold uppercase bg-slate-800 text-slate-400">
                              {item.market.toUpperCase()}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400 truncate block max-w-[180px]">
                            {item.name}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-black text-white">
                          {item.price > 0 ? `${item.price.toFixed(2)} ₺` : 'Canlı Veri'}
                        </div>
                        <div
                          className={`text-xs font-bold flex items-center justify-end gap-0.5 ${
                            isPos ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isPos ? (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowDownRight className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {isPos ? '+' : ''}
                            {item.changePct.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* AI Score & Action Buttons */}
                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-800/80 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-500">AI Skor:</span>
                        <span className="font-bold text-cyan-400 font-mono">
                          {item.aiScore}/100
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            item.signal === 'STRONG_BUY'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : item.signal === 'BUY'
                              ? 'bg-cyan-500/20 text-cyan-300'
                              : item.signal === 'SELL'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {item.signal === 'STRONG_BUY'
                            ? 'GÜÇLÜ AL'
                            : item.signal === 'BUY'
                            ? 'AL'
                            : item.signal === 'SELL'
                            ? 'SAT'
                            : 'TUT'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Quick Buy to Portfolio */}
                        <button
                          onClick={() => handleQuickBuy(item)}
                          className="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Sanal Portföye Ekle"
                        >
                          <Briefcase className="w-3 h-3" />
                          <span className="hidden sm:inline">Portföye Al</span>
                        </button>

                        {/* View Details */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectStock?.(item.symbol, item.market as any);
                            onClose();
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Grafik ve Detay Aç"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>İncele</span>
                        </button>

                        {/* Remove from watchlist */}
                        <button
                          onClick={() => onToggleWatchlist(item.symbol)}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Takip Listesinden Çıkar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-800 px-5 sm:px-6 py-3 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span>Favori hisseleriniz cihazınızda güvenle senkronize edilir</span>
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

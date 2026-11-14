// src/components/stocks/StockKapModal.tsx
import React, { useState, useMemo } from 'react';
import {
  X,
  Radio,
  Search,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  FileText,
  ExternalLink,
  Briefcase,
  Coins,
  ShieldAlert,
} from 'lucide-react';
import { StockKapNewsItem, StockItem } from '../../types/stocks';
import { INITIAL_KAP_NEWS } from '../../data/kapNewsData';

interface StockKapModalProps {
  isOpen: boolean;
  onClose: () => void;
  stocks?: StockItem[];
  onSelectStock?: (symbol: string) => void;
}

type KapCategoryFilter = 'all' | 'yeni_is' | 'geri_alim' | 'bedelsiz' | 'kritik_risk';

export const StockKapModal: React.FC<StockKapModalProps> = ({
  isOpen,
  onClose,
  stocks = [],
  onSelectStock,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<KapCategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNews = useMemo(() => {
    let list = [...INITIAL_KAP_NEWS];

    if (selectedCategory !== 'all') {
      list = list.filter((n) => n.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (n) =>
          n.code.toLowerCase().includes(q) ||
          n.companyName.toLowerCase().includes(q) ||
          n.title.toLowerCase().includes(q) ||
          n.aiSummary.toLowerCase().includes(q)
      );
    }

    return list;
  }, [selectedCategory, searchQuery]);

  const getImpactBadge = (impact: StockKapNewsItem['aiImpact']) => {
    switch (impact) {
      case 'ÇOK POZİTİF':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shadow-sm shadow-emerald-950/40">
            <Sparkles className="w-3 h-3 text-emerald-400" /> ÇOK POZİTİF
          </span>
        );
      case 'POZİTİF':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-cyan-400" /> POZİTİF
          </span>
        );
      case 'NEGATİF':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-rose-400" /> RİSKLİ / NEGATİF
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-700 text-slate-300">
            NÖTR
          </span>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-inner">
              <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  KAP AI Radar &amp; Kritik Şirket Bildirimleri
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  CANLI AKIŞ
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Kamuyu Aydınlatma Platformu bildirimleri, yapay zeka etki analizi ve sözleşme büyüklükleri
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

        {/* Categories Bar & Search */}
        <div className="border-b border-slate-800 bg-slate-950/60 px-3 sm:px-6 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 sm:gap-2">
            {[
              { id: 'all', label: 'Tüm Bildirimler' },
              { id: 'yeni_is', label: '🚀 Yeni İş / İhale' },
              { id: 'geri_alim', label: '💎 Pay Geri Alımı' },
              { id: 'bedelsiz', label: '📈 Bedelsiz / Sermaye' },
              { id: 'kritik_risk', label: '⚠️ Risk & Duruş' },
            ].map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id as KapCategoryFilter)}
                  className={`px-2.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer border text-center ${
                    active
                      ? 'border-cyan-500/60 text-cyan-300 bg-cyan-500/15 shadow-sm ring-1 ring-cyan-500/30'
                      : 'border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900 bg-slate-950/40'
                  }`}
                >
                  <span className="truncate">{cat.label}</span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="KAP bildirimi ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
            />
          </div>
        </div>

        {/* Modal Body: News Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {filteredNews.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              Arama kriterlerine uygun KAP bildirimi bulunamadı.
            </div>
          ) : (
            filteredNews.map((news) => (
              <div
                key={news.id}
                onClick={() => onSelectStock?.(news.code)}
                className="bg-slate-950/60 hover:bg-slate-800/40 border border-slate-800 hover:border-cyan-500/40 rounded-xl p-4 transition-all cursor-pointer group space-y-3"
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center font-black text-sm text-cyan-400 group-hover:border-cyan-500/50 transition-colors">
                      {news.code}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{news.code}</span>
                        <span className="text-xs text-slate-400 font-normal">
                          {news.companyName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                        <span>{news.publishTime}</span>
                        <span>•</span>
                        <span className="text-cyan-400/90 font-medium">{news.categoryLabel}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {getImpactBadge(news.aiImpact)}
                    <span className="text-[10px] text-slate-500 font-mono">
                      AI Skor: {news.aiScore}/100
                    </span>
                  </div>
                </div>

                {/* News Title */}
                <h4 className="text-sm font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors leading-snug">
                  {news.title}
                </h4>

                {/* AI Summary Box */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 leading-relaxed">
                  <div className="flex items-center gap-1.5 font-bold text-cyan-400 mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Yapay Zeka Analiz Özeti</span>
                  </div>
                  <p>{news.aiSummary}</p>
                </div>

                {/* Deal Size & Details if applicable */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
                  <div className="flex items-center gap-2">
                    {news.dealSizeTl && (
                      <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
                        Tutar: {(news.dealSizeTl / 1000000).toLocaleString('tr-TR')} Milyon ₺
                      </span>
                    )}
                  </div>
                  <a
                    href={news.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition-colors text-[11px]"
                  >
                    <span>KAP Orjinal Metin</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-800 px-5 sm:px-6 py-3 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>KAP (Kamuyu Aydınlatma Platformu) Doğrulanmış Verileri</span>
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

// src/components/stocks/StockTefasModal.tsx
import React, { useState, useMemo } from 'react';
import {
  X,
  Sparkles,
  TrendingUp,
  Shield,
  Layers,
  Info,
  CheckCircle2,
  Copy,
  Check,
  Search,
  ExternalLink,
  PieChart,
  Award,
  Flame,
  ArrowUpRight,
  HelpCircle,
  Coins,
  ChevronRight,
  Bot
} from 'lucide-react';
import {
  TEFAS_FUNDS,
  AI_FUND_BASKETS,
  TefasFundItem,
  AIFundBasket,
  TefasFundCategory
} from '../../data/tefasFundsData';

interface StockTefasModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TefasTab = 'baskets' | 'funds' | 'holdings_explorer';

export const StockTefasModal: React.FC<StockTefasModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TefasTab>('baskets');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFundCode, setSelectedFundCode] = useState<string>('TTE');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showHowToBuy, setShowHowToBuy] = useState(false);

  // Selected Fund Details
  const selectedFund = useMemo(() => {
    return TEFAS_FUNDS.find((f) => f.code === selectedFundCode) || TEFAS_FUNDS[0];
  }, [selectedFundCode]);

  // Filtered & Sorted Funds
  const filteredFunds = useMemo(() => {
    let list = [...TEFAS_FUNDS];

    if (selectedCategory !== 'all') {
      list = list.filter((f) => f.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (f) =>
          f.code.toLowerCase().includes(q) ||
          f.name.toLowerCase().includes(q) ||
          f.manager.toLowerCase().includes(q) ||
          f.categoryLabel.toLowerCase().includes(q)
      );
    }

    // Default sort by 1-year return descending
    return list.sort((a, b) => b.return1Y - a.return1Y);
  }, [selectedCategory, searchQuery]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 overflow-y-auto bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose}></div>

      {/* Modal Dialog */}
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-auto z-10 max-h-[92vh] flex flex-col">
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-blue-500/20 to-indigo-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-inner">
              <Layers className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm sm:text-base font-black text-white tracking-tight">
                  TEFAS Yatırım Fonları &amp; AI Portföy Sepet Terminali
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  TEFAS 2026
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Türkiye'nin en çok kazandıran fonları, portföy dağılımları ve 3 yapay zeka sepet modeli
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowHowToBuy(!showHowToBuy)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all cursor-pointer flex items-center space-x-1"
            >
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Nasıl Alınır?</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* How to Buy Guide Banner (Collapsible) */}
        {showHowToBuy && (
          <div className="p-4 bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/50 border-b border-blue-500/30 animate-fadeIn text-xs space-y-2">
            <div className="flex items-center space-x-2 text-cyan-300 font-extrabold">
              <Info className="w-4 h-4 text-cyan-400" />
              <span>TEFAS Fonları Bankalardan Nasıl Satın Alınır?</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              TEFAS fonları tüm Türkiye'ye açıktır. <strong>Ziraat, Garanti, İş Bankası, Yapı Kredi, Akbank, QNB, Midas</strong> veya hangi bankayı kullanıyorsanız mobil bankacılık uygulamanıza girin:
            </p>
            <div className="flex flex-wrap gap-2 text-[10px] font-mono">
              <span className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-slate-200">
                1. Yatırımlar / Fon İşlemleri
              </span>
              <span className="text-slate-500 self-center">→</span>
              <span className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-slate-200">
                2. TEFAS Fon Alış
              </span>
              <span className="text-slate-500 self-center">→</span>
              <span className="px-2 py-1 rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/40 font-bold">
                3. Fon Kodunu Yazın (Örn: TTE, AFT)
              </span>
              <span className="text-slate-500 self-center">→</span>
              <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                4. 1 TL ile dahi anında alın!
              </span>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 border-b border-slate-800/80 bg-slate-950/50 text-[11px] sm:text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveTab('baskets')}
            className={`px-3 py-1.5 rounded-xl flex items-center space-x-1.5 border transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'baskets'
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-400/60 text-cyan-300 font-bold shadow-xs'
                : 'border-slate-800/80 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-cyan-400" />
            <span>Yapay Zeka Portföy Sepetleri</span>
            <span className="px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[9px] font-black">
              3 Model
            </span>
          </button>

          <button
            onClick={() => setActiveTab('funds')}
            className={`px-3 py-1.5 rounded-xl flex items-center space-x-1.5 border transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'funds'
                ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-400/60 text-emerald-300 font-bold shadow-xs'
                : 'border-slate-800/80 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            <span>Getiri Lideri Fonlar</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-black">
              TEFAS
            </span>
          </button>

          <button
            onClick={() => setActiveTab('holdings_explorer')}
            className={`px-3 py-1.5 rounded-xl flex items-center space-x-1.5 border transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'holdings_explorer'
                ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-400/60 text-amber-300 font-bold shadow-xs'
                : 'border-slate-800/80 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <PieChart className="w-3.5 h-3.5 text-amber-400" />
            <span>Fonun İçindekiler (Portföy Dağılımı)</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* TAB 1: AI PORTFOLIO BASKETS */}
          {activeTab === 'baskets' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-white flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>Yapay Zeka Destekli 3 Farklı Hazır Portföy Modeli</span>
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Risk tercihinize göre TEFAS fonlarını optimum oranda birleştiren profesyonel varlık tahsis stratejileri.
                  </p>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 font-mono shrink-0">
                  Otomatik Dengelemeli Sepetler
                </div>
              </div>

              {/* 3 Basket Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {AI_FUND_BASKETS.map((basket) => (
                  <div
                    key={basket.id}
                    className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 shadow-lg group relative overflow-hidden"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <span className="text-2xl">{basket.icon}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${basket.badgeColor}`}>
                          {basket.riskTitle}
                        </span>
                      </div>

                      <div>
                        <h5 className="text-sm font-extrabold text-white group-hover:text-cyan-300 transition-colors">
                          {basket.name}
                        </h5>
                        <p className="text-[11px] text-slate-400 mt-1 leading-snug">{basket.tagline}</p>
                      </div>

                      {/* Expected Return Box */}
                      <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Hedef Yıllık Getiri</span>
                          <span className="font-mono font-black text-emerald-400 text-base">
                            {basket.expectedAnnualReturn}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-medium">Son 1 Yıl Başarısı</span>
                          <span className="font-mono font-black text-amber-300 text-sm">
                            +%{basket.historical1YReturn}
                          </span>
                        </div>
                      </div>

                      {/* Allocations Bars */}
                      <div className="space-y-2 pt-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                          Sepet Dağılımı:
                        </span>
                        {basket.allocations.map((alloc, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-black text-amber-300 px-1.5 py-0.5 rounded bg-amber-400/15 border border-amber-400/30 text-[10px]">
                                {alloc.fundCode}
                              </span>
                              <div className="truncate max-w-[120px] sm:max-w-[150px]">
                                <span className="font-bold text-slate-200 block truncate">{alloc.fundName}</span>
                                <span className="text-[9px] text-slate-400 truncate block">{alloc.role}</span>
                              </div>
                            </div>
                            <span className="font-mono font-black text-cyan-300 shrink-0 text-xs">
                              %{alloc.share}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI Recommendation Quote */}
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60 text-[10px] text-slate-300 italic leading-relaxed">
                      💡 {basket.aiRecommendationReason}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: ALL TEFAS FUNDS & LEADERBOARD */}
          {activeTab === 'funds' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Category Filter & Search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'all', label: 'Tüm Fonlar' },
                    { id: 'hisse', label: '🚀 BIST Hisse' },
                    { id: 'yabanci_teknoloji', label: '🌐 Yabancı Teknoloji' },
                    { id: 'altin_emtia', label: '🥇 Altın & Emtia' },
                    { id: 'para_piyasasi', label: '🛡️ Para Piyasası' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        selectedCategory === cat.id
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/60 shadow-xs'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-64 shrink-0">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Fon kodu veya adı ara..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Funds Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredFunds.map((fund) => (
                  <div
                    key={fund.code}
                    className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all space-y-3 shadow-md group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2.5">
                        <span className="font-mono font-black text-amber-300 text-sm px-2 py-1 rounded-xl bg-amber-400/15 border border-amber-400/40">
                          {fund.code}
                        </span>
                        <div>
                          <h5 className="font-extrabold text-white text-xs sm:text-sm group-hover:text-cyan-300 transition-colors">
                            {fund.name}
                          </h5>
                          <span className="text-[10px] text-slate-400">
                            {fund.manager} • {fund.categoryLabel}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleCopyCode(fund.code)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer shrink-0"
                        title="Fon Kodunu Kopyala"
                      >
                        {copiedCode === fund.code ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Return Performance Badges */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-medium">1 Yıllık Getiri</span>
                        <span className="font-mono font-black text-emerald-400 text-xs sm:text-sm">
                          +%{fund.return1Y}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-medium">3 Aylık Getiri</span>
                        <span className="font-mono font-black text-cyan-300 text-xs sm:text-sm">
                          +%{fund.return3M}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-medium">1 Aylık Getiri</span>
                        <span className="font-mono font-black text-amber-300 text-xs sm:text-sm">
                          +%{fund.return1M}
                        </span>
                      </div>
                    </div>

                    {/* AI Score & Risk Level Bar */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                      <div className="flex items-center space-x-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black">
                          AI: {fund.aiRating} (%{fund.aiScore})
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-mono">
                          Risk: {fund.riskLevel}/7
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedFundCode(fund.code);
                          setActiveTab('holdings_explorer');
                        }}
                        className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 cursor-pointer"
                      >
                        <span>İçeriği İncele</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: HOLDINGS EXPLORER */}
          {activeTab === 'holdings_explorer' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Select Fund Header */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400 font-bold">Fon Seç:</span>
                {TEFAS_FUNDS.map((f) => (
                  <button
                    key={f.code}
                    onClick={() => setSelectedFundCode(f.code)}
                    className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold border transition-all cursor-pointer ${
                      selectedFundCode === f.code
                        ? 'bg-amber-400/20 border-amber-400/60 text-amber-300 shadow-xs ring-1 ring-amber-400/30'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {f.code}
                  </button>
                ))}
              </div>

              {/* Selected Fund Overview Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-black text-amber-300 text-base px-2.5 py-1 rounded-xl bg-amber-400/15 border border-amber-400/40">
                        {selectedFund.code}
                      </span>
                      <h4 className="text-base sm:text-lg font-extrabold text-white">{selectedFund.name}</h4>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Yönetici: {selectedFund.manager} • Kategori: {selectedFund.categoryLabel}
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 text-right">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Fon Pay Fiyatı</span>
                      <span className="font-mono font-black text-white text-base">
                        {selectedFund.price.toFixed(3)} ₺
                      </span>
                    </div>
                    <div className="pl-3 border-l border-slate-800">
                      <span className="text-[10px] text-slate-400 block">1 Yıllık Net Getiri</span>
                      <span className="font-mono font-black text-emerald-400 text-base">
                        +%{selectedFund.return1Y}
                      </span>
                    </div>
                  </div>
                </div>

                {/* AI Investment Thesis */}
                <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-start space-x-3">
                  <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-emerald-300 block">Yapay Zeka Fon Yorumu</span>
                    <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{selectedFund.aiInsight}</p>
                  </div>
                </div>

                {/* Top Holdings Breakdown (Portföy Dağılımı) */}
                <div className="space-y-3 pt-2">
                  <h5 className="text-xs font-extrabold text-slate-200 flex items-center space-x-2">
                    <PieChart className="w-4 h-4 text-cyan-400" />
                    <span>Fonun İçindeki Başlıca Şirketler &amp; Varlık Dağılımı:</span>
                  </h5>

                  <div className="space-y-2">
                    {selectedFund.topHoldings.map((h, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-200 flex items-center space-x-1.5">
                            <span className="text-slate-500 font-mono">{idx + 1}.</span>
                            <span>{h.name}</span>
                            {h.ticker && (
                              <span className="font-mono font-bold text-amber-300 text-[10px] px-1 rounded bg-slate-800">
                                {h.ticker}
                              </span>
                            )}
                          </span>
                          <span className="font-mono font-black text-cyan-400">%{h.share}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                          <div
                            style={{ width: `${Math.min(100, h.share * 3.5)}%` }}
                            className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 rounded-full transition-all duration-500"
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

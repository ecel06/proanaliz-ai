// src/components/BetslipDrawer.tsx
// Interactive Kupon Hesaplayıcı & Betslip Drawer for ProAnaliz AI

import React, { useState } from 'react';
import { Match, UserBetslipItem } from '../types';
import {
  Ticket,
  X,
  Trash2,
  Copy,
  Check,
  Calculator,
  Bot,
  Sparkles,
  TrendingUp,
  Percent,
  Coins,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

interface BetslipDrawerProps {
  items: UserBetslipItem[];
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onRemoveItem: (id: string) => void;
  onClearAll: () => void;
  onConsultAI?: (couponSummary: string) => void;
}

export const BetslipDrawer: React.FC<BetslipDrawerProps> = ({
  items,
  isOpen,
  onOpen,
  onClose,
  onRemoveItem,
  onClearAll,
  onConsultAI
}) => {
  const [stake, setStake] = useState<number>(100);
  const [copied, setCopied] = useState(false);

  // Calculate totals
  const totalOdds = Number(
    items.reduce((acc, it) => acc * it.odd, 1).toFixed(2)
  );
  const avgConfidence = items.length > 0
    ? Math.round(items.reduce((acc, it) => acc + it.probability, 0) / items.length)
    : 0;

  const estimatedWin = (stake * totalOdds);
  const netProfit = Math.max(0, estimatedWin - stake);

  const quickStakes = [50, 100, 200, 500, 1000];

  const handleCopySlip = () => {
    let text = `🎫 ProAnaliz AI - Özel Kuponum (${items.length} Maç)\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━\n`;
    items.forEach((it, idx) => {
      text += `${idx + 1}️⃣ ${it.match.homeTeam.name} vs ${it.match.awayTeam.name}\n`;
      text += `   🏆 Tercih: ${it.pickLabel} (${it.marketName})\n`;
      text += `   📈 Oran: ${it.odd.toFixed(2)} (%${it.probability} Güven)\n`;
      text += `   ⏰ ${it.match.date} ${it.match.time} • ${it.match.league}\n\n`;
    });
    text += `━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `💰 Toplam Oran: ${totalOdds.toFixed(2)}\n`;
    text += `💵 Yatırılan Misli: ${stake} ₺\n`;
    text += `🎯 Tahmini Kazanç: ${estimatedWin.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} ₺\n`;
    text += `📊 Ortalama Güven: %${avgConfidence}\n`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleAskAI = () => {
    if (!onConsultAI) return;
    const summary = `Benim hazırladığım ${items.length} maçlık kuponum şöyle:\n` +
      items.map(it => `• ${it.match.homeTeam.name} - ${it.match.awayTeam.name}: ${it.pickLabel} (Oran: ${it.odd})`).join('\n') +
      `\nToplam Oran: ${totalOdds.toFixed(2)}. Bu kupon tutar mı, riskleri ve analizi nedir?`;
    onClose();
    onConsultAI(summary);
  };

  // If no items in slip, show nothing
  if (items.length === 0) return null;

  return (
    <>
      {/* 1. FLOATING BOTTOM PILL / BAR (Always visible when items exist and drawer is closed) */}
      {!isOpen && (
        <div className="fixed bottom-5 left-4 sm:left-6 z-40 animate-in fade-in slide-in-from-bottom duration-300">
          <button
            onClick={onOpen}
            className="flex items-center space-x-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white font-black text-xs sm:text-sm shadow-2xl shadow-emerald-500/40 hover:shadow-emerald-500/60 border-2 border-emerald-300/40 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
          >
            <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-slate-950/40 text-amber-300">
              <Ticket className="w-4 h-4 animate-bounce" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white ring-2 ring-slate-900">
                {items.length}
              </span>
            </div>

            <div className="text-left">
              <div className="flex items-center space-x-1.5">
                <span className="tracking-tight font-extrabold">Kuponum ({items.length})</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-950/40 text-emerald-200 font-mono">
                  {totalOdds.toFixed(2)} Oran
                </span>
              </div>
              <div className="text-[11px] text-emerald-200 font-semibold font-mono">
                {estimatedWin.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺ Olası Kazanç
              </div>
            </div>

            <div className="pl-1">
              <ChevronUp className="w-4 h-4 text-emerald-200 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </button>
        </div>
      )}

      {/* 2. EXPANDED BETSLIP MODAL / DRAWER */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          
          {/* Backdrop click to close */}
          <div className="fixed inset-0" onClick={onClose} />

          {/* Modal Card */}
          <div
            className="relative w-full sm:max-w-xl bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col ring-1 ring-slate-700/50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/70 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white flex items-center space-x-2">
                    <span>Kupon Hesaplayıcı</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                      {items.length} Maç
                    </span>
                  </h3>
                  <div className="text-[11px] text-slate-400">
                    Seçilen oranlar ve kazanç simülasyonu
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={onClearAll}
                  className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer flex items-center space-x-1"
                  title="Tüm seçimleri temizle"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Temizle</span>
                </button>

                <button
                  onClick={onClose}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
                  title="Kapat"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Match Items Scrollable List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5 min-h-0 divide-y divide-slate-800/40">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 bg-slate-950/40 p-3 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 mb-0.5">
                      <span className="font-semibold text-emerald-400">{item.match.league}</span>
                      <span>•</span>
                      <span>{item.match.date} {item.match.time}</span>
                    </div>

                    <div className="text-xs sm:text-sm font-extrabold text-white truncate">
                      {item.match.homeTeam.name} <span className="text-slate-500 font-normal">vs</span> {item.match.awayTeam.name}
                    </div>

                    <div className="flex items-center space-x-2 mt-1">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        {item.pickLabel}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        %{item.probability} Olasılık
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-500 font-semibold uppercase">Oran</div>
                      <div className="text-base sm:text-lg font-black text-amber-400 font-mono">
                        {item.odd.toFixed(2)}
                      </div>
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                      title="Kupondan Çıkar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations & Stake Box */}
            <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 shrink-0 space-y-3.5">
              
              {/* Summary Stats Row */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Maç Sayısı</div>
                  <div className="text-sm font-black text-white font-mono mt-0.5">{items.length}</div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900 border border-emerald-500/30">
                  <div className="text-[10px] text-emerald-400 font-semibold uppercase">Toplam Oran</div>
                  <div className="text-base font-black text-emerald-400 font-mono mt-0.5">{totalOdds.toFixed(2)}</div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900 border border-purple-500/30">
                  <div className="text-[10px] text-purple-400 font-semibold uppercase">Ortalama Güven</div>
                  <div className="text-sm font-black text-purple-300 font-mono mt-0.5">%{avgConfidence}</div>
                </div>
              </div>

              {/* Stake Input & Quick Chips */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300 px-1">
                  <span className="flex items-center space-x-1">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span>Bahis Tutarı (Misli ₺):</span>
                  </span>
                  <span className="text-[11px] text-slate-500 font-normal">Hesaplama simülasyonu</span>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min={10}
                      step={10}
                      value={stake || ''}
                      onChange={(e) => setStake(Math.max(1, Number(e.target.value) || 0))}
                      className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      placeholder="Tutar girin..."
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">₺</span>
                  </div>

                  <div className="flex space-x-1">
                    {quickStakes.map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setStake(amt)}
                        className={`px-2 py-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                          stake === amt
                            ? 'bg-emerald-500 text-slate-950 font-black'
                            : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {amt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Estimated Total Payout (Big Green Highlight) */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-500/40 flex items-center justify-between shadow-lg">
                <div>
                  <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Tahmini Kazanç</div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-300 font-mono">
                    {estimatedWin.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-slate-400 font-semibold">Net Kâr</div>
                  <div className="text-sm font-bold text-amber-400 font-mono">
                    +{netProfit.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                  </div>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopySlip}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 active:scale-95"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Kopyalandı!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-400" />
                      <span>Kuponu Kopyala</span>
                    </>
                  )}
                </button>

                {onConsultAI && (
                  <button
                    type="button"
                    onClick={handleAskAI}
                    className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center space-x-1.5 shadow-md shadow-purple-600/30 active:scale-95"
                  >
                    <Bot className="w-4 h-4 text-amber-300" />
                    <span>AI'a Danış</span>
                  </button>
                )}
              </div>

            </div>

          </div>

        </div>
      )}
    </>
  );
};

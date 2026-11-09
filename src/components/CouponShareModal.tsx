import React, { useState } from 'react';
import { UserBetslipItem } from '../types';
import { MonteCarloSimulationResult } from '../utils/monteCarloHelper';
import { X, Copy, Check, Share2, Sparkles, Trophy, ShieldCheck, ExternalLink, Bot } from 'lucide-react';

interface CouponShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: UserBetslipItem[];
  totalOdds: number;
  stake: number;
  potentialWin: number;
  monteCarlo?: MonteCarloSimulationResult | null;
}

export const CouponShareModal: React.FC<CouponShareModalProps> = ({
  isOpen,
  onClose,
  items,
  totalOdds,
  stake,
  potentialWin,
  monteCarlo
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || items.length === 0) return null;

  // Coupon Serial code
  const couponSerial = `PRO-${Math.abs(items.reduce((acc, it) => acc + it.matchId.charCodeAt(0), 10000))}-${items.length}M`;

  // Format shareable text for WhatsApp / Telegram / Socials
  const generateShareText = () => {
    let text = `🤖 *PROANALİZ AI - GÜNÜN KUPONU*\n`;
    text += `🎫 Kupon No: #${couponSerial}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n`;

    items.forEach((it, idx) => {
      text += `⚽ *${idx + 1}. ${it.match.homeTeam.name} - ${it.match.awayTeam.name}*\n`;
      text += `   📌 Tercih: *${it.pickLabel}*\n`;
      text += `   📊 Oran: *${it.odd.toFixed(2)}* (Güven: %${it.probability})\n\n`;
    });

    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🔥 *Toplam Oran: ${totalOdds.toFixed(2)}*\n`;
    text += `💰 *Yatırılan: ${stake} ₺ | Tahmini Kazanç: ${potentialWin.toLocaleString('tr-TR')} ₺*\n`;
    if (monteCarlo) {
      text += `🛡️ *Güven Endeksi: %${monteCarlo.combinedTheoreticalProb} (${monteCarlo.riskLabel})*\n`;
    }
    text += `\n📲 ProAnaliz AI Canlı Tahminleri: https://proanaliz-ai.onrender.com`;
    return text;
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(generateShareText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(generateShareText());
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleShareTelegram = () => {
    const text = encodeURIComponent(generateShareText());
    window.open(`https://t.me/share/url?url=https://proanaliz-ai.onrender.com&text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl shadow-2xl shadow-emerald-500/10 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <Share2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white">
                Kuponu Paylaş & İncele
              </h3>
              <p className="text-[11px] text-slate-400">
                Sosyal medyada, WhatsApp'ta veya arkadaşlarınızla paylaşın
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Coupon Visual Card Container (The Shareable Ticket) */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 no-scrollbar">
          <div
            id="coupon-share-card"
            className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/50 border-2 border-emerald-500/40 p-4 sm:p-5 shadow-2xl space-y-4 relative overflow-hidden"
          >
            {/* Top Brand Banner */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                <span className="font-black text-sm sm:text-base text-white tracking-wide">
                  ProAnaliz <span className="text-emerald-400">AI KUPON</span>
                </span>
              </div>
              <span className="font-mono text-[10px] sm:text-xs text-amber-300 font-bold bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-md">
                #{couponSerial}
              </span>
            </div>

            {/* Match Items in Coupon */}
            <div className="divide-y divide-slate-800/60 space-y-2.5 pt-1">
              {items.map((it, idx) => (
                <div key={it.id} className="pt-2 first:pt-0 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] text-slate-400 flex items-center space-x-1.5">
                      <span>{it.match.countryFlag || '⚽'}</span>
                      <span className="truncate">{it.match.league}</span>
                      {it.match.iddaaCode && (
                        <span className="font-mono text-amber-400/90 text-[10px]">#{it.match.iddaaCode}</span>
                      )}
                    </div>
                    <div className="text-xs sm:text-sm font-black text-white truncate mt-0.5">
                      {it.match.homeTeam.name} vs {it.match.awayTeam.name}
                    </div>
                    <div className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-400 mt-1">
                      <span>📌 {it.pickLabel}</span>
                      <span className="text-slate-500 font-normal">• %{it.probability} Güven</span>
                    </div>
                  </div>

                  {/* Odd Box */}
                  <div className="shrink-0 text-right">
                    <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-mono font-black text-xs sm:text-sm shadow-md">
                      {it.odd.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Odds & Return Summary Box */}
            <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3 sm:p-4 grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Toplam Oran</div>
                <div className="text-sm sm:text-lg font-black text-emerald-400 font-mono mt-0.5">
                  {totalOdds.toFixed(2)}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Misli</div>
                <div className="text-sm sm:text-lg font-black text-white font-mono mt-0.5">
                  {stake} ₺
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Tahmini Kazanç</div>
                <div className="text-sm sm:text-lg font-black text-amber-400 font-mono mt-0.5">
                  {potentialWin.toLocaleString('tr-TR')} ₺
                </div>
              </div>
            </div>

            {/* Monte Carlo Risk Badge */}
            {monteCarlo && (
              <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-bold text-slate-300">Kupon Güven Skoru:</span>
                </div>
                <span className="font-black font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
                  %{monteCarlo.combinedTheoreticalProb} ({monteCarlo.riskLabel})
                </span>
              </div>
            )}

            {/* Watermark Footer */}
            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
              <span>🤖 Poisson & xG İstatistik Modeli</span>
              <span>proanaliz-ai.onrender.com</span>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/90 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {/* WhatsApp Share */}
          <button
            onClick={handleShareWhatsApp}
            className="flex items-center justify-center space-x-1.5 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all shadow-lg active:scale-95 cursor-pointer"
          >
            <span>💬</span>
            <span>WhatsApp</span>
          </button>

          {/* Copy Text */}
          <button
            onClick={handleCopyText}
            className={`flex items-center justify-center space-x-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer ${
              copied
                ? 'bg-emerald-500 text-slate-950 font-black'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
                <span>Kopyalandı!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Metni Kopyala</span>
              </>
            )}
          </button>

          {/* Telegram Share */}
          <button
            onClick={handleShareTelegram}
            className="col-span-2 sm:col-span-1 flex items-center justify-center space-x-1.5 px-3 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <span>✈️</span>
            <span>Telegram</span>
          </button>
        </div>
      </div>
    </div>
  );
};

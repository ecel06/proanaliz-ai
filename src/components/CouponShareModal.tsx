import React, { useState } from 'react';
import { UserBetslipItem } from '../types';
import { MonteCarloSimulationResult } from '../utils/monteCarloHelper';
import { X, Copy, Check, Share2, Sparkles, Trophy, ShieldCheck, Download, Camera, Ticket, MessageSquare, Send } from 'lucide-react';

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
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || items.length === 0) return null;

  // Coupon Serial code
  const couponSerial = `PRO-${Math.abs(items.reduce((acc, it) => acc + it.matchId.charCodeAt(0), 10000))}-${items.length}M`;

  // 1. Download PNG Image for Instagram Stories (9:16) or Ticket Post (4:5)
  const handleDownloadImage = (format: 'story' | 'ticket' = 'ticket') => {
    setIsDownloading(true);
    try {
      const isStory = format === 'story';
      const width = isStory ? 1080 : 1080;
      const height = isStory ? 1920 : Math.max(1200, 520 + items.length * 130);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsDownloading(false);
        return;
      }

      // 1. Background Gradient (Deep Luxury Dark)
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#030712');
      bgGrad.addColorStop(0.3, '#0B1329');
      bgGrad.addColorStop(0.7, '#071026');
      bgGrad.addColorStop(1, '#020617');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Neon Accent Glow Borders
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 6;
      ctx.strokeRect(32, 32, width - 64, height - 64);

      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 40, width - 80, height - 80);

      // 3. Header Branding
      ctx.fillStyle = '#10B981';
      ctx.font = '900 48px sans-serif';
      ctx.fillText('⚡ ProAnaliz AI', 80, isStory ? 140 : 120);

      ctx.fillStyle = '#F59E0B';
      ctx.font = 'bold 22px monospace';
      ctx.fillText(`#${couponSerial}`, width - 360, isStory ? 130 : 110);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '20px sans-serif';
      const dateStr = new Date().toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      ctx.fillText(dateStr, 80, isStory ? 180 : 160);

      // Separator
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(80, isStory ? 220 : 195);
      ctx.lineTo(width - 80, isStory ? 220 : 195);
      ctx.stroke();

      // Monte Carlo Risk Badge if exists
      let startY = isStory ? 270 : 235;
      if (monteCarlo) {
        ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 2;
        ctx.fillRect(80, startY, width - 160, 60);
        ctx.strokeRect(80, startY, width - 160, 60);

        ctx.fillStyle = '#34D399';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText(`🛡️ AI Güven Skoru: %${monteCarlo.combinedTheoreticalProb} (${monteCarlo.riskLabel})`, 105, startY + 40);

        startY += 85;
      }

      // Match Cards
      items.forEach((it, idx) => {
        const cardH = 100;
        // Card Box
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.7)';
        ctx.lineWidth = 2;
        ctx.fillRect(80, startY, width - 160, cardH);
        ctx.strokeRect(80, startY, width - 160, cardH);

        // Number
        ctx.fillStyle = '#10B981';
        ctx.font = 'bold 26px sans-serif';
        ctx.fillText(`${idx + 1}.`, 105, startY + 60);

        // Match Name
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText(`${it.match.homeTeam.name} - ${it.match.awayTeam.name}`, 155, startY + 45);

        // League
        ctx.fillStyle = '#64748B';
        ctx.font = '20px sans-serif';
        ctx.fillText(`${it.match.league}`, 155, startY + 78);

        // Pick Badge
        ctx.fillStyle = '#F59E0B';
        ctx.font = '900 28px sans-serif';
        ctx.fillText(it.pickLabel, width - 360, startY + 60);

        // Odd Pill
        ctx.fillStyle = '#10B981';
        ctx.font = '900 30px monospace';
        ctx.fillText(`@${it.odd.toFixed(2)}`, width - 200, startY + 60);

        startY += cardH + 18;
      });

      // Total Odds & Return Summary Box
      startY += 15;
      const sumBoxH = 150;
      ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 3;
      ctx.fillRect(80, startY, width - 160, sumBoxH);
      ctx.strokeRect(80, startY, width - 160, sumBoxH);

      ctx.fillStyle = '#94A3B8';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('TOPLAM ORAN', 115, startY + 50);
      ctx.fillText('YATIRILAN', width / 2 - 80, startY + 50);
      ctx.fillText('TAHMİNİ KAZANÇ', width - 330, startY + 50);

      ctx.fillStyle = '#F59E0B';
      ctx.font = '900 48px monospace';
      ctx.fillText(totalOdds.toFixed(2), 115, startY + 115);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 44px monospace';
      ctx.fillText(`${stake} ₺`, width / 2 - 80, startY + 115);

      ctx.fillStyle = '#10B981';
      ctx.font = '900 48px monospace';
      ctx.fillText(`${potentialWin.toLocaleString('tr-TR')} ₺`, width - 330, startY + 115);

      // Watermark Footer
      ctx.fillStyle = '#64748B';
      ctx.font = 'bold 22px sans-serif';
      const footerY = height - 65;
      ctx.fillText('🤖 ProAnaliz AI • Poisson & xG İstatistik Modeli', 80, footerY);
      ctx.fillText('proanaliz-ai.onrender.com', width - 380, footerY);

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `ProAnaliz-Kupon-${format}-${Date.now().toString(36)}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
        setIsDownloading(false);
      });
    } catch {
      setIsDownloading(false);
    }
  };

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

        {/* Modal Footer Share Actions */}
        <div className="p-3 sm:p-4 bg-slate-950/95 border-t border-slate-800 grid grid-cols-3 gap-2 shrink-0">
          {/* Copy Text */}
          <button
            onClick={handleCopyText}
            className={`flex items-center justify-center space-x-1.5 px-2.5 sm:px-3 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer ${copied
                ? 'bg-emerald-500 text-slate-950 font-black'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700'
              }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
                <span className="truncate">Kopyalandı!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span className="truncate">Kopyala</span>
              </>
            )}
          </button>

          {/* WhatsApp Share */}
          <button
            onClick={handleShareWhatsApp}
            className="flex items-center justify-center space-x-1.5 px-2.5 sm:px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="truncate">WhatsApp</span>
          </button>

          {/* Telegram Share */}
          <button
            onClick={handleShareTelegram}
            className="flex items-center justify-center space-x-1.5 px-2.5 sm:px-3 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span className="truncate">Telegram</span>
          </button>
        </div>
      </div>
    </div>
  );
};


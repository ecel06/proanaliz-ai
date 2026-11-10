// src/components/ShareSlipModal.tsx
// Renders and exports a high-res graphic betting ticket card for WhatsApp, Instagram Stories, and image downloads.

import React, { useRef, useState } from 'react';
import { X, Download, Share2, Copy, Check, Sparkles, Star, Ticket } from 'lucide-react';
import { UserBetslipItem } from '../types';
import { CuratedCoupon } from '../utils/couponEngine';

interface ShareSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  coupon?: CuratedCoupon | null;
  slipItems?: UserBetslipItem[];
  stake?: number;
  totalOdds?: number;
  potentialWin?: number;
  title?: string;
  isWon?: boolean;
}

export const ShareSlipModal: React.FC<ShareSlipModalProps> = ({
  isOpen,
  onClose,
  coupon,
  slipItems = [],
  stake = 100,
  totalOdds = 1,
  potentialWin = 100,
  title = 'ProAnaliz AI Kuponu',
  isWon = false
}) => {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  if (!isOpen) return null;

  // Normalized match items
  const items = coupon
    ? coupon.items.map(it => ({
        home: it.homeTeamName,
        away: it.awayTeamName,
        league: it.league,
        pick: it.pickLabel,
        odd: it.odd,
        status: it.pickStatus
      }))
    : slipItems.map(it => ({
        home: it.match.homeTeam.name,
        away: it.match.awayTeam.name,
        league: it.match.league,
        pick: it.pickLabel,
        odd: it.odd,
        status: 'pending' as const
      }));

  const calcOdds = coupon ? coupon.totalOdds : totalOdds;
  const calcStake = coupon ? 100 : stake;
  const calcWin = coupon ? Math.round(100 * coupon.totalOdds) : potentialWin;
  const couponTitle = coupon ? coupon.title : title;
  const checkWon = coupon ? coupon.status === 'won' : isWon;

  // 1. Text Sharing (WhatsApp)
  const handleShareWhatsApp = () => {
    let text = `🎯 *${couponTitle}* (ProAnaliz AI)\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    items.forEach((it, idx) => {
      text += `${idx + 1}. ⚽ ${it.home} vs ${it.away}\n`;
      text += `   👉 *${it.pick}* • Oran: ${it.odd.toFixed(2)}\n`;
    });
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🔥 *Toplam Oran: ${calcOdds.toFixed(2)}*\n`;
    text += `💰 Olası Kazanç: ${calcWin.toLocaleString('tr-TR')} ₺\n`;
    if (checkWon) text += `🏆 *KUPON TUTTU!* ⭐⭐⭐\n`;
    text += `\n🚀 Analiz: https://proanaliz-ai.onrender.com`;

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  // 2. Copy formatted text
  const handleCopyText = () => {
    let text = `🎯 ${couponTitle}\n`;
    items.forEach((it, idx) => {
      text += `${idx + 1}. ${it.home} vs ${it.away} 👉 ${it.pick} (@${it.odd.toFixed(2)})\n`;
    });
    text += `Toplam Oran: ${calcOdds.toFixed(2)} | Kazanç: ${calcWin.toLocaleString('tr-TR')} ₺`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // 3. Render High-Resolution Ticket Card onto HTML5 Canvas and Download
  const handleDownloadImage = () => {
    setIsDownloading(true);
    const canvas = document.createElement('canvas');
    const width = 800;
    const height = 340 + items.length * 80;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background Gradient (Deep Navy/Black)
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#020617');
    bgGrad.addColorStop(0.5, '#0B132B');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Glowing Outer Gold Border
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 4;
    ctx.strokeRect(16, 16, width - 32, height - 32);

    // Header Badge: ProAnaliz AI
    ctx.fillStyle = '#10B981';
    ctx.font = 'bold 28px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('⚡ ProAnaliz AI', 40, 65);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '14px sans-serif';
    ctx.fillText(new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }), 40, 95);

    // Coupon Title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 24px sans-serif';
    ctx.fillText(couponTitle, 40, 135);

    // Separator line
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, 155);
    ctx.lineTo(width - 40, 155);
    ctx.stroke();

    // Match Items
    let startY = 195;
    items.forEach((it, idx) => {
      // Background row
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.fillRect(40, startY - 25, width - 80, 65);

      // Number
      ctx.fillStyle = '#10B981';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(`${idx + 1}.`, 55, startY + 12);

      // Teams
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(`${it.home} vs ${it.away}`, 85, startY + 5);

      // League
      ctx.fillStyle = '#64748B';
      ctx.font = '12px sans-serif';
      ctx.fillText(it.league, 85, startY + 25);

      // Pick Badge
      ctx.fillStyle = '#F59E0B';
      ctx.font = '900 16px sans-serif';
      ctx.fillText(it.pick, width - 210, startY + 14);

      // Odds
      ctx.fillStyle = '#10B981';
      ctx.font = 'bold 16px monospace';
      ctx.fillText(`@${it.odd.toFixed(2)}`, width - 110, startY + 14);

      startY += 80;
    });

    // Summary Card
    ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 2;
    ctx.fillRect(40, startY, width - 80, 95);
    ctx.strokeRect(40, startY, width - 80, 95);

    ctx.fillStyle = '#CBD5E1';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('TOPLAM ORAN', 65, startY + 35);
    ctx.fillText('OLASI KAZANÇ', width - 260, startY + 35);

    ctx.fillStyle = '#F59E0B';
    ctx.font = '900 28px monospace';
    ctx.fillText(calcOdds.toFixed(2), 65, startY + 75);

    ctx.fillStyle = '#10B981';
    ctx.font = '900 28px monospace';
    ctx.fillText(`${calcWin.toLocaleString('tr-TR')} ₺`, width - 260, startY + 75);

    // Won Stamp if Won
    if (checkWon) {
      ctx.save();
      ctx.translate(width - 150, 110);
      ctx.rotate(-0.15);
      ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 3;
      ctx.fillRect(-80, -25, 160, 50);
      ctx.strokeRect(-80, -25, 160, 50);
      ctx.fillStyle = '#10B981';
      ctx.font = '900 22px sans-serif';
      ctx.fillText('⭐ TUTTU ⭐', -65, 8);
      ctx.restore();
    }

    // Export & Download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ProAnaliz-Kupon-${Date.now().toString(36)}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
      setIsDownloading(false);
    });
  };

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white">Kupon Kartını Paylaş</h3>
              <p className="text-[11px] text-slate-400">Görsel bilet veya WhatsApp mesajı olarak dışa aktar</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visual Ticket Preview */}
        <div className="p-4 sm:p-5 overflow-y-auto max-h-[60vh] space-y-3">
          <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-2 border-amber-400/80 shadow-2xl space-y-4 relative overflow-hidden">
            {checkWon && (
              <div className="absolute top-3 right-3 px-3 py-1 rounded-lg bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300 font-black text-xs rotate-[-6deg] shadow-lg animate-pulse">
                ⭐ TUTTU ⭐
              </div>
            )}

            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="text-xs font-black text-emerald-400 uppercase tracking-wider">ProAnaliz AI</div>
                <div className="text-base font-black text-white mt-0.5">{couponTitle}</div>
              </div>
              <Ticket className="w-8 h-8 text-amber-400/40" />
            </div>

            <div className="space-y-2">
              {items.map((it, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-white">{it.home} vs {it.away}</div>
                    <div className="text-[10px] text-slate-500">{it.league}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-amber-300">{it.pick}</div>
                    <div className="text-[11px] font-mono text-emerald-400 font-bold">@{it.odd.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between font-mono">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Toplam Oran</div>
                <div className="text-xl font-black text-amber-400">{calcOdds.toFixed(2)}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Olası Kazanç</div>
                <div className="text-xl font-black text-emerald-400">{calcWin.toLocaleString('tr-TR')} ₺</div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={handleShareWhatsApp}
            className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all cursor-pointer shadow-lg shadow-emerald-600/30"
          >
            <Share2 className="w-4 h-4" />
            <span>WhatsApp'ta Paylaş</span>
          </button>

          <button
            onClick={handleDownloadImage}
            disabled={isDownloading}
            className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>{isDownloading ? 'Oluşturuluyor...' : 'Resim Olarak İndir (PNG)'}</span>
          </button>

          <button
            onClick={handleCopyText}
            className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all cursor-pointer flex items-center justify-center"
            title="Metni Kopyala"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

      </div>
    </div>
  );
};

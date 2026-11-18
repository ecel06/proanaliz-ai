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
  const handleDownloadImage = (format: 'story' | 'ticket' = 'ticket') => {
    setIsDownloading(true);
    try {
      const isStory = format === 'story';
      const width = isStory ? 1080 : 1080;
      const height = isStory ? 1920 : Math.max(1200, 480 + items.length * 110);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsDownloading(false);
        return;
      }

      // Background Gradient (Deep Navy/Black)
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#020617');
      bgGrad.addColorStop(0.3, '#0B132B');
      bgGrad.addColorStop(0.7, '#071026');
      bgGrad.addColorStop(1, '#020617');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Glowing Outer Gold Border
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 6;
      ctx.strokeRect(32, 32, width - 64, height - 64);

      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 40, width - 80, height - 80);

      // Header Badge: ProAnaliz AI
      ctx.fillStyle = '#10B981';
      ctx.font = 'bold 44px sans-serif';
      ctx.fillText('⚡ ProAnaliz AI', 80, isStory ? 140 : 115);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '20px sans-serif';
      const dateText = new Date().toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      ctx.fillText(dateText, 80, isStory ? 180 : 155);

      // Coupon Title
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 36px sans-serif';
      ctx.fillText(couponTitle, 80, isStory ? 240 : 210);

      // Separator line
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(80, isStory ? 275 : 240);
      ctx.lineTo(width - 80, isStory ? 275 : 240);
      ctx.stroke();

      // Match Items
      let startY = isStory ? 320 : 275;
      items.forEach((it, idx) => {
        const rowH = 105;
        // Background row
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.6)';
        ctx.lineWidth = 2;
        ctx.fillRect(80, startY, width - 160, rowH);
        ctx.strokeRect(80, startY, width - 160, rowH);

        // Number
        ctx.fillStyle = '#10B981';
        ctx.font = 'bold 26px sans-serif';
        ctx.fillText(`${idx + 1}.`, 105, startY + 62);

        // Teams
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText(`${it.home} vs ${it.away}`, 155, startY + 48);

        // League
        ctx.fillStyle = '#64748B';
        ctx.font = '20px sans-serif';
        ctx.fillText(it.league, 155, startY + 82);

        // Pick Badge
        ctx.fillStyle = '#F59E0B';
        ctx.font = '900 28px sans-serif';
        ctx.fillText(it.pick, width - 360, startY + 62);

        // Odds
        ctx.fillStyle = '#10B981';
        ctx.font = '900 30px monospace';
        ctx.fillText(`@${it.odd.toFixed(2)}`, width - 190, startY + 62);

        startY += rowH + 18;
      });

      // Summary Card
      startY += 15;
      const sumH = 150;
      ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 3;
      ctx.fillRect(80, startY, width - 160, sumH);
      ctx.strokeRect(80, startY, width - 160, sumH);

      ctx.fillStyle = '#CBD5E1';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('TOPLAM ORAN', 115, startY + 50);
      ctx.fillText('OLASI KAZANÇ', width - 330, startY + 50);

      ctx.fillStyle = '#F59E0B';
      ctx.font = '900 48px monospace';
      ctx.fillText(calcOdds.toFixed(2), 115, startY + 115);

      ctx.fillStyle = '#10B981';
      ctx.font = '900 48px monospace';
      ctx.fillText(`${calcWin.toLocaleString('tr-TR')} ₺`, width - 330, startY + 115);

      // Won Stamp if Won
      if (checkWon) {
        ctx.save();
        ctx.translate(width - 200, 150);
        ctx.rotate(-0.15);
        ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 4;
        ctx.fillRect(-120, -35, 240, 70);
        ctx.strokeRect(-120, -35, 240, 70);
        ctx.fillStyle = '#10B981';
        ctx.font = '900 32px sans-serif';
        ctx.fillText('⭐ TUTTU ⭐', -100, 12);
        ctx.restore();
      }

      // Watermark
      ctx.fillStyle = '#64748B';
      ctx.font = 'bold 22px sans-serif';
      const footY = height - 65;
      ctx.fillText('🤖 ProAnaliz AI • İstatistik & Tahmin Modeli', 80, footY);
      ctx.fillText('proanaliz-ai.onrender.com', width - 380, footY);

      // Export & Download
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
        <div className="p-3.5 sm:p-4 bg-slate-950/95 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={handleShareWhatsApp}
            className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all cursor-pointer shadow-lg shadow-emerald-600/30"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          <button
            onClick={() => handleDownloadImage('story')}
            disabled={isDownloading}
            className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-pink-600 via-rose-500 to-amber-500 hover:opacity-90 text-white font-extrabold text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
            title="Instagram Story formatında 1080x1920 HD görsel indir"
          >
            <Download className="w-3.5 h-3.5" />
            <span>📱 Story (9:16)</span>
          </button>

          <button
            onClick={() => handleDownloadImage('ticket')}
            disabled={isDownloading}
            className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-amber-400/40 transition-all cursor-pointer disabled:opacity-50"
            title="Bilet formatında HD PNG indir"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isDownloading ? '...' : '🎫 Bilet İndir'}</span>
          </button>

          <button
            onClick={handleCopyText}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
              copied
                ? 'bg-emerald-500 text-slate-950 font-black'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
            title="Metni Kopyala"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Kopyalandı!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Metin</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};


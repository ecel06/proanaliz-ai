// src/components/ShareAppModal.tsx
import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  QrCode, 
  Gift, 
  Sparkles, 
  Users, 
  Award, 
  ExternalLink,
  Smartphone
} from 'lucide-react';
import { User } from '../utils/authHelper';

interface ShareAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
  onOpenAuth?: () => void;
}

export const ShareAppModal: React.FC<ShareAppModalProps> = ({
  isOpen,
  onClose,
  user,
  onOpenAuth
}) => {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://proanaliz-ai.onrender.com';
  const referralCode = user?.referralCode || (user ? user.id.slice(-6).toUpperCase() : '');
  const shareUrl = referralCode ? `${currentOrigin}?ref=${referralCode}` : currentOrigin;

  const shareTitle = 'ProAnaliz AI • Yapay Zeka Canlı İddaa, TJK ve Borsa Terminali';
  const shareText = `🔥 Yapay zeka canlı bülteni, Poisson maç tahminleri, TJK at yarışı analizleri ve Borsa robotu ProAnaliz AI'da! Hemen ücretsiz incele:`;

  const fullShareMessage = `${shareText}\n${shareUrl}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  const shareWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullShareMessage)}`;
    window.open(url, '_blank');
  };

  const shareTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const shareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&format=svg&data=${encodeURIComponent(shareUrl)}`;

  const referralCount = user?.referralCount || 0;
  const earnedVipDays = referralCount * 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl shadow-emerald-950/40 text-slate-100 p-4 sm:p-6 space-y-4 sm:space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/60 hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Kapat"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 pr-8">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-amber-400/20 via-emerald-400/15 to-teal-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0 shadow-inner">
            <Gift className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                Uygulamayı Paylaş &amp; Kazan
              </h2>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30">
                +3 GÜN VIP
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              Arkadaşlarını davet et, üye olan her arkadaşın için hediye VIP kazan!
            </p>
          </div>
        </div>

        {/* 🎁 HERO REFERRAL CARD */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-teal-500/15 border border-amber-400/30 space-y-2.5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span>Arkadaşını Getir, VIP Kazan</span>
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-900/80 text-emerald-300 border border-emerald-500/30">
              Sınırsız Kazanım
            </span>
          </div>

          <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">
            Paylaştığın bağlantı ile kayıt olan her arkadaşın <strong className="text-emerald-400">10 günlük deneme VIP</strong> kazanır, senin hesabına da anında <strong className="text-amber-300">+3 Gün Hediye VIP</strong> tanımlanır!
          </p>

          {user ? (
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
              <div className="flex items-center space-x-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] text-slate-400">Davet Ettiğin</div>
                  <div className="text-xs font-black font-mono text-white">{referralCount} Kişi</div>
                </div>
              </div>

              <div className="flex items-center space-x-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                <Award className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] text-slate-400">Kazanılan VIP</div>
                  <div className="text-xs font-black font-mono text-amber-300">+{earnedVipDays} Gün</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="pt-1 flex items-center justify-between text-[11px] text-amber-200/90 bg-slate-950/40 p-2 rounded-xl border border-amber-500/20">
              <span>Davet ödüllerini kazanmak için giriş yap:</span>
              {onOpenAuth && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenAuth();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer transition-colors"
                >
                  Giriş Yap
                </button>
              )}
            </div>
          )}
        </div>

        {/* 🔗 REFERRAL LINK & COPY */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
            <span>Senin Özel Davet Bağlantın:</span>
            {user?.referralCode && (
              <span className="font-mono text-[10px] text-amber-400 font-bold">Kod: {user.referralCode}</span>
            )}
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500 select-all"
            />
            <button
              onClick={handleCopyLink}
              className={`flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shrink-0 ${
                copied
                  ? 'bg-emerald-500 text-slate-950 font-black'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {copied ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Kopyalandı' : 'Kopyala'}</span>
            </button>
          </div>
        </div>

        {/* 🚀 QUICK SOCIAL SHARE BUTTONS */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Doğrudan Gruplarda Paylaş:
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* WhatsApp */}
            <button
              onClick={shareWhatsApp}
              className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-1.5 p-2.5 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-[#25D366] font-black text-xs transition-all cursor-pointer active:scale-95 shadow-sm"
            >
              <span className="text-base sm:text-sm">💬</span>
              <span>WhatsApp</span>
            </button>

            {/* Telegram */}
            <button
              onClick={shareTelegram}
              className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-1.5 p-2.5 rounded-xl bg-[#229ED9]/15 hover:bg-[#229ED9]/25 border border-[#229ED9]/40 text-[#229ED9] font-black text-xs transition-all cursor-pointer active:scale-95 shadow-sm"
            >
              <span className="text-base sm:text-sm">✈️</span>
              <span>Telegram</span>
            </button>

            {/* X / Twitter */}
            <button
              onClick={shareTwitter}
              className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-1.5 p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-black text-xs transition-all cursor-pointer active:scale-95 shadow-sm"
            >
              <span className="text-base sm:text-sm font-sans">𝕏</span>
              <span>Paylaş</span>
            </button>
          </div>

          {/* Native Mobile Share Button (if supported) */}
          <button
            onClick={handleNativeShare}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-emerald-500/20 active:scale-98 transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4 stroke-[2.5]" />
            <span>Telefon Paylaşım Menüsünü Aç (Instagram, SMS vb.)</span>
          </button>
        </div>

        {/* 📱 QR CODE ACCORDION */}
        <div className="pt-1 border-t border-slate-800">
          <button
            onClick={() => setShowQr(!showQr)}
            className="w-full flex items-center justify-between text-xs font-bold text-slate-400 hover:text-white py-1 transition-colors cursor-pointer"
          >
            <span className="flex items-center space-x-1.5">
              <QrCode className="w-4 h-4 text-emerald-400" />
              <span>Yüz Yüze Paylaşım (Taranabilir Karekod)</span>
            </span>
            <span className="text-[10px] text-emerald-400">{showQr ? 'Gizle' : 'Karekodu Aç'}</span>
          </button>

          {showQr && (
            <div className="mt-2.5 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col items-center text-center space-y-2 animate-fadeIn">
              <div className="p-2.5 bg-white rounded-xl shadow-md">
                <img src={qrImageUrl} alt="ProAnaliz AI Davet QR Kodu" className="w-36 h-36" />
              </div>
              <p className="text-[11px] text-slate-400 max-w-xs">
                Arkadaşınız telefonunun kamerasıyla bu karekodu okuttuğunda doğrudan davet linkinizle ProAnaliz AI açılır.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

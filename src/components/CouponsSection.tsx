// src/components/CouponsSection.tsx
// Rich UI section displaying AI-curated Banko, İdeal, and Sürpriz coupons with odds and stake calculator.

import React, { useState } from 'react';
import { Match } from '../types';
import { CuratedCoupon, CouponMatchItem } from '../utils/couponEngine';
import {
  Flame,
  ShieldCheck,
  Zap,
  Sparkles,
  Copy,
  Check,
  Calculator,
  TrendingUp,
  Clock,
  ArrowRight,
  ArrowLeft,
  Home,
  ChevronRight,
  Info
} from 'lucide-react';

interface CouponsSectionProps {
  coupons: CuratedCoupon[];
  onSelectMatch: (match: Match) => void;
  onViewAllMatches?: () => void;
}

export const CouponsSection: React.FC<CouponsSectionProps> = ({
  coupons,
  onSelectMatch,
  onViewAllMatches
}) => {
  const [stake, setStake] = useState<number>(100);
  const [copiedCouponId, setCopiedCouponId] = useState<string | null>(null);

  const quickStakes = [50, 100, 250, 500, 1000];

  const handleCopyCoupon = (coupon: CuratedCoupon) => {
    const potentialWin = Math.round(stake * coupon.totalOdds);
    let text = `🎯 ProAnaliz AI • ${coupon.title}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    coupon.items.forEach((item, idx) => {
      text += `${idx + 1}. ⚽ ${item.homeTeamName} vs ${item.awayTeamName} (KOD: ${item.iddaaCode})\n`;
      text += `   🏆 ${item.league} • 📅 ${item.matchTimeText}\n`;
      text += `   👉 Tercih: ${item.pickLabel} | Oran: ${item.odd.toFixed(2)} | Güven: %${item.confidence}\n`;
      text += `   💡 Not: ${item.reasoning}\n\n`;
    });
    text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🔥 Toplam Oran: ${coupon.totalOdds.toFixed(2)} | Ortalama Güven: %${coupon.avgConfidence}\n`;
    text += `💰 ${stake} ₺ Bahis ➔ ${potentialWin.toLocaleString('tr-TR')} ₺ Potansiyel Kazanç\n`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedCouponId(coupon.id);
      setTimeout(() => setCopiedCouponId(null), 2500);
    });
  };

  const getCouponIcon = (id: string) => {
    switch (id) {
      case 'banko':
        return <ShieldCheck className="w-5 h-5 text-emerald-400" />;
      case 'ideal':
        return <Zap className="w-5 h-5 text-amber-400" />;
      case 'surpriz':
        return <Flame className="w-5 h-5 text-purple-400 animate-pulse" />;
      default:
        return <Sparkles className="w-5 h-5 text-emerald-400" />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Navigation & Return to Matches Bar */}
      {onViewAllMatches && (
        <div className="flex items-center justify-between p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/30 border border-slate-800 shadow-lg">
          <button
            onClick={onViewAllMatches}
            className="flex items-center space-x-2 px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 stroke-[3]" />
            <span>← Ana Sayfaya & Maç Bültenine Dön</span>
          </button>

          <button
            onClick={onViewAllMatches}
            className="text-xs text-slate-400 hover:text-white font-bold flex items-center space-x-1.5 cursor-pointer bg-slate-800/80 hover:bg-slate-800 px-3 py-2 rounded-xl border border-slate-700/80 transition-colors"
          >
            <Home className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Tüm Karşılaşmalar</span>
          </button>
        </div>
      )}

      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-5 sm:p-7 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Yapay Zeka Destekli 3 Farklı Kupon Kombinasyonu</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Günün Kuponları: <span className="text-emerald-400">Banko</span> •{' '}
              <span className="text-amber-400">İdeal</span> •{' '}
              <span className="text-purple-400">Sürpriz</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Poisson dağılımı, xG istatistikleri ve gerçek takım formları taranarak günün en yüksek matematiksel değere sahip maçları 3 farklı risk seviyesinde kuponlaştırıldı.
            </p>
          </div>

          {/* Stake / Bahis Miktarı Hesaplayıcı */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 shrink-0 shadow-lg min-w-[260px]">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="flex items-center space-x-1.5 font-semibold">
                <Calculator className="w-3.5 h-3.5 text-emerald-400" />
                <span>Kupon Bedeli (Stake):</span>
              </span>
              <span className="font-bold text-white font-mono">{stake} ₺</span>
            </div>
            
            <div className="flex items-center gap-1.5 mb-2.5">
              {quickStakes.map((val) => (
                <button
                  key={val}
                  onClick={() => setStake(val)}
                  className={`flex-1 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    stake === val
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  {val}₺
                </button>
              ))}
            </div>

            <div className="text-[10px] text-slate-500 flex items-center justify-between">
              <span>Potansiyel kazançlar otomatik hesaplanır.</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Coupons Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {coupons.map((coupon) => {
          const potentialWin = Math.round(stake * coupon.totalOdds);
          const isCopied = copiedCouponId === coupon.id;

          return (
            <div
              key={coupon.id}
              className={`flex flex-col justify-between rounded-3xl bg-slate-900/85 border ${coupon.borderColor} p-5 sm:p-6 transition-all duration-300 hover:shadow-2xl ${coupon.glowColor} relative overflow-hidden backdrop-blur-sm`}
            >
              {/* Header */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                      {getCouponIcon(coupon.id)}
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-white">
                        {coupon.shortTitle}
                      </h3>
                      <div className="text-[11px] text-slate-400 font-medium">
                        {coupon.items.length} Karşılaşma
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase ${coupon.badgeBg} ${coupon.badgeText}`}
                  >
                    {coupon.badge}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-snug">
                  {coupon.description}
                </p>

                {/* Total Odds & Payout Highlight Banner */}
                <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Toplam Oran</div>
                    <div className={`text-2xl font-black font-mono tracking-tight ${coupon.accentColor}`}>
                      {coupon.totalOdds.toFixed(2)}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">
                      {stake} ₺ Bahis Kazancı
                    </div>
                    <div className="text-base sm:text-lg font-black text-white font-mono">
                      {potentialWin.toLocaleString('tr-TR')} ₺
                    </div>
                  </div>
                </div>

                {/* Confidence Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Ortalama Güven Endeksi</span>
                    <span className="font-bold text-white font-mono">%{coupon.avgConfidence}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        coupon.id === 'banko'
                          ? 'bg-emerald-400'
                          : coupon.id === 'ideal'
                          ? 'bg-amber-400'
                          : 'bg-purple-400'
                      }`}
                      style={{ width: `${coupon.avgConfidence}%` }}
                    />
                  </div>
                </div>

                {/* Match Cards in Coupon */}
                <div className="space-y-2.5 pt-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
                    <span>Seçilen Maçlar & Oranlar</span>
                  </div>

                  {coupon.items.map((item, idx) => (
                    <div
                      key={item.id}
                      onClick={() => onSelectMatch(item.match)}
                      className="group p-3 rounded-2xl bg-slate-950/60 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer shadow-inner"
                      title="Detaylı Analiz & Simülasyonu Gör"
                    >
                      {/* Top League & Iddaa Code row */}
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono font-bold text-amber-300 bg-amber-400/15 border border-amber-400/30 px-1.5 py-0.2 rounded">
                            KOD: {item.iddaaCode}
                          </span>
                          <span className="text-slate-300 font-semibold">{item.league}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-slate-400">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{item.matchTimeText}</span>
                        </div>
                      </div>

                      {/* Teams */}
                      <div className="text-xs sm:text-sm font-black text-white mb-2 flex items-center justify-between group-hover:text-emerald-300 transition-colors">
                        <span className="truncate">{item.homeTeamName}</span>
                        <span className="text-slate-500 text-[10px] font-normal px-1.5">vs</span>
                        <span className="truncate">{item.awayTeamName}</span>
                      </div>

                      {/* Prediction & Odds Pill */}
                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800 mb-1.5">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-black text-emerald-400">
                            {item.pickLabel}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] text-slate-400 font-semibold">
                            %{item.confidence} Güven
                          </span>
                          <span className="text-xs font-black font-mono px-2 py-0.5 rounded-md bg-amber-400/15 text-amber-300 border border-amber-400/30">
                            {item.odd.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* AI Reasoning Note */}
                      <div className="text-[10px] text-slate-400 leading-tight italic">
                        "{item.reasoning}"
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Action: Copy Coupon Button */}
              <div className="pt-4 mt-4 border-t border-slate-800/80">
                <button
                  onClick={() => handleCopyCoupon(coupon)}
                  className={`w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md ${
                    isCopied
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4 text-slate-950" />
                      <span>Kupon Panoya Kopyalandı!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-400" />
                      <span>Kuponu Kopyala (WhatsApp / Metin)</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* Info Banner at Bottom */}
      <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400 flex items-start space-x-3">
        <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Kuponlardaki maçlar ve oranlar açık spor veri uç noktalarından canlı analiz edilerek yapay zeka tarafından derlenmiştir. Herhangi bir maça tıklayarak ayrıntılı Poisson olasılık simülasyonunu, karşılıklı form analizini ve ilk yarı gol beklentilerini inceleyebilirsiniz.
        </p>
      </div>

      {/* Bottom Back Button */}
      {onViewAllMatches && (
        <div className="flex justify-center pt-2 pb-6">
          <button
            onClick={onViewAllMatches}
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-emerald-500/25 transition-transform active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 stroke-[3]" />
            <span>Tüm Maç Bültenine & Ana Sayfaya Dön</span>
          </button>
        </div>
      )}

    </div>
  );
};


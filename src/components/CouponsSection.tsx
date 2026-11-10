// src/components/CouponsSection.tsx
// Rich UI section displaying AI-curated Daily Banko, İdeal, and Sürpriz coupons.
// Features daily date selector, odds, stake calculator, and crystal clear TUTTU / YATTI badges
// with the match score positioned strictly underneath the status badge.

import React, { useState, useMemo } from 'react';
import { Match, MatchAnalysis } from '../types';
import {
  CuratedCoupon,
  CouponMatchItem,
  CouponDayFilter,
  generateCuratedCoupons
} from '../utils/couponEngine';
import {
  Flame,
  ShieldCheck,
  Zap,
  Sparkles,
  Copy,
  Check,
  Calculator,
  Clock,
  ArrowLeft,
  Home,
  CheckCircle2,
  XCircle,
  Radio,
  Star,
  Info,
  Calendar
} from 'lucide-react';

interface CouponsSectionProps {
  coupons?: CuratedCoupon[];
  allMatches?: Match[];
  analysesMap?: Map<string, MatchAnalysis>;
  currentTime?: Date;
  onSelectMatch: (match: Match) => void;
  onViewAllMatches?: () => void;
  onAddCouponToBetslip?: (coupon: CuratedCoupon) => void;
}

export const CouponsSection: React.FC<CouponsSectionProps> = ({
  coupons: initialCoupons,
  allMatches = [],
  analysesMap = new Map(),
  currentTime = new Date(),
  onSelectMatch,
  onViewAllMatches,
  onAddCouponToBetslip
}) => {
  const [stake, setStake] = useState<number>(100);
  const [copiedCouponId, setCopiedCouponId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<CouponDayFilter>('today');

  const quickStakes = [50, 100, 250, 500, 1000];

  // Dynamic daily coupons based on selected day tab
  const activeCoupons = useMemo(() => {
    if (allMatches.length > 0) {
      return generateCuratedCoupons(allMatches, analysesMap, currentTime, selectedDay);
    }
    return initialCoupons || [];
  }, [allMatches, analysesMap, currentTime, selectedDay, initialCoupons]);

  const handleCopyCoupon = (coupon: CuratedCoupon) => {
    const potentialWin = Math.round(stake * coupon.totalOdds);
    let text = `🎯 ProAnaliz AI • ${coupon.title}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    coupon.items.forEach((item, idx) => {
      const outcomeText =
        item.pickStatus === 'won'
          ? ` [✅ TUTTU - Skor: ${item.currentScore.home}-${item.currentScore.away}]`
          : item.pickStatus === 'lost'
          ? ` [❌ YATTI - Skor: ${item.currentScore.home}-${item.currentScore.away}]`
          : item.pickStatus === 'live'
          ? ` [🔴 CANLI ${item.liveMinute || ''} - Skor: ${item.currentScore.home}-${item.currentScore.away}]`
          : ` [📅 ${item.matchTimeText}]`;

      text += `${idx + 1}. ⚽ ${item.homeTeamName} vs ${item.awayTeamName} (KOD: ${item.iddaaCode})${outcomeText}\n`;
      text += `   🏆 ${item.league}\n`;
      text += `   👉 Tercih: ${item.pickLabel} | Oran: ${item.odd.toFixed(2)} | Güven: %${item.confidence}\n`;
      text += `   💡 Not: ${item.reasoning}\n\n`;
    });
    text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🔥 Toplam Oran: ${coupon.totalOdds.toFixed(2)} | Ortalama Güven: %${coupon.avgConfidence}\n`;
    text += `💰 ${stake} ₺ Bahis ➔ ${potentialWin.toLocaleString('tr-TR')} ₺ Potansiyel Kazanç\n`;
    if (coupon.status === 'won') {
      text += `🏆 TEBRİKLER! BU KUPON TUTMUŞTUR! ⭐⭐⭐\n`;
    }

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
        return <Flame className="w-5 h-5 text-purple-400" />;
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
              <span>Günlük Yapay Zeka Kupon Kombinasyonları</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Günlük Kuponlar: <span className="text-emerald-400">Banko</span> •{' '}
              <span className="text-amber-400">İdeal</span> •{' '}
              <span className="text-purple-400">Sürpriz</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Her gün bülten otomatik taranarak günün en güvenilir maçları 3 farklı seviyede kuponlaştırılır. Karşılaşmalar bittikçe tutan maçlar yeşil, yatanlar kırmızı olarak anlık sonuçlanır.
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

      {/* GÜNLÜK KUPON TARİH SEÇİCİ (Bugün, Dün, Tüm Hafta) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-inner">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-300">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span>Kupon Günü:</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedDay('today')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
              selectedDay === 'today'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-800/90 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping" />
            <span>Bugünün Kuponları</span>
          </button>

          <button
            onClick={() => setSelectedDay('yesterday')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedDay === 'yesterday'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-800/90 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
            }`}
          >
            <span>Dünün Kuponları (Arşiv)</span>
          </button>

          <button
            onClick={() => setSelectedDay('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedDay === 'all'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-800/90 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
            }`}
          >
            <span>Tüm Hafta Sonu</span>
          </button>
        </div>
      </div>

      {/* 3 Coupons Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {activeCoupons.map((coupon) => {
          const potentialWin = Math.round(stake * coupon.totalOdds);
          const isCopied = copiedCouponId === coupon.id;

          const isCouponWon = coupon.status === 'won';
          const isCouponLost = coupon.status === 'lost';

          // Dynamic coupon container styling based on outcome
          let containerClasses = 'border-slate-800 bg-slate-900/85';
          if (isCouponWon) {
            // TUTAN KUPON: Yeşil yanıp söner ve parıldayan gölge
            containerClasses =
              'border-2 border-emerald-400 bg-gradient-to-b from-emerald-950/70 via-slate-900/95 to-emerald-950/50 shadow-[0_0_35px_rgba(16,185,129,0.35)] ring-2 ring-emerald-400/40 animate-pulse';
          } else if (isCouponLost) {
            // TUTMAYAN KUPON: Kırmızı renk
            containerClasses =
              'border-2 border-rose-500/70 bg-gradient-to-b from-rose-950/40 via-slate-900/95 to-slate-950 shadow-[0_0_25px_rgba(244,63,94,0.25)]';
          } else {
            // DEVAM EDEN KUPON: Standart temalı
            containerClasses = `border ${coupon.borderColor} bg-slate-900/85 ${coupon.glowColor}`;
          }

          return (
            <div
              key={coupon.id}
              className={`flex flex-col justify-between rounded-3xl p-5 sm:p-6 transition-all duration-300 hover:shadow-2xl relative overflow-hidden backdrop-blur-sm ${containerClasses}`}
            >
              {/* TUTAN KUPON: Canlı Yıldız Efekti & Arka Plan Parıltısı */}
              {isCouponWon && (
                <>
                  <div className="absolute -top-10 -right-10 w-44 h-44 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
                  <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-teal-400/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
                </>
              )}

              {/* TUTMUŞSA (WON) KUPON BAŞLIĞI - YEŞİL YANIP SÖNEN & YILDIZLAR ÇIKAN BANNER */}
              {isCouponWon && (
                <div className="relative z-10 overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 p-3 text-slate-950 shadow-xl shadow-emerald-500/30 flex items-center justify-between mb-4 animate-pulse">
                  <div className="flex items-center space-x-1.5 font-black text-xs sm:text-sm tracking-wider">
                    <Sparkles className="w-4 h-4 text-slate-950 animate-spin" style={{ animationDuration: '4s' }} />
                    <span>⭐ TEBRİKLER! KUPON TUTTU ⭐</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 fill-amber-300 text-amber-300 animate-bounce" />
                    <Star className="w-4 h-4 fill-amber-300 text-amber-300 animate-bounce delay-100" />
                    <Star className="w-4 h-4 fill-amber-300 text-amber-300 animate-bounce delay-200" />
                  </div>
                </div>
              )}

              {/* TUTMAMIŞSA (LOST) KUPON BAŞLIĞI - KIRMIZI BİLGİ BANNERI */}
              {isCouponLost && (
                <div className="rounded-2xl bg-rose-950/80 border border-rose-500/60 p-2.5 text-rose-200 flex items-center justify-between mb-4 shadow-inner">
                  <span className="font-extrabold text-xs flex items-center space-x-1.5">
                    <XCircle className="w-4 h-4 text-rose-400" />
                    <span>KUPON TUTMADI (YATTI)</span>
                  </span>
                  <span className="text-[10px] text-rose-300 font-mono font-bold bg-rose-900/60 px-2 py-0.5 rounded-full border border-rose-500/40">
                    {coupon.lostCount} Maç Kaybetti
                  </span>
                </div>
              )}

              {/* Header */}
              <div className="space-y-3.5 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                      {isCouponWon ? (
                        <Star className="w-5 h-5 fill-amber-400 text-amber-400 animate-bounce" />
                      ) : isCouponLost ? (
                        <XCircle className="w-5 h-5 text-rose-400" />
                      ) : (
                        getCouponIcon(coupon.id)
                      )}
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-white flex items-center space-x-1.5">
                        <span>{coupon.shortTitle}</span>
                        {isCouponWon && <span className="text-amber-300 text-sm">✨</span>}
                      </h3>
                      <div className="text-[11px] text-slate-400 font-medium">
                        {coupon.items.length} Karşılaşma •{' '}
                        {isCouponWon ? (
                          <strong className="text-emerald-400 font-bold">%100 İsabet</strong>
                        ) : isCouponLost ? (
                          <strong className="text-rose-400 font-bold">{coupon.wonCount} Tutan / {coupon.lostCount} Yatan</strong>
                        ) : (
                          <span>{coupon.wonCount} Tamamlandı</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {onAddCouponToBetslip && (
                      <button
                        onClick={() => onAddCouponToBetslip(coupon)}
                        className="px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-amber-400 text-slate-950 hover:bg-amber-300 transition-all cursor-pointer shadow-md flex items-center space-x-1"
                        title="Bu 3 maçı kuponuma ekle"
                      >
                        <Zap className="w-3 h-3 fill-slate-950" />
                        <span>Kupona Ekle</span>
                      </button>
                    )}
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase ${
                        isCouponWon
                          ? 'bg-emerald-500/25 border border-emerald-400 text-emerald-300'
                          : isCouponLost
                          ? 'bg-rose-500/20 border border-rose-500/50 text-rose-300'
                          : `${coupon.badgeBg} ${coupon.badgeText}`
                      }`}
                    >
                      {isCouponWon ? '🏆 KAZANDI' : isCouponLost ? 'YATTI' : coupon.badge}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-snug">
                  {coupon.description}
                </p>

                {/* Total Odds & Payout Highlight Banner */}
                <div
                  className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                    isCouponWon
                      ? 'bg-emerald-950/70 border-emerald-400/50 shadow-inner'
                      : isCouponLost
                      ? 'bg-rose-950/30 border-rose-500/30'
                      : 'bg-slate-950/90 border-slate-800'
                  }`}
                >
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Toplam Oran</div>
                    <div
                      className={`text-2xl font-black font-mono tracking-tight ${
                        isCouponWon ? 'text-emerald-300' : isCouponLost ? 'text-slate-400 line-through' : coupon.accentColor
                      }`}
                    >
                      {coupon.totalOdds.toFixed(2)}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">
                      {isCouponWon ? '🎉 KAZANILAN TUTAR' : `${stake} ₺ Bahis Kazancı`}
                    </div>
                    <div
                      className={`text-base sm:text-xl font-black font-mono ${
                        isCouponWon ? 'text-emerald-400 drop-shadow' : isCouponLost ? 'text-slate-500' : 'text-white'
                      }`}
                    >
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
                        isCouponWon
                          ? 'bg-emerald-400'
                          : isCouponLost
                          ? 'bg-rose-500'
                          : coupon.id === 'banko'
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
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span>Kupondaki Maçlar & Sonuçlar</span>
                    <span className="text-[10px] text-slate-500 font-normal">Tıkla & Simülasyonu Gör</span>
                  </div>

                  {coupon.items.map((item) => {
                    const isMatchWon = item.pickStatus === 'won';
                    const isMatchLost = item.pickStatus === 'lost';
                    const isMatchLive = item.pickStatus === 'live';
                    const isMatchUpcoming = item.pickStatus === 'upcoming';

                    // Dynamic match card styling
                    let matchCardClasses = 'border-slate-800 bg-slate-950/60 hover:bg-slate-950 hover:border-slate-700';
                    if (isMatchWon) {
                      // TUTAN MAÇ: Yeşil yanar
                      matchCardClasses =
                        'border-2 border-emerald-500/80 bg-emerald-950/40 shadow-sm shadow-emerald-500/20 ring-1 ring-emerald-500/30';
                    } else if (isMatchLost) {
                      // TUTMAYAN MAÇ: Kırmızı yanar
                      matchCardClasses =
                        'border-2 border-rose-500/80 bg-rose-950/35 shadow-sm shadow-rose-500/20 ring-1 ring-rose-500/30';
                    } else if (isMatchLive) {
                      matchCardClasses =
                        'border border-rose-500/50 bg-slate-950/90 shadow-sm';
                    }

                    return (
                      <div
                        key={item.id}
                        onClick={() => onSelectMatch(item.match)}
                        className={`group p-3 rounded-2xl transition-all cursor-pointer relative overflow-hidden ${matchCardClasses}`}
                        title="Detaylı Analiz & Simülasyonu Gör"
                      >
                        {/* Top League & Match Status Header */}
                        <div className="flex items-start justify-between gap-2 mb-2 pb-1.5 border-b border-slate-800/40">
                          <div className="flex flex-col space-y-1 min-w-0">
                            <div className="flex items-center space-x-1.5">
                              <span className="font-mono font-bold text-amber-300 bg-amber-400/15 border border-amber-400/30 px-1.5 py-0.2 rounded text-[10px]">
                                KOD: {item.iddaaCode}
                              </span>
                              <span className="text-slate-300 font-semibold text-[11px] truncate">{item.league}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-slate-400 text-[10px]">
                              <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                              <span>{item.matchTimeText}</span>
                            </div>
                          </div>

                          {/* Dynamic Match Status Badge (TUTTU / YATTI ÜSTTE, Skor KESİNLİKLE ALTINDA) */}
                          <div className="flex flex-col items-end text-right shrink-0">
                            {isMatchWon && (
                              <>
                                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md bg-emerald-500/25 border border-emerald-400/60 text-emerald-300 font-black text-[11px] tracking-wide whitespace-nowrap shadow-sm">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                  <span>TUTTU</span>
                                </span>
                                <span className="text-[11px] font-mono font-black text-emerald-400 mt-1 whitespace-nowrap bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-md shadow-inner">
                                  MS: {item.currentScore.home} - {item.currentScore.away}
                                </span>
                              </>
                            )}

                            {isMatchLost && (
                              <>
                                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md bg-rose-500/25 border border-rose-400/60 text-rose-300 font-black text-[11px] tracking-wide whitespace-nowrap shadow-sm">
                                  <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                  <span>YATTI</span>
                                </span>
                                <span className="text-[11px] font-mono font-black text-rose-400 mt-1 whitespace-nowrap bg-rose-950/80 border border-rose-500/30 px-2 py-0.5 rounded-md shadow-inner">
                                  MS: {item.currentScore.home} - {item.currentScore.away}
                                </span>
                              </>
                            )}

                            {isMatchLive && (
                              <>
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/40 text-rose-300 font-extrabold text-[10px] whitespace-nowrap animate-pulse">
                                  <Radio className="w-3 h-3 text-rose-400 shrink-0" />
                                  <span>CANLI {item.liveMinute ? `• ${item.liveMinute}` : ''}</span>
                                </span>
                                <span className="text-[11px] font-mono font-black text-rose-400 mt-1 whitespace-nowrap bg-slate-900 border border-rose-500/30 px-2 py-0.5 rounded-md">
                                  Skor: {item.currentScore.home} - {item.currentScore.away}
                                </span>
                              </>
                            )}

                            {isMatchUpcoming && (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700 text-slate-300 font-bold text-[10px] whitespace-nowrap">
                                <span>Başlamadı</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Teams */}
                        <div className="text-xs sm:text-sm font-black text-white mb-2 flex items-center justify-between group-hover:text-emerald-300 transition-colors">
                          <span className={`truncate ${isMatchWon ? 'text-emerald-200' : isMatchLost ? 'text-rose-200' : ''}`}>
                            {item.homeTeamName}
                          </span>
                          <span className="text-slate-500 text-[10px] font-normal px-1.5">vs</span>
                          <span className={`truncate ${isMatchWon ? 'text-emerald-200' : isMatchLost ? 'text-rose-200' : ''}`}>
                            {item.awayTeamName}
                          </span>
                        </div>

                        {/* Prediction & Odds Pill */}
                        <div
                          className={`flex items-center justify-between p-2 rounded-xl border mb-1.5 ${
                            isMatchWon
                              ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                              : isMatchLost
                              ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                              : 'bg-slate-900 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span
                              className={`text-xs font-black ${
                                isMatchWon ? 'text-emerald-300' : isMatchLost ? 'text-rose-300' : 'text-emerald-400'
                              }`}
                            >
                              {item.pickLabel}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] text-slate-400 font-semibold">
                              %{item.confidence} Güven
                            </span>
                            <span
                              className={`text-xs font-black font-mono px-2 py-0.5 rounded-md ${
                                isMatchWon
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : isMatchLost
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                  : 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
                              }`}
                            >
                              {item.odd.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* AI Reasoning Note */}
                        <div className="text-[10px] text-slate-400 leading-tight italic">
                          "{item.reasoning}"
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Actions: Transfer to Betslip & Copy Coupon */}
              <div className="pt-4 mt-4 border-t border-slate-800/80 relative z-10 space-y-2.5">
                {onAddCouponToBetslip && (
                  <button
                    onClick={() => onAddCouponToBetslip(coupon)}
                    className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer shadow-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 active:scale-95 border-2 border-emerald-300/80 ring-2 ring-emerald-500/30"
                  >
                    <Zap className="w-4 h-4 fill-slate-950 text-slate-950 stroke-[2.5]" />
                    <span>⚡ BU KUPONU KUPONUMA AKTAR ({coupon.items.length} MAÇ)</span>
                  </button>
                )}

                <button
                  onClick={() => handleCopyCoupon(coupon)}
                  className={`w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md ${
                    isCopied
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : isCouponWon
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold shadow-emerald-500/25'
                      : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4 text-slate-950" />
                      <span>Kupon Panoya Kopyalandı!</span>
                    </>
                  ) : isCouponWon ? (
                    <>
                      <Star className="w-4 h-4 fill-slate-950 text-slate-950" />
                      <span>Tutan Kuponu Paylaş / Kopyala</span>
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
          Kuponlardaki maçlar ve oranlar her gün açık spor veri uç noktalarından canlı analiz edilerek yapay zeka tarafından derlenmiştir. Karşılaşmalar bittikçe kazanan tahminler <strong>yeşil</strong>, kaybedenler <strong>kırmızı</strong> olarak sonuçlanır. Tüm maçları isabetli olan kuponlar <strong>yeşil yanıp sönerek ve yıldızlarla</strong> kutlanır.
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

// src/components/VIPModal.tsx
import React, { useState } from 'react';
import {
  X,
  Crown,
  Check,
  Sparkles,
  ShieldCheck,
  Gift,
  ArrowRight,
  UserCheck,
  Zap,
  Star,
  CreditCard,
  Building2,
  MessageCircle,
  Copy,
  CheckCircle2,
} from 'lucide-react';
import { User, redeemPromoCodeApi, activateVipApi } from '../utils/authHelper';

interface VIPModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onOpenAuth: () => void;
  onUserUpdated: (user: User) => void;
}

export const VIPModal: React.FC<VIPModalProps> = ({
  isOpen,
  onClose,
  user,
  onOpenAuth,
  onUserUpdated,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'quarterly' | 'yearly'>('quarterly');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank' | 'whatsapp'>('card');
  const [copiedIban, setCopiedIban] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  if (!isOpen) return null;

  const plans = [
    {
      id: 'monthly',
      name: 'Aylık VIP',
      days: 30,
      price: '199 ₺',
      period: '/ ay',
      badge: 'POPÜLER',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      description: 'Her gün düzenli yapay zeka tüyosu arayanlar için.',
    },
    {
      id: 'quarterly',
      name: '3 Aylık VIP',
      days: 90,
      price: '499 ₺',
      period: '/ 3 ay',
      savings: '%20 İNDİRİMLİ',
      badge: 'EN ÇOK TERCİH EDİLEN',
      badgeColor: 'bg-amber-400 text-slate-950 font-black',
      description: 'Uzun soluklu kazanç ve lig sezonu için ideal paket.',
    },
    {
      id: 'yearly',
      name: 'Yıllık Kral VIP',
      days: 365,
      price: '1.490 ₺',
      period: '/ yıl',
      savings: '%40 BÜYÜK FIRSAT',
      badge: 'MAKSİMUM TASARRUF',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      description: 'Tüm yıl kesintisiz analiz, robotlar ve VIP danışmanlık.',
    },
  ];

  const features = [
    '⚽ Günün %85+ Güvenilirlik Oranlı Banko ve Sürpriz Kuponları',
    '🏇 TJK Altılı Robotu: Günün Cazip Tekleri ve Hazır Kupon Şablonları',
    '📈 Borsa & Kripto: Quant Algoritmasının Anlık "GÜÇLÜ AL" Sinyalleri',
    '🔔 Canlı Gol ve Sinyal Anlık Push Bildirimleri (Sıfır Gecikme)',
    '💬 VIP Kullanıcılara Özel Destek ve Yapay Zeka Sohbet Asistanı',
    '⚡ Reklamsız, Kesintisiz ve Işık Hızında Terminal Deneyimi',
  ];

  const handleRedeemPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) return;
    if (!user) {
      onOpenAuth();
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const res = await redeemPromoCodeApi(promoCode);
      if (res.success && res.user) {
        onUserUpdated(res.user);
        setMessage({ text: 'Tebrikler! Promosyon Koduyla VIP Üyeliğiniz Başlatıldı 🎉', isError: false });
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setMessage({ text: res.error || 'Geçersiz promosyon kodu.', isError: true });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleActivateFreeTrial = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await activateVipApi(7, '7 Günlük Deneme VIP');
      if (res.success && res.user) {
        onUserUpdated(res.user);
        setMessage({ text: 'Harika! 7 Günlük Ücretsiz VIP Üyeliğiniz Anında Aktif Edildi 🎉', isError: false });
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setMessage({ text: res.error || 'Aktivasyon yapılamadı.', isError: true });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribePlan = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    const current = plans.find(p => p.id === selectedPlan) || plans[1];
    setLoading(true);
    setMessage(null);
    try {
      // Direct activation during test/launch phase with full feedback
      const res = await activateVipApi(current.days, current.name);
      if (res.success && res.user) {
        onUserUpdated(res.user);
        setMessage({ text: `Tebrikler! ${current.name} Paketiniz Hesabınıza Tanımlandı 🎉`, isError: false });
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setMessage({ text: res.error || 'Aktivasyon hatası.', isError: true });
      }
    } finally {
      setLoading(false);
    }
  };

  const remainingDays = user?.vipExpiresAt
    ? Math.max(0, Math.ceil((user.vipExpiresAt - Date.now()) / (24 * 60 * 60 * 1000)))
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl overflow-hidden my-auto">
        {/* Glow Effects */}
        <div className="pointer-events-none absolute -top-32 -left-32 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 mb-5">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-black tracking-wider uppercase">
            <Crown className="w-4 h-4 text-amber-400" />
            <span>ProAnaliz AI • VIP Kulübü</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Yapay Zekanın Gücüyle <span className="text-amber-400">Kazanmaya Başlayın</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Günün en kazançlı banko kuponları, TJK altılı robotu ve quant hisse sinyalleri VIP üyelerimize özel.
          </p>
        </div>

        {/* ACTIVE VIP STATUS CARD (If user is already VIP) */}
        {user?.isVip && (
          <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-emerald-500/20 border border-amber-400/40 text-center space-y-1.5">
            <div className="flex items-center justify-center gap-2 text-amber-300 font-black text-sm sm:text-base">
              <Crown className="w-5 h-5 text-amber-400 animate-pulse" />
              <span>VIP Üyeliğiniz Aktif! ({user.vipPlan || 'VIP'})</span>
              <UserCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xs text-slate-300">
              Hoş geldiniz <strong className="text-white">{user.name}</strong>. {remainingDays !== null ? `Kalan süreniz: ${remainingDays} Gün.` : 'Aboneliğiniz kesintisiz aktiftir.'}
            </p>
            <div className="text-[11px] text-emerald-400 font-bold">
              ✓ Tüm VIP analizler, günün kuponları ve quant sinyalleri hesabınıza açık.
            </div>
          </div>
        )}

        {/* NOT LOGGED IN WARNING / CALL TO ACTION */}
        {!user && (
          <div className="mb-5 p-4 rounded-2xl bg-slate-950/80 border border-amber-400/30 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="space-y-0.5 text-center sm:text-left">
              <div className="text-xs font-black text-white flex items-center justify-center sm:justify-start gap-1.5">
                <Gift className="w-4 h-4 text-amber-400" />
                <span>7 Günlük Ücretsiz VIP Hediye!</span>
              </div>
              <p className="text-[11px] text-slate-400">
                VIP avantajlarını anında kullanmak için ücretsiz hesap açın veya giriş yapın.
              </p>
            </div>
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs whitespace-nowrap shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
            >
              Giriş Yap / Ücretsiz Kayıt Ol
            </button>
          </div>
        )}

        {/* Plan Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          {plans.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id as any)}
                className={`relative rounded-2xl p-4 border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-b from-slate-800/90 to-slate-900 border-amber-400 ring-2 ring-amber-400/30 shadow-lg shadow-amber-500/10 scale-[1.02]'
                    : 'bg-slate-950/60 hover:bg-slate-800/40 border-slate-800'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shadow ${plan.badgeColor}`}>
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="space-y-1 pt-1">
                  <div className="text-xs font-bold text-slate-400">{plan.name}</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl sm:text-2xl font-black text-white">{plan.price}</span>
                    <span className="text-[11px] text-slate-500">{plan.period}</span>
                  </div>
                  {plan.savings && (
                    <span className="inline-block text-[10px] font-black text-emerald-400">
                      {plan.savings}
                    </span>
                  )}
                  <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                    {plan.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className={`font-bold ${isSelected ? 'text-amber-400' : 'text-slate-500'}`}>
                    {isSelected ? 'Seçildi' : 'Seç'}
                  </span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    isSelected ? 'border-amber-400 bg-amber-400 text-slate-950' : 'border-slate-700'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature List */}
        <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800/80 mb-5">
          <div className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>VIP Üyelik ile Neler Kazanacaksınız?</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
            {features.map((feat, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Method Selector */}
        <div className="mb-5 space-y-2">
          <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-amber-400" />
            <span>Ödeme Yöntemi Seçiniz:</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'card', label: 'Banka / Kredi Kartı', icon: CreditCard, sub: '3D Secure • Anında Onay' },
              { id: 'bank', label: 'Havale / EFT / FAST', icon: Building2, sub: 'IBAN ile Direkt Transfer' },
              { id: 'whatsapp', label: 'WhatsApp Danışman', icon: MessageCircle, sub: '7/24 Canlı Destek' },
            ].map((method) => {
              const Icon = method.icon;
              const active = paymentMethod === method.id;
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id as any)}
                  className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    active
                      ? 'bg-amber-400/10 border-amber-400 ring-1 ring-amber-400/30 text-white shadow-md'
                      : 'bg-slate-950/60 hover:bg-slate-800/40 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Icon className={`w-4 h-4 ${active ? 'text-amber-400' : 'text-slate-500'}`} />
                    {active && <Check className="w-3.5 h-3.5 text-amber-400 stroke-[3]" />}
                  </div>
                  <div>
                    <div className="text-xs font-black truncate">{method.label}</div>
                    <div className="text-[10px] text-slate-500 truncate">{method.sub}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Conditional Method Details */}
          {paymentMethod === 'bank' && (
            <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-amber-500/30 space-y-2 animate-fade-in">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-bold">Banka:</span>
                <span className="font-black text-white">Ziraat Bankası / FAST Uyumlu</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-bold">Alıcı:</span>
                <span className="font-black text-amber-300">ProAnaliz Bilişim Teknolojileri A.Ş.</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
                <div className="min-w-0 pr-2">
                  <div className="text-[10px] text-slate-500 font-bold">IBAN Numarası:</div>
                  <div className="text-xs font-mono font-black text-white select-all">
                    TR12 0001 0090 1084 7291 0050 01
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText('TR120001009010847291005001');
                    setCopiedIban(true);
                    setTimeout(() => setCopiedIban(false), 2000);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                >
                  {copiedIban ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedIban ? 'Kopyalandı' : 'Kopyala'}</span>
                </button>
              </div>
              <div className="text-[10px] text-slate-400">
                * Açıklama kısmına <strong>{user?.email || 'Kayıtlı E-postanızı'}</strong> yazınız. Transfer sonrası aşağıdaki butonla aktivasyonu anında onaylayabilirsiniz.
              </div>
            </div>
          )}

          {paymentMethod === 'whatsapp' && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2 animate-fade-in text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-xs font-black text-emerald-300 flex items-center justify-center sm:justify-start gap-1.5">
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp VIP Danışman Hattı (7/24)</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Özel indirimler, havale dekont onayı ve doğrudan danışman desteği.
                </p>
              </div>
              <a
                href={`https://wa.me/905300000000?text=${encodeURIComponent(
                  `Merhaba ProAnaliz AI! ${user?.email ? user.email : ''} hesabım için VIP üyelik başlatmak istiyorum.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs whitespace-nowrap shadow-lg shadow-emerald-500/20 transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp ile Yaz</span>
              </a>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {/* Main Action Button */}
          {user ? (
            <button
              onClick={handleSubscribePlan}
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider transition-all shadow-xl shadow-amber-500/25 active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              <span>
                {paymentMethod === 'bank'
                  ? 'Havale Bildir & VIP Üyeliği Başlat'
                  : user.isVip
                  ? 'Planı Yenile / Seçili Pakete Geç'
                  : 'Seçili Paketi Başlat & VIP Ol'}
              </span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider transition-all shadow-xl shadow-amber-500/25 active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 group"
            >
              <span>Ücretsiz Kayıt Ol &amp; 7 Günlük VIP Kazan</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          )}

          {/* Quick 1-Click Free Trial for logged-in non-VIP users */}
          {user && !user.isVip && (
            <button
              onClick={handleActivateFreeTrial}
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-amber-300 hover:text-white font-bold text-xs border border-amber-400/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Hemen 7 Günlük Ücretsiz VIP Denemeyi Aktif Et (Tek Tıkla)</span>
            </button>
          )}
        </div>

        {/* Promo Code Accordion / Input */}
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <form onSubmit={handleRedeemPromo} className="flex flex-col sm:flex-row items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
              <Gift className="w-3.5 h-3.5 text-amber-400" />
              <span>Promosyon / Hediye Kodu:</span>
            </div>
            <div className="flex items-center gap-2 w-full flex-1">
              <input
                type="text"
                placeholder="Örn: PRO2026"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-xs uppercase font-mono tracking-wider focus:outline-hidden focus:border-amber-400"
              />
              <button
                type="submit"
                disabled={loading || !promoCode.trim()}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs whitespace-nowrap transition-colors cursor-pointer disabled:opacity-50"
              >
                {loading ? '...' : 'Kullan'}
              </button>
            </div>
          </form>

          {message && (
            <div className={`mt-2 text-xs font-bold text-center ${message.isError ? 'text-rose-400' : 'text-emerald-400'}`}>
              {message.text}
            </div>
          )}
        </div>

        {/* Trust Badges */}
        <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            256-Bit SSL Güvenli Altyapı
          </span>
          <span>•</span>
          <span>İstediğiniz An İptal Edebilme</span>
          <span>•</span>
          <span>Anında VIP Tanımlama</span>
        </div>
      </div>
    </div>
  );
};

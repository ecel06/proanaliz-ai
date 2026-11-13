// src/components/ProfileModal.tsx
// Complete, World-Class User & Member Dashboard Modal
import React, { useState } from 'react';
import { 
  X, 
  User as UserIcon, 
  Crown, 
  Phone, 
  Mail, 
  Lock, 
  ShieldCheck, 
  Clock, 
  Sparkles, 
  Gift, 
  CheckCircle2, 
  AlertCircle, 
  LogOut, 
  Send, 
  MessageCircle, 
  Check, 
  KeyRound,
  Layers,
  ChevronRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  User, 
  updateOwnProfileApi, 
  redeemPromoCodeApi, 
  updateUserPreferenceApi 
} from '../utils/authHelper';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUserUpdated: (user: User) => void;
  onOpenVIP: () => void;
  onLogout: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserUpdated,
  onOpenVIP,
  onLogout,
}) => {
  if (!isOpen || !user) return null;

  const [activeTab, setActiveTab] = useState<'overview' | 'edit' | 'promo'>('overview');
  const [name, setName] = useState(user.name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; isError: boolean } | null>(null);

  const showFeedback = (text: string, isError: boolean = false) => {
    setFeedback({ text, isError });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (newPassword && newPassword !== confirmPassword) {
      showFeedback('Yeni şifreleriniz birbiriyle uyuşmuyor.', true);
      return;
    }

    setLoading(true);
    try {
      const res = await updateOwnProfileApi({
        name: name.trim(),
        phone: phone.trim(),
        currentPassword: currentPassword.trim() || undefined,
        newPassword: newPassword.trim() || undefined,
      });

      if (res.success && res.user) {
        onUserUpdated(res.user);
        showFeedback('Profil bilgileriniz başarıyla güncellendi!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setActiveTab('overview');
      } else {
        showFeedback(res.error || 'Profil güncellenemedi.', true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) return;
    setLoading(true);
    try {
      const res = await redeemPromoCodeApi(promoCode.trim().toUpperCase());
      if (res.success && res.user) {
        onUserUpdated(res.user);
        showFeedback(`Tebrikler! ${res.user.vipPlan} üyeliğiniz başarıyla tanımlandı!`);
        setPromoCode('');
      } else {
        showFeedback(res.error || 'Geçersiz veya süresi dolmuş promosyon kodu.', true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPreference = async (pref: 'football' | 'horses' | 'stocks') => {
    const res = await updateUserPreferenceApi(pref);
    if (res.success && res.user) {
      onUserUpdated(res.user);
      showFeedback('Öncelikli ilgi alanınız kaydedildi.');
    }
  };

  // VIP duration calculation
  const now = Date.now();
  const isVip = Boolean(user.isVip && (!user.vipExpiresAt || user.vipExpiresAt > now));
  const daysLeft = user.vipExpiresAt ? Math.max(0, Math.ceil((user.vipExpiresAt - now) / (24 * 3600 * 1000))) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Glow ambient */}
        <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 w-72 h-72 bg-amber-500/15 rounded-full blur-3xl" />

        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-lg ${
              isVip ? 'bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 shadow-amber-500/20' : 'bg-slate-800 text-slate-300'
            }`}>
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">{user.name}</h2>
                {user.role === 'admin' ? (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-black">
                    KURUCU / ADMİN
                  </span>
                ) : isVip ? (
                  <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-black flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-400" />
                    <span>VIP ÜYE</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold">
                    STANDART FREE
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback alert */}
        {feedback && (
          <div className={`mt-3 p-2.5 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-2 ${
            feedback.isError ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
          }`}>
            {feedback.isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-2xl my-3 shrink-0 text-xs font-bold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'overview' ? 'bg-amber-400 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Üyelik &amp; Profil
          </button>
          <button
            onClick={() => setActiveTab('edit')}
            className={`py-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'edit' ? 'bg-amber-400 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Bilgiler &amp; Şifre</span>
          </button>
          <button
            onClick={() => setActiveTab('promo')}
            className={`py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'promo' ? 'bg-amber-400 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Promosyon Kodu
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-3.5 pr-1 text-xs">
            {/* VIP Status Card */}
            <div className={`p-4 rounded-2xl border space-y-2.5 relative overflow-hidden ${
              isVip 
                ? 'bg-gradient-to-br from-amber-500/15 via-slate-900 to-slate-950 border-amber-400/40 shadow-lg shadow-amber-500/10' 
                : 'bg-slate-950/70 border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-xl ${isVip ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                    <Crown className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Abonelik Durumu</div>
                    <div className="text-sm font-black text-white">
                      {isVip ? (user.vipPlan || 'VIP Kulübü Üyeliği') : 'Standart (Ücretsiz) Plan'}
                    </div>
                  </div>
                </div>

                {isVip ? (
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400">Kalan Süre</div>
                    <div className="text-sm font-black text-emerald-400 font-mono">
                      {daysLeft !== null ? `${daysLeft} Gün Kaldı` : 'Sınırsız'}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { onClose(); onOpenVIP(); }}
                    className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 cursor-pointer"
                  >
                    👑 VIP'e Yükselt
                  </button>
                )}
              </div>

              {isVip && (
                <div className="flex items-center justify-between pt-2 border-t border-amber-500/20 text-[11px] text-slate-300">
                  <span>VIP Ayrıcalıkları: Tüm Banko, Sürpriz ve TJK Altılı Robotu 100% Açık</span>
                  <button
                    onClick={() => { onClose(); onOpenVIP(); }}
                    className="text-amber-400 hover:underline font-bold cursor-pointer"
                  >
                    Süreyi Uzat →
                  </button>
                </div>
              )}
            </div>

            {/* User Details Grid */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-xs uppercase tracking-wider">Hesap Özeti</h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('edit')}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <KeyRound className="w-3 h-3" />
                  <span>Şifremi Değiştir</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800/80">
                  <span className="text-slate-500 block">Kayıtlı Telefon:</span>
                  <span className="font-mono text-white font-bold">{user.phone || 'Eklenmemiş'}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800/80">
                  <span className="text-slate-500 block">Giriş Metodu:</span>
                  <span className="font-bold text-white capitalize">{user.authProvider || 'E-Posta'}</span>
                </div>
              </div>
            </div>

            {/* Interest Preference Selector */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider">Öncelikli İlgi Alanınız</h3>
              <p className="text-[11px] text-slate-400">Platforma girdiğinizde ilk açılacak analiz modülünü seçebilirsiniz:</p>
              <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleSelectPreference('football')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer font-bold ${
                    user.preferredInterest === 'football' 
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' 
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  ⚽ Futbol
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreference('horses')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer font-bold ${
                    user.preferredInterest === 'horses' 
                      ? 'bg-amber-400/20 border-amber-400 text-amber-300' 
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  🐎 At Yarışı
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreference('stocks')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer font-bold ${
                    user.preferredInterest === 'stocks' 
                      ? 'bg-blue-500/20 border-blue-500 text-blue-300' 
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  📈 Borsa
                </button>
              </div>
            </div>

            {/* VIP Telegram & WhatsApp Channel shortcuts */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-emerald-950/40 to-slate-900 border border-slate-800 flex items-center justify-between gap-3">
              <div>
                <div className="font-bold text-white text-xs">VIP Topluluk &amp; Bildirimler</div>
                <div className="text-[10px] text-slate-400">Anlık kupon bildirimleri için grubumuza katılın.</div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="https://t.me/proanaliz_vip"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white transition-colors"
                  title="Telegram VIP"
                >
                  <Send className="w-3.5 h-3.5" />
                </a>
                <a
                  href="https://wa.me/905550000000?text=Merhaba%20ProAnaliz%20AI%20VIP%20deste%C4%9Fi%20almak%20istiyorum."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors"
                  title="WhatsApp Destek"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Logout button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => { onClose(); onLogout(); }}
                className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Oturumu Kapat</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: EDIT PROFILE */}
        {activeTab === 'edit' && (
          <form onSubmit={handleUpdateProfile} className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-1 text-xs">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Adınız Soyadınız</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Telefon Numarası (WhatsApp İletişimi)</label>
              <input
                type="tel"
                placeholder="05XX XXX XX XX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-amber-400"
              />
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-2.5">
              <div className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5" />
                <span>Şifre Değiştir</span>
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Mevcut Şifreniz</label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    placeholder="Mevcut şifreniz"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full pl-3 pr-9 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white cursor-pointer"
                  >
                    {showCurrentPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Yeni Şifreniz (En az 6 karakter)</label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    placeholder="Yeni şifreniz"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-3 pr-9 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white cursor-pointer"
                  >
                    {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Yeni Şifre Tekrar</label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    placeholder="Yeni şifrenizi tekrar girin"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-3 pr-9 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white cursor-pointer"
                  >
                    {showConfirmPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black cursor-pointer shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: PROMO CODE REDEEM */}
        {activeTab === 'promo' && (
          <form onSubmit={handleRedeemPromo} className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-1 text-xs">
            <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-500/10 to-slate-950 border border-amber-400/30 text-center space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-300 flex items-center justify-center mx-auto">
                <Gift className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="font-black text-white text-sm">Hediye &amp; Promosyon Kodu Kullan</h3>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Elinizdeki promosyon veya hediye kodunu girerek VIP üyeliğinizi hemen başlatabilir veya mevcut sürenizi uzatabilirsiniz.
              </p>
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Promosyon Kodu</label>
              <input
                type="text"
                required
                placeholder="Örn: PRO2026 veya KRALVIP"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono uppercase text-center font-black tracking-widest text-sm focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !promoCode.trim()}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/25 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Kontrol Ediliyor...' : 'Kodu Tanımla & VIP Aktive Et'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
// src/components/AuthModal.tsx
import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Phone, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Crown, 
  MessageCircle,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { 
  loginUserApi, 
  registerUserApi, 
  googleAuthApi, 
  requestOtpApi, 
  verifyOtpApi, 
  User 
} from '../utils/authHelper';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
  initialMode?: 'login' | 'register' | 'otp';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'otp'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // OTP State
  const [otpStep, setOtpStep] = useState<'request' | 'verify'>('request');
  const [otpCode, setOtpCode] = useState('');
  const [otpSentNotice, setOtpSentNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const cleanEmail = email.trim();
      const cleanPass = password.trim();
      const cleanPhone = phone.trim();

      if (mode === 'login') {
        const res = await loginUserApi(cleanEmail, cleanPass);
        if (res.success && res.user) {
          onSuccess(res.user);
          onClose();
        } else {
          setError(res.error || 'Giriş yapılamadı. Bilgilerinizi kontrol ediniz.');
        }
      } else if (mode === 'register') {
        const res = await registerUserApi(name.trim(), cleanEmail, cleanPass, cleanPhone);
        if (res.success && res.user) {
          onSuccess(res.user);
          onClose();
        } else {
          setError(res.error || 'Kayıt işlemi başarısız.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!phone || phone.replace(/[^\d]/g, '').length < 10) {
      setError('Lütfen geçerli bir telefon numarası girin (Örn: 05XX XXX XX XX).');
      return;
    }
    setLoading(true);
    try {
      const res = await requestOtpApi(phone);
      if (res.success) {
        setOtpStep('verify');
        if (res.code) {
          setOtpCode(res.code);
          setOtpSentNotice(`Doğrulama kodu oluşturuldu: ${res.code}`);
        } else {
          setOtpSentNotice('Doğrulama kodu telefonunuza iletildi.');
        }
      } else {
        setError(res.error || 'Kod gönderilemedi.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!otpCode || otpCode.length < 6) {
      setError('Lütfen 6 haneli doğrulama kodunu girin.');
      return;
    }
    setLoading(true);
    try {
      const res = await verifyOtpApi(phone, otpCode);
      if (res.success && res.user) {
        onSuccess(res.user);
        onClose();
      } else {
        setError(res.error || 'Doğrulama kodu hatalı.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const googleEmail = prompt('Google Hesabınızın E-Posta Adresi:', email || 'kullanici@gmail.com');
      if (!googleEmail || !googleEmail.includes('@')) {
        setLoading(false);
        return;
      }
      const defaultName = googleEmail.split('@')[0].replace(/[._-]/g, ' ');
      const googleName = prompt('Adınız Soyadınız:', name || defaultName) || defaultName;
      const googlePhone = prompt('İletişim / WhatsApp Numaranız (İsteğe Bağlı):', phone || '') || '';

      const res = await googleAuthApi({
        email: googleEmail,
        name: googleName,
        phone: googlePhone,
      });

      if (res.success && res.user) {
        onSuccess(res.user);
        onClose();
      } else {
        setError(res.error || 'Google ile giriş başarısız.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = () => {
    const appleEmail = prompt('Apple ID E-Posta Adresiniz:', 'kullanici@icloud.com');
    if (!appleEmail || !appleEmail.includes('@')) return;
    googleAuthApi({
      email: appleEmail,
      name: appleEmail.split('@')[0],
      phone: phone || ''
    }).then(res => {
      if (res.success && res.user) {
        onSuccess(res.user);
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl overflow-hidden my-auto">
        {/* Glow ambient */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl" />
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 mb-4">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400 mb-0.5">
            <Crown className="w-5 h-5 text-amber-400" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            {mode === 'otp' 
              ? 'Şifresiz Hızlı Giriş' 
              : mode === 'login' 
              ? 'Tekrar Hoş Geldiniz' 
              : 'ProAnaliz AI Ailesine Katılın'}
          </h2>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 text-[10px] font-bold">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Tüm yeni kayıtlara 7 Gün VIP Hediye!</span>
          </div>
        </div>

        {/* 1-Click Social Sign-In (Google & Apple) */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Google</span>
          </button>

          <button
            type="button"
            onClick={handleAppleSignIn}
            disabled={loading}
            className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4 fill-white" viewBox="0 0 170 170">
              <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.67-7.81-11.96-14.34-5.78-8.8-10.4-18.72-13.88-29.77-3.48-11.05-5.22-21.94-5.22-32.66 0-14.24 3.48-26.08 10.44-35.53 6.96-9.45 15.65-14.28 26.08-14.49 4.35 0 9.16 1.16 14.42 3.48 5.26 2.32 8.94 3.53 11.04 3.64 1.74 0 5.66-1.32 11.75-3.96 6.09-2.64 11.41-3.85 15.96-3.64 12.06.65 21.62 4.95 28.68 12.92-10.44 6.32-15.55 15.02-15.33 26.11.22 8.8 3.53 16.14 9.92 22.02 6.39 5.88 14.13 9.24 23.23 10.08-2.39 7.28-5.35 14.89-8.88 22.84zM119.22 33.15c0-7.17 2.61-13.91 7.83-20.21 5.22-6.3 11.85-10.54 19.89-12.72.65 7.61-1.63 14.56-6.85 20.87-5.22 6.31-11.85 10.33-19.89 12.06-.33-.65-.65-1.52-.98-2.61z" />
            </svg>
            <span>Apple</span>
          </button>
        </div>

        {/* Tab switch (3 Modes) */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950/80 border border-slate-800 rounded-2xl mb-4 text-xs">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            className={`py-1.5 font-bold rounded-xl transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Giriş Yap
          </button>
          <button
            type="button"
            onClick={() => { setMode('otp'); setError(null); }}
            className={`py-1.5 font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
              mode === 'otp'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageCircle className="w-3 h-3" />
            <span>SMS / OTP</span>
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(null); }}
            className={`py-1.5 font-bold rounded-xl transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Kayıt Ol
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-3.5 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Notice Toast */}
        {otpSentNotice && (
          <div className="mb-3.5 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{otpSentNotice}</span>
          </div>
        )}

        {/* 📱 MODE 1: OTP FAST LOGIN */}
        {mode === 'otp' && (
          <div>
            {otpStep === 'request' ? (
              <form onSubmit={handleRequestOtp} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Cep Telefonu Numaranız
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="tel"
                      required
                      placeholder="05XX XXX XX XX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-xs font-mono focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Telefonunuza 6 haneli tek kullanımlık güvenlik kodu gelecektir. Şifre gerekmez!
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/25 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <span>{loading ? 'Kod Üretiliyor...' : 'Doğrulama Kodu Gönder'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      6 Haneli Güvenlik Kodu
                    </label>
                    <button
                      type="button"
                      onClick={() => setOtpStep('request')}
                      className="text-[10px] text-emerald-400 hover:underline cursor-pointer"
                    >
                      Numarayı Değiştir
                    </button>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full py-2.5 px-4 text-center tracking-widest text-lg font-mono font-black rounded-xl bg-slate-950 border border-emerald-500/50 text-emerald-400 focus:outline-hidden"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/25 cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Doğrulanıyor...' : 'Doğrula & Hızlı Giriş Yap'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* 📧 MODE 2 & 3: EMAIL / PASSWORD LOGIN & REGISTER */}
        {mode !== 'otp' && (
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Adınız Soyadınız
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="Örn: Ahmet Yılmaz"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-xs focus:outline-hidden focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                E-Posta Adresi
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="ornek@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-xs focus:outline-hidden focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Cep Telefonu <span className="text-[10px] text-emerald-400 font-normal lowercase">(VIP WhatsApp bildirimleri için)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="tel"
                    placeholder="05XX XXX XX XX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-xs focus:outline-hidden focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Şifre
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="En az 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-xs focus:outline-hidden focus:border-emerald-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/25 active:scale-[0.98] cursor-pointer mt-2 disabled:opacity-50"
            >
              {loading ? 'İşleniyor...' : mode === 'login' ? 'Giriş Yap' : 'Hesap Oluştur'}
            </button>
          </form>
        )}

        {mode === 'login' && (
          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={() => {
                setEmail('admin@proanaliz.ai');
                setPassword('Password123!');
                setError(null);
              }}
              className="text-[11px] text-amber-400 hover:text-amber-300 underline underline-offset-4 cursor-pointer font-bold transition-colors inline-flex items-center gap-1"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Yönetici Bilgilerini Doldur (admin@proanaliz.ai)</span>
            </button>
          </div>
        )}

        {/* Footer info */}
        <div className="mt-4 text-center text-[10px] text-slate-500">
          Giriş yaparak <span className="text-slate-400 underline">Kullanım Koşulları</span> ve <span className="text-slate-400 underline">Gizlilik Politikası</span>'nı kabul etmiş sayılırsınız.
        </div>
      </div>
    </div>
  );
};
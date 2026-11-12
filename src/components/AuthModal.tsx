// src/components/AuthModal.tsx
import React, { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, Sparkles, CheckCircle2, AlertCircle, Eye, EyeOff, Crown } from 'lucide-react';
import { loginUserApi, registerUserApi, User } from '../utils/authHelper';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const cleanEmail = email.trim();
      const cleanPass = password.trim();

      if (mode === 'login') {
        const res = await loginUserApi(cleanEmail, cleanPass);
        if (res.success && res.user) {
          onSuccess(res.user);
          onClose();
        } else {
          setError(res.error || 'Giriş yapılamadı.');
        }
      } else {
        const res = await registerUserApi(name.trim(), cleanEmail, cleanPass);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Glow ambient */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl" />
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400 mb-1">
            <Crown className="w-6 h-6 text-amber-400" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            {mode === 'login' ? 'Tekrar Hoş Geldiniz' : 'ProAnaliz AI Ailesine Katılın'}
          </h2>
          <p className="text-xs text-slate-400">
            {mode === 'login' 
              ? 'Yapay zeka analizlerinize ve kuponlarınıza erişmek için giriş yapın.' 
              : 'Ücretsiz hesabınızı oluşturun, yapay zeka fırsatlarını kaçırmayın.'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950/80 border border-slate-800 rounded-2xl mb-5">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Giriş Yap
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(null); }}
            className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Ücretsiz Kayıt Ol
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
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
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-xs focus:outline-hidden focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
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
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-xs focus:outline-hidden focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
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
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-xs focus:outline-hidden focus:border-emerald-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/25 active:scale-[0.98] cursor-pointer mt-2 disabled:opacity-50"
          >
            {loading ? 'İşleniyor...' : mode === 'login' ? 'Giriş Yap' : 'Hesap Oluştur'}
          </button>
        </form>

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
        <div className="mt-5 text-center text-[11px] text-slate-500">
          Giriş yaparak{' '}
          <span className="text-slate-400 underline">Kullanım Koşulları</span> ve{' '}
          <span className="text-slate-400 underline">Gizlilik Politikası</span>'nı kabul etmiş sayılırsınız.
        </div>
      </div>
    </div>
  );
};

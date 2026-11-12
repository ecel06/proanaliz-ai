// src/components/InstallAppModal.tsx
import React, { useState, useEffect } from 'react';
import { 
  X, 
  Smartphone, 
  Download, 
  QrCode, 
  Copy, 
  Check, 
  Share2, 
  PlusSquare, 
  MoreVertical, 
  Wifi, 
  Zap, 
  ShieldCheck,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt?: any;
  onDirectInstall?: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onDirectInstall
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'android' | 'ios'>('android');
  const [networkUrl, setNetworkUrl] = useState<string>('');
  const [networkIp, setNetworkIp] = useState<string>('');
  const [isLoadingIp, setIsLoadingIp] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    // Detect network IP from server or use live public URL
    const fetchNetworkInfo = async () => {
      const currentOrigin = window.location.origin;
      const hostname = window.location.hostname;
      const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

      // 1. If running on a public domain (e.g. onrender.com or custom domain), use actual public HTTPS URL!
      if (!isLocalhost && hostname) {
        setNetworkIp(hostname);
        setNetworkUrl(currentOrigin);
        setIsLoadingIp(false);
        return;
      }

      // 2. If running locally on development machine, fetch Wi-Fi LAN IP so phones on the same Wi-Fi can connect
      try {
        const res = await fetch('/api/network-info');
        if (res.ok) {
          const data = await res.json();
          if (data.networkUrl && !data.networkUrl.includes('10.') && data.ip !== 'localhost') {
            setNetworkIp(data.ip);
            setNetworkUrl(data.networkUrl);
            setIsLoadingIp(false);
            return;
          }
        }
      } catch (err) {
        // Fallback to current host
      }

      const port = window.location.port ? `:${window.location.port}` : '';
      const fallbackUrl = `${window.location.protocol}//${hostname}${port}`;
      setNetworkIp(hostname);
      setNetworkUrl(fallbackUrl);
      setIsLoadingIp(false);
    };

    fetchNetworkInfo();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!networkUrl) return;
    navigator.clipboard.writeText(networkUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const qrImageUrl = networkUrl 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&format=svg&data=${encodeURIComponent(networkUrl)}`
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl shadow-emerald-950/40 text-slate-100 p-5 sm:p-7 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/60 hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Kapat"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start space-x-3.5 pr-8">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-teal-500/15 to-indigo-500/20 border border-emerald-500/30 text-emerald-400">
            <Smartphone className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Telefona İndir & Kur
              </h2>
              <span className="px-2 py-0.5 text-[11px] font-bold uppercase rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                PWA Mobil
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Google Play ya da App Store'a gerek kalmadan, doğrudan telefonunuza tam ekran uygulama olarak kurun.
            </p>
          </div>
        </div>

        {/* Direct Install Banner (if browser supports beforeinstallprompt) */}
        {deferredPrompt && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-indigo-500/15 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-3 text-left">
              <div className="p-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black">
                <Download className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-emerald-300">Bu Cihaz İçin Kurulum Hazır!</h4>
                <p className="text-xs text-slate-300">1-tıklamayla ana ekranınıza uygulama simgesini ekleyin.</p>
              </div>
            </div>
            <button
              onClick={() => {
                if (onDirectInstall) onDirectInstall();
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
            >
              Hemen Uygulamayı Yükle
            </button>
          </div>
        )}

        {/* QR Code & Wi-Fi Connection Card */}
        <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-slate-200 font-bold text-xs sm:text-sm">
              <Wifi className="w-4 h-4 text-emerald-400" />
              <span>1. Adım: Telefonunuzla Bağlanın</span>
            </div>
            <span className="text-[11px] text-slate-400">Aynı Wi-Fi Ağında Olmalı</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-5">
            {/* QR Code Container */}
            <div className="relative group p-3 bg-white rounded-2xl shadow-xl flex items-center justify-center shrink-0">
              {qrImageUrl ? (
                <img 
                  src={qrImageUrl} 
                  alt="ProAnaliz AI Mobil Erişim QR Kodu" 
                  className="w-36 h-36 sm:w-40 sm:h-40 object-contain rounded-lg"
                  loading="lazy"
                />
              ) : (
                <div className="w-36 h-36 flex items-center justify-center text-slate-600">
                  <QrCode className="w-12 h-12 animate-pulse" />
                </div>
              )}
            </div>

            {/* URL & Connect Info */}
            <div className="flex-1 space-y-3 w-full text-center sm:text-left">
              <p className="text-xs text-slate-300 leading-relaxed">
                Telefonunuzun kamerasını soldaki QR koda tutarak saniyeler içinde bağlanabilir veya aşağıdaki adresi telefon tarayıcınıza yazabilirsiniz:
              </p>

              {/* URL Copy Box */}
              <div className="flex items-center space-x-2 p-1.5 pl-3 rounded-xl bg-slate-900 border border-slate-700/80">
                <span className="text-xs font-mono text-emerald-300 truncate select-all flex-1 text-left">
                  {isLoadingIp ? 'IP adresi tespit ediliyor...' : networkUrl}
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Kopyalandı!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Kopyala</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center justify-center sm:justify-start space-x-1.5">
                <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                <span>Bilgisayarınız ve telefonunuz aynı Wi-Fi ağına bağlı olmalıdır.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Step-by-Step Installation Tabs (Android / iOS) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200">
              2. Adım: Telefonunuzun Ana Ekranına Ekleyin
            </span>
            <div className="flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
              <button
                onClick={() => setActiveTab('android')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'android'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🤖 Android
              </button>
              <button
                onClick={() => setActiveTab('ios')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'ios'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🍏 iPhone / iOS
              </button>
            </div>
          </div>

          {/* Android Guide */}
          {activeTab === 'android' && (
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                  <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[11px]">1</span>
                    <span>Chrome ile Açın</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Telefonunuzda Chrome veya Samsung Internet ile adresi açın.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                  <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[11px]">2</span>
                    <span>Menüye Dokunun</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Sağ üst köşedeki <strong className="text-white">üç nokta (⋮)</strong> simgesine dokunun.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                  <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[11px]">3</span>
                    <span>Uygulamayı Yükle</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    <strong className="text-emerald-300">"Uygulamayı Yükle"</strong> ya da <strong className="text-emerald-300">"Ana Ekrana Ekle"</strong> seçeneğini seçin.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* iOS Guide */}
          {activeTab === 'ios' && (
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                  <div className="flex items-center space-x-2 text-xs font-bold text-indigo-400">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-[11px]">1</span>
                    <span>Safari ile Açın</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    iPhone veya iPad cihazınızda <strong className="text-white">Safari</strong> tarayıcısını kullanın.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                  <div className="flex items-center space-x-2 text-xs font-bold text-indigo-400">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-[11px]">2</span>
                    <span>Paylaş Simgesi</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Alttaki araç çubuğundaki <strong className="text-white">Paylaş (Yukarı Ok ⬆)</strong> simgesine dokunun.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                  <div className="flex items-center space-x-2 text-xs font-bold text-indigo-400">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-[11px]">3</span>
                    <span>Ana Ekrana Ekle</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Aşağı kaydırıp <strong className="text-indigo-300">"Ana Ekrana Ekle"</strong> seçeneğine dokunun ve Ekle'ye basın.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-800/80 text-[11px]">
          <div className="flex items-center space-x-2 text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Tam Ekran Deneyimi</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Işık Hızında Yükleme</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Otomatik Senkron</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Sıfır Mağaza Ücreti</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Anladım, Kapat
          </button>
        </div>
      </div>
    </div>
  );
};


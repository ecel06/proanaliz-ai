// src/components/LiveTVModal.tsx
// Canlı Spor TV & Maç Yayınları Oynatıcısı (Native HLS / HTML5 Video)
// Tıpkı At Yarışı'ndaki TJK TV gibi futbol için TRT Spor, TRT Spor Yıldız, A Spor ve HT Spor resmi canlı yayınlarını sunar.
// Küçük Ekran (PiP / Floating) ve Büyük Ekran (Sinema Modalı) destekler.

import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import {
  Tv,
  X,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  ExternalLink,
  Radio,
  Sparkles,
  RefreshCw,
  Flame,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export interface TVChannel {
  id: string;
  name: string;
  category: string;
  badge: string;
  streamUrl: string;
  fallbackWebUrl: string;
  logoText: string;
  accentColor: string;
  description: string;
}

export const TV_CHANNELS: TVChannel[] = [
  {
    id: 'trtspor',
    name: 'TRT Spor HD',
    category: 'Milli Maçlar & Uluslar Ligi',
    badge: 'RESMİ CANLI',
    streamUrl: 'https://trt.daioncdn.net/trtspor/master.m3u8?app=web&platform=trtspor',
    fallbackWebUrl: 'https://www.trtspor.com.tr/canli-yayin-izle/trt-spor',
    logoText: 'TRT SPOR',
    accentColor: '#10B981', // emerald
    description: 'A Milli Takım, UEFA Uluslar Ligi, Trendyol 1. Lig ve canlı spor bülteni'
  },
  {
    id: 'trtsporyildiz',
    name: 'TRT Spor Yıldız',
    category: 'Uluslararası Sporlar',
    badge: 'CANLI',
    streamUrl: 'https://trt.daioncdn.net/trtspor-yildiz/master.m3u8?app=web&platform=trtspor',
    fallbackWebUrl: 'https://www.trtspor.com.tr/canli-yayin-izle/trt-spor-yildiz',
    logoText: 'TRT YILDIZ',
    accentColor: '#F59E0B', // amber
    description: 'Avrupa şampiyonaları, voleybol, basketbol ve uluslararası karşılaşmalar'
  },
  {
    id: 'aspor',
    name: 'A Spor HD',
    category: 'Ziraat Türkiye Kupası',
    badge: 'CANLI HD',
    streamUrl: 'https://rnttwmjcin.turknet.ercdn.net/lcpmvefbyo/aspor/aspor.m3u8',
    fallbackWebUrl: 'https://www.aspor.com.tr/canli-yayin',
    logoText: 'A SPOR',
    accentColor: '#06B6D4', // cyan
    description: 'Ziraat Türkiye Kupası maçları, maç önü/maç sonu yorumları ve canlı skorlar'
  },
  {
    id: 'htspor',
    name: 'HT Spor HD',
    category: 'Spor Gündemi & Analiz',
    badge: 'CANLI HD',
    streamUrl: 'https://ciner.daioncdn.net/ht-spor/ht-spor.m3u8?app=web',
    fallbackWebUrl: 'https://www.htspor.com/canli-yayin',
    logoText: 'HT SPOR',
    accentColor: '#8B5CF6', // purple
    description: 'Ciner Medya spor kanalı, canlı maç yorumları, anlık istatistikler ve analizler'
  }
];

interface LiveTVModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialChannelId?: string;
}

export const LiveTVModal: React.FC<LiveTVModalProps> = ({
  isOpen,
  onClose,
  initialChannelId = 'trtspor'
}) => {
  const [activeChannelId, setActiveChannelId] = useState<string>(initialChannelId);
  const [isMiniMode, setIsMiniMode] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const currentChannel = TV_CHANNELS.find((c) => c.id === activeChannelId) || TV_CHANNELS[0];

  useEffect(() => {
    if (!isOpen) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    setIsLoading(true);
    setHasError(false);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const streamUrl = `/api/stream-proxy?url=${encodeURIComponent(currentChannel.streamUrl)}`;

    const attemptPlay = () => {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Tarayıcı otomatik sesli başlatmayı engellerse sessizde başlat
          video.muted = true;
          setIsMuted(true);
          video.play().catch(() => {});
        });
      }
    };

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Apple HLS (Safari / iOS)
      video.src = streamUrl;
      attemptPlay();
    } else if (Hls.isSupported()) {
      // Hls.js Engine (Chrome, Firefox, Edge, Android)
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30
      });
      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        attemptPlay();
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              setHasError(true);
              setIsLoading(false);
              break;
          }
        }
      });
    } else {
      video.src = streamUrl;
      attemptPlay();
    }

    const handleLoaded = () => setIsLoading(false);
    const handlePlaying = () => {
      setIsLoading(false);
      setHasError(false);
    };
    const handleWaiting = () => setIsLoading(true);

    video.addEventListener('loadeddata', handleLoaded);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('waiting', handleWaiting);

    return () => {
      video.removeEventListener('loadeddata', handleLoaded);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('waiting', handleWaiting);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [isOpen, activeChannelId, currentChannel.streamUrl]);

  if (!isOpen) return null;

  // 📺 1. Küçük Ekran (Floating Mini Player) Modu
  if (isMiniMode) {
    return (
      <div className="fixed bottom-4 right-4 z-50 w-80 sm:w-96 rounded-2xl bg-slate-950/95 border-2 border-emerald-500/50 shadow-2xl shadow-emerald-500/20 backdrop-blur-xl overflow-hidden animate-in slide-in-from-bottom-5">
        {/* Mini Header */}
        <div className="px-3 py-2 bg-gradient-to-r from-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
            </span>
            <Tv className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-black text-white">{currentChannel.name}</span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsMiniMode(false)}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Büyük Ekrana Geç"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Kapat"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Video Area */}
        <div className="relative aspect-video bg-black flex items-center justify-center">
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            playsInline
            muted={isMuted}
          />
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs">
              <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin mb-1" />
              <span className="text-[11px] text-slate-300 font-bold">Canlı Yayın Bağlanıyor...</span>
            </div>
          )}
          {hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-3 text-center">
              <AlertCircle className="w-6 h-6 text-amber-400 mb-1" />
              <span className="text-[11px] text-slate-300 font-semibold mb-2">Canlı akışa ulaşılamadı</span>
              <a
                href={currentChannel.fallbackWebUrl}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-black text-xs inline-flex items-center space-x-1"
              >
                <span>Resmi Yayında Aç</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>

        {/* Mini Channel Selector */}
        <div className="p-1.5 bg-slate-900/90 flex items-center justify-between gap-1 overflow-x-auto">
          {TV_CHANNELS.map((ch) => (
            <button
              key={ch.id}
              onClick={() => setActiveChannelId(ch.id)}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all shrink-0 cursor-pointer ${
                activeChannelId === ch.id
                  ? 'bg-emerald-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {ch.logoText}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 📺 2. Büyük Ekran (Tam Modal / Sinema Modu)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Modal Top Bar */}
        <div className="px-4 py-3 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center">
              <Tv className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-white text-sm sm:text-base tracking-wide flex items-center gap-1.5">
                  <span>ProAnaliz Canlı Spor &amp; Maç TV</span>
                  <span className="px-2 py-0.5 rounded-md bg-rose-500 text-white font-black text-[9px] uppercase tracking-wider animate-pulse">
                    CANLI YAYIN
                  </span>
                </h3>
              </div>
              <p className="text-[11px] text-slate-400">
                {currentChannel.name} • {currentChannel.category}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
              title={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            <button
              onClick={() => setIsMiniMode(true)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
              title="Kupon Yaparken İzlemeye Devam Et (Küçük Ekran)"
            >
              <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Küçük Ekran</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
              title="Kapat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video Player Main Canvas */}
        <div className="relative aspect-video bg-black flex items-center justify-center shrink-0">
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            playsInline
            controls
            muted={isMuted}
          />

          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs z-10">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mb-2" />
              <span className="text-xs sm:text-sm text-slate-200 font-bold tracking-wide">
                Canlı HD Akış Başlatılıyor...
              </span>
              <span className="text-[11px] text-slate-400 mt-1">{currentChannel.name}</span>
            </div>
          )}

          {hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-4 text-center z-10">
              <AlertCircle className="w-10 h-10 text-amber-400 mb-2" />
              <h4 className="text-white font-bold text-sm mb-1">Doğrudan Akış Başlatılamadı</h4>
              <p className="text-xs text-slate-400 max-w-md mb-3">
                Tarayıcı güvenlik ayarları veya bölgesel yayın kısıtlaması nedeniyle resmi web kanalından kesintisiz izleyebilirsiniz:
              </p>
              <a
                href={currentChannel.fallbackWebUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs inline-flex items-center space-x-1.5 shadow-lg shadow-emerald-500/25 transition-all"
              >
                <span>Resmi {currentChannel.name} Yayınına Git</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>

        {/* Channel Selection & Info Strip */}
        <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 space-y-3">
          {/* Channel Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TV_CHANNELS.map((ch) => {
              const isActive = activeChannelId === ch.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => setActiveChannelId(ch.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                    isActive
                      ? 'bg-slate-900 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                      : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="font-black text-xs"
                      style={{ color: isActive ? ch.accentColor : '#CBD5E1' }}
                    >
                      {ch.name}
                    </span>
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                        isActive
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {ch.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-1">{ch.category}</p>
                </button>
              );
            })}
          </div>

          {/* Active Channel Details & Info */}
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center space-x-2 min-w-0">
              <Radio className="w-3.5 h-3.5 text-emerald-400 shrink-0 animate-pulse" />
              <span className="truncate text-slate-400">
                <strong className="text-white">{currentChannel.name}:</strong> {currentChannel.description}
              </span>
            </div>
            <a
              href={currentChannel.fallbackWebUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold shrink-0 flex items-center space-x-1 ml-2 transition-colors"
            >
              <span className="hidden sm:inline">Resmi Site</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

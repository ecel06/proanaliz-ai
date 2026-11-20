// src/components/LiveTVModal.tsx
// Canlı Spor TV & Maç Yayınları Oynatıcısı (YouTube HD Canlı Akış & Native HLS / Web)
// Tıpkı At Yarışı'ndaki TJK TV gibi futbol için A Spor, HT Spor, TRT Spor ve TJK TV resmi canlı yayınlarını sunar.
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
  AlertCircle,
  Play
} from 'lucide-react';

export interface TVChannel {
  id: string;
  name: string;
  category: string;
  badge: string;
  youtubeId: string;
  streamUrl: string;
  fallbackWebUrl: string;
  logoText: string;
  accentColor: string;
  description: string;
}

export const TV_CHANNELS: TVChannel[] = [
  {
    id: 'aspor',
    name: 'A Spor HD',
    category: 'Ziraat Türkiye Kupası & Uluslar Ligi',
    badge: 'CANLI HD',
    youtubeId: 'DwFLd1Mg0eE',
    streamUrl: 'https://rnttwmjcin.turknet.ercdn.net/lcpmvefbyo/aspor/aspor.m3u8',
    fallbackWebUrl: 'https://www.aspor.com.tr/canli-yayin',
    logoText: 'A SPOR',
    accentColor: '#06B6D4', // cyan
    description: 'Ziraat Türkiye Kupası maçları, canlı maç özetleri, flaş analizler ve skorlar'
  },
  {
    id: 'htspor',
    name: 'HT Spor HD',
    category: 'Süper Lig & Canlı Maç Yorumları',
    badge: 'CANLI HD',
    youtubeId: 'gcWaPe_LBMc',
    streamUrl: 'https://ciner.daioncdn.net/ht-spor/ht-spor.m3u8?app=web',
    fallbackWebUrl: 'https://www.htspor.com/canli-yayin',
    logoText: 'HT SPOR',
    accentColor: '#8B5CF6', // purple
    description: 'Ciner Medya spor kanalı, 7/24 kesintisiz canlı yayın, taktik tahtası ve transferler'
  },
  {
    id: 'trtspor',
    name: 'TRT Spor HD',
    category: 'Milli Maçlar & Uluslar Ligi',
    badge: 'RESMİ CANLI',
    youtubeId: 'hJ6KygUV_F8',
    streamUrl: 'https://trt.daioncdn.net/trtspor/master.m3u8?app=web&platform=trtspor',
    fallbackWebUrl: 'https://www.trtspor.com.tr/canli-yayin-izle/trt-spor',
    logoText: 'TRT SPOR',
    accentColor: '#10B981', // emerald
    description: 'A Milli Takım, UEFA Uluslar Ligi ve Avrupa maç özetleri'
  },
  {
    id: 'sportsdigitale',
    name: 'Sports Digitale',
    category: 'Canlı Maç & Derbi Yorumları',
    badge: 'CANLI HD',
    youtubeId: '-tBXTOmSAYU',
    streamUrl: '',
    fallbackWebUrl: 'https://www.youtube.com/@SportsDigitale',
    logoText: 'DIGITALE',
    accentColor: '#F59E0B', // amber
    description: 'Canlı maç önü ve maç sonu yorumları, taktik tahtası ve futbol analizleri'
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
  initialChannelId = 'aspor'
}) => {
  const [channels, setChannels] = useState<TVChannel[]>(TV_CHANNELS);
  const [activeChannelId, setActiveChannelId] = useState<string>(initialChannelId);
  const [isMiniMode, setIsMiniMode] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [useHls, setUseHls] = useState<boolean>(true);
  const [retryKey, setRetryKey] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Canlı Spor TV kanal akışlarını sunucudan dinamik çek (YouTube ID güncellemeleri için)
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    fetch(`/api/sports-tv/channels${retryKey > 0 ? '?force=1' : ''}`)
      .then((r) => r.json())
      .then((data) => {
        if (isMounted && data && data.success && Array.isArray(data.channels) && data.channels.length > 0) {
          setChannels(data.channels);
        }
      })
      .catch(() => { });
    return () => {
      isMounted = false;
    };
  }, [isOpen, retryKey]);

  const currentChannel = channels.find((c) => c.id === activeChannelId) || channels[0];

  // Kanal değiştiğinde streamUrl varsa doğrudan resmi canlı HLS akışına geç
  useEffect(() => {
    const hasStream = Boolean(currentChannel.streamUrl && currentChannel.streamUrl.trim());
    setUseHls(hasStream);
  }, [activeChannelId, currentChannel.streamUrl]);

  // HLS Modu aktifse Hls.js bağla
  useEffect(() => {
    if (!isOpen || !useHls) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const rawUrl = currentChannel.streamUrl;
    if (!rawUrl) return;

    // Tüm canlı m3u8 akışlarını sunucu proxy'si üzerinden CORS engelsiz çek
    const streamUrl = rawUrl.startsWith('http')
      ? `/api/stream-proxy?url=${encodeURIComponent(rawUrl)}`
      : rawUrl;

    const playVideo = () => {
      video.muted = isMuted;
      video.play().catch(() => {
        // Tarayıcı otomatik oynatma engellerse sessizce başlat
        video.muted = true;
        setIsMuted(true);
        video.play().catch(() => {});
      });
    };

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      playVideo();
    } else if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60
      });
      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        playVideo();
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
              hls.destroy();
              hlsRef.current = null;
              if (currentChannel.youtubeId) {
                setUseHls(false);
              }
              break;
          }
        }
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [isOpen, activeChannelId, useHls, currentChannel.streamUrl, retryKey]);

  if (!isOpen) return null;

  const embedUrl = `https://www.youtube-nocookie.com/embed/${currentChannel.youtubeId}?autoplay=1&mute=${isMuted ? 1 : 0
    }&playsinline=1&rel=0&modestbranding=1`;

  // 📺 1. Küçük Ekran (Floating Mini Player) Modu
  if (isMiniMode) {
    return (
      <div className="fixed bottom-4 right-4 z-50 w-80 sm:w-96 rounded-2xl bg-slate-950/95 border-2 border-emerald-500/60 shadow-2xl shadow-emerald-500/20 backdrop-blur-xl overflow-hidden animate-in slide-in-from-bottom-5">
        {/* Mini Header */}
        <div className="px-3 py-2 bg-gradient-to-r from-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 min-w-0">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
            </span>
            <Tv className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-xs font-black text-white truncate">{currentChannel.name}</span>
          </div>

          <div className="flex items-center space-x-1 shrink-0">
            <button
              onClick={() => setIsMuted((m) => !m)}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
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
          {useHls ? (
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              playsInline
              controls
              autoPlay
              muted={isMuted}
            />
          ) : (
            <iframe
              key={`${currentChannel.id}-${isMuted}-${retryKey}`}
              src={embedUrl}
              title={currentChannel.name}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          )}
        </div>

        {/* Mini Channel Selector */}
        <div className="p-1.5 bg-slate-900/95 flex items-center justify-between gap-1 overflow-x-auto">
          {channels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => setActiveChannelId(ch.id)}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all shrink-0 cursor-pointer ${activeChannelId === ch.id
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
            {/* Stream Mode Switcher (Resmi Canlı TV vs YouTube) */}
            {currentChannel.streamUrl && currentChannel.youtubeId && (
              <button
                onClick={() => setUseHls((h) => !h)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Yayın kaynağını değiştir"
              >
                {useHls ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <span>Resmi Canlı TV (HD)</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                    <span>YouTube Kaydı</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={() => setIsMuted((m) => !m)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
              title={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            <button
              onClick={() => setRetryKey((k) => k + 1)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Yayını Yeniden Başlat"
            >
              <RefreshCw className="w-4 h-4 text-emerald-400" />
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
          {useHls ? (
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              playsInline
              controls
              autoPlay
              muted={isMuted}
            />
          ) : (
            <iframe
              key={`${currentChannel.id}-${isMuted}-${retryKey}`}
              src={embedUrl}
              title={currentChannel.name}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          )}
        </div>

        {/* Channel Selection & Info Strip */}
        <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 space-y-3">
          {/* Channel Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {channels.map((ch) => {
              const isActive = activeChannelId === ch.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => setActiveChannelId(ch.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${isActive
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
                      className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${isActive
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

          {/* Active Channel Details & Direct Link */}
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

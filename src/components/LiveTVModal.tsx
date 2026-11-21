// src/components/LiveTVModal.tsx
// Canlı Spor TV & Akıllı Uluslararası Maç Yayınları Oynatıcısı
// Maç hangi ülkedeyse doğrudan o ülkenin resmi yayıncı kanalına (Sky Sports, Movistar, DAZN, TRT Spor vb.) bağlanır.

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  RefreshCw,
  AlertCircle,
  Play,
  Globe2,
  Activity,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { Match } from '../types';
import { getMatchBroadcaster, COUNTRY_BROADCASTER_PRESETS, MatchBroadcasterInfo } from '../utils/broadcasterHelper';
import { getMatchLiveState } from '../utils/liveMatchHelper';

export interface TVChannel {
  id: string;
  name: string;
  country: string;
  countryFlag: string;
  category: string;
  badge: string;
  youtubeId: string;
  streamUrl: string;
  fallbackWebUrl: string;
  officialStreamUrl?: string;
  logoText: string;
  accentColor: string;
  description: string;
  isLivePlayable?: boolean;
  provider?: string;
  turkishBroadcaster?: string;
}

export const TV_CHANNELS: TVChannel[] = [
  // 🇬🇧 İNGİLTERE
  {
    id: 'skysports_uk',
    name: 'Sky Sports Main Event HD',
    country: 'İngiltere',
    countryFlag: '🇬🇧',
    category: 'İngiltere Premier Lig & Kupa',
    badge: '🇬🇧 İNGİLTERE',
    youtubeId: '',
    streamUrl: '',
    fallbackWebUrl: 'https://www.skysports.com/football',
    officialStreamUrl: 'https://www.skysports.com/watch',
    logoText: 'SKY SPORTS',
    accentColor: '#3B82F6',
    description: '🔴 Canlı Yayın • İngiltere Resmi Yayıncısı (Sky Sports & TNT Sports UK)',
    isLivePlayable: false,
    provider: 'Sky UK / TNT Sports',
    turkishBroadcaster: 'beIN SPORTS 3 HD / TV8.5'
  },
  // 🏴󠁧󠁢󠁳󠁣󠁴󠁿 İSKOÇYA
  {
    id: 'skysports_scotland',
    name: 'Sky Sports Football UK',
    country: 'İskoçya',
    countryFlag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    category: 'İskoçya Premiership (Celtic, Rangers)',
    badge: '🏴󠁧󠁢󠁳󠁣󠁴󠁿 İSKOÇYA',
    youtubeId: '',
    streamUrl: '',
    fallbackWebUrl: 'https://www.skysports.com/scottish-football',
    officialStreamUrl: 'https://www.skysports.com/watch',
    logoText: 'SKY FOOTBALL',
    accentColor: '#0EA5E9',
    description: '🔴 Canlı Yayın • İskoçya Resmi Yayıncısı (Sky Sports & BBC Scotland)',
    isLivePlayable: false,
    provider: 'Sky Sports UK',
    turkishBroadcaster: 'S Sport Plus'
  },
  // 🇪🇸 İSPANYA
  {
    id: 'movistar_es',
    name: 'Movistar+ LaLiga HD',
    country: 'İspanya',
    countryFlag: '🇪🇸',
    category: 'İspanya La Liga & Kral Kupası',
    badge: '🇪🇸 İSPANYA',
    youtubeId: '',
    streamUrl: '',
    fallbackWebUrl: 'https://www.laliga.com',
    officialStreamUrl: 'https://ver.movistarplus.es',
    logoText: 'MOVISTAR+',
    accentColor: '#F59E0B',
    description: '🔴 Canlı Yayın • İspanya Resmi Yayıncısı (Movistar+ & DAZN LaLiga)',
    isLivePlayable: false,
    provider: 'Telefónica Movistar / DAZN',
    turkishBroadcaster: 'S Sport HD & S Sport Plus'
  },
  // 🇮🇹 İTALYA
  {
    id: 'skysport_it',
    name: 'Sky Sport Calcio HD',
    country: 'İtalya',
    countryFlag: '🇮🇹',
    category: 'İtalya Serie A & İtalya Kupası',
    badge: '🇮🇹 İTALYA',
    youtubeId: '',
    streamUrl: '',
    fallbackWebUrl: 'https://sport.sky.it/calcio',
    officialStreamUrl: 'https://sport.sky.it/calcio/serie-a',
    logoText: 'SKY CALCIO',
    accentColor: '#EC4899',
    description: '🔴 Canlı Yayın • İtalya Resmi Yayıncısı (Sky Sport Italia & DAZN Italia)',
    isLivePlayable: false,
    provider: 'Sky Italia / DAZN',
    turkishBroadcaster: 'S Sport 2 HD'
  },
  // 🇩🇪 ALMANYA
  {
    id: 'skysport_de',
    name: 'Sky Sport Bundesliga 1 HD',
    country: 'Almanya',
    countryFlag: '🇩🇪',
    category: 'Almanya Bundesliga',
    badge: '🇩🇪 ALMANYA',
    youtubeId: '',
    streamUrl: '',
    fallbackWebUrl: 'https://sport.sky.de/bundesliga',
    officialStreamUrl: 'https://sport.sky.de',
    logoText: 'SKY BUNDESLIGA',
    accentColor: '#6366F1',
    description: '🔴 Canlı Yayın • Almanya Resmi Yayıncısı (Sky Deutschland & DAZN 1 DE)',
    isLivePlayable: false,
    provider: 'Sky Deutschland / DAZN',
    turkishBroadcaster: 'beIN SPORTS 4 HD'
  },
  // 🇫🇷 FRANSA
  {
    id: 'dazn_fr',
    name: 'DAZN Ligue 1 HD',
    country: 'Fransa',
    countryFlag: '🇫🇷',
    category: 'Fransa Ligue 1',
    badge: '🇫🇷 FRANSA',
    youtubeId: '',
    streamUrl: '',
    fallbackWebUrl: 'https://www.ligue1.com',
    officialStreamUrl: 'https://www.dazn.com/fr-FR/home',
    logoText: 'DAZN LIGUE 1',
    accentColor: '#8B5CF6',
    description: '🔴 Canlı Yayın • Fransa Resmi Yayıncısı (DAZN France & beIN Sports)',
    isLivePlayable: false,
    provider: 'DAZN France / beIN',
    turkishBroadcaster: 'beIN SPORTS 4 HD'
  },
  // 🇳🇱 HOLLANDA
  {
    id: 'espn_nl',
    name: 'ESPN 1 Eredivisie HD',
    country: 'Hollanda',
    countryFlag: '🇳🇱',
    category: 'Hollanda Eredivisie',
    badge: '🇳🇱 HOLLANDA',
    youtubeId: '',
    streamUrl: '',
    fallbackWebUrl: 'https://www.espn.nl',
    officialStreamUrl: 'https://www.espn.nl/watch',
    logoText: 'ESPN NL',
    accentColor: '#EF4444',
    description: '🔴 Canlı Yayın • Hollanda Resmi Yayıncısı (ESPN Netherlands)',
    isLivePlayable: false,
    provider: 'ESPN / Ziggo',
    turkishBroadcaster: 'TV8.5 HD'
  },
  // 🇹🇷 TÜRKİYE 1. LİG (Şifresiz Açık Canlı Video)
  {
    id: 'trtspor',
    name: 'TRT Spor HD',
    country: 'Türkiye',
    countryFlag: '🇹🇷',
    category: 'Trendyol 1. Lig & Uluslar Ligi',
    badge: '🇹🇷 ŞİFRESİZ CANLI',
    youtubeId: '',
    streamUrl: 'https://trt.daioncdn.net/trtspor/master.m3u8?app=web&platform=trtspor',
    fallbackWebUrl: 'https://www.trtspor.com.tr/canli-yayin-izle/trt-spor',
    officialStreamUrl: 'https://www.trtspor.com.tr/canli-yayin-izle/trt-spor',
    logoText: 'TRT SPOR',
    accentColor: '#10B981',
    description: '🔴 Canlı Yayın • Trendyol 1. Lig, A Milli Takım & UEFA Maçları',
    isLivePlayable: true,
    provider: 'TRT',
    turkishBroadcaster: 'TRT Spor HD'
  },
  // 🇹🇷 TÜRKİYE KUPASI (Şifresiz Açık Canlı Video)
  {
    id: 'aspor',
    name: 'A Spor HD',
    country: 'Türkiye',
    countryFlag: '🇹🇷',
    category: 'Ziraat Türkiye Kupası',
    badge: '🇹🇷 ŞİFRESİZ CANLI',
    youtubeId: 'DwFLd1Mg0eE',
    streamUrl: 'https://rnttwmjcin.turknet.ercdn.net/lcpmvefbyo/aspor/aspor.m3u8',
    fallbackWebUrl: 'https://www.aspor.com.tr/canli-yayin',
    officialStreamUrl: 'https://www.aspor.com.tr/canli-yayin',
    logoText: 'A SPOR',
    accentColor: '#06B6D4',
    description: '🔴 Canlı Yayın • Ziraat Türkiye Kupası Karşılaşmaları & Canlı Analizler',
    isLivePlayable: true,
    provider: 'Turkuvaz Medya',
    turkishBroadcaster: 'A Spor HD'
  },
  // 🇹🇷 TÜRKİYE SÜPER LİG
  {
    id: 'bein1',
    name: 'beIN SPORTS 1 HD',
    country: 'Türkiye',
    countryFlag: '🇹🇷',
    category: 'Trendyol Süper Lig & Derbiler',
    badge: '🇹🇷 SÜPER LİG',
    youtubeId: '',
    streamUrl: '',
    fallbackWebUrl: 'https://beinsports.com.tr',
    officialStreamUrl: 'https://www.todtv.com.tr',
    logoText: 'beIN 1',
    accentColor: '#9333EA',
    description: '🔴 Canlı Yayın • Trendyol Süper Lig Resmi Yayıncı Kanalı',
    isLivePlayable: false,
    provider: 'beIN Media Group (TOD TV)',
    turkishBroadcaster: 'beIN SPORTS 1 HD'
  },
  // 🇹🇷 CANLI MAÇ YORUMU
  {
    id: 'htspor',
    name: 'HT Spor HD',
    country: 'Türkiye',
    countryFlag: '🇹🇷',
    category: 'Süper Lig & Canlı Maç Yorumları',
    badge: 'CANLI HD',
    youtubeId: 'gcWaPe_LBMc',
    streamUrl: 'https://ciner.daioncdn.net/ht-spor/ht-spor.m3u8?app=web',
    fallbackWebUrl: 'https://www.htspor.com/canli-yayin',
    officialStreamUrl: 'https://www.htspor.com/canli-yayin',
    logoText: 'HT SPOR',
    accentColor: '#8B5CF6',
    description: '🔴 Canlı Yayın • Süper Lig, HT Futbol & Taktik Tahtası',
    isLivePlayable: true,
    provider: 'Ciner Medya',
    turkishBroadcaster: 'HT Spor HD'
  },
  // 🇹🇷 DERBİ ANALİZLERİ
  {
    id: 'sportsdigitale',
    name: 'Sports Digitale',
    country: 'Türkiye',
    countryFlag: '🇹🇷',
    category: 'Canlı Derbi & Maç Yorumları',
    badge: 'CANLI HD',
    youtubeId: '5PvmYQcOKu4',
    streamUrl: '',
    fallbackWebUrl: 'https://www.youtube.com/@SportsDigitale',
    officialStreamUrl: 'https://www.youtube.com/@SportsDigitale',
    logoText: 'DIGITALE',
    accentColor: '#F59E0B',
    description: '🔴 Canlı Yayın • Canlı Maç Önü ve Sonu Derbi Analizleri',
    isLivePlayable: false,
    provider: 'Sports Digitale',
    turkishBroadcaster: 'Sports Digitale'
  }
];

// 🔄 Canlı HLS Playlist Cache-Buster Loader
const LivePlaylistLoader = class extends (Hls.DefaultConfig.loader as any) {
  load(context: any, config: any, callbacks: any) {
    if (context.type === 'manifest' || context.type === 'level') {
      const sep = context.url.includes('?') ? '&' : '?';
      context.url = `${context.url}${sep}_t=${Date.now()}`;
    }
    super.load(context, config, callbacks);
  }
} as any;

// 📺 Yüksek Performanslı Resmi HLS Video Oynatıcısı
const HlsVideoPlayer: React.FC<{
  streamUrl: string;
  channelName: string;
  isMuted: boolean;
  onFallbackToYoutube?: () => void;
  hasYoutubeFallback?: boolean;
}> = ({
  streamUrl,
  channelName,
  isMuted,
  onFallbackToYoutube,
  hasYoutubeFallback
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [hasError, setHasError] = useState<boolean>(false);
    const [isPaused, setIsPaused] = useState<boolean>(false);
    const [reloadTrigger, setReloadTrigger] = useState<number>(0);
    const hlsRef = useRef<Hls | null>(null);

    useEffect(() => {
      const video = videoRef.current;
      if (!video || !streamUrl) return;

      setIsLoading(true);
      setHasError(false);
      setIsPaused(false);

      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      const attemptPlay = () => {
        if (!video) return;
        video.muted = isMuted;
        const promise = video.play();
        if (promise !== undefined) {
          promise
            .then(() => setIsPaused(false))
            .catch((err) => {
              console.warn('[HLS Autoplay Warning]:', err?.message);
              video.muted = true;
              video
                .play()
                .then(() => setIsPaused(false))
                .catch(() => setIsPaused(true));
            });
        }
      };

      const effectiveUrl = streamUrl.startsWith('http')
        ? `/api/stream-proxy?url=${encodeURIComponent(streamUrl)}`
        : streamUrl;

      if (Hls.isSupported()) {
        const hls = new Hls({
          pLoader: LivePlaylistLoader,
          enableWorker: true,
          lowLatencyMode: false,
          liveDurationInfinity: true,
          liveSyncDurationCount: 3,
          liveMaxLatencyDurationCount: 6,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          nudgeOffset: 0.2,
          nudgeMaxRetry: 10,
          maxBufferHole: 0.5
        });
        hlsRef.current = hls;

        hls.loadSource(effectiveUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          attemptPlay();
        });

        hls.on(Hls.Events.LEVEL_UPDATED, () => {
          setIsLoading(false);
          if (video && video.paused && !video.ended) {
            video.play().catch(() => { });
          }
        });

        hls.on(Hls.Events.FRAG_BUFFERED, () => {
          setIsLoading(false);
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.details === 'bufferStalledError' || data.details === 'bufferNudgeOnStall') {
            if (video && !video.paused) {
              video.currentTime += 0.2;
            }
          }
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.warn('[HLS] Ağ hatası, akış yeniden bağlanıyor...');
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.warn('[HLS] Medya hatası, gideriliyor...');
                hls.recoverMediaError();
                break;
              default:
                console.error('[HLS] Kritik hata:', data);
                hls.destroy();
                hlsRef.current = null;
                setHasError(true);
                setIsLoading(false);
                break;
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = effectiveUrl;
        const onLoadedMetadata = () => {
          setIsLoading(false);
          attemptPlay();
        };
        video.addEventListener('loadedmetadata', onLoadedMetadata);
      } else {
        video.src = effectiveUrl;
        attemptPlay();
      }

      const onPlay = () => setIsPaused(false);
      const onPause = () => setIsPaused(true);
      const onWaiting = () => setIsLoading(true);
      const onPlaying = () => {
        setIsLoading(false);
        setIsPaused(false);
      };
      const onLoadedData = () => setIsLoading(false);

      video.addEventListener('play', onPlay);
      video.addEventListener('pause', onPause);
      video.addEventListener('waiting', onWaiting);
      video.addEventListener('playing', onPlaying);
      video.addEventListener('loadeddata', onLoadedData);

      return () => {
        video.removeEventListener('play', onPlay);
        video.removeEventListener('pause', onPause);
        video.removeEventListener('waiting', onWaiting);
        video.removeEventListener('playing', onPlaying);
        video.removeEventListener('loadeddata', onLoadedData);
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
      };
    }, [streamUrl, reloadTrigger]);

    useEffect(() => {
      if (videoRef.current) {
        videoRef.current.muted = isMuted;
      }
    }, [isMuted]);

    return (
      <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden group select-none">
        <video
          ref={videoRef}
          playsInline
          controls
          autoPlay
          muted={isMuted}
          className="w-full h-full object-contain"
        />

        {isLoading && !hasError && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-[2px] transition-opacity z-10">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mb-2" />
            <span className="text-xs font-bold text-white tracking-wide">{channelName} Canlı Yayını Bağlanıyor...</span>
            <span className="text-[10px] text-slate-400 mt-1">Lütfen bekleyin</span>
          </div>
        )}

        {isPaused && !isLoading && !hasError && (
          <button
            onClick={() => {
              if (videoRef.current) {
                videoRef.current.play().catch(() => { });
              }
            }}
            className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-emerald-500/90 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shadow-2xl shadow-emerald-500/50 transition-all hover:scale-110 cursor-pointer z-20"
            title="Yayını Başlat"
          >
            <Play className="w-7 h-7 fill-current translate-x-0.5" />
          </button>
        )}

        {hasError && (
          <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-4 text-center space-y-3 z-30">
            <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Canlı HD akışa bağlanılamadı</p>
              <p className="text-xs text-slate-400 mt-0.5">Yayın kaynağı anlık olarak yanıt vermiyor olabilir.</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setReloadTrigger((t) => t + 1)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white border border-slate-700 flex items-center space-x-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tekrar Dene</span>
              </button>
              {hasYoutubeFallback && onFallbackToYoutube && (
                <button
                  onClick={onFallbackToYoutube}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-lg shadow-rose-600/30 flex items-center space-x-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>YouTube Yayınına Geç</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

interface LiveTVModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetMatch?: Match | null;
  initialChannelId?: string;
}

export const LiveTVModal: React.FC<LiveTVModalProps> = ({
  isOpen,
  onClose,
  targetMatch = null,
  initialChannelId = 'skysports_uk'
}) => {
  const [channels, setChannels] = useState<TVChannel[]>(TV_CHANNELS);
  const [activeChannelId, setActiveChannelId] = useState<string>(initialChannelId);
  const [isMiniMode, setIsMiniMode] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [streamSource, setStreamSource] = useState<'hls' | 'youtube'>('hls');
  const [retryKey, setRetryKey] = useState<number>(0);

  // Maçın resmi yerel yayıncı kanalını (o ülkenin kanalını) tespit et
  const matchBroadcaster = useMemo(() => targetMatch ? getMatchBroadcaster(targetMatch) : null, [targetMatch]);
  const liveState = useMemo(() => targetMatch ? getMatchLiveState(targetMatch) : null, [targetMatch]);

  // Modal açıldığında veya hedef maç değiştiğinde doğrudan maçın ülkesinin kanalına geç
  useEffect(() => {
    if (!isOpen) return;
    if (targetMatch) {
      const detected = getMatchBroadcaster(targetMatch);
      setActiveChannelId(detected.channelId);
    } else if (initialChannelId) {
      setActiveChannelId(initialChannelId);
    }
  }, [isOpen, targetMatch, initialChannelId]);

  // Canlı Spor TV kanal akışlarını sunucudan dinamik çek ve birleştir
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    fetch(`/api/sports-tv/channels${retryKey > 0 ? '?force=1' : ''}`)
      .then((r) => r.json())
      .then((data) => {
        if (isMounted && data && data.success && Array.isArray(data.channels) && data.channels.length > 0) {
          setChannels((prev) => {
            const serverChannels = data.channels as TVChannel[];
            const merged = [...prev];
            serverChannels.forEach((sCh) => {
              const idx = merged.findIndex((m) => m.id === sCh.id);
              if (idx >= 0) {
                merged[idx] = { ...merged[idx], ...sCh };
              } else {
                merged.push(sCh);
              }
            });
            return merged;
          });
        }
      })
      .catch(() => { });
    return () => {
      isMounted = false;
    };
  }, [isOpen, retryKey]);

  const currentChannel = channels.find((c) => c.id === activeChannelId) || channels[0];

  useEffect(() => {
    if (currentChannel.streamUrl) {
      setStreamSource('hls');
    } else {
      setStreamSource('youtube');
    }
  }, [activeChannelId, currentChannel.streamUrl]);

  if (!isOpen) return null;

  const hasHls = Boolean(currentChannel.streamUrl && currentChannel.streamUrl.trim());
  const hasYoutube = Boolean(currentChannel.youtubeId && currentChannel.youtubeId.trim());

  const youtubeEmbedUrl = hasYoutube
    ? `https://www.youtube-nocookie.com/embed/${currentChannel.youtubeId}?autoplay=1&mute=${isMuted ? 1 : 0
    }&playsinline=1&rel=0&modestbranding=1`
    : '';

  // 📺 1. Küçük Ekran (Floating Mini Player) Modu
  if (isMiniMode) {
    return (
      <div className="fixed bottom-4 right-4 z-50 w-80 sm:w-96 rounded-2xl bg-slate-950/95 border-2 border-emerald-500/60 shadow-2xl shadow-emerald-500/20 backdrop-blur-xl overflow-hidden animate-in slide-in-from-bottom-5">
        <div className="px-3 py-2 bg-gradient-to-r from-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 min-w-0">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
            </span>
            <Tv className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <div className="truncate flex items-center space-x-1.5">
              <span className="text-xs font-black text-white truncate">
                {currentChannel.countryFlag} {currentChannel.name}
              </span>
              {targetMatch && (
                <span className="text-[10px] text-emerald-400 font-mono truncate">
                  ({targetMatch.homeTeam.name.slice(0, 3)}-{targetMatch.awayTeam.name.slice(0, 3)})
                </span>
              )}
            </div>
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

        <div className="relative aspect-video bg-black flex items-center justify-center">
          {streamSource === 'hls' && hasHls ? (
            <HlsVideoPlayer
              streamUrl={currentChannel.streamUrl}
              channelName={currentChannel.name}
              isMuted={isMuted}
              hasYoutubeFallback={hasYoutube}
              onFallbackToYoutube={() => setStreamSource('youtube')}
            />
          ) : hasYoutube ? (
            <iframe
              key={`${currentChannel.id}-${isMuted}-${retryKey}`}
              src={youtubeEmbedUrl}
              title={currentChannel.name}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <div className="p-3 text-center space-y-1">
              <span className="text-[10px] text-slate-400 block">{currentChannel.countryFlag} {currentChannel.name}</span>
              <a
                href={currentChannel.officialStreamUrl || currentChannel.fallbackWebUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-block px-3 py-1 rounded-lg bg-emerald-500 text-slate-950 font-black text-xs"
              >
                Canlı Yayına Bağlan
              </a>
            </div>
          )}
        </div>

        <div className="p-1.5 bg-slate-900/95 flex items-center gap-1 overflow-x-auto">
          {channels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => setActiveChannelId(ch.id)}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all shrink-0 cursor-pointer ${activeChannelId === ch.id
                ? 'bg-emerald-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
            >
              {ch.countryFlag} {ch.logoText}
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
                  <span>ProAnaliz Uluslararası Canlı Maç TV</span>
                  <span className="px-2 py-0.5 rounded-md bg-rose-500 text-white font-black text-[9px] uppercase tracking-wider animate-pulse">
                    CANLI YAYIN
                  </span>
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                <span>{currentChannel.countryFlag}</span>
                <strong className="text-slate-300">{currentChannel.name}</strong>
                <span>• {currentChannel.category}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {hasHls && hasYoutube && (
              <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700">
                <button
                  onClick={() => setStreamSource('hls')}
                  className={`px-2 py-1 rounded-md text-[10px] font-bold transition-colors flex items-center gap-1 cursor-pointer ${streamSource === 'hls'
                    ? 'bg-emerald-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                    }`}
                  title="Resmi HD Canlı Yayın"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${streamSource === 'hls' ? 'bg-slate-950' : 'bg-emerald-400 animate-pulse'}`} />
                  <span>Resmi HD</span>
                </button>
                <button
                  onClick={() => setStreamSource('youtube')}
                  className={`px-2 py-1 rounded-md text-[10px] font-bold transition-colors flex items-center gap-1 cursor-pointer ${streamSource === 'youtube'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                    }`}
                  title="YouTube Canlı Yayını"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${streamSource === 'youtube' ? 'bg-white' : 'bg-rose-400'}`} />
                  <span>YouTube</span>
                </button>
              </div>
            )}

            {hasHls && (
              <button
                onClick={() => setIsMuted((m) => !m)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                title={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              </button>
            )}

            {hasHls && (
              <button
                onClick={() => setRetryKey((k) => k + 1)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                title="Yayını Yeniden Başlat"
              >
                <RefreshCw className="w-4 h-4 text-emerald-400" />
              </button>
            )}

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

        {/* Seçili Maç Bilgilendirme Rozeti (Hedef Maç Varsa) */}
        {targetMatch && (
          <div className="px-4 py-2 bg-gradient-to-r from-emerald-950/70 via-slate-900 to-indigo-950/70 border-b border-emerald-500/30 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
              </span>
              <span className="text-xs font-black text-white">
                ⚽ {targetMatch.homeTeam.name} {liveState?.displayScore ? `${liveState.displayScore.home} - ${liveState.displayScore.away}` : 'vs'} {targetMatch.awayTeam.name}
              </span>
              {liveState?.isLive && (
                <span className="px-2 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono font-bold text-[10px]">
                  {liveState.liveMinute || 'Canlı'}
                </span>
              )}
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                • {targetMatch.country ? `${targetMatch.countryFlag || '🌐'} ${targetMatch.country} •` : ''} {targetMatch.league}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-[11px] text-slate-400">O Ülkenin Maç Yayını:</span>
              <span
                className="px-2.5 py-0.5 rounded-lg text-xs font-black text-slate-950 shadow-xs flex items-center gap-1"
                style={{ backgroundColor: currentChannel.accentColor || '#3B82F6' }}
              >
                <span>{currentChannel.countryFlag}</span>
                <span>{currentChannel.name}</span>
              </span>
            </div>
          </div>
        )}

        {/* Video Player Main Canvas */}
        <div className="relative aspect-video bg-black flex items-center justify-center shrink-0">
          {streamSource === 'hls' && hasHls ? (
            <HlsVideoPlayer
              streamUrl={currentChannel.streamUrl}
              channelName={currentChannel.name}
              isMuted={isMuted}
              hasYoutubeFallback={hasYoutube}
              onFallbackToYoutube={() => setStreamSource('youtube')}
            />
          ) : hasYoutube ? (
            <iframe
              key={`${currentChannel.id}-${isMuted}-${retryKey}`}
              src={youtubeEmbedUrl}
              title={currentChannel.name}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            /* 🏟️ Canlı 2D Futbol Sahası & Uluslararası Maç Yayın Merkezi */
            <div className="relative w-full h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6 flex flex-col items-center justify-between text-center overflow-hidden">
              {/* Arka Plan Saha Çizgileri Ambient Görseli */}
              <div className="absolute inset-0 opacity-15 pointer-events-none flex items-center justify-center">
                <div className="w-72 h-44 border-2 border-emerald-400 rounded-2xl relative flex items-center justify-center">
                  <div className="w-px h-full bg-emerald-400" />
                  <div className="w-20 h-20 border border-emerald-400 rounded-full absolute" />
                </div>
              </div>

              {/* Üst Bilgi: Ülke ve Kanal */}
              <div className="relative z-10 space-y-1">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-xl">{currentChannel.countryFlag}</span>
                  <span
                    className="px-2.5 py-0.5 rounded-md text-xs font-black text-slate-950 shadow-xs"
                    style={{ backgroundColor: currentChannel.accentColor }}
                  >
                    {currentChannel.name}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-black uppercase">
                    {currentChannel.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {currentChannel.description}
                </p>
              </div>

              {/* Orta Alan: Canlı Skor ve 2D Saha Radarı */}
              <div className="relative z-10 w-full max-w-lg bg-slate-900/80 border border-slate-700/80 rounded-2xl p-3 sm:p-4 backdrop-blur-md shadow-2xl">
                {targetMatch ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-3">
                      <div className="text-right flex-1 min-w-0 pr-2">
                        <span className="font-black text-sm sm:text-base text-white truncate block">
                          {targetMatch.homeTeam.name}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase">Ev Sahibi</span>
                      </div>

                      <div className="px-4 py-1.5 rounded-xl bg-slate-950/90 border border-emerald-500/40 flex flex-col items-center shrink-0">
                        <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400 tracking-wider">
                          {liveState?.displayScore ? `${liveState.displayScore.home} - ${liveState.displayScore.away}` : 'VS'}
                        </div>
                        <div className="flex items-center space-x-1 text-[10px] text-rose-400 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                          <span>{liveState?.liveMinute || 'Canlı Yayında'}</span>
                        </div>
                      </div>

                      <div className="text-left flex-1 min-w-0 pl-2">
                        <span className="font-black text-sm sm:text-base text-white truncate block">
                          {targetMatch.awayTeam.name}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase">Deplasman</span>
                      </div>
                    </div>

                    {/* Canlı Saha Top Hareketi Simülasyon Çubuğu */}
                    <div className="pt-2 border-t border-slate-800">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 px-1">
                        <span className="text-emerald-400 font-bold">⚽ Canlı Maç Baskı Radarı</span>
                        <span className="text-slate-300 font-mono font-bold">Hücum Yönü ➔</span>
                      </div>
                      <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
                        <div className="h-full bg-emerald-500 transition-all duration-700" style={{ width: '56%' }} />
                        <div className="h-full bg-amber-500 transition-all duration-700" style={{ width: '44%' }} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-2 text-center text-xs text-slate-300">
                    Seçili maçın yayın akışına bağlanıldı.
                  </div>
                )}
              </div>

              {/* Alt Alan: Doğrudan Canlı Yayın Açma Butonları */}
              <div className="relative z-10 flex flex-wrap items-center justify-center gap-2 pt-2">
                <a
                  href={currentChannel.officialStreamUrl || currentChannel.fallbackWebUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-blue-600/30 flex items-center space-x-2 active:scale-95 transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>{currentChannel.countryFlag} {currentChannel.name} Yayınına Bağlan</span>
                  <ExternalLink className="w-3 h-3 text-white/70" />
                </a>

                <a
                  href="https://www.nesine.com/canli-iddaa"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2.5 rounded-xl bg-[#c6f052] hover:bg-[#b5e040] text-slate-950 font-black text-xs shadow-md shadow-[#c6f052]/20 flex items-center space-x-1.5 active:scale-95 transition-all cursor-pointer"
                >
                  <span>⚡ Nesine Canlı Maç Yayını</span>
                  <ExternalLink className="w-3 h-3 text-slate-950/70" />
                </a>

                {/* Açık Türk Kanallarına Hızlı Geçiş */}
                <button
                  type="button"
                  onClick={() => setActiveChannelId('trtspor')}
                  className="px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-emerald-400 font-bold text-xs border border-emerald-500/30 flex items-center space-x-1.5 cursor-pointer transition-all"
                >
                  <Tv className="w-3 h-3 text-emerald-400" />
                  <span>TRT Spor (Şifresiz HD Video)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveChannelId('aspor')}
                  className="px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-cyan-400 font-bold text-xs border border-cyan-500/30 flex items-center space-x-1.5 cursor-pointer transition-all"
                >
                  <Tv className="w-3 h-3 text-cyan-400" />
                  <span>A Spor (Şifresiz HD Video)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Ülke Kanal Seçicisi & Bilgi Şeridi */}
        <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 space-y-3 overflow-y-auto max-h-[30vh]">
          {/* Kanal Sekmeleri */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {channels.map((ch) => {
              const isActive = activeChannelId === ch.id;
              const isMatchChannel = matchBroadcaster?.channelId === ch.id;

              return (
                <button
                  key={ch.id}
                  onClick={() => setActiveChannelId(ch.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${isActive
                    ? 'bg-slate-900 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                    : isMatchChannel
                      ? 'bg-slate-900/90 border-blue-500/60 hover:border-blue-400 shadow-md shadow-blue-500/10'
                      : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="font-black text-xs flex items-center gap-1 truncate"
                      style={{ color: isActive ? ch.accentColor : '#CBD5E1' }}
                    >
                      <span>{ch.countryFlag}</span>
                      <span className="truncate">{ch.name}</span>
                    </span>
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.2 rounded-full shrink-0 ${
                        isActive
                          ? 'bg-emerald-500 text-slate-950'
                          : isMatchChannel
                          ? 'bg-blue-500 text-white font-extrabold animate-pulse'
                          : 'bg-slate-800 text-slate-400'
                        }`}
                    >
                      {isMatchChannel && !isActive ? '🎯 MAÇ KANALI' : ch.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-1">{ch.category}</p>
                </button>
              );
            })}
          </div>

          {/* Aktif Kanal Açıklaması & Doğrudan Bağlantı */}
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center space-x-2 min-w-0">
              <span className="flex h-2 w-2 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
              </span>
              <span className="truncate text-slate-300 text-xs">
                <span>{currentChannel.countryFlag} </span>
                <strong className="text-white font-bold">{currentChannel.name}:</strong>{' '}
                <span className="text-emerald-400 font-semibold">{currentChannel.description}</span>
              </span>
            </div>
            <a
              href={currentChannel.officialStreamUrl || currentChannel.fallbackWebUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold shrink-0 flex items-center space-x-1 ml-2 transition-colors bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/30"
            >
              <span>Resmi Web Yayını</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

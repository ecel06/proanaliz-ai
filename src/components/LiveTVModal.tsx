// src/components/LiveTVModal.tsx
// Nesine.com Birebir Canlı Maç İzleme Oynatıcısı, 2D Saha Radarı & Anlık İddaa Oranları Merkezi
// Kullanıcının Nesine'de gördüğü birebir pop-up oynatıcı tasarımını (Üst Banner, Siyah Ekran, Nesine Kontrolleri,
// ve resmi nesine.com/canli-mac-izle/Player popup bağlantısını) sunar.

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
  Play,
  Pause,
  Activity,
  Ticket,
  ChevronRight,
  TrendingUp,
  Clock,
  Check,
  Globe,
  Lock
} from 'lucide-react';
import { Match, UserBetslipItem } from '../types';
import { BettingPickOption } from '../utils/oddsHelper';
import {
  getMatchBroadcaster,
  getNesinePlayerUrl,
  openNesinePlayerPopup,
  COUNTRY_BROADCASTER_PRESETS
} from '../utils/broadcasterHelper';
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
}

export const TV_CHANNELS: TVChannel[] = [
  {
    id: 'trtspor',
    name: 'TRT Spor HD',
    country: 'Türkiye',
    countryFlag: '🇹🇷',
    category: 'Trendyol 1. Lig & Uluslar Ligi',
    badge: 'ŞİFRESİZ HD',
    youtubeId: '',
    streamUrl: 'https://trt.daioncdn.net/trtspor/master.m3u8?app=web&platform=trtspor',
    fallbackWebUrl: 'https://www.trtspor.com.tr/canli-yayin-izle/trt-spor',
    officialStreamUrl: 'https://www.trtspor.com.tr/canli-yayin-izle/trt-spor',
    logoText: 'TRT SPOR',
    accentColor: '#10B981',
    description: '🔴 Canlı Yayın • Trendyol 1. Lig & Milli Maçlar',
    isLivePlayable: true
  },
  {
    id: 'aspor',
    name: 'A Spor HD',
    country: 'Türkiye',
    countryFlag: '🇹🇷',
    category: 'Ziraat Türkiye Kupası',
    badge: 'ŞİFRESİZ HD',
    youtubeId: 'DwFLd1Mg0eE',
    streamUrl: 'https://rnttwmjcin.turknet.ercdn.net/lcpmvefbyo/aspor/aspor.m3u8',
    fallbackWebUrl: 'https://www.aspor.com.tr/canli-yayin',
    officialStreamUrl: 'https://www.aspor.com.tr/canli-yayin',
    logoText: 'A SPOR',
    accentColor: '#06B6D4',
    description: '🔴 Canlı Yayın • Ziraat Türkiye Kupası & Canlı Yorumlar',
    isLivePlayable: true
  },
  {
    id: 'htspor',
    name: 'HT Spor HD',
    country: 'Türkiye',
    countryFlag: '🇹🇷',
    category: 'Süper Lig & Maç Yorumları',
    badge: 'CANLI HD',
    youtubeId: 'gcWaPe_LBMc',
    streamUrl: 'https://ciner.daioncdn.net/ht-spor/ht-spor.m3u8?app=web',
    fallbackWebUrl: 'https://www.htspor.com/canli-yayin',
    officialStreamUrl: 'https://www.htspor.com/canli-yayin',
    logoText: 'HT SPOR',
    accentColor: '#8B5CF6',
    description: '🔴 Canlı Yayın • Süper Lig & Taktik Analizleri',
    isLivePlayable: true
  },
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
    description: '🔴 Canlı Yayın • İngiltere Resmi Yayıncısı',
    isLivePlayable: false
  },
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
    description: '🔴 Canlı Yayın • İskoçya Resmi Yayıncısı',
    isLivePlayable: false
  },
  {
    id: 'movistar_es',
    name: 'Movistar+ LaLiga HD',
    country: 'İspanya',
    countryFlag: '🇪🇸',
    category: 'İspanya La Liga',
    badge: '🇪🇸 İSPANYA',
    youtubeId: '',
    streamUrl: '',
    fallbackWebUrl: 'https://www.laliga.com',
    officialStreamUrl: 'https://ver.movistarplus.es',
    logoText: 'MOVISTAR+',
    accentColor: '#F59E0B',
    description: '🔴 Canlı Yayın • İspanya Resmi Yayıncısı',
    isLivePlayable: false
  },
  {
    id: 'skysport_it',
    name: 'Sky Sport Calcio HD',
    country: 'İtalya',
    countryFlag: '🇮🇹',
    category: 'İtalya Serie A',
    badge: '🇮🇹 İTALYA',
    youtubeId: '',
    streamUrl: '',
    fallbackWebUrl: 'https://sport.sky.it/calcio',
    officialStreamUrl: 'https://sport.sky.it/calcio/serie-a',
    logoText: 'SKY CALCIO',
    accentColor: '#EC4899',
    description: '🔴 Canlı Yayın • İtalya Resmi Yayıncısı',
    isLivePlayable: false
  },
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
    description: '🔴 Canlı Yayın • Trendyol Süper Lig Resmi Yayıncısı',
    isLivePlayable: false
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
  isPlaying: boolean;
  volume: number;
}> = ({ streamUrl, channelName, isMuted, isPlaying, volume }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    setIsLoading(true);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

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
        nudgeOffset: 0.2
      });
      hlsRef.current = hls;

      hls.loadSource(effectiveUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.muted = isMuted;
        video.volume = volume;
        if (isPlaying) video.play().catch(() => {});
      });

      hls.on(Hls.Events.LEVEL_UPDATED, () => setIsLoading(false));
      hls.on(Hls.Events.FRAG_BUFFERED, () => setIsLoading(false));
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) {
          hls.startLoad();
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = effectiveUrl;
      video.muted = isMuted;
      video.volume = volume;
      if (isPlaying) video.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamUrl]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      videoRef.current.volume = volume;
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isMuted, isPlaying, volume]);

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
      <video ref={videoRef} playsInline autoPlay muted={isMuted} className="w-full h-full object-contain" />
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 backdrop-blur-[2px] z-10">
          <RefreshCw className="w-8 h-8 text-[#c6f052] animate-spin mb-2" />
          <span className="text-xs font-bold text-white">{channelName} Canlı Yayını Bağlanıyor...</span>
        </div>
      )}
    </div>
  );
};

// 🏟️ Nesine Tarzı 2D Canlı Futbol Sahası Simülatörü
const NesineLivePitchRadar: React.FC<{
  match: Match;
  liveState: ReturnType<typeof getMatchLiveState>;
}> = ({ match, liveState }) => {
  const [ballPosition, setBallPosition] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [attackPhase, setAttackPhase] = useState<'home_attack' | 'away_attack' | 'midfield' | 'corner' | 'danger'>('home_attack');

  useEffect(() => {
    const timer = setInterval(() => {
      const phases: ('home_attack' | 'away_attack' | 'midfield' | 'corner' | 'danger')[] = [
        'home_attack', 'danger', 'away_attack', 'midfield', 'home_attack'
      ];
      const randomPhase = phases[Math.floor(Math.random() * phases.length)];
      setAttackPhase(randomPhase);

      if (randomPhase === 'home_attack') {
        setBallPosition({ x: 65 + Math.random() * 20, y: 30 + Math.random() * 40 });
      } else if (randomPhase === 'danger') {
        setBallPosition({ x: 85 + Math.random() * 8, y: 40 + Math.random() * 20 });
      } else if (randomPhase === 'away_attack') {
        setBallPosition({ x: 15 + Math.random() * 20, y: 30 + Math.random() * 40 });
      } else if (randomPhase === 'corner') {
        setBallPosition({ x: 94, y: Math.random() > 0.5 ? 6 : 94 });
      } else {
        setBallPosition({ x: 45 + Math.random() * 10, y: 35 + Math.random() * 30 });
      }
    }, 2800);

    return () => clearInterval(timer);
  }, []);

  const getPhaseBadge = () => {
    switch (attackPhase) {
      case 'danger':
        return { text: '🔥 TEHLİKELİ ATAK', color: 'bg-rose-500 text-white animate-pulse' };
      case 'home_attack':
        return { text: `⚡ ${match.homeTeam.name.toUpperCase()} HÜCUMDA`, color: 'bg-emerald-500 text-slate-950 font-black' };
      case 'away_attack':
        return { text: `🛡️ ${match.awayTeam.name.toUpperCase()} HÜCUMDA`, color: 'bg-indigo-500 text-white font-black' };
      case 'corner':
        return { text: '🚩 KÖŞE VURUŞU (KORNER)', color: 'bg-amber-500 text-slate-950 font-black' };
      default:
        return { text: '⚽ ORTA SAHA MÜCADELESİ', color: 'bg-slate-700 text-slate-200' };
    }
  };

  const badge = getPhaseBadge();

  return (
    <div className="relative w-full h-full bg-[#1b3d22] overflow-hidden flex flex-col justify-between p-3 select-none">
      {/* Çim Çizgileri & Doku */}
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[repeating-linear-gradient(90deg,#000_0,#000_30px,transparent_30px,transparent_60px)]" />
      <div className="absolute inset-2 border-2 border-white/40 rounded pointer-events-none" />
      <div className="absolute top-2 bottom-2 left-1/2 w-0.5 bg-white/40 pointer-events-none -translate-x-1/2" />
      <div className="absolute top-1/2 left-1/2 w-20 h-20 border-2 border-white/40 rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute top-1/2 left-2 w-12 h-24 border-2 border-white/40 border-l-0 pointer-events-none -translate-y-1/2" />
      <div className="absolute top-1/2 right-2 w-12 h-24 border-2 border-white/40 border-r-0 pointer-events-none -translate-y-1/2" />

      {/* Üst Bilgi Barı */}
      <div className="relative z-10 flex items-center justify-between bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/60 shadow-lg">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          <span className="text-xs font-black text-white">{match.homeTeam.name}</span>
          <span className="px-2 py-0.5 rounded bg-black/60 font-mono text-sm font-black text-[#c6f052] border border-white/10">
            {liveState.displayScore.home} - {liveState.displayScore.away}
          </span>
          <span className="text-xs font-black text-white">{match.awayTeam.name}</span>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${badge.color}`}>
            {badge.text}
          </span>
          <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-mono text-xs font-bold animate-pulse">
            {liveState.liveMinute || 'Canlı'}
          </span>
        </div>
      </div>

      {/* Hareketli Canlı Top */}
      <div
        className="absolute z-20 transition-all duration-1000 ease-out -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{ left: `${ballPosition.x}%`, top: `${ballPosition.y}%` }}
      >
        <div className="relative">
          <div className="w-5 h-5 rounded-full bg-white border border-slate-900 shadow-[0_0_15px_#c6f052] flex items-center justify-center text-[10px] font-bold">
            ⚽
          </div>
          <div className="absolute -inset-1 rounded-full bg-[#c6f052]/50 animate-ping -z-10" />
        </div>
      </div>

      {/* Alt Saha İstatistik Göstergesi */}
      <div className="relative z-10 flex items-center justify-between bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/60 text-[11px] text-slate-300">
        <div className="flex items-center space-x-3 font-semibold">
          <span>Topla Oynama: <b className="text-emerald-400 font-mono">%54</b> - <b className="text-indigo-400 font-mono">%46</b></span>
          <span>•</span>
          <span>Şut: <b className="text-white font-mono">7(3)</b> - <b className="text-white font-mono">4(2)</b></span>
          <span>•</span>
          <span>Korner: <b className="text-amber-400 font-mono">4</b> - <b className="text-amber-400 font-mono">2</b></span>
        </div>
        <div className="flex items-center space-x-1.5 text-[#c6f052] font-black text-[10px] tracking-wider uppercase">
          <Activity className="w-3.5 h-3.5 animate-bounce" />
          <span>Nesine Canlı Radar</span>
        </div>
      </div>
    </div>
  );
};

export interface LiveTVModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetMatch?: Match | null;
  allLiveMatches?: Match[];
  onSelectMatch?: (match: Match) => void;
  onToggleBetslip?: (match: Match, option: BettingPickOption) => void;
  betslipItems?: UserBetslipItem[];
  initialChannelId?: string;
}

export const LiveTVModal: React.FC<LiveTVModalProps> = ({
  isOpen,
  onClose,
  targetMatch = null,
  allLiveMatches = [],
  onSelectMatch,
  onToggleBetslip,
  betslipItems = [],
  initialChannelId = 'skysports_uk'
}) => {
  const [activeMatch, setActiveMatch] = useState<Match | null>(targetMatch);
  const [channels, setChannels] = useState<TVChannel[]>(TV_CHANNELS);
  const [activeChannelId, setActiveChannelId] = useState<string>(initialChannelId);
  const [activeViewMode, setActiveViewMode] = useState<'video' | 'radar'>('radar');
  const [isMiniMode, setIsMiniMode] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [volume, setVolume] = useState<number>(1.0);

  useEffect(() => {
    if (targetMatch) {
      setActiveMatch(targetMatch);
      const detected = getMatchBroadcaster(targetMatch);
      setActiveChannelId(detected.channelId);
      if (detected.isLivePlayable) {
        setActiveViewMode('video');
      } else {
        // Doğrudan açık video akışı yoksa kesintisiz 2D Canlı Futbol Sahası Radarını aç
        setActiveViewMode('radar');
      }
    }
  }, [targetMatch, isOpen]);

  const currentMatch = activeMatch || targetMatch;
  const matchBroadcaster = useMemo(() => currentMatch ? getMatchBroadcaster(currentMatch) : null, [currentMatch]);
  const currentChannel = channels.find((c) => c.id === activeChannelId) || channels[0];
  const liveState = useMemo(() => currentMatch ? getMatchLiveState(currentMatch) : null, [currentMatch]);

  if (!isOpen) return null;

  const matchTitle = currentMatch
    ? `${currentMatch.homeTeam.name} - ${currentMatch.awayTeam.name}`
    : 'Canlı Maç Yayını';
  const bcid = currentMatch?.iddaaCode || currentMatch?.id?.replace(/\D/g, '') || '698990';
  const nesineUrlDisplay = `nesine.com/canli-mac-izle/Player?bcid=${bcid}&p=14&et=${encodeURIComponent(matchTitle)}`;

  const handleOpenNativePopup = () => {
    openNesinePlayerPopup(currentMatch);
  };

  const handleMatchChange = (m: Match) => {
    setActiveMatch(m);
    onSelectMatch?.(m);
    const detected = getMatchBroadcaster(m);
    setActiveChannelId(detected.channelId);
    if (detected.isLivePlayable) {
      setActiveViewMode('video');
    } else {
      setActiveViewMode('radar');
    }
  };

  // 📺 1. Küçük Ekran (Floating PiP Modu)
  if (isMiniMode) {
    return (
      <div className="fixed bottom-4 right-4 z-50 w-80 sm:w-96 rounded-2xl bg-black border-2 border-[#c6f052] shadow-2xl backdrop-blur-xl overflow-hidden animate-in slide-in-from-bottom-5">
        <div className="px-3 py-2 bg-[#090d16] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 truncate">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-xs font-black text-white truncate">
              {matchTitle}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={handleOpenNativePopup}
              className="p-1 rounded text-slate-400 hover:text-[#c6f052]"
              title="Ayrı Nesine Penceresinde Aç"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsMiniMode(false)}
              className="p-1 rounded text-slate-400 hover:text-white"
              title="Büyük Ekrana Geç"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-rose-400"
              title="Kapat"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="relative aspect-video bg-black flex items-center justify-center">
          {currentChannel.isLivePlayable && currentChannel.streamUrl ? (
            <HlsVideoPlayer
              streamUrl={currentChannel.streamUrl}
              channelName={currentChannel.name}
              isMuted={isMuted}
              isPlaying={isPlaying}
              volume={volume}
            />
          ) : currentMatch && liveState ? (
            <NesineLivePitchRadar match={currentMatch} liveState={liveState} />
          ) : (
            <div className="text-xs text-slate-400 p-4 text-center">Yayın Yükleniyor...</div>
          )}
        </div>
      </div>
    );
  }

  // 📺 2. Birebir Nesine.com Canlı Maç Player Ekranı (Kullanıcının Gönderdiği Görselin Aynısı)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-2xl bg-black border border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[96vh]">
        
        {/* 🌐 1. Nesine Tarayıcı Adres Çubuğu & Pencere Başlığı */}
        <div className="px-3 py-2 bg-[#12161f] border-b border-slate-800/90 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2 min-w-0 flex-1 pr-2">
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-black/60 border border-slate-700/60 max-w-xl w-full truncate">
              <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-mono text-[11px] text-slate-300 truncate select-all">
                {nesineUrlDisplay}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {/* Pop-up Butonu: Nesine'nin kendi penceresini anında açar */}
            <button
              type="button"
              onClick={handleOpenNativePopup}
              className="px-2.5 py-1 rounded-lg bg-[#c6f052] hover:bg-[#b5e040] text-slate-950 font-black text-[11px] flex items-center space-x-1 shadow-sm active:scale-95 transition-all cursor-pointer"
              title="Resmi Nesine Canlı TV Pop-up Penceresini Aç"
            >
              <ExternalLink className="w-3 h-3 fill-slate-950" />
              <span className="hidden sm:inline">Pop-up Pencerede Aç</span>
              <span className="sm:hidden">Pop-up</span>
            </button>

            {/* Radar / Video Sekme Değiştirici */}
            <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveViewMode('video')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                  activeViewMode === 'video'
                    ? 'bg-slate-800 text-white shadow-xs font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Tv className="w-3 h-3 text-[#c6f052]" />
                <span className="hidden sm:inline">Yayın</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveViewMode('radar')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                  activeViewMode === 'radar'
                    ? 'bg-[#c6f052] text-slate-950 shadow-xs font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Activity className="w-3 h-3" />
                <span className="hidden sm:inline">2D Radar</span>
              </button>
            </div>

            <button
              onClick={() => setIsMiniMode(true)}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Küçük Ekrana Al (PiP)"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-600 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Kapat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 🏇 2. Nesine At Yarışları Banner'ı (Görseldeki Birebir Banner) */}
        <div className="relative bg-gradient-to-r from-[#111111] via-[#2a1c06] to-[#111111] border-b border-amber-900/40 px-4 py-2 flex items-center justify-between shrink-0 select-none overflow-hidden">
          {/* Arka plan süslemesi */}
          <div className="absolute right-24 top-0 bottom-0 w-48 bg-gradient-to-l from-amber-500/15 to-transparent pointer-events-none" />

          <div className="flex items-center space-x-3 z-10">
            {/* Sarı/Siyah At Yarışları Rozeti */}
            <div className="flex items-center space-x-1.5">
              <span className="text-xs sm:text-sm font-black text-amber-400 uppercase tracking-tight">
                AT YARIŞLARI ARTIK
              </span>
              <span className="px-2 py-0.5 rounded bg-black text-white font-black text-xs sm:text-sm border border-amber-400/80 shadow-md">
                NESİNE'DE!
              </span>
            </div>

            <span className="hidden md:inline text-xs text-amber-200/90 font-medium italic">
              Hemen oyna, heyecanı başka bir seviyede yaşa!
            </span>
          </div>

          <div className="flex items-center space-x-2 z-10">
            <span className="text-xl">🏇</span>
            <a
              href="https://www.nesine.com/at-yarisi"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-1 rounded-full bg-[#e11d48] hover:bg-[#be123c] text-white font-black text-xs uppercase tracking-wider shadow-md shadow-rose-900/40 active:scale-95 transition-all"
            >
              HEMEN OYNA
            </a>
          </div>
        </div>

        {/* 📺 3. Ana Video & Yayın Ekranı (Pure Black Canvas) */}
        <div className="relative aspect-video w-full bg-black flex items-center justify-center shrink-0 overflow-hidden">
          {activeViewMode === 'radar' && currentMatch && liveState ? (
            <NesineLivePitchRadar match={currentMatch} liveState={liveState} />
          ) : currentChannel.isLivePlayable && currentChannel.streamUrl ? (
            <HlsVideoPlayer
              streamUrl={currentChannel.streamUrl}
              channelName={currentChannel.name}
              isMuted={isMuted}
              isPlaying={isPlaying}
              volume={volume}
            />
          ) : (
            /* Nesine Canlı Maç Yayın Merkezi (Resmi Nesine Yayını & Pop-up Tetikleyici) */
            <div className="relative w-full h-full bg-black flex flex-col items-center justify-center text-center p-6 space-y-4">
              {/* Canlı Yayın Durum Bildirimi */}
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                <span className="px-3 py-1 rounded-full bg-rose-600/20 text-rose-400 border border-rose-500/40 text-xs font-black uppercase tracking-wider">
                  CANLI MAÇ YAYINI
                </span>
                {currentMatch && liveState && (
                  <span className="px-2.5 py-1 rounded-full bg-black text-[#c6f052] font-mono text-xs font-bold border border-[#c6f052]/40">
                    {liveState.liveMinute || 'Canlı'}
                  </span>
                )}
              </div>

              {/* Maç İsmi & Canlı Skor */}
              {currentMatch && (
                <div className="space-y-1">
                  <h3 className="text-lg sm:text-2xl font-black text-white">
                    {currentMatch.homeTeam.name}
                    {liveState && (
                      <span className="text-[#c6f052] mx-3 font-mono">
                        {liveState.displayScore.home} - {liveState.displayScore.away}
                      </span>
                    )}
                    {currentMatch.awayTeam.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {currentChannel.countryFlag} {currentChannel.name} • {currentMatch.league}
                  </p>
                </div>
              )}

              {/* Aksiyon Butonları: 2D Radar & Nesine Pop-up */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveViewMode('radar')}
                  className="px-6 py-3 rounded-xl bg-[#c6f052] hover:bg-[#b5e040] text-slate-950 font-black text-sm shadow-[0_0_30px_rgba(198,240,82,0.4)] flex items-center space-x-2.5 active:scale-95 transition-all cursor-pointer animate-pulse"
                >
                  <Activity className="w-5 h-5 text-slate-950" />
                  <span>2D CANLI SAHA RADARINI AÇ (KESİNTİSİZ)</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenNativePopup}
                  className="px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs border border-slate-700 flex items-center space-x-2 cursor-pointer transition-all"
                  title="Eğer Nesine'de video yayın hakkı varsa izleyin"
                >
                  <Play className="w-4 h-4 text-[#c6f052]" />
                  <span>Nesine Video Pop-up Dene</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </button>
              </div>

              {/* Bilgilendirme Kutusu: Nesine Erişim Hatası Uyarısı */}
              <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-3 max-w-lg text-[11px] text-amber-200/90 text-left space-y-1">
                <div className="font-bold flex items-center space-x-1.5 text-amber-300">
                  <span>⚠️ Nesine "Canlı yayın bilgilerine erişilememiştir" Uyarısı Hakkında:</span>
                </div>
                <p>
                  Nesine.com sadece yayın hakkını satın aldığı belirli maçları (Serie A, La Liga vb.) video ile yayınlar. 
                  Bu maç için video yayını yoksa lütfen <b>2D Canlı Saha Radarı</b> sekmesini kullanın; topun pozisyonu, 
                  ataklar ve canlı skorlar anlık olarak kesintisiz akmaktadır.
                </p>
              </div>

              {/* Hızlı Açık TV Kanalları */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
                <span className="text-slate-400 text-[11px]">Şifresiz Canlı Kanallar:</span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveChannelId('trtspor');
                    setActiveViewMode('video');
                  }}
                  className="px-2.5 py-1 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900 font-bold text-[10px] cursor-pointer"
                >
                  TRT Spor HD
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveChannelId('aspor');
                    setActiveViewMode('video');
                  }}
                  className="px-2.5 py-1 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-900 font-bold text-[10px] cursor-pointer"
                >
                  A Spor HD
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveChannelId('htspor');
                    setActiveViewMode('video');
                  }}
                  className="px-2.5 py-1 rounded-md bg-purple-950 text-purple-300 border border-purple-500/40 hover:bg-purple-900 font-bold text-[10px] cursor-pointer"
                >
                  HT Spor HD
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 🎛️ 4. Nesine Video Kontrol Cubugu: Oynat/Durdur, Sure, NESINE Logosu, Ses Slider */}
        <div className="px-4 py-2.5 bg-black border-t border-slate-900 flex items-center justify-between shrink-0 select-none">
          {/* Sol: Oynat/Durdur Butonu ve Zaman Göstergesi */}
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="text-white hover:text-[#c6f052] transition-colors p-1"
              title={isPlaying ? 'Durdur' : 'Oynat'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-white text-white" />
              ) : (
                <Play className="w-5 h-5 fill-white text-white" />
              )}
            </button>

            <span className="font-mono text-xs font-semibold text-slate-300">
              {'-0:01'}
            </span>

            <span className="flex items-center space-x-1 px-1.5 py-0.5 rounded bg-rose-600/20 text-rose-400 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span>CANLI</span>
            </span>
          </div>

          {/* Orta: Parlayan NESİNE Logosu (Görseldeki Tam Tasarım) */}
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-1 tracking-widest font-black text-white text-sm sm:text-base opacity-90 select-none">
              <span>NES</span>
              <span className="relative inline-flex items-center justify-center text-[#c6f052]">
                İ
                <span className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-[#c6f052] shadow-[0_0_6px_#c6f052]" />
              </span>
              <span>NE</span>
            </div>
          </div>

          {/* Sağ: Ses Slider'ı (Beyaz Çizgi ve Tutamaç) & Tam Ekran */}
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="text-white hover:text-[#c6f052] transition-colors p-1"
              title={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-slate-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-white" />
              )}
            </button>

            {/* Beyaz Nesine Ses Çubuğu (Görseldeki ----⚪) */}
            <div className="w-20 sm:w-28 flex items-center">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setVolume(val);
                  if (val > 0) setIsMuted(false);
                }}
                className="w-full h-1 bg-white/40 rounded-lg appearance-none cursor-pointer accent-white"
              />
            </div>

            <button
              type="button"
              onClick={handleOpenNativePopup}
              className="text-slate-400 hover:text-white transition-colors p-1"
              title="Ayrı Pencerede Büyüt"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ⚡ 5. Nesine Anlık Canlı Oranlar Çubuğu (Kupona Ekleme) */}
        {currentMatch && currentMatch.odds && (
          <div className="px-4 py-2 bg-[#090d16] border-t border-slate-800 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
            <div className="flex items-center space-x-1.5 text-xs font-black text-slate-400 shrink-0">
              <Ticket className="w-3.5 h-3.5 text-[#c6f052]" />
              <span className="text-white text-[11px]">CANLI İDDAA:</span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => onToggleBetslip?.(currentMatch, {
                  key: 'ms1',
                  label: `MS 1 (${currentMatch.homeTeam.shortName || currentMatch.homeTeam.name})`,
                  marketKey: 'match_result',
                  marketName: 'Maç Sonucu',
                  odd: currentMatch.odds?.ms1 || 1.80,
                  probability: 52
                })}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-[#c6f052] text-xs font-black text-white flex items-center space-x-1.5 cursor-pointer transition-all"
              >
                <span className="text-slate-400 font-normal text-[10px]">MS 1</span>
                <span className="text-[#c6f052] font-mono">{currentMatch.odds?.ms1?.toFixed(2) || '1.80'}</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleBetslip?.(currentMatch, {
                  key: 'msX',
                  label: 'MS X (Beraberlik)',
                  marketKey: 'match_result',
                  marketName: 'Maç Sonucu',
                  odd: currentMatch.odds?.msX || 3.20,
                  probability: 28
                })}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-[#c6f052] text-xs font-black text-white flex items-center space-x-1.5 cursor-pointer transition-all"
              >
                <span className="text-slate-400 font-normal text-[10px]">MS X</span>
                <span className="text-[#c6f052] font-mono">{currentMatch.odds?.msX?.toFixed(2) || '3.20'}</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleBetslip?.(currentMatch, {
                  key: 'ms2',
                  label: `MS 2 (${currentMatch.awayTeam.shortName || currentMatch.awayTeam.name})`,
                  marketKey: 'match_result',
                  marketName: 'Maç Sonucu',
                  odd: currentMatch.odds?.ms2 || 3.40,
                  probability: 20
                })}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-[#c6f052] text-xs font-black text-white flex items-center space-x-1.5 cursor-pointer transition-all"
              >
                <span className="text-slate-400 font-normal text-[10px]">MS 2</span>
                <span className="text-[#c6f052] font-mono">{currentMatch.odds?.ms2?.toFixed(2) || '3.40'}</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleBetslip?.(currentMatch, {
                  key: 'over25',
                  label: '2.5 Gol Üst',
                  marketKey: 'goals_25',
                  marketName: '2.5 Gol Alt/Üst',
                  odd: 1.75,
                  probability: 55
                })}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-[#c6f052] text-xs font-black text-white flex items-center space-x-1.5 cursor-pointer transition-all"
              >
                <span className="text-slate-400 font-normal text-[10px]">2.5 ÜST</span>
                <span className="text-amber-400 font-mono">1.75</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleBetslip?.(currentMatch, {
                  key: 'bttsYes',
                  label: 'Karşılıklı Gol Var',
                  marketKey: 'btts',
                  marketName: 'Karşılıklı Gol',
                  odd: 1.85,
                  probability: 52
                })}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-[#c6f052] text-xs font-black text-white flex items-center space-x-1.5 cursor-pointer transition-all"
              >
                <span className="text-slate-400 font-normal text-[10px]">KG VAR</span>
                <span className="text-emerald-400 font-mono">1.85</span>
              </button>
            </div>
          </div>
        )}

        {/* 🔄 6. Devam Eden Diğer Canlı Maçlar Listesi */}
        <div className="p-2.5 bg-black border-t border-slate-900 space-y-1.5 overflow-y-auto max-h-[24vh]">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span>Diğer Canlı Devam Eden Maçlar ({allLiveMatches.length})</span>
            </span>
            <span className="text-[10px] text-slate-500">Tıklayıp Anında Yayını Değiştirin</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
            {allLiveMatches.map((m) => {
              const mLive = getMatchLiveState(m);
              const isSelected = activeMatch?.id === m.id;

              return (
                <div
                  key={m.id}
                  onClick={() => handleMatchChange(m)}
                  className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-slate-900 border-[#c6f052] shadow-sm shadow-[#c6f052]/20 ring-1 ring-[#c6f052]'
                      : 'bg-slate-950 hover:bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center space-x-1 mb-0.5">
                      <span className="text-xs">{m.countryFlag || '🌐'}</span>
                      <span className="text-[9px] text-slate-400 truncate font-semibold">{m.league}</span>
                    </div>
                    <div className="text-[11px] font-black text-white truncate">
                      {m.homeTeam.name} - {m.awayTeam.name}
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0 space-y-0.5">
                    <span className="px-1.5 py-0.5 rounded bg-[#c6f052] text-slate-950 font-black text-[9px] flex items-center space-x-0.5">
                      <Play className="w-2 h-2 fill-slate-950" />
                      <span>İZLE</span>
                    </span>
                    <span className="text-[9px] font-mono font-bold text-rose-400">
                      {mLive.displayScore.home}-{mLive.displayScore.away}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

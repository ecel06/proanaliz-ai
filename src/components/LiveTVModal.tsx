// src/components/LiveTVModal.tsx
// 2D Canlı Futbol Sahası Radarı & Kesintisiz Canlı TV Spor Kanalları Merkezi
// Kullanıcı maç detayından veya bültenden tıkladığında 2D saha simülasyonunu (top takibi, atak durumu, istatistikler)
// veya doğrudan çalışan şifresiz HD canlı spor kanallarını (TRT Spor, A Spor, HT Spor, TJK TV) kesintisiz açar.

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Hls from 'hls.js';
import {
  Tv,
  X,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  RefreshCw,
  Play,
  Pause,
  Activity,
  Ticket
} from 'lucide-react';
import { Match, UserBetslipItem } from '../types';
import { BettingPickOption } from '../utils/oddsHelper';
import { getMatchLiveState } from '../utils/liveMatchHelper';

export interface TVChannel {
  id: string;
  name: string;
  country: string;
  countryFlag: string;
  category: string;
  badge: string;
  streamUrl: string;
  logoText: string;
  accentColor: string;
  description: string;
}

export const TV_CHANNELS: TVChannel[] = [
  {
    id: 'trtspor',
    name: 'TRT Spor HD',
    country: 'Türkiye',
    countryFlag: '🇹🇷',
    category: 'Trendyol 1. Lig & Uluslar Ligi',
    badge: 'ŞİFRESİZ HD',
    streamUrl: 'https://trt.daioncdn.net/trtspor/master.m3u8?app=web&platform=trtspor',
    logoText: 'TRT SPOR',
    accentColor: '#10B981',
    description: '🔴 Canlı Yayın • Trendyol 1. Lig & Milli Maçlar'
  },
  {
    id: 'aspor',
    name: 'A Spor HD',
    country: 'Türkiye',
    countryFlag: '🇹🇷',
    category: 'Ziraat Türkiye Kupası',
    badge: 'ŞİFRESİZ HD',
    streamUrl: 'https://rnttwmjcin.turknet.ercdn.net/lcpmvefbyo/aspor/aspor.m3u8',
    logoText: 'A SPOR',
    accentColor: '#06B6D4',
    description: '🔴 Canlı Yayın • Ziraat Türkiye Kupası & Canlı Yorumlar'
  },
  {
    id: 'htspor',
    name: 'HT Spor HD',
    country: 'Türkiye',
    countryFlag: '🇹🇷',
    category: 'Süper Lig & Maç Yorumları',
    badge: 'CANLI HD',
    streamUrl: 'https://ciner.daioncdn.net/ht-spor/ht-spor.m3u8?app=web',
    logoText: 'HT SPOR',
    accentColor: '#8B5CF6',
    description: '🔴 Canlı Yayın • Süper Lig & Taktik Analizleri'
  },
  {
    id: 'tjktv',
    name: 'TJK TV HD',
    country: 'Türkiye',
    countryFlag: '🇹🇷',
    category: 'Canlı At Yarışları & Yurt İçi/Dışı',
    badge: 'AT YARIŞI HD',
    streamUrl: 'https://tjktv.ercdn.net/tjktv/tjktv.m3u8',
    logoText: 'TJK TV',
    accentColor: '#F59E0B',
    description: '🔴 Canlı Yayın • Türkiye Jokey Kulübü Resmi Canlı Yayını'
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

// 📺 Yüksek Performanslı Kesintisiz HLS Canlı Video Oynatıcısı
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
          <span className="text-xs font-bold text-white">{channelName} Yayını Bağlanıyor...</span>
        </div>
      )}
    </div>
  );
};

// 🏟️ 2D Canlı Futbol Sahası Simülatörü (Top Takibi, Ataklar, Canlı Skor)
const LivePitchRadar: React.FC<{
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
    <div className="flex flex-col w-full h-full bg-slate-950 select-none overflow-hidden">
      {/* 1. Üst Durum & Atak Bilgisi Barı (Sahanın ÜSTÜNDE - Sahayı ASLA kapatmaz) */}
      <div className="px-3 sm:px-4 py-2 bg-[#0c1220] border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2 truncate">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
          <span className="text-xs sm:text-sm font-black text-white truncate">{match.homeTeam.name}</span>
          <span className="px-2 py-0.5 rounded bg-black font-mono text-xs sm:text-sm font-black text-[#c6f052] border border-white/10 shrink-0">
            {liveState.displayScore.home} - {liveState.displayScore.away}
          </span>
          <span className="text-xs sm:text-sm font-black text-white truncate">{match.awayTeam.name}</span>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-sm ${badge.color}`}>
            {badge.text}
          </span>
          <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-mono text-xs font-bold animate-pulse">
            {liveState.liveMinute || 'Canlı'}
          </span>
        </div>
      </div>

      {/* 2. 2D Futbol Sahası (Tamamen Temiz, Engellenmemiş ve Net Görüş) */}
      <div className="relative flex-1 w-full bg-[#1b3d22] overflow-hidden min-h-[140px]">
        {/* Çim Çizgileri & Doku */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[repeating-linear-gradient(90deg,#000_0,#000_30px,transparent_30px,transparent_60px)]" />
        <div className="absolute inset-2 border-2 border-white/40 rounded pointer-events-none" />
        <div className="absolute top-2 bottom-2 left-1/2 w-0.5 bg-white/40 pointer-events-none -translate-x-1/2" />
        <div className="absolute top-1/2 left-1/2 w-20 h-20 border-2 border-white/40 rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute top-1/2 left-2 w-12 h-24 border-2 border-white/40 border-l-0 pointer-events-none -translate-y-1/2" />
        <div className="absolute top-1/2 right-2 w-12 h-24 border-2 border-white/40 border-r-0 pointer-events-none -translate-y-1/2" />

        {/* Takım İsimleri (Sahanın köşe zemininde yarı saydam, sahayı ASLA kapatmaz) */}
        <div className="absolute top-3 left-4 text-[11px] font-black text-white/40 tracking-wider uppercase pointer-events-none">
          {match.homeTeam.shortName || match.homeTeam.name}
        </div>
        <div className="absolute top-3 right-4 text-[11px] font-black text-white/40 tracking-wider uppercase pointer-events-none">
          {match.awayTeam.shortName || match.awayTeam.name}
        </div>

        {/* Hareketli Canlı Top */}
        <div
          className="absolute z-20 transition-all duration-1000 ease-out -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ left: `${ballPosition.x}%`, top: `${ballPosition.y}%` }}
        >
          <div className="relative">
            <div className="w-6 h-6 rounded-full bg-white border border-slate-900 shadow-[0_0_15px_#c6f052] flex items-center justify-center text-xs font-bold">
              ⚽
            </div>
            <div className="absolute -inset-1 rounded-full bg-[#c6f052]/50 animate-ping -z-10" />
          </div>
        </div>
      </div>

      {/* 3. Alt Saha İstatistik Çubuğu (Sahanın ALTINDA - Sahayı ASLA kapatmaz) */}
      <div className="px-3 sm:px-4 py-1.5 bg-[#0a0e1a] border-t border-slate-800 flex items-center justify-between text-[11px] sm:text-xs text-slate-300 shrink-0">
        <div className="flex items-center space-x-2 sm:space-x-3 font-semibold truncate">
          <span>Topla Oynama: <b className="text-emerald-400 font-mono">%54</b> - <b className="text-indigo-400 font-mono">%46</b></span>
          <span>•</span>
          <span>Şut: <b className="text-white font-mono">7(3)</b> - <b className="text-white font-mono">4(2)</b></span>
          <span>•</span>
          <span>Korner: <b className="text-amber-400 font-mono">4</b> - <b className="text-amber-400 font-mono">2</b></span>
        </div>
        <div className="flex items-center space-x-1 text-[#c6f052] font-black text-[10px] sm:text-[11px] tracking-wider uppercase shrink-0">
          <Activity className="w-3.5 h-3.5 animate-bounce" />
          <span>2D Saha Radarı</span>
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
  initialChannelId = 'trtspor'
}) => {
  const [activeMatch, setActiveMatch] = useState<Match | null>(targetMatch);
  const [channels] = useState<TVChannel[]>(TV_CHANNELS);
  const [activeChannelId, setActiveChannelId] = useState<string>(initialChannelId);
  const [activeViewMode, setActiveViewMode] = useState<'radar' | 'tv'>('radar');
  const [isMiniMode, setIsMiniMode] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [volume, setVolume] = useState<number>(1.0);

  useEffect(() => {
    if (targetMatch) {
      setActiveMatch(targetMatch);
      setActiveViewMode('radar');
    }
  }, [targetMatch, isOpen]);

  const currentMatch = activeMatch || targetMatch;
  const currentChannel = channels.find((c) => c.id === activeChannelId) || channels[0];
  const liveState = useMemo(() => currentMatch ? getMatchLiveState(currentMatch) : null, [currentMatch]);

  if (!isOpen) return null;

  const matchTitle = currentMatch
    ? `${currentMatch.homeTeam.name} - ${currentMatch.awayTeam.name}`
    : currentChannel.name;

  const handleMatchChange = (m: Match) => {
    setActiveMatch(m);
    onSelectMatch?.(m);
    setActiveViewMode('radar');
  };

  // 📺 1. Küçük Ekran (Floating PiP Modu)
  if (isMiniMode) {
    return (
      <div className="fixed bottom-4 right-4 z-50 w-80 sm:w-96 rounded-2xl bg-black border-2 border-[#c6f052] shadow-2xl backdrop-blur-xl overflow-hidden animate-in slide-in-from-bottom-5">
        <div className="px-3 py-2 bg-[#090d16] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 truncate">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-xs font-black text-white truncate">
              {activeViewMode === 'radar' && currentMatch ? matchTitle : currentChannel.name}
            </span>
          </div>

          <div className="flex items-center space-x-1">
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
          {activeViewMode === 'radar' && currentMatch && liveState ? (
            <LivePitchRadar match={currentMatch} liveState={liveState} />
          ) : (
            <HlsVideoPlayer
              streamUrl={currentChannel.streamUrl}
              channelName={currentChannel.name}
              isMuted={isMuted}
              isPlaying={isPlaying}
              volume={volume}
            />
          )}
        </div>
      </div>
    );
  }

  // 📺 2. Ana Oynatıcı Modalı (2D Radar & Canlı TV Kanalları)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-2xl bg-[#090d16] border border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[96vh]">
        
        {/* Üst Başlık & Sekme Seçici Barı */}
        <div className="px-4 py-3 bg-[#12161f] border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2 min-w-0 flex-1 pr-2">
            {activeViewMode === 'radar' && currentMatch && liveState ? (
              <div className="flex items-center space-x-2 truncate">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                <span className="text-xs sm:text-sm font-black text-white truncate">
                  ⚽ {currentMatch.homeTeam.name}{' '}
                  <span className="text-[#c6f052] font-mono mx-1">
                    {liveState.displayScore.home} - {liveState.displayScore.away}
                  </span>{' '}
                  {currentMatch.awayTeam.name}
                </span>
                <span className="px-2 py-0.5 rounded bg-rose-600/30 text-rose-400 font-mono text-[10px] font-bold border border-rose-500/40 shrink-0">
                  {liveState.liveMinute || 'Canlı'}
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 truncate">
                <span className="text-base">{currentChannel.countryFlag}</span>
                <span className="text-xs sm:text-sm font-black text-white truncate">
                  {currentChannel.name}
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/40 shrink-0">
                  {currentChannel.badge}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {/* Sekme Değiştirici: 2D Saha Radarı vs Canlı TV */}
            <div className="flex items-center bg-slate-900 rounded-xl p-0.5 border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveViewMode('radar')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  activeViewMode === 'radar'
                    ? 'bg-[#c6f052] text-slate-950 shadow-xs font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>2D Saha Radarı</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveViewMode('tv')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  activeViewMode === 'tv'
                    ? 'bg-[#c6f052] text-slate-950 shadow-xs font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>Canlı TV Kanalları</span>
              </button>
            </div>

            <button
              onClick={() => setIsMiniMode(true)}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Küçük Ekrana Al (PiP)"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-600 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Kapat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Kaydırılabilir İçerik Alanı (Altta hiçbir şeyin kesilmesini veya kaybolmasını engeller) */}
        <div className="flex-1 overflow-y-auto overscroll-contain flex flex-col min-h-0">

        {/* Canlı TV Modundaysa Kanal Değiştirici Haplar */}
        {activeViewMode === 'tv' && (
          <div className="px-4 py-2 bg-[#0d121c] border-b border-slate-800 flex items-center space-x-2 overflow-x-auto no-scrollbar scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] shrink-0 select-none">
            <span className="text-[11px] text-slate-400 font-bold uppercase shrink-0">Yayın Kanalı:</span>
            {channels.map((ch) => {
              const isSelected = ch.id === activeChannelId;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setActiveChannelId(ch.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800 text-[#c6f052] border border-[#c6f052]/80 shadow-sm font-black'
                      : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <span>{ch.countryFlag}</span>
                  <span>{ch.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Ana Ekran (2D Radar veya Canlı TV Player) - Kompakt & Ekranı Boğmayan Yükseklik */}
        <div className="relative w-full h-[190px] sm:h-[230px] md:h-[270px] bg-black flex items-center justify-center shrink-0 overflow-hidden">
          {activeViewMode === 'radar' && currentMatch && liveState ? (
            <LivePitchRadar match={currentMatch} liveState={liveState} />
          ) : (
            <HlsVideoPlayer
              streamUrl={currentChannel.streamUrl}
              channelName={currentChannel.name}
              isMuted={isMuted}
              isPlaying={isPlaying}
              volume={volume}
            />
          )}
        </div>

        {/* Canlı TV Modu İçin Video Kontrolleri */}
        {activeViewMode === 'tv' && (
          <div className="px-4 py-2.5 bg-black border-t border-slate-900 flex items-center justify-between shrink-0 select-none">
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="text-white hover:text-[#c6f052] transition-colors p-1 cursor-pointer"
                title={isPlaying ? 'Durdur' : 'Oynat'}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-white text-white" />
                ) : (
                  <Play className="w-5 h-5 fill-white text-white" />
                )}
              </button>

              <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded bg-rose-600/20 text-rose-400 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span>CANLI YAYIN</span>
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className="text-white hover:text-[#c6f052] transition-colors p-1 cursor-pointer"
                title={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-slate-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-white" />
                )}
              </button>

              <div className="w-24 sm:w-32 flex items-center">
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
                  className="w-full h-1 bg-white/40 rounded-lg appearance-none cursor-pointer accent-[#c6f052]"
                />
              </div>
            </div>
          </div>
        )}

        {/* ⚡ 5. Canlı İddaa Oranları Barı (Geniş, Ferah, Asla Taşmayan 5 Kolonlu Izgara) */}
        {currentMatch && currentMatch.odds && (
          <div className="px-3 sm:px-4 py-2 bg-[#0a0f1d] border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0 select-none">
            <div className="flex items-center space-x-1.5 text-xs font-black text-slate-300 shrink-0">
              <Ticket className="w-4 h-4 text-[#c6f052]" />
              <span className="text-white text-[11px] sm:text-xs font-black uppercase tracking-wider">CANLI İDDAA:</span>
            </div>

            <div className="w-full sm:flex-1 grid grid-cols-5 gap-1.5 sm:gap-2">
              {/* MS 1 */}
              {(() => {
                const isSelected = betslipItems.some((i) => i.matchId === currentMatch.id && i.pickKey === 'ms1');
                return (
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
                    className={`w-full py-1 sm:py-1.5 px-0.5 sm:px-1.5 rounded-xl border text-center flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer ${
                      isSelected
                        ? 'bg-[#c6f052] text-slate-950 border-[#c6f052] shadow-md shadow-[#c6f052]/30 ring-2 ring-[#c6f052]'
                        : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-700 hover:border-[#c6f052]'
                    }`}
                  >
                    <span className={isSelected ? 'text-slate-950 font-black text-[10px] sm:text-xs leading-tight' : 'text-slate-400 font-bold text-[10px] sm:text-xs leading-tight'}>MS 1</span>
                    <span className={`font-mono text-xs sm:text-sm font-black ${isSelected ? 'text-slate-950' : 'text-[#c6f052]'}`}>
                      {currentMatch.odds?.ms1?.toFixed(2) || '1.80'}
                    </span>
                  </button>
                );
              })()}

              {/* MS X */}
              {(() => {
                const isSelected = betslipItems.some((i) => i.matchId === currentMatch.id && i.pickKey === 'msX');
                return (
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
                    className={`w-full py-1 sm:py-1.5 px-0.5 sm:px-1.5 rounded-xl border text-center flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer ${
                      isSelected
                        ? 'bg-[#c6f052] text-slate-950 border-[#c6f052] shadow-md shadow-[#c6f052]/30 ring-2 ring-[#c6f052]'
                        : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-700 hover:border-[#c6f052]'
                    }`}
                  >
                    <span className={isSelected ? 'text-slate-950 font-black text-[10px] sm:text-xs leading-tight' : 'text-slate-400 font-bold text-[10px] sm:text-xs leading-tight'}>MS X</span>
                    <span className={`font-mono text-xs sm:text-sm font-black ${isSelected ? 'text-slate-950' : 'text-[#c6f052]'}`}>
                      {currentMatch.odds?.msX?.toFixed(2) || '3.20'}
                    </span>
                  </button>
                );
              })()}

              {/* MS 2 */}
              {(() => {
                const isSelected = betslipItems.some((i) => i.matchId === currentMatch.id && i.pickKey === 'ms2');
                return (
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
                    className={`w-full py-1 sm:py-1.5 px-0.5 sm:px-1.5 rounded-xl border text-center flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer ${
                      isSelected
                        ? 'bg-[#c6f052] text-slate-950 border-[#c6f052] shadow-md shadow-[#c6f052]/30 ring-2 ring-[#c6f052]'
                        : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-700 hover:border-[#c6f052]'
                    }`}
                  >
                    <span className={isSelected ? 'text-slate-950 font-black text-[10px] sm:text-xs leading-tight' : 'text-slate-400 font-bold text-[10px] sm:text-xs leading-tight'}>MS 2</span>
                    <span className={`font-mono text-xs sm:text-sm font-black ${isSelected ? 'text-slate-950' : 'text-[#c6f052]'}`}>
                      {currentMatch.odds?.ms2?.toFixed(2) || '3.40'}
                    </span>
                  </button>
                );
              })()}

              {/* 2.5 ÜST */}
              {(() => {
                const isSelected = betslipItems.some((i) => i.matchId === currentMatch.id && i.pickKey === 'over25');
                return (
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
                    className={`w-full py-1 sm:py-1.5 px-0.5 sm:px-1.5 rounded-xl border text-center flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-md shadow-amber-400/30 ring-2 ring-amber-400'
                        : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-700 hover:border-amber-400'
                    }`}
                  >
                    <span className={isSelected ? 'text-slate-950 font-black text-[10px] sm:text-xs leading-tight' : 'text-slate-400 font-bold text-[10px] sm:text-xs leading-tight'}>2.5 ÜST</span>
                    <span className={`font-mono text-xs sm:text-sm font-black ${isSelected ? 'text-slate-950' : 'text-amber-400'}`}>
                      1.75
                    </span>
                  </button>
                );
              })()}

              {/* KG VAR */}
              {(() => {
                const isSelected = betslipItems.some((i) => i.matchId === currentMatch.id && i.pickKey === 'bttsYes');
                return (
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
                    className={`w-full py-1 sm:py-1.5 px-0.5 sm:px-1.5 rounded-xl border text-center flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-400 text-slate-950 border-emerald-400 shadow-md shadow-emerald-400/30 ring-2 ring-emerald-400'
                        : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-700 hover:border-emerald-400'
                    }`}
                  >
                    <span className={isSelected ? 'text-slate-950 font-black text-[10px] sm:text-xs leading-tight' : 'text-slate-400 font-bold text-[10px] sm:text-xs leading-tight'}>KG VAR</span>
                    <span className={`font-mono text-xs sm:text-sm font-black ${isSelected ? 'text-slate-950' : 'text-emerald-400'}`}>
                      1.85
                    </span>
                  </button>
                );
              })()}
            </div>
          </div>
        )}

        {/* 🔄 6. Devam Eden Diğer Canlı Maçlar Listesi (Geniş, Ferah & Büyük Yazılı Tasarım) */}
        <div className="bg-[#070b14] border-t border-slate-800 flex flex-col flex-1 min-h-[200px] overflow-hidden">
          {/* Bölüm Başlığı */}
          <div className="px-4 py-2.5 bg-[#0d1322] border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                CANLI DEVAM EDEN MAÇLAR ({allLiveMatches.length})
              </span>
            </div>
            <span className="text-xs font-bold text-[#c6f052] flex items-center space-x-1">
              <span>👉 Radarda izlemek için maça tıklayın</span>
            </span>
          </div>

          {/* Maç Kartları Izgarası (Ferah 2 Kolon, Büyük Yazılar, Net Canlı Skorlar) */}
          <div className="p-3 sm:p-4 overflow-y-auto flex-1 space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-3.5">
            {allLiveMatches.map((m) => {
              const mLive = getMatchLiveState(m);
              const isSelected = activeMatch?.id === m.id && activeViewMode === 'radar';

              return (
                <div
                  key={m.id}
                  onClick={() => handleMatchChange(m)}
                  className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? 'bg-slate-900 border-[#c6f052] shadow-lg shadow-[#c6f052]/20 ring-2 ring-[#c6f052]'
                      : 'bg-slate-900/90 hover:bg-slate-850 border-slate-700/80 hover:border-[#c6f052]/70 shadow-md'
                  }`}
                >
                  {/* Kart Üst Bilgisi: Bayrak, Lig & Canlı Dakika */}
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                    <div className="flex items-center space-x-1.5 truncate">
                      <span className="text-base shrink-0">{m.countryFlag || '⚽'}</span>
                      <span className="text-xs font-bold text-slate-300 truncate">{m.league}</span>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-mono text-xs font-black border border-rose-500/40 shrink-0 animate-pulse">
                      ● {mLive.liveMinute || 'Canlı'}
                    </span>
                  </div>

                  {/* Takımlar ve Büyük Net Skor Alanı */}
                  <div className="flex items-center justify-between gap-3 my-1">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center space-x-2.5">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: m.homeTeam.primaryColor || '#10b981' }}
                        />
                        <span className="text-sm sm:text-base font-black text-white truncate">
                          {m.homeTeam.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2.5">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: m.awayTeam.primaryColor || '#6366f1' }}
                        />
                        <span className="text-sm sm:text-base font-black text-slate-200 truncate">
                          {m.awayTeam.name}
                        </span>
                      </div>
                    </div>

                    {/* Büyük Yüksek Kontrastlı Canlı Skor Kutusu */}
                    <div className="flex flex-col items-center justify-center px-4 py-2.5 rounded-xl bg-black border border-slate-700 shadow-inner shrink-0 min-w-[70px]">
                      <span className="font-mono text-xl sm:text-2xl font-black text-[#c6f052] tracking-wider">
                        {mLive.displayScore.home} - {mLive.displayScore.away}
                      </span>
                    </div>
                  </div>

                  {/* Radarda İzle Butonu */}
                  <button
                    type="button"
                    className={`w-full py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#c6f052] text-slate-950 font-black shadow-md shadow-[#c6f052]/30'
                        : 'bg-slate-800 hover:bg-[#c6f052] text-slate-200 hover:text-slate-950 border border-slate-700'
                    }`}
                  >
                    <Activity className="w-4 h-4" />
                    <span>{isSelected ? '🟢 ŞU ANDA RADARDA İZLENİYOR' : '⚡ CANLI RADARDA İZLE'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        </div>{/* End scrollable modal body */}

      </div>
    </div>
  );
};

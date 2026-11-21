// src/components/LiveTVModal.tsx
// Nesine TV Canlı Maç İzleme, 2D Canlı Saha Radarı & Anlık İddaa Oranları Merkezi
// Kullanıcı maç detayından veya kupondan tıkladığında o maçı Nesine TV tarzında canlı yayın,
// 2D saha simülasyonu, canlı istatistikler ve anlık oranlarla açar.

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
  Activity,
  ShieldCheck,
  Sparkles,
  Ticket,
  ChevronRight,
  TrendingUp,
  Clock,
  Check
} from 'lucide-react';
import { Match, UserBetslipItem } from '../types';
import { BettingPickOption } from '../utils/oddsHelper';
import { getMatchBroadcaster, COUNTRY_BROADCASTER_PRESETS } from '../utils/broadcasterHelper';
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
}> = ({ streamUrl, channelName, isMuted }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    setIsLoading(true);
    setHasError(false);

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
        video.play().catch(() => {});
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
      video.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamUrl]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = isMuted;
  }, [isMuted]);

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
      <video ref={videoRef} playsInline controls autoPlay muted={isMuted} className="w-full h-full object-contain" />
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-[2px] z-10">
          <RefreshCw className="w-8 h-8 text-[#c6f052] animate-spin mb-2" />
          <span className="text-xs font-bold text-white">{channelName} Yayını Bağlanıyor...</span>
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

  // Canlı maç top hareket simülasyonu (Gerçekçi hücum/baskı yönü)
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
        setBallPosition({ x: 20 + Math.random() * 20, y: 30 + Math.random() * 40 });
      } else {
        setBallPosition({ x: 45 + Math.random() * 10, y: 35 + Math.random() * 30 });
      }
    }, 3200);

    return () => clearInterval(timer);
  }, []);

  const phaseLabels: Record<string, { text: string; color: string; badge: string }> = {
    home_attack: { text: `${match.homeTeam.name} Hücumu`, color: '#c6f052', badge: 'TEHLİKELİ ATAK' },
    away_attack: { text: `${match.awayTeam.name} Hücumu`, color: '#38bdf8', badge: 'HÜCUM' },
    danger: { text: `${match.homeTeam.name} Ceza Sahasında!`, color: '#ef4444', badge: 'GOL TEHLİKESİ' },
    midfield: { text: 'Orta Saha Mücadelesi', color: '#94a3b8', badge: 'TOP SAHADA' },
    corner: { text: 'Köşe Vuruşu', color: '#fbbf24', badge: 'KORNER' }
  };

  const currentPhase = phaseLabels[attackPhase] || phaseLabels.home_attack;

  return (
    <div className="relative w-full h-full bg-[#165b33] rounded-2xl p-3 flex flex-col justify-between overflow-hidden shadow-inner border border-emerald-600/40 select-none">
      {/* Çim Dokusu Çizgileri */}
      <div className="absolute inset-0 opacity-20 pointer-events-none flex">
        {[...Array(10)].map((_, i) => (
          <div key={i} className={`flex-1 ${i % 2 === 0 ? 'bg-black/20' : 'bg-white/10'}`} />
        ))}
      </div>

      {/* Futbol Sahası Çizgileri */}
      <div className="absolute inset-3 border-2 border-white/70 rounded-lg pointer-events-none flex items-center justify-center">
        {/* Orta Saha Çizgisi ve Dairesi */}
        <div className="w-px h-full bg-white/70" />
        <div className="w-20 h-20 border-2 border-white/70 rounded-full absolute" />
        <div className="w-2 h-2 bg-white rounded-full absolute" />

        {/* Sol Ceza Sahası */}
        <div className="absolute left-0 w-24 h-40 border-2 border-l-0 border-white/70" />
        <div className="absolute left-0 w-10 h-20 border-2 border-l-0 border-white/70" />

        {/* Sağ Ceza Sahası */}
        <div className="absolute right-0 w-24 h-40 border-2 border-r-0 border-white/70" />
        <div className="absolute right-0 w-10 h-20 border-2 border-r-0 border-white/70" />
      </div>

      {/* Canlı Top Hareketi */}
      <div
        className="absolute w-4 h-4 rounded-full bg-white shadow-xl shadow-white/80 border-2 border-slate-950 transition-all duration-1000 ease-out z-20 flex items-center justify-center"
        style={{ left: `${ballPosition.x}%`, top: `${ballPosition.y}%` }}
      >
        <span className="w-1.5 h-1.5 bg-slate-950 rounded-full" />
      </div>

      {/* Saha Üstü: Takım İsimleri & Canlı Skor */}
      <div className="relative z-10 flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-black text-white">{match.homeTeam.name}</span>
        </div>

        <div className="px-3 py-0.5 rounded-lg bg-slate-900 border border-emerald-500/40 flex items-center space-x-2">
          <span className="text-base font-black font-mono text-[#c6f052]">
            {liveState.displayScore.home} - {liveState.displayScore.away}
          </span>
          <span className="text-[10px] text-rose-400 font-bold font-mono">
            {liveState.liveMinute || 'Canlı'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-black text-white">{match.awayTeam.name}</span>
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
        </div>
      </div>

      {/* Saha Altı: Anlık Olay Rozeti & Canlı Baskı */}
      <div className="relative z-10 flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800">
        <div className="flex items-center space-x-2">
          <span
            className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase text-slate-950"
            style={{ backgroundColor: currentPhase.color }}
          >
            {currentPhase.badge}
          </span>
          <span className="text-xs font-extrabold text-white">{currentPhase.text}</span>
        </div>

        <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-300">
          <span>Topla Oynama: <strong className="text-[#c6f052]">56%</strong> - <strong className="text-cyan-400">44%</strong></span>
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
  const [isMuted, setIsMuted] = useState<boolean>(true);

  // Aktif maç veya ilk açılış güncellendiğinde
  useEffect(() => {
    if (targetMatch) {
      setActiveMatch(targetMatch);
      const detected = getMatchBroadcaster(targetMatch);
      setActiveChannelId(detected.channelId);
      // Eğer kanal şifresiz canlı HLS akışına sahipse (TRT Spor / A Spor) otomatik videoya al, yoksa Nesine 2D radara al
      if (detected.isLivePlayable) {
        setActiveViewMode('video');
      } else {
        setActiveViewMode('radar');
      }
    }
  }, [targetMatch, isOpen]);

  const currentMatch = activeMatch || targetMatch;
  const matchBroadcaster = useMemo(() => currentMatch ? getMatchBroadcaster(currentMatch) : null, [currentMatch]);
  const liveState = useMemo(() => currentMatch ? getMatchLiveState(currentMatch) : null, [currentMatch]);
  const currentChannel = channels.find((c) => c.id === activeChannelId) || channels[0];

  if (!isOpen) return null;

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
      <div className="fixed bottom-4 right-4 z-50 w-80 sm:w-96 rounded-2xl bg-slate-950/95 border-2 border-[#c6f052]/60 shadow-2xl backdrop-blur-xl overflow-hidden animate-in slide-in-from-bottom-5">
        <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 truncate">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-xs font-black text-white truncate">
              {currentMatch ? `${currentMatch.homeTeam.name} - ${currentMatch.awayTeam.name}` : currentChannel.name}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsMiniMode(false)}
              className="p-1 rounded-md text-slate-400 hover:text-white"
              title="Büyük Ekrana Geç"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-rose-400"
              title="Kapat"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="relative aspect-video bg-black flex items-center justify-center">
          {currentChannel.isLivePlayable && currentChannel.streamUrl ? (
            <HlsVideoPlayer streamUrl={currentChannel.streamUrl} channelName={currentChannel.name} isMuted={isMuted} />
          ) : currentMatch && liveState ? (
            <NesineLivePitchRadar match={currentMatch} liveState={liveState} />
          ) : (
            <div className="text-xs text-slate-400 p-4 text-center">Yayın yükleniyor...</div>
          )}
        </div>
      </div>
    );
  }

  // 📺 2. Nesine TV Tam Ekran / Sinema Modalı
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-3xl bg-[#0f172a] border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Nesine Tarzı Üst Başlık Çubuğu */}
        <div className="px-4 py-3 bg-[#090d16] border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="px-2.5 py-1 rounded-lg bg-[#c6f052] text-slate-950 font-black text-xs tracking-wider flex items-center space-x-1.5 shadow-md shadow-[#c6f052]/20">
              <Play className="w-3.5 h-3.5 fill-slate-950" />
              <span>NESİNE CANLI İZLE</span>
            </div>

            {currentMatch && liveState && (
              <div className="flex items-center space-x-2">
                <span className="text-xs sm:text-sm font-black text-white">
                  ⚽ {currentMatch.homeTeam.name} <span className="text-[#c6f052] font-mono">{liveState.displayScore.home} - {liveState.displayScore.away}</span> {currentMatch.awayTeam.name}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 font-mono text-[10px] font-bold border border-rose-500/40">
                  {liveState.liveMinute || 'Canlı'}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Sekme Değiştirici: Canlı Video vs 2D Radar */}
            <div className="flex items-center bg-slate-900 rounded-xl p-0.5 border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveViewMode('radar')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  activeViewMode === 'radar'
                    ? 'bg-[#c6f052] text-slate-950 shadow-sm font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>2D Saha Radarı</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveViewMode('video')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  activeViewMode === 'video'
                    ? 'bg-[#c6f052] text-slate-950 shadow-sm font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>Canlı Yayın TV</span>
              </button>
            </div>

            <button
              onClick={() => setIsMiniMode(true)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Küçük Ekrana Al (Kupon Yaparken İzle)"
            >
              <Minimize2 className="w-4 h-4 text-amber-400" />
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

        {/* Ana Oynatıcı / Radar Alanı */}
        <div className="relative aspect-video bg-black flex items-center justify-center shrink-0">
          {activeViewMode === 'radar' && currentMatch && liveState ? (
            <NesineLivePitchRadar match={currentMatch} liveState={liveState} />
          ) : currentChannel.isLivePlayable && currentChannel.streamUrl ? (
            <HlsVideoPlayer streamUrl={currentChannel.streamUrl} channelName={currentChannel.name} isMuted={isMuted} />
          ) : (
            /* Yabancı Maç Resmi Yayın & Nesine TV Bağlantı İstasyonu */
            <div className="relative w-full h-full bg-gradient-to-br from-slate-950 via-[#0b1329] to-slate-950 p-6 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[#c6f052]/10 border-2 border-[#c6f052] text-[#c6f052] flex items-center justify-center shadow-2xl">
                <Tv className="w-8 h-8" />
              </div>

              <div className="max-w-md space-y-1">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-xl">{currentChannel.countryFlag}</span>
                  <span className="px-2.5 py-0.5 rounded-md bg-[#c6f052] text-slate-950 font-black text-xs">
                    {currentChannel.name}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/40 text-[10px] font-bold">
                    {currentChannel.badge}
                  </span>
                </div>

                {currentMatch && (
                  <p className="text-base font-black text-white">
                    ⚽ {currentMatch.homeTeam.name} - {currentMatch.awayTeam.name}
                  </p>
                )}

                <p className="text-xs text-slate-300">
                  {currentChannel.description}
                </p>
              </div>

              {/* Aksiyon Butonları */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <a
                  href="https://www.nesine.com/canli-iddaa"
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-[#c6f052] hover:bg-[#b5e040] text-slate-950 font-black text-xs shadow-lg shadow-[#c6f052]/20 flex items-center space-x-2 active:scale-95 transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Nesine Canlı Maç Yayınını Aç</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <a
                  href={currentChannel.officialStreamUrl || currentChannel.fallbackWebUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-md shadow-blue-600/20 flex items-center space-x-1.5 active:scale-95 transition-all cursor-pointer"
                >
                  <span>{currentChannel.countryFlag} {currentChannel.name} Resmi Yayını</span>
                  <ExternalLink className="w-3 h-3 text-white/70" />
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setActiveChannelId('trtspor');
                    setActiveViewMode('video');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs border border-emerald-500/30 flex items-center space-x-1.5 cursor-pointer"
                >
                  <Tv className="w-3 h-3" />
                  <span>TRT Spor (Şifresiz HD Video)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Nesine Tarzı Anlık Canlı Oranlar Çubuğu (Kupona Ekle) */}
        {currentMatch && currentMatch.odds && (
          <div className="px-4 py-2.5 bg-[#090d16] border-t border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
            <div className="flex items-center space-x-1.5 text-xs font-black text-slate-400 shrink-0">
              <Ticket className="w-3.5 h-3.5 text-[#c6f052]" />
              <span className="text-white">CANLI ORANLAR:</span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => onToggleBetslip?.(currentMatch, {
                  key: 'ms1',
                  label: 'MS 1',
                  marketKey: 'match_result',
                  marketName: 'Maç Sonucu',
                  odd: currentMatch.odds?.ms1 || 1.80,
                  probability: 52,
                  isOfficial: true
                })}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-[#c6f052] text-xs font-black text-white flex items-center space-x-1.5 cursor-pointer transition-all"
              >
                <span className="text-slate-400 font-normal">MS 1</span>
                <span className="text-[#c6f052] font-mono">{currentMatch.odds.ms1?.toFixed(2) || '1.80'}</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleBetslip?.(currentMatch, {
                  key: 'msX',
                  label: 'MS X',
                  marketKey: 'match_result',
                  marketName: 'Maç Sonucu',
                  odd: currentMatch.odds?.msX || 3.20,
                  probability: 28,
                  isOfficial: true
                })}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-[#c6f052] text-xs font-black text-white flex items-center space-x-1.5 cursor-pointer transition-all"
              >
                <span className="text-slate-400 font-normal">MS X</span>
                <span className="text-[#c6f052] font-mono">{currentMatch.odds.msX?.toFixed(2) || '3.20'}</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleBetslip?.(currentMatch, {
                  key: 'ms2',
                  label: 'MS 2',
                  marketKey: 'match_result',
                  marketName: 'Maç Sonucu',
                  odd: currentMatch.odds?.ms2 || 3.40,
                  probability: 20,
                  isOfficial: true
                })}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-[#c6f052] text-xs font-black text-white flex items-center space-x-1.5 cursor-pointer transition-all"
              >
                <span className="text-slate-400 font-normal">MS 2</span>
                <span className="text-[#c6f052] font-mono">{currentMatch.odds.ms2?.toFixed(2) || '3.40'}</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleBetslip?.(currentMatch, {
                  key: 'over25',
                  label: '2.5 Üst',
                  marketKey: 'goals_25',
                  marketName: '2.5 Gol Alt/Üst',
                  odd: 1.75,
                  probability: 55,
                  isOfficial: true
                })}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-[#c6f052] text-xs font-black text-white flex items-center space-x-1.5 cursor-pointer transition-all"
              >
                <span className="text-slate-400 font-normal">2.5 ÜST</span>
                <span className="text-amber-400 font-mono">1.75</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleBetslip?.(currentMatch, {
                  key: 'bttsYes',
                  label: 'KG Var',
                  marketKey: 'btts',
                  marketName: 'Karşılıklı Gol',
                  odd: 1.85,
                  probability: 52,
                  isOfficial: true
                })}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-[#c6f052] text-xs font-black text-white flex items-center space-x-1.5 cursor-pointer transition-all"
              >
                <span className="text-slate-400 font-normal">KG VAR</span>
                <span className="text-emerald-400 font-mono">1.85</span>
              </button>
            </div>
          </div>
        )}

        {/* Diğer Canlı Maçlar Listesi (Nesine TV Tarzı Anında Maç Değiştirici) */}
        <div className="p-3 bg-slate-950 space-y-2 overflow-y-auto max-h-[32vh]">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>Diğer Canlı Devam Eden Maçlar ({allLiveMatches.length})</span>
            </span>
            <span className="text-[10px] text-slate-500">Tıklayıp Anında Yayını Değiştirin</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {allLiveMatches.map((m) => {
              const mLive = getMatchLiveState(m);
              const isSelected = activeMatch?.id === m.id;
              const broadcaster = getMatchBroadcaster(m);

              return (
                <div
                  key={m.id}
                  onClick={() => handleMatchChange(m)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-slate-900 border-[#c6f052] shadow-md shadow-[#c6f052]/10 ring-1 ring-[#c6f052]'
                      : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center space-x-1.5 mb-1">
                      <span className="text-xs">{m.countryFlag || '🌐'}</span>
                      <span className="text-[10px] text-slate-400 truncate font-semibold">{m.league}</span>
                    </div>
                    <div className="text-xs font-black text-white truncate">
                      {m.homeTeam.name} - {m.awayTeam.name}
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0 space-y-1">
                    <span className="px-2 py-0.5 rounded-md bg-[#c6f052] text-slate-950 font-black text-[10px] flex items-center space-x-1">
                      <Play className="w-2 h-2 fill-slate-950" />
                      <span>İZLE</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold text-rose-400">
                      {mLive.displayScore.home}-{mLive.displayScore.away} ({mLive.liveMinute || 'Canlı'})
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

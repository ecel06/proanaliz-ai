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
  Ticket,
  Clock,
  BarChart3,
  Flame
} from 'lucide-react';
import { Match, UserBetslipItem } from '../types';
import { BettingPickOption } from '../utils/oddsHelper';
import { getMatchLiveState } from '../utils/liveMatchHelper';
import { soundManager } from '../utils/audioHelper';
import { getTeamKit } from '../utils/teamKitHelper';
import { generateMatchTimeline } from '../utils/matchTimelineHelper';

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
    id: 'trt1',
    name: 'TRT 1 HD',
    country: 'Türkiye',
    countryFlag: '🇹🇷',
    category: 'UEFA Avrupa Ligi & Şampiyonlar Ligi',
    badge: 'CANLI MAÇ HD',
    streamUrl: 'https://trt.daioncdn.net/trt-1/master.m3u8?app=web&platform=trt1',
    logoText: 'TRT 1',
    accentColor: '#E11D48',
    description: '🔴 Canlı Yayın • UEFA Avrupa Ligi, Galatasaray & Şampiyonlar Ligi'
  },
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
interface PitchPlayer {
  id: string;
  num: number;
  role: 'GK' | 'DEF' | 'MID' | 'FWD';
  team: 'home' | 'away';
  x: number;
  y: number;
}

const LivePitchRadar: React.FC<{
  match: Match;
  liveState: ReturnType<typeof getMatchLiveState>;
}> = ({ match, liveState }) => {
  const [ballPosition, setBallPosition] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [attackPhase, setAttackPhase] = useState<'home_attack' | 'away_attack' | 'midfield' | 'corner' | 'danger'>('home_attack');
  const [activeCarrierId, setActiveCarrierId] = useState<string>('h10');
  const [isSoundActive, setIsSoundActive] = useState<boolean>(() => soundManager.isEnabled());
  const [bottomTab, setBottomTab] = useState<'stats' | 'timeline'>('stats');

  const toggleSound = () => {
    const next = soundManager.toggle();
    setIsSoundActive(next);
    if (next) soundManager.playRefereeWhistle();
  };

  // 👕 Gerçek Takım Forma Renkleri ve Deplasman Çakışma Önleyici Motoru
  const homeKit = useMemo(
    () => getTeamKit(match.homeTeam.name, false),
    [match.homeTeam.name]
  );
  const awayKit = useMemo(
    () => getTeamKit(match.awayTeam.name, true, homeKit),
    [match.awayTeam.name, homeKit]
  );

  const timelineEvents = useMemo(
    () => generateMatchTimeline(
      match.homeTeam.name,
      match.awayTeam.name,
      liveState.displayScore.home,
      liveState.displayScore.away,
      liveState.isFinished,
      match.id
    ),
    [match.id, match.homeTeam.name, match.awayTeam.name, liveState.displayScore.home, liveState.displayScore.away, liveState.isFinished]
  );

  useEffect(() => {
    if (liveState.isFinished) {
      setAttackPhase('midfield');
      setBallPosition({ x: 50, y: 50 });
      setActiveCarrierId('');
      return;
    }

    const timer = setInterval(() => {
      const phases: ('home_attack' | 'away_attack' | 'midfield' | 'corner' | 'danger')[] = [
        'home_attack', 'danger', 'away_attack', 'midfield', 'home_attack'
      ];
      const randomPhase = phases[Math.floor(Math.random() * phases.length)];
      setAttackPhase(randomPhase);

      if (randomPhase === 'home_attack') {
        const carrier = Math.random() > 0.5 ? 'h9' : 'h10';
        setActiveCarrierId(carrier);
        setBallPosition({ x: 68 + Math.random() * 10, y: 38 + Math.random() * 24 });
      } else if (randomPhase === 'danger') {
        setActiveCarrierId('h9');
        setBallPosition({ x: 86 + Math.random() * 5, y: 46 + Math.random() * 8 });
        if (isSoundActive) soundManager.playRefereeWhistle();
      } else if (randomPhase === 'away_attack') {
        const carrier = Math.random() > 0.5 ? 'a9' : 'a7';
        setActiveCarrierId(carrier);
        setBallPosition({ x: 26 + Math.random() * 12, y: 38 + Math.random() * 24 });
      } else if (randomPhase === 'corner') {
        setActiveCarrierId('h11');
        setBallPosition({ x: 94, y: Math.random() > 0.5 ? 8 : 92 });
      } else {
        const carrier = Math.random() > 0.5 ? 'h8' : 'a10';
        setActiveCarrierId(carrier);
        setBallPosition({ x: 48 + Math.random() * 6, y: 42 + Math.random() * 16 });
      }
    }, 2800);

    return () => clearInterval(timer);
  }, [liveState.isFinished, isSoundActive]);

  const getPhaseBadge = () => {
    if (liveState.isFinished) {
      return { text: '🏁 MAÇ SONUCU (BİTTİ)', color: 'bg-emerald-600 text-white font-black' };
    }
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

  // 11 Ev Sahibi & 11 Deplasman Oyuncusunun Taktiksel Dinamik Konumları
  const players: PitchPlayer[] = useMemo(() => {
    let homeShift = 0;
    let awayShift = 0;

    if (attackPhase === 'home_attack') {
      homeShift = 14;
      awayShift = 10;
    } else if (attackPhase === 'danger') {
      homeShift = 22;
      awayShift = 14;
    } else if (attackPhase === 'away_attack') {
      homeShift = -10;
      awayShift = -16;
    } else if (attackPhase === 'corner') {
      homeShift = 20;
      awayShift = 12;
    }

    const home: PitchPlayer[] = [
      { id: 'h1', num: 1, role: 'GK', team: 'home', x: 5 + Math.min(homeShift * 0.2, 4), y: 50 },
      { id: 'h2', num: 2, role: 'DEF', team: 'home', x: 19 + homeShift * 0.65, y: 82 },
      { id: 'h4', num: 4, role: 'DEF', team: 'home', x: 17 + homeShift * 0.65, y: 62 },
      { id: 'h5', num: 5, role: 'DEF', team: 'home', x: 17 + homeShift * 0.65, y: 38 },
      { id: 'h3', num: 3, role: 'DEF', team: 'home', x: 19 + homeShift * 0.65, y: 18 },
      { id: 'h6', num: 6, role: 'MID', team: 'home', x: 28 + homeShift * 0.8, y: 50 },
      { id: 'h8', num: 8, role: 'MID', team: 'home', x: 37 + homeShift * 0.9, y: 32 },
      { id: 'h10', num: 10, role: 'MID', team: 'home', x: 41 + homeShift * 0.95, y: 68 },
      { id: 'h11', num: 11, role: 'FWD', team: 'home', x: attackPhase === 'corner' ? 94 : 52 + homeShift * 1.05, y: attackPhase === 'corner' ? 8 : 22 },
      { id: 'h7', num: 7, role: 'FWD', team: 'home', x: 52 + homeShift * 1.05, y: 78 },
      { id: 'h9', num: 9, role: 'FWD', team: 'home', x: 56 + homeShift * 1.1, y: 50 },
    ];

    const away: PitchPlayer[] = [
      { id: 'a1', num: 1, role: 'GK', team: 'away', x: 95 + Math.max(awayShift * 0.2, -4), y: 50 },
      { id: 'a2', num: 2, role: 'DEF', team: 'away', x: 81 + awayShift * 0.65, y: 82 },
      { id: 'a4', num: 4, role: 'DEF', team: 'away', x: 83 + awayShift * 0.65, y: 62 },
      { id: 'a5', num: 5, role: 'DEF', team: 'away', x: 83 + awayShift * 0.65, y: 38 },
      { id: 'a3', num: 3, role: 'DEF', team: 'away', x: 81 + awayShift * 0.65, y: 18 },
      { id: 'a6', num: 6, role: 'MID', team: 'away', x: 72 + awayShift * 0.8, y: 50 },
      { id: 'a8', num: 8, role: 'MID', team: 'away', x: 63 + awayShift * 0.9, y: 68 },
      { id: 'a10', num: 10, role: 'MID', team: 'away', x: 59 + awayShift * 0.95, y: 32 },
      { id: 'a7', num: 7, role: 'FWD', team: 'away', x: 48 + awayShift * 1.05, y: 78 },
      { id: 'a11', num: 11, role: 'FWD', team: 'away', x: 48 + awayShift * 1.05, y: 22 },
      { id: 'a9', num: 9, role: 'FWD', team: 'away', x: 44 + awayShift * 1.1, y: 50 },
    ];

    return [...home, ...away];
  }, [attackPhase]);

  return (
    <div className="flex flex-col w-full h-full bg-slate-950 select-none overflow-hidden">
      {/* 1. Üst Durum & Atak Bilgisi Barı (Sahanın ÜSTÜNDE - Sahayı ASLA kapatmaz) */}
      <div className="px-3 sm:px-4 py-2 bg-[#0c1220] border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2 truncate">
          <span
            className="w-3 h-3 rounded-full border border-white/40 shadow-sm shrink-0"
            style={{ background: homeKit.gradient || homeKit.primaryColor }}
            title={`${match.homeTeam.name} Forma Rengi`}
          />
          <span className="text-xs sm:text-sm font-black text-white truncate">{match.homeTeam.name}</span>
          <span className="px-2 py-0.5 rounded bg-black font-mono text-xs sm:text-sm font-black text-[#c6f052] border border-white/10 shrink-0">
            {liveState.displayScore.home} - {liveState.displayScore.away}
          </span>
          <span className="text-xs sm:text-sm font-black text-white truncate">{match.awayTeam.name}</span>
          <span
            className="w-3 h-3 rounded-full border border-white/40 shadow-sm shrink-0"
            style={{ background: awayKit.gradient || awayKit.primaryColor }}
            title={`${match.awayTeam.name} Forma Rengi`}
          />
        </div>

        <div className="flex items-center space-x-1.5 shrink-0">
          <button
            type="button"
            onClick={toggleSound}
            className={`p-1 sm:p-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1 ${
              isSoundActive
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white'
            }`}
            title={isSoundActive ? 'Düdük & Saha Sesi Açık (Tıkla Kapat)' : 'Sesler Kapalı (Tıkla Aç)'}
          >
            {isSoundActive ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="text-[10px] hidden sm:inline font-bold">Ses</span>
          </button>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-sm ${badge.color}`}>
            {badge.text}
          </span>
          {liveState.isFinished ? (
            <span className="px-2.5 py-0.5 rounded bg-emerald-600 text-white font-mono text-xs font-black shadow-sm">
              MS
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-mono text-xs font-bold animate-pulse">
              {liveState.liveMinute || 'Canlı'}
            </span>
          )}
        </div>
      </div>

      {/* 2. 2D Futbol Sahası (Gerçek Takım Formalı 22 Oyuncu, Radarlı ve Net Görüş) */}
      <div className="relative flex-1 w-full bg-[#1b3d22] overflow-hidden min-h-[150px]">
        {/* Çim Çizgileri & Doku */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[repeating-linear-gradient(90deg,#000_0,#000_30px,transparent_30px,transparent_60px)]" />
        <div className="absolute inset-2 border-2 border-white/40 rounded pointer-events-none" />
        <div className="absolute top-2 bottom-2 left-1/2 w-0.5 bg-white/40 pointer-events-none -translate-x-1/2" />
        <div className="absolute top-1/2 left-1/2 w-20 h-20 border-2 border-white/40 rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2" />
        <div className={`absolute top-1/2 left-2 w-12 h-24 border-2 ${attackPhase === 'away_attack' ? 'border-rose-500 bg-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.6)] animate-pulse' : 'border-white/40'} border-l-0 pointer-events-none -translate-y-1/2 transition-colors duration-500`} />
        <div className={`absolute top-1/2 right-2 w-12 h-24 border-2 ${attackPhase === 'danger' ? 'border-rose-500 bg-rose-500/25 shadow-[0_0_25px_rgba(244,63,94,0.8)] animate-pulse' : attackPhase === 'home_attack' ? 'border-emerald-500/60 bg-emerald-500/10' : 'border-white/40'} border-r-0 pointer-events-none -translate-y-1/2 transition-colors duration-500`} />

        {/* Takım İsimleri ve Forma Rozeti (Köşelerde yarı saydam) */}
        <div className="absolute top-2.5 left-4 flex items-center space-x-1.5 text-[10px] sm:text-[11px] font-black tracking-wider uppercase pointer-events-none">
          <span
            className="w-2.5 h-2.5 rounded-full border border-white/60 shadow-sm"
            style={{ background: homeKit.gradient || homeKit.primaryColor }}
          />
          <span className="text-white/60">{match.homeTeam.shortName || match.homeTeam.name}</span>
        </div>
        <div className="absolute top-2.5 right-4 flex items-center space-x-1.5 text-[10px] sm:text-[11px] font-black tracking-wider uppercase pointer-events-none">
          <span className="text-white/60">{match.awayTeam.shortName || match.awayTeam.name}</span>
          <span
            className="w-2.5 h-2.5 rounded-full border border-white/60 shadow-sm"
            style={{ background: awayKit.gradient || awayKit.primaryColor }}
          />
        </div>

        {/* 🏃‍♂️ Canlı Sahadaki Oyuncular (Gerçek Forma Renkleriyle 11 vs 11) */}
        {players.map((p) => {
          const isCarrier = p.id === activeCarrierId;
          const isHome = p.team === 'home';
          const kit = isHome ? homeKit : awayKit;
          const isGK = p.role === 'GK';

          const backgroundStyle = isGK
            ? { backgroundColor: kit.gkColor }
            : kit.gradient
            ? { background: kit.gradient }
            : { backgroundColor: kit.primaryColor };

          const numColor = isGK ? kit.gkNumberColor : kit.numberColor;

          return (
            <div
              key={p.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ease-out z-10 pointer-events-none"
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
            >
              <div
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center font-black text-[7px] sm:text-[9px] md:text-[10px] shadow-md transition-all ${
                  isCarrier
                    ? 'ring-2 ring-[#c6f052] scale-125 shadow-[0_0_12px_#c6f052] font-black z-20'
                    : 'border border-black/40'
                }`}
                style={{
                  ...backgroundStyle,
                  color: numColor,
                  boxShadow: isCarrier
                    ? '0 0 12px #c6f052'
                    : '0 1px 3px rgba(0,0,0,0.5)',
                }}
                title={`${isHome ? match.homeTeam.name : match.awayTeam.name} #${p.num} (${p.role})`}
              >
                {p.num}
              </div>
            </div>
          );
        })}

        {/* ⚽ Hareketli Canlı Top */}
        <div
          className="absolute z-20 transition-all duration-1000 ease-out -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ left: `${ballPosition.x}%`, top: `${ballPosition.y}%` }}
        >
          <div className="relative">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white border border-slate-900 shadow-[0_0_15px_#c6f052] flex items-center justify-center text-xs font-bold">
              ⚽
            </div>
            {!liveState.isFinished && (
              <div className="absolute -inset-1 rounded-full bg-[#c6f052]/50 animate-ping -z-10" />
            )}
          </div>
        </div>

        {/* 🏁 Maç Bitti (MS) Bilgi Kartı */}
        {liveState.isFinished && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 px-4 py-2.5 rounded-2xl bg-black/90 border border-[#c6f052]/60 shadow-[0_0_35px_rgba(0,0,0,0.9)] flex flex-col items-center pointer-events-none backdrop-blur-md">
            <span className="text-[10px] sm:text-xs uppercase font-black tracking-widest text-[#c6f052] flex items-center gap-1.5 mb-0.5">
              <span>🏁</span> MAÇ SONUCU (90' BİTTİ)
            </span>
            <div className="text-base sm:text-lg font-black text-white font-mono flex items-center space-x-2">
              <span>{match.homeTeam.name}</span>
              <span className="text-[#c6f052] px-2 py-0.5 rounded bg-slate-900 border border-white/10">
                {liveState.displayScore.home} - {liveState.displayScore.away}
              </span>
              <span>{match.awayTeam.name}</span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Alt Saha İstatistik & Zaman Tüneli Çubuğu */}
      <div className="px-3 sm:px-4 py-1.5 bg-[#0a0e1a] border-t border-slate-800 flex items-center justify-between text-[11px] sm:text-xs text-slate-300 shrink-0 gap-2">
        <div className="flex items-center space-x-1.5 shrink-0 bg-slate-900 rounded-lg p-0.5 border border-slate-800">
          <button
            type="button"
            onClick={() => setBottomTab('stats')}
            className={`px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
              bottomTab === 'stats'
                ? 'bg-[#c6f052] text-slate-950 font-black shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3 h-3" />
            <span>İstatistik</span>
          </button>
          <button
            type="button"
            onClick={() => setBottomTab('timeline')}
            className={`px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
              bottomTab === 'timeline'
                ? 'bg-[#c6f052] text-slate-950 font-black shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>Olaylar</span>
          </button>
        </div>

        {bottomTab === 'stats' ? (
          <div className="flex items-center space-x-2 sm:space-x-3 font-semibold truncate flex-1 min-w-0 justify-center">
            <span className="truncate">Topla Oynama: <b className="text-emerald-400 font-mono">%54</b> - <b className="text-indigo-400 font-mono">%46</b></span>
            <span>•</span>
            <span className="truncate">Şut: <b className="text-white font-mono">7(3)</b> - <b className="text-white font-mono">4(2)</b></span>
            <span>•</span>
            <span className="truncate">Korner: <b className="text-amber-400 font-mono">4</b> - <b className="text-amber-400 font-mono">2</b></span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-0.5 flex-1 min-w-0">
            {timelineEvents.map((evt, idx) => (
              <span
                key={idx}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 flex items-center space-x-1 border ${
                  evt.type === 'goal'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                    : evt.type === 'card_yellow'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : evt.type === 'whistle'
                    ? 'bg-slate-800 text-slate-200 border-slate-700'
                    : 'bg-slate-900/80 text-slate-300 border-slate-800'
                }`}
                title={evt.detail}
              >
                <span className="font-mono text-slate-400">{evt.minute}</span>
                <span>{evt.title}</span>
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center space-x-1 text-[#c6f052] font-black text-[10px] sm:text-[11px] tracking-wider uppercase shrink-0">
          <Activity className="w-3.5 h-3.5 animate-bounce" />
          <span className="hidden sm:inline">2D Radar</span>
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
  initialChannelId = 'trt1'
}) => {
  const [activeMatch, setActiveMatch] = useState<Match | null>(targetMatch);
  const [channels] = useState<TVChannel[]>(TV_CHANNELS);
  const [activeChannelId, setActiveChannelId] = useState<string>(initialChannelId);
  const [activeViewMode, setActiveViewMode] = useState<'radar' | 'tv'>('radar');
  const [isMiniMode, setIsMiniMode] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [volume, setVolume] = useState<number>(1.0);

  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Canlı modal açıkken her 10 saniyede bir bülteni arka planda yokla ve maç durumunu güncelle
  useEffect(() => {
    if (!isOpen || !activeMatch?.id) return;
    const pollTimer = setInterval(async () => {
      try {
        const res = await fetch('/api/bulletin');
        if (res.ok) {
          const data = await res.json();
          const matches: Match[] = Array.isArray(data) ? data : (data.matches || data.data || []);
          const fresh = matches.find((m) => m.id === activeMatch.id);
          if (fresh) {
            setActiveMatch((prev) => prev ? { ...prev, ...fresh } : fresh);
          }
        }
      } catch {
        // Ağ dalgalanmalarını sessizce yut
      }
    }, 10000);

    return () => clearInterval(pollTimer);
  }, [isOpen, activeMatch?.id]);

  useEffect(() => {
    if (targetMatch) {
      setActiveMatch(targetMatch);
      setActiveViewMode('radar');
    }
  }, [targetMatch, isOpen]);

  const currentMatch = activeMatch || targetMatch;
  const currentChannel = channels.find((c) => c.id === activeChannelId) || channels[0];
  const liveState = useMemo(() => currentMatch ? getMatchLiveState(currentMatch, currentTime) : null, [currentMatch, currentTime]);

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
            {activeViewMode === 'radar' && currentMatch ? (
              <div className="flex items-center space-x-2 truncate">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${liveState?.isFinished ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`} />
                <span className="text-xs sm:text-sm font-bold text-slate-200 truncate">
                  2D Canlı Saha Radarı • <span className="text-[#c6f052] font-semibold">{currentMatch.league || 'Canlı Karşılaşma'}</span>
                </span>
                {liveState?.isFinished && (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/40 shrink-0">
                    MS (Maç Bitti)
                  </span>
                )}
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
                          className="w-3 h-3 rounded-full shrink-0 shadow-sm border border-white/20"
                          style={{ background: getTeamKit(m.homeTeam.name, false).gradient || getTeamKit(m.homeTeam.name, false).primaryColor }}
                        />
                        <span className="text-sm sm:text-base font-black text-white truncate">
                          {m.homeTeam.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2.5">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 shadow-sm border border-white/20"
                          style={{ background: getTeamKit(m.awayTeam.name, true, getTeamKit(m.homeTeam.name, false)).gradient || getTeamKit(m.awayTeam.name, true, getTeamKit(m.homeTeam.name, false)).primaryColor }}
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

// src/components/horse/HorseRacingView.tsx
import React, { useEffect, useMemo, useState, useRef } from 'react';
import Hls from 'hls.js';
import {
  Award,
  CheckCircle2,
  ChevronRight,
  Clock,
  CloudSun,
  Info,
  RefreshCw,
  Sparkles,
  Ticket,
  Timer,
  Trash2,
  Trophy,
  AlertTriangle,
  ArrowUpDown,
  Zap,
  Globe,
  Flag,
  Bot,
  Lock,
  Crown,
  X,
  ChevronDown,
  ChevronUp,
  Check,
  Play,
  Tv,
  ExternalLink,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Flame,
} from 'lucide-react';
import { User } from '../../utils/authHelper';
import {
  GeneratedAltiliCoupon,
  HippodromeProgram,
  HorseAIAnalysis,
  HorseRunner,
  ProgramDetail,
  RaceCard,
} from '../../types/horseRacing';
import { HorseAIChatModal } from './HorseAIChatModal';
import { DraggableAIFab } from '../DraggableAIFab';
import {
  fetchHorseRacingBulletin,
  fetchHorseRacingProgram,
  fetchLiveRaceStream,
} from '../../services/horseRacingService';
import {
  GameConfig,
  IkiliPick,
  analyzeRaceHorses,
  calculateCouponCombinations,
  calculateJockeyTrainerSynergy,
  checkGameClosedStatus,
  generateAICoupons,
  generateDailyIkiliAndCifte,
  getAvailableGames,
  getHorsePrimaryAgf,
  getLegBadgeForRace,
  getLegRaceNumbers,
} from '../../utils/horseRacingEngine';

type HRSubTab = 'bulletin' | 'ai_coupons' | 'ikili_cifte' | 'results' | 'changes';
type SortMode = 'number' | 'agf' | 'ganyan' | 'ai' | 'handicap';

export interface SavedHorseCouponLeg {
  raceNo: number;
  picks: number[];
}

export interface SavedHorseCoupon {
  id: string;
  programId?: number;
  programPlace?: string;
  programDate?: string;
  gameKey?: string;
  gameLabel?: string;
  title: string;
  combos: number;
  cost: number;
  misli?: number;
  stakeStr: string;
  time: string;
  createdAt?: number;
  legs?: SavedHorseCouponLeg[];
}

export function normalizeCouponLegs(
  coupon: SavedHorseCoupon,
  activeLegRaceNumbers?: number[]
): SavedHorseCouponLeg[] {
  if (Array.isArray(coupon.legs) && coupon.legs.length > 0) {
    return coupon.legs;
  }
  if (!coupon.stakeStr) return [];
  const parts = String(coupon.stakeStr).split('/').map((p) => p.trim());
  return parts.map((part, idx) => {
    const picks = part
      .split(',')
      .map((n) => parseInt(n.trim(), 10))
      .filter((n) => !isNaN(n));
    const raceNo =
      activeLegRaceNumbers && activeLegRaceNumbers[idx]
        ? activeLegRaceNumbers[idx]
        : idx + 1;
    return { raceNo, picks };
  });
}

// 🏁 Toplu Altılı Ganyan Canlı Sonuçları & Ganyan Paneli
export const AltiliResultsSummaryBoard: React.FC<{
  detail: ProgramDetail | null;
  availableGames: GameConfig[];
  activeGame: GameConfig | null;
  onSelectRace: (raceNo: number) => void;
  onSelectGame: (gameId: any) => void;
  initialCollapsed?: boolean;
}> = ({ detail, availableGames, activeGame, onSelectRace, onSelectGame, initialCollapsed = true }) => {
  // Filter games that are Altılı or fallback to availableGames
  const altiliGames = useMemo(() => {
    const altilis = availableGames.filter(
      (g) => g.id === 'ALTILI_1' || g.id === 'ALTILI_2' || g.legCount === 6
    );
    return altilis.length > 0 ? altilis : availableGames;
  }, [availableGames]);

  // Selected board game
  const currentBoardGame = useMemo(() => {
    if (activeGame && altiliGames.some((g) => g.id === activeGame.id)) {
      return activeGame;
    }
    return altiliGames[0] || null;
  }, [altiliGames, activeGame]);

  // Compute 6 legs and their results
  const legsInfo = useMemo(() => {
    if (!detail || !currentBoardGame) return [];
    const legs = [];
    for (let i = 0; i < currentBoardGame.legCount; i++) {
      const raceNo = currentBoardGame.startRace + i;
      const race = detail.races.find((r) => r.number === raceNo);
      const winner = race?.horses.find((h) => Number(h.order) === 1);
      const second = race?.horses.find((h) => Number(h.order) === 2);
      const isFinished = Boolean(winner) || race?.isFinished;
      legs.push({
        legIndex: i + 1,
        raceNo,
        raceHour: race?.hour || '',
        raceDistance: race?.distance || '',
        raceCourseType: race?.raceCourseType || '',
        isFinished,
        winner,
        second,
        race,
      });
    }
    return legs;
  }, [detail, currentBoardGame]);

  const finishedLegs = useMemo(
    () => legsInfo.filter((l) => Boolean(l.winner)),
    [legsInfo]
  );
  const isAllFinished =
    legsInfo.length > 0 && finishedLegs.length === legsInfo.length;

  const [isCollapsed, setIsCollapsed] = useState<boolean>(initialCollapsed);

  const totalGanyanProduct = useMemo(() => {
    if (finishedLegs.length === 0) return 0;
    return finishedLegs.reduce((acc, l) => {
      const g = l.winner?.ganyan && l.winner.ganyan > 0 ? l.winner.ganyan : 1;
      return acc * g;
    }, 1);
  }, [finishedLegs]);

  const officialPayout = useMemo(() => {
    if (!detail?.summary?.altiliResults || !currentBoardGame) return null;
    return detail.summary.altiliResults.find(
      (a) =>
        a.name?.toLowerCase().includes(currentBoardGame.shortLabel.toLowerCase()) ||
        a.name?.toLowerCase().includes('altılı')
    );
  }, [detail, currentBoardGame]);

  if (!detail || legsInfo.length === 0) return null;

  const placeName = detail.program.place || detail.program.name || 'Hipodrom';
  const programDate = detail.program.date ? ` • ${detail.program.date}` : '';

  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-amber-500/40 p-2.5 sm:p-3.5 shadow-xl space-y-2">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2 flex-wrap gap-1.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20 shrink-0">
            <Trophy className="w-3.5 h-3.5 fill-current" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2 flex-wrap gap-1">
              <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-1 truncate">
                <span>🏆 {placeName}{programDate} Canlı Altılı Sonuçları</span>
              </h3>
              <span
                className={`px-2 py-0.2 rounded-full text-[9px] font-black border ${isAllFinished
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                  : finishedLegs.length > 0
                    ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
              >
                {isAllFinished
                  ? 'TAMAMLANDI'
                  : finishedLegs.length > 0
                    ? `${finishedLegs.length}/${legsInfo.length} Ayak Koşuldu`
                    : 'Koşular Başlamadı'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls & Game Selector */}
        <div className="flex items-center space-x-1.5 shrink-0 ml-auto">
          {altiliGames.length > 1 && (
            <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800 gap-0.5">
              {altiliGames.map((g) => {
                const isSel = currentBoardGame?.id === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => onSelectGame(g.id)}
                    className={`px-2 py-1 rounded-md text-[11px] font-black transition-all cursor-pointer ${isSel
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                      }`}
                  >
                    {g.shortLabel || g.label}
                  </button>
                );
              })}
            </div>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer transition-colors"
            title={isCollapsed ? 'Genişlet' : 'Küçült'}
          >
            <span className="text-[11px] hidden sm:inline">{isCollapsed ? 'Detayı Aç' : 'Küçült'}</span>
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Collapsed One-Line Quick Summary Banner */}
      {isCollapsed && finishedLegs.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80 text-xs">
          <div className="flex items-center space-x-1.5 flex-wrap gap-1">
            <span className="text-[10px] font-bold text-slate-400">Gelenler:</span>
            {legsInfo.map((l, i) => (
              <span
                key={l.raceNo}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${l.winner
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-slate-900 text-slate-500 border border-slate-800'
                  }`}
              >
                {i + 1}.A: {l.winner ? `#${l.winner.number}` : '⏳'}
              </span>
            ))}
          </div>

          <div className="flex items-center space-x-3 ml-auto text-xs">
            {totalGanyanProduct > 0 && (
              <span className="text-[11px] font-mono text-amber-300 font-bold hidden sm:inline">
                Bileşik: {totalGanyanProduct.toFixed(2)} ₺
              </span>
            )}
            {officialPayout?.unitPrize && (
              <div className="flex items-center space-x-1 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/30">
                <span className="text-[10px] text-emerald-400 font-semibold">TJK İkramiye:</span>
                <span className="font-mono font-black text-emerald-400 text-xs">
                  {officialPayout.unitPrize} ₺
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expanded 6 Legs Sleek Grid */}
      {!isCollapsed && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 pt-1">
            {legsInfo.map((leg) => {
              const winner = leg.winner;
              return (
                <div
                  key={leg.raceNo}
                  onClick={() => onSelectRace(leg.raceNo)}
                  className={`p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-1 hover:border-amber-400/50 ${winner
                    ? 'bg-gradient-to-b from-emerald-950/30 to-slate-950 border-emerald-500/40 shadow-sm'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    }`}
                >
                  {/* Leg Header */}
                  <div className="flex items-center justify-between text-[10px] pb-1 border-b border-slate-800/80">
                    <span className="font-black text-amber-400">{leg.legIndex}. Ayak</span>
                    <span className="text-[9px] text-slate-400 font-mono">
                      {leg.raceNo}.K {leg.raceHour ? `• ${leg.raceHour}` : ''}
                    </span>
                  </div>

                  {/* Winner Content */}
                  {winner ? (
                    <div className="space-y-1 py-0.5">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-6 h-6 rounded-md bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                          #{winner.number}
                        </span>
                        <div className="min-w-0">
                          <div
                            className="font-black text-xs text-white truncate max-w-[95px]"
                            title={winner.name}
                          >
                            {winner.name}
                          </div>
                          <div className="text-[9px] text-slate-400 truncate max-w-[95px]">
                            {winner.jockey?.name || 'Jokey'}
                          </div>
                        </div>
                      </div>

                      {/* Ganyan Badge */}
                      <div className="flex items-center justify-between text-[10px] pt-1 border-t border-emerald-500/20">
                        <span className="text-[9px] text-slate-400 font-medium">GANYAN:</span>
                        <span className="font-mono font-black text-[11px] text-amber-400 bg-amber-400/10 px-1 py-0.2 rounded border border-amber-400/30">
                          {winner.ganyan > 0 ? `${winner.ganyan.toFixed(2)} ₺` : '1.00 ₺'}
                        </span>
                      </div>

                      {leg.second && (
                        <div className="text-[8px] text-slate-400 truncate">
                          2. #{leg.second.number} {leg.second.name}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-2 text-center space-y-0.5">
                      <div className="text-[11px] text-slate-400 font-bold flex items-center justify-center space-x-1">
                        <Clock className="w-3 h-3 text-amber-400/80" />
                        <span>{leg.raceHour || 'Koşulmadı'}</span>
                      </div>
                      <span className="inline-block px-1.5 py-0.2 rounded text-[8px] font-semibold bg-slate-900 text-slate-500 border border-slate-800">
                        Bekleniyor ⏳
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Summary Strip */}
          <div className="p-2 sm:p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/90 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center space-x-1.5 flex-wrap gap-1">
              <span className="font-bold text-slate-400 text-[10px]">🏁 Sıralama:</span>
              {legsInfo.map((l, i) => (
                <span
                  key={l.raceNo}
                  className={`px-1.5 py-0.5 rounded font-mono font-bold text-[10px] flex items-center space-x-1 ${l.winner
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'bg-slate-900 text-slate-500 border border-slate-800'
                    }`}
                >
                  <span>{i + 1}.A:</span>
                  <span>{l.winner ? `#${l.winner.number}` : '⏳'}</span>
                </span>
              ))}
            </div>

            <div className="flex items-center space-x-3 ml-auto">
              {totalGanyanProduct > 0 && (
                <div className="text-right">
                  <span className="text-[9px] text-slate-400 block font-semibold">Bileşik Ganyan:</span>
                  <span className="font-mono font-black text-amber-400 text-xs">
                    {totalGanyanProduct.toFixed(2)} ₺
                  </span>
                </div>
              )}
              {officialPayout && (
                <div className="text-right pl-2.5 border-l border-slate-800">
                  <span className="text-[9px] text-emerald-400 font-semibold block">TJK Resmi İkramiye:</span>
                  <span className="font-mono font-black text-emerald-400 text-xs sm:text-sm">
                    {officialPayout.unitPrize ? `${officialPayout.unitPrize} ₺` : 'Hesaplanıyor'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// 📋 Zenginleştirilmiş Kayıtlı Kupon Kartı (Gelen Atlar, Canlı Durum & Sonuçlar)
export const SavedCouponCard: React.FC<{
  coupon: SavedHorseCoupon;
  currentDetail: ProgramDetail | null;
  activeLegRaceNumbers: number[];
  onSelectProgram: (pid: number) => void;
  onLoadCoupon: (coupon: SavedHorseCoupon) => void;
  onDelete: (id: string) => void;
}> = ({
  coupon,
  currentDetail,
  activeLegRaceNumbers,
  onSelectProgram,
  onLoadCoupon,
  onDelete,
}) => {
    const [isExpanded, setIsExpanded] = useState<boolean>(true);

    const isCurrentProgram = Boolean(
      currentDetail &&
      ((coupon.programId && currentDetail.program.id === coupon.programId) ||
        (coupon.programPlace &&
          currentDetail.program.place.toLowerCase() ===
          coupon.programPlace.toLowerCase()))
    );

    const legsData = useMemo(() => {
      return normalizeCouponLegs(
        coupon,
        isCurrentProgram ? activeLegRaceNumbers : undefined
      );
    }, [coupon, isCurrentProgram, activeLegRaceNumbers]);

    const evaluation = useMemo(() => {
      if (!isCurrentProgram || !currentDetail || !currentDetail.races) {
        return null;
      }

      const totalLegs = legsData.length;
      let wonLegCount = 0;
      let lostLegCount = 0;
      let pendingLegCount = 0;
      let lostAtLegNumber: number | null = null;

      const evaluatedLegs = legsData.map((leg, idx) => {
        const race = currentDetail.races.find((r) => r.number === leg.raceNo);
        const winner = race?.horses.find((h) => Number(h.order) === 1);

        if (winner) {
          const isWon = leg.picks.includes(winner.number);
          if (isWon) {
            wonLegCount++;
            return {
              raceNo: leg.raceNo,
              raceHour: race?.hour,
              picks: leg.picks,
              winnerHorse: winner,
              isWon: true,
              isLost: false,
              isPending: false,
            };
          } else {
            lostLegCount++;
            if (lostAtLegNumber === null) {
              lostAtLegNumber = idx + 1;
            }
            return {
              raceNo: leg.raceNo,
              raceHour: race?.hour,
              picks: leg.picks,
              winnerHorse: winner,
              isWon: false,
              isLost: true,
              isPending: false,
            };
          }
        } else {
          pendingLegCount++;
          return {
            raceNo: leg.raceNo,
            raceHour: race?.hour,
            picks: leg.picks,
            winnerHorse: undefined,
            isWon: false,
            isLost: false,
            isPending: true,
          };
        }
      });

      let status: 'won' | 'lost' | 'in_progress' | 'pending' = 'pending';
      let statusLabel = 'Koşular Başlamadı ⏳';
      let statusBadgeClass = 'bg-slate-800 text-slate-300 border-slate-700';

      if (lostLegCount > 0) {
        status = 'lost';
        statusLabel = lostAtLegNumber
          ? `${lostAtLegNumber}. Ayakta Tutmadı ❌`
          : 'TUTMADI ❌';
        statusBadgeClass =
          'bg-rose-500/20 text-rose-300 border-rose-500/40 font-black';
      } else if (wonLegCount === totalLegs && totalLegs > 0) {
        status = 'won';
        statusLabel = "TUTTU! 🏆 6'DA 6 (KAZANDI)";
        statusBadgeClass =
          'bg-gradient-to-r from-amber-400 to-emerald-400 text-slate-950 border-amber-300 font-black shadow-lg shadow-emerald-500/20 animate-pulse';
      } else if (wonLegCount > 0 && pendingLegCount > 0) {
        status = 'in_progress';
        statusLabel = `${wonLegCount}/${totalLegs} Ayak Geldi • Devam Ediyor 🟢`;
        statusBadgeClass =
          'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold';
      }

      return {
        evaluatedLegs,
        status,
        statusLabel,
        statusBadgeClass,
        wonLegCount,
        lostLegCount,
        pendingLegCount,
        totalLegs,
        lostAtLegNumber,
      };
    }, [isCurrentProgram, currentDetail, legsData]);

    return (
      <div
        className={`p-3 rounded-2xl border transition-all space-y-2.5 ${evaluation?.status === 'won'
          ? 'bg-gradient-to-b from-emerald-950/40 to-slate-900/90 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
          : evaluation?.status === 'lost'
            ? 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
            : evaluation?.status === 'in_progress'
              ? 'bg-gradient-to-b from-amber-950/30 to-slate-900/90 border-amber-500/40'
              : 'bg-slate-950/80 border-slate-800'
          }`}
      >
        {/* Top Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5 flex-wrap gap-1">
              <span className="font-black text-sm text-white truncate">
                {coupon.title}
              </span>
              {coupon.misli && coupon.misli > 1 && (
                <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 text-[10px] font-black border border-amber-400/30">
                  {coupon.misli}x Misli
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center space-x-2 mt-0.5">
              <span>{coupon.combos} Kolon</span>
              <span>•</span>
              <span className="font-mono font-bold text-amber-400">
                {coupon.cost.toFixed(2)} ₺
              </span>
              <span>•</span>
              <span>{coupon.time}</span>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center space-x-1.5 shrink-0">
            {evaluation ? (
              <span
                className={`px-2.5 py-1 rounded-xl text-[11px] border flex items-center space-x-1 ${evaluation.statusBadgeClass}`}
              >
                {evaluation.status === 'won' && (
                  <Crown className="w-3.5 h-3.5 fill-current" />
                )}
                {evaluation.status === 'lost' && (
                  <X className="w-3.5 h-3.5 stroke-[3]" />
                )}
                {evaluation.status === 'in_progress' && (
                  <Zap className="w-3.5 h-3.5 fill-current" />
                )}
                {evaluation.status === 'pending' && (
                  <Clock className="w-3.5 h-3.5" />
                )}
                <span>{evaluation.statusLabel}</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400 text-[10px] font-semibold border border-slate-700">
                {coupon.programPlace || 'Farklı Hipodrom'}
              </span>
            )}
          </div>
        </div>

        {/* Stake String Summary (if not current program or collapsed) */}
        {(!isCurrentProgram || !isExpanded) && (
          <div className="p-2 rounded-xl bg-slate-900/70 border border-slate-800/80 font-mono text-xs text-emerald-300 break-words">
            {coupon.stakeStr}
          </div>
        )}



        {/* Different Program Switch Banner */}
        {!isCurrentProgram && coupon.programId && (
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2">
            <div className="text-[11px] text-amber-300 font-medium">
              Bu kupon{' '}
              <strong>{coupon.programPlace || 'farklı bir hipodroma'}</strong>{' '}
              aittir. Gelen atları ve kazanç durumunu canlı görmek için programa
              geçin.
            </div>
            <button
              onClick={() => onSelectProgram(coupon.programId!)}
              className="px-2.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shrink-0 cursor-pointer transition-colors shadow-sm"
            >
              Hipodroma Git
            </button>
          </div>
        )}



        {/* Live Leg Breakdown (when current program) */}
        {isCurrentProgram && evaluation && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold px-0.5">
              <span>
                Ayak Detayları & Gelen Atlar ({evaluation.wonLegCount}/
                {evaluation.totalLegs} Başarılı)
              </span>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-amber-400 hover:text-amber-300 flex items-center space-x-1 cursor-pointer"
              >
                <span>{isExpanded ? 'Gizle' : 'Detayları Göster'}</span>
                {isExpanded ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>
            </div>

            {isExpanded && (
              <div className="space-y-1.5 max-h-80 overflow-y-auto overscroll-auto touch-pan-y pr-0.5">
                {evaluation.evaluatedLegs.map((leg, idx) => {
                  return (
                    <div
                      key={leg.raceNo}
                      className={`p-2 rounded-xl border text-xs transition-all ${leg.isWon
                        ? 'bg-emerald-950/30 border-emerald-500/40 shadow-sm'
                        : leg.isLost
                          ? 'bg-rose-950/25 border-rose-500/30'
                          : 'bg-slate-900/60 border-slate-800'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-black text-amber-400">
                            {idx + 1}. Ayak
                          </span>
                          <span className="text-[10px] text-slate-400">
                            ({leg.raceNo}. Koşu{' '}
                            {leg.raceHour ? `• ${leg.raceHour}` : ''})
                          </span>
                        </div>
                        <div>
                          {leg.isWon && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950 text-[10px] font-black flex items-center space-x-1 shadow-sm">
                              <Check className="w-3 h-3 stroke-[3]" />
                              <span>GELDİ (#{leg.winnerHorse?.number})</span>
                            </span>
                          )}
                          {leg.isLost && (
                            <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black flex items-center space-x-1">
                              <X className="w-3 h-3 stroke-[3]" />
                              <span>YATTI (Gelen: #{leg.winnerHorse?.number})</span>
                            </span>
                          )}
                          {leg.isPending && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px] font-medium flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>Bekliyor</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Selected Horses List */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-semibold mr-0.5">
                          Seçimler:
                        </span>
                        {leg.picks.map((hNo) => {
                          const isWinnerHorse =
                            leg.winnerHorse && leg.winnerHorse.number === hNo;
                          return (
                            <span
                              key={hNo}
                              className={`px-2 py-0.5 rounded-lg text-xs font-mono font-black flex items-center space-x-1 transition-all ${isWinnerHorse
                                ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 text-slate-950 border border-emerald-300 shadow-md shadow-emerald-500/30 scale-105'
                                : leg.isLost
                                  ? 'bg-slate-900 text-slate-400 border border-slate-800'
                                  : 'bg-slate-800 text-white border border-slate-700'
                                }`}
                            >
                              <span>#{hNo}</span>
                              {isWinnerHorse && (
                                <span className="flex items-center space-x-0.5 text-[9px] font-black uppercase text-slate-950 bg-amber-300 px-1 rounded ml-0.5">
                                  <Crown className="w-2.5 h-2.5 inline fill-current" />
                                  <span>GELDİ</span>
                                </span>
                              )}
                            </span>
                          );
                        })}
                      </div>

                      {/* If lost, display the winner that actually came */}
                      {leg.isLost && leg.winnerHorse && (
                        <div className="mt-1.5 pt-1.5 border-t border-rose-500/20 flex items-center justify-between text-[11px] text-rose-300 font-medium">
                          <div className="flex items-center space-x-1">
                            <span className="text-rose-400 font-bold">
                              ⚠️ 1. Gelen At:
                            </span>
                            <span className="font-mono font-black text-white bg-rose-500/30 px-1.5 py-0.2 rounded border border-rose-500/40">
                              #{leg.winnerHorse.number}
                            </span>
                            <span className="font-bold text-white truncate max-w-[130px]">
                              {leg.winnerHorse.name}
                            </span>
                          </div>
                          {leg.winnerHorse.ganyan ? (
                            <span className="font-mono text-amber-300 text-[10px]">
                              Ganyan: {leg.winnerHorse.ganyan}
                            </span>
                          ) : null}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}



        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 gap-2">
          <button
            onClick={() => onLoadCoupon(coupon)}
            className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer transition-colors border border-slate-700"
          >
            <RefreshCw className="w-3 h-3 text-emerald-400" />
            <span>Kuponu Bültene Yükle</span>
          </button>
          <button
            onClick={() => onDelete(coupon.id)}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800 cursor-pointer transition-colors"
            title="Kuponu Sil"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };


// 🔄 Canlı HLS Playlist Cache-Buster Loader (ercdn edge sunucularının eski sequence döndürüp 8-9-10 döngüsüne girmesini önler)
const LivePlaylistLoader = class extends (Hls.DefaultConfig.loader as any) {
  load(context: any, config: any, callbacks: any) {
    if (context.type === 'manifest' || context.type === 'level') {
      const sep = context.url.includes('?') ? '&' : '?';
      context.url = `${context.url}${sep}_t=${Date.now()}`;
    }
    super.load(context, config, callbacks);
  }
} as any;

// 📺 TJK TV Resmi Canlı Yayın Oynatıcısı (Native HLS / HTML5 Video)
const TJKVideoPlayer: React.FC<{
  streamUrl: string;
  autoPlay?: boolean;
  className?: string;
}> = ({ streamUrl, autoPlay = true, className = 'w-full h-full object-contain' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    setHasError(false);
    setIsLoading(true);
    let hlsInstance: Hls | null = null;

    const attemptPlay = () => {
      if (!autoPlay || !video) return;
      video.muted = true; // Tarayıcı güvenlik kısıtlamalarına takılmadan anında oynatmak için sessiz başlar
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Autoplay error:', err);
        });
      }
    };

    if (streamUrl.endsWith('.mp4')) {
      video.src = streamUrl;
      attemptPlay();
      return;
    }

    // 1. Önce Hls.js desteği kontrol edilir (Chrome, Edge, Firefox, Android)
    if (Hls.isSupported()) {
      hlsInstance = new Hls({
        pLoader: LivePlaylistLoader,
        enableWorker: true,
        lowLatencyMode: false,
        liveDurationInfinity: true, // Tarayıcının canlı yayını 10. saniyede bitti sanıp durdurmasını engeller
        liveSyncDurationCount: 3, // Kesintisiz akış için 3 segment canlı tampon
        liveMaxLatencyDurationCount: 6,
        maxBufferLength: 30, // 30 saniye tamponlama
        maxMaxBufferLength: 60,
        nudgeOffset: 0.2,
        nudgeMaxRetry: 10,
        maxBufferHole: 0.5,
      });
      hlsInstance.loadSource(streamUrl);
      hlsInstance.attachMedia(video);

      hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
        attemptPlay();
      });

      hlsInstance.on(Hls.Events.LEVEL_UPDATED, () => {
        setIsLoading(false);
        if (video && video.paused && autoPlay && !video.ended) {
          video.play().catch(() => {});
        }
      });

      hlsInstance.on(Hls.Events.FRAG_BUFFERED, () => {
        setIsLoading(false);
      });

      hlsInstance.on(Hls.Events.ERROR, (_e, data) => {
        // Tampon gecikmesi veya micro-gap durumunda videoyu otomatik 200ms ileri kaydırarak donmayı aş
        if (data.details === 'bufferStalledError' || data.details === 'bufferNudgeOnStall') {
          if (video && !video.paused) {
            video.currentTime += 0.2;
          }
        }
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn('[HLS] Network error, recovering...');
              hlsInstance?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn('[HLS] Media error, recovering...');
              hlsInstance?.recoverMediaError();
              break;
            default:
              console.error('[HLS] Fatal error:', data);
              hlsInstance?.destroy();
              setHasError(true);
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // 2. Safari / iOS için yerel HLS oynatımı
      video.src = streamUrl;
      attemptPlay();
    } else {
      video.src = streamUrl;
      attemptPlay();
    }

    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => setIsLoading(false);
    const handleLoadedData = () => setIsLoading(false);
    const handleEnded = () => {
      // Akış biterse otomatik yeniden başlat
      if (video && autoPlay) {
        video.play().catch(() => {});
      }
    };

    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('ended', handleEnded);
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    };
  }, [streamUrl, autoPlay]);

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        controls
        playsInline
        muted
        autoPlay={autoPlay}
        className={className}
      />
      {isLoading && !hasError && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <div className="flex flex-col items-center space-y-2">
            <RefreshCw className="w-6 h-6 text-red-500 animate-spin" />
            <span className="text-[11px] font-bold text-slate-300">Canlı Akış Yükleniyor...</span>
          </div>
        </div>
      )}
      {hasError && (
        <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-4 text-center space-y-2 z-10">
          <p className="text-xs text-rose-400 font-bold">Canlı akış yüklenirken hata oluştu.</p>
          <a
            href="https://www.youtube.com/@TJKTVCANLIYAYIN"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-black flex items-center space-x-1"
          >
            <span>Resmi YouTube'da Aç</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </div>
  );
};

// 📺 TJK TV Canlı Yayın Oynatıcısı (Sayfada Küçük Ekran & Tam Ekran Modalı)
export const LiveRacePlayer: React.FC<{
  mode: 'off' | 'mini' | 'modal';
  onSetMode: (mode: 'off' | 'mini' | 'modal') => void;
  race: RaceCard | null;
  programPlace?: string;
  allRaces?: RaceCard[];
  onSelectRace?: (raceNo: number) => void;
  programs?: HippodromeProgram[];
  selectedProgramId?: number | null;
  onSelectProgram?: (programId: number) => void;
}> = ({
  mode,
  onSetMode,
  race,
  programPlace,
  allRaces = [],
  onSelectRace,
  programs = [],
  selectedProgramId,
  onSelectProgram,
}) => {
  // TJK TV 1 (HD) HLS with LivePlaylistLoader cache-buster is the rock-solid default
  const [streamSource, setStreamSource] = useState<'tjktv1' | 'tjktv2' | 'youtube' | 'replay'>('tjktv1');
  const [liveVideoId, setLiveVideoId] = useState<string | null>(null);

  useEffect(() => {
    fetchLiveRaceStream()
      .then((data) => {
        if (data?.videoId) {
          setLiveVideoId(data.videoId);
        }
      })
      .catch(() => {});
  }, []);

  if (mode === 'off') return null;

  const hasReplayVideo = Boolean(race?.video);

  const getStreamUrl = () => {
    if (streamSource === 'replay' && race?.video) {
      return race.video;
    }
    if (streamSource === 'tjktv2') {
      return 'https://nesine-spinemedia-live.ercdn.net/yaristayiz2/yaristayiz2_720p.m3u8';
    }
    return 'https://nesine-spinemedia-live.ercdn.net/yaristayiz/yaristayiz_720p.m3u8';
  };

  const activeStreamUrl = getStreamUrl();

  // Canonical TJK TV YouTube Live stream embed (uses real live stream videoId when available)
  const youtubeEmbedUrl = liveVideoId
    ? `https://www.youtube-nocookie.com/embed/${liveVideoId}?autoplay=1&mute=0&rel=0&playsinline=1`
    : `https://www.youtube-nocookie.com/embed/live_stream?channel=UCNLO4lpteIloZ4IKb9L2DoA&autoplay=1&mute=0&rel=0&playsinline=1`;

  // 1. KÜÇÜK EKRAN MODU (Sayfada Köşede Kayan Mini Oynatıcı)
  if (mode === 'mini') {
    return (
      <div className="fixed bottom-20 sm:bottom-4 right-3 sm:right-4 z-50 w-72 sm:w-96 rounded-2xl bg-slate-900/95 border border-red-500/60 shadow-2xl overflow-hidden backdrop-blur-xl flex flex-col animate-in slide-in-from-bottom-4 duration-200">
        {/* Mini Player Header */}
        <div className="px-3 py-2 bg-slate-950/95 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-black text-white">
              {streamSource === 'tjktv1'
                ? 'TJK TV 1 Canlı HD'
                : streamSource === 'tjktv2'
                ? 'TJK TV 2 Canlı'
                : streamSource === 'replay'
                ? 'Koşu Tekrarı'
                : 'YouTube TJK'}
            </span>
            {race && (
              <span className="text-[10px] text-amber-400 font-mono font-bold">
                {race.number}. Koşu ({race.hour})
              </span>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => onSetMode('modal')}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Büyüt (Büyük Ekran Modalı)"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onSetMode('off')}
              className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Kapat"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Mini Video Embed */}
        <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
          {streamSource === 'youtube' ? (
            <iframe
              src={youtubeEmbedUrl}
              title="TJK TV Canlı Yayın"
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <TJKVideoPlayer streamUrl={activeStreamUrl} />
          )}
        </div>

        {/* Mini Footer Bar */}
        <div className="px-3 py-1.5 bg-slate-950/90 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setStreamSource('tjktv1')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                streamSource === 'tjktv1'
                  ? 'bg-red-600 text-white font-black shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              TJK 1
            </button>
            <button
              onClick={() => setStreamSource('tjktv2')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                streamSource === 'tjktv2'
                  ? 'bg-red-600 text-white font-black shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              TJK 2
            </button>
            <button
              onClick={() => setStreamSource('youtube')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                streamSource === 'youtube'
                  ? 'bg-red-600 text-white font-black shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              YouTube
            </button>
            {hasReplayVideo && (
              <button
                onClick={() => setStreamSource(s => s === 'replay' ? 'tjktv1' : 'replay')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                  streamSource === 'replay'
                    ? 'bg-emerald-500 text-slate-950 font-black'
                    : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                }`}
              >
                Tekrar
              </button>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onSetMode('modal')}
              className="text-amber-400 hover:text-amber-300 font-bold flex items-center space-x-1 cursor-pointer"
            >
              <span>Büyüt</span>
              <Maximize2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. BÜYÜK EKRAN MODAL MODU (Genişletilmiş Ekran + Koşu Seçici + Atlar & Oranlar Panosu)
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={() => onSetMode('off')}
    >
      <div
        className="w-full max-w-4xl max-h-[94vh] rounded-3xl bg-slate-900 border border-red-500/50 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-3 sm:p-4 bg-slate-950/95 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5">
                  <span>📺 TJK TV Canlı Yayın &amp; Koşu İzle</span>
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase flex items-center space-x-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-white inline-block mr-0.5" />
                  <span>CANLI YAYIN</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span className="font-bold text-amber-400">{programPlace}</span>
                <span>•</span>
                <span>{race ? `${race.number}. Koşu (${race.hour})` : 'TJK TV Canlı Akış'}</span>
                {race && (
                  <span className="text-[11px] text-slate-500">
                    ({race.distance}m {race.raceCourseType})
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-auto flex-wrap">
            {/* Stream source tabs */}
            <div className="flex rounded-xl bg-slate-950 p-0.5 border border-slate-800 text-xs">
              <button
                onClick={() => setStreamSource('tjktv1')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center space-x-1 ${
                  streamSource === 'tjktv1'
                    ? 'bg-red-600 text-white shadow-sm font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span>TJK 1 (HD)</span>
              </button>
              <button
                onClick={() => setStreamSource('tjktv2')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  streamSource === 'tjktv2'
                    ? 'bg-red-600 text-white font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                TJK 2
              </button>
              <button
                onClick={() => setStreamSource('youtube')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  streamSource === 'youtube'
                    ? 'bg-red-600 text-white font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                YouTube
              </button>
              {hasReplayVideo && (
                <button
                  onClick={() => setStreamSource('replay')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    streamSource === 'replay'
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Koşu Tekrarı
                </button>
              )}
            </div>

            <button
              onClick={() => onSetMode('mini')}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center space-x-1 cursor-pointer transition-colors"
              title="Sayfada Küçük Ekrana Al"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Küçük Ekran</span>
            </button>
            <button
              onClick={() => onSetMode('off')}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition-colors"
              title="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Player Container */}
        <div className="relative w-full bg-black aspect-video flex items-center justify-center overflow-hidden">
          {streamSource === 'youtube' ? (
            <iframe
              src={youtubeEmbedUrl}
              title="TJK TV Canlı Yayın"
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <TJKVideoPlayer streamUrl={activeStreamUrl} />
          )}
        </div>

        {/* 🏇 Koşular & Hipodrom Seçici Bar (Yayındaki Koşu ile Anında Eşleştirme) */}
        {allRaces.length > 0 && (
          <div className="px-3 py-2 bg-slate-950/98 border-t border-slate-800/90 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none shrink-0">
            <div className="flex items-center space-x-1.5 shrink-0">
              <span className="text-[11px] font-black text-amber-400 flex items-center gap-1 shrink-0 mr-1">
                <Timer className="w-3.5 h-3.5" />
                <span>Koşular:</span>
              </span>
              {allRaces.map((r) => {
                const isCurrent = race?.number === r.number;
                return (
                  <button
                    key={r.number}
                    onClick={() => onSelectRace?.(r.number)}
                    className={`shrink-0 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                      isCurrent
                        ? 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/30 ring-1 ring-amber-300 scale-105'
                        : r.isFinished
                        ? 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                        : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    <span>{r.number}. Koşu</span>
                    <span className="text-[10px] opacity-80 font-mono">({r.hour})</span>
                    {r.isFinished ? (
                      <span className="text-[10px] opacity-70">✓</span>
                    ) : !isCurrent ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    ) : null}
                  </button>
                );
              })}
            </div>

            {/* Hipodrom Switcher if multiple programs available */}
            {programs.length > 1 && onSelectProgram && (
              <div className="flex items-center space-x-1 shrink-0 pl-2 border-l border-slate-800">
                {programs.filter(p => !p.isForeign).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onSelectProgram(p.id)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                      selectedProgramId === p.id
                        ? 'bg-rose-600 text-white font-black shadow-sm'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                    }`}
                  >
                    {p.place}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Live Race Runners & Ganyan Ticker Bar */}
        {race && race.horses && (
          <div className="p-3 bg-slate-950/95 border-t border-slate-800 space-y-2 overflow-y-auto max-h-48 shrink">
            <div className="flex items-center justify-between text-xs sticky top-0 bg-slate-950/95 pb-1 z-10">
              <span className="font-black text-amber-400 flex items-center space-x-1">
                <span>🏇 {race.number}. Koşu Atları &amp; Canlı Oranları</span>
                <span className="text-slate-500 font-normal">({race.distance}m {race.raceCourseType})</span>
              </span>
              <div className="flex items-center space-x-3">
                <a
                  href="https://www.youtube.com/@TJKTVCANLIYAYIN"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-slate-400 hover:text-red-400 flex items-center space-x-1 font-bold"
                >
                  <span>Resmi YouTube</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 pb-1">
              {race.horses.map((h) => {
                const isScr = h.status === false;
                return (
                  <div
                    key={h.number}
                    className={`shrink-0 px-2.5 py-1.5 rounded-xl border text-xs flex items-center space-x-2 ${isScr
                      ? 'bg-rose-950/20 border-rose-500/20 text-rose-400 line-through opacity-60'
                      : h.order === 1
                        ? 'bg-emerald-500/20 border-emerald-400/50 text-white font-black'
                        : 'bg-slate-900 border-slate-800 text-slate-200'
                      }`}
                  >
                    <span className="w-6 h-6 rounded-lg bg-slate-800 text-amber-400 font-mono font-black flex items-center justify-center text-xs">
                      #{h.number}
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold truncate max-w-[110px] text-white leading-tight">
                        {h.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <span className="text-amber-300 font-bold">
                          {h.ganyan > 0
                            ? `${h.ganyan.toFixed(2)} ₺`
                            : h.fobOdd
                            ? `${h.fobOdd.toFixed(2)} ₺`
                            : h.agf?.[0]?.percentage
                            ? `%${h.agf[0].percentage} AGF`
                            : '-'}
                        </span>
                        {h.jockey?.name && (
                          <span className="text-slate-500 truncate max-w-[70px]">
                            ({h.jockey.name})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export interface HorseRacingViewProps {
  user?: User | null;
  onOpenVIP?: () => void;
  onShowToast?: (msg: string, type?: 'success' | 'info' | 'warning') => void;
  activeSubTab?: HRSubTab;
  onChangeSubTab?: (tab: HRSubTab) => void;
  initialTarget?: {
    programId?: number;
    raceNo?: number;
    horseNumber?: number;
    timestamp?: number;
  } | null;
}

export const HorseRacingView: React.FC<HorseRacingViewProps> = ({
  user,
  onOpenVIP,
  onShowToast,
  activeSubTab,
  onChangeSubTab,
  initialTarget,
}) => {
  const [programs, setPrograms] = useState<HippodromeProgram[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(() => {
    try {
      const savedDate = localStorage.getItem('proanaliz_hr_selected_date');
      const todayStr = new Date().toISOString().split('T')[0];
      if (savedDate && savedDate !== todayStr) {
        localStorage.removeItem('proanaliz_hr_selected_pid');
        localStorage.removeItem('proanaliz_hr_selected_raceno');
        localStorage.setItem('proanaliz_hr_selected_date', todayStr);
        return null;
      }
      const saved = localStorage.getItem('proanaliz_hr_selected_pid');
      return saved ? Number(saved) : null;
    } catch {
      return null;
    }
  });
  const [detail, setDetail] = useState<ProgramDetail | null>(null);
  const [selectedRaceNo, setSelectedRaceNo] = useState<number>(() => {
    try {
      const savedDate = localStorage.getItem('proanaliz_hr_selected_date');
      const todayStr = new Date().toISOString().split('T')[0];
      if (savedDate && savedDate !== todayStr) return 1;
      const saved = localStorage.getItem('proanaliz_hr_selected_raceno');
      return saved ? Number(saved) : 1;
    } catch {
      return 1;
    }
  });
  const [selectedGameId, setSelectedGameId] = useState<string>('ALTILI_1');
  const [subTabState, setSubTabState] = useState<HRSubTab>(activeSubTab || 'bulletin');

  useEffect(() => {
    if (activeSubTab && activeSubTab !== subTabState) {
      setSubTabState(activeSubTab);
    }
  }, [activeSubTab]);

  const subTab = activeSubTab || subTabState;
  const setSubTab = (t: HRSubTab) => {
    setSubTabState(t);
    onChangeSubTab?.(t);
  };
  const [sortMode, setSortMode] = useState<SortMode>('number');
  const [loading, setLoading] = useState<boolean>(true);
  const [programLoading, setProgramLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [expandedHorse, setExpandedHorse] = useState<number | null>(null);
  const [isHorseAIChatOpen, setIsHorseAIChatOpen] = useState<boolean>(false);
  const [hippodromeTab, setHippodromeTab] = useState<'tr' | 'foreign'>('tr');
  const [isMobileCouponDrawerOpen, setIsMobileCouponDrawerOpen] = useState<boolean>(false);
  const [livePlayerMode, setLivePlayerMode] = useState<'off' | 'mini' | 'modal'>('off');

  // Kupon state: programId -> { raceNo -> horseNumbers[] } (persisted across pull-to-refresh & app reloads)
  const handleToggleLivePlayer = () => {
    if (livePlayerMode !== 'off') {
      setLivePlayerMode('off');
      return;
    }
    // Auto-advance to the upcoming active race if the currently selected race has concluded
    if (detail?.races) {
      const nextOpen = detail.races.find((r) => !r.isFinished);
      if (nextOpen && activeRace?.isFinished) {
        setSelectedRaceNo(nextOpen.number);
      }
    }
    setLivePlayerMode('modal');
  };
  const [selectionsByProgram, setSelectionsByProgram] = useState<
    Record<number, Record<number, number[]>>
  >(() => {
    try {
      const saved = localStorage.getItem('proanaliz_hr_active_selections');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [misli, setMisli] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(1.0);
  const [savedCoupons, setSavedCoupons] = useState<SavedHorseCoupon[]>(() => {
    try {
      const raw = localStorage.getItem('proanaliz_hr_coupons');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [isSavedCouponsModalOpen, setIsSavedCouponsModalOpen] = useState<boolean>(false);
  const [mobileDrawerTab, setMobileDrawerTab] = useState<'current' | 'saved'>('current');
  const [sidebarTab, setSidebarTab] = useState<'active' | 'saved'>('active');

  // Automatically persist race coupon selections to survive pull-to-refresh
  useEffect(() => {
    try {
      localStorage.setItem('proanaliz_hr_active_selections', JSON.stringify(selectionsByProgram));
    } catch { }
  }, [selectionsByProgram]);

  useEffect(() => {
    if (selectedProgramId) {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        localStorage.setItem('proanaliz_hr_selected_date', todayStr);
        localStorage.setItem('proanaliz_hr_selected_pid', String(selectedProgramId));
      } catch { }
    }
  }, [selectedProgramId]);

  useEffect(() => {
    if (selectedRaceNo) {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        localStorage.setItem('proanaliz_hr_selected_date', todayStr);
        localStorage.setItem('proanaliz_hr_selected_raceno', String(selectedRaceNo));
      } catch { }
    }
  }, [selectedRaceNo]);

  // Deep-link from HomeHub or external trigger: navigate directly to target program, race and horse
  useEffect(() => {
    if (!initialTarget || !initialTarget.timestamp) return;
    const applyTarget = async () => {
      setSubTab('bulletin');
      if (initialTarget.programId && (selectedProgramId !== initialTarget.programId || detail?.program.id !== initialTarget.programId)) {
        setSelectedProgramId(initialTarget.programId);
        setProgramLoading(true);
        try {
          const d = await fetchHorseRacingProgram(initialTarget.programId, false);
          setDetail(d);
          if (initialTarget.raceNo) {
            setSelectedRaceNo(initialTarget.raceNo);
          }
          if (initialTarget.horseNumber) {
            setExpandedHorse(initialTarget.horseNumber);
          }
        } catch {
        } finally {
          setProgramLoading(false);
        }
        return;
      }
      if (initialTarget.raceNo) {
        setSelectedRaceNo(initialTarget.raceNo);
      }
      if (initialTarget.horseNumber) {
        setExpandedHorse(initialTarget.horseNumber);
      }
    };
    applyTarget();
  }, [initialTarget]);

  // Initial bulletin fetch + auto live poll every 30s if active races exist
  const loadBulletin = async (targetPid?: number | null, force = false) => {
    try {
      if (!detail) setLoading(true);
      setErrorMsg(null);
      const resp = await fetchHorseRacingBulletin(targetPid, force);
      if (resp.programs && resp.programs.length > 0) {
        setPrograms(resp.programs);
      }
      const isTargetValid = targetPid && (resp.programs || []).some((p) => p.id === targetPid);
      const pid = isTargetValid ? targetPid : (resp.selectedProgramId || resp.programs?.[0]?.id || selectedProgramId || null);
      if (pid) setSelectedProgramId(pid);
      if (resp.activeProgramDetail) {
        setDetail(resp.activeProgramDetail);
        const nextActiveRace = resp.activeProgramDetail.races.find((r) => !r.isFinished);
        const firstRace = resp.activeProgramDetail.races[0]?.number || 1;
        const savedRace = (() => {
          try {
            const r = localStorage.getItem('proanaliz_hr_selected_raceno');
            return r ? Number(r) : null;
          } catch { return null; }
        })();
        const raceToSelect = (savedRace && resp.activeProgramDetail.races.some((r) => r.number === savedRace && !r.isFinished))
          ? savedRace
          : (nextActiveRace?.number || firstRace);
        if (force === false) {
          setSelectedRaceNo(raceToSelect);
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Canlı TJK verisi şu anda alınamıyor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedPid = (() => {
      try {
        const saved = localStorage.getItem('proanaliz_hr_selected_pid');
        return saved ? Number(saved) : null;
      } catch {
        return null;
      }
    })();
    loadBulletin(savedPid, false);
    const timer = setInterval(() => {
      if (selectedProgramId) {
        fetchHorseRacingProgram(selectedProgramId, false)
          .then((d) => setDetail(d))
          .catch(() => { });
      }
    }, 30000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectProgram = async (pid: number) => {
    if (pid === selectedProgramId && detail?.program.id === pid) return;
    setSelectedProgramId(pid);
    setProgramLoading(true);
    setExpandedHorse(null);
    try {
      const d = await fetchHorseRacingProgram(pid, false);
      setDetail(d);
      const firstOpen = d.races.find((r) => !r.isFinished) || d.races[0];
      setSelectedRaceNo(firstOpen ? firstOpen.number : 1);
      const games = getAvailableGames(d);
      if (games.length > 0 && !games.some((g) => g.id === selectedGameId)) {
        setSelectedGameId(games[0].id);
      }
    } catch (err: any) {
      onShowToast?.(err?.message || 'Program yüklenemedi', 'warning');
    } finally {
      setProgramLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    setProgramLoading(true);
    try {
      await loadBulletin(selectedProgramId, false);
      onShowToast?.('TJK Bülteni ve Canlı Koşular Güncellendi', 'success');
    } catch {
      onShowToast?.('Yenileme sırasında bağlantı hatası', 'warning');
    } finally {
      setProgramLoading(false);
    }
  };

  const availableGames = useMemo(() => getAvailableGames(detail), [detail]);
  const activeGame: GameConfig | null = useMemo(() => {
    return availableGames.find((g) => g.id === selectedGameId) || availableGames[0] || null;
  }, [availableGames, selectedGameId]);

  const activeRace: RaceCard | null = useMemo(() => {
    if (!detail) return null;
    return detail.races.find((r) => r.number === selectedRaceNo) || detail.races[0] || null;
  }, [detail, selectedRaceNo]);

  const aiAnalysisMap = useMemo(() => analyzeRaceHorses(activeRace), [activeRace]);

  const currentSelections: Record<number, number[]> = useMemo(() => {
    if (!selectedProgramId) return {};
    return selectionsByProgram[selectedProgramId] || {};
  }, [selectionsByProgram, selectedProgramId]);

  // Günün Hipodrom AI Zirvesi (Günün En Sağlam Teki & Günün Cazip Bombası)
  const dayHighlights = useMemo(() => {
    if (!detail || !detail.races || detail.races.length === 0) return null;

    let bestBanko: { race: RaceCard; horse: HorseRunner; agfPct: number } | null = null;
    let maxBankoScore = -1;

    let bestBomba: { race: RaceCard; horse: HorseRunner; agfPct: number } | null = null;
    let maxBombaScore = -1;

    for (const r of detail.races) {
      for (const h of r.horses) {
        const agfInfo = getHorsePrimaryAgf(h);
        const agfPct = agfInfo?.percentage || 0;
        const hp = parseInt(h.handicap || '0', 10) || 0;
        const isBankoTag = (h as any).tag === 'BANKO';
        const bankoScore = (isBankoTag ? 60 : 0) + agfPct * 1.5 + hp * 0.2;

        if (bankoScore > maxBankoScore && (isBankoTag || agfPct >= 20)) {
          maxBankoScore = bankoScore;
          bestBanko = { race: r, horse: h, agfPct };
        }

        const isBombaTag = (h as any).tag === 'BOMBA' || (h as any).tag === 'SÜRPRİZ';
        const bombaScore = (isBombaTag ? 70 : 0) + (agfPct >= 4 && agfPct <= 18 ? 35 : 0) + hp * 0.25;

        if (bombaScore > maxBombaScore && (isBombaTag || (agfPct >= 5 && agfPct <= 16))) {
          if (!bestBanko || bestBanko.horse.number !== h.number || bestBanko.race.number !== r.number) {
            maxBombaScore = bombaScore;
            bestBomba = { race: r, horse: h, agfPct };
          }
        }
      }
    }

    if (!bestBanko) return null;
    return { banko: bestBanko, bomba: bestBomba };
  }, [detail]);

  const toggleHorsePick = (raceNo: number, horseNo: number) => {
    if (!selectedProgramId) return;
    setSelectionsByProgram((prev) => {
      const progMap = { ...(prev[selectedProgramId] || {}) };
      const existing = progMap[raceNo] || [];
      const next = existing.includes(horseNo)
        ? existing.filter((n) => n !== horseNo)
        : [...existing, horseNo].sort((a, b) => a - b);
      if (next.length === 0) {
        delete progMap[raceNo];
      } else {
        progMap[raceNo] = next;
      }
      return { ...prev, [selectedProgramId]: progMap };
    });
  };

  const setRacePicks = (raceNo: number, horseNums: number[]) => {
    if (!selectedProgramId) return;
    setSelectionsByProgram((prev) => {
      const progMap = { ...(prev[selectedProgramId] || {}) };
      if (horseNums.length === 0) {
        delete progMap[raceNo];
      } else {
        progMap[raceNo] = [...new Set(horseNums)].sort((a, b) => a - b);
      }
      return { ...prev, [selectedProgramId]: progMap };
    });
  };

  const clearProgramCoupon = () => {
    if (!selectedProgramId) return;
    setSelectionsByProgram((prev) => ({ ...prev, [selectedProgramId]: {} }));
  };

  const toggleAllActiveHorsesInRace = () => {
    if (!activeRace) return;
    const validNums = activeRace.horses.filter((h) => h.status !== false).map((h) => h.number);
    const current = currentSelections[activeRace.number] || [];
    if (current.length === validNums.length) {
      setRacePicks(activeRace.number, []);
    } else {
      setRacePicks(activeRace.number, validNums);
    }
  };

  const pickAITopNInRace = (n: number) => {
    if (!activeRace) return;
    const ranked = Array.from(aiAnalysisMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, n)
      .map((x) => x.horseNumber);
    setRacePicks(activeRace.number, ranked);
  };

  // Real-time race countdown ticker (Ticked every 15s to maintain 60fps buttery smooth performance)
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeMs(Date.now());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const raceCountdown = useMemo(() => {
    if (!activeRace) return null;
    if (activeRace.isFinished) {
      return { text: 'Koşu Tamamlandı', status: 'finished' };
    }
    const hourStr = String(activeRace.hour || '').trim();
    if (!hourStr || !hourStr.includes(':')) {
      return null;
    }
    const [h, m] = hourStr.split(':').map((x) => parseInt(x, 10));
    if (isNaN(h) || isNaN(m)) return null;

    // Current Istanbul Date & Time
    const trNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));
    const target = new Date(trNow);
    target.setHours(h, m, 0, 0);

    const diffMs = target.getTime() - trNow.getTime();
    if (diffMs <= 0) {
      if (diffMs > -10 * 60 * 1000) {
        return { text: 'Koşu Başladı / Canlı', status: 'live' };
      }
      return { text: 'Koşu Tamamlandı', status: 'finished' };
    }

    const totalSec = Math.floor(diffMs / 1000);
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;

    let timeFormatted = '';
    if (hrs > 0) {
      timeFormatted = `${hrs} sa ${mins} dk`;
    } else {
      timeFormatted = `${mins} dk ${secs < 10 ? '0' : ''}${secs} sn`;
    }

    return {
      text: timeFormatted,
      status: totalSec <= 600 ? 'urgent' : 'upcoming',
      totalSec,
    };
  }, [activeRace, currentTimeMs]);

  const sortedHorses: HorseRunner[] = useMemo(() => {
    if (!activeRace) return [];
    const list = [...activeRace.horses];
    list.sort((a, b) => {
      // Push scratched runners to the bottom unless finished race ordered them
      if (a.status !== b.status && !activeRace.isFinished) {
        return a.status ? -1 : 1;
      }
      if (sortMode === 'agf') {
        return getHorsePrimaryAgf(b).percentage - getHorsePrimaryAgf(a).percentage;
      }
      if (sortMode === 'ganyan') {
        const ga = a.ganyan > 0 ? a.ganyan : 9999;
        const gb = b.ganyan > 0 ? b.ganyan : 9999;
        return ga - gb;
      }
      if (sortMode === 'handicap') {
        return (parseInt(b.handicap || '0', 10) || 0) - (parseInt(a.handicap || '0', 10) || 0);
      }
      if (sortMode === 'ai') {
        const sa = aiAnalysisMap.get(a.number)?.score || 0;
        const sb = aiAnalysisMap.get(b.number)?.score || 0;
        return sb - sa;
      }
      // Default: finish order if completed, else number
      if (activeRace.isFinished && (a.order > 0 || b.order > 0)) {
        if (a.order > 0 && b.order > 0) return a.order - b.order;
        if (a.order > 0) return -1;
        if (b.order > 0) return 1;
      }
      return a.number - b.number;
    });
    return list;
  }, [activeRace, sortMode, aiAnalysisMap]);

  const aiCoupons = useMemo(
    () => generateAICoupons(detail, activeGame),
    [detail, activeGame]
  );

  const activeGameStatus = useMemo(
    () => checkGameClosedStatus(detail, activeGame, availableGames),
    [detail, activeGame, availableGames]
  );

  const ikiliPicks = useMemo(
    () => generateDailyIkiliAndCifte(detail),
    [detail]
  );

  const applyGeneratedCoupon = (coupon: GeneratedAltiliCoupon) => {
    if (!selectedProgramId) return;

    // 🛑 Koşu & Bahis Kontrolü: 1. ayak başladıysa veya bittiyse kuponu yükleme, kullanıcıyı uyar!
    const targetGame = availableGames.find((g) => g.id === coupon.gameType) || activeGame;
    const gameStatus = checkGameClosedStatus(detail, targetGame, availableGames);
    if (gameStatus.isClosed) {
      onShowToast?.(
        `⚠️ ${gameStatus.message || 'Bu oyunun 1. ayağı başladığı için TJK bahis kabulü kapandı! Kupon yapılamaz.'}`,
        'warning'
      );
      return;
    }

    setSelectedGameId(coupon.gameType);
    setSelectionsByProgram((prev) => {
      const progMap: Record<number, number[]> = { ...(prev[selectedProgramId] || {}) };
      coupon.legs.forEach((leg) => {
        progMap[leg.raceNumber] = [...leg.horses].sort((a, b) => a - b);
      });
      return { ...prev, [selectedProgramId]: progMap };
    });
    setSubTab('bulletin');
    if (coupon.legs[0]) {
      setSelectedRaceNo(coupon.legs[0].raceNumber);
    }
    onShowToast?.(`${coupon.title} kupona yüklendi!`, 'success');
  };

  const loadAICouponToSlip = (couponId: string) => {
    const found = aiCoupons.find((c) => c.id === couponId);
    if (found) applyGeneratedCoupon(found);
  };

  const legRaceNumbers = useMemo(
    () => (activeGame ? getLegRaceNumbers(activeGame) : []),
    [activeGame]
  );

  const totalCombinations = useMemo(
    () => calculateCouponCombinations(currentSelections, legRaceNumbers),
    [currentSelections, legRaceNumbers]
  );
  const totalCouponCost = Number((totalCombinations * unitPrice * misli).toFixed(2));
  const totalPicksInCoupon = useMemo(() => {
    return legRaceNumbers.reduce(
      (sum, rNo) => sum + (currentSelections[rNo]?.length || 0),
      0
    );
  }, [legRaceNumbers, currentSelections]);

  const handleSaveCoupon = () => {
    if (!activeGame || !detail || totalCombinations === 0) return;
    const legStr = legRaceNumbers
      .map((rNo) => (currentSelections[rNo] || []).join(','))
      .join(' / ');
    const legs: SavedHorseCouponLeg[] = legRaceNumbers.map((rNo) => ({
      raceNo: rNo,
      picks: [...(currentSelections[rNo] || [])],
    }));
    const entry: SavedHorseCoupon = {
      id: `${Date.now()}`,
      programId: detail.program.id,
      programPlace: detail.program.place,
      programDate: detail.program.date,
      gameKey: activeGame.id,
      gameLabel: activeGame.label,
      title: `${detail.program.place} • ${activeGame.label}`,
      combos: totalCombinations,
      cost: totalCouponCost,
      misli,
      stakeStr: legStr,
      time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      createdAt: Date.now(),
      legs,
    };
    const next = [entry, ...savedCoupons].slice(0, 25);
    setSavedCoupons(next);
    try {
      localStorage.setItem('proanaliz_hr_coupons', JSON.stringify(next));
    } catch { }
    onShowToast?.(
      `${entry.title} kaydedildi (${totalCombinations} kolon • ${totalCouponCost.toFixed(2)} ₺)`,
      'success'
    );
  };

  const handleDeleteSavedCoupon = (id: string) => {
    const next = savedCoupons.filter((c) => c.id !== id);
    setSavedCoupons(next);
    try {
      localStorage.setItem('proanaliz_hr_coupons', JSON.stringify(next));
    } catch { }
    onShowToast?.('Kupon silindi.', 'info');
  };

  const handleClearAllSavedCoupons = () => {
    if (window.confirm('Tüm kayıtlı kuponlarınızı silmek istediğinize emin misiniz?')) {
      setSavedCoupons([]);
      try {
        localStorage.removeItem('proanaliz_hr_coupons');
      } catch { }
      onShowToast?.('Tüm kayıtlı kuponlar temizlendi.', 'info');
    }
  };

  const handleLoadCouponIntoWorkspace = (coupon: SavedHorseCoupon) => {
    const legs = normalizeCouponLegs(coupon, legRaceNumbers);
    const newSelections: { [raceNo: number]: number[] } = {};
    legs.forEach((leg) => {
      newSelections[leg.raceNo] = [...leg.picks];
    });
    setSelectionsByProgram((prev) => ({
      ...prev,
      [coupon.programId || selectedProgramId || 0]: newSelections,
    }));
    if (coupon.misli) {
      setMisli(coupon.misli);
    }
    if (coupon.programId && coupon.programId !== selectedProgramId) {
      handleSelectProgram(coupon.programId);
    }
    setSidebarTab('active');
    setMobileDrawerTab('current');
    onShowToast?.(`"${coupon.title}" kuponu bültene yüklendi!`, 'success');
    setIsSavedCouponsModalOpen(false);
    setIsMobileCouponDrawerOpen(false);
  };

  const trPrograms = useMemo(() => programs.filter((p) => !p.isForeign), [programs]);
  const foreignPrograms = useMemo(() => programs.filter((p) => p.isForeign), [programs]);

  const getTagBadgeClass = (tag?: HorseAIAnalysis['tag']) => {
    switch (tag) {
      case 'BANKO':
        return 'bg-amber-400 text-slate-950 border-amber-300 font-black';
      case 'ALTERNATİF':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-extrabold';
      case 'SÜRPRİZ':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold';
      case 'BOMBA':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700 font-semibold';
    }
  };

  const getLast6ChipClass = (res: string) => {
    if (res === '1') return 'bg-emerald-500 text-slate-950 font-black';
    if (res === '2') return 'bg-amber-400 text-slate-950 font-black';
    if (res === '3') return 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 font-bold';
    return 'bg-slate-800/90 text-slate-400 font-medium';
  };

  if (loading && !detail) {
    return (
      <div className="rounded-3xl bg-slate-900/70 border border-slate-800 p-10 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center animate-pulse">
          <Trophy className="w-6 h-6 text-amber-400" />
        </div>
        <div className="text-base font-black text-white">TJK &amp; Nesine Canlı At Yarışı Bülteni Yükleniyor...</div>
        <div className="text-xs text-slate-400">
          Hipodrom programları, AGF oranları, jokey bilgileri ve ganyanlar senkronize ediliyor.
        </div>
      </div>
    );
  }

  if (errorMsg && !detail) {
    return (
      <div className="rounded-3xl bg-rose-950/30 border border-rose-500/30 p-8 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
        <div className="text-sm font-bold text-rose-200">{errorMsg}</div>
        <button
          onClick={() => loadBulletin(null, true)}
          className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-black text-xs cursor-pointer hover:bg-amber-300 transition-colors"
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 1. NESINE STYLE TOP HIPPODROME SELECTOR STRIP */}
      <section className="rounded-2xl bg-slate-900/90 border border-slate-800/90 p-2.5 sm:p-3.5 shadow-xl space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded-lg bg-amber-400 text-slate-950 font-black text-[11px] tracking-wide flex items-center space-x-1">
              <span>🏇</span>
              <span>TJK BÜLTEN</span>
            </span>
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{detail?.program?.date ? `📅 ${detail.program.date}` : 'Canlı Bülten'}</span>
            </span>
            <span className="text-xs text-slate-400 font-medium hidden md:inline">
              • Canlı AGF &amp; AI Altılı Motoru
            </span>
          </div>
          <div className="flex items-center space-x-1.5 flex-wrap gap-1">
            <button
              onClick={() => setIsSavedCouponsModalOpen(true)}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-amber-300 font-bold text-xs cursor-pointer transition-all"
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Kayıtlı Kuponlar</span>
              {savedCoupons.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                  {savedCoupons.length}
                </span>
              )}
            </button>
            <button
              onClick={handleToggleLivePlayer}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 font-extrabold text-xs cursor-pointer transition-all"
            >
              <Tv className="w-3.5 h-3.5 text-red-400" />
              <span>{livePlayerMode !== 'off' ? 'TV Kapat' : 'TJK TV'}</span>
            </button>
            <button
              onClick={handleManualRefresh}
              disabled={programLoading}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-300 font-bold text-xs cursor-pointer transition-all disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${programLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Canlı Yenile</span>
            </button>
          </div>
        </div>

        {/* Mobile Hippodrome Segmented Switch */}
        <div className="md:hidden flex rounded-xl bg-slate-950/80 p-0.5 border border-slate-800 gap-1">
          <button
            onClick={() => setHippodromeTab('tr')}
            className={`flex-1 py-1 rounded-lg text-xs font-black transition-all flex items-center justify-center space-x-1.5 ${hippodromeTab === 'tr'
              ? 'bg-amber-400 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
              }`}
          >
            <Flag className="w-3 h-3" />
            <span>Türkiye ({trPrograms.length})</span>
          </button>
          <button
            onClick={() => setHippodromeTab('foreign')}
            className={`flex-1 py-1 rounded-lg text-xs font-black transition-all flex items-center justify-center space-x-1.5 ${hippodromeTab === 'foreign'
              ? 'bg-cyan-400 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
              }`}
          >
            <Globe className="w-3 h-3" />
            <span>Yurt Dışı ({foreignPrograms.length})</span>
          </button>
        </div>

        {/* Domestic Hippodromes */}
        {trPrograms.length > 0 && (
          <div className={`space-y-1 ${hippodromeTab !== 'tr' ? 'hidden md:block' : ''}`}>
            <div className="hidden md:flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-wider text-amber-400">
              <Flag className="w-3 h-3" />
              <span>Yurt İçi Hipodromlar (Türkiye)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1.5">
              {trPrograms.map((p) => {
                const isSel = p.id === selectedProgramId;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectProgram(p.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${isSel
                      ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 border-amber-300 shadow-md shadow-amber-500/20'
                      : 'bg-slate-950/70 hover:bg-slate-800/80 text-white border-slate-800'
                      }`}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="font-black text-xs truncate">{p.place}</span>
                      {!p.isCompleted ? (
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-black ${isSel ? 'bg-slate-950 text-emerald-400' : 'bg-emerald-500/20 text-emerald-300'
                            }`}
                        >
                          {p.beginRaceHour === 'Yarın' || p.beginRaceHour === 'Cuma' ? p.beginRaceHour : 'AÇIK'}
                        </span>
                      ) : (
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${isSel ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
                            }`}
                        >
                          BİTTİ
                        </span>
                      )}
                    </div>
                    <div
                      className={`text-[10px] mt-0.5 font-semibold flex items-center justify-between ${isSel ? 'text-slate-900' : 'text-slate-400'
                        }`}
                    >
                      <span>{p.date}</span>
                      <span>
                        {p.openingHour}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Foreign Hippodromes */}
        {foreignPrograms.length > 0 && (
          <div className={`space-y-1 ${hippodromeTab !== 'foreign' ? 'hidden md:block' : ''}`}>
            <div className="hidden md:flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-wider text-cyan-400">
              <Globe className="w-3 h-3" />
              <span>Yurt Dışı Hipodromlar</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1.5">
              {foreignPrograms.map((p) => {
                const isSel = p.id === selectedProgramId;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectProgram(p.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${isSel
                      ? 'bg-cyan-400 text-slate-950 border-cyan-300 font-black shadow-md shadow-cyan-500/20'
                      : 'bg-slate-950/60 hover:bg-slate-800 text-slate-200 border-slate-800'
                      }`}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="font-bold text-[11px] truncate">{p.place}</span>
                      {!p.isCompleted ? (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${isSel ? 'bg-slate-950' : 'bg-emerald-400 animate-pulse'
                            }`}
                        />
                      ) : null}
                      <span className={`text-[10px] font-mono shrink-0 ${isSel ? 'text-slate-900' : 'text-slate-400'}`}>
                        {p.openingHour}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {detail && (
        <>
          {/* 2. PROGRAM META + SUB-NAVIGATION + GAME TYPE SELECTOR */}
          <section className="rounded-2xl bg-slate-900/80 border border-slate-800 p-3 sm:p-4 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                    {detail.program.name}
                  </h2>
                  {detail.program.totalDay > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-bold">
                      {detail.program.totalDay}. Yarış Günü
                    </span>
                  )}
                  {detail.program.hasActiveFOBBet && (
                    <span className="px-2 py-0.5 rounded-md bg-purple-500/20 border border-purple-400/30 text-purple-300 text-[10px] font-black">
                      SABİT İHTİMALLİ AKTİF
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                  {detail.program.raceCourse.map((rc) => (
                    <span key={rc.type} className="flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <strong className="text-slate-200">{rc.type}:</strong>
                      <span>
                        {rc.status}
                        {rc.weight > 0 ? ` (${rc.weight})` : ''}
                      </span>
                    </span>
                  ))}
                  {detail.program.weather?.text && (
                    <span className="flex items-center space-x-1">
                      <CloudSun className="w-3.5 h-3.5 text-amber-300" />
                      <span>
                        {detail.program.weather.temperature}°C {detail.program.weather.text}
                        {detail.program.weather.humidity ? ` • %${detail.program.weather.humidity} Nem` : ''}
                      </span>
                    </span>
                  )}
                </div>
              </div>

              {/* Main View Sub-Tabs (Sadeleştirilmiş 3 Temel Başlık) */}
              <div className="flex items-center gap-1.5 w-full md:w-auto">
                <button
                  onClick={() => setSubTab('bulletin')}
                  className={`flex-1 md:flex-initial flex items-center justify-center space-x-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black border transition-all cursor-pointer ${subTab === 'bulletin'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-950/70 hover:bg-slate-800 text-slate-300 border-slate-800'
                    }`}
                >
                  <Ticket className="w-4 h-4 shrink-0" />
                  <span>Bülten &amp; Kupon</span>
                </button>

                <button
                  onClick={() => setSubTab(subTab === 'ikili_cifte' ? 'ikili_cifte' : 'ai_coupons')}
                  className={`flex-1 md:flex-initial flex items-center justify-center space-x-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black border transition-all cursor-pointer ${subTab === 'ai_coupons' || subTab === 'ikili_cifte'
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md shadow-amber-500/20 font-black'
                    : 'bg-slate-950/70 hover:bg-slate-800 text-slate-300 border-slate-800'
                    }`}
                >
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>AI Hazır Kuponlar</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${subTab === 'ai_coupons' || subTab === 'ikili_cifte' ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-slate-300'}`}>
                    {aiCoupons.length + ikiliPicks.length}
                  </span>
                </button>

                <button
                  onClick={() => setSubTab(subTab === 'changes' ? 'changes' : 'results')}
                  className={`flex-1 md:flex-initial flex items-center justify-center space-x-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black border transition-all cursor-pointer ${subTab === 'results' || subTab === 'changes'
                    ? 'bg-cyan-400 text-slate-950 border-cyan-300 shadow-md shadow-cyan-500/20 font-black'
                    : 'bg-slate-950/70 hover:bg-slate-800 text-slate-300 border-slate-800'
                    }`}
                >
                  <Trophy className="w-4 h-4 shrink-0" />
                  <span>Sonuçlar &amp; TV</span>
                  {(detail.scratches.length + detail.jockeyChanges.length) > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black">
                      {detail.scratches.length + detail.jockeyChanges.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Game Type Selector Pills (1. 6'lı, 2. 6'lı, 5'li, 4'lü, 7'li Plase...) */}
            {availableGames.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/80">
                <span className="text-[11px] font-black text-slate-400 mr-1">Oyun Türü:</span>
                {availableGames.map((g) => {
                  const isAct = activeGame?.id === g.id;
                  return (
                    <button
                      key={g.id}
                      onClick={() => {
                        setSelectedGameId(g.id);
                        setSelectedRaceNo(g.startRace);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border transition-all cursor-pointer ${isAct
                        ? 'bg-amber-400/20 text-amber-300 border-amber-400/60'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                    >
                      {g.label} <span className="opacity-70 font-normal">({g.startRace}–{g.startRace + g.legCount - 1}. Koşu)</span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* 🏁 Toplu Altılı Ganyan Canlı Sonuçları & Ganyan Paneli (Bültende kompakt, Sonuçlarda açık) */}
          {(subTab === 'bulletin' || subTab === 'results') && (
            <AltiliResultsSummaryBoard
              detail={detail}
              availableGames={availableGames}
              activeGame={activeGame}
              initialCollapsed={subTab === 'bulletin'}
              onSelectRace={(rNo) => {
                setSelectedRaceNo(rNo);
                setSubTab('bulletin');
              }}
              onSelectGame={(gId) => {
                setSelectedGameId(gId);
                const g = availableGames.find((ag) => ag.id === gId);
                if (g) setSelectedRaceNo(g.startRace);
              }}
            />
          )}

          {/* SUBTAB 2: AI ALTILI TEMPLATES */}
          {subTab === 'ai_coupons' && (
            <section className="space-y-4">
              {/* AI Hazır Kuponlar / İkili & Çifte Alt Geçiş Çubuğu */}
              <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 gap-1 max-w-md mx-auto">
                <button
                  onClick={() => setSubTab('ai_coupons')}
                  className="flex-1 py-2 rounded-lg text-xs transition-all cursor-pointer flex items-center justify-center space-x-1.5 bg-amber-400 text-slate-950 shadow-md font-black"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>6'lı Ganyan AI ({aiCoupons.length})</span>
                </button>
                <button
                  onClick={() => setSubTab('ikili_cifte')}
                  className="flex-1 py-2 rounded-lg text-xs transition-all cursor-pointer flex items-center justify-center space-x-1.5 text-slate-400 hover:text-white font-bold"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>İkili &amp; Çifte Robotu ({ikiliPicks.length})</span>
                </button>
              </div>
              {activeGameStatus.isClosed && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-200 animate-in fade-in duration-200">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-black text-sm text-white flex items-center gap-2">
                        <span>Bahis Alımı Kapandı ({activeGame?.label})</span>
                        <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[10px] font-black border border-amber-400/30">
                          {activeGameStatus.startedLegCount}/{activeGameStatus.totalLegs} Ayak Koşuldu
                        </span>
                      </div>
                      <p className="text-xs text-amber-200/80 mt-1 leading-relaxed">
                        1. Ayak ({activeGameStatus.firstLegRace?.number}. Koşu • {activeGameStatus.firstLegRace?.hour}) başlamış veya tamamlanmış olduğu için TJK kuralları gereği bu oyuna müşterek bahis kabulü kapanmıştır.
                      </p>
                    </div>
                  </div>
                  {activeGameStatus.nextOpenGame && (
                    <button
                      onClick={() => {
                        setSelectedGameId(activeGameStatus.nextOpenGame!.id);
                        setSelectedRaceNo(activeGameStatus.nextOpenGame!.startRace);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs shrink-0 cursor-pointer shadow-lg shadow-amber-500/20 flex items-center space-x-1.5 transition-all active:scale-95"
                    >
                      <Zap className="w-4 h-4 fill-current" />
                      <span>Henüz Başlamayan {activeGameStatus.nextOpenGame.label}'a Geç</span>
                    </button>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {aiCoupons.map((c) => {
                  const isHorseLocked = c.strategy !== 'EKONOMİK' && !user?.isVip;
                  const visibleLegs = isHorseLocked ? c.legs.slice(0, 2) : c.legs;

                  return (
                    <div
                      key={c.id}
                      className="rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-400/50 p-4 flex flex-col justify-between space-y-4 transition-all"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-black ${c.strategy === 'EKONOMİK'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : c.strategy === 'İDEAL'
                                    ? 'bg-amber-400 text-slate-950'
                                    : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                  }`}
                              >
                                {c.strategy} KURGU
                              </span>
                              {isHorseLocked && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-[9px] flex items-center gap-1 shadow-xs">
                                  <Lock className="w-2.5 h-2.5" />
                                  <span>VIP</span>
                                </span>
                              )}
                            </div>
                            <h3 className="font-black text-base text-white">{c.title}</h3>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-[10px] text-slate-400">Güven</div>
                            <div className="text-sm font-black text-emerald-400">%{c.avgConfidence}</div>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">{c.subtitle}</p>

                        <div className="space-y-1.5 bg-slate-950/70 rounded-xl p-3 border border-slate-800/80">
                          {visibleLegs.map((leg) => (
                            <div
                              key={leg.legIndex}
                              className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60 last:border-0"
                            >
                              <span className="font-bold text-slate-400">
                                {leg.legIndex}. Ayak <span className="text-[10px]">({leg.raceNumber}. Koşu)</span>
                              </span>
                              <div className="flex items-center gap-1 flex-wrap justify-end">
                                {leg.horses.map((hNo) => (
                                  <span
                                    key={hNo}
                                    className={`px-2 py-0.5 rounded font-mono font-black text-[11px] ${leg.banko === hNo
                                      ? 'bg-amber-400 text-slate-950'
                                      : 'bg-slate-800 text-white border border-slate-700'
                                      }`}
                                  >
                                    {hNo}
                                    {leg.banko === hNo ? ' TEK' : ''}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}

                          {isHorseLocked && (
                            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-400/30 text-center space-y-1.5 mt-2">
                              <div className="flex items-center justify-center gap-1 text-amber-300 font-bold text-xs">
                                <Lock className="w-3.5 h-3.5 text-amber-400" />
                                <span>Kalan {c.legs.length - 2} Ayak &amp; Cazip Tekler VIP Özel</span>
                              </div>
                              {onOpenVIP && (
                                <button
                                  onClick={onOpenVIP}
                                  className="px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] shadow cursor-pointer transition-colors"
                                >
                                  Şablonu Aç &amp; VIP Ol
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                        <div>
                          <div className="text-[10px] text-slate-400">
                            {c.totalCombinations.toLocaleString('tr-TR')} Kolon
                          </div>
                          <div className="text-base font-black text-amber-400 font-mono">
                            {c.estimatedCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                          </div>
                        </div>
                        {isHorseLocked ? (
                          onOpenVIP && (
                            <button
                              onClick={onOpenVIP}
                              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs cursor-pointer transition-all flex items-center space-x-1 shadow-lg shadow-amber-500/20"
                            >
                              <Crown className="w-3.5 h-3.5 text-slate-950" />
                              <span>VIP Kulübüne Katıl</span>
                            </button>
                          )
                        ) : activeGameStatus.isClosed ? (
                          <button
                            disabled
                            className="px-3.5 py-2 rounded-xl bg-slate-800/80 text-slate-500 font-bold text-xs flex items-center space-x-1.5 cursor-not-allowed border border-slate-700/50"
                            title="Koşu başladığı için bahise kapandı"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Bahise Kapalı</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => loadAICouponToSlip(c.id)}
                            className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer transition-all flex items-center space-x-1 shadow-lg shadow-amber-500/20"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>Kuponuma Aktar</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* SUBTAB: IKILI & CIFTE ROBOTU */}
          {subTab === 'ikili_cifte' && (
            <section className="space-y-4">
              {/* AI Hazır Kuponlar / İkili & Çifte Alt Geçiş Çubuğu */}
              <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 gap-1 max-w-md mx-auto">
                <button
                  onClick={() => setSubTab('ai_coupons')}
                  className="flex-1 py-2 rounded-lg text-xs transition-all cursor-pointer flex items-center justify-center space-x-1.5 text-slate-400 hover:text-white font-bold"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>6'lı Ganyan AI ({aiCoupons.length})</span>
                </button>
                <button
                  onClick={() => setSubTab('ikili_cifte')}
                  className="flex-1 py-2 rounded-lg text-xs transition-all cursor-pointer flex items-center justify-center space-x-1.5 bg-amber-400 text-slate-950 shadow-md font-black"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>İkili &amp; Çifte Robotu ({ikiliPicks.length})</span>
                </button>
              </div>
              <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-indigo-950/40 p-4 rounded-2xl border border-amber-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 font-black">
                    <Zap className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <span>ProAnaliz AI İkili & Çifte Robotu</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/30">
                        {ikiliPicks.length} Fırsat
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Günün yarışlarında istatistiksel üstünlüğe ve yüksek ikramiye potansiyeline sahip ikili, sıralı ikili ve çifte kombinasyonları.
                    </p>
                  </div>
                </div>
              </div>

              {ikiliPicks.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                  Bu program için henüz ikili/çifte fırsatı üretilemedi veya koşular tamamlandı.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ikiliPicks.map((pick, pIdx) => {
                    const isVipRestricted = pIdx > 1 && !user?.isVip;
                    return (
                      <div
                        key={pIdx}
                        className={`rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${pick.type === 'CIFTE'
                          ? 'bg-gradient-to-b from-indigo-950/40 to-slate-900/90 border-indigo-500/30 hover:border-indigo-400/60'
                          : pick.type === 'SIRALI_IKILI'
                            ? 'bg-gradient-to-b from-amber-950/30 to-slate-900/90 border-amber-500/30 hover:border-amber-400/60'
                            : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                          } p-4 shadow-xl`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wide uppercase ${pick.type === 'CIFTE'
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                                : pick.type === 'SIRALI_IKILI'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                }`}
                            >
                              {pick.type === 'CIFTE'
                                ? '🔥 Günün Çiftesi'
                                : pick.type === 'SIRALI_IKILI'
                                  ? '⚡ Sıralı İkili'
                                  : '🎯 İkili Bahis'}
                            </span>
                            <div className="flex items-center space-x-1.5">
                              <span className="text-[10px] text-slate-400 font-bold">AI Güven:</span>
                              <span className="text-xs font-black text-amber-400 font-mono">
                                %{pick.confidence}
                              </span>
                            </div>
                          </div>

                          <h4 className="text-xs font-black text-white leading-snug">
                            {pick.title}
                          </h4>

                          {isVipRestricted ? (
                            <div className="p-4 rounded-xl bg-slate-950/90 border border-amber-500/20 text-center space-y-2 my-2">
                              <Lock className="w-5 h-5 text-amber-400 mx-auto" />
                              <div className="text-xs font-bold text-slate-300">
                                Bu özel ikili/çifte kombinasyonu VIP üyelere açıktır.
                              </div>
                              <button
                                onClick={onOpenVIP}
                                className="px-3 py-1.5 rounded-lg text-xs font-black bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 hover:from-amber-300 hover:to-amber-400 transition-all cursor-pointer"
                              >
                                VIP'ye Geç ve Gör
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="space-y-1.5 pt-1">
                                {pick.horses.map((h, hIdx) => (
                                  <div
                                    key={hIdx}
                                    className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-800/80"
                                  >
                                    <div className="flex items-center space-x-2 min-w-0">
                                      <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center justify-center font-black text-xs shrink-0 font-mono">
                                        {h.number}
                                      </span>
                                      <div className="min-w-0">
                                        <div className="text-xs font-black text-white truncate">
                                          {h.name}
                                        </div>
                                        {h.jockey && (
                                          <div className="text-[10px] text-slate-400 truncate">
                                            {h.jockey}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-1.5 shrink-0">
                                      <span
                                        className={`px-1.5 py-0.5 rounded text-[9px] font-black ${h.tag === 'BANKO'
                                          ? 'bg-amber-400 text-slate-950'
                                          : h.tag === 'BOMBA' || h.tag === 'SÜRPRİZ'
                                            ? 'bg-rose-500 text-white'
                                            : 'bg-slate-800 text-slate-300'
                                          }`}
                                      >
                                        {h.tag}
                                      </span>
                                      {h.ganyan && h.ganyan > 0 ? (
                                        <span className="text-[10px] font-mono font-bold text-amber-300">
                                          {h.ganyan.toFixed(2)}
                                        </span>
                                      ) : null}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <p className="text-[11px] text-slate-400 italic bg-slate-950/40 p-2 rounded-lg border border-slate-800/60 leading-relaxed">
                                "{pick.reason}"
                              </p>
                            </>
                          )}
                        </div>

                        {!isVipRestricted && (
                          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between mt-3">
                            <button
                              onClick={() => {
                                setSelectedRaceNo(pick.raceNumber);
                                setSubTab('bulletin');
                              }}
                              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center space-x-1 cursor-pointer transition-colors"
                            >
                              <span>Koşu Bültenine Git</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  `${pick.title} - ${pick.horses.map((h) => `${h.number} ${h.name}`).join(' / ')} (ProAnaliz AI)`
                                );
                                onShowToast?.('İkili kombinasyonu kopyalandı!', 'success');
                              }}
                              className="text-[11px] font-bold text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800/60 hover:bg-slate-800 cursor-pointer transition-colors"
                            >
                              Kopyala
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* SUBTAB 3: RESULTS & PAYOUTS */}
          {subTab === 'results' && (
            <section className="space-y-4">
              {/* Sonuçlar / Değişenler Alt Geçiş Çubuğu */}
              <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 gap-1 max-w-md mx-auto">
                <button
                  onClick={() => setSubTab('results')}
                  className="flex-1 py-2 rounded-lg text-xs transition-all cursor-pointer flex items-center justify-center space-x-1.5 bg-cyan-400 text-slate-950 shadow-md font-black"
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Koşu Sonuçları &amp; İkramiyeler</span>
                </button>
                <button
                  onClick={() => setSubTab('changes')}
                  className="flex-1 py-2 rounded-lg text-xs transition-all cursor-pointer flex items-center justify-center space-x-1.5 text-slate-400 hover:text-white font-bold"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Değişenler ({detail.scratches.length + detail.jockeyChanges.length})</span>
                </button>
              </div>
              {detail.summary?.altiliResults && detail.summary.altiliResults.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {detail.summary.altiliResults.map((alt) => (
                    <div
                      key={alt.name}
                      className="rounded-2xl bg-slate-900/90 border border-amber-500/30 p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                            Resmi TJK İkramiyesi
                          </span>
                          <h3 className="text-lg font-black text-white">{alt.name} Ganyan</h3>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-black text-emerald-400 font-mono">
                            {alt.unitPrize ? `${alt.unitPrize} ₺` : 'Hesaplanıyor'}
                          </div>
                          {alt.totalBonuses && (
                            <div className="text-[10px] text-slate-400">
                              Havuz: {alt.totalBonuses} ₺
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {alt.legs.map((leg) => (
                          <div
                            key={leg.number}
                            onClick={() => {
                              setSelectedRaceNo(leg.raceNo);
                              setSubTab('bulletin');
                            }}
                            className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-amber-400/50 cursor-pointer transition-all"
                          >
                            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                              <span className="font-bold">{leg.number}. Ayak ({leg.raceNo}.K)</span>
                              <span className="font-mono">{leg.degree}</span>
                            </div>
                            {leg.winners.map((w) => (
                              <div key={w.horseNo} className="flex items-center justify-between gap-1">
                                <span className="text-xs font-black text-white truncate">
                                  {w.horseNo}-{w.horseName}
                                </span>
                                <span className="text-[11px] font-mono font-bold text-amber-400 shrink-0">
                                  {w.ganyan?.toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {detail.summary?.prizes && detail.summary.prizes.length > 0 && (
                <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4">
                  <h3 className="text-sm font-black text-white mb-3">Diğer Müşterek Bahis İkramiyeleri</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                    {detail.summary.prizes.map((pz) => (
                      <div
                        key={pz.betTypeName}
                        className="p-3 rounded-xl bg-slate-950/70 border border-slate-800"
                      >
                        <div className="text-xs font-bold text-slate-300">{pz.betTypeName}</div>
                        <div className="text-base font-black text-emerald-400 font-mono mt-1">
                          {pz.prize ? `${pz.prize} ₺` : '-'}
                        </div>
                        {pz.totalBonuses && (
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Tevzi: {pz.totalBonuses} ₺
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Per-race winners overview */}
              <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-3">
                <h3 className="text-sm font-black text-white">Koşu Bazlı Resmi Sonuçlar</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {detail.races.map((r) => {
                    const top3 = r.horses.filter((h) => h.order >= 1 && h.order <= 3);
                    return (
                      <div
                        key={r.number}
                        onClick={() => {
                          setSelectedRaceNo(r.number);
                          setSubTab('bulletin');
                        }}
                        className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/40 cursor-pointer space-y-2 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black text-xs text-white">
                            {r.number}. Koşu • {r.hour} ({r.distance}m {r.raceCourseType})
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black ${r.isFinished
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-slate-800 text-slate-400'
                              }`}
                          >
                            {r.status}
                          </span>
                        </div>
                        {top3.length > 0 ? (
                          <div className="space-y-1">
                            {top3.map((h) => (
                              <div key={h.number} className="flex items-center justify-between text-xs">
                                <span className="text-slate-200 font-semibold">
                                  <strong className="text-amber-400">{h.order}.</strong> ({h.number}) {h.name}{' '}
                                  <span className="text-slate-500">({h.jockey.name})</span>
                                </span>
                                <span className="font-mono text-slate-300 text-[11px]">
                                  {h.degree} • {h.ganyan > 0 ? `${h.ganyan.toFixed(2)} ₺` : ''}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-500">Koşu henüz sonuçlanmadı</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* SUBTAB 4: SCRATCHES & JOCKEY CHANGES */}
          {subTab === 'changes' && (
            <div className="space-y-4">
              {/* Sonuçlar / Değişenler Alt Geçiş Çubuğu */}
              <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 gap-1 max-w-md mx-auto">
                <button
                  onClick={() => setSubTab('results')}
                  className="flex-1 py-2 rounded-lg text-xs transition-all cursor-pointer flex items-center justify-center space-x-1.5 text-slate-400 hover:text-white font-bold"
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Koşu Sonuçları &amp; İkramiyeler</span>
                </button>
                <button
                  onClick={() => setSubTab('changes')}
                  className="flex-1 py-2 rounded-lg text-xs transition-all cursor-pointer flex items-center justify-center space-x-1.5 bg-cyan-400 text-slate-950 shadow-md font-black"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Değişenler ({detail.scratches.length + detail.jockeyChanges.length})</span>
                </button>
              </div>
              <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-3">
                <h3 className="text-sm font-black text-rose-300 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Koşmayan Atlar (Çıkanlar)</span>
                </h3>
                {detail.scratches.length === 0 ? (
                  <p className="text-xs text-slate-400">Bu hipodromda bildirilen çıkan at bulunmuyor.</p>
                ) : (
                  detail.scratches.map((s) => (
                    <div key={s.raceNumber} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                      <div className="text-xs font-black text-white">
                        {s.raceName} ({s.hour})
                      </div>
                      {s.scratchedRunners.map((sr) => (
                        <div key={sr.number} className="text-xs text-rose-300 flex items-center justify-between">
                          <span>
                            #{sr.number} {sr.name}
                          </span>
                          <span className="text-[10px] text-slate-400">{sr.jockeyName}</span>
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>

              <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-3">
                <h3 className="text-sm font-black text-amber-300 flex items-center space-x-2">
                  <Info className="w-4 h-4" />
                  <span>Resmi Jokey Değişiklikleri</span>
                </h3>
                {detail.jockeyChanges.length === 0 ? (
                  <p className="text-xs text-slate-400">Kayıtlı jokey değişikliği bulunmuyor.</p>
                ) : (
                  detail.jockeyChanges.map((jc) => (
                    <div key={jc.raceNumber} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                      <div className="text-xs font-black text-white">
                        {jc.raceName} ({jc.hour})
                      </div>
                      {jc.horses.map((h) => (
                        <div key={h.number} className="text-xs flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-200">
                            #{h.number} {h.name}
                          </span>
                          <span className="text-[11px]">
                            <span className="line-through text-slate-500">{h.oldJockeyName}</span>
                            <span className="mx-1 text-amber-400">→</span>
                            <span className="font-black text-emerald-300">{h.newJockeyName}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
          )}

          {/* SUBTAB 1: MAIN NESINE BULLETIN & COUPON BUILDER */}
          {subTab === 'bulletin' && (
            <div className="flex flex-col xl:flex-row gap-4 items-start">
              {/* LEFT / MAIN: RACE TABS + RUNNER TABLE */}
              <div className="flex-1 w-full min-w-0 space-y-3">
                {/* Değişen At / Jokey Hızlı Uyarı Rozeti */}
                {detail.scratches.length + detail.jockeyChanges.length > 0 && (
                  <button
                    onClick={() => setSubTab('changes')}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs font-bold hover:bg-amber-500/20 transition-all cursor-pointer shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                        !
                      </span>
                      <span>
                        Bu programda <strong className="text-white underline">{detail.scratches.length + detail.jockeyChanges.length}</strong> jokey/at değişikliği var.
                      </span>
                    </div>
                    <span className="text-[11px] text-amber-300 font-black shrink-0 ml-2">
                      Değişenleri İncele →
                    </span>
                  </button>
                )}

                {/* 🌟 GÜNÜN HİPODROM AI ZİRVESİ: GÜNÜN TEKİ & GÜNÜN BOMBASI */}
                {dayHighlights && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 p-3 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-amber-950/40 border border-emerald-500/30 shadow-xl animate-fadeIn">
                    {/* GÜNÜN TEKİ */}
                    {dayHighlights.banko && (() => {
                      const b = dayHighlights.banko;
                      const isSelected = currentSelections[b.race.number]?.includes(b.horse.number);
                      const jockeyName = b.horse.jockey?.name || (typeof b.horse.jockey === 'string' ? b.horse.jockey : 'Jokey');

                      return (
                        <div
                          onClick={() => {
                            setSelectedRaceNo(b.race.number);
                            setExpandedHorse(null);
                          }}
                          className="p-2.5 sm:p-3 rounded-xl bg-slate-950/70 border border-emerald-500/30 hover:border-emerald-400/60 transition-all cursor-pointer flex flex-col justify-between group shadow-sm"
                        >
                          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-amber-400" />
                              <span>Günün En Sağlam Teki</span>
                            </span>
                            <span className="text-[11px] font-mono font-bold text-slate-300">
                              {b.race.number}. Koşu ({b.race.hour})
                            </span>
                          </div>

                          <div className="pt-2 flex items-center justify-between">
                            <div className="flex items-center space-x-2 truncate">
                              <span className="w-7 h-7 rounded-lg bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                                {b.horse.number}
                              </span>
                              <div className="truncate">
                                <h4 className="text-xs sm:text-sm font-black text-white group-hover:text-emerald-300 transition-colors truncate">
                                  {b.horse.name}
                                </h4>
                                <p className="text-[10px] text-slate-400 truncate">
                                  {jockeyName} • {b.horse.weight}kg • HP: {b.horse.handicap || '-'}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRaceNo(b.race.number);
                                if (!isSelected) {
                                  toggleHorsePick(b.race.number, b.horse.number);
                                  onShowToast?.(`🏇 ${b.horse.name} (${b.race.number}. Koşu) Tek Banko olarak kupona eklendi!`, 'success');
                                }
                              }}
                              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-black shrink-0 transition-all cursor-pointer flex items-center space-x-1 ${
                                isSelected
                                  ? 'bg-emerald-500 text-slate-950 border border-emerald-400'
                                  : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                              }`}
                            >
                              {isSelected ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>Tek Kuponda</span>
                                </>
                              ) : (
                                <>
                                  <Zap className="w-3 h-3" />
                                  <span>%{b.agfPct} AGF • Tek Ekle</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    {/* GÜNÜN BOMBASI */}
                    {dayHighlights.bomba && (() => {
                      const bm = dayHighlights.bomba;
                      const isSelected = currentSelections[bm.race.number]?.includes(bm.horse.number);
                      const jockeyName = bm.horse.jockey?.name || (typeof bm.horse.jockey === 'string' ? bm.horse.jockey : 'Jokey');

                      return (
                        <div
                          onClick={() => {
                            setSelectedRaceNo(bm.race.number);
                            setExpandedHorse(null);
                          }}
                          className="p-2.5 sm:p-3 rounded-xl bg-slate-950/70 border border-amber-500/30 hover:border-amber-400/60 transition-all cursor-pointer flex flex-col justify-between group shadow-sm"
                        >
                          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase flex items-center gap-1">
                              <Flame className="w-3 h-3 text-amber-400" />
                              <span>Günün Cazip Bombası</span>
                            </span>
                            <span className="text-[11px] font-mono font-bold text-slate-300">
                              {bm.race.number}. Koşu ({bm.race.hour})
                            </span>
                          </div>

                          <div className="pt-2 flex items-center justify-between">
                            <div className="flex items-center space-x-2 truncate">
                              <span className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                                {bm.horse.number}
                              </span>
                              <div className="truncate">
                                <h4 className="text-xs sm:text-sm font-black text-white group-hover:text-amber-300 transition-colors truncate">
                                  {bm.horse.name}
                                </h4>
                                <p className="text-[10px] text-slate-400 truncate">
                                  {jockeyName} • {bm.horse.weight}kg • HP: {bm.horse.handicap || '-'}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRaceNo(bm.race.number);
                                if (!isSelected) {
                                  toggleHorsePick(bm.race.number, bm.horse.number);
                                  onShowToast?.(`💣 ${bm.horse.name} (${bm.race.number}. Koşu) Sürpriz olarak kupona eklendi!`, 'success');
                                }
                              }}
                              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-black shrink-0 transition-all cursor-pointer flex items-center space-x-1 ${
                                isSelected
                                  ? 'bg-amber-500 text-slate-950 border border-amber-400'
                                  : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                              }`}
                            >
                              {isSelected ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>Kuponda</span>
                                </>
                              ) : (
                                <>
                                  <Zap className="w-3 h-3" />
                                  <span>Sürpriz Ekle</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Race Selector Tabs (1. Koşu .. N. Koşu) - 100% Solid Responsive Grid, Zero Horizontal Cutoff */}
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1 sm:gap-1.5">
                  {detail.races.map((r) => {
                    const isSel = activeRace?.number === r.number;
                    const legBadge = getLegBadgeForRace(r.number, activeGame);
                    const pickCount = currentSelections[r.number]?.length || 0;
                    return (
                      <button
                        key={r.number}
                        onClick={() => {
                          setSelectedRaceNo(r.number);
                          setExpandedHorse(null);
                        }}
                        className={`w-full px-1.5 py-1.5 sm:px-2 sm:py-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${isSel
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20 font-bold'
                          : 'bg-slate-900/90 hover:bg-slate-800 text-white border-slate-800'
                          }`}
                      >
                        <div className="flex items-center justify-between gap-0.5">
                          <span className="font-black text-xs truncate">{r.number}. Koşu</span>
                          <span
                            className={`text-[10px] font-mono font-bold shrink-0 ${isSel ? 'text-slate-900' : 'text-slate-400'
                              }`}
                          >
                            {r.hour}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-0.5 mt-0.5">
                          <span className={`text-[9px] font-semibold truncate ${isSel ? 'text-slate-900' : 'text-slate-400'}`}>
                            {r.distance}m {r.raceCourseType ? r.raceCourseType.substring(0, 3) : ''}
                          </span>
                          {legBadge && (
                            <span
                              className={`px-1 py-0.2 rounded text-[8px] font-black shrink-0 ${isSel
                                ? 'bg-slate-950 text-amber-300'
                                : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                                }`}
                            >
                              {legBadge}.A
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <span
                            className={`text-[8px] font-black ${r.isFinished
                              ? isSel
                                ? 'text-slate-950'
                                : 'text-emerald-400'
                              : isSel
                                ? 'text-slate-900'
                                : 'text-slate-500'
                              }`}
                          >
                            {r.status}
                          </span>
                          {pickCount > 0 && (
                            <span
                              className={`px-1.5 py-0.2 rounded-full text-[8px] font-black ${isSel ? 'bg-slate-950 text-white' : 'bg-emerald-500 text-slate-950'
                                }`}
                            >
                              {pickCount} At
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Race Details + Runners */}
                {activeRace && (
                  <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
                    {/* Race Info Bar */}
                    <div className="p-3 sm:p-4 bg-slate-950/70 border-b border-slate-800 space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-black text-xs border border-emerald-500/30">
                              {activeRace.number}. KOŞU • {activeRace.hour}
                            </span>
                            {getLegBadgeForRace(activeRace.number, activeGame) && (
                              <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-xs">
                                {activeGame?.label} — {getLegBadgeForRace(activeRace.number, activeGame)}. Ayak
                              </span>
                            )}
                            <span className="text-xs font-bold text-slate-300">
                              {activeRace.distance}m {activeRace.raceCourseType}
                            </span>
                            {raceCountdown && (
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-black flex items-center gap-1.5 ${raceCountdown.status === 'urgent'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                                  : raceCountdown.status === 'live'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                                    : raceCountdown.status === 'finished'
                                      ? 'bg-slate-800 text-slate-400 border border-slate-700'
                                      : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                                  }`}
                              >
                                <Clock className="w-3 h-3" />
                                <span>
                                  {raceCountdown.status === 'upcoming' || raceCountdown.status === 'urgent'
                                    ? `⏱️ Başlamasına: ${raceCountdown.text}`
                                    : raceCountdown.text}
                                </span>
                              </span>
                            )}
                          </div>
                          <h3 className="text-sm sm:text-base font-black text-white mt-1">
                            {activeRace.name || activeRace.typeDescription}
                          </h3>
                          {activeRace.typeDescription && activeRace.name !== activeRace.typeDescription && (
                            <p className="text-[11px] text-slate-400">{activeRace.typeDescription}</p>
                          )}
                        </div>

                        {/* Quick Actions & Sort */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            onClick={() => {
                              if (livePlayerMode !== 'off') {
                                setLivePlayerMode('off');
                              } else {
                                setSelectedRaceNo(activeRace.number);
                                setLivePlayerMode('modal');
                              }
                            }}
                            className={`px-3 py-1.5 rounded-lg font-black text-[11px] cursor-pointer transition-all flex items-center space-x-1 shadow-md active:scale-95 border ${livePlayerMode !== 'off'
                              ? 'bg-red-700 text-white border-red-300 shadow-red-700/40 ring-2 ring-red-400'
                              : 'bg-gradient-to-r from-red-600 via-rose-600 to-red-500 hover:from-red-500 hover:to-rose-500 text-white border-rose-400/50 shadow-rose-600/30'
                              }`}
                            title="TJK TV Canlı Yayın & Koşuyu Küçük Ekranda İzle"
                          >
                            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                            <Play className="w-3 h-3 fill-current" />
                            <span>{livePlayerMode !== 'off' ? 'CANLI AÇIK' : 'CANLI İZLE'}</span>
                          </button>
                          <button
                            onClick={() => pickAITopNInRace(1)}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] cursor-pointer transition-colors"
                            title="AI Banko Seçimini Ekle"
                          >
                            AI Banko (1)
                          </button>
                          <button
                            onClick={() => pickAITopNInRace(3)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-extrabold text-[11px] cursor-pointer transition-colors"
                            title="AI En Güçlü 3 Atı Ekle"
                          >
                            AI İlk 3
                          </button>
                          <button
                            onClick={toggleAllActiveHorsesInRace}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-bold text-[11px] cursor-pointer transition-colors"
                          >
                            Hepsini Seç (H)
                          </button>
                          <select
                            value={sortMode}
                            onChange={(e) => setSortMode(e.target.value as SortMode)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-[11px] font-bold cursor-pointer focus:outline-none"
                            aria-label="Sıralama"
                          >
                            <option value="number">Sıra: Numara / Sonuç</option>
                            <option value="agf">Sıra: AGF % (Yüksekten)</option>
                            <option value="ai">Sıra: ⚡ HPI Güç Puanı</option>
                            <option value="ganyan">Sıra: Ganyan (Favoriden)</option>
                            <option value="handicap">Sıra: Handikap Puanı</option>
                          </select>
                        </div>
                      </div>

                      {activeRace.betsStr && (
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                          <ArrowUpDown className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>{activeRace.betsStr}</span>
                        </div>
                      )}

                      {/* AGF Sürpriz Radarı (Value Bet) Banner */}
                      {(() => {
                        const raceValueBets = activeRace.horses.filter((h) => {
                          const agf = getHorsePrimaryAgf(h);
                          const ai = aiAnalysisMap.get(h.number);
                          return (
                            h.status !== false &&
                            ai &&
                            ai.score >= 68 &&
                            agf.percentage <= 12 &&
                            agf.percentage > 0
                          );
                        });

                        if (raceValueBets.length === 0) return null;

                        return (
                          <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center shrink-0">
                                🎯
                              </div>
                              <div className="text-xs">
                                <span className="font-extrabold text-purple-200">
                                  AGF Sürpriz &amp; Cazip Değer Radarı:{' '}
                                </span>
                                <span className="text-purple-300">
                                  Kamuoyunun düşük gördüğü ancak AI modelinin yüksek puanladığı cazip at(lar):{' '}
                                  {raceValueBets.map((vb) => {
                                    const ai = aiAnalysisMap.get(vb.number);
                                    const agf = getHorsePrimaryAgf(vb);
                                    return (
                                      <strong key={vb.number} className="text-white ml-1">
                                        #{vb.number} {vb.name} (AI: {ai?.score} | AGF: %{agf.percentage.toFixed(1)})
                                      </strong>
                                    );
                                  })}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                raceValueBets.forEach((vb) => {
                                  if (!currentSelections[activeRace.number]?.includes(vb.number)) {
                                    toggleHorsePick(activeRace.number, vb.number);
                                  }
                                });
                                onShowToast?.('Sürpriz radar atı kupona eklendi!', 'success');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-purple-500 hover:bg-purple-400 text-slate-950 font-black text-[11px] shrink-0 transition-colors shadow-md shadow-purple-500/20 cursor-pointer self-start sm:self-auto"
                            >
                              Sürprizi Kupona Ekle
                            </button>
                          </div>
                        );
                      })()}

                      {activeRace.raceMoneys && activeRace.raceMoneys.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {activeRace.raceMoneys.slice(0, 6).map((rm) => (
                            <span
                              key={rm.betTypeName}
                              className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-300 font-bold"
                            >
                              {rm.betTypeName}: <strong className="text-white">{rm.result}</strong>{' '}
                              {rm.prizeText ? `(${rm.prizeText} ₺)` : ''}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Runners Table Header (Desktop) */}
                    <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2 bg-slate-950/40 border-b border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      <div className="col-span-1">No / Seç</div>
                      <div className="col-span-4">At / Orijin / Takı</div>
                      <div className="col-span-1 text-center">Kilo / HP</div>
                      <div className="col-span-2">Jokey &amp; Start</div>
                      <div className="col-span-2">Son 6 Yarış</div>
                      <div className="col-span-1 text-right">AGF %</div>
                      <div className="col-span-1 text-right">Ganyan / AI</div>
                    </div>

                    {/* Runners List */}
                    <div className="divide-y divide-slate-800/80">
                      {sortedHorses.map((horse) => {
                        const isScratched = horse.status === false;
                        const isPicked = (currentSelections[activeRace.number] || []).includes(horse.number);
                        const isBankoPick =
                          isPicked && (currentSelections[activeRace.number]?.length || 0) === 1;
                        const agf = getHorsePrimaryAgf(horse);
                        const ai = aiAnalysisMap.get(horse.number);
                        const isExpanded = expandedHorse === horse.number;

                        return (
                          <div
                            key={horse.number}
                            className={`transition-colors ${isScratched
                              ? 'bg-rose-950/15 opacity-55'
                              : isPicked
                                ? 'bg-emerald-500/10'
                                : 'hover:bg-slate-800/40'
                              }`}
                          >
                            {/* 📱 1. DEDICATED MOBILE RUNNER CARD (md:hidden) - High Contrast & Compact */}
                            <div className="md:hidden p-2 sm:p-2.5 space-y-1.5">
                              {/* Top Row: Horse Selection Button + Name + Jockey Specs + Ganyan & AGF */}
                              <div className="flex items-center justify-between gap-2">
                                {/* Compact Horse Number Selection Button */}
                                <button
                                  disabled={isScratched}
                                  onClick={() => toggleHorsePick(activeRace.number, horse.number)}
                                  className={`w-9 h-9 rounded-lg font-black flex flex-col items-center justify-center border transition-all cursor-pointer shrink-0 disabled:cursor-not-allowed ${isScratched
                                    ? 'bg-rose-950/40 border-rose-500/30 text-rose-400 line-through'
                                    : isBankoPick
                                      ? 'bg-amber-400 border-amber-300 text-slate-950 shadow-md shadow-amber-500/30 scale-105'
                                      : isPicked
                                        ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                                        : 'bg-slate-950 border-slate-700 text-white hover:border-emerald-400'
                                    }`}
                                  title={isScratched ? 'Koşmaz' : 'Kupona Ekle / Çıkar'}
                                >
                                  <span className={`text-sm leading-none ${isPicked ? 'font-black' : 'font-extrabold'}`}>
                                    {horse.number}
                                  </span>
                                  {isPicked && (
                                    <span className="text-[7px] font-black uppercase tracking-tighter mt-0.5">
                                      {isBankoPick ? 'TEK' : 'SEÇİLDİ'}
                                    </span>
                                  )}
                                </button>

                                {/* Horse Main Info (Tap to toggle details) */}
                                <div
                                  onClick={() => setExpandedHorse(isExpanded ? null : horse.number)}
                                  className="flex-1 min-w-0 cursor-pointer"
                                >
                                  <div className="flex items-center gap-1 flex-wrap">
                                    {horse.order > 0 && (
                                      <span
                                        className={`px-1 py-0.2 rounded text-[9px] font-black ${horse.order === 1
                                          ? 'bg-amber-400 text-slate-950'
                                          : horse.order === 2
                                            ? 'bg-slate-300 text-slate-950'
                                            : 'bg-slate-800 text-slate-300'
                                          }`}
                                      >
                                        {horse.order}.
                                      </span>
                                    )}
                                    <span
                                      className={`font-black text-xs sm:text-sm tracking-tight truncate ${isScratched ? 'line-through text-rose-300' : 'text-white'
                                        }`}
                                    >
                                      {horse.name}
                                    </span>
                                    {horse.stablemate > 0 && (
                                      <span className="px-1 py-0.2 rounded bg-indigo-500/25 border border-indigo-400/40 text-indigo-300 text-[8px] font-black">
                                        E{horse.stablemate}
                                      </span>
                                    )}
                                    {horse.equipment && (
                                      <span className="px-1 py-0.2 rounded bg-slate-800 text-slate-300 text-[8px] font-bold">
                                        {horse.equipment}
                                      </span>
                                    )}
                                    {isScratched && (
                                      <span className="px-1 py-0.2 rounded bg-rose-500/25 text-rose-300 text-[8px] font-black">
                                        KOŞMAZ
                                      </span>
                                    )}
                                  </div>

                                  {/* Jockey, Weight, Gate & HP */}
                                  <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5 flex-wrap">
                                    <span className={`font-bold ${horse.jockey.isJockeyChanged ? 'text-amber-300 font-black' : 'text-slate-200'}`}>
                                      {horse.jockey.name || '-'}
                                    </span>
                                    {horse.jockey.apprentice && (
                                      <span className="text-[8px] text-cyan-300 font-bold">(AP)</span>
                                    )}
                                    <span className="text-slate-600">•</span>
                                    <span className="font-mono text-slate-300">{horse.weight} kg</span>
                                    <span className="text-slate-600">•</span>
                                    <span className="text-cyan-400 font-semibold">St: {horse.start}</span>
                                    {horse.handicap ? (
                                      <>
                                        <span className="text-slate-600">•</span>
                                        <span className="text-amber-400 font-semibold">HP: {horse.handicap}</span>
                                      </>
                                    ) : null}
                                  </div>

                                  {/* 🤝 Timeform / Racing Post: Jokey & Antrenör Sinerjisi (Strike Rate) - Sadece Sıcak Sinerji veya Detay Açıkken */}
                                  {horse.jockey?.name && horse.coach && (() => {
                                    const synergy = calculateJockeyTrainerSynergy(horse.jockey.name, horse.coach);
                                    if (!isExpanded && !synergy.isHot) return null;
                                    return (
                                      <div
                                        title={synergy.tacticalNote}
                                        className={`mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all ${
                                          synergy.isHot
                                            ? 'bg-amber-400/15 border-amber-400/40 text-amber-300 shadow-xs'
                                            : 'bg-slate-900 border-slate-800 text-slate-400'
                                        }`}
                                      >
                                        <span className="text-cyan-300 font-medium truncate max-w-[90px] sm:max-w-none">
                                          Ant: {horse.coach}
                                        </span>
                                        <span className="text-slate-600">•</span>
                                        <span className="flex items-center gap-1">
                                          <span>🤝 Sinerji:</span>
                                          <strong className={synergy.isHot ? 'text-amber-300 font-mono font-black' : 'text-slate-300 font-mono'}>
                                            %{synergy.strikeRate}
                                          </strong>
                                        </span>
                                        {synergy.isHot && (
                                          <span className="px-1 rounded bg-amber-400 text-slate-950 text-[9px] font-black uppercase">
                                            {synergy.tier}
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </div>

                                {/* Right: GANYAN & AGF & AI Badges */}
                                <div className="flex flex-col items-end shrink-0 pl-1">
                                  <div className="flex items-center gap-1">
                                    {horse.ganyan > 0 ? (
                                      <span className="px-1.5 py-0.5 rounded bg-amber-400/15 border border-amber-400/30 text-amber-300 font-mono font-bold text-[11px]">
                                        {horse.ganyan.toFixed(2)} ₺
                                      </span>
                                    ) : null}
                                    {agf.percentage > 0 ? (
                                      <span
                                        className={`px-1.5 py-0.5 rounded font-mono font-black text-[11px] ${agf.isFavorite
                                          ? 'bg-amber-400 text-slate-950 shadow-sm'
                                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                          }`}
                                      >
                                        %{agf.percentage.toFixed(1)} {agf.isFavorite ? '★' : ''}
                                      </span>
                                    ) : null}
                                  </div>
                                  {ai && !isScratched && (
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <span className={`px-1 py-0.2 rounded border text-[8px] font-bold ${getTagBadgeClass(ai.tag)}`}>
                                        {ai.tag}
                                      </span>
                                      <span className={`px-1 py-0.2 rounded text-[8px] font-mono font-black ${ai.score >= 80
                                        ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                                        : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                        }`}>
                                        ⚡ HPI {ai.score}
                                      </span>
                                      {ai.score >= 68 && agf.percentage <= 12 && agf.percentage > 0 && (
                                        <span className="px-1 py-0.2 rounded bg-purple-500/25 border border-purple-400/40 text-purple-300 text-[8px] font-black animate-pulse">
                                          🎯 RADAR
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Bottom Row: Son 6 Form Chips + Pedigree + Chevron */}
                              <div
                                onClick={() => setExpandedHorse(isExpanded ? null : horse.number)}
                                className="flex items-center justify-between gap-2 pt-0.5 border-t border-slate-800/60 cursor-pointer"
                              >
                                {/* Son 6 Form Chips */}
                                <div className="flex items-center gap-0.5 shrink-0">
                                  <span className="text-[9px] text-slate-500 font-bold mr-0.5">Son 6:</span>
                                  {horse.last6.length > 0 ? (
                                    horse.last6.map((f, idx) => (
                                      <span
                                        key={idx}
                                        className={`w-3.5 h-3.5 rounded text-[8px] flex items-center justify-center font-mono font-bold ${getLast6ChipClass(
                                          f.result
                                        )}`}
                                      >
                                        {f.result || '-'}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-[9px] text-slate-500">İlk Koşu</span>
                                  )}
                                </div>

                                {/* Pedigree & Expand Chevron */}
                                <div className="flex items-center space-x-1 text-[9px] text-slate-400 min-w-0">
                                  <span className="truncate">{horse.age} {horse.parents.father} - {horse.parents.mother}</span>
                                  <ChevronDown className={`w-3 h-3 text-slate-400 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                </div>
                              </div>
                            </div>

                            {/* 🖥️ 2. DESKTOP RUNNER TABLE ROW (hidden md:grid) */}
                            <div className="hidden md:grid md:grid-cols-12 gap-2 px-3 sm:px-4 py-1.5 sm:py-2 items-center">
                              {/* Col 1: Saddle Cloth + Forma */}
                              <div className="md:col-span-1 flex items-center space-x-1.5">
                                <button
                                  disabled={isScratched}
                                  onClick={() => toggleHorsePick(activeRace.number, horse.number)}
                                  className={`w-8 h-8 rounded-lg font-black text-xs flex items-center justify-center border transition-all cursor-pointer shrink-0 disabled:cursor-not-allowed ${isScratched
                                    ? 'bg-rose-950/40 border-rose-500/30 text-rose-400 line-through'
                                    : isBankoPick
                                      ? 'bg-amber-400 border-amber-300 text-slate-950 shadow-md shadow-amber-500/30 scale-105'
                                      : isPicked
                                        ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                                        : 'bg-slate-950 border-slate-700 text-white hover:border-emerald-400'
                                    }`}
                                  title={isScratched ? 'Koşmaz' : 'Kupona Ekle / Çıkar'}
                                >
                                  {horse.number}
                                </button>
                                {horse.uniformImageURL ? (
                                  <img
                                    src={horse.uniformImageURL}
                                    alt=""
                                    className="w-6 h-6 rounded-md object-cover border border-slate-700 hidden sm:block"
                                    loading="lazy"
                                  />
                                ) : null}
                              </div>

                              {/* Col 2: Horse Name, Pedigree, Equipment */}
                              <div
                                onClick={() => setExpandedHorse(isExpanded ? null : horse.number)}
                                className="md:col-span-4 min-w-0 cursor-pointer"
                              >
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {horse.order > 0 && (
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-black ${horse.order === 1
                                        ? 'bg-amber-400 text-slate-950'
                                        : horse.order === 2
                                          ? 'bg-slate-300 text-slate-950'
                                          : horse.order === 3
                                            ? 'bg-amber-700 text-white'
                                            : 'bg-slate-800 text-slate-300'
                                        }`}
                                    >
                                      {horse.order}.
                                    </span>
                                  )}
                                  <span
                                    className={`font-black text-sm truncate ${isScratched ? 'line-through text-rose-300' : 'text-white'
                                      }`}
                                  >
                                    {horse.name}
                                  </span>
                                  {horse.stablemate > 0 && (
                                    <span className="px-1.5 py-0.2 rounded bg-indigo-500/25 border border-indigo-400/40 text-indigo-300 text-[9px] font-black">
                                      E{horse.stablemate}
                                    </span>
                                  )}
                                  {horse.equipment && (
                                    <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 text-[9px] font-bold">
                                      {horse.equipment}
                                    </span>
                                  )}
                                  {isScratched && (
                                    <span className="px-1.5 py-0.2 rounded bg-rose-500/25 text-rose-300 text-[9px] font-black">
                                      KOŞMAZ
                                    </span>
                                  )}
                                  {horse.degree && (
                                    <span className="text-[11px] font-mono font-bold text-emerald-400">
                                      {horse.degree}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 truncate mt-0.5">
                                  {horse.age} • {horse.parents.father} - {horse.parents.mother}
                                  {horse.parents.fatherOfMother ? ` / ${horse.parents.fatherOfMother}` : ''}
                                </div>
                              </div>

                              {/* Col 3: Weight & HP */}
                              <div className="md:col-span-1 flex md:flex-col items-center justify-between md:justify-center text-xs">
                                <span className="font-mono font-black text-slate-200">
                                  {horse.weight}
                                  {horse.overweight > 0 ? (
                                    <span className="text-amber-400">+{horse.overweight}</span>
                                  ) : (
                                    ''
                                  )}{' '}
                                  kg
                                </span>
                                <span className="text-[10px] font-bold text-cyan-400">
                                  {horse.handicap ? `HP: ${horse.handicap}` : `KGS: ${horse.kgs}g`}
                                </span>
                              </div>

                              {/* Col 4: Jockey & Start Gate */}
                              <div className="md:col-span-2 min-w-0">
                                <div className="flex items-center space-x-1">
                                  <span
                                    className={`text-xs font-extrabold truncate ${horse.jockey.isJockeyChanged ? 'text-amber-300' : 'text-slate-200'
                                      }`}
                                    title={horse.jockey.fullName}
                                  >
                                    {horse.jockey.name || '-'}
                                  </span>
                                  {horse.jockey.apprentice && (
                                    <span className="px-1 rounded bg-slate-800 text-[9px] text-cyan-300 font-bold">
                                      AP
                                    </span>
                                  )}
                                  {horse.jockey.isJockeyChanged && (
                                    <span
                                      className="px-1 rounded bg-amber-500/20 text-amber-300 text-[9px] font-black"
                                      title={`Eski Jokey: ${horse.jockey.oldJockeyName}`}
                                    >
                                      DEĞİŞTİ
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  Start: <strong className="text-slate-300">{horse.start}</strong>
                                  {horse.bestGrade?.value ? ` • En İyi: ${horse.bestGrade.value}` : ''}
                                </div>
                              </div>

                              {/* Col 5: Last 6 Form Chips */}
                              <div className="md:col-span-2 flex items-center gap-0.5 sm:gap-1 flex-nowrap" title="Son 6 Koşu Dereceleri">
                                {horse.last6.length > 0 ? (
                                  horse.last6.map((f, idx) => (
                                    <span
                                      key={idx}
                                      className={`w-4 h-4 sm:w-5 sm:h-5 rounded-md text-[9px] sm:text-[10px] flex items-center justify-center font-mono shrink-0 ${getLast6ChipClass(
                                        f.result
                                      )}`}
                                      title={`Son ${idx + 1}. Koşu: ${f.result ? `${f.result}. oldu` : 'Derece yok'}${f.raceCourseType ? ` (${f.raceCourseType})` : ''}`}
                                    >
                                      {f.result || '-'}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-[10px] text-slate-500">İlk Koşu / Veri Yok</span>
                                )}
                              </div>

                              {/* Col 6: Live AGF % Bar */}
                              <div className="md:col-span-1 text-right">
                                {agf.percentage > 0 ? (
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-end space-x-1">
                                      {agf.isFavorite && (
                                        <span className="text-[9px] font-black text-amber-400">★</span>
                                      )}
                                      <span className="text-xs font-mono font-black text-white">
                                        %{agf.percentage.toFixed(1)}
                                      </span>
                                    </div>
                                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                      <div
                                        className={`h-full rounded-full ${agf.isFavorite ? 'bg-amber-400' : 'bg-emerald-500'
                                          }`}
                                        style={{ width: `${Math.min(100, agf.percentage * 2)}%` }}
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-slate-500">-</span>
                                )}
                              </div>

                              {/* Col 7: Ganyan + AI Tag */}
                              <div className="md:col-span-1 flex md:flex-col items-center md:items-end justify-between gap-1">
                                <div className="flex items-center space-x-1">
                                  <span className="text-xs font-mono font-black text-amber-300">
                                    {horse.ganyan > 0 ? horse.ganyan.toFixed(2) : '-'}
                                  </span>
                                  {horse.fobOdd && (
                                    <span
                                      className="px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[9px] font-mono font-bold"
                                      title="Sabit İhtimalli Ganyan"
                                    >
                                      S:{horse.fobOdd.toFixed(2)}
                                    </span>
                                  )}
                                </div>
                                {ai && !isScratched && (
                                  <div className="flex items-center gap-1">
                                    <span
                                      className={`px-1.5 py-0.2 rounded border text-[9px] font-bold ${getTagBadgeClass(
                                        ai.tag
                                      )}`}
                                    >
                                      {ai.tag}
                                    </span>
                                    <span
                                      className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-black ${ai.score >= 80
                                        ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                                        : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                        }`}
                                    >
                                      ⚡ HPI {ai.score}
                                    </span>
                                    {ai.score >= 68 && agf.percentage <= 12 && agf.percentage > 0 && (
                                      <span
                                        className="px-1 py-0.2 rounded bg-purple-500/25 border border-purple-400/40 text-purple-300 text-[9px] font-black animate-pulse"
                                        title={`Değer Atı: AI ${ai.score} puan verdi, AGF sadece %${agf.percentage.toFixed(1)}`}
                                      >
                                        🎯 RADAR
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Expanded Detail Row (Pedigree, Coach, Owner, AI Reasons, Best Grade) */}
                            {isExpanded && (
                              <div className="px-4 pb-3 pt-1 bg-slate-950/60 border-t border-slate-800/60 text-xs grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-1 text-slate-300">
                                  <div>
                                    <strong className="text-slate-400">Sahip:</strong> {horse.owner || '-'}{' '}
                                    • <strong className="text-slate-400">Antrenör:</strong> {horse.coach || '-'}
                                  </div>
                                  <div>
                                    <strong className="text-slate-400">Yetiştirici:</strong> {horse.breeder || '-'}
                                    {horse.bestGrade?.descriptionText ? (
                                      <span className="block text-[11px] text-cyan-300 mt-0.5">
                                        {horse.bestGrade.descriptionText}
                                      </span>
                                    ) : null}
                                  </div>
                                  {horse.jockey.isJockeyChanged && (
                                    <div className="text-amber-300 font-bold">
                                      Jokey Değişikliği: {horse.jockey.oldJockeyName} → {horse.jockey.name}
                                    </div>
                                  )}
                                </div>
                                {ai && (
                                  <div className="space-y-1">
                                    <div className="text-[11px] font-black text-emerald-300 flex items-center space-x-1">
                                      <Sparkles className="w-3.5 h-3.5" />
                                      <span>ProAnaliz AI Koşu Notları (Skor: {ai.score}/100)</span>
                                    </div>
                                    <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-0.5">
                                      {ai.reasons.map((r, i) => (
                                        <li key={i}>{r}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Top Ikili Probables Strip if Available */}
                    {activeRace.ikiliProbables && activeRace.ikiliProbables.length > 0 && (
                      <div className="px-4 py-2.5 bg-slate-950/60 border-t border-slate-800 flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-amber-400">
                          Muhtemel Sıralı / İkili Favorileri:
                        </span>
                        {activeRace.ikiliProbables.slice(0, 8).map((ip, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[11px] font-mono text-slate-200"
                          >
                            {ip.runner1}/{ip.runner2}:{' '}
                            <strong className="text-amber-300">{ip.ganyan.toFixed(2)}</strong>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* RIGHT SIDEBAR: STICKY NESINE KUPON HESAPLAYICI */}
              <aside className="w-full xl:w-[360px] shrink-0 xl:sticky xl:top-[6.5rem] xl:h-[calc(100vh-7.5rem)] min-h-[580px] flex flex-col">
                <div className="rounded-2xl bg-slate-900/95 border border-amber-500/30 shadow-2xl overflow-hidden flex flex-col flex-1 min-h-0">
                  {/* Coupon Header */}
                  <div className="px-4 py-3 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 text-slate-950 flex items-center justify-between shrink-0">
                    <div className="flex items-center space-x-2">
                      <Ticket className="w-4 h-4 font-black" />
                      <div>
                        <div className="text-xs font-black tracking-wide uppercase">
                          {activeGame ? activeGame.label : "At Yarışı Kuponu"}
                        </div>
                        <div className="text-[10px] font-bold opacity-85">
                          {detail.program.place} • {legRaceNumbers.length} Ayak
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={clearProgramCoupon}
                      className="p-1.5 rounded-lg bg-slate-950/15 hover:bg-slate-950/25 text-slate-950 transition-colors cursor-pointer"
                      title="Kuponu Temizle"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Sidebar Navigation Tabs */}
                  <div className="flex bg-slate-950/90 p-1 border-b border-slate-800 gap-1 shrink-0">
                    <button
                      onClick={() => setSidebarTab('active')}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-black transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${sidebarTab === 'active'
                        ? 'bg-amber-400 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                        }`}
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      <span>Aktif Kupon {totalCombinations > 0 ? `(${totalCombinations} Kolon)` : ''}</span>
                    </button>
                    <button
                      onClick={() => setSidebarTab('saved')}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-black transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${sidebarTab === 'saved'
                        ? 'bg-amber-400 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                        }`}
                    >
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      <span>Kayıtlı ({savedCoupons.length})</span>
                    </button>
                  </div>

                  {sidebarTab === 'saved' ? (
                    <div className="p-3 space-y-2.5 overflow-y-auto flex-1 min-h-0 overscroll-auto touch-pan-y">
                      <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                        <span className="text-xs font-black text-slate-300">
                          Kayıtlı Kuponlarım ({savedCoupons.length})
                        </span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setIsSavedCouponsModalOpen(true)}
                            className="text-[11px] text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
                          >
                            Tam Ekran ↗
                          </button>
                          {savedCoupons.length > 0 && (
                            <button
                              onClick={handleClearAllSavedCoupons}
                              className="text-[11px] text-slate-400 hover:text-rose-400 cursor-pointer"
                            >
                              Temizle
                            </button>
                          )}
                        </div>
                      </div>

                      {savedCoupons.length === 0 ? (
                        <div className="py-12 text-center space-y-2">
                          <Award className="w-8 h-8 mx-auto text-slate-600" />
                          <p className="text-xs text-slate-400">Henüz kayıtlı bir kuponunuz yok.</p>
                          <button
                            onClick={() => setSidebarTab('active')}
                            className="text-xs text-amber-400 hover:underline font-bold"
                          >
                            Aktif Kupona Dön →
                          </button>
                        </div>
                      ) : (
                        savedCoupons.map((coupon) => (
                          <SavedCouponCard
                            key={coupon.id}
                            coupon={coupon}
                            currentDetail={detail}
                            activeLegRaceNumbers={legRaceNumbers}
                            onSelectProgram={handleSelectProgram}
                            onLoadCoupon={handleLoadCouponIntoWorkspace}
                            onDelete={handleDeleteSavedCoupon}
                          />
                        ))
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Coupon Legs - Full Roomy Scrollable Height */}
                      <div className="p-3 space-y-2.5 overflow-y-auto flex-1 min-h-0 overscroll-auto touch-pan-y">
                        {legRaceNumbers.map((rNo, idx) => {
                          const raceObj = detail.races.find((r) => r.number === rNo);
                          const picked = currentSelections[rNo] || [];
                          const isCurrentRace = selectedRaceNo === rNo;
                          const winner = raceObj?.horses.find((h) => h.order === 1);
                          const isLegWon = winner && picked.includes(winner.number);
                          const isLegLost = winner && picked.length > 0 && !picked.includes(winner.number);

                          return (
                            <div
                              key={rNo}
                              onClick={() => setSelectedRaceNo(rNo)}
                              className={`p-2.5 rounded-xl border cursor-pointer transition-all ${isCurrentRace
                                ? 'bg-emerald-500/10 border-emerald-400/60 shadow-sm'
                                : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                                }`}
                            >
                              <div className="flex items-center justify-between text-xs mb-1.5">
                                <div className="flex items-center space-x-1.5">
                                  <span className="font-black text-amber-400">{idx + 1}. Ayak</span>
                                  <span className="text-[11px] text-slate-400">
                                    ({rNo}. Koşu {raceObj?.hour})
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  {isLegWon && (
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-black">
                                      TUTTU ({winner.number})
                                    </span>
                                  )}
                                  {isLegLost && (
                                    <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-black">
                                      YATTI ({winner.number})
                                    </span>
                                  )}
                                  <span className="text-[10px] font-bold text-slate-400">
                                    {picked.length === 1 ? 'TEK' : `${picked.length} At`}
                                  </span>
                                </div>
                              </div>

                              {picked.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5 pt-0.5">
                                  {picked.map((hNo) => {
                                    const hObj = raceObj?.horses.find((h) => h.number === hNo);
                                    const isSingle = picked.length === 1;
                                    const isWinnerHorse = winner && winner.number === hNo;

                                    return (
                                      <button
                                        key={hNo}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleHorsePick(rNo, hNo);
                                        }}
                                        className={`px-2 py-1 rounded-lg text-xs font-mono font-black cursor-pointer transition-all flex items-center space-x-1 ${isWinnerHorse
                                          ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-300 shadow-md font-black'
                                          : isSingle
                                            ? 'bg-amber-400 text-slate-950 shadow-sm'
                                            : 'bg-slate-800 hover:bg-rose-500/30 text-white border border-slate-700'
                                          }`}
                                        title="Kaldırmak için tıklayın"
                                      >
                                        <span>#{hNo}</span>
                                        {hObj && (
                                          <span className="font-sans font-bold text-[10px] max-w-[75px] truncate">
                                            {hObj.name}
                                          </span>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="text-[11px] text-slate-500 italic flex items-center justify-between py-1">
                                  <span>Bu ayaktan at seçin</span>
                                  <ChevronRight className="w-3.5 h-3.5 text-amber-500/70" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Misli, Birim & Totals Footer */}
                      <div className="p-3.5 bg-slate-950/95 border-t border-slate-800 space-y-3 shrink-0">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">Birim (₺)</label>
                            <select
                              value={unitPrice}
                              onChange={(e) => setUnitPrice(Number(e.target.value))}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-white"
                            >
                              <option value={1}>1.00 ₺ (TJK)</option>
                              <option value={0.5}>0.50 ₺</option>
                              <option value={0.8}>0.80 ₺</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">Misli</label>
                            <div className="flex items-center rounded-lg bg-slate-900 border border-slate-700 overflow-hidden">
                              <button
                                onClick={() => setMisli((m) => Math.max(1, m - 1))}
                                className="px-2.5 py-1.5 text-slate-300 hover:bg-slate-800 font-black text-xs cursor-pointer"
                              >
                                -
                              </button>
                              <span className="flex-1 text-center font-mono font-black text-xs text-white">
                                {misli}x
                              </span>
                              <button
                                onClick={() => setMisli((m) => Math.min(100, m + 1))}
                                className="px-2.5 py-1.5 text-slate-300 hover:bg-slate-800 font-black text-xs cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="text-slate-400 font-semibold">Toplam Kolon:</span>
                          <span className="font-mono font-black text-white">
                            {totalCombinations.toLocaleString('tr-TR')} Kolon
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-300 font-extrabold">Kupon Bedeli:</span>
                          <span className="font-mono font-black text-lg text-amber-400">
                            {totalCouponCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setSubTab('ai_coupons')}
                            className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-400/30 font-black text-xs cursor-pointer transition-all flex items-center justify-center space-x-1"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>AI Şablonlar</span>
                          </button>
                          <button
                            disabled={totalCombinations === 0}
                            onClick={handleSaveCoupon}
                            className="px-3 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black text-xs cursor-pointer disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-1 shadow-lg shadow-emerald-500/20"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Kuponu Kaydet</span>
                          </button>
                        </div>

                        {savedCoupons.length > 0 && (
                          <div className="pt-0.5 text-center">
                            <button
                              onClick={() => setSidebarTab('saved')}
                              className="text-[11px] text-amber-400/90 hover:text-amber-300 font-bold hover:underline flex items-center justify-center space-x-1 mx-auto cursor-pointer"
                            >
                              <Award className="w-3 h-3" />
                              <span>Kayıtlı {savedCoupons.length} kuponunuz var → İncele</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </aside>
            </div>
          )}
        </>
      )}

      {/* Horse Racing Dedicated AI Altılı Robotu Modal */}
      <HorseAIChatModal
        isOpen={isHorseAIChatOpen}
        onClose={() => setIsHorseAIChatOpen(false)}
        detail={detail}
        availableGames={availableGames}
        activeGame={activeGame}
        onApplyCoupon={applyGeneratedCoupon}
      />

      {/* 📱 Mobile Floating Coupon Summary Bar (< xl) */}
      {totalPicksInCoupon > 0 && (
        <div className="xl:hidden fixed bottom-16 left-0 right-0 z-40 bg-slate-900/95 border-t border-amber-500/40 p-2.5 px-3.5 backdrop-blur-xl shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 flex flex-col items-center justify-center font-black shrink-0 shadow-md shadow-amber-500/20">
              <span className="text-xs leading-none">{totalPicksInCoupon}</span>
              <span className="text-[8px] uppercase tracking-tighter">At</span>
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black text-white flex items-center gap-1.5 truncate">
                <span>{activeGame?.label || 'Kupon'}</span>
                <span className="text-amber-400 font-mono font-black">{totalCouponCost.toFixed(2)} ₺</span>
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {totalCombinations} Kolon • {misli} Misli
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setIsMobileCouponDrawerOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/30 flex items-center space-x-1.5 cursor-pointer active:scale-95 transition-all"
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>Kuponu Gör</span>
            </button>
          </div>
        </div>
      )}



      {/* 📱 Mobile Coupon Bottom Sheet Drawer Modal */}
      {isMobileCouponDrawerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/80 backdrop-blur-md animate-fade-in p-0 sm:p-4"
          onClick={() => setIsMobileCouponDrawerOpen(false)}
        >
          <div
            className="w-full max-w-lg max-h-[85vh] rounded-t-3xl sm:rounded-2xl bg-slate-900 border border-amber-500/30 shadow-2xl flex flex-col overflow-hidden animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 text-slate-950 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <Ticket className="w-4 h-4 font-black" />
                <div>
                  <div className="text-xs font-black tracking-wide uppercase">
                    {activeGame ? activeGame.label : 'At Yarışı Kuponu'}
                  </div>
                  <div className="text-[10px] font-bold opacity-85">
                    {detail?.program.place} • {legRaceNumbers.length} Ayak
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={clearProgramCoupon}
                  className="p-1.5 rounded-lg bg-slate-950/15 hover:bg-slate-950/25 text-slate-950 transition-colors cursor-pointer"
                  title="Kuponu Temizle"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsMobileCouponDrawerOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-950/15 hover:bg-slate-950/25 text-slate-950 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mobile Drawer Tabs */}
            <div className="flex bg-slate-950 p-1 border-b border-slate-800 shrink-0 gap-1">
              <button
                onClick={() => setMobileDrawerTab('current')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all ${mobileDrawerTab === 'current'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
                  }`}
              >
                Aktif Kupon ({totalPicksInCoupon} At)
              </button>
              <button
                onClick={() => setMobileDrawerTab('saved')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all flex items-center justify-center space-x-1.5 ${mobileDrawerTab === 'saved'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
                  }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Kayıtlı Kuponlar ({savedCoupons.length})</span>
              </button>
            </div>

            {mobileDrawerTab === 'saved' ? (
              <div className="p-3 space-y-2 overflow-y-auto flex-1 overscroll-auto touch-pan-y">
                {savedCoupons.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Henüz kayıtlı kuponunuz bulunmuyor.
                  </div>
                ) : (
                  savedCoupons.map((coupon) => (
                    <SavedCouponCard
                      key={coupon.id}
                      coupon={coupon}
                      currentDetail={detail}
                      activeLegRaceNumbers={legRaceNumbers}
                      onSelectProgram={handleSelectProgram}
                      onLoadCoupon={handleLoadCouponIntoWorkspace}
                      onDelete={handleDeleteSavedCoupon}
                    />
                  ))
                )}
              </div>
            ) : (
              <>
                {/* Legs List */}
                <div className="p-3 space-y-2 overflow-y-auto flex-1 min-h-0 overscroll-auto touch-pan-y">
                  {legRaceNumbers.map((rNo, idx) => {
                    const raceObj = detail?.races.find((r) => r.number === rNo);
                    const picked = currentSelections[rNo] || [];
                    const isCurrentRace = selectedRaceNo === rNo;
                    const winner = raceObj?.horses.find((h) => h.order === 1);
                    const isLegWon = winner && picked.includes(winner.number);
                    const isLegLost = winner && picked.length > 0 && !picked.includes(winner.number);

                    return (
                      <div
                        key={rNo}
                        onClick={() => {
                          setSelectedRaceNo(rNo);
                          setIsMobileCouponDrawerOpen(false);
                        }}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all ${isCurrentRace
                          ? 'bg-emerald-500/10 border-emerald-400/60 shadow-sm'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                          }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-black text-amber-400">{idx + 1}. Ayak</span>
                            <span className="text-[11px] text-slate-400">
                              ({rNo}. Koşu {raceObj?.hour})
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            {isLegWon && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-black">
                                TUTTU ({winner.number})
                              </span>
                            )}
                            {isLegLost && (
                              <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-black">
                                YATTI ({winner.number})
                              </span>
                            )}
                            <span className="text-[10px] font-bold text-slate-400">
                              {picked.length === 1 ? 'TEK' : `${picked.length} At`}
                            </span>
                          </div>
                        </div>

                        {picked.length === 0 ? (
                          <div className="text-[11px] text-amber-400/80 italic font-semibold py-1">
                            ⚠️ Henüz at seçilmedi (Koşuya gitmek için tıklayın)
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {picked.map((hNo) => {
                              const hObj = raceObj?.horses.find((h) => h.number === hNo);
                              const isSingle = picked.length === 1;
                              const isWinnerHorse = winner && winner.number === hNo;

                              return (
                                <span
                                  key={hNo}
                                  className={`px-2 py-1 rounded-lg text-xs font-mono font-black flex items-center space-x-1 ${isWinnerHorse
                                    ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-300 shadow-md font-black'
                                    : isSingle
                                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    }`}
                                >
                                  <span>#{hNo}</span>
                                  {hObj && <span className="font-sans font-bold text-[10px] max-w-[80px] truncate">{hObj.name}</span>}
                                  {isSingle && <span className="text-[9px] font-black uppercase ml-0.5">TEK</span>}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Misli, Total & Action Buttons */}
                <div className="p-3.5 bg-slate-950 border-t border-slate-800 space-y-3 shrink-0">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-400">Misli:</span>
                      <div className="flex items-center rounded-lg bg-slate-900 border border-slate-700 overflow-hidden">
                        <button
                          onClick={() => setMisli((m) => Math.max(1, m - 1))}
                          className="px-2.5 py-1 text-slate-300 hover:bg-slate-800 font-black text-xs cursor-pointer"
                        >
                          -
                        </button>
                        <span className="px-2 font-mono font-black text-xs text-white">{misli}x</span>
                        <button
                          onClick={() => setMisli((m) => Math.min(100, m + 1))}
                          className="px-2.5 py-1 text-slate-300 hover:bg-slate-800 font-black text-xs cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400">{totalCombinations} Kolon</div>
                      <div className="text-base font-black font-mono text-amber-400">{totalCouponCost.toFixed(2)} ₺</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        handleSaveCoupon();
                        setIsMobileCouponDrawerOpen(false);
                      }}
                      disabled={totalCombinations === 0}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-40 transition-all"
                    >
                      Kuponu Kaydet
                    </button>
                    <button
                      onClick={() => setIsMobileCouponDrawerOpen(false)}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
                    >
                      Kapat
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 📋 Dedicated Full-Screen Saved Coupons Modal */}
      {isSavedCouponsModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsSavedCouponsModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl max-h-[85vh] rounded-3xl bg-slate-900 border border-amber-500/30 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/70">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <span>Kayıtlı At Yarışı Kuponlarım</span>
                    <span className="px-2 py-0.2 rounded-full bg-amber-400 text-slate-950 text-xs font-black">
                      {savedCoupons.length}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Gelen atlar, tuttu/tutmadı sonuçları ve canlı ayak durumu
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {savedCoupons.length > 0 && (
                  <button
                    onClick={handleClearAllSavedCoupons}
                    className="text-xs text-slate-400 hover:text-rose-400 font-semibold px-2 py-1 rounded-lg hover:bg-rose-500/10 cursor-pointer transition-colors"
                  >
                    Tümünü Temizle
                  </button>
                )}
                <button
                  onClick={() => setIsSavedCouponsModalOpen(false)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1 overscroll-auto touch-pan-y">
              {savedCoupons.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-3xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-500">
                    <Ticket className="w-7 h-7" />
                  </div>
                  <div className="text-sm font-bold text-slate-300">Henüz Kayıtlı Kuponunuz Yok</div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Bültenden at seçip &quot;Kuponu Kaydet&quot; butonuna bastığınızda kuponlarınız burada saklanır ve yarışlar bittikçe gelen atlar yeşil renkle otomatik işaretlenir.
                  </p>
                </div>
              ) : (
                savedCoupons.map((coupon) => (
                  <SavedCouponCard
                    key={coupon.id}
                    coupon={coupon}
                    currentDetail={detail}
                    activeLegRaceNumbers={legRaceNumbers}
                    onSelectProgram={handleSelectProgram}
                    onLoadCoupon={handleLoadCouponIntoWorkspace}
                    onDelete={handleDeleteSavedCoupon}
                  />
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 border-t border-slate-800 bg-slate-950/80 flex justify-end shrink-0">
              <button
                onClick={() => setIsSavedCouponsModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📺 TJK TV Canlı Yayın Oynatıcısı (Sayfada Küçük Ekran & Büyük Ekran Modalı) */}
      <LiveRacePlayer
        mode={livePlayerMode}
        onSetMode={setLivePlayerMode}
        race={activeRace}
        programPlace={detail?.program.place}
        allRaces={detail?.races || []}
        onSelectRace={(raceNo) => setSelectedRaceNo(raceNo)}
        programs={programs}
        selectedProgramId={selectedProgramId}
        onSelectProgram={(pid) => handleSelectProgram(pid)}
      />

      {/* Footer Yasal Uyarı / Sorumluluk Reddi */}
      <div className={`w-full mt-6 pt-4 border-t border-slate-800/80 text-center space-y-1 text-slate-500 text-[11px] ${totalPicksInCoupon > 0 ? 'pb-24 xl:pb-8' : 'pb-8'
        }`}>
        <p className="max-w-2xl mx-auto leading-relaxed">
          ⚠️ <strong>Yasal Uyarı:</strong> Bu sayfada yer alan AGF oranları, jokey analizleri ve yapay zeka altılı kurguları saf istatistiki algoritmalara dayanmaktadır; kesinlikle yatırım veya müşterek bahis tavsiyesi niteliğinde değildir (YTD).
        </p>
      </div>

      {/* Floating AI Altılı Robotu FAB (Hareketli & İstenen Yere Taşınabilir) */}
      <DraggableAIFab
        id="horse"
        onClick={() => setIsHorseAIChatOpen(true)}
        title="AI At Yarışı & Altılı Ganyan Robotu"
        label="AI Altılı Robotu"
        gradientClass="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500"
        borderColorClass="border-amber-200/70"
        shadowColorClass="shadow-amber-500/40 hover:shadow-amber-500/70"
        defaultBottomOffset={totalPicksInCoupon > 0 ? 128 : 84}
      />
    </div>
  );
};

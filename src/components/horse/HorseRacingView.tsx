// src/components/horse/HorseRacingView.tsx
import React, { useEffect, useMemo, useState } from 'react';
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
import {
  fetchHorseRacingBulletin,
  fetchHorseRacingProgram,
} from '../../services/horseRacingService';
import {
  GameConfig,
  analyzeRaceHorses,
  calculateCouponCombinations,
  generateAICoupons,
  getAvailableGames,
  getHorsePrimaryAgf,
  getLegBadgeForRace,
  getLegRaceNumbers,
} from '../../utils/horseRacingEngine';

type HRSubTab = 'bulletin' | 'ai_coupons' | 'results' | 'changes';
type SortMode = 'number' | 'agf' | 'ganyan' | 'ai' | 'handicap';

interface HorseRacingViewProps {
  user?: User | null;
  onOpenVIP?: () => void;
  onShowToast?: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

export const HorseRacingView: React.FC<HorseRacingViewProps> = ({ user, onOpenVIP, onShowToast }) => {
  const [programs, setPrograms] = useState<HippodromeProgram[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);
  const [detail, setDetail] = useState<ProgramDetail | null>(null);
  const [selectedRaceNo, setSelectedRaceNo] = useState<number>(1);
  const [selectedGameId, setSelectedGameId] = useState<string>('ALTILI_1');
  const [subTab, setSubTab] = useState<HRSubTab>('bulletin');
  const [sortMode, setSortMode] = useState<SortMode>('number');
  const [loading, setLoading] = useState<boolean>(true);
  const [programLoading, setProgramLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [expandedHorse, setExpandedHorse] = useState<number | null>(null);
  const [isHorseAIChatOpen, setIsHorseAIChatOpen] = useState<boolean>(false);

  // Kupon state: programId -> { raceNo -> horseNumbers[] }
  const [selectionsByProgram, setSelectionsByProgram] = useState<
    Record<number, Record<number, number[]>>
  >({});
  const [misli, setMisli] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(1.0);
  const [savedCoupons, setSavedCoupons] = useState<
    { id: string; title: string; combos: number; cost: number; stakeStr: string; time: string }[]
  >(() => {
    try {
      const raw = localStorage.getItem('proanaliz_hr_coupons');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Initial bulletin fetch + auto live poll every 30s if active races exist
  const loadBulletin = async (targetPid?: number | null, force = false) => {
    try {
      if (!detail) setLoading(true);
      setErrorMsg(null);
      const resp = await fetchHorseRacingBulletin(targetPid, force);
      setPrograms(resp.programs || []);
      const pid = resp.selectedProgramId || resp.programs?.[0]?.id || null;
      setSelectedProgramId(pid);
      if (resp.activeProgramDetail) {
        setDetail(resp.activeProgramDetail);
        const firstOpen =
          resp.activeProgramDetail.races.find((r) => !r.isFinished) ||
          resp.activeProgramDetail.races[0];
        if (firstOpen && force === false && selectedRaceNo === 1) {
          setSelectedRaceNo(firstOpen.number);
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Canlı TJK verisi şu anda alınamıyor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBulletin(null, false);
    const timer = setInterval(() => {
      if (selectedProgramId) {
        fetchHorseRacingProgram(selectedProgramId, false)
          .then((d) => setDetail(d))
          .catch(() => {});
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
    if (selectedProgramId) {
      setProgramLoading(true);
      try {
        const [b, d] = await Promise.all([
          fetchHorseRacingBulletin(selectedProgramId, true),
          fetchHorseRacingProgram(selectedProgramId, true),
        ]);
        setPrograms(b.programs || []);
        setDetail(d);
        onShowToast?.('TJK & AGF oranları canlı güncellendi', 'success');
      } catch {
        onShowToast?.('Yenileme sırasında bağlantı hatası', 'warning');
      } finally {
        setProgramLoading(false);
      }
    } else {
      await loadBulletin(null, true);
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

  // Real-time race countdown ticker
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeMs(Date.now());
    }, 1000);
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

  const applyGeneratedCoupon = (coupon: GeneratedAltiliCoupon) => {
    if (!selectedProgramId) return;
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

  const handleSaveCoupon = () => {
    if (!activeGame || !detail || totalCombinations === 0) return;
    const legStr = legRaceNumbers
      .map((rNo) => (currentSelections[rNo] || []).join(','))
      .join(' / ');
    const entry = {
      id: `${Date.now()}`,
      title: `${detail.program.place} • ${activeGame.label}`,
      combos: totalCombinations,
      cost: totalCouponCost,
      stakeStr: legStr,
      time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    };
    const next = [entry, ...savedCoupons].slice(0, 15);
    setSavedCoupons(next);
    try {
      localStorage.setItem('proanaliz_hr_coupons', JSON.stringify(next));
    } catch {}
    onShowToast?.(
      `${entry.title} kaydedildi (${totalCombinations} kolon • ${totalCouponCost.toFixed(2)} ₺)`,
      'success'
    );
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
      <section className="rounded-2xl bg-slate-900/90 border border-slate-800/90 p-3 sm:p-4 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-black text-[11px] tracking-wide flex items-center space-x-1">
              <span>🏇</span>
              <span>TJK CANLI BÜLTEN</span>
            </span>
            <span className="text-xs text-slate-400 font-semibold hidden sm:inline">
              Nesine / TJK Resmi Program, Canlı AGF &amp; AI Altılı Motoru
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {detail?.updatedAt && (
              <span className="text-[11px] text-slate-400 font-mono hidden md:inline">
                Güncelleme: {new Date(detail.updatedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
            <button
              onClick={handleManualRefresh}
              disabled={programLoading}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-300 font-bold text-xs cursor-pointer transition-all disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${programLoading ? 'animate-spin' : ''}`} />
              <span>Canlı AGF Yenile</span>
            </button>
          </div>
        </div>

        {/* Domestic Hippodromes */}
        {trPrograms.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-wider text-amber-400">
              <Flag className="w-3 h-3" />
              <span>Yurt İçi Hipodromlar (Türkiye)</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {trPrograms.map((p) => {
                const isSel = p.id === selectedProgramId;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectProgram(p.id)}
                    className={`shrink-0 text-left px-3 py-2 rounded-xl border transition-all cursor-pointer min-w-[148px] ${
                      isSel
                        ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 border-amber-300 shadow-lg shadow-amber-500/20'
                        : 'bg-slate-950/70 hover:bg-slate-800/80 text-white border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-black text-xs truncate">{p.place}</span>
                      {!p.isCompleted ? (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                            isSel ? 'bg-slate-950 text-emerald-400' : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {p.beginRaceHour === 'Yarın' || p.beginRaceHour === 'Cuma' ? p.beginRaceHour : 'AÇIK'}
                        </span>
                      ) : (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            isSel ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          BİTTİ
                        </span>
                      )}
                    </div>
                    <div
                      className={`text-[10px] mt-0.5 font-semibold flex items-center justify-between ${
                        isSel ? 'text-slate-900' : 'text-slate-400'
                      }`}
                    >
                      <span>{p.date}</span>
                      <span>
                        {p.openingHour}–{p.closingHour}
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
          <div className="space-y-1.5">
            <div className="flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-wider text-cyan-400">
              <Globe className="w-3 h-3" />
              <span>Yurt Dışı Hipodromlar (ABD / İngiltere / Güney Amerika / Avustralya)</span>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {foreignPrograms.map((p) => {
                const isSel = p.id === selectedProgramId;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectProgram(p.id)}
                    className={`shrink-0 text-left px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                      isSel
                        ? 'bg-cyan-400 text-slate-950 border-cyan-300 font-black shadow-md shadow-cyan-500/20'
                        : 'bg-slate-950/60 hover:bg-slate-800 text-slate-200 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-[11px]">{p.place}</span>
                      {!p.isCompleted ? (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSel ? 'bg-slate-950' : 'bg-emerald-400 animate-pulse'
                          }`}
                        />
                      ) : null}
                      <span className={`text-[10px] font-mono ${isSel ? 'text-slate-900' : 'text-slate-400'}`}>
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

              {/* Main View Sub-Tabs */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'bulletin', label: 'Bülten & Kupon', icon: Ticket },
                  { id: 'ai_coupons', label: `AI Altılı Şablonları (${aiCoupons.length})`, icon: Sparkles },
                  { id: 'results', label: 'Sonuçlar & İkramiye', icon: Trophy },
                  {
                    id: 'changes',
                    label: `Çıkan & Jokey (${detail.scratches.length + detail.jockeyChanges.length})`,
                    icon: AlertTriangle,
                  },
                ].map((t) => {
                  const Icon = t.icon;
                  const active = subTab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSubTab(t.id as HRSubTab)}
                      className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                        active
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20'
                          : 'bg-slate-950/70 hover:bg-slate-800 text-slate-300 border-slate-800'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
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
                      className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border transition-all cursor-pointer ${
                        isAct
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

          {/* SUBTAB 2: AI ALTILI TEMPLATES */}
          {subTab === 'ai_coupons' && (
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-black ${
                              c.strategy === 'EKONOMİK'
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
                                className={`px-2 py-0.5 rounded font-mono font-black text-[11px] ${
                                  leg.banko === hNo
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
            </section>
          )}

          {/* SUBTAB 3: RESULTS & PAYOUTS */}
          {subTab === 'results' && (
            <section className="space-y-4">
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
                            className={`px-2 py-0.5 rounded text-[10px] font-black ${
                              r.isFinished
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
          )}

          {/* SUBTAB 1: MAIN NESINE BULLETIN & COUPON BUILDER */}
          {subTab === 'bulletin' && (
            <div className="flex flex-col xl:flex-row gap-4 items-start">
              {/* LEFT / MAIN: RACE TABS + RUNNER TABLE */}
              <div className="flex-1 w-full min-w-0 space-y-3">
                {/* Race Selector Tabs (1. Koşu .. N. Koşu) */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
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
                        className={`shrink-0 px-3 py-2 rounded-xl border text-left transition-all cursor-pointer min-w-[116px] ${
                          isSel
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20'
                            : 'bg-slate-900/90 hover:bg-slate-800 text-white border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-black text-xs">{r.number}. Koşu</span>
                          <span
                            className={`text-[10px] font-mono font-bold ${
                              isSel ? 'text-slate-900' : 'text-slate-400'
                            }`}
                          >
                            {r.hour}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-1 mt-1">
                          <span className={`text-[10px] font-semibold ${isSel ? 'text-slate-900' : 'text-slate-400'}`}>
                            {r.distance} {r.raceCourseType}
                          </span>
                          {legBadge && (
                            <span
                              className={`px-1 py-0.2 rounded text-[9px] font-black ${
                                isSel
                                  ? 'bg-slate-950 text-amber-300'
                                  : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                              }`}
                            >
                              {legBadge}.AYAK
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span
                            className={`text-[9px] font-black ${
                              r.isFinished
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
                              className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                                isSel ? 'bg-slate-950 text-white' : 'bg-emerald-500 text-slate-950'
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
                                className={`px-2 py-0.5 rounded text-xs font-black flex items-center gap-1.5 ${
                                  raceCountdown.status === 'urgent'
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
                            <option value="ai">Sıra: AI Skor (Yüksekten)</option>
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
                            className={`transition-colors ${
                              isScratched
                                ? 'bg-rose-950/15 opacity-55'
                                : isPicked
                                ? 'bg-emerald-500/10'
                                : 'hover:bg-slate-800/40'
                            }`}
                          >
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 px-3 sm:px-4 py-2.5 items-center">
                              {/* Col 1: Saddle Cloth + Forma */}
                              <div className="md:col-span-1 flex items-center space-x-2">
                                <button
                                  disabled={isScratched}
                                  onClick={() => toggleHorsePick(activeRace.number, horse.number)}
                                  className={`w-9 h-9 rounded-xl font-black text-sm flex items-center justify-center border transition-all cursor-pointer shrink-0 disabled:cursor-not-allowed ${
                                    isScratched
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
                                    className="w-7 h-7 rounded-md object-cover border border-slate-700 hidden sm:block"
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
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                                        horse.order === 1
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
                                    className={`font-black text-sm truncate ${
                                      isScratched ? 'line-through text-rose-300' : 'text-white'
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
                                    className={`text-xs font-extrabold truncate ${
                                      horse.jockey.isJockeyChanged ? 'text-amber-300' : 'text-slate-200'
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
                              <div className="md:col-span-2 flex items-center gap-1 flex-wrap">
                                {horse.last6.length > 0 ? (
                                  horse.last6.map((f, idx) => (
                                    <span
                                      key={idx}
                                      className={`w-5 h-5 rounded-md text-[10px] flex items-center justify-center font-mono ${getLast6ChipClass(
                                        f.result
                                      )}`}
                                      title={f.raceCourseType || ''}
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
                                        className={`h-full rounded-full ${
                                          agf.isFavorite ? 'bg-amber-400' : 'bg-emerald-500'
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
                                      className={`px-1.5 py-0.2 rounded border text-[9px] ${getTagBadgeClass(
                                        ai.tag
                                      )}`}
                                    >
                                      {ai.score} • {ai.tag}
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
              <aside className="w-full xl:w-[360px] shrink-0 xl:sticky xl:top-20 space-y-3">
                <div className="rounded-2xl bg-slate-900/95 border border-amber-500/30 shadow-2xl overflow-hidden">
                  {/* Coupon Header */}
                  <div className="px-4 py-3 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 text-slate-950 flex items-center justify-between">
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

                  {/* Coupon Legs */}
                  <div className="p-3 space-y-2 max-h-[420px] overflow-y-auto">
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
                          className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                            isCurrentRace
                              ? 'bg-emerald-500/10 border-emerald-400/60'
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
                                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-black">
                                  TUTTU ({winner.number})
                                </span>
                              )}
                              {isLegLost && (
                                <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 text-[9px] font-black">
                                  YATTI ({winner.number})
                                </span>
                              )}
                              <span className="text-[10px] font-bold text-slate-400">
                                {picked.length === 1 ? 'TEK' : `${picked.length} At`}
                              </span>
                            </div>
                          </div>

                          {picked.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {picked.map((hNo) => (
                                <button
                                  key={hNo}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleHorsePick(rNo, hNo);
                                  }}
                                  className={`px-2 py-0.5 rounded-md text-xs font-mono font-black cursor-pointer transition-all ${
                                    picked.length === 1
                                      ? 'bg-amber-400 text-slate-950'
                                      : 'bg-slate-800 hover:bg-rose-500/30 text-white border border-slate-700'
                                  }`}
                                  title="Kaldırmak için tıklayın"
                                >
                                  {hNo}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-500 italic flex items-center justify-between">
                              <span>Bu ayaktan at seçin</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Misli, Birim & Totals */}
                  <div className="p-3.5 bg-slate-950/90 border-t border-slate-800 space-y-3">
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
                  </div>
                </div>

                {/* Saved Horse Coupons History */}
                {savedCoupons.length > 0 && (
                  <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-white flex items-center space-x-1.5">
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        <span>Kayıtlı At Yarışı Kuponlarım</span>
                      </span>
                      <button
                        onClick={() => {
                          setSavedCoupons([]);
                          localStorage.removeItem('proanaliz_hr_coupons');
                        }}
                        className="text-[10px] text-slate-400 hover:text-rose-400 cursor-pointer"
                      >
                        Temizle
                      </button>
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {savedCoupons.map((sc) => (
                        <div
                          key={sc.id}
                          className="p-2 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] space-y-0.5"
                        >
                          <div className="flex items-center justify-between font-bold text-slate-200">
                            <span>{sc.title}</span>
                            <span className="font-mono text-amber-400">{sc.cost.toFixed(2)} ₺</span>
                          </div>
                          <div className="text-[10px] font-mono text-emerald-300 truncate">{sc.stakeStr}</div>
                          <div className="text-[9px] text-slate-500 flex justify-between">
                            <span>{sc.combos} Kolon</span>
                            <span>{sc.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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

      {/* Footer Yasal Uyarı / Sorumluluk Reddi */}
      <div className="w-full mt-6 pt-4 pb-8 border-t border-slate-800/80 text-center space-y-1 text-slate-500 text-[11px]">
        <p className="max-w-2xl mx-auto leading-relaxed">
          ⚠️ <strong>Yasal Uyarı:</strong> Bu sayfada yer alan AGF oranları, jokey analizleri ve yapay zeka altılı kurguları saf istatistiki algoritmalara dayanmaktadır; kesinlikle yatırım veya müşterek bahis tavsiyesi niteliğinde değildir (YTD).
        </p>
      </div>

      {/* Floating AI Altılı Robotu FAB (Horse Racing Only) */}
      <button
        onClick={() => setIsHorseAIChatOpen(true)}
        className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center space-x-2 px-3.5 py-3 sm:px-4 sm:py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 font-black text-xs sm:text-sm shadow-2xl shadow-amber-500/40 hover:shadow-amber-500/70 border-2 border-amber-200/70 active:scale-95 transition-all cursor-pointer group hover:scale-105"
        title="AI At Yarışı & Altılı Ganyan Robotu"
      >
        <div className="relative">
          <Bot className="w-5 h-5 text-slate-950 group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-600 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
          </span>
        </div>
        <span className="font-black tracking-tight">AI Altılı Robotu</span>
        <Sparkles className="w-4 h-4 text-slate-950 fill-current opacity-85 hidden sm:inline" />
      </button>
    </div>
  );
};

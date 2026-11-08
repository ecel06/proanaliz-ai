import React, { useState, useMemo } from 'react';
import { Match, MatchAnalysis, UserBetslipItem } from '../types';
import { runMonteCarloSimulation, MonteCarloResult, toFairOdds } from '../utils/predictionEngine';
import { getMatchBettingMarkets, BettingPickOption } from '../utils/oddsHelper';
import { TeamRadarChart } from './TeamRadarChart';
import { FormBadgeTooltip } from './FormBadgeTooltip';
import { getFormDetails } from '../utils/formDetails';
import {
  X,
  Bot,
  Flame,
  Sparkles,
  TrendingUp,
  Shield,
  ShieldCheck,
  Swords,
  Timer,
  Flag,
  FileWarning,
  Info,
  CheckCircle2,
  Copy,
  Check,
  Dices,
  RefreshCw,
  Scale,
  AlertTriangle,
  Target,
  Compass,
  Ticket,
  Plus
} from 'lucide-react';

interface MatchDetailModalProps {
  match: Match | null;
  analysis: MatchAnalysis | null;
  onClose: () => void;
  betslipItems?: UserBetslipItem[];
  onToggleBetslip?: (match: Match, option: BettingPickOption) => void;
  onOpenBetslip?: () => void;
}

export const MatchDetailModal: React.FC<MatchDetailModalProps> = ({
  match,
  analysis,
  onClose,
  betslipItems = [],
  onToggleBetslip,
  onOpenBetslip
}) => {
  const [activeTab, setActiveTab] = useState<'markets' | 'analysis' | 'monte-carlo' | 'fair-odds'>('markets');
  const [copied, setCopied] = useState(false);
  const [monteCarloResult, setMonteCarloResult] = useState<MonteCarloResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  if (!match || !analysis) return null;

  const { homeTeam, awayTeam } = match;
  const homeFormDetails = getFormDetails(homeTeam, match.league);
  const awayFormDetails = getFormDetails(awayTeam, match.league);
  const marketGroups = useMemo(() => getMatchBettingMarkets(match, analysis), [match, analysis]);
  const selectedPickInMatch = betslipItems.find(it => it.matchId === match.id);
  const {
    ms1,
    msX,
    ms2,
    over15,
    under15,
    over25,
    under25,
    over35,
    under35,
    bttsYes,
    bttsNo,
    topHtFt,
    htFtRanked,
    expectedHomeGoals,
    expectedAwayGoals,
    expectedTotalGoals,
    expectedCorners,
    expectedCards,
    topExactScores,
    homeAttackScore,
    awayAttackScore,
    homeDefenseScore,
    awayDefenseScore,
    homeHtImpactScore,
    awayHtImpactScore,
    primaryPrediction,
    safePrediction,
    surprisePrediction,
    tacticalBreakdown,
    aiComment
  } = analysis;

  const handleCopyReport = () => {
    const text = `📊 ProAnaliz AI - Kapsamlı Maç Analiz Raporu\n` +
      `⚽ ${homeTeam.name} vs ${awayTeam.name}` + (match.iddaaCode ? ` (İddaa Kodu: #${match.iddaaCode})\n` : '\n') +
      `🏆 Lig: ${match.league} (${match.round})\n` +
      `📅 Saat: ${match.date} ${match.time}\n\n` +
      `🎯 1. Ana Tercih: ${primaryPrediction.label} (%${primaryPrediction.confidence} Güven | Adil Oran: ${toFairOdds(primaryPrediction.confidence)})\n` +
      `🛡️ 2. Kasa Tercihi: ${safePrediction?.label || '1.5 Gol Üst'} (%${safePrediction?.confidence || 75} Güven)\n` +
      `🚀 3. Sürpriz Tercih: ${surprisePrediction?.label || topHtFt[0]?.label} (%${surprisePrediction?.confidence || 35} Olasılık)\n\n` +
      `📈 MS Dağılımı: 1: %${ms1} | X: %${msX} | 2: %${ms2}\n` +
      `🎯 Toplam Gol: 2.5 Üst %${over25} | 2.5 Alt %${under25} | xG: ${expectedTotalGoals}\n` +
      `🤝 Karşılıklı Gol: KG Var %${bttsYes} | KG Yok %${bttsNo}\n` +
      `⏱️ En Güçlü İY/MS: ${topHtFt[0]?.label} (%${topHtFt[0]?.prob})\n\n` +
      `💡 AI Taktiksel Özeti: ${aiComment}\n\n` +
      `🛡️ Bahis içermez, Poisson matematik ve makine öğrenmesi modelidir.`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleRunMonteCarlo = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const sim = runMonteCarloSimulation(expectedHomeGoals, expectedAwayGoals, 1000);
      setMonteCarloResult(sim);
      setIsSimulating(false);
    }, 350);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      
      {/* Backdrop click closer */}
      <div className="fixed inset-0" onClick={onClose}></div>

      {/* Modal Dialog Content */}
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto z-10 max-h-[94vh] flex flex-col">
        
        {/* Sticky Top Header */}
        <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            {match.iddaaCode && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-black font-mono bg-amber-400/15 text-amber-300 border border-amber-400/40 tracking-wider">
                İddaa Kodu: #{match.iddaaCode}
              </span>
            )}
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {match.league}
            </span>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              {match.date} • {match.time} • {match.stadium}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Share / Copy Report Button */}
            <button
              onClick={handleCopyReport}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
              title="Analiz Raporunu Kopyala"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Kopyalandı!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Raporu Kopyala</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center px-4 sm:px-5 pt-3 border-b border-slate-800/80 bg-slate-950/40 text-xs font-semibold space-x-3 sm:space-x-4 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('markets')}
            className={`pb-2.5 flex items-center space-x-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'markets'
                ? 'border-emerald-400 text-emerald-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>Tüm Bahis Seçimleri & Oranlar</span>
            {selectedPickInMatch && (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px]">
                Kuponda
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('analysis')}
            className={`pb-2.5 flex items-center space-x-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'analysis'
                ? 'border-emerald-400 text-emerald-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Detaylı Analiz & Yorum</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('monte-carlo');
              if (!monteCarloResult) handleRunMonteCarlo();
            }}
            className={`pb-2.5 flex items-center space-x-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'monte-carlo'
                ? 'border-amber-400 text-amber-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Dices className="w-4 h-4" />
            <span>Monte Carlo Simülasyonu</span>
          </button>

          <button
            onClick={() => setActiveTab('fair-odds')}
            className={`pb-2.5 flex items-center space-x-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'fair-odds'
                ? 'border-purple-400 text-purple-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Adil İstatistiksel Oranlar</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">

          {/* Teams Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-5 sm:p-6 border border-slate-800/80">
            <div className="grid grid-cols-3 items-center text-center">
              
              {/* Home */}
              <div className="space-y-1 sm:space-y-2">
                <div
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl mx-auto flex items-center justify-center text-lg sm:text-2xl font-black text-slate-950 shadow-lg"
                  style={{ backgroundColor: homeTeam.primaryColor || '#10b981' }}
                >
                  {homeTeam.shortName}
                </div>
                <h3 className="font-extrabold text-slate-100 text-sm sm:text-lg flex items-center justify-center space-x-1.5">
                  <span>{homeTeam.name}</span>
                  {homeTeam.rank !== undefined && (
                    <span className="text-[11px] text-emerald-400 font-mono font-bold bg-slate-800/90 border border-slate-700/80 px-1.5 py-0.2 rounded">
                      #{homeTeam.rank}
                    </span>
                  )}
                </h3>
                <div className="flex items-center justify-center space-x-1 pt-0.5">
                  {homeFormDetails.map((detail, i) => (
                    <FormBadgeTooltip
                      key={i}
                      detail={detail}
                      teamName={homeTeam.name}
                      isLast={i === homeFormDetails.length - 1}
                      size="md"
                    />
                  ))}
                </div>
                <div className="text-[11px] text-slate-400">
                  xG Beklentisi: <strong className="text-emerald-400 font-mono">{expectedHomeGoals}</strong>
                </div>
              </div>

              {/* Center Match Status & Primary Badge */}
              <div className="space-y-2">
                <span className="inline-block text-xs uppercase tracking-widest font-black text-slate-500">
                  VS
                </span>
                
                <div className="px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Toplam xG</div>
                  <div className="text-sm sm:text-base font-black text-amber-400 font-mono">{expectedTotalGoals} Gol</div>
                </div>

                <div className="text-[10px] text-slate-400">
                  {match.round}
                </div>
              </div>

              {/* Away */}
              <div className="space-y-1 sm:space-y-2">
                <div
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl mx-auto flex items-center justify-center text-lg sm:text-2xl font-black text-slate-950 shadow-lg"
                  style={{ backgroundColor: awayTeam.primaryColor || '#6366f1' }}
                >
                  {awayTeam.shortName}
                </div>
                <h3 className="font-extrabold text-slate-100 text-sm sm:text-lg flex items-center justify-center space-x-1.5">
                  <span>{awayTeam.name}</span>
                  {awayTeam.rank !== undefined && (
                    <span className="text-[11px] text-purple-400 font-mono font-bold bg-slate-800/90 border border-slate-700/80 px-1.5 py-0.2 rounded">
                      #{awayTeam.rank}
                    </span>
                  )}
                </h3>
                <div className="flex items-center justify-center space-x-1 pt-0.5">
                  {awayFormDetails.map((detail, i) => (
                    <FormBadgeTooltip
                      key={i}
                      detail={detail}
                      teamName={awayTeam.name}
                      isLast={i === awayFormDetails.length - 1}
                      size="md"
                    />
                  ))}
                </div>
                <div className="text-[11px] text-slate-400">
                  xG Beklentisi: <strong className="text-purple-400 font-mono">{expectedAwayGoals}</strong>
                </div>
              </div>

            </div>
          </div>

          {/* TAB 0: TÜM BAHİS SEÇİMLERİ VE ORANLAR (KUPONA EKLE) */}
          {activeTab === 'markets' && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Helper Banner */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                    <Ticket className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-white flex items-center space-x-1.5">
                      <span>Tüm Bahis Seçenekleri & Oranlar</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                        {marketGroups.length} Bahis Pazarı
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-300">
                      İstediğiniz orana tıklayarak kuponunuza ekleyin veya çıkarın.
                    </p>
                  </div>
                </div>

                {betslipItems.length > 0 && onOpenBetslip && (
                  <button
                    onClick={onOpenBetslip}
                    className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shrink-0 cursor-pointer transition-all shadow-md active:scale-95 flex items-center justify-center space-x-1.5"
                  >
                    <Ticket className="w-4 h-4" />
                    <span>Kuponumu Gör ({betslipItems.length} Maç)</span>
                  </button>
                )}
              </div>

              {/* Markets Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {marketGroups.map((group) => (
                  <div key={group.id} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-black text-slate-200 uppercase tracking-wider">
                        {group.name}
                      </h5>
                      {group.description && (
                        <span className="text-[10px] text-slate-500 hidden sm:inline">{group.description}</span>
                      )}
                    </div>

                    <div className={`grid gap-2 ${
                      group.options.length === 2
                        ? 'grid-cols-2'
                        : group.options.length === 3
                        ? 'grid-cols-3'
                        : 'grid-cols-2 sm:grid-cols-3'
                    }`}>
                      {group.options.map((opt) => {
                        const isSelected = betslipItems.some(it => it.matchId === match.id && it.pickKey === opt.key);
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => onToggleBetslip && onToggleBetslip(match, opt)}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative group flex flex-col justify-between active:scale-95 ${
                              isSelected
                                ? 'bg-emerald-500/25 border-emerald-400 text-white shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-400'
                                : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-200 hover:bg-slate-850'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-[11px] font-bold truncate pr-1">{opt.label}</span>
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              )}
                            </div>

                            <div className="flex items-baseline justify-between mt-2 pt-1.5 border-t border-slate-800/80 w-full">
                              <span className="text-[10px] text-slate-400 font-mono">%{opt.probability}</span>
                              <span className={`text-sm font-black font-mono ${isSelected ? 'text-emerald-300 font-extrabold' : 'text-amber-400'}`}>
                                {opt.odd.toFixed(2)}
                              </span>
                            </div>

                            {opt.recommendationBadge && (
                              <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-purple-600 text-white shadow-xs">
                                {opt.recommendationBadge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB 1: DETAILED ANALYSIS & AI COMMENTARY */}
          {activeTab === 'analysis' && (
            <>
              {/* 1. SECTION: 3-TIER STRATEGIC PICKS (ANA BANKO, KASA GÜVENLİ, SÜRPRİZ) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                    <Target className="w-4 h-4 text-emerald-400" />
                    <span>3 Kademeli Analiz & Tercih Rehberi</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">Yapay Zeka Poisson Çıktıları</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Card 1: Ana Tercih */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-b from-emerald-950/40 to-slate-900 border border-emerald-500/40 shadow-lg shadow-emerald-950/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                        1. Ana Banko
                      </span>
                      <span className="text-xs font-black font-mono text-emerald-300">
                        %{primaryPrediction.confidence} Güven
                      </span>
                    </div>
                    <div>
                      <div className="text-base font-black text-white">{primaryPrediction.label}</div>
                      <div className="text-[10px] text-slate-400 font-medium">{primaryPrediction.market} • Adil Oran: {toFairOdds(primaryPrediction.confidence)}</div>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug">
                      {primaryPrediction.reason}
                    </p>
                  </div>

                  {/* Card 2: Kasa / Güvenli Tercih */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-b from-cyan-950/40 to-slate-900 border border-cyan-500/40 shadow-lg shadow-cyan-950/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 rounded-md">
                        2. Kasa / Güvenli
                      </span>
                      <span className="text-xs font-black font-mono text-cyan-300">
                        %{safePrediction?.confidence || 85} Güven
                      </span>
                    </div>
                    <div>
                      <div className="text-base font-black text-white">{safePrediction?.label || '1.5 Gol Üst'}</div>
                      <div className="text-[10px] text-slate-400 font-medium">{safePrediction?.market || 'Güvenli Gol Barajı'} • Adil Oran: {toFairOdds(safePrediction?.confidence || 85)}</div>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug">
                      {safePrediction?.reason || 'Kupon riskini sıfıra yaklaştırmak isteyenler için en emniyetli seçenek.'}
                    </p>
                  </div>

                  {/* Card 3: Sürpriz / Yüksek Oran */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-b from-purple-950/40 to-slate-900 border border-purple-500/40 shadow-lg shadow-purple-950/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 rounded-md">
                        3. Sürpriz / Değer
                      </span>
                      <span className="text-xs font-black font-mono text-purple-300">
                        %{surprisePrediction?.confidence || 35} Olasılık
                      </span>
                    </div>
                    <div>
                      <div className="text-base font-black text-white">{surprisePrediction?.label || topHtFt[0]?.label || 'İY 0 / MS 1'}</div>
                      <div className="text-[10px] text-slate-400 font-medium">{surprisePrediction?.market || 'Yüksek Oran Fırsatı'} • Adil Oran: {toFairOdds(surprisePrediction?.confidence || 35)}</div>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug">
                      {surprisePrediction?.reason || 'Yüksek katsayı ve değer avcıları için taktiksel sürpriz senaryo.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. SECTION: 4-PART DETAILED TACTICAL REPORT */}
              <div className="rounded-2xl bg-slate-950/80 border border-slate-800 p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                    <Bot className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span>Ayrıntılı Taktiksel Maç Raporu</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">Form + xG + Poisson Bütünleşik İnceleme</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Part A: Genel Dinamik */}
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1.5">
                    <div className="flex items-center space-x-1.5 text-slate-200 font-bold">
                      <Compass className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Maçın Dinamiği & Form Analizi</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      {tacticalBreakdown?.overview || aiComment}
                    </p>
                  </div>

                  {/* Part B: Hücum vs Savunma */}
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1.5">
                    <div className="flex items-center space-x-1.5 text-slate-200 font-bold">
                      <Swords className="w-3.5 h-3.5 text-amber-400" />
                      <span>Hücum Gücü vs Savunma Zaafı</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      {tacticalBreakdown?.attackVsDefense || `Ev sahibi xG: ${expectedHomeGoals}, Deplasman xG: ${expectedAwayGoals} (Toplam Gol Beklentisi: ${expectedTotalGoals})`}
                    </p>
                  </div>

                  {/* Part C: İlk Yarı & Oyun Temposu */}
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1.5">
                    <div className="flex items-center space-x-1.5 text-slate-200 font-bold">
                      <Timer className="w-3.5 h-3.5 text-cyan-400" />
                      <span>İlk Yarı Beklentisi & Oyun Temposu</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      {tacticalBreakdown?.tempoTempo || `İlk yarı gol potansiyeli ve tempo projeksiyonu: En güçlü İY/MS ${topHtFt[0]?.label} (%${topHtFt[0]?.prob})`}
                    </p>
                  </div>

                  {/* Part D: Kritik Risk & Dikkat Noktası */}
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1.5">
                    <div className="flex items-center space-x-1.5 text-slate-200 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      <span>Kritik Risk & Dikkat Edilmesi Gerekenler</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      {tacticalBreakdown?.keyRisk || `Beklenen korner: ${expectedCorners}, Beklenen kart: ${expectedCards}. Savunma sertliği ve duran toplar skoru etkileyebilir.`}
                    </p>
                  </div>
                </div>
              </div>

              {/* 1 - X - 2 Probability Progress Bar */}
              <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-300 flex items-center space-x-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span>Maç Sonucu 1 - X - 2 Olasılık Dağılımı</span>
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">Normalleştirilmiş Poisson Çıktısı</span>
                </div>

                {/* Segmented Bar */}
                <div className="h-4 sm:h-5 w-full bg-slate-800 rounded-xl overflow-hidden flex shadow-inner">
                  <div
                    style={{ width: `${ms1}%` }}
                    className="bg-emerald-500 hover:bg-emerald-400 transition-all flex items-center justify-center text-[10px] font-black text-slate-950"
                  >
                    {ms1 >= 15 && `1 (%${ms1})`}
                  </div>
                  <div
                    style={{ width: `${msX}%` }}
                    className="bg-amber-400 hover:bg-amber-300 transition-all flex items-center justify-center text-[10px] font-black text-slate-950"
                  >
                    {msX >= 15 && `X (%${msX})`}
                  </div>
                  <div
                    style={{ width: `${ms2}%` }}
                    className="bg-purple-500 hover:bg-purple-400 transition-all flex items-center justify-center text-[10px] font-black text-white"
                  >
                    {ms2 >= 15 && `2 (%${ms2})`}
                  </div>
                </div>

                {/* Legend Labels */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1 font-semibold">
                  <div className="p-2 rounded-xl bg-slate-900 border border-emerald-500/30 text-emerald-300">
                    <div className="text-[10px] text-slate-400 font-normal">Ev Sahibi (1)</div>
                    <div className="text-sm sm:text-base font-black font-mono">%{ms1}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-amber-500/30 text-amber-300">
                    <div className="text-[10px] text-slate-400 font-normal">Beraberlik (X)</div>
                    <div className="text-sm sm:text-base font-black font-mono">%{msX}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-purple-500/30 text-purple-300">
                    <div className="text-[10px] text-slate-400 font-normal">Deplasman (2)</div>
                    <div className="text-sm sm:text-base font-black font-mono">%{ms2}</div>
                  </div>
                </div>
              </div>

              {/* Over / Under & BTTS Market Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Alt / Üst Olasılıkları */}
                <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-4 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                    <Flame className="w-4 h-4 text-amber-400" />
                    <span>Toplam Gol (Alt / Üst) Oranları</span>
                  </h4>

                  <div className="space-y-2.5">
                    {/* 1.5 Alt/Üst */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-400">1.5 Gol Eşiği</span>
                        <span className="text-slate-200 font-mono">
                          Alt: %{under15} • <strong className="text-emerald-400">Üst: %{over15}</strong>
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                        <div style={{ width: `${under15}%` }} className="bg-slate-600"></div>
                        <div style={{ width: `${over15}%` }} className="bg-emerald-400"></div>
                      </div>
                    </div>

                    {/* 2.5 Alt/Üst */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-400">2.5 Gol Eşiği</span>
                        <span className="text-slate-200 font-mono">
                          Alt: %{under25} • <strong className="text-amber-400">Üst: %{over25}</strong>
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                        <div style={{ width: `${under25}%` }} className="bg-slate-600"></div>
                        <div style={{ width: `${over25}%` }} className="bg-amber-400"></div>
                      </div>
                    </div>

                    {/* 3.5 Alt/Üst */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-400">3.5 Gol Eşiği</span>
                        <span className="text-slate-200 font-mono">
                          Alt: %{under35} • <strong className="text-purple-400">Üst: %{over35}</strong>
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                        <div style={{ width: `${under35}%` }} className="bg-slate-600"></div>
                        <div style={{ width: `${over35}%` }} className="bg-purple-400"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Karşılıklı Gol ve Skor Beklentileri */}
                <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-4 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>Karşılıklı Gol & En Olası Skorlar</span>
                  </h4>

                  {/* KG Var / Yok Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-400">Karşılıklı Gol Durumu</span>
                      <span className="font-mono">
                        <strong className="text-emerald-400">KG Var %{bttsYes}</strong> / KG Yok %{bttsNo}
                      </span>
                    </div>
                    <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
                      <div style={{ width: `${bttsYes}%` }} className="bg-emerald-400"></div>
                      <div style={{ width: `${bttsNo}%` }} className="bg-rose-500"></div>
                    </div>
                  </div>

                  {/* En Olası Skorlar */}
                  <div className="pt-2">
                    <div className="text-[11px] text-slate-400 font-medium mb-1.5">En Yüksek Olasılıklı Skorlar:</div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {topExactScores.map((s, idx) => (
                        <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-1.5 text-center">
                          <div className="text-xs font-black text-slate-200 font-mono">{s.score}</div>
                          <div className="text-[10px] text-emerald-400 font-mono">%{s.prob}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* İlk Yarı / Maç Sonucu (İY/MS) Özel Bölümü */}
              <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center space-x-1.5">
                    <Timer className="w-4 h-4 text-cyan-400" />
                    <span>İlk Yarı / Maç Sonucu (İY/MS) Projeksiyonu</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">9 Olasılık Matrisi</span>
                </div>

                {/* Top 2 Choices Highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {topHtFt.map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border flex items-center justify-between ${
                        idx === 0
                          ? 'bg-emerald-500/10 border-emerald-500/40'
                          : 'bg-indigo-500/10 border-indigo-500/30'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className={`w-4 h-4 ${idx === 0 ? 'text-emerald-400' : 'text-indigo-400'}`} />
                        <div>
                          <div className="text-xs font-black text-slate-100">{item.label}</div>
                          <div className="text-[10px] text-slate-400">{idx === 0 ? 'En Güçlü İY/MS' : 'Alternatif Senaryo'}</div>
                        </div>
                      </div>
                      <div className="text-sm font-black font-mono text-emerald-400">
                        %{item.prob}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mini Grid for other HT/FT options */}
                <div className="grid grid-cols-3 sm:grid-cols-7 gap-1.5 pt-1 text-[11px]">
                  {htFtRanked.slice(2).map((item, idx) => (
                    <div key={idx} className="bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-center">
                      <div className="text-[10px] text-slate-400">{item.label.replace('İY ', '').replace('MS ', '')}</div>
                      <div className="font-bold text-slate-300 font-mono">%{item.prob}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Head-to-Head Comparison Bars & Radar Chart */}
              <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center space-x-1.5">
                    <Swords className="w-4 h-4 text-emerald-400" />
                    <span>İki Takım İstatistik ve Güç Karşılaştırması</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">6 Eksenli Radar Modeli</span>
                </div>

                {/* Radar Hexagon Visualization */}
                <div className="py-2 flex justify-center bg-slate-900/40 rounded-2xl border border-slate-800/60">
                  <TeamRadarChart
                    homeTeam={homeTeam}
                    awayTeam={awayTeam}
                    analysis={analysis}
                  />
                </div>

                <div className="space-y-3 text-xs pt-2 border-t border-slate-800/80">
                  {/* Hücum Gücü */}
                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span className="text-emerald-400">{homeAttackScore} (Hücum)</span>
                      <span className="text-slate-400">Hücum Gücü İndeksi</span>
                      <span className="text-purple-400">{awayAttackScore} (Hücum)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                      <div style={{ width: `${homeAttackScore}%` }} className="bg-emerald-400"></div>
                      <div className="flex-1 bg-slate-800"></div>
                      <div style={{ width: `${awayAttackScore}%` }} className="bg-purple-400"></div>
                    </div>
                  </div>

                  {/* Savunma Direnci */}
                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span className="text-emerald-400">{homeDefenseScore} (Savunma)</span>
                      <span className="text-slate-400">Savunma Direnci</span>
                      <span className="text-purple-400">{awayDefenseScore} (Savunma)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                      <div style={{ width: `${homeDefenseScore}%` }} className="bg-emerald-400"></div>
                      <div className="flex-1 bg-slate-800"></div>
                      <div style={{ width: `${awayDefenseScore}%` }} className="bg-purple-400"></div>
                    </div>
                  </div>

                  {/* İlk Yarı Gol Etkisi */}
                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span className="text-emerald-400">%{Math.round(homeTeam.firstHalfGoalRate * 100)} İY Gol</span>
                      <span className="text-slate-400">İlk Yarı Skor Üretimi</span>
                      <span className="text-purple-400">%{Math.round(awayTeam.firstHalfGoalRate * 100)} İY Gol</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                      <div style={{ width: `${homeHtImpactScore}%` }} className="bg-emerald-400"></div>
                      <div className="flex-1 bg-slate-800"></div>
                      <div style={{ width: `${awayHtImpactScore}%` }} className="bg-purple-400"></div>
                    </div>
                  </div>

                  {/* Korner & Kart Beklentisi */}
                  <div className="grid grid-cols-2 gap-3 pt-2 text-center">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center space-x-2">
                      <Flag className="w-4 h-4 text-amber-400" />
                      <div>
                        <div className="text-[10px] text-slate-400">Beklenen Korner</div>
                        <div className="text-sm font-bold text-amber-300 font-mono">{expectedCorners} Korner</div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center space-x-2">
                      <FileWarning className="w-4 h-4 text-rose-400" />
                      <div>
                        <div className="text-[10px] text-slate-400">Beklenen Kart</div>
                        <div className="text-sm font-bold text-rose-300 font-mono">{expectedCards} Kart</div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </>
          )}

          {/* TAB 2: MONTE CARLO SIMULATION */}
          {activeTab === 'monte-carlo' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-2">
                    <Dices className="w-4 h-4" />
                    <span>1.000 Maçlık Poisson Monte Carlo Simülasyonu</span>
                  </h4>
                  <p className="text-xs text-slate-300">
                    Beklenen gol (Ev: {expectedHomeGoals}, Dep: {expectedAwayGoals}) değerleriyle 1.000 sanal maç oynatılır.
                  </p>
                </div>

                <button
                  onClick={handleRunMonteCarlo}
                  disabled={isSimulating}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
                  <span>Yeniden Simüle Et</span>
                </button>
              </div>

              {monteCarloResult && (
                <div className="space-y-4">
                  
                  {/* Results breakdown */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-emerald-500/30">
                      <div className="text-[10px] text-slate-400 font-semibold">{homeTeam.shortName} Galibiyeti</div>
                      <div className="text-xl font-black text-emerald-400 font-mono mt-1">
                        %{monteCarloResult.homeWinPct}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{monteCarloResult.homeWins} / 1000 Maç</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-amber-500/30">
                      <div className="text-[10px] text-slate-400 font-semibold">Beraberlik (X)</div>
                      <div className="text-xl font-black text-amber-400 font-mono mt-1">
                        %{monteCarloResult.drawPct}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{monteCarloResult.draws} / 1000 Maç</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-purple-500/30">
                      <div className="text-[10px] text-slate-400 font-semibold">{awayTeam.shortName} Galibiyeti</div>
                      <div className="text-xl font-black text-purple-400 font-mono mt-1">
                        %{monteCarloResult.awayWinPct}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{monteCarloResult.awayWins} / 1000 Maç</div>
                    </div>
                  </div>

                  {/* Goal stats from simulation */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-[10px] text-slate-400">Simüle Edilen 2.5 Üst</div>
                      <div className="text-base font-bold text-slate-100 font-mono mt-0.5">
                        %{monteCarloResult.over25Pct} ({monteCarloResult.over25Count} Maç)
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-[10px] text-slate-400">Simüle Edilen KG Var</div>
                      <div className="text-base font-bold text-slate-100 font-mono mt-0.5">
                        %{monteCarloResult.bttsPct} ({monteCarloResult.bttsCount} Maç)
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-[10px] text-slate-400">Simülasyon Gol Ortalaması</div>
                      <div className="text-base font-bold text-amber-300 font-mono mt-0.5">
                        {monteCarloResult.avgTotalGoals} Gol / Maç
                      </div>
                    </div>
                  </div>

                  {/* Top 5 Most Common Simulated Scores */}
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                    <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Simülasyonda En Çok Tekrarlanan 5 Skor:
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {monteCarloResult.scoreFrequency.map((s, idx) => (
                        <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-center">
                          <div className="text-sm font-black text-slate-100 font-mono">{s.score}</div>
                          <div className="text-xs text-amber-400 font-bold font-mono mt-0.5">{s.count} Kez</div>
                          <div className="text-[10px] text-slate-500 font-mono">%{s.pct}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* TAB 3: FAIR DECIMAL ODDS (ADİL ORANLAR) */}
          {activeTab === 'fair-odds' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center space-x-2">
                  <Scale className="w-4 h-4" />
                  <span>Saf Matematiksel Adil Oranlar (Fair Odds)</span>
                </h4>
                <p className="text-xs text-slate-300">
                  Adil oran (100 / Yüzdelik Olasılık formülü), bahis şirketlerinin kâr marjı (vig) eklenmemiş saf matematiksel karşılığıdır.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/30 text-center">
                  <div className="text-[10px] text-slate-400 font-semibold">MS 1 (Ev Sahibi)</div>
                  <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
                    {toFairOdds(ms1)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 font-mono">Olasılık: %{ms1}</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 text-center">
                  <div className="text-[10px] text-slate-400 font-semibold">MS X (Beraberlik)</div>
                  <div className="text-2xl font-black text-amber-400 font-mono mt-1">
                    {toFairOdds(msX)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 font-mono">Olasılık: %{msX}</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-purple-500/30 text-center">
                  <div className="text-[10px] text-slate-400 font-semibold">MS 2 (Deplasman)</div>
                  <div className="text-2xl font-black text-purple-400 font-mono mt-1">
                    {toFairOdds(ms2)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 font-mono">Olasılık: %{ms2}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-semibold">1.5 Gol Üst</div>
                  <div className="text-lg font-bold text-slate-100 font-mono mt-0.5">{toFairOdds(over15)}</div>
                  <div className="text-[10px] text-emerald-400 font-mono">%{over15}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-semibold">2.5 Gol Üst</div>
                  <div className="text-lg font-bold text-slate-100 font-mono mt-0.5">{toFairOdds(over25)}</div>
                  <div className="text-[10px] text-amber-400 font-mono">%{over25}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-semibold">Karşılıklı Gol Var</div>
                  <div className="text-lg font-bold text-slate-100 font-mono mt-0.5">{toFairOdds(bttsYes)}</div>
                  <div className="text-[10px] text-purple-400 font-mono">%{bttsYes}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-semibold">{topHtFt[0]?.label}</div>
                  <div className="text-lg font-bold text-slate-100 font-mono mt-0.5">{toFairOdds(topHtFt[0]?.prob || 50)}</div>
                  <div className="text-[10px] text-cyan-400 font-mono">%{topHtFt[0]?.prob}</div>
                </div>
              </div>

            </div>
          )}

          {/* Legal / Non-Gambling Disclaimer */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-start space-x-2">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p className="leading-tight">
              <strong>Yasal ve Matematiksel Bilgilendirme:</strong> ProAnaliz AI, geçmiş maç verilerini Poisson ve Markov zinciri modelleriyle işleyen bir istatistik simülasyonudur. Bahis veya kupon oynatmaz; sunulan yüzdeler ve oranlar garanti teşkil etmez.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};

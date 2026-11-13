import React, { useState, useMemo, useEffect } from 'react';
import { Match, MatchAnalysis, MatchInsightsPayload, UserBetslipItem } from '../types';
import { runMonteCarloSimulation, MonteCarloResult, toFairOdds } from '../utils/predictionEngine';
import { getMatchBettingMarkets, BettingPickOption } from '../utils/oddsHelper';
import {
  fetchMatchInsightsFromApi,
  summarizeH2HGames,
  computeRefereeCardProfile,
  evaluateSquadAndMissingImpact,
  SquadMissingImpactOptions
} from '../utils/matchInsightsHelper';
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
  ShieldAlert,
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
  Plus,
  History,
  Stethoscope,
  Users,
  MapPin
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
  const [activeTab, setActiveTab] = useState<'markets' | 'h2h' | 'squad-ref' | 'analysis' | 'monte-carlo' | 'fair-odds'>('markets');
  const [copied, setCopied] = useState(false);
  const [monteCarloResult, setMonteCarloResult] = useState<MonteCarloResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [insights, setInsights] = useState<MatchInsightsPayload | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [missingToggles, setMissingToggles] = useState<SquadMissingImpactOptions>({
    homeAttackerOut: false,
    homeDefenderOut: false,
    awayAttackerOut: false,
    awayDefenderOut: false
  });

  useEffect(() => {
    setInsights(null);
    setMissingToggles({
      homeAttackerOut: false,
      homeDefenderOut: false,
      awayAttackerOut: false,
      awayDefenderOut: false
    });
    if (!match) return;
    let cancelled = false;
    setIsLoadingInsights(true);
    fetchMatchInsightsFromApi(match)
      .then(res => {
        if (!cancelled) setInsights(res);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingInsights(false);
      });
    return () => {
      cancelled = true;
    };
  }, [match?.id]);

  if (!match || !analysis) return null;

  const { homeTeam, awayTeam } = match;
  const enrichedHomeTeam =
    (!homeTeam.recentMatches || homeTeam.recentMatches.length === 0) && insights?.lastFiveHome?.length
      ? { ...homeTeam, recentMatches: insights.lastFiveHome, form: insights.lastFiveHome.map(g => g.result) }
      : homeTeam;
  const enrichedAwayTeam =
    (!awayTeam.recentMatches || awayTeam.recentMatches.length === 0) && insights?.lastFiveAway?.length
      ? { ...awayTeam, recentMatches: insights.lastFiveAway, form: insights.lastFiveAway.map(g => g.result) }
      : awayTeam;
  const homeFormDetails = getFormDetails(enrichedHomeTeam, match.league);
  const awayFormDetails = getFormDetails(enrichedAwayTeam, match.league);
  const marketGroups = useMemo(() => getMatchBettingMarkets(match, analysis), [match, analysis]);
  const selectedPickInMatch = betslipItems.find(it => it.matchId === match.id);
  const h2hGames = insights?.h2hGames || [];
  const h2hSummary = useMemo(
    () => summarizeH2HGames(h2hGames, homeTeam.name, awayTeam.name),
    [h2hGames, homeTeam.name, awayTeam.name]
  );
  const refProfile = useMemo(
    () => computeRefereeCardProfile(match, analysis, insights?.officials),
    [match, analysis, insights?.officials]
  );
  const squadImpact = useMemo(
    () => evaluateSquadAndMissingImpact(match, analysis, insights?.injuries || [], missingToggles),
    [match, analysis, insights?.injuries, missingToggles]
  );
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
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 border-b border-slate-800/80 bg-slate-950/50 text-[11px] sm:text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveTab('markets')}
            className={`px-2.5 py-1.5 rounded-xl flex items-center space-x-1.5 border transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'markets'
                ? 'bg-emerald-500/15 border-emerald-400/60 text-emerald-300 font-bold shadow-xs'
                : 'border-slate-800/80 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Bahis Oranları</span>
            {selectedPickInMatch && (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px]">
                Kuponda
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('h2h')}
            className={`px-2.5 py-1.5 rounded-xl flex items-center space-x-1.5 border transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'h2h'
                ? 'bg-cyan-500/15 border-cyan-400/60 text-cyan-300 font-bold shadow-xs'
                : 'border-slate-800/80 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>İkili Rekabet (H2H)</span>
            {h2hSummary.total > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono text-[10px]">
                {h2hSummary.total}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('squad-ref')}
            className={`px-2.5 py-1.5 rounded-xl flex items-center space-x-1.5 border transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'squad-ref'
                ? 'bg-rose-500/15 border-rose-400/60 text-rose-300 font-bold shadow-xs'
                : 'border-slate-800/80 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Revir & Hakem</span>
          </button>

          <button
            onClick={() => setActiveTab('analysis')}
            className={`px-2.5 py-1.5 rounded-xl flex items-center space-x-1.5 border transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'analysis'
                ? 'bg-emerald-500/15 border-emerald-400/60 text-emerald-300 font-bold shadow-xs'
                : 'border-slate-800/80 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Detaylı Analiz</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('monte-carlo');
              if (!monteCarloResult) handleRunMonteCarlo();
            }}
            className={`px-2.5 py-1.5 rounded-xl flex items-center space-x-1.5 border transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'monte-carlo'
                ? 'bg-amber-500/15 border-amber-400/60 text-amber-300 font-bold shadow-xs'
                : 'border-slate-800/80 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Dices className="w-3.5 h-3.5" />
            <span>Monte Carlo</span>
          </button>

          <button
            onClick={() => setActiveTab('fair-odds')}
            className={`px-2.5 py-1.5 rounded-xl flex items-center space-x-1.5 border transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'fair-odds'
                ? 'bg-purple-500/15 border-purple-400/60 text-purple-300 font-bold shadow-xs'
                : 'border-slate-800/80 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Adil Oranlar</span>
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

          {/* Quick Info Strip: Stadyum • Hakem Kart Profili • Kadro / Revir Durumu */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
            <div className="px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center space-x-2">
              <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="text-slate-400 truncate">
                Stadyum: <strong className="text-slate-200">{insights?.venue?.name || match.stadium}</strong>
              </span>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('squad-ref')}
              className="px-3 py-2 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 flex items-center justify-between transition-colors cursor-pointer text-left"
            >
              <span className="flex items-center space-x-1.5 text-slate-400 truncate">
                <FileWarning className={`w-3.5 h-3.5 shrink-0 ${
                  refProfile.strictnessColor === 'rose'
                    ? 'text-rose-400'
                    : refProfile.strictnessColor === 'amber'
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`} />
                <span className="truncate">
                  Hakem: <strong className="text-slate-200">{refProfile.refereeName || (match.status === 'live' ? 'Canlı Görevli Hakem' : match.status === 'finished' ? 'Resmi Karşılaşma Hakemi' : 'Atama Bekleniyor')}</strong>
                </span>
              </span>
              <span className="font-mono font-bold text-amber-300 shrink-0 ml-1">~{refProfile.avgYellowCards} Kart</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('squad-ref')}
              className="px-3 py-2 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 flex items-center justify-between transition-colors cursor-pointer text-left"
            >
              <span className="flex items-center space-x-1.5 text-slate-400 truncate">
                <Stethoscope className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="truncate">
                  Revir: <strong className="text-slate-200">{squadImpact.summaryBadge}</strong>
                </span>
              </span>
              <span className="font-mono font-bold text-emerald-300 shrink-0 ml-1">xG Sim →</span>
            </button>
          </div>

          {/* TAB: İKİLİ REKABET (H2H) */}
          {activeTab === 'h2h' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/50 via-slate-900 to-indigo-950/40 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-cyan-300 flex items-center space-x-2">
                    <History className="w-4 h-4" />
                    <span>İkili Rekabet Geçmişi (Head-to-Head)</span>
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    {insights?.h2hSummary
                      ? `Resmi Kayıt Özeti: ${insights.h2hSummary}`
                      : 'İki takım arasındaki son resmi karşılaşmalar, KG Var ve 2.5 Üst dağılımları.'}
                  </p>
                </div>
                {isLoadingInsights && (
                  <span className="inline-flex items-center space-x-1.5 text-[11px] text-cyan-300 font-semibold">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Canlı H2H yükleniyor...</span>
                  </span>
                )}
              </div>

              {h2hSummary.total > 0 ? (
                <>
                  {/* Win / Draw / Loss Distribution */}
                  <div className="rounded-2xl bg-slate-950/75 border border-slate-800 p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                      <span>Son {h2hSummary.total} Karşılaşma Galibiyet Dağılımı</span>
                      <span className="font-mono text-cyan-300">Ort. {h2hSummary.avgTotalGoals} Gol / Maç</span>
                    </div>

                    <div className="h-4 w-full bg-slate-800 rounded-xl overflow-hidden flex text-[10px] font-black">
                      {h2hSummary.homeWinPct > 0 && (
                        <div
                          style={{ width: `${h2hSummary.homeWinPct}%` }}
                          className="bg-emerald-500 text-slate-950 flex items-center justify-center"
                        >
                          {h2hSummary.homeWinPct >= 14 && `%${h2hSummary.homeWinPct}`}
                        </div>
                      )}
                      {h2hSummary.drawPct > 0 && (
                        <div
                          style={{ width: `${h2hSummary.drawPct}%` }}
                          className="bg-amber-400 text-slate-950 flex items-center justify-center"
                        >
                          {h2hSummary.drawPct >= 14 && `%${h2hSummary.drawPct}`}
                        </div>
                      )}
                      {h2hSummary.awayWinPct > 0 && (
                        <div
                          style={{ width: `${h2hSummary.awayWinPct}%` }}
                          className="bg-purple-500 text-white flex items-center justify-center"
                        >
                          {h2hSummary.awayWinPct >= 14 && `%${h2hSummary.awayWinPct}`}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-emerald-500/30">
                        <div className="text-[10px] text-slate-400 truncate">{homeTeam.name}</div>
                        <div className="text-sm font-black text-emerald-400 font-mono">{h2hSummary.homeWins}G (%{h2hSummary.homeWinPct})</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-amber-500/30">
                        <div className="text-[10px] text-slate-400">Beraberlik</div>
                        <div className="text-sm font-black text-amber-400 font-mono">{h2hSummary.draws}B (%{h2hSummary.drawPct})</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-purple-500/30">
                        <div className="text-[10px] text-slate-400 truncate">{awayTeam.name}</div>
                        <div className="text-sm font-black text-purple-400 font-mono">{h2hSummary.awayWins}G (%{h2hSummary.awayWinPct})</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-cyan-500/30">
                        <div className="text-[10px] text-slate-400">KG Var Oranı</div>
                        <div className="text-sm font-black text-cyan-300 font-mono">%{h2hSummary.bttsPct}</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-amber-500/30 col-span-2 sm:col-span-1">
                        <div className="text-[10px] text-slate-400">2.5 Üst Oranı</div>
                        <div className="text-sm font-black text-amber-300 font-mono">%{h2hSummary.over25Pct}</div>
                      </div>
                    </div>
                  </div>

                  {/* Historical Match List */}
                  <div className="rounded-2xl bg-slate-950/75 border border-slate-800 p-4 space-y-2.5">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Aralarındaki Son Karşılaşmalar ({h2hGames.length})
                    </div>
                    <div className="space-y-2">
                      {h2hGames.map((g, idx) => {
                        const dateLabel = g.date
                          ? new Date(g.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })
                          : '-';
                        const bttsHit = g.homeScore !== null && g.awayScore !== null && g.homeScore > 0 && g.awayScore > 0;
                        const over25Hit = g.homeScore !== null && g.awayScore !== null && (g.homeScore + g.awayScore) >= 3;
                        return (
                          <div
                            key={g.id || idx}
                            className="p-2.5 sm:p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                          >
                            <div className="flex items-center space-x-2 text-[10px] text-slate-400 shrink-0">
                              <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded">{dateLabel}</span>
                              <span className="truncate max-w-[170px] text-slate-500">{g.competition}</span>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 flex-1">
                              <div className="flex items-center space-x-2 font-bold">
                                <span className="text-slate-200">{g.homeTeam}</span>
                                <span className="px-2 py-0.5 rounded-lg bg-slate-950 border border-cyan-500/40 text-cyan-300 font-mono font-black">
                                  {g.homeScore !== null && g.awayScore !== null ? `${g.homeScore} - ${g.awayScore}` : 'VS'}
                                </span>
                                <span className="text-slate-200">{g.awayTeam}</span>
                              </div>
                              <div className="flex items-center space-x-1 shrink-0">
                                {bttsHit && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                    KG
                                  </span>
                                )}
                                {over25Hit && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                    2.5Ü
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-2xl bg-slate-950/75 border border-slate-800 p-4 space-y-4">
                  <div className="flex items-start space-x-2.5 text-xs text-slate-300">
                    <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-slate-100">Yakın Dönem Resmi H2H Serisi Bulunamadı</div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {isLoadingInsights
                          ? 'Geçmiş ikili karşılaşma kayıtları sorgulanıyor...'
                          : 'Bu iki takım arasında son dönem ESPN H2H kaydı yer almıyor. Aşağıda iki ekibin güncel son maç formları ve model beklentisi yan yana kıyaslanmıştır.'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/25 space-y-2">
                      <div className="font-bold text-emerald-400 flex items-center justify-between">
                        <span>{homeTeam.name} Son Maçları</span>
                        <span className="font-mono text-[10px] text-slate-400">Ort. {homeTeam.avgGoalsScored} Gol</span>
                      </div>
                      {homeFormDetails.map((d, i) => (
                        <div key={i} className="flex items-center justify-between text-[11px] py-1 border-b border-slate-800/60 last:border-none">
                          <span className="text-slate-300 truncate pr-2">{d.opponent || `${homeTeam.shortName} Maçı`}</span>
                          <div className="flex items-center space-x-2 shrink-0">
                            <span className="font-mono text-slate-400">{d.score || '-'}</span>
                            <span className={`px-1.5 py-0.2 rounded font-black text-[10px] ${
                              d.result === 'W' ? 'bg-emerald-500/20 text-emerald-300' : d.result === 'D' ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'
                            }`}>{d.result === 'W' ? 'G' : d.result === 'D' ? 'B' : 'M'}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900 border border-purple-500/25 space-y-2">
                      <div className="font-bold text-purple-400 flex items-center justify-between">
                        <span>{awayTeam.name} Son Maçları</span>
                        <span className="font-mono text-[10px] text-slate-400">Ort. {awayTeam.avgGoalsScored} Gol</span>
                      </div>
                      {awayFormDetails.map((d, i) => (
                        <div key={i} className="flex items-center justify-between text-[11px] py-1 border-b border-slate-800/60 last:border-none">
                          <span className="text-slate-300 truncate pr-2">{d.opponent || `${awayTeam.shortName} Maçı`}</span>
                          <div className="flex items-center space-x-2 shrink-0">
                            <span className="font-mono text-slate-400">{d.score || '-'}</span>
                            <span className={`px-1.5 py-0.2 rounded font-black text-[10px] ${
                              d.result === 'W' ? 'bg-emerald-500/20 text-emerald-300' : d.result === 'D' ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'
                            }`}>{d.result === 'W' ? 'G' : d.result === 'D' ? 'B' : 'M'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: KADRO, REVİR & HAKEM KART/PENALTI ANALİZİ */}
          {activeTab === 'squad-ref' && (
            <div className="space-y-5 animate-fadeIn">
              {/* 1. Hakem Kart & Penaltı Analizi */}
              <div className="rounded-2xl bg-slate-950/80 border border-slate-800 p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-100 flex items-center space-x-2">
                      <FileWarning className="w-4 h-4 text-amber-400" />
                      <span>Hakem Kart & Penaltı Analizi</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{refProfile.insightNote}</p>
                  </div>
                  <span className={`self-start sm:self-auto px-2.5 py-1 rounded-xl text-[11px] font-black border ${
                    refProfile.strictnessColor === 'rose'
                      ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                      : refProfile.strictnessColor === 'amber'
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                      : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                  }`}>
                    {refProfile.strictnessLabel}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Orta Hakem</div>
                    <div className="text-xs font-extrabold text-slate-100 mt-1 truncate">
                      {refProfile.refereeName || (match.status === 'live' ? 'Canlı Görevli Hakem' : match.status === 'finished' ? 'Resmi Karşılaşma Hakemi' : 'Atama Bekleniyor')}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {refProfile.isOfficialAssigned ? 'Resmi Hakem Ataması' : 'Lig & Maç Hakem Heyeti'}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-amber-500/30">
                    <div className="text-[10px] text-slate-400">Ort. Sarı Kart</div>
                    <div className="text-lg font-black text-amber-400 font-mono mt-0.5">{refProfile.avgYellowCards}</div>
                    <div className="text-[10px] text-slate-500">Maç Başı Beklenti</div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-rose-500/30">
                    <div className="text-[10px] text-slate-400">Kırmızı Kart İhtimali</div>
                    <div className="text-lg font-black text-rose-400 font-mono mt-0.5">%{refProfile.redCardPct}</div>
                    <div className="text-[10px] text-slate-500">Sertlik Endeksi</div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-cyan-500/30">
                    <div className="text-[10px] text-slate-400">Penaltı Çalınma İhtimali</div>
                    <div className="text-lg font-black text-cyan-300 font-mono mt-0.5">%{refProfile.penaltyPct}</div>
                    <div className="text-[10px] text-slate-500">Ceza Sahası Baskısı</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
                  <span className="text-amber-200 font-semibold">AI Disiplin & Kart Önerisi:</span>
                  <span className="font-black text-amber-300 font-mono">{refProfile.cardPickLabel}</span>
                </div>
              </div>

              {/* 2. Kadro & Revir Raporu + Eksiklik Etki Katsayısı Simülatörü */}
              <div className="rounded-2xl bg-slate-950/80 border border-slate-800 p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-100 flex items-center space-x-2">
                      <Stethoscope className="w-4 h-4 text-rose-400" />
                      <span>Kadro, Revir Raporu & Eksiklik Etki Katsayısı</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Resmi sakat/cezalı bildirimleri ile kilit oyuncu eksikliklerinin xG (gol beklentisi) etkisini simüle eder.
                    </p>
                  </div>
                  <span className="self-start sm:self-auto px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-900 text-slate-200 border border-slate-700">
                    {squadImpact.rotationRiskLabel}
                  </span>
                </div>

                {/* Live Injuries List if provided by ESPN */}
                {(squadImpact.homeInjuries.length > 0 || squadImpact.awayInjuries.length > 0) ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {[
                      { team: homeTeam.name, list: squadImpact.homeInjuries, color: 'emerald' },
                      { team: awayTeam.name, list: squadImpact.awayInjuries, color: 'purple' }
                    ].map((blk, i) => (
                      <div key={i} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                        <div className={`font-bold ${blk.color === 'emerald' ? 'text-emerald-400' : 'text-purple-400'}`}>
                          {blk.team} Revir ({blk.list.length})
                        </div>
                        {blk.list.length === 0 ? (
                          <div className="text-[11px] text-slate-500">Bildirilen sakat/cezalı bulunmuyor.</div>
                        ) : (
                          blk.list.map((inj, idx) => (
                            <div key={idx} className="flex items-center justify-between text-[11px] py-1 border-b border-slate-800/60 last:border-none">
                              <div>
                                <span className="font-bold text-slate-200">{inj.playerName}</span>
                                {inj.position && <span className="ml-1.5 text-[10px] text-slate-500">({inj.position})</span>}
                              </div>
                              <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[10px] font-semibold">
                                {inj.status}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 flex items-start space-x-2">
                    <Users className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>
                      Resmi ilk 11 ve kesinleşmiş sakat/cezalı raporu genellikle maç başlama saatinden 1–12 saat önce yayınlanır. Aşağıdaki <strong>Eksiklik Etki Katsayısı Simülatörü</strong> ile son dakika haberine göre gol beklentisini (xG) anlık güncelleyebilirsiniz:
                    </span>
                  </div>
                )}

                {/* Interactive Eksiklik Etki Katsayısı Simulator */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/25 space-y-2">
                    <div className="font-bold text-emerald-400">{homeTeam.name} Eksik Senaryosu</div>
                    <label className="flex items-center justify-between p-2 rounded-lg bg-slate-950/70 border border-slate-800 cursor-pointer hover:border-rose-500/40">
                      <span className="text-[11px] text-slate-200">As Forvet / Gol Kralı Eksik</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono text-rose-400">-0.40 xG</span>
                        <input
                          type="checkbox"
                          checked={missingToggles.homeAttackerOut}
                          onChange={e => setMissingToggles(p => ({ ...p, homeAttackerOut: e.target.checked }))}
                          className="accent-rose-500 w-3.5 h-3.5"
                        />
                      </div>
                    </label>
                    <label className="flex items-center justify-between p-2 rounded-lg bg-slate-950/70 border border-slate-800 cursor-pointer hover:border-amber-500/40">
                      <span className="text-[11px] text-slate-200">As Stoper / Kaleci Eksik</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono text-amber-400">+0.35 Rakip xG</span>
                        <input
                          type="checkbox"
                          checked={missingToggles.homeDefenderOut}
                          onChange={e => setMissingToggles(p => ({ ...p, homeDefenderOut: e.target.checked }))}
                          className="accent-amber-500 w-3.5 h-3.5"
                        />
                      </div>
                    </label>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-purple-500/25 space-y-2">
                    <div className="font-bold text-purple-400">{awayTeam.name} Eksik Senaryosu</div>
                    <label className="flex items-center justify-between p-2 rounded-lg bg-slate-950/70 border border-slate-800 cursor-pointer hover:border-rose-500/40">
                      <span className="text-[11px] text-slate-200">As Forvet / Gol Kralı Eksik</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono text-rose-400">-0.40 xG</span>
                        <input
                          type="checkbox"
                          checked={missingToggles.awayAttackerOut}
                          onChange={e => setMissingToggles(p => ({ ...p, awayAttackerOut: e.target.checked }))}
                          className="accent-rose-500 w-3.5 h-3.5"
                        />
                      </div>
                    </label>
                    <label className="flex items-center justify-between p-2 rounded-lg bg-slate-950/70 border border-slate-800 cursor-pointer hover:border-amber-500/40">
                      <span className="text-[11px] text-slate-200">As Stoper / Kaleci Eksik</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono text-amber-400">+0.35 Rakip xG</span>
                        <input
                          type="checkbox"
                          checked={missingToggles.awayDefenderOut}
                          onChange={e => setMissingToggles(p => ({ ...p, awayDefenderOut: e.target.checked }))}
                          className="accent-amber-500 w-3.5 h-3.5"
                        />
                      </div>
                    </label>
                  </div>
                </div>

                {/* Live Adjusted xG Output */}
                <div className="grid grid-cols-3 gap-2.5 text-center pt-1">
                  <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/30">
                    <div className="text-[10px] text-slate-400">Güncel Ev xG</div>
                    <div className="text-base font-black text-emerald-400 font-mono">{squadImpact.adjustedHomeXg}</div>
                    {squadImpact.homeDelta !== 0 && (
                      <div className="text-[10px] font-mono text-amber-300">
                        ({squadImpact.homeDelta > 0 ? `+${squadImpact.homeDelta}` : squadImpact.homeDelta})
                      </div>
                    )}
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-amber-500/30">
                    <div className="text-[10px] text-slate-400">Güncel Toplam xG</div>
                    <div className="text-base font-black text-amber-400 font-mono">{squadImpact.adjustedTotalXg}</div>
                    <div className="text-[10px] text-slate-500">Baz: {expectedTotalGoals}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-purple-500/30">
                    <div className="text-[10px] text-slate-400">Güncel Dep xG</div>
                    <div className="text-base font-black text-purple-400 font-mono">{squadImpact.adjustedAwayXg}</div>
                    {squadImpact.awayDelta !== 0 && (
                      <div className="text-[10px] font-mono text-amber-300">
                        ({squadImpact.awayDelta > 0 ? `+${squadImpact.awayDelta}` : squadImpact.awayDelta})
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

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
                              <span className="text-[10px] text-slate-400 font-mono flex items-center space-x-1">
                                <span>%{opt.probability}</span>
                                {opt.isOfficial && (
                                  <span className="px-1 py-0.2 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[8px] font-bold">
                                    İddaa
                                  </span>
                                )}
                              </span>
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

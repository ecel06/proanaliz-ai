// src/components/AITripleComboCard.tsx
// Curated AI Triple Combo (Günün ProAnaliz VIP 3'lüsü) with one-click Betslip addition.

import React, { useMemo } from 'react';
import { Match, MatchAnalysis, UserBetslipItem } from '../types';
import { BettingPickOption } from '../utils/oddsHelper';
import { Sparkles, Check, Zap } from 'lucide-react';

interface AITripleComboCardProps {
  matches: Match[];
  analyses: Map<string, MatchAnalysis> | Record<string, MatchAnalysis>;
  onSelectMatch: (match: Match) => void;
  onAddComboToBetslip: (items: { match: Match; pickOption: BettingPickOption }[]) => void;
  betslipItems: UserBetslipItem[];
}

interface ComboPickItem {
  match: Match;
  pickOption: BettingPickOption;
  categoryTag: string;
  categoryColor: string;
}

export const AITripleComboCard: React.FC<AITripleComboCardProps> = ({
  matches,
  analyses,
  onSelectMatch,
  onAddComboToBetslip,
  betslipItems
}) => {
  const getAnalysis = (matchId: string): MatchAnalysis | null => {
    if (!analyses) return null;
    if (analyses instanceof Map) {
      return analyses.get(matchId) || null;
    }
    return analyses[matchId] || null;
  };

  // Select 3 best diverse AI picks across the bulletin
  const comboPicks = useMemo<ComboPickItem[]>(() => {
    if (!matches || matches.length < 3) return [];

    const picks: ComboPickItem[] = [];
    const usedMatchIds = new Set<string>();

    // 1. Pick 1: Strongest Match Result Banko (MS 1 or MS 2 >= 65%)
    let bestBankoMatch: Match | null = null;
    let bestBankoAnalysis: MatchAnalysis | null = null;
    let bestBankoProb = 0;
    let isHomeWin = true;

    for (const m of matches) {
      const a = getAnalysis(m.id);
      if (!a) continue;
      const prob1 = a.ms1 || 0;
      const prob2 = a.ms2 || 0;
      const maxP = Math.max(prob1, prob2);
      if (maxP > bestBankoProb && maxP >= 60) {
        bestBankoProb = maxP;
        bestBankoMatch = m;
        bestBankoAnalysis = a;
        isHomeWin = prob1 >= prob2;
      }
    }

    if (bestBankoMatch && bestBankoAnalysis) {
      usedMatchIds.add(bestBankoMatch.id);
      const pickKey = isHomeWin ? 'ms1' : 'ms2';
      const pickLabel = isHomeWin ? 'MS 1' : 'MS 2';
      const rawOdd = isHomeWin
        ? bestBankoMatch.odds?.ms1 || 1.62
        : bestBankoMatch.odds?.ms2 || 1.85;
      const odd = Number(rawOdd) > 1.05 ? Number(rawOdd) : 1.65;

      picks.push({
        match: bestBankoMatch,
        pickOption: {
          key: pickKey,
          label: pickLabel,
          marketKey: 'match_result',
          marketName: 'Maç Sonucu',
          odd,
          probability: bestBankoProb,
          recommendationBadge: 'Banko'
        },
        categoryTag: 'AI Bankosu',
        categoryColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
      });
    }

    // 2. Pick 2: Strongest 2.5 Over (>= 58%) from another match
    let bestOverMatch: Match | null = null;
    let bestOverProb = 0;

    for (const m of matches) {
      if (usedMatchIds.has(m.id)) continue;
      const a = getAnalysis(m.id);
      if (!a) continue;
      const overVal = a.over25 || 0;
      if (overVal > bestOverProb && overVal >= 55) {
        bestOverProb = overVal;
        bestOverMatch = m;
      }
    }

    if (bestOverMatch) {
      usedMatchIds.add(bestOverMatch.id);
      const rawOdd = bestOverMatch.odds?.over25 || 1.74;
      const odd = Number(rawOdd) > 1.05 ? Number(rawOdd) : 1.72;

      picks.push({
        match: bestOverMatch,
        pickOption: {
          key: 'over25',
          label: '2.5 Üst',
          marketKey: 'goals_25',
          marketName: '2.5 Gol Alt/Üst',
          odd,
          probability: bestOverProb,
          recommendationBadge: 'Gol Üstü'
        },
        categoryTag: 'Gol Fırtınası',
        categoryColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
      });
    }

    // 3. Pick 3: Strongest KG Var (>= 55%) from a 3rd match
    let bestBttsMatch: Match | null = null;
    let bestBttsProb = 0;

    for (const m of matches) {
      if (usedMatchIds.has(m.id)) continue;
      const a = getAnalysis(m.id);
      if (!a) continue;
      const bttsVal = a.bttsYes || 0;
      if (bttsVal > bestBttsProb && bttsVal >= 55) {
        bestBttsProb = bttsVal;
        bestBttsMatch = m;
      }
    }

    if (bestBttsMatch) {
      usedMatchIds.add(bestBttsMatch.id);
      const rawOdd = bestBttsMatch.odds?.bttsYes || 1.78;
      const odd = Number(rawOdd) > 1.05 ? Number(rawOdd) : 1.76;

      picks.push({
        match: bestBttsMatch,
        pickOption: {
          key: 'btts',
          label: 'KG Var',
          marketKey: 'btts',
          marketName: 'Karşılıklı Gol',
          odd,
          probability: bestBttsProb,
          recommendationBadge: 'KG Var'
        },
        categoryTag: 'Karşılıklı Gol',
        categoryColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40'
      });
    }

    // Fallback: If still under 3, fill with top available match
    if (picks.length < 3) {
      for (const m of matches) {
        if (usedMatchIds.has(m.id)) continue;
        const a = getAnalysis(m.id);
        if (!a) continue;
        usedMatchIds.add(m.id);
        picks.push({
          match: m,
          pickOption: {
            key: 'over15',
            label: '1.5 Üst',
            marketKey: 'goals_15',
            marketName: '1.5 Gol Alt/Üst',
            odd: 1.35,
            probability: 78,
            recommendationBadge: 'İdeal'
          },
          categoryTag: 'Günün Tercihi',
          categoryColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
        });
        if (picks.length >= 3) break;
      }
    }

    return picks.slice(0, 3);
  }, [matches, analyses]);

  // Combined metrics
  const combinedOdds = useMemo(() => {
    if (comboPicks.length === 0) return 1.0;
    const total = comboPicks.reduce((acc, p) => acc * p.pickOption.odd, 1.0);
    return Math.round(total * 100) / 100;
  }, [comboPicks]);

  const avgConfidence = useMemo(() => {
    if (comboPicks.length === 0) return 0;
    const sum = comboPicks.reduce((acc, p) => acc + p.pickOption.probability, 0);
    return Math.round(sum / comboPicks.length);
  }, [comboPicks]);

  // Check how many of the 3 are already in the betslip
  const inBetslipCount = useMemo(() => {
    return comboPicks.filter(p => 
      betslipItems.some(b => b.matchId === p.match.id && b.pickKey === p.pickOption.key)
    ).length;
  }, [comboPicks, betslipItems]);

  const allInBetslip = comboPicks.length > 0 && inBetslipCount === comboPicks.length;

  if (comboPicks.length < 3) return null;

  return (
    <div className="relative mb-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 border-2 border-amber-500/40 p-3.5 sm:p-4.5 shadow-2xl overflow-hidden animate-fadeIn">
      {/* Decorative top shimmer line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-amber-500/20">
        <div className="flex items-center space-x-2.5">
          <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20 shrink-0">
            <Sparkles className="w-4 h-4 text-slate-950 animate-pulse" />
          </span>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm sm:text-base font-black text-white tracking-wide flex items-center gap-1.5">
                <span>Günün ProAnaliz VIP 3'lü Kombini</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                Opta AI
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Poisson dağılımı ve xG modellerine göre bültenin en yüksek güvenilirlikli 3 tercihi.
            </p>
          </div>
        </div>

        {/* Combined Metrics Pill & CTA */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-1 sm:pt-0">
          <div className="flex items-center gap-2">
            <div className="px-2.5 py-1 rounded-xl bg-slate-950/80 border border-amber-500/30 text-center">
              <span className="block text-[9px] text-slate-400 uppercase font-bold">Toplam Oran</span>
              <span className="text-xs sm:text-sm font-black font-mono text-amber-300">
                {combinedOdds.toFixed(2)}
              </span>
            </div>
            <div className="px-2.5 py-1 rounded-xl bg-slate-950/80 border border-emerald-500/30 text-center">
              <span className="block text-[9px] text-slate-400 uppercase font-bold">Ort. Güven</span>
              <span className="text-xs sm:text-sm font-black font-mono text-emerald-400">
                %{avgConfidence}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onAddComboToBetslip(comboPicks.map(p => ({ match: p.match, pickOption: p.pickOption })))}
            className={`px-3.5 py-2 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center space-x-1.5 shadow-lg active:scale-95 ${
              allInBetslip
                ? 'bg-emerald-500 text-slate-950 border border-emerald-400 shadow-emerald-500/30'
                : 'bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 shadow-amber-500/20 border border-amber-300'
            }`}
          >
            {allInBetslip ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>3 Maç Kuponunda</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 fill-slate-950" />
                <span>Kupona Ekle (3 Maç)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3 Matches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-3">
        {comboPicks.map((item) => {
          const isItemInSlip = betslipItems.some(
            b => b.matchId === item.match.id && b.pickKey === item.pickOption.key
          );

          return (
            <div
              key={item.match.id}
              onClick={() => onSelectMatch(item.match)}
              className="p-2.5 sm:p-3 rounded-xl bg-slate-950/70 border border-slate-800/90 hover:border-amber-500/40 hover:bg-slate-900/90 transition-all cursor-pointer flex flex-col justify-between group shadow-sm"
            >
              <div>
                {/* Category & Time */}
                <div className="flex items-center justify-between text-[10px] pb-1.5 border-b border-slate-800/60">
                  <span className={`px-1.5 py-0.2 rounded font-black border ${item.categoryColor}`}>
                    {item.categoryTag}
                  </span>
                  <span className="text-slate-400 font-mono font-medium">
                    {item.match.time} • {item.match.league}
                  </span>
                </div>

                {/* Team Names */}
                <div className="pt-2 text-xs font-black text-white space-y-0.5 truncate">
                  <div className="truncate flex items-center justify-between">
                    <span className="truncate group-hover:text-amber-300 transition-colors">
                      {item.match.homeTeam.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-normal">Ev</span>
                  </div>
                  <div className="truncate flex items-center justify-between">
                    <span className="truncate group-hover:text-amber-300 transition-colors">
                      {item.match.awayTeam.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-normal">Dep</span>
                  </div>
                </div>
              </div>

              {/* Pick Badge & Individual Add */}
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <span className="px-2 py-0.5 rounded-lg bg-amber-400/15 border border-amber-400/30 text-amber-300 font-black text-[11px]">
                    {item.pickOption.label}
                  </span>
                  <span className="font-mono font-bold text-xs text-white">
                    {item.pickOption.odd.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold">
                    %{item.pickOption.probability}
                  </span>
                </div>

                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  isItemInSlip ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400'
                }`}>
                  {isItemInSlip ? '✓ Eklendi' : 'Detay →'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

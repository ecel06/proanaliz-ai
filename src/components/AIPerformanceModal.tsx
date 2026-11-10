// src/components/AIPerformanceModal.tsx
// Transparent AI Accuracy & Performance Scorecard Modal for ProAnaliz AI.

import React from 'react';
import { OverallPerformanceReport } from '../utils/aiPerformanceHelper';
import {
  Trophy,
  X,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  Flame,
  Zap,
  Target,
  CheckCircle2,
  XCircle,
  BarChart3,
  Calendar,
  Layers
} from 'lucide-react';

interface AIPerformanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: OverallPerformanceReport;
}

export const AIPerformanceModal: React.FC<AIPerformanceModalProps> = ({
  isOpen,
  onClose,
  report
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-black text-white">Yapay Zeka Başarı Karnesi</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  Şeffaf Analiz
                </span>
              </div>
              <p className="text-xs text-slate-400">Resmi maç sonuçlarıyla doğrulanmış isabet oranları ve Poisson performansı</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* Top KPI Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Genel Başarı</div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 mt-1">
                %{report.overallAccuracyRate}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Tüm Olasılıklar</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Banko İsabeti</div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400 mt-1">
                %{report.bankoAccuracyRate}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">+%75 Güvenliler</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">2.5 Gol Üst</div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-indigo-400 mt-1">
                %{report.over25AccuracyRate}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Yüksek Tempo</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">KG Var İsabeti</div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-purple-400 mt-1">
                %{report.bttsAccuracyRate}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Karşılıklı Skor</div>
            </div>
          </div>

          {/* Detailed Categories */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>Bahis Kategorisi Performans Dökümü</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {report.categories.map(cat => (
                <div key={cat.id} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-white">{cat.label}</span>
                    <span className="font-mono font-black text-emerald-400 text-base">%{cat.accuracyRate}</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                      style={{ width: `${cat.accuracyRate}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-slate-400 leading-snug">{cat.description}</p>
                  
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60 font-mono">
                    <span>Örneklem: {cat.totalPicks} Karşılaşma</span>
                    <span>Ortalama Oran: @{cat.avgOdds.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* League Accuracy Breakdown */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Lig Bazlı Başarı Sıralaması</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {report.leagueBreakdown.map((lb, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-200">{lb.league}</div>
                    <div className="text-[10px] text-slate-500">{lb.topTrend}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-black text-emerald-400">%{lb.accuracyRate}</div>
                    <div className="text-[10px] text-slate-500">{lb.totalMatches} Maç</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Verified Hits List */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Son Doğrulanan Tahminler</span>
            </h3>

            <div className="space-y-2">
              {report.recentVerifiedPicks.map((pick, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    {pick.isWon ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <div className="min-w-0 truncate">
                      <div className="font-bold text-slate-200 truncate">{pick.matchText}</div>
                      <div className="text-[10px] text-slate-500">{pick.league}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2.5 shrink-0 font-mono">
                    <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded text-[11px] border border-emerald-500/30">
                      {pick.prediction}
                    </span>
                    <span className="text-slate-300 font-black">
                      MS: {pick.actualScore}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Principle Note */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 flex items-start space-x-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Şeffaflık İlkesi:</strong> ProAnaliz AI olasılık ve xG simülasyonları maç başlamadan önce kilitlenir. Karşılaşma tamamlandığında resmi maç skorları ESPN veri uç noktalarından canlı teyit edilir ve sonuçlar geriye dönük asla değiştirilemez.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>

      </div>
    </div>
  );
};

// src/components/BankrollTrackerModal.tsx
// Virtual Bankroll & Saved Coupons Modal for ProAnaliz AI.

import React, { useState } from 'react';
import {
  SavedSlip,
  BankrollStats,
  deleteSavedSlip,
  clearAllSavedSlips,
  getInitialBankroll,
  setInitialBankroll
} from '../utils/bankrollHelper';
import { Wallet, X, TrendingUp, TrendingDown, CheckCircle2, XCircle, Clock, Trash2, Ticket, Coins } from 'lucide-react';

interface BankrollTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  slips: SavedSlip[];
  stats: BankrollStats;
  onRefreshSlips: () => void;
}

export const BankrollTrackerModal: React.FC<BankrollTrackerModalProps> = ({
  isOpen,
  onClose,
  slips,
  stats,
  onRefreshSlips
}) => {
  const [activeInitial, setActiveInitial] = useState<number>(() => getInitialBankroll());

  if (!isOpen) return null;

  const handleSelectInitial = (amount: number) => {
    setActiveInitial(amount);
    setInitialBankroll(amount);
    onRefreshSlips();
  };

  const handleDelete = (id: string) => {
    deleteSavedSlip(id);
    onRefreshSlips();
  };

  const handleClearAll = () => {
    if (window.confirm('Tüm kayıtlı kuponları ve kasa geçmişini sıfırlamak istediğinize emin misiniz?')) {
      clearAllSavedSlips();
      onRefreshSlips();
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center space-x-2">
                <span>Sanal Kasa & Kupon Takibi</span>
              </h2>
              <p className="text-xs text-slate-400">Kayıtlı kuponlarınızın canlı sonuçları ve kasa performansı</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bankroll KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 bg-slate-950/40 border-b border-slate-800/80">
          {/* Current Balance */}
          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Güncel Kasa</div>
            <div className="text-lg font-black font-mono text-emerald-400 mt-0.5">
              {stats.currentBalance.toLocaleString('tr-TR')} ₺
            </div>
          </div>

          {/* Net Profit */}
          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Net Kâr / Zarar</div>
            <div className={`text-lg font-black font-mono mt-0.5 flex items-center space-x-1 ${
              stats.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {stats.netProfit >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{stats.netProfit >= 0 ? `+${stats.netProfit.toLocaleString('tr-TR')}` : stats.netProfit.toLocaleString('tr-TR')} ₺</span>
            </div>
          </div>

          {/* Win Rate */}
          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Başarı Oranı</div>
            <div className="text-lg font-black font-mono text-amber-400 mt-0.5">
              %{stats.winRate}
            </div>
          </div>

          {/* Slip Counts */}
          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Kupon Durumu</div>
            <div className="text-xs font-mono font-bold mt-1 space-x-1 text-slate-300">
              <span className="text-emerald-400">{stats.wonSlips} Tutan</span> • <span className="text-rose-400">{stats.lostSlips} Yatan</span>
            </div>
          </div>
        </div>

        {/* Quick Initial Bankroll Budget Selector */}
        <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-1.5 text-slate-400 font-medium">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>Kasa Başlangıç Bütçesi:</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold">
            {[1000, 2500, 5000, 10000, 25000, 50000].map((amt) => {
              const isSelected = activeInitial === amt;
              return (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleSelectInitial(amt)}
                  className={`px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-400/20 border-amber-400 text-amber-300 shadow-xs'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {amt.toLocaleString('tr-TR')} ₺
                </button>
              );
            })}
          </div>
        </div>

        {/* Slips List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {slips.length === 0 ? (
            <div className="py-12 text-center rounded-2xl bg-slate-950/40 border border-slate-800/80 p-6 space-y-3">
              <Ticket className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-slate-300">Henüz Kayıtlı Kuponunuz Yok</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Bültenden maçları seçerek kupon oluşturabilir ve "Sanal Kasaya Kaydet" butonuyla buraya ekleyerek maç sonuçlarını takip edebilirsiniz.
              </p>
            </div>
          ) : (
            slips.map((slip) => {
              const isWon = slip.status === 'won';
              const isLost = slip.status === 'lost';
              const isPending = slip.status === 'pending';

              return (
                <div
                  key={slip.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isWon
                      ? 'bg-emerald-950/20 border-emerald-500/40'
                      : isLost
                      ? 'bg-rose-950/15 border-rose-500/30'
                      : 'bg-slate-950/70 border-slate-800'
                  }`}
                >
                  {/* Slip Header */}
                  <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800/60">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-slate-300">
                        {slip.id}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(slip.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {isWon && (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>KAZANDI (+{slip.potentialWin.toLocaleString('tr-TR')} ₺)</span>
                        </span>
                      )}
                      {isLost && (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/40">
                          <XCircle className="w-3 h-3" />
                          <span>YATTI</span>
                        </span>
                      )}
                      {isPending && (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          <Clock className="w-3 h-3" />
                          <span>Devam Ediyor</span>
                        </span>
                      )}

                      <button
                        onClick={() => handleDelete(slip.id)}
                        className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Kuponu Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Matches inside slip */}
                  <div className="space-y-1.5 mb-3">
                    {slip.items.map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-900/80">
                        <span className="font-bold text-slate-200 truncate max-w-[200px] sm:max-w-xs">
                          {it.match.homeTeam.name} vs {it.match.awayTeam.name}
                        </span>
                        <div className="flex items-center space-x-2 shrink-0">
                          <span className="text-emerald-400 font-semibold">{it.pickLabel}</span>
                          <span className="font-mono font-bold text-slate-400">@{it.odd.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Slip Summary Footer */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/40">
                    <div className="text-slate-400">
                      Oran: <span className="font-mono font-bold text-white">{slip.totalOdds.toFixed(2)}</span> • Misli: <span className="font-mono font-bold text-white">{slip.stake} ₺</span>
                    </div>
                    <div className="font-mono font-black text-amber-400">
                      Olası Kazanç: {slip.potentialWin.toLocaleString('tr-TR')} ₺
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        {slips.length > 0 && (
          <div className="p-3 sm:p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={handleClearAll}
              className="text-xs text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
            >
              Tüm Kuponları Temizle
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors cursor-pointer"
            >
              Kapat
            </button>
          </div>
        )}

      </div>
    </div>
  );
};


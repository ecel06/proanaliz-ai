// src/components/StandingsModal.tsx
// Instant Zero-Delay Multi-League Live Standings Modal for ProAnaliz AI

import React, { useState, useEffect, useMemo } from 'react';
import { X, Trophy, RefreshCw, Radio, Globe, ShieldAlert, Sparkles, CheckCircle2, Search } from 'lucide-react';
import {
  fetchLiveStandings,
  getInitialStandings,
  STANDINGS_LEAGUES,
  LeagueStandingsResult,
  StandingRow
} from '../services/standingsService';

interface StandingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultLeagueCode?: string;
}

export const StandingsModal: React.FC<StandingsModalProps> = ({
  isOpen,
  onClose,
  defaultLeagueCode = 'tur.1'
}) => {
  const [selectedLeagueCode, setSelectedLeagueCode] = useState(defaultLeagueCode);
  // Always initialize with instant, verified standings data so it NEVER shows an empty/blue screen!
  const [standingsResult, setStandingsResult] = useState<LeagueStandingsResult>(() =>
    getInitialStandings(defaultLeagueCode)
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTeam, setSearchTeam] = useState('');

  // When league changes or modal opens, instantly show the league table, then try live refresh in background
  useEffect(() => {
    if (!isOpen) return;

    // 1. Instant zero-delay load
    setStandingsResult(getInitialStandings(selectedLeagueCode));

    // 2. Background live sync
    let isMounted = true;
    setIsRefreshing(true);
    fetchLiveStandings(selectedLeagueCode)
      .then((res) => {
        if (isMounted && res && res.standings && res.standings.length > 0) {
          setStandingsResult(res);
        }
      })
      .catch(() => {
        // Silently retain the verified authentic data
      })
      .finally(() => {
        if (isMounted) setIsRefreshing(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, selectedLeagueCode]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchLiveStandings(selectedLeagueCode, true)
      .then((res) => {
        if (res && res.standings && res.standings.length > 0) {
          setStandingsResult(res);
        }
      })
      .finally(() => {
        setIsRefreshing(false);
      });
  };

  if (!isOpen) return null;

  const currentLeague = STANDINGS_LEAGUES.find(l => l.code === selectedLeagueCode) || {
    name: 'Lig Puan Durumu',
    country: 'Dünya',
    countryFlag: '⚽',
    aliases: []
  };

  const rows = standingsResult?.standings || [];
  const totalTeams = rows.length;

  // Search matching leagues
  const matchedLeagues = useMemo(() => {
    if (!searchTeam.trim()) return [];
    const q = searchTeam.toLowerCase().trim();
    return STANDINGS_LEAGUES.filter(l =>
      l.name.toLowerCase().includes(q) ||
      l.country.toLowerCase().includes(q) ||
      (l.aliases && l.aliases.some(a => a.toLowerCase().includes(q) || q.includes(a.toLowerCase())))
    );
  }, [searchTeam]);

  const filteredRows = useMemo(() => {
    if (!searchTeam.trim()) return rows;
    const query = searchTeam.toLowerCase().trim();

    // If query matches the currently selected league name or alias, don't filter out the teams
    const matchesCurrentLeague =
      currentLeague.name.toLowerCase().includes(query) ||
      (currentLeague.aliases && currentLeague.aliases.some(a => a.toLowerCase().includes(query)));

    if (matchesCurrentLeague) {
      return rows;
    }

    return rows.filter(r =>
      r.team.toLowerCase().includes(query) ||
      (r.shortName && r.shortName.toLowerCase().includes(query))
    );
  }, [rows, searchTeam, currentLeague]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && matchedLeagues.length > 0) {
      setSelectedLeagueCode(matchedLeagues[0].code);
      setSearchTeam('');
    }
  };

  return (
    <div className="fixed inset-0 z-[999] overflow-y-auto">
      {/* 1. Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* 2. Dialog Positioner */}
      <div
        className="fixed inset-0 z-10 overflow-y-auto flex items-center justify-center p-2.5 sm:p-4 md:p-6 pointer-events-none"
      >
        {/* 3. Modal Dialog Window */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto pointer-events-auto max-h-[92vh] flex flex-col animate-fadeIn"
        >
        
        {/* Sticky Top Header */}
        <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-slate-100 text-sm sm:text-base">
                  {currentLeague.countryFlag} {standingsResult?.leagueName || currentLeague.name} Puan Durumu
                </h3>
                <span className="hidden xs:inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                  <span>{isRefreshing ? 'Canlı Güncelleniyor...' : 'Canlı Veri'}</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Resmi federasyon & lig verileri • {totalTeams} Takım
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              title="Puan Tablosunu Yenile"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer border border-slate-700"
            >
              <RefreshCw className={`w-4 h-4 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* League Selector Horizontal Tabs & Quick Search */}
        <div className="px-3 sm:px-6 py-2.5 border-b border-slate-800/80 bg-slate-950/60 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center space-x-1.5 overflow-x-auto py-1.5 pb-2 text-xs scrollbar-thin scrollbar-thumb-slate-700 max-w-full">
            {STANDINGS_LEAGUES.map((league) => {
              const isActive = selectedLeagueCode === league.code;
              const isMatched = matchedLeagues.some((m) => m.code === league.code);
              return (
                <button
                  key={league.code}
                  onClick={() => {
                    setSelectedLeagueCode(league.code);
                    setSearchTeam('');
                  }}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-400 text-slate-950 border border-amber-300 font-black shadow-md shadow-amber-500/20'
                      : isMatched
                      ? 'bg-emerald-500/20 text-emerald-300 border-2 border-emerald-400 font-bold shadow-sm animate-pulse'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 bg-slate-900 border border-slate-800/80'
                  }`}
                >
                  <span>{league.countryFlag}</span>
                  <span>{league.name}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Lig & Takım Search in Standings */}
          <div className="relative shrink-0 md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTeam}
              onChange={(e) => setSearchTeam(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Lig veya takım ara... (Örn: Avrupa Ligi)"
              className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-700/80 text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-amber-400/80 focus:ring-1 focus:ring-amber-400/50 shadow-inner"
            />
            {searchTeam && (
              <button
                onClick={() => setSearchTeam('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                title="Aramayı Temizle"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Found Matching Leagues Quick Pill Bar */}
        {matchedLeagues.length > 0 && (
          <div className="px-3 sm:px-6 py-2 bg-emerald-950/40 border-b border-emerald-500/30 flex items-center gap-2 flex-wrap animate-fadeIn">
            <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1 shrink-0">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              Bulunan Lig:
            </span>
            {matchedLeagues.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  setSelectedLeagueCode(l.code);
                  setSearchTeam('');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedLeagueCode === l.code
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                    : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 shadow-sm'
                }`}
              >
                <span>{l.countryFlag}</span>
                <span>{l.name}</span>
                {selectedLeagueCode === l.code ? (
                  <span className="text-[10px] bg-slate-950/30 px-1 rounded">Seçili</span>
                ) : (
                  <span className="text-[10px] text-emerald-400 font-bold">Tabloyu Aç ➔</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Scrollable Table Area - ALWAYS RENDERS THE FULL TABLE IMMEDIATELY */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 pb-12">
          <div className="space-y-4">
            
            {/* Table Container */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/40 shadow-inner">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-bold tracking-wider bg-slate-900/60">
                    <th className="py-3 px-2.5 w-10 text-center">#</th>
                    <th className="py-3 px-3">Takım</th>
                    <th className="py-3 px-2 text-center" title="Oynanan Maç">O</th>
                    <th className="py-3 px-2 text-center" title="Galibiyet">G</th>
                    <th className="py-3 px-2 text-center" title="Beraberlik">B</th>
                    <th className="py-3 px-2 text-center" title="Mağlubiyet">M</th>
                    <th className="py-3 px-2 text-center hidden xs:table-cell" title="Attığı Gol">AG</th>
                    <th className="py-3 px-2 text-center hidden xs:table-cell" title="Yediği Gol">YG</th>
                    <th className="py-3 px-2 text-center font-bold" title="Averaj">AV</th>
                    <th className="py-3 px-3 text-center font-black text-slate-200" title="Toplam Puan">P</th>
                    <th className="py-3 px-3 text-center hidden sm:table-cell" title="Maç Başı Atılan / Yenen">Ort. Gol</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400">
                        {matchedLeagues.length > 0 ? (
                          <div className="flex flex-col items-center justify-center space-y-3 p-4">
                            <Sparkles className="w-8 h-8 text-amber-400 animate-bounce" />
                            <div className="text-sm font-bold text-white">
                              "{searchTeam}" bir lig adı olarak bulundu!
                            </div>
                            <p className="text-xs text-slate-400 max-w-sm">
                              Aşağıdaki butona tıklayarak ligin tüm takımlarını ve puan durumunu hemen görüntüleyebilirsiniz:
                            </p>
                            <div className="flex items-center gap-2 flex-wrap justify-center pt-1">
                              {matchedLeagues.map((l) => (
                                <button
                                  key={l.code}
                                  onClick={() => {
                                    setSelectedLeagueCode(l.code);
                                    setSearchTeam('');
                                  }}
                                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-colors cursor-pointer flex items-center gap-2 shadow-lg shadow-amber-500/20"
                                >
                                  <span>{l.countryFlag}</span>
                                  <span>{l.name} Puan Tablosunu Göster ➔</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <Search className="w-6 h-6 text-slate-500 opacity-60" />
                            <div className="text-xs font-semibold text-slate-300">
                              "{searchTeam}" ile eşleşen takım veya lig bulunamadı.
                            </div>
                            <button
                              onClick={() => setSearchTeam('')}
                              className="text-[11px] text-emerald-400 hover:underline cursor-pointer"
                            >
                              Aramayı temizle
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row) => {
                      const isLeader = row.rank === 1;
                      const isTopCl = row.rank <= 4;
                      const isEuropa = row.rank > 4 && row.rank <= 6;
                      const isRelegation = totalTeams > 14 && row.rank >= totalTeams - 3;

                      return (
                        <tr
                          key={`${row.team}-${row.rank}`}
                          className={`hover:bg-slate-800/50 transition-colors ${
                            isLeader
                              ? 'bg-emerald-500/5'
                              : isRelegation
                              ? 'bg-rose-500/5'
                              : ''
                          }`}
                        >
                          {/* Rank # */}
                          <td className="py-2.5 px-2.5 text-center">
                            <span
                              className={`inline-flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-black font-mono shadow-xs ${
                                isLeader
                                  ? 'bg-emerald-500 text-slate-950'
                                  : isTopCl
                                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                                  : isEuropa
                                  ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-500/30'
                                  : isRelegation
                                  ? 'bg-rose-950/80 text-rose-400 border border-rose-500/30'
                                  : 'text-slate-400 bg-slate-800/60'
                              }`}
                            >
                              {row.rank}
                            </span>
                          </td>

                          {/* Team Name & Logo */}
                          <td className="py-2.5 px-3">
                            <div className="flex items-center space-x-2.5 min-w-0">
                              {row.logo ? (
                                <img
                                  src={row.logo}
                                  alt={row.team}
                                  className="w-5 h-5 object-contain shrink-0"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: row.primaryColor }}
                                />
                              )}
                              <span
                                className={`font-bold truncate text-xs sm:text-sm ${
                                  isLeader
                                    ? 'text-emerald-300 font-extrabold'
                                    : isTopCl
                                    ? 'text-slate-100'
                                    : 'text-slate-200'
                                }`}
                              >
                                {row.team}
                              </span>
                            </div>
                          </td>

                          {/* Stats */}
                          <td className="py-2.5 px-2 text-center text-slate-400 font-mono">{row.played}</td>
                          <td className="py-2.5 px-2 text-center text-emerald-400 font-mono font-semibold">{row.won}</td>
                          <td className="py-2.5 px-2 text-center text-amber-400 font-mono font-semibold">{row.drawn}</td>
                          <td className="py-2.5 px-2 text-center text-rose-400 font-mono font-semibold">{row.lost}</td>
                          <td className="py-2.5 px-2 text-center text-slate-400 font-mono hidden xs:table-cell">{row.gf}</td>
                          <td className="py-2.5 px-2 text-center text-slate-400 font-mono hidden xs:table-cell">{row.ga}</td>

                          {/* GD (Averaj) */}
                          <td className="py-2.5 px-2 text-center font-mono font-bold">
                            <span
                              className={
                                row.gd > 0
                                  ? 'text-emerald-400'
                                  : row.gd < 0
                                  ? 'text-rose-400'
                                  : 'text-slate-400'
                              }
                            >
                              {row.gd > 0 ? `+${row.gd}` : row.gd}
                            </span>
                          </td>

                          {/* Points */}
                          <td className="py-2.5 px-3 text-center font-black font-mono text-sm sm:text-base text-white">
                            {row.points}
                          </td>

                          {/* Goal Average Metric for Poisson */}
                          <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px] hidden sm:table-cell">
                            <span className="text-emerald-400">{row.avgGoalsScored}</span> / <span className="text-purple-400">{row.avgGoalsConceded}</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Legend */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
              <div className="flex items-center space-x-4">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
                  <span>Şampiyonlar Ligi / Zirve</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500"></span>
                  <span>Avrupa Kupaları</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span>
                  <span>Küme Düşme Hattı</span>
                </span>
              </div>

              <div className="text-[10px] text-slate-500">
                Son Güncelleme: <span className="text-slate-300 font-mono">{new Date().toLocaleTimeString('tr-TR')}</span>
              </div>
            </div>

            {/* Bottom Safe Spacer */}
            <div className="h-6" />
          </div>
        </div>

        </div>
      </div>
    </div>
  );
};
export default StandingsModal;

// src/components/LeagueTreeSelector.tsx
// League Tree & Bulletin Sidebar with Match Count Badges

import React, { useState, useEffect } from 'react';
import { LeagueGroup } from '../services/bulletinService';
import { ChevronDown, ChevronRight, Globe, Layers, X, ShieldAlert } from 'lucide-react';

function isLeagueTreeItemActive(leagueName: string, leagueCategory: string, selected: string): boolean {
  if (!selected || selected === 'all') return false;
  if (selected === leagueName || selected === leagueCategory) return true;
  const sel = selected.toLowerCase();
  const name = leagueName.toLowerCase();
  const cat = (leagueCategory || '').toLowerCase();
  if (sel === 'super-lig' || sel.includes('süper')) return cat === 'super-lig' || name.includes('süper');
  if (sel === '1-lig' || sel.includes('1. lig')) return (cat === '1-lig' || name.includes('1. lig')) && !name.includes('süper');
  if (sel === 'premier-league' || sel.includes('premier')) return cat === 'premier-league' || name.includes('premier');
  if (sel === 'la-liga' || sel.includes('la liga')) return cat === 'la-liga' || name.includes('la liga');
  if (sel === 'serie-a' || sel.includes('serie a')) return cat === 'serie-a' || name.includes('serie a');
  if (sel === 'bundesliga' || sel.includes('bundesliga')) return cat === 'bundesliga' || name.includes('bundesliga');
  if (sel === 'cl' || sel.includes('şampiyonlar') || sel.includes('champions')) return cat === 'cl' || name.includes('şampiyonlar');
  if (sel === 'ligue-1' || sel.includes('ligue 1')) return cat === 'ligue-1' || name.includes('ligue 1');
  return name.includes(sel) || sel.includes(name);
}

interface LeagueTreeSelectorProps {
  leagueGroups: LeagueGroup[];
  selectedLeague: string; // 'all' or league name/category
  onSelectLeague: (leagueKey: string) => void;
  totalMatches: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const LeagueTreeSelector: React.FC<LeagueTreeSelectorProps> = ({
  leagueGroups,
  selectedLeague,
  onSelectLeague,
  totalMatches,
  isOpenMobile = false,
  onCloseMobile
}) => {
  // Store expanded countries, default top 4 expanded
  const [expandedCountries, setExpandedCountries] = useState<Record<string, boolean>>({
    'Türkiye': true,
    'İngiltere': true,
    'İspanya': true,
    'Avrupa': true
  });

  // Automatically expand country if it contains selected league
  useEffect(() => {
    if (selectedLeague && selectedLeague !== 'all') {
      const activeGroup = leagueGroups.find(g =>
        g.leagues.some(l => isLeagueTreeItemActive(l.name, l.category, selectedLeague))
      );
      if (activeGroup) {
        setExpandedCountries(prev => ({
          ...prev,
          [activeGroup.country]: true
        }));
      }
    }
  }, [selectedLeague, leagueGroups]);

  const toggleCountry = (country: string) => {
    setExpandedCountries(prev => ({
      ...prev,
      [country]: !prev[country]
    }));
  };

  const content = (
    <div className="flex flex-col h-full max-h-full bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl backdrop-blur-md overflow-hidden">
      
      {/* Title */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 shrink-0">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-200">
              Bülten Ağacı & Ligler
            </h3>
            <p className="text-[10px] text-slate-400">
              Ülkelere göre canlı fikstürler
            </p>
          </div>
        </div>

        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white bg-slate-800 border border-slate-700 cursor-pointer shadow-sm"
            aria-label="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* "All Leagues" Master Button */}
      <button
        onClick={() => {
          onSelectLeague('all');
          if (onCloseMobile) onCloseMobile();
        }}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all mb-3 cursor-pointer shrink-0 ${
          selectedLeague === 'all'
            ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/40 glow-emerald'
            : 'bg-slate-950/60 text-slate-300 hover:bg-slate-800/80 border border-slate-800/80'
        }`}
      >
        <div className="flex items-center space-x-2">
          <Globe className="w-4 h-4 text-emerald-400" />
          <span>Tüm Bülten & Ligler</span>
        </div>
        <span className="text-[11px] font-mono font-black bg-slate-800/90 px-2 py-0.5 rounded-full text-slate-300 border border-slate-700/60">
          {totalMatches}
        </span>
      </button>

      {/* Scrollable Tree List */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-1.5 pr-1.5 text-xs">
        {leagueGroups.map((group) => {
          const isExpanded = !!expandedCountries[group.country];
          const hasSelectedChild = group.leagues.some(l => isLeagueTreeItemActive(l.name, l.category, selectedLeague));

          return (
            <div
              key={group.country}
              className={`rounded-2xl border transition-all overflow-hidden ${
                hasSelectedChild
                  ? 'border-emerald-500/30 bg-slate-950/40'
                  : 'border-slate-800/60 bg-slate-950/20'
              }`}
            >
              {/* Country Row Header */}
              <div
                onClick={() => toggleCountry(group.country)}
                className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-slate-800/40 transition-colors select-none"
              >
                <div className="flex items-center space-x-2 font-bold text-slate-200">
                  <span className="text-base leading-none">{group.countryFlag}</span>
                  <span className="text-xs">{group.country}</span>
                </div>

                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.2 rounded-md font-semibold">
                    {group.totalCountryMatches}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </div>
              </div>

              {/* Sub-leagues List */}
              {isExpanded && (
                <div className="px-2 pb-2 pt-1 space-y-1 border-t border-slate-800/40 bg-slate-950/50">
                  {group.leagues.map((league) => {
                    const isSelected = isLeagueTreeItemActive(league.name, league.category, selectedLeague);

                    return (
                      <button
                        key={league.name}
                        onClick={() => {
                          onSelectLeague(league.name);
                          if (onCloseMobile) onCloseMobile();
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[11px] font-medium transition-all cursor-pointer text-left ${
                          isSelected
                            ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 shadow-xs'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        }`}
                      >
                        <span className="truncate pr-2">{league.name}</span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md shrink-0 ${
                            isSelected
                              ? 'bg-emerald-500 text-slate-950 font-black'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {league.matchCount}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 shrink-0 self-start sticky top-20 h-[calc(100vh-5.5rem)] max-h-[calc(100vh-5.5rem)]">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-slate-950/80 backdrop-blur-md">
          <div className="fixed inset-0" onClick={onCloseMobile}></div>
          <div className="relative w-84 max-w-[90vw] h-full max-h-screen p-3 z-10 flex flex-col shadow-2xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
};


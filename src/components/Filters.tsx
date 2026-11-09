// src/components/Filters.tsx
import React from 'react';
import { Search, Flame, Zap, Trophy, ShieldAlert, Sparkles, X, Star, ArrowDownUp, Calendar, Layers, ChevronRight } from 'lucide-react';
import { LeagueCategory } from '../types';
import { POPULAR_LEAGUES } from '../utils/leagueHelper';
import { DateFilterOption } from '../utils/dateHelper';

export type CategoryFilter = 'all' | 'banko' | 'over25' | 'btts' | 'htft' | 'favorites';
export type SortOption = 'confidence' | 'time' | 'goals' | 'ms1';

interface FiltersProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  selectedCategory: CategoryFilter;
  setSelectedCategory: (cat: CategoryFilter) => void;
  selectedLeague: string;
  setSelectedLeague: (league: string) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  sortOption: SortOption;
  setSortOption: (sort: SortOption) => void;
  onOpenMobileLeagueTree?: () => void;
  leagueMatchCounts?: Record<string, number>;
  dateOptions?: DateFilterOption[];
  counts: {
    all: number;
    banko: number;
    over25: number;
    btts: number;
    htft: number;
    favorites: number;
  };
}

export const Filters: React.FC<FiltersProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedLeague,
  setSelectedLeague,
  selectedDate,
  setSelectedDate,
  sortOption,
  setSortOption,
  onOpenMobileLeagueTree,
  leagueMatchCounts,
  dateOptions: propDateOptions,
  counts
}) => {
  const categories: { id: CategoryFilter; label: string; icon: React.ReactNode; count: number }[] = [
    {
      id: 'all',
      label: 'Tüm Maçlar',
      icon: <Trophy className="w-3.5 h-3.5" />,
      count: counts.all
    },
    {
      id: 'banko',
      label: 'Bankolar (+%75)',
      icon: <Flame className="w-3.5 h-3.5 text-emerald-400" />,
      count: counts.banko
    },
    {
      id: 'over25',
      label: '2.5 Gol Üst',
      icon: <Zap className="w-3.5 h-3.5 text-amber-400" />,
      count: counts.over25
    },
    {
      id: 'btts',
      label: 'KG Var',
      icon: <Sparkles className="w-3.5 h-3.5 text-purple-400" />,
      count: counts.btts
    },
    {
      id: 'htft',
      label: 'İY/MS Sürpriz',
      icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />,
      count: counts.htft
    },
    {
      id: 'favorites',
      label: 'Favoriler',
      icon: <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />,
      count: counts.favorites
    }
  ];

  const defaultDateOptions = [
    { id: 'all', label: 'Tüm Günler', count: counts.all },
    { id: 'today', label: 'Bugün', count: counts.all }
  ];

  const dateOptions = propDateOptions && propDateOptions.length > 0
    ? propDateOptions
    : defaultDateOptions;

  return (
    <div className="space-y-3.5 my-3">
      
      {/* Search Input Bar */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400/80" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Takım, lig veya ülke ara..."
            className="w-full pl-10 sm:pl-12 pr-10 py-2.5 sm:py-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Mobile-Only League Tree Drawer Opener */}
        {onOpenMobileLeagueTree && (
          <button
            onClick={onOpenMobileLeagueTree}
            className="lg:hidden flex items-center space-x-1.5 px-3 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-emerald-400 text-xs font-bold shrink-0 hover:bg-slate-850 cursor-pointer shadow-inner"
            title="Tüm Ligler Menüsü"
          >
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Ligler</span>
          </button>
        )}
      </div>

      {/* Date Filter & Sort Controls Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
        
        {/* Date Selector Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-500 text-[11px] font-medium flex items-center space-x-1 shrink-0 mr-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Tarih:</span>
          </span>
          {dateOptions.map((opt) => {
            const isDateActive = selectedDate === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setSelectedDate(opt.id)}
                className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isDateActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-900/50 hover:bg-slate-800 border border-slate-800/60'
                }`}
              >
                <span>{opt.label}</span>
                {typeof opt.count === 'number' && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isDateActive
                        ? 'bg-emerald-500/30 text-emerald-200 font-bold'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {opt.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sort Options */}
        <div className="flex items-center space-x-2 text-xs text-slate-400 shrink-0 self-end sm:self-auto">
          <ArrowDownUp className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-[11px] hidden xs:inline">Sıralama:</span>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-medium cursor-pointer"
          >
            <option value="time">Başlama Saatine Göre (Erkenden Geçe)</option>
            <option value="confidence">En Yüksek Güven Skoru</option>
            <option value="goals">En Yüksek Gol Beklentisi (xG)</option>
            <option value="ms1">Ev Sahibi Üstünlüğü (MS 1)</option>
          </select>
        </div>

      </div>

      {/* Quick Category Tabs (Wrap compactly, smaller text, NO horizontal scrollbar) */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-slate-800 text-white border border-emerald-500/50 shadow-sm shadow-emerald-500/10'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800/60'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
              <span
                className={`text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected League Active Filter Banner (if a single league is filtered) */}
      {selectedLeague !== 'all' && (
        <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-1.5 text-xs text-emerald-300">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-400">Seçili Lig:</span>
            <span className="font-bold text-white bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
              {POPULAR_LEAGUES.find(l => l.id === selectedLeague)?.flag || '⚽'}{' '}
              {POPULAR_LEAGUES.find(l => l.id === selectedLeague)?.name || selectedLeague}
            </span>
          </div>
          <button
            onClick={() => setSelectedLeague('all')}
            className="flex items-center space-x-1 text-slate-400 hover:text-white font-medium hover:underline cursor-pointer"
          >
            <span>Tüm Ligleri Göster</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

    </div>
  );
};

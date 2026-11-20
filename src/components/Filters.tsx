// src/components/Filters.tsx
import React from 'react';
import {
  Search,
  Flame,
  Zap,
  Trophy,
  ShieldAlert,
  Sparkles,
  X,
  Star,
  ArrowDownUp,
  Layers,
  Target
} from 'lucide-react';
import { POPULAR_LEAGUES } from '../utils/leagueHelper';
import { DateFilterOption } from '../utils/dateHelper';
import { CategoryFilter } from '../utils/categoryFilterHelper';

export type { CategoryFilter };
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
    value: number;
  };
}

const FiltersComponent: React.FC<FiltersProps> = ({
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
  dateOptions: propDateOptions,
  counts
}) => {
  const categories: {
    id: CategoryFilter;
    label: string;
    description: string;
    icon: React.ReactNode;
    count: number;
  }[] = [
    {
      id: 'all',
      label: 'Tüm Maçlar',
      description: 'Bültenin tüm karşılaşmaları',
      icon: <Trophy className="w-3.5 h-3.5 text-emerald-400" />,
      count: counts.all
    },
    {
      id: 'banko',
      label: 'Bankolar (+%70)',
      description: 'En yüksek istatistiksel güvene sahip maçlar',
      icon: <Flame className="w-3.5 h-3.5 text-emerald-400" />,
      count: counts.banko
    },
    {
      id: 'value',
      label: 'Değer Bahisleri',
      description: 'Yapay zekanın oran avantajı yakaladığı maçlar',
      icon: <Target className="w-3.5 h-3.5 text-amber-400" />,
      count: counts.value
    },
    {
      id: 'over25',
      label: '2.5 Gol Üst',
      description: 'xG beklentisi yüksek bol gollü maçlar',
      icon: <Zap className="w-3.5 h-3.5 text-amber-400" />,
      count: counts.over25
    },
    {
      id: 'btts',
      label: 'KG Var',
      description: 'İki takımın da gol bulması beklenen maçlar',
      icon: <Sparkles className="w-3.5 h-3.5 text-purple-400" />,
      count: counts.btts
    },
    {
      id: 'htft',
      label: 'İY/MS Sürpriz',
      description: 'Yüksek oranlı devre ve sonuç tercihleri',
      icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />,
      count: counts.htft
    },
    {
      id: 'favorites',
      label: 'Favoriler',
      description: 'Yıldızladığınız özel takip listeniz',
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
    <div className="space-y-2.5 my-3">
      {/* 1. Search Input Bar */}
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
            className="w-full pl-10 sm:pl-12 pr-10 py-2 sm:py-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-inner"
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
            className="lg:hidden flex items-center space-x-1.5 px-3 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-emerald-400 text-xs font-bold shrink-0 hover:bg-slate-850 cursor-pointer shadow-inner"
            title="Tüm Ligler Menüsü"
          >
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Ligler</span>
          </button>
        )}
      </div>

      {/* 2. Responsive Wrapping Category Pills (100% visible on both Mobile & Full-Screen!) */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1 border-t border-slate-800/60">
        {categories.map((cat) => {
          const isCatActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border select-none active:scale-95 ${
                isCatActive
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md shadow-amber-400/20 ring-1 ring-amber-300'
                  : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700'
              }`}
              title={cat.description}
            >
              <span className="shrink-0">{cat.icon}</span>
              <span className="whitespace-nowrap">{cat.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ${
                  isCatActive
                    ? 'bg-slate-950 text-amber-300'
                    : 'bg-slate-950 text-slate-400 border border-slate-800'
                }`}
              >
                {cat.count}
              </span>
            </button>
          );
        })}

        {/* Clear Filter Button if Category is not 'all' */}
        {selectedCategory !== 'all' && (
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 hover:text-rose-200 text-xs font-bold border border-rose-500/30 cursor-pointer transition-colors"
            title="Kategori Filtresini Sıfırla"
          >
            <span>Filtreyi Temizle</span>
            <X className="w-3.5 h-3.5 text-rose-400" />
          </button>
        )}
      </div>

      {/* 3. Date Selector & Sort Dropdown */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
        {/* Date Selector Grid */}
        <div className="flex-1 min-w-0">
          <div className={`w-full ${dateOptions.length <= 4 ? 'grid grid-cols-4 gap-1' : 'flex items-center gap-1 overflow-x-auto no-scrollbar'}`}>
            {dateOptions.map((opt) => {
              const isDateActive = selectedDate === opt.id;
              let shortLabel = opt.label;
              if (opt.id === 'all') shortLabel = 'Tümü';
              else if (opt.id === 'today') shortLabel = 'Bugün';
              else if (opt.id === 'tomorrow') shortLabel = 'Yarın';
              else if (opt.id === 'future') shortLabel = 'Gelecek';

              return (
                <button
                  key={opt.id}
                  onClick={() => setSelectedDate(opt.id)}
                  className={`flex items-center justify-center space-x-1 py-1.5 px-1 sm:px-2.5 rounded-lg font-bold transition-all text-xs cursor-pointer min-w-0 ${
                    isDateActive
                      ? 'bg-emerald-500 text-slate-950 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 bg-slate-900/50 hover:bg-slate-800 border border-slate-800/60'
                  }`}
                  title={opt.label}
                >
                  <span className="truncate sm:hidden">{shortLabel}</span>
                  <span className="hidden sm:inline truncate">{opt.label}</span>
                  {typeof opt.count === 'number' && (
                    <span
                      className={`text-[10px] px-1 py-0.2 rounded font-mono font-black shrink-0 ${
                        isDateActive
                          ? 'bg-black/30 text-current'
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
        </div>

        {/* Sort Option Selector */}
        <div className="flex items-center justify-end space-x-1.5 text-xs text-slate-400 shrink-0">
          <ArrowDownUp className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="text-slate-400 text-xs hidden sm:inline">Sırala:</span>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-2 sm:px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-medium cursor-pointer"
          >
            <option value="time">Saat</option>
            <option value="confidence">Güven Skoru</option>
            <option value="goals">xG (Gol)</option>
            <option value="ms1">MS 1</option>
          </select>
        </div>
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

export const Filters = React.memo(FiltersComponent);

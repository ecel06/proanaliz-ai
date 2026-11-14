// src/components/Filters.tsx
import React, { useState, useRef, useEffect } from 'react';
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
  Calendar,
  Layers,
  ChevronDown,
  Target,
  Check,
  Filter
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
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    };
    if (isCategoryDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isCategoryDropdownOpen]);

  const categories: {
    id: CategoryFilter;
    label: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    count: number;
  }[] = [
    {
      id: 'all',
      label: 'Tüm Maçlar',
      description: 'Bültenin tüm karşılaşmaları',
      icon: <Trophy className="w-3.5 h-3.5 text-emerald-400" />,
      color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      count: counts.all
    },
    {
      id: 'value',
      label: '🎯 Değer Bahisleri',
      description: 'Yapay zekanın oran avantajı yakaladığı maçlar',
      icon: <Target className="w-3.5 h-3.5 text-amber-400" />,
      color: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      count: counts.value
    },
    {
      id: 'banko',
      label: '🔥 Bankolar (+%70)',
      description: 'En yüksek istatistiksel güvene sahip tercihler',
      icon: <Flame className="w-3.5 h-3.5 text-emerald-400" />,
      color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      count: counts.banko
    },
    {
      id: 'over25',
      label: '⚡ 2.5 Gol Üst',
      description: 'xG beklentisi yüksek, tempolu bol gollü maçlar',
      icon: <Zap className="w-3.5 h-3.5 text-amber-400" />,
      color: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      count: counts.over25
    },
    {
      id: 'btts',
      label: '✨ KG Var',
      description: 'İki takımın da gol atma potansiyeli yüksek',
      icon: <Sparkles className="w-3.5 h-3.5 text-purple-400" />,
      color: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      count: counts.btts
    },
    {
      id: 'htft',
      label: '🛡️ İY/MS Sürpriz',
      description: 'Yüksek kazanç potansiyelli devre/sonuç tercihleri',
      icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />,
      color: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      count: counts.htft
    },
    {
      id: 'favorites',
      label: '⭐ Favoriler',
      description: 'Yıldızladığınız özel takip listeniz',
      icon: <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />,
      color: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      count: counts.favorites
    }
  ];

  const activeCategory = categories.find((c) => c.id === selectedCategory) || categories[0];

  const defaultDateOptions = [
    { id: 'all', label: 'Tüm Günler', count: counts.all },
    { id: 'today', label: 'Bugün', count: counts.all }
  ];

  const dateOptions = propDateOptions && propDateOptions.length > 0
    ? propDateOptions
    : defaultDateOptions;

  return (
    <div className="space-y-3.5 my-3">
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

      {/* 2. Unified Controls Bar (Category Dropdown + Date Filter + Sort Options) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 pt-1 border-t border-slate-800/60">
        
        {/* Left Section: Category Dropdown & Active Indicator */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown Button */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                selectedCategory !== 'all'
                  ? 'bg-slate-800 text-white border-amber-400 ring-2 ring-amber-400/30 shadow-md'
                  : 'bg-slate-900/90 hover:bg-slate-850 text-slate-200 border-slate-800'
              }`}
            >
              <div className="flex items-center space-x-1.5">
                <Filter className={`w-3.5 h-3.5 ${selectedCategory !== 'all' ? 'text-amber-400' : 'text-emerald-400'}`} />
                <span className="text-slate-400 text-[11px] font-normal">Kategori:</span>
                <span className="font-black text-white flex items-center space-x-1">
                  <span>{activeCategory.label}</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black bg-slate-950 text-amber-300 border border-slate-800">
                  {activeCategory.count}
                </span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  isCategoryDropdownOpen ? 'rotate-180 text-emerald-400' : ''
                }`}
              />
            </button>

            {/* Floating Category Dropdown Menu */}
            {isCategoryDropdownOpen && (
              <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-800 shadow-2xl p-1.5 z-50 animate-fadeIn space-y-1">
                <div className="px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-800/80 flex items-center justify-between">
                  <span>Filtre Kategorileri</span>
                  <span className="text-emerald-400">{counts.all} Karşılaşma</span>
                </div>
                <div className="max-h-80 overflow-y-auto space-y-0.5 custom-scrollbar">
                  {categories.map((cat) => {
                    const isCatActive = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(cat.id);
                          setIsCategoryDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                          isCatActive
                            ? 'bg-emerald-500/15 border border-emerald-500/40 text-white'
                            : 'hover:bg-slate-800/70 text-slate-300 hover:text-white border border-transparent'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${cat.color}`}>
                            {cat.icon}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-black truncate flex items-center gap-1.5">
                              <span>{cat.label}</span>
                              {isCatActive && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 stroke-[3]" />}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {cat.description}
                            </div>
                          </div>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-black shrink-0 ${
                            isCatActive
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-slate-950 text-slate-400 border border-slate-800'
                          }`}
                        >
                          {cat.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Quick Clear Filter Button if Category is not 'all' */}
          {selectedCategory !== 'all' && (
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white text-[11px] font-bold border border-slate-800 cursor-pointer transition-colors"
              title="Kategori Filtresini Sıfırla"
            >
              <span>Temizle</span>
              <X className="w-3 h-3 text-slate-400" />
            </button>
          )}
        </div>

        {/* Right Section: Date Selector & Sort Dropdown */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 text-xs">
          {/* Date Selector Pills */}
          <div className="flex items-center space-x-1 overflow-x-auto max-w-full pb-0.5">
            <span className="text-slate-500 text-[11px] font-medium flex items-center space-x-1 shrink-0 mr-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Tarih:</span>
            </span>
            {dateOptions.map((opt) => {
              const isDateActive = selectedDate === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setSelectedDate(opt.id)}
                  className={`inline-flex items-center space-x-1 px-2 py-1 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer text-xs ${
                    isDateActive
                      ? 'bg-emerald-500 text-slate-950 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 bg-slate-900/50 hover:bg-slate-800 border border-slate-800/60'
                  }`}
                >
                  <span>{opt.label}</span>
                  {typeof opt.count === 'number' && (
                    <span
                      className={`text-[10px] px-1 py-0.2 rounded font-mono font-black ${
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

          {/* Sort Options Select */}
          <div className="flex items-center space-x-1.5 text-xs text-slate-400 shrink-0">
            <ArrowDownUp className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-medium cursor-pointer"
            >
              <option value="time">Başlama Saatine Göre</option>
              <option value="confidence">Güven Skoru</option>
              <option value="goals">Gol Beklentisi (xG)</option>
              <option value="ms1">MS 1 Üstünlüğü</option>
            </select>
          </div>
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

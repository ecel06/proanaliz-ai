// src/App.tsx
// ProAnaliz AI - Complete Live Multi-League Football Analytics App

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Match, MatchAnalysis, UserBetslipItem } from './types';
import { analyzeMatch } from './utils/predictionEngine';
import { BettingPickOption } from './utils/oddsHelper';
import { Header } from './components/Header';
import { Filters, CategoryFilter, SortOption } from './components/Filters';
import { LeagueTreeSelector } from './components/LeagueTreeSelector';
import { MatchCard } from './components/MatchCard';
import { FinishedMatchCard } from './components/FinishedMatchCard';
import { MatchDetailModal } from './components/MatchDetailModal';
import { CustomMatchAnalyzer } from './components/CustomMatchAnalyzer';
import { StandingsModal } from './components/StandingsModal';
import { InstallAppModal } from './components/InstallAppModal';
import { AIChatModal } from './components/AIChatModal';
import { BetslipDrawer } from './components/BetslipDrawer';
import { NesineBulletinView } from './components/NesineBulletinView';
import { MatchOfTheDayBanner } from './components/MatchOfTheDayBanner';
import { GoalNotificationToast, LiveGoalEvent } from './components/GoalNotificationToast';
import { BankrollTrackerModal } from './components/BankrollTrackerModal';
import {
  getSavedSlips,
  saveNewSlip,
  evaluateSlipsWithMatches,
  calculateBankrollStats,
  SavedSlip
} from './utils/bankrollHelper';
import { isSoundEnabled, setSoundEnabled, playGoalChime } from './utils/soundHelper';
import { isMatchInLeague, POPULAR_LEAGUES } from './utils/leagueHelper';
import {
  groupMatchesByCountry,
  getWeeklyMatches,
  getInitialWeeklyMatches
} from './services/bulletinService';
import { refreshLiveForms } from './services/liveFormService';
import {
  Trophy,
  Flame,
  BrainCircuit,
  Calculator,
  ShieldCheck,
  BarChart3,
  Search,
  Sparkles,
  Info,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Star,
  Layers,
  Radio,
  Check,
  Activity,
  ChevronRight,
  Bot,
  LayoutList,
  LayoutGrid
} from 'lucide-react';
import { getMatchLiveState, parseMatchKickoffEpoch } from './utils/liveMatchHelper';
import { getDynamicDateOptions, isMatchOnDateFilter } from './utils/dateHelper';
import { generateCuratedCoupons } from './utils/couponEngine';
import { CouponsSection } from './components/CouponsSection';
import { detectMatchValueBets } from './utils/valueBetHelper';
import { detectLiveGoalRadarAlerts, getSampleRadarAlerts, LiveGoalRadarAlert } from './utils/liveGoalRadarHelper';

export const App: React.FC = () => {
  // 1. Live Bulletin State (Loaded immediately from bundled data, updated via API)
  const [weeklyMatches, setWeeklyMatches] = useState<Match[]>(() => getInitialWeeklyMatches());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshToast, setRefreshToast] = useState<string | null>(null);
  const [totalMatches, setTotalMatches] = useState<number>(() => getInitialWeeklyMatches().length);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>(() => new Date().toISOString());
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);

  // User Betslip (Kullanıcı Kuponu & Hesaplayıcı)
  const [betslipItems, setBetslipItems] = useState<UserBetslipItem[]>([]);
  const [isBetslipOpen, setIsBetslipOpen] = useState(false);

  // View Mode: 'bulletin' (Nesine Tarzı Sade Liste) vs 'cards' (Detaylı Geniş Kartlar)
  const [viewMode, setViewMode] = useState<'bulletin' | 'cards'>(() => {
    try {
      return (localStorage.getItem('proanaliz_view_mode') as 'bulletin' | 'cards') || 'bulletin';
    } catch {
      return 'bulletin';
    }
  });

  const handleSetViewMode = (mode: 'bulletin' | 'cards') => {
    setViewMode(mode);
    try {
      localStorage.setItem('proanaliz_view_mode', mode);
    } catch (e) { }
  };

  const handleToggleBetslip = (match: Match, option: BettingPickOption) => {
    setBetslipItems((prev) => {
      const exists = prev.find((it) => it.matchId === match.id && it.pickKey === option.key);
      if (exists) {
        return prev.filter((it) => it.id !== exists.id);
      }
      const otherFromMatch = prev.filter((it) => it.matchId !== match.id);
      const newItem: UserBetslipItem = {
        id: `${match.id}_${option.key}`,
        matchId: match.id,
        match,
        marketName: option.marketName,
        pickKey: option.key,
        pickLabel: option.label,
        odd: option.odd,
        probability: option.probability
      };
      return [...otherFromMatch, newItem];
    });
  };

  const handleRemoveBetslipItem = (id: string) => {
    setBetslipItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleClearBetslip = () => {
    setBetslipItems([]);
  };

  const handleConsultAIFromSlip = (couponSummary: string) => {
    setIsAIChatOpen(true);
  };

  // Virtual Bankroll & Saved Slips State
  const [isBankrollModalOpen, setIsBankrollModalOpen] = useState(false);
  const [savedSlips, setSavedSlips] = useState<SavedSlip[]>(() => getSavedSlips());

  // Live Goal Sound & Toast State
  const [isMuted, setIsMuted] = useState<boolean>(() => !isSoundEnabled());
  const [activeGoalToast, setActiveGoalToast] = useState<LiveGoalEvent | null>(null);

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    setSoundEnabled(!nextMuted);
    if (!nextMuted) {
      playGoalChime();
    }
  };

  const [newVersionAvailable, setNewVersionAvailable] = useState(false);
  const [serverVersion, setServerVersion] = useState<string | null>(null);

  // Check for app version updates from server
  const CLIENT_BUILD_VERSION = '2026.11.10.1';
  useEffect(() => {
    const checkVersion = async () => {
      try {
        const res = await fetch('/api/version', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.version && data.version !== CLIENT_BUILD_VERSION) {
            const dismissed = localStorage.getItem('proanaliz_dismissed_version');
            if (dismissed !== data.version) {
              setServerVersion(data.version);
              setNewVersionAvailable(true);
            }
          }
        }
      } catch (e) {
        // offline
      }
    };

    checkVersion();
    const verTimer = setInterval(checkVersion, 20000);
    return () => clearInterval(verTimer);
  }, []);

  const handleUpdateApp = () => {
    if (serverVersion) {
      try {
        localStorage.setItem('proanaliz_dismissed_version', serverVersion);
      } catch (e) { }
    }
    if ('caches' in window) {
      caches.keys().then(names => names.forEach(name => caches.delete(name)));
    }
    try {
      sessionStorage.clear();
    } catch (e) { }
    window.location.reload();
  };

  // Listen for PWA beforeinstallprompt on supported browsers
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleDirectInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      setIsInstallable(false);
      setIsInstallModalOpen(false);
    }
    setDeferredPrompt(null);
  };

  // Real-time clock tick every 20 seconds to smoothly update live minutes & live match states
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 20000);
    return () => clearInterval(timer);
  }, []);

  // Load weekly matches on mount & auto-poll live scores every 25 seconds
  useEffect(() => {
    const fetchMatches = () => {
      getWeeklyMatches()
        .then((grouped) => {
          const all = Object.values(grouped).flat();
          if (all.length > 0) {
            setWeeklyMatches(all);
            setTotalMatches(all.length);
            setLastUpdatedAt(new Date().toISOString());
          }
        })
        .catch((err) => {
          console.warn('Haftalık maç verisi güncellenirken hata:', err);
        });
    };

    fetchMatches();
    const livePollInterval = setInterval(fetchMatches, 25000);
    return () => clearInterval(livePollInterval);
  }, []);

  const handleRefreshBulletin = async () => {
    setIsRefreshing(true);
    try {
      // After backend refresh, fetch fresh weekly matches
      const grouped = await getWeeklyMatches();
      const all = Object.values(grouped).flat();
      if (all.length > 0) {
        setWeeklyMatches(all);
        setTotalMatches(all.length);
        setLastUpdatedAt(new Date().toISOString());
      }
      setRefreshToast('Bülten yenilendi');
      setTimeout(() => setRefreshToast(null), 3500);
    } finally {
      setIsRefreshing(false);
    }
  };

  // 2. Favorites stored in localStorage
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('proanaliz_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('proanaliz_favorites', JSON.stringify(favorites));
    } catch {
      // ignore
    }
  }, [favorites]);

  const toggleFavorite = (matchId: string) => {
    setFavorites(prev =>
      prev.includes(matchId) ? prev.filter(id => id !== matchId) : [...prev, matchId]
    );
  };

  // 3. Pre-calculate Poisson analyses for all matches in bulletin
  const allMatches: Match[] = weeklyMatches;

  // Track previous scores for live goal chime & toast notification
  const prevScoresRef = useRef<Map<string, { home: number; away: number }>>(new Map());
  const isInitialPollRef = useRef(true);

  useEffect(() => {
    const prevScores = prevScoresRef.current;
    if (isInitialPollRef.current) {
      allMatches.forEach(m => {
        const live = getMatchLiveState(m, currentTime);
        if (live.isLive) {
          prevScores.set(String(m.id), { home: live.displayScore.home, away: live.displayScore.away });
        }
      });
      isInitialPollRef.current = false;
      return;
    }

    for (const match of allMatches) {
      const live = getMatchLiveState(match, currentTime);
      if (!live.isLive) continue;
      const old = prevScores.get(String(match.id));
      const currentH = live.displayScore.home;
      const currentA = live.displayScore.away;

      if (old) {
        if (currentH > old.home || currentA > old.away) {
          const scoringTeam = currentH > old.home ? match.homeTeam.name : match.awayTeam.name;
          playGoalChime();
          setActiveGoalToast({
            id: `goal-${match.id}-${Date.now()}`,
            matchId: String(match.id),
            scoringTeamName: scoringTeam,
            homeTeamName: match.homeTeam.name,
            awayTeamName: match.awayTeam.name,
            scoreHome: currentH,
            scoreAway: currentA,
            league: match.league,
            minute: live.liveMinute || undefined,
            timestamp: Date.now()
          });
          break;
        }
      }
      prevScores.set(String(match.id), { home: currentH, away: currentA });
    }
  }, [allMatches, currentTime]);

  // Virtual Bankroll auto-settle & statistics
  const settledSlips = useMemo(() => {
    return evaluateSlipsWithMatches(savedSlips, allMatches);
  }, [savedSlips, allMatches]);

  const bankrollStats = useMemo(() => {
    return calculateBankrollStats(settledSlips);
  }, [settledSlips]);

  const matchAnalysesMap = useMemo(() => {
    const map = new Map<string, MatchAnalysis>();
    allMatches.forEach((match) => {
      map.set(match.id, analyzeMatch(match.homeTeam, match.awayTeam, match.id));
    });
    return map;
  }, [allMatches]);

  // Group matches for League Tree
  const leagueGroups = useMemo(() => {
    return groupMatchesByCountry(allMatches);
  }, [allMatches]);

  // Match counts per popular league tab
  const leagueMatchCounts = useMemo(() => {
    const countsMap: Record<string, number> = {};
    POPULAR_LEAGUES.forEach((pl) => {
      if (pl.id === 'all') {
        countsMap[pl.id] = allMatches.length;
      } else {
        countsMap[pl.id] = allMatches.filter(m => isMatchInLeague(m, pl.id)).length;
      }
    });
    return countsMap;
  }, [allMatches]);

  // 4. Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [selectedLeague, setSelectedLeague] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [sortOption, setSortOption] = useState<SortOption>('time');
  const [activeTabMode, setActiveTabMode] = useState<'upcoming' | 'coupons' | 'finished'>('upcoming');
  const [isMobileLeagueTreeOpen, setIsMobileLeagueTreeOpen] = useState(false);
  const [showRadarDemo, setShowRadarDemo] = useState(false);

  // Modals
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isCustomAnalyzerOpen, setIsCustomAnalyzerOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isStandingsOpen, setIsStandingsOpen] = useState(false);

  // 5. Compute category counts for upcoming matches
  const counts = useMemo(() => {
    let banko = 0;
    let over25 = 0;
    let btts = 0;
    let htft = 0;
    let favCount = 0;
    let valueCount = 0;

    const upcomingMatches = allMatches.filter(m => {
      const state = getMatchLiveState(m, currentTime);
      return state.isUpcoming;
    });

    upcomingMatches.forEach((m) => {
      const a = matchAnalysesMap.get(m.id);
      if (favorites.includes(m.id)) favCount++;
      if (!a) return;
      if (a.primaryPrediction.confidence >= 75 || a.primaryPrediction.badgeType === 'banko') banko++;
      if (a.over25 >= 60) over25++;
      if (a.bttsYes >= 60) btts++;
      if (a.topHtFt[0]?.prob >= 48) htft++;
      if (detectMatchValueBets(m, a).hasValue) valueCount++;
    });

    return {
      all: upcomingMatches.length,
      banko,
      over25,
      btts,
      htft,
      favorites: favCount,
      value: valueCount
    };
  }, [allMatches, currentTime, matchAnalysesMap, favorites]);

  // Dynamic Date Filter Options based on active tab and matches
  const dynamicDateOptions = useMemo(() => {
    return getDynamicDateOptions(allMatches, activeTabMode, currentTime);
  }, [allMatches, activeTabMode, currentTime]);

  // Curated AI Coupons (Banko, İdeal, Sürpriz)
  const curatedCoupons = useMemo(() => {
    return generateCuratedCoupons(allMatches, matchAnalysesMap, currentTime);
  }, [allMatches, matchAnalysesMap, currentTime]);

  // Reset selectedDate if current selected date is not present in active date options
  useEffect(() => {
    if (selectedDate !== 'all') {
      const exists = dynamicDateOptions.some((opt) => opt.id === selectedDate);
      if (!exists) {
        setSelectedDate('all');
      }
    }
  }, [dynamicDateOptions, selectedDate]);

  // 6. Filter function for any match
  const filterMatchItem = (match: Match): boolean => {
    const a = matchAnalysesMap.get(match.id);
    if (!a) return false;

    // A. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchesText =
        match.homeTeam.name.toLowerCase().includes(q) ||
        match.awayTeam.name.toLowerCase().includes(q) ||
        match.league.toLowerCase().includes(q) ||
        (match.country && match.country.toLowerCase().includes(q)) ||
        match.stadium.toLowerCase().includes(q) ||
        (match.iddaaCode && match.iddaaCode.includes(q));
      if (!matchesText) return false;
    }

    // B. League Filter (matches either league name or league category using robust helper)
    if (selectedLeague !== 'all') {
      if (!isMatchInLeague(match, selectedLeague)) {
        return false;
      }
    }

    // C. Date Filter (Dynamic calculation matching actual calendar dates)
    if (selectedDate !== 'all') {
      if (!isMatchOnDateFilter(match, selectedDate, currentTime)) {
        return false;
      }
    }

    // D. Category Filter (applies to upcoming matches)
    const liveState = getMatchLiveState(match, currentTime);
    if (!liveState.isFinished) {
      if (selectedCategory === 'favorites') {
        return favorites.includes(match.id);
      }
      if (selectedCategory === 'value') {
        return detectMatchValueBets(match, a).hasValue;
      }
      if (selectedCategory === 'banko') {
        return a.primaryPrediction.confidence >= 75 || a.primaryPrediction.badgeType === 'banko';
      }
      if (selectedCategory === 'over25') {
        return a.over25 >= 60;
      }
      if (selectedCategory === 'btts') {
        return a.bttsYes >= 60;
      }
      if (selectedCategory === 'htft') {
        return a.topHtFt[0]?.prob >= 48;
      }
    }

    return true;
  };

  // 7. Split into upcoming, live, and finished with sorting (Varsayılan: Başlama Saatine Göre Erkenden Geçe)
  const liveFiltered = useMemo(() => {
    const list = allMatches.filter(m => {
      const liveState = getMatchLiveState(m, currentTime);
      return liveState.isLive && filterMatchItem(m);
    });
    return list.sort((m1, m2) => parseMatchKickoffEpoch(m1) - parseMatchKickoffEpoch(m2));
  }, [allMatches, currentTime, searchQuery, selectedLeague, selectedDate, matchAnalysesMap]);

  const upcomingFiltered = useMemo(() => {
    const list = allMatches.filter(m => {
      const liveState = getMatchLiveState(m, currentTime);
      return liveState.isUpcoming && filterMatchItem(m);
    });

    return list.sort((m1, m2) => {
      if (sortOption === 'time') {
        const t1 = parseMatchKickoffEpoch(m1);
        const t2 = parseMatchKickoffEpoch(m2);
        if (t1 !== t2) return t1 - t2; // Erkenden geçe doğru tam kronolojik sıra
      }
      if (sortOption === 'confidence') {
        const c1 = matchAnalysesMap.get(m1.id)?.primaryPrediction.confidence ?? 0;
        const c2 = matchAnalysesMap.get(m2.id)?.primaryPrediction.confidence ?? 0;
        if (c1 !== c2) return c2 - c1; // En yüksek güvenden en düşüğe
      }
      if (sortOption === 'goals') {
        const g1 = matchAnalysesMap.get(m1.id)?.expectedTotalGoals ?? 0;
        const g2 = matchAnalysesMap.get(m2.id)?.expectedTotalGoals ?? 0;
        if (g1 !== g2) return g2 - g1; // En yüksek xG beklentisinden en düşüğe
      }
      if (sortOption === 'ms1') {
        const p1 = matchAnalysesMap.get(m1.id)?.ms1 ?? 0;
        const p2 = matchAnalysesMap.get(m2.id)?.ms1 ?? 0;
        if (p1 !== p2) return p2 - p1; // En yüksek MS 1 oranından en düşüğe
      }
      // Varsayılan / eşitlik durumunda: Başlama saatine göre erkenden geçe
      return parseMatchKickoffEpoch(m1) - parseMatchKickoffEpoch(m2);
    });
  }, [allMatches, currentTime, searchQuery, selectedLeague, selectedDate, selectedCategory, sortOption, matchAnalysesMap, favorites]);

  const finishedFiltered = useMemo(() => {
    const list = allMatches.filter(m => {
      const liveState = getMatchLiveState(m, currentTime);
      return liveState.isFinished && filterMatchItem(m);
    });
    // En son tamamlanan maçlar en üstte görünsün (kronolojik azalan)
    return list.sort((m1, m2) => parseMatchKickoffEpoch(m2) - parseMatchKickoffEpoch(m1));
  }, [allMatches, currentTime, searchQuery, selectedLeague, selectedDate, matchAnalysesMap]);

  // Live Goal Radar Alerts (Momentum & Pressure detection for in-play matches)
  const liveGoalAlerts = useMemo(() => {
    return detectLiveGoalRadarAlerts(liveFiltered, matchAnalysesMap);
  }, [liveFiltered, matchAnalysesMap]);

  const sampleRadarAlerts = useMemo(() => {
    return getSampleRadarAlerts(allMatches);
  }, [allMatches]);

  const activeRadarAlerts = useMemo(() => {
    if (liveGoalAlerts.length > 0) return liveGoalAlerts;
    if (showRadarDemo) return sampleRadarAlerts;
    return [];
  }, [liveGoalAlerts, showRadarDemo, sampleRadarAlerts]);

  // Günün Vitrin Karşılaşması (Hero Match of the Day) - Kesinlikle Günlük (Bugün veya Önümüzdeki 24 Saat)
  const heroMatch = useMemo(() => {
    if (upcomingFiltered.length === 0) return null;

    const nowEpoch = currentTime.getTime();
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    const THIRTY_SIX_HOURS = 36 * 60 * 60 * 1000;

    // 1. Kademe: Öncelikle BUGÜN (takvim günü veya önümüzdeki 24 saat içinde) başlayacak maçlar
    const todayCandidates = upcomingFiltered.filter(m => {
      const kickoff = parseMatchKickoffEpoch(m);
      const isToday = isMatchOnDateFilter(m, 'today', currentTime);
      const isWithin24h = kickoff >= nowEpoch && kickoff <= nowEpoch + TWENTY_FOUR_HOURS;
      return isToday || isWithin24h;
    });

    if (todayCandidates.length > 0) {
      return [...todayCandidates].sort((a, b) => {
        const aA = matchAnalysesMap.get(a.id);
        const bA = matchAnalysesMap.get(b.id);
        const aConf = aA?.primaryPrediction.confidence || 0;
        const bConf = bA?.primaryPrediction.confidence || 0;
        return bConf - aConf;
      })[0];
    }

    // 2. Kademe: Bugün maç kalmadıysa YARIN (sonraki 36 saat içindeki en yakın maçlar)
    const tomorrowCandidates = upcomingFiltered.filter(m => {
      const kickoff = parseMatchKickoffEpoch(m);
      const isTomorrow = isMatchOnDateFilter(m, 'tomorrow', currentTime);
      const isWithin36h = kickoff >= nowEpoch && kickoff <= nowEpoch + THIRTY_SIX_HOURS;
      return isTomorrow || isWithin36h;
    });

    if (tomorrowCandidates.length > 0) {
      return [...tomorrowCandidates].sort((a, b) => {
        const aA = matchAnalysesMap.get(a.id);
        const bA = matchAnalysesMap.get(b.id);
        const aConf = aA?.primaryPrediction.confidence || 0;
        const bConf = bA?.primaryPrediction.confidence || 0;
        return bConf - aConf;
      })[0];
    }

    // 3. Kademe: Önümüzdeki 36 saatte hiçbir maç yoksa, en erken oynanacak ilk maç günündeki maçlar
    const sortedByTime = [...upcomingFiltered].sort(
      (a, b) => parseMatchKickoffEpoch(a) - parseMatchKickoffEpoch(b)
    );
    const earliestKickoff = parseMatchKickoffEpoch(sortedByTime[0]);
    const earliestBatch = sortedByTime.filter(
      m => Math.abs(parseMatchKickoffEpoch(m) - earliestKickoff) <= 12 * 60 * 60 * 1000
    );

    return [...earliestBatch].sort((a, b) => {
      const aA = matchAnalysesMap.get(a.id);
      const bA = matchAnalysesMap.get(b.id);
      const aConf = aA?.primaryPrediction.confidence || 0;
      const bConf = bA?.primaryPrediction.confidence || 0;
      return bConf - aConf;
    })[0] || null;
  }, [upcomingFiltered, matchAnalysesMap, currentTime]);

  const heroAnalysis = heroMatch ? matchAnalysesMap.get(heroMatch.id) || null : null;
  const isHeroInBetslip = useMemo(() => {
    if (!heroMatch) return false;
    return betslipItems.some(it => it.matchId === heroMatch.id);
  }, [heroMatch, betslipItems]);

  const activeAnalysis = selectedMatch ? matchAnalysesMap.get(selectedMatch.id) || null : null;
  const isSearching = searchQuery.trim().length > 0;

  // Format last updated text
  const lastUpdatedDisplay = useMemo(() => {
    if (!lastUpdatedAt) return 'Canlı';
    try {
      const d = new Date(lastUpdatedAt);
      return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    } catch {
      return 'Canlı';
    }
  }, [lastUpdatedAt]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-20 md:pb-12">

      {/* Toast Notification */}
      {refreshToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 bg-emerald-500 text-slate-950 px-4 py-2.5 rounded-2xl font-bold text-xs shadow-2xl animate-bounce">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{refreshToast}</span>
        </div>
      )}

      {/* Top Header with Live Refresh Trigger & Mobile Install */}
      <Header
        onGoHome={() => {
          setActiveTabMode('upcoming');
          setSelectedCategory('all');
          setSearchQuery('');
        }}
        onOpenCustomAnalyzer={() => setIsCustomAnalyzerOpen(true)}
        onOpenStandings={() => setIsStandingsOpen(true)}
        onOpenCoupons={() => setActiveTabMode('coupons')}
        onOpenInstallApp={() => setIsInstallModalOpen(true)}
        onOpenAIChat={() => setIsAIChatOpen(true)}
        onRefreshLiveBulletin={handleRefreshBulletin}
        isRefreshing={isRefreshing}
        lastUpdatedText={lastUpdatedDisplay}
        totalMatches={totalMatches}
        isInstallable={isInstallable}
        activeTabMode={activeTabMode}
        hasNewUpdate={newVersionAvailable}
        onUpdateApp={handleUpdateApp}
        betslipCount={betslipItems.length}
        onOpenBetslip={() => setIsBetslipOpen(true)}
        onOpenBankroll={() => setIsBankrollModalOpen(true)}
        bankrollBalance={bankrollStats.currentBalance}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />

      {/* Prominent Floating App Update Notification Banner - Fixed Top Position */}
      {newVersionAvailable && (
        <aside
          aria-label="Uygulama Güncellemesi"
          className="fixed top-2 sm:top-4 left-2 right-2 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-xl z-[99999] p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white shadow-2xl shadow-emerald-500/60 border-2 border-emerald-300 ring-4 ring-emerald-500/25 backdrop-blur-xl flex items-center justify-between gap-2.5 animate-bounce"
        >
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-slate-950/80 border border-emerald-400/60 flex items-center justify-center shrink-0 shadow-inner">
              <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-300 animate-ping" />
                <span className="font-black text-xs sm:text-sm tracking-wide text-white drop-shadow">
                  YENİ GÜNCELLEME YAYINDA!
                </span>
              </div>
              <div className="text-[11px] sm:text-xs text-emerald-100 font-medium truncate">
                Yeni özellikler hazır. Tek tıkla yenileyin.
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1.5 shrink-0">
            <button
              onClick={handleUpdateApp}
              className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-slate-950 text-emerald-300 hover:text-emerald-200 font-black text-xs sm:text-sm shadow-xl hover:bg-slate-900 active:scale-95 transition-all cursor-pointer whitespace-nowrap border-2 border-emerald-400 flex items-center space-x-1.5"
            >
              <span>🔄</span>
              <span>Şimdi Güncelle</span>
            </button>
            <button
              onClick={() => setNewVersionAvailable(false)}
              className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-xs font-bold"
              title="Kapat"
            >
              ✕
            </button>
          </div>
        </aside>
      )}

      {/* Main Container with Two Column Responsive Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6">

        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* LEFT COLUMN: League Tree & Bulletin Sidebar */}
          <LeagueTreeSelector
            leagueGroups={leagueGroups}
            selectedLeague={selectedLeague}
            onSelectLeague={(lg) => setSelectedLeague(lg)}
            totalMatches={totalMatches}
            isOpenMobile={isMobileLeagueTreeOpen}
            onCloseMobile={() => setIsMobileLeagueTreeOpen(false)}
          />

          {/* RIGHT COLUMN: Hero Banner, Filters, Match Lists */}
          <div className="flex-1 min-w-0 w-full space-y-4 sm:space-y-6">

            {/* Hero / Highlight Banner */}
            <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/60 border border-slate-800 p-4 sm:p-7 overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-5 items-center">

                <div className="lg:col-span-8 space-y-1.5 sm:space-y-3">
                  <div className="inline-flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    <Radio className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400 animate-pulse" />
                    <span>Canlı İddaa Bülteni ({totalMatches} Karşılaşma)</span>
                  </div>

                  <h1 className="text-base sm:text-3xl font-black text-white tracking-tight">
                    Tüm Dünya Ligleri <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">Yapay Zeka Analizinde</span>
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed hidden sm:block">
                    Süper Lig, Premier Lig, La Liga, Serie A, Bundesliga, Şampiyonlar Ligi ve tüm dünya bülteni açık spor uç noktalarından canlı çekilir.
                    <strong className="text-emerald-400"> Bahis veya kupon oynatmaz;</strong> Poisson ve xG olasılıklarını hesaplar.
                  </p>
                </div>

                <div className="lg:col-span-4 grid grid-cols-2 gap-1.5 sm:gap-2 text-center">
                  <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-slate-950/60 border border-slate-800 backdrop-blur-sm">
                    <div className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-semibold">Tüm Ligler</div>
                    <div className="text-sm sm:text-lg font-black text-emerald-400 font-mono mt-0.5">{totalMatches} Maç</div>
                    <div className="text-[9px] sm:text-[10px] text-slate-500">20+ Lig Yayında</div>
                  </div>

                  <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-slate-950/60 border border-slate-800 backdrop-blur-sm">
                    <div className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-semibold">Günün Bankoları</div>
                    <div className="text-sm sm:text-lg font-black text-amber-400 font-mono mt-0.5">{counts.banko} Maç</div>
                    <div className="text-[9px] sm:text-[10px] text-slate-500">+%75 Güven</div>
                  </div>

                  <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-slate-950/60 border border-slate-800 backdrop-blur-sm">
                    <div className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-semibold">2.5 Üst Trendi</div>
                    <div className="text-sm sm:text-lg font-black text-purple-400 font-mono mt-0.5">{counts.over25} Maç</div>
                    <div className="text-[9px] sm:text-[10px] text-slate-500">Yüksek Tempolu</div>
                  </div>

                  <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-slate-950/60 border border-slate-800 backdrop-blur-sm">
                    <div className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-semibold">KG Var Adayları</div>
                    <div className="text-sm sm:text-lg font-black text-cyan-400 font-mono mt-0.5">{counts.btts} Maç</div>
                    <div className="text-[9px] sm:text-[10px] text-slate-500">Karşılıklı Gol</div>
                  </div>
                </div>

              </div>
            </div>

            {/* Filters, Search & Date Controls */}
            <Filters
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              selectedLeague={selectedLeague}
              setSelectedLeague={setSelectedLeague}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              sortOption={sortOption}
              setSortOption={setSortOption}
              onOpenMobileLeagueTree={() => setIsMobileLeagueTreeOpen(true)}
              leagueMatchCounts={leagueMatchCounts}
              dateOptions={dynamicDateOptions}
              counts={counts}
            />

            {/* CANLI GOL RADARI & ANLIK MOMENTUM TAKİP KONSOLU (ALWAYS VISIBLE & INTERACTIVE) */}
            <div className="my-3.5 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900 to-slate-950 border border-slate-800 p-3.5 sm:p-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <span className="relative flex h-3.5 w-3.5 shrink-0">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      liveGoalAlerts.length > 0 ? 'bg-rose-400' : 'bg-emerald-400'
                    }`}></span>
                    <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${
                      liveGoalAlerts.length > 0 ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}></span>
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-white flex items-center space-x-1.5">
                        <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                        <span>Canlı Gol Radarı & Momentum Takibi</span>
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                        liveGoalAlerts.length > 0
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                          : liveFiltered.length > 0
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {liveGoalAlerts.length > 0
                          ? `🔥 ${liveGoalAlerts.length} Maçta Kritik Baskı!`
                          : liveFiltered.length > 0
                          ? `📡 ${liveFiltered.length} Canlı Maç Taranıyor`
                          : '⚡ 7/24 Otomatik Tarama Devrede'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {liveGoalAlerts.length > 0
                        ? 'Oynanan maçlarda xG ve dakika baskısı (60-88\' / 35-45\') tavan yaptı! Yakın gol sinyali üretildi.'
                        : liveFiltered.length > 0
                        ? `Şu anda ${liveFiltered.length} canlı maç taranıyor. 35'-45' ve 60'-88' pencerelerinde gol alarmı tetiklenecektir.`
                        : 'Devam eden canlı maçlarda xG ve dakika baskısı oluştuğunda sistem anlık kritik gol alarmları üretir.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowRadarDemo(!showRadarDemo)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      showRadarDemo
                        ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                        : 'bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700'
                    }`}
                    title="Canlı gol radarı uyarısının maç anında nasıl göründüğünü test edin"
                  >
                    <Flame className={`w-3.5 h-3.5 ${showRadarDemo ? 'text-slate-950' : 'text-amber-400'}`} />
                    <span>{showRadarDemo ? 'Örnek Alarmı Kapat' : '⚡ Örnek Alarmı Gör'}</span>
                  </button>
                </div>
              </div>

              {/* ACTIVE ALERTS OR DEMO ALERTS GRID */}
              {activeRadarAlerts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-3 mt-3 border-t border-slate-800/80 animate-fadeIn">
                  {activeRadarAlerts.map((alert) => (
                    <div
                      key={alert.match.id}
                      onClick={() => setSelectedMatch(alert.match)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer hover:scale-[1.01] ${
                        alert.urgency === 'critical'
                          ? 'bg-rose-950/30 border-rose-500/50 hover:border-rose-400 shadow-md shadow-rose-950/40'
                          : 'bg-amber-950/30 border-amber-500/40 hover:border-amber-300 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                              alert.urgency === 'critical'
                                ? 'bg-rose-500 text-slate-950 font-black animate-pulse'
                                : 'bg-amber-400 text-slate-950 font-black'
                            }`}
                          >
                            {alert.title}
                          </span>
                          <span className="font-mono text-xs font-bold text-rose-300">
                            {alert.minuteText}
                          </span>
                          {showRadarDemo && liveGoalAlerts.length === 0 && (
                            <span className="text-[9px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.2 rounded">
                              Simülasyon
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] text-slate-400">Gol Beklentisi:</span>
                          <span className="font-mono font-black text-amber-300 text-xs bg-slate-900 px-1.5 py-0.5 rounded border border-amber-500/30">
                            %{alert.goalProbability}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2 font-bold text-xs sm:text-sm text-white">
                        <div className="truncate pr-2">
                          {alert.match.homeTeam.name} vs {alert.match.awayTeam.name}
                        </div>
                        <div className="font-mono font-black text-amber-400 shrink-0 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                          {alert.currentScoreText}
                        </div>
                      </div>

                      <div className="mt-1.5 text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                        {alert.reason}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mode Switcher when NOT searching: "Oynanacak Maçlar", "Canlı Maçlar", "Haftanın Biten Maçları" */}
            {!isSearching && (
              <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setActiveTabMode('upcoming')}
                    className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${activeTabMode === 'upcoming'
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 shadow-sm'
                        : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                  >
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <span>Başlamış & Oynanacak Maçlar</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
                      {liveFiltered.length + upcomingFiltered.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTabMode('coupons')}
                    className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${activeTabMode === 'coupons'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm shadow-amber-950/30'
                        : 'bg-slate-900/60 text-slate-400 hover:text-amber-300 border border-slate-800'
                      }`}
                  >
                    <Flame className={`w-4 h-4 ${activeTabMode === 'coupons' ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
                    <span>Günün Kuponları (Banko • İdeal • Sürpriz)</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${activeTabMode === 'coupons'
                        ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-800 text-slate-400'
                      }`}>
                      3
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTabMode('finished')}
                    className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${activeTabMode === 'finished'
                        ? 'bg-slate-800 text-slate-100 border border-slate-600 shadow-sm'
                        : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                  >
                    <CalendarCheck className="w-4 h-4 text-slate-400" />
                    <span>Haftanın Tamamlanan Maçları</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
                      {finishedFiltered.length}
                    </span>
                  </button>
                </div>

                <div className="flex items-center space-x-3">
                  {activeTabMode === 'upcoming' && (
                    <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 p-0.5 rounded-xl shadow-inner">
                      <button
                        type="button"
                        onClick={() => handleSetViewMode('bulletin')}
                        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${viewMode === 'bulletin'
                            ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                            : 'text-slate-400 hover:text-white'
                          }`}
                        title="Nesine.com Tarzı Sade Bülten Görünümü"
                      >
                        <LayoutList className="w-3.5 h-3.5" />
                        <span>Bülten (Nesine)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetViewMode('cards')}
                        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${viewMode === 'cards'
                            ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                            : 'text-slate-400 hover:text-white'
                          }`}
                        title="Detaylı Kart Görünümü"
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Kartlar</span>
                      </button>
                    </div>
                  )}

                  <div className="text-xs text-slate-500 hidden sm:block font-mono">
                    {activeTabMode === 'upcoming'
                      ? `${upcomingFiltered.length + liveFiltered.length} Analiz & Maç`
                      : activeTabMode === 'coupons'
                        ? '3 Özel Kupon'
                        : `${finishedFiltered.length} Sonuç`}
                  </div>
                </div>
              </div>
            )}

            {/* SEARCH MODE: Shows all categories clearly separated if searching */}
            {isSearching ? (
              <div className="space-y-8">
                {/* Search Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center space-x-2 text-sm text-slate-300 font-bold">
                    <Search className="w-4 h-4 text-emerald-400" />
                    <span>Arama Sonuçları: "{searchQuery}"</span>
                  </div>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    Aramayı Temizle
                  </button>
                </div>

                {/* Search Live Matches */}
                {liveFiltered.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-xs font-bold text-rose-400 uppercase tracking-wider">
                      <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                      <span>Canlı Devam Eden Karşılaşmalar ({liveFiltered.length})</span>
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                      {liveFiltered?.map((match) => (
                        <FinishedMatchCard key={match.id} match={match} now={currentTime} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Search Upcoming Matches */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Oynanacak Maçlar ({upcomingFiltered.length})</span>
                  </div>

                  {upcomingFiltered.length > 0 ? (
                    viewMode === 'bulletin' ? (
                      <NesineBulletinView
                        matches={upcomingFiltered}
                        matchAnalysesMap={matchAnalysesMap}
                        onSelectMatch={(m) => setSelectedMatch(m)}
                        favorites={favorites}
                        onToggleFavorite={toggleFavorite}
                        betslipItems={betslipItems}
                        onToggleBetslip={handleToggleBetslip}
                        sortOption={sortOption}
                      />
                    ) : (
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3.5">
                        {upcomingFiltered?.map((match) => {
                          const analysis = matchAnalysesMap.get(match.id);
                          if (!analysis) return null;
                          return (
                            <MatchCard
                              key={match.id}
                              match={match}
                              analysis={analysis}
                              onSelect={(m) => setSelectedMatch(m)}
                              isFavorite={favorites.includes(match.id)}
                              onToggleFavorite={toggleFavorite}
                            />
                          );
                        })}
                      </div>
                    )
                  ) : (
                    <div className="p-6 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 text-xs text-slate-500">
                      Oynanacak maç bulunamadı.
                    </div>
                  )}
                </div>

                {/* Search Finished Matches */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Haftanın Tamamlanan Maç Sonuçları ({finishedFiltered.length})</span>
                  </div>

                  {finishedFiltered.length > 0 ? (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                      {finishedFiltered?.map((match) => (
                        <FinishedMatchCard key={match.id} match={match} now={currentTime} />
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 text-xs text-slate-500">
                      Tamamlanan maç bulunamadı.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* TABBED MODE (Standard non-search view) */
              <div>
                {/* TAB 1: OYNANACAK MAÇLAR */}
                {activeTabMode === 'upcoming' && (
                  <div>
                    {/* EN ÜSTTE BAŞLAMIŞ / CANLI MAÇLAR BÖLÜMÜ (SAAT SIRASINA GÖRE) */}
                    {liveFiltered.length > 0 && (
                      <div className="space-y-3 mb-6 p-4 rounded-2xl bg-gradient-to-r from-rose-950/40 via-slate-900/80 to-slate-950 border border-rose-500/40 shadow-xl animate-fadeIn">
                        <div className="flex items-center justify-between pb-2 border-b border-rose-500/20">
                          <div className="flex items-center space-x-2.5">
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                            </span>
                            <span className="text-xs font-black uppercase tracking-wider text-rose-300 flex items-center space-x-1.5">
                              <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                              <span>Başlamış / Canlı Devam Eden Karşılaşmalar ({liveFiltered.length})</span>
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                            Canlı Skor & Dakika • Başlama Saatine Göre Sıralı
                          </span>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3.5">
                          {liveFiltered.map((match) => (
                            <div
                              key={match.id}
                              onClick={() => setSelectedMatch(match)}
                              className="cursor-pointer transform hover:scale-[1.01] transition-all"
                            >
                              <FinishedMatchCard match={match} now={currentTime} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* GÜNÜN VİTRİN KARŞILAŞMASI (HERO SHOWCASE BANNER) */}
                    {heroMatch && heroAnalysis && (
                      <div className="mb-4">
                        <MatchOfTheDayBanner
                          match={heroMatch}
                          analysis={heroAnalysis}
                          onSelectMatch={(m) => setSelectedMatch(m)}
                          onAddToBetslip={handleToggleBetslip}
                          isAlreadyInBetslip={isHeroInBetslip}
                        />
                      </div>
                    )}

                    {/* OYNANACAK MAÇLAR LİSTESİ (BAŞLAMA SAATİNE GÖRE ERKENDEN GEÇE SIRALI) */}
                    {upcomingFiltered.length > 0 && liveFiltered.length > 0 && (
                      <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                          <Clock className="w-4 h-4" />
                          <span>Sıradaki Oynanacak Karşılaşmalar ({upcomingFiltered.length})</span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">Erkenden Geçe Sıralı</span>
                      </div>
                    )}

                    {upcomingFiltered.length > 0 ? (
                      viewMode === 'bulletin' ? (
                        <NesineBulletinView
                          matches={upcomingFiltered}
                          matchAnalysesMap={matchAnalysesMap}
                          onSelectMatch={(m) => setSelectedMatch(m)}
                          favorites={favorites}
                          onToggleFavorite={toggleFavorite}
                          betslipItems={betslipItems}
                          onToggleBetslip={handleToggleBetslip}
                          sortOption={sortOption}
                        />
                      ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3.5">
                          {upcomingFiltered?.map((match) => {
                            const analysis = matchAnalysesMap.get(match.id);
                            if (!analysis) return null;
                            return (
                              <MatchCard
                                key={match.id}
                                match={match}
                                analysis={analysis}
                                onSelect={(m) => setSelectedMatch(m)}
                                isFavorite={favorites.includes(match.id)}
                                onToggleFavorite={toggleFavorite}
                              />
                            );
                          })}
                        </div>
                      )
                    ) : liveFiltered.length === 0 ? (
                      <div className="p-12 text-center rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
                        <Trophy className="w-10 h-10 text-slate-600 mx-auto" />
                        <h4 className="text-base font-bold text-slate-200">
                          {totalMatches === 0 ? 'Canlı bülten yükleniyor veya maç bulunamadı' : 'Bu Kriterlere Uygun Oynanacak Maç Bulunamadı'}
                        </h4>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                          {totalMatches === 0
                            ? 'Canlı bülten verisi henüz gelmedi veya sunucuya bağlanılamadı. Yenile butonuna tıklayarak verileri tekrar çekebilirsiniz.'
                            : 'Filtrelerinizi gevşeterek veya soldaki lig menüsünden "Tüm Ligler" seçeneğine tıklayarak bülteni görüntüleyebilirsiniz.'}
                        </p>
                        <div className="flex items-center justify-center gap-3 pt-2">
                          {totalMatches === 0 ? (
                            <button
                              onClick={handleRefreshBulletin}
                              disabled={isRefreshing}
                              className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold hover:bg-emerald-500/30 transition-colors cursor-pointer"
                            >
                              {isRefreshing ? 'Yenileniyor...' : 'Verileri Yenile'}
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedLeague('all');
                                setSelectedCategory('all');
                                setSelectedDate('all');
                                setSearchQuery('');
                              }}
                              className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-500/20 transition-colors cursor-pointer"
                            >
                              Tüm Filtreleri Sıfırla
                            </button>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* TAB: GÜNÜN KUPONLARI (BANKO, İDEAL, SÜRPRİZ) */}
                {activeTabMode === 'coupons' && (
                  <CouponsSection
                    coupons={curatedCoupons}
                    allMatches={allMatches}
                    analysesMap={matchAnalysesMap}
                    currentTime={currentTime}
                    onSelectMatch={(m) => setSelectedMatch(m)}
                    onViewAllMatches={() => setActiveTabMode('upcoming')}
                  />
                )}

                {/* TAB 3: HAFTANIN TAMAMLANAN MAÇLARI (+ BAŞLAMIŞ CANLI MAÇLAR EN ÜSTTE) */}
                {activeTabMode === 'finished' && (
                  <div className="space-y-6">
                    {/* Live Matches Highlight at top if any match is in progress */}
                    {liveFiltered.length > 0 && (
                      <div className="space-y-3 p-4 rounded-3xl bg-rose-950/20 border border-rose-500/30">
                        <div className="flex items-center space-x-2 text-rose-400 font-extrabold text-xs uppercase tracking-wider">
                          <Radio className="w-4 h-4 animate-pulse text-rose-500" />
                          <span>Başlamış Canlı Karşılaşmalar ({liveFiltered.length})</span>
                        </div>
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                          {liveFiltered?.map((match) => (
                            <FinishedMatchCard key={match.id} match={match} now={currentTime} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Finished Matches List */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-slate-400 font-extrabold text-xs uppercase tracking-wider pb-1 border-b border-slate-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Haftanın Tamamlanan Maç Sonuçları ({finishedFiltered.length})</span>
                      </div>

                      {finishedFiltered.length > 0 ? (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                          {finishedFiltered?.map((match) => (
                            <FinishedMatchCard key={match.id} match={match} now={currentTime} />
                          ))}
                        </div>
                      ) : (
                        <div className="p-10 text-center rounded-3xl bg-slate-900/60 border border-slate-800">
                          <CalendarCheck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                          <h4 className="text-sm font-bold text-slate-300">Tamamlanan Maç Bulunamadı</h4>
                          <p className="text-xs text-slate-500 mt-1">Seçilen lig veya filtre için tamamlanmış sonuç bulunamadı.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

      </main>

      {/* Modal 1: Detailed Match Analysis Modal */}
      {selectedMatch && activeAnalysis && (
        <MatchDetailModal
          match={selectedMatch}
          analysis={activeAnalysis}
          onClose={() => setSelectedMatch(null)}
          betslipItems={betslipItems}
          onToggleBetslip={handleToggleBetslip}
          onOpenBetslip={() => setIsBetslipOpen(true)}
        />
      )}

      {/* Modal 2: Custom Match Analyzer (Kendi Maçını Analiz Et - Yalnızca Oynanacak Maçlar) */}
      <CustomMatchAnalyzer
        isOpen={isCustomAnalyzerOpen}
        onClose={() => setIsCustomAnalyzerOpen(false)}
        matches={allMatches.filter(m => {
          if (m.status === 'finished') return false;
          if (m.time === 'MS' || m.time === 'Bitti' || m.time === 'FT') return false;
          const s = getMatchLiveState(m, currentTime);
          return !s.isFinished;
        })}
        onSelectMatchDetail={(match) => {
          setSelectedMatch(match);
          setIsCustomAnalyzerOpen(false);
        }}
      />

      {/* Modal 3: Standings Modal (Süper Lig & Tüm Ligler Puan Durumu) */}
      {isStandingsOpen && (
        <StandingsModal
          isOpen={isStandingsOpen}
          onClose={() => setIsStandingsOpen(false)}
        />
      )}

      {/* Modal 4: Mobile & PWA Install Guide Modal (Telefona İndir & Kur) */}
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        deferredPrompt={deferredPrompt}
        onDirectInstall={handleDirectInstall}
      />

      {/* Modal 5: Interactive AI Chatbot & Smart Coupon Generator */}
      <AIChatModal
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        allMatches={weeklyMatches}
        analysesMap={matchAnalysesMap}
        currentTime={currentTime}
        onSelectMatch={(m) => setSelectedMatch(m)}
      />

      {/* Modal 6: Kupon Hesaplayıcı & Betslip Drawer */}
      <BetslipDrawer
        items={betslipItems}
        isOpen={isBetslipOpen}
        onOpen={() => setIsBetslipOpen(true)}
        onClose={() => setIsBetslipOpen(false)}
        onRemoveItem={handleRemoveBetslipItem}
        onClearAll={handleClearBetslip}
        onConsultAI={handleConsultAIFromSlip}
        onSaveToBankroll={(items, stake, totalOdds) => {
          saveNewSlip(items, stake, totalOdds);
          setSavedSlips(getSavedSlips());
        }}
      />

      {/* Modal 7: Sanal Kasa & Kupon Takip Sistemi */}
      <BankrollTrackerModal
        isOpen={isBankrollModalOpen}
        onClose={() => setIsBankrollModalOpen(false)}
        slips={settledSlips}
        stats={bankrollStats}
        onRefreshSlips={() => setSavedSlips(getSavedSlips())}
      />

      {/* Canlı Gol Sesi & Bildirim Kartı */}
      <GoalNotificationToast
        goal={activeGoalToast}
        onClose={() => setActiveGoalToast(null)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />

      {/* Floating AI Kupon Robotu FAB Button (Always Accessible on Mobile & Desktop) */}
      <button
        onClick={() => setIsAIChatOpen(true)}
        className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center space-x-2 px-3.5 py-3 sm:px-4 sm:py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-600 text-white font-black text-xs sm:text-sm shadow-2xl shadow-purple-500/40 hover:shadow-purple-500/70 border-2 border-purple-300/50 active:scale-95 transition-all cursor-pointer group hover:scale-105"
        title="Yapay Zeka Sohbet & Kupon Robotu"
      >
        <div className="relative">
          <Bot className="w-5 h-5 text-amber-300 animate-pulse group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
          </span>
        </div>
        <span className="font-extrabold tracking-tight">AI Kupon Robotu</span>
        <Sparkles className="w-4 h-4 text-amber-300 fill-current opacity-80 hidden sm:inline" />
      </button>



      {/* Footer */}
      <footer className="mt-16 border-t border-slate-800/80 bg-slate-950 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <div className="flex items-center justify-center space-x-2 text-slate-300 font-bold text-sm">
            <BrainCircuit className="w-4 h-4 text-emerald-400" />
            <span>ProAnaliz AI • Otomatik İddaa Bülteni & Olasılık Platformu</span>
          </div>
          <p className="text-xs text-slate-500 max-w-xl mx-auto">
            Bu uygulama hiçbir şekilde bahis oynatmaz, kupon oluşturmaz veya aracılık etmez. Tüm oran ve yüzdeler Poisson dağılımı, Dixon-Coles düzeltmesi ve ağırlıklı form matrisi ile üretilmiş saf matematiksel istatistiklerdir.
          </p>
          <div className="text-[11px] text-slate-600">
            © 2026 ProAnaliz AI • Canlı API Veri Entegrasyonu (ESPN / TheSportsDB)
          </div>
        </div>
      </footer>

    </div>
  );
};

export default App;

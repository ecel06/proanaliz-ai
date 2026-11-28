// src/App.tsx
// ProAnaliz AI - Complete Live Multi-League Football Analytics App

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Match, MatchAnalysis, UserBetslipItem } from './types';
import { analyzeMatch } from './utils/predictionEngine';
import { BettingPickOption } from './utils/oddsHelper';
import { Header } from './components/Header';
import { Filters, CategoryFilter, SortOption } from './components/Filters';
import { matchMatchesCategory } from './utils/categoryFilterHelper';
import { LeagueTreeSelector } from './components/LeagueTreeSelector';
import { MatchCard } from './components/MatchCard';
import { FinishedMatchCard } from './components/FinishedMatchCard';
import { MatchDetailModal } from './components/MatchDetailModal';
import { BetslipDrawer } from './components/BetslipDrawer';
import { MatchOfTheDayBanner } from './components/MatchOfTheDayBanner';
import { AITripleComboCard } from './components/AITripleComboCard';
import { GoalNotificationToast, LiveGoalEvent } from './components/GoalNotificationToast';
import { AuthModal } from './components/AuthModal';
import { HomeHub } from './components/HomeHub';
import { MobileBottomNav } from './components/MobileBottomNav';
import { DraggableAIFab } from './components/DraggableAIFab';
import { WelcomeSplash } from './components/WelcomeSplash';
import { User, getStoredUser, clearAuthSession, fetchCurrentUser, SiteAnnouncement, fetchAnnouncementApi, fetchUserFullAppSyncApi, saveUserFullAppSyncApi } from './utils/authHelper';
import { computeAIPerformance } from './utils/aiPerformanceHelper';
import type { AIChatCoupon, AICouponItem } from './utils/aiChatEngine';

// Code-Splitting: Heavy views and modals loaded on-demand via React.lazy
const HorseRacingView = React.lazy(() => import('./components/horse/HorseRacingView').then(m => ({ default: m.HorseRacingView })));
const StockMarketView = React.lazy(() => import('./components/stocks/StockMarketView').then(m => ({ default: m.StockMarketView })));
const AdminModal = React.lazy(() => import('./components/AdminModal').then(m => ({ default: m.AdminModal })));
const ProfileModal = React.lazy(() => import('./components/ProfileModal').then(m => ({ default: m.ProfileModal })));
const VIPModal = React.lazy(() => import('./components/VIPModal').then(m => ({ default: m.VIPModal })));
const CustomMatchAnalyzer = React.lazy(() => import('./components/CustomMatchAnalyzer').then(m => ({ default: m.CustomMatchAnalyzer })));
const StandingsModal = React.lazy(() => import('./components/StandingsModal').then(m => ({ default: m.StandingsModal })));
const InstallAppModal = React.lazy(() => import('./components/InstallAppModal').then(m => ({ default: m.InstallAppModal })));
const OnboardingModal = React.lazy(() => import('./components/OnboardingModal').then(m => ({ default: m.OnboardingModal })));
const AIChatModal = React.lazy(() => import('./components/AIChatModal').then(m => ({ default: m.AIChatModal })));
const BankrollTrackerModal = React.lazy(() => import('./components/BankrollTrackerModal').then(m => ({ default: m.BankrollTrackerModal })));
const ThemeSelectorModal = React.lazy(() => import('./components/ThemeSelectorModal').then(m => ({ default: m.ThemeSelectorModal })));
const AIPerformanceModal = React.lazy(() => import('./components/AIPerformanceModal').then(m => ({ default: m.AIPerformanceModal })));
const ShareSlipModal = React.lazy(() => import('./components/ShareSlipModal').then(m => ({ default: m.ShareSlipModal })));
const ShareAppModal = React.lazy(() => import('./components/ShareAppModal').then(m => ({ default: m.ShareAppModal })));
const NesineBulletinView = React.lazy(() => import('./components/NesineBulletinView').then(m => ({ default: m.NesineBulletinView })));
const FeedbackModal = React.lazy(() => import('./components/FeedbackModal').then(m => ({ default: m.FeedbackModal })));
const LiveTVModal = React.lazy(() => import('./components/LiveTVModal').then(m => ({ default: m.LiveTVModal })));
const LiveGoldModal = React.lazy(() => import('./components/stocks/LiveGoldModal').then(m => ({ default: m.LiveGoldModal })));
const AdminAICoPilotModal = React.lazy(() => import('./components/AdminAICoPilotModal').then(m => ({ default: m.AdminAICoPilotModal })));

const SectionLoadingFallback: React.FC<{ label?: string }> = ({ label = 'Modül Yükleniyor...' }) => (
  <div className="flex flex-col items-center justify-center p-12 min-h-[320px] space-y-3">
    <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin" />
    <span className="text-xs font-bold text-slate-400 tracking-wide">{label}</span>
  </div>
);
import {
  isPushNotificationSupported,
  isPushNotificationEnabled,
  requestPushNotificationPermission,
  setPushNotificationEnabled,
  sendNativePushNotification
} from './utils/pushNotificationHelper';
import {
  TeamTheme,
  getStoredTheme,
  saveStoredTheme,
  applyThemeToDOM,
  removeThemeFromDOM
} from './utils/themeHelper';
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
  LayoutGrid,
  X
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
  const [isAllLiveExpanded, setIsAllLiveExpanded] = useState(false);

  // User Betslip (Kullanıcı Kuponu & Hesaplayıcı)
  const [betslipItems, setBetslipItems] = useState<UserBetslipItem[]>(() => {
    try {
      const saved = localStorage.getItem('proanaliz_betslip_items');
      if (saved) return JSON.parse(saved);
    } catch { }
    return [];
  });
  const [isBetslipOpen, setIsBetslipOpen] = useState(false);

  // Automatically persist betslip changes to survive pull-to-refresh & app restarts
  useEffect(() => {
    try {
      localStorage.setItem('proanaliz_betslip_items', JSON.stringify(betslipItems));
    } catch { }
  }, [betslipItems]);

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

  // 1-Click Curated Coupon to Betslip Integration
  const handleAddCuratedCouponToBetslip = (coupon: any) => {
    const newItems: UserBetslipItem[] = [];
    coupon.items.forEach((item: any) => {
      const match = allMatches.find((m) => String(m.id) === String(item.matchId));
      if (match) {
        newItems.push({
          id: `${match.id}_${item.pickKey}`,
          matchId: match.id,
          match,
          marketName: item.marketName,
          pickKey: item.pickKey,
          pickLabel: item.pickLabel,
          odd: item.odd,
          probability: item.confidence
        });
      }
    });

    if (newItems.length > 0) {
      setBetslipItems(newItems);
      setIsBetslipOpen(true);
      setRefreshToast(`⚡ ${coupon.shortTitle} (${newItems.length} Maç) Kuponunuza Aktarıldı!`);
      setTimeout(() => setRefreshToast(null), 3000);
    }
  };

  const resolveAIMarketName = (pickType: AICouponItem['pickType']): string => {
    if (pickType === 'ms1' || pickType === 'msX' || pickType === 'ms2') return 'Maç Sonucu';
    if (pickType === 'btts') return 'Karşılıklı Gol';
    if (pickType === 'htft') return 'İlk Yarı / Maç Sonucu';
    return 'Toplam Gol';
  };

  const handleAddAICouponToBetslip = (aiCoupon: AIChatCoupon) => {
    const newItems: UserBetslipItem[] = aiCoupon.items.map((item) => ({
      id: `${item.match.id}_${item.pickType}`,
      matchId: item.match.id,
      match: item.match,
      marketName: resolveAIMarketName(item.pickType),
      pickKey: item.pickType,
      pickLabel: item.pickLabel,
      odd: item.odd,
      probability: item.confidence
    }));

    if (newItems.length > 0) {
      setBetslipItems(newItems);
      setIsAIChatOpen(false);
      setIsBetslipOpen(true);
      setRefreshToast(`🤖 ${aiCoupon.title} (${newItems.length} Maç) Kupona Aktarıldı!`);
      setTimeout(() => setRefreshToast(null), 3000);
    }
  };

  const handleAddAIItemToBetslip = (item: AICouponItem) => {
    handleToggleBetslip(item.match, {
      key: item.pickType,
      label: item.pickLabel,
      marketKey: item.pickType,
      marketName: resolveAIMarketName(item.pickType),
      odd: item.odd,
      probability: item.confidence
    });
    setRefreshToast(`✅ ${item.homeTeam} - ${item.awayTeam} (${item.pickLabel}) kuponda güncellendi`);
    setTimeout(() => setRefreshToast(null), 2200);
  };

  const handleAddComboToBetslip = (comboItems: { match: Match; pickOption: BettingPickOption }[]) => {
    comboItems.forEach((item) => {
      const alreadyIn = betslipItems.some((b) => b.matchId === item.match.id && b.pickKey === item.pickOption.key);
      if (!alreadyIn) {
        handleToggleBetslip(item.match, item.pickOption);
      }
    });
    setIsBetslipOpen(true);
    setRefreshToast(`⚡ VIP 3'lü Kombin Kupona Eklendi (${comboItems.length} Maç)`);
    setTimeout(() => setRefreshToast(null), 3000);
  };

  // Virtual Bankroll & Saved Slips State
  const [isBankrollModalOpen, setIsBankrollModalOpen] = useState(false);
  const [savedSlips, setSavedSlips] = useState<SavedSlip[]>(() => getSavedSlips());
  const [bankrollRefreshKey, setBankrollRefreshKey] = useState(0);

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

  // Active Portal Section: Home, Football, Horse Racing, Stocks (persisted across pull-to-refresh & reload)
  const [activeSection, setActiveSection] = useState<'home' | 'football' | 'horseRacing' | 'stocks'>(() => {
    try {
      const saved = localStorage.getItem('proanaliz_active_section');
      if (saved && ['home', 'football', 'horseRacing', 'stocks'].includes(saved)) {
        return saved as 'home' | 'football' | 'horseRacing' | 'stocks';
      }
    } catch { }
    return 'home';
  });

  const handleNavigateSection = (sec: 'home' | 'football' | 'horseRacing' | 'stocks', replace = false) => {
    if (sec === activeSection) return;
    try {
      localStorage.setItem('proanaliz_active_section', sec);
      if (replace) {
        window.history.replaceState({ section: sec }, '', '');
      } else {
        window.history.pushState({ section: sec }, '', '');
      }
    } catch { }
    setActiveSection(sec);
    if (sec === 'football') {
      setActiveTabMode('upcoming');
    }
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    } catch { }
  };

  // Team & Custom Theme State (Active only inside Football; At Yarışı & Borsa stay clean eye-resting dark slate)
  const [activeTheme, setActiveTheme] = useState<TeamTheme>(() => getStoredTheme());
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  useEffect(() => {
    if (activeSection === 'football') {
      applyThemeToDOM(activeTheme);
    } else {
      removeThemeFromDOM();
    }
  }, [activeTheme, activeSection]);

  // Completely hide browser window scrollbar on home page
  useEffect(() => {
    if (activeSection === 'home') {
      document.documentElement.classList.add('no-scrollbar');
      document.body.classList.add('no-scrollbar');
    } else {
      document.documentElement.classList.remove('no-scrollbar');
      document.body.classList.remove('no-scrollbar');
    }
    return () => {
      document.documentElement.classList.remove('no-scrollbar');
      document.body.classList.remove('no-scrollbar');
    };
  }, [activeSection]);

  const handleSelectTheme = (theme: TeamTheme) => {
    setActiveTheme(theme);
    saveStoredTheme(theme);
    if (activeSection === 'football') {
      applyThemeToDOM(theme);
    }
  };

  // User Authentication & VIP Subscription State
  const [currentUser, setCurrentUser] = useState<User | null>(() => getStoredUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isVipModalOpen, setIsVipModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isAdminAICoPilotOpen, setIsAdminAICoPilotOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [siteAnnouncement, setSiteAnnouncement] = useState<SiteAnnouncement | null>(null);

  useEffect(() => {
    fetchCurrentUser().then((u) => {
      if (u) setCurrentUser(u);
    });
    fetchAnnouncementApi().then((res) => {
      if (res?.success && res.announcement) {
        setSiteAnnouncement(res.announcement);
      }
    });
  }, []);

  const handleLogout = () => {
    clearAuthSession();
    setCurrentUser(null);
    setIsProfileModalOpen(false);
  };

  // AI Accuracy Scorecard Modal State
  const [isAIPerformanceOpen, setIsAIPerformanceOpen] = useState(false);
  const [aiPerformanceInitialTab, setAiPerformanceInitialTab] = useState<'overall' | 'football' | 'horse' | 'stocks'>('overall');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isLiveTVModalOpen, setIsLiveTVModalOpen] = useState(false);
  const [isLiveGoldModalOpen, setIsLiveGoldModalOpen] = useState(false);
  const [liveTVTargetMatch, setLiveTVTargetMatch] = useState<Match | null>(null);

  const handleOpenLiveTV = (match?: Match) => {
    setLiveTVTargetMatch(match || null);
    setIsLiveTVModalOpen(true);
  };

  // Section-specific mobile subtabs & actions
  const [horseRacingSubTab, setHorseRacingSubTab] = useState<'bulletin' | 'ai_coupons' | 'ikili_cifte' | 'results' | 'changes'>('bulletin');
  const [horseRacingTarget, setHorseRacingTarget] = useState<{ programId?: number; raceNo?: number; horseNumber?: number; timestamp?: number } | null>(null);
  const [stockExternalAction, setStockExternalAction] = useState<{ action: string; timestamp: number; symbol?: string } | null>(null);

  // Social Coupon Share Modal State
  const [shareSlipCoupon, setShareSlipCoupon] = useState<any | null>(null);

  // Native Web Push & PWA Notification State
  const [isPushEnabled, setIsPushEnabled] = useState<boolean>(() => isPushNotificationEnabled());

  const handleTogglePush = async () => {
    if (isPushEnabled) {
      setPushNotificationEnabled(false);
      setIsPushEnabled(false);
    } else {
      const granted = await requestPushNotificationPermission();
      setIsPushEnabled(granted);
    }
  };

  const [newVersionAvailable, setNewVersionAvailable] = useState(false);
  const [serverVersion, setServerVersion] = useState<string | null>(null);

  // Check for app version updates from server - Ultra-responsive instant detection
  const CLIENT_BUILD_VERSION = '2026.11.20.128';

  // Capture viral referral link if accessed via ?ref=...
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const refParam = params.get('ref');
      if (refParam && refParam.trim()) {
        const cleanRef = refParam.trim().toLowerCase();
        localStorage.setItem('proanaliz_referred_by', cleanRef);
        // Clean URL parameter without reloading
        const newUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, newUrl || '/');
        // If not logged in, proactively open auth modal
        const savedToken = localStorage.getItem('proanaliz_auth_token');
        if (!savedToken) {
          setIsAuthModalOpen(true);
        }
      }
    } catch {
      // ignore
    }
  }, []);
  useEffect(() => {
    const handleSessionExpired = (e: any) => {
      setCurrentUser(null);
      setIsProfileModalOpen(false);
      setIsAuthModalOpen(true);
      if (e.detail?.message) {
        alert(e.detail.message);
      }
    };
    window.addEventListener('proanaliz_session_expired', handleSessionExpired);
    return () => {
      window.removeEventListener('proanaliz_session_expired', handleSessionExpired);
    };
  }, []);
  useEffect(() => {
    const checkVersion = async () => {
      try {
        const res = await fetch(`/api/version?_t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.version && data.version !== CLIENT_BUILD_VERSION) {
            const dismissed = localStorage.getItem('proanaliz_dismissed_version');
            if (dismissed === data.version) {
              setNewVersionAvailable(false);
              return;
            }
            setServerVersion(data.version);
            setNewVersionAvailable(true);
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.ready.then(reg => reg.update()).catch(() => { });
            }
          } else {
            setNewVersionAvailable(false);
          }
        }
      } catch (e) {
        // offline
      }
    };

    // Immediate check on mount
    checkVersion();

    // Efficient 60-second polling while tab is open (checks instantly on tab switch/focus)
    const verTimer = setInterval(checkVersion, 60000);

    // Instant check when user switches back to tab, unlocks device, or reconnects
    const handleActive = () => {
      if (document.visibilityState === 'visible') {
        checkVersion();
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then(reg => reg.update()).catch(() => { });
        }
      }
    };
    document.addEventListener('visibilitychange', handleActive);
    window.addEventListener('focus', handleActive);
    window.addEventListener('online', handleActive);

    return () => {
      clearInterval(verTimer);
      document.removeEventListener('visibilitychange', handleActive);
      window.removeEventListener('focus', handleActive);
      window.removeEventListener('online', handleActive);
    };
  }, []);

  const handleUpdateApp = async () => {
    try {
      localStorage.setItem('proanaliz_active_section', activeSection);
      if (serverVersion) {
        localStorage.setItem('proanaliz_dismissed_version', serverVersion);
      }
    } catch (e) { }

    // 1. Unregister and notify service worker
    if ('serviceWorker' in navigator) {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const reg of regs) {
          if (reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
          await reg.unregister();
        }
      } catch (e) { }
    }
    // 2. Delete all client runtime asset caches so fresh bundle is fetched
    if ('caches' in window) {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      } catch (e) { }
    }
    // 3. Force clean reload bypassing disk cache with timestamp query, preserving active section and session
    window.location.replace(window.location.origin + window.location.pathname + '?_t=' + Date.now());
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

  // Real-time clock tick every 60 seconds to smoothly update live minutes & live match states without CPU thrashing
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Load weekly matches on mount & poll live scores every 45s only when user is inside Football section
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

    // Initial fetch once on load
    fetchMatches();

    // Auto-poll live scores only when in Football section
    if (activeSection === 'football') {
      const livePollInterval = setInterval(fetchMatches, 45000);
      return () => clearInterval(livePollInterval);
    }
  }, [activeSection]);

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

  // ☁️ Tüm Uygulama Bulut Senkronizasyonu (Betslip, Favoriler, Kasa, At Yarışı Kuponları, Kırılım Karnesi, Tema)
  const hasHydratedAppSyncRef = useRef<boolean>(false);
  useEffect(() => {
    if (!currentUser?.id) {
      hasHydratedAppSyncRef.current = false;
      return;
    }
    let mounted = true;
    fetchUserFullAppSyncApi().then((res) => {
      if (!mounted || !res.success || !res.appData) return;
      const d = res.appData;
      const pushPayload: Record<string, any> = {};
      let needsPush = false;

      if (Array.isArray(d.betslipItems) && d.betslipItems.length > 0) {
        setBetslipItems(d.betslipItems);
        try { localStorage.setItem('proanaliz_betslip_items', JSON.stringify(d.betslipItems)); } catch {}
      } else if (betslipItems.length > 0) {
        pushPayload.betslipItems = betslipItems;
        needsPush = true;
      }

      if (Array.isArray(d.favorites) && d.favorites.length > 0) {
        setFavorites(d.favorites);
        try { localStorage.setItem('proanaliz_favorites', JSON.stringify(d.favorites)); } catch {}
      } else if (favorites.length > 0) {
        pushPayload.favorites = favorites;
        needsPush = true;
      }

      try {
        const localSlipsRaw = localStorage.getItem('proanaliz_saved_slips');
        const localSlips = localSlipsRaw ? JSON.parse(localSlipsRaw) : [];
        if (Array.isArray(d.savedSlips) && d.savedSlips.length > 0) {
          localStorage.setItem('proanaliz_saved_slips', JSON.stringify(d.savedSlips));
        } else if (Array.isArray(localSlips) && localSlips.length > 0) {
          pushPayload.savedSlips = localSlips;
          needsPush = true;
        }

        const localInitRaw = localStorage.getItem('proanaliz_initial_bankroll');
        const localInit = localInitRaw ? Number(localInitRaw) : null;
        if (typeof d.initialBankroll === 'number' && d.initialBankroll > 0) {
          localStorage.setItem('proanaliz_initial_bankroll', String(d.initialBankroll));
        } else if (localInit && localInit > 0) {
          pushPayload.initialBankroll = localInit;
          needsPush = true;
        }

        const localHrRaw = localStorage.getItem('proanaliz_hr_coupons');
        const localHr = localHrRaw ? JSON.parse(localHrRaw) : [];
        if (Array.isArray(d.hrCoupons) && d.hrCoupons.length > 0) {
          localStorage.setItem('proanaliz_hr_coupons', JSON.stringify(d.hrCoupons));
        } else if (Array.isArray(localHr) && localHr.length > 0) {
          pushPayload.hrCoupons = localHr;
          needsPush = true;
        }

        const localLedgerRaw = localStorage.getItem('proanaliz_breakout_ledger_v1');
        const localLedger = localLedgerRaw ? JSON.parse(localLedgerRaw) : [];
        if (Array.isArray(d.breakoutLedger) && d.breakoutLedger.length > 0) {
          localStorage.setItem('proanaliz_breakout_ledger_v1', JSON.stringify(d.breakoutLedger));
        } else if (Array.isArray(localLedger) && localLedger.length > 0) {
          pushPayload.breakoutLedger = localLedger;
          needsPush = true;
        }

        const localThemeRaw = localStorage.getItem('proanaliz_active_team_theme');
        if (d.activeTheme) {
          localStorage.setItem('proanaliz_active_team_theme', JSON.stringify(d.activeTheme));
        } else if (localThemeRaw) {
          pushPayload.activeTheme = JSON.parse(localThemeRaw);
          needsPush = true;
        }
      } catch {}

      if (needsPush) {
        saveUserFullAppSyncApi(pushPayload);
      }
      hasHydratedAppSyncRef.current = true;
    });
    return () => { mounted = false; };
  }, [currentUser?.id]);

  // Sync betslip & favorites changes to cloud after hydration
  useEffect(() => {
    if (!currentUser?.id || !hasHydratedAppSyncRef.current) return;
    saveUserFullAppSyncApi({ betslipItems, favorites });
  }, [betslipItems, favorites, currentUser?.id]);

  // 3. Pre-calculate Poisson analyses for all matches in bulletin
  const allMatches: Match[] = weeklyMatches;

  // Clear football goal toast when user leaves Football section
  useEffect(() => {
    if (activeSection !== 'football' && activeGoalToast) {
      setActiveGoalToast(null);
    }
  }, [activeSection, activeGoalToast]);

  // Track previous scores and notified goals for live goal chime & toast notification
  const prevScoresRef = useRef<Map<string, { home: number; away: number }>>(new Map());
  const notifiedGoalsRef = useRef<Set<string>>(new Set());
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
          const goalKey = `${match.id}-${currentH}-${currentA}`;

          // ALWAYS update score in map immediately so it NEVER loops
          prevScores.set(String(match.id), { home: currentH, away: currentA });

          if (!notifiedGoalsRef.current.has(goalKey)) {
            notifiedGoalsRef.current.add(goalKey);
            // ONLY trigger sound, goal toast, and push notification inside the Football section
            if (activeSection === 'football') {
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

              // Send native lockscreen / browser push notification
              sendNativePushNotification(`⚽ GOOOL! ${scoringTeam}`, {
                body: `${match.homeTeam.name} ${currentH} - ${currentA} ${match.awayTeam.name} (${live.liveMinute || 'Canlı'})`,
                tag: `goal-${match.id}`
              });
            }
          }
          if (activeSection === 'football') break;
        }
      }
      prevScores.set(String(match.id), { home: currentH, away: currentA });
    }
  }, [allMatches, currentTime, activeSection]);

  // Virtual Bankroll auto-settle & statistics
  const settledSlips = useMemo(() => {
    return evaluateSlipsWithMatches(savedSlips, allMatches);
  }, [savedSlips, allMatches]);

  const bankrollStats = useMemo(() => {
    return calculateBankrollStats(settledSlips);
  }, [settledSlips, bankrollRefreshKey]);

  const matchAnalysesMap = useMemo(() => {
    const map = new Map<string, MatchAnalysis>();
    allMatches.forEach((match) => {
      map.set(match.id, analyzeMatch(match.homeTeam, match.awayTeam, match.id));
    });
    return map;
  }, [allMatches]);

  // AI Accuracy & Historical Performance Report
  const aiPerformanceReport = useMemo(() => {
    return computeAIPerformance(allMatches, matchAnalysesMap);
  }, [allMatches, matchAnalysesMap]);

  // Synchronize live Football AI context (Top Bankos, Live Scores) for Admin AI Co-Pilot
  useEffect(() => {
    try {
      const upcoming = allMatches.filter((m) => m.status === 'upcoming' || m.status === 'live');
      const topBankos = upcoming
        .map((m) => {
          const an = matchAnalysesMap.get(m.id);
          const home = m.homeTeam?.name || 'Ev Sahibi';
          const away = m.awayTeam?.name || 'Deplasman';
          const pred = an?.primaryPrediction?.label || 'MS 1';
          const conf = an?.primaryPrediction?.confidence ? Math.round(an.primaryPrediction.confidence) : 75;
          return `${home} - ${away} (${m.league || 'Futbol'}) | AI Tahmin: ${pred} (Güven: %${conf})`;
        })
        .slice(0, 6);

      const liveList = allMatches
        .filter((m) => m.status === 'live')
        .map((m) => {
          const score = m.currentScore ? `${m.currentScore.home}-${m.currentScore.away}` : '';
          return `${m.homeTeam?.name} ${score} ${m.awayTeam?.name} (${m.liveMinute || 'Canlı'})`;
        });

      const payload = {
        topBankos,
        liveMatches: liveList,
        totalMatches: allMatches.length,
      };
      (window as any).__PROANALIZ_FOOTBALL_CONTEXT__ = payload;
      localStorage.setItem('proanaliz_football_context', JSON.stringify(payload));
    } catch {}
  }, [allMatches, matchAnalysesMap]);

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
  const [visibleMatchesCount, setVisibleMatchesCount] = useState<number>(36);
  const [visibleFinishedCount, setVisibleFinishedCount] = useState<number>(30);

  // Reset pagination when any filter changes for lightning-fast 60fps rendering
  useEffect(() => {
    setVisibleMatchesCount(36);
    setVisibleFinishedCount(30);
  }, [selectedCategory, selectedLeague, selectedDate, searchQuery, sortOption]);

  // Modals
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isCustomAnalyzerOpen, setIsCustomAnalyzerOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isStandingsOpen, setIsStandingsOpen] = useState(false);

  // Global PopState Listener: Handles hardware back button on Android/iOS
  useEffect(() => {
    try {
      if (!window.history.state) {
        window.history.replaceState({ section: activeSection }, '', '');
      }
    } catch { }

    const handleGlobalPopState = (e: PopStateEvent) => {
      // 0. If on stocks and stock internal view or modal state is active, let stock view handle it without closing or changing section
      if (activeSection === 'stocks') {
        const isStockModalOrDetail =
          e.state?.view === 'detail' ||
          document.querySelector('[id^="stock-modal-"]') !== null ||
          document.body.classList.contains('stock-modal-open');
        if (isStockModalOrDetail) {
          return;
        }
      }

      // 1. If mobile league drawer is open, close it first
      if (isMobileLeagueTreeOpen) { setIsMobileLeagueTreeOpen(false); return; }

      // 2. If any overlay modal or selected match detail is open, close it first
      if (selectedMatch) { setSelectedMatch(null); return; }
      if (isFeedbackModalOpen) { setIsFeedbackModalOpen(false); return; }
      if (isLiveTVModalOpen) {
        setIsLiveTVModalOpen(false);
        setLiveTVTargetMatch(null);
        return;
      }
      if (isAuthModalOpen) { setIsAuthModalOpen(false); return; }
      if (isProfileModalOpen) { setIsProfileModalOpen(false); return; }
      if (isVipModalOpen) { setIsVipModalOpen(false); return; }
      if (isAdminModalOpen) { setIsAdminModalOpen(false); return; }
      if (isAdminAICoPilotOpen) { setIsAdminAICoPilotOpen(false); return; }
      if (isOnboardingOpen) { setIsOnboardingOpen(false); return; }
      if (isInstallModalOpen) { setIsInstallModalOpen(false); return; }
      if (isCustomAnalyzerOpen) { setIsCustomAnalyzerOpen(false); return; }
      if (isStandingsOpen) { setIsStandingsOpen(false); return; }
      if (isInfoModalOpen) { setIsInfoModalOpen(false); return; }
      if (isAIPerformanceOpen) { setIsAIPerformanceOpen(false); return; }
      if (isShareModalOpen) { setIsShareModalOpen(false); return; }
      if (isAIChatOpen) { setIsAIChatOpen(false); return; }
      if (isBetslipOpen) { setIsBetslipOpen(false); return; }
      if (isBankrollModalOpen) { setIsBankrollModalOpen(false); return; }
      if (isThemeModalOpen) { setIsThemeModalOpen(false); return; }

      // 2. Section navigation via history
      const targetSection = e.state?.section;
      if (targetSection && ['home', 'football', 'horseRacing', 'stocks'].includes(targetSection)) {
        setActiveSection(targetSection);
        try { localStorage.setItem('proanaliz_active_section', targetSection); } catch { }
        if (targetSection === 'football') {
          setActiveTabMode('upcoming');
        }
      } else {
        // Fallback to home instead of closing app or leaving blank
        setActiveSection('home');
        try { localStorage.setItem('proanaliz_active_section', 'home'); } catch { }
      }
    };

    window.addEventListener('popstate', handleGlobalPopState);
    return () => window.removeEventListener('popstate', handleGlobalPopState);
  }, [
    activeSection,
    selectedMatch,
    isFeedbackModalOpen,
    isLiveTVModalOpen,
    isAuthModalOpen,
    isProfileModalOpen,
    isVipModalOpen,
    isAdminModalOpen,
    isAdminAICoPilotOpen,
    isOnboardingOpen,
    isInstallModalOpen,
    isCustomAnalyzerOpen,
    isStandingsOpen,
    isInfoModalOpen,
    isAIPerformanceOpen,
    isShareModalOpen,
    isAIChatOpen,
    isBetslipOpen,
    isBankrollModalOpen,
    isThemeModalOpen,
    isMobileLeagueTreeOpen,
  ]);

  // 5. Compute category counts for active bulletin matches
  const counts = useMemo(() => {
    let banko = 0;
    let over25 = 0;
    let btts = 0;
    let htft = 0;
    let favCount = 0;
    let valueCount = 0;

    const activeMatches = allMatches.filter(m => {
      const state = getMatchLiveState(m, currentTime);
      return !state.isFinished;
    });

    activeMatches.forEach((m) => {
      const a = matchAnalysesMap.get(m.id);
      if (favorites.includes(m.id)) favCount++;
      if (!a) return;
      if (matchMatchesCategory(m, a, 'banko', favorites)) banko++;
      if (matchMatchesCategory(m, a, 'over25', favorites)) over25++;
      if (matchMatchesCategory(m, a, 'btts', favorites)) btts++;
      if (matchMatchesCategory(m, a, 'htft', favorites)) htft++;
      if (matchMatchesCategory(m, a, 'value', favorites)) valueCount++;
    });

    return {
      all: activeMatches.length,
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
  const normalizeSearchStr = (val: string): string =>
    String(val || '')
      .replace(/İ/g, 'i')
      .replace(/I/g, 'ı')
      .toLowerCase()
      .replace(/\u0307/g, '')
      .replace(/ç/g, 'c')
      .replace(/ğ/g, 'g')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ş/g, 's')
      .replace(/ü/g, 'u')
      .replace(/ø/g, 'o')
      .replace(/æ/g, 'ae')
      .replace(/å/g, 'a')
      .replace(/[áàâãä]/g, 'a')
      .replace(/[éèêë]/g, 'e')
      .replace(/[íìîï]/g, 'i')
      .replace(/[óòôõ]/g, 'o')
      .replace(/[úùû]/g, 'u')
      .replace(/ñ/g, 'n')
      .replace(/\s+/g, ' ')
      .trim();

  const SEARCH_ALIASES: Record<string, string[]> = {
    turkiye: ['turkey', 'turkiye'],
    turkey: ['turkiye', 'turkey'],
    belcika: ['belgium', 'belcika'],
    belgium: ['belcika', 'belgium'],
    fransa: ['france', 'fransa'],
    france: ['fransa', 'france'],
    almanya: ['germany', 'almanya'],
    germany: ['almanya', 'germany'],
    ispanya: ['spain', 'ispanya'],
    spain: ['ispanya', 'spain'],
    italya: ['italy', 'italya'],
    italy: ['italya', 'italy'],
    ingiltere: ['england', 'ingiltere'],
    england: ['ingiltere', 'england'],
    hollanda: ['netherlands', 'holland', 'hollanda'],
    portekiz: ['portugal', 'portekiz'],
    hirvatistan: ['croatia', 'hirvatistan'],
    isvicre: ['switzerland', 'isvicre'],
    avusturya: ['austria', 'avusturya'],
    polonya: ['poland', 'polonya'],
    ukrayna: ['ukraine', 'ukrayna'],
    danimarka: ['denmark', 'danimarka'],
    norvec: ['norway', 'norvec'],
    isvec: ['sweden', 'isvec'],
    iskocya: ['scotland', 'iskocya'],
    galler: ['wales', 'galler'],
    irlanda: ['ireland', 'irlanda'],
    yunanistan: ['greece', 'yunanistan'],
    macaristan: ['hungary', 'macaristan'],
    cekya: ['czechia', 'czech republic', 'cekya'],
    sirbistan: ['serbia', 'sirbistan'],
    romanya: ['romania', 'romanya'],
    brezilya: ['brazil', 'brezilya'],
    arjantin: ['argentina', 'arjantin'],
    fas: ['morocco', 'fas'],
    misir: ['egypt', 'misir'],
    japonya: ['japan', 'japonya'],
    abd: ['usa', 'united states', 'abd']
  };

  const filterMatchItem = (match: Match): boolean => {
    const a = matchAnalysesMap.get(match.id);
    if (!a) return false;

    // A. Search Query (Global search: bypasses league/date/category filters so any match in the bulletin is found)
    if (searchQuery.trim()) {
      const q = normalizeSearchStr(searchQuery);
      const qVariants = SEARCH_ALIASES[q] ? [q, ...SEARCH_ALIASES[q]] : [q];
      const searchableText = normalizeSearchStr(
        [
          match.homeTeam.name,
          match.awayTeam.name,
          (match as any).searchAlias || '',
          match.league,
          match.country || '',
          match.stadium,
          match.iddaaCode || ''
        ].join(' ')
      );
      return qVariants.some(variant => searchableText.includes(variant));
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

    // D. Category Filter (uses unified matchMatchesCategory for 100% mathematical consistency)
    if (selectedCategory !== 'all') {
      if (!matchMatchesCategory(match, a, selectedCategory, favorites)) {
        return false;
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
  }, [allMatches, currentTime, searchQuery, selectedLeague, selectedDate, selectedCategory, matchAnalysesMap, favorites]);

  const upcomingFiltered = useMemo(() => {
    const list = allMatches.filter(m => {
      const liveState = getMatchLiveState(m, currentTime);
      return liveState.isUpcoming && filterMatchItem(m);
    });

    return list.sort((m1, m2) => {
      if (sortOption === 'time') {
        // Category priority: When user filters by a specific category, show the strongest candidates at the top
        if (selectedCategory === 'btts') {
          const b1 = matchAnalysesMap.get(m1.id)?.bttsYes ?? 0;
          const b2 = matchAnalysesMap.get(m2.id)?.bttsYes ?? 0;
          if (b1 !== b2) return b2 - b1;
        } else if (selectedCategory === 'over25') {
          const o1 = matchAnalysesMap.get(m1.id)?.over25 ?? 0;
          const o2 = matchAnalysesMap.get(m2.id)?.over25 ?? 0;
          if (o1 !== o2) return o2 - o1;
        } else if (selectedCategory === 'banko') {
          const c1 = matchAnalysesMap.get(m1.id)?.primaryPrediction.confidence ?? 0;
          const c2 = matchAnalysesMap.get(m2.id)?.primaryPrediction.confidence ?? 0;
          if (c1 !== c2) return c2 - c1;
        }
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
  }, [allMatches, currentTime, searchQuery, selectedLeague, selectedDate, selectedCategory, matchAnalysesMap, favorites]);

  // Progressive view slice for smooth 60fps DOM performance
  const displayedUpcoming = useMemo(() => {
    return upcomingFiltered.slice(0, visibleMatchesCount);
  }, [upcomingFiltered, visibleMatchesCount]);

  const displayedFinished = useMemo(() => {
    return finishedFiltered.slice(0, visibleFinishedCount);
  }, [finishedFiltered, visibleFinishedCount]);

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

  if (activeSection === 'home') {
    return (
      <div
        className="min-h-[100dvh] w-full overflow-y-auto flex flex-col bg-slate-950 scrollbar-none pb-16 sm:pb-0"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <WelcomeSplash userName={currentUser?.name} />
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
                  {serverVersion ? `Sürüm ${serverVersion} hazır.` : 'Yeni özellikler hazır.'} Tek tıkla yenileyin.
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

        {/* Site-Wide Announcement Bar (Home Hub - Compact) */}
        {siteAnnouncement?.enabled && siteAnnouncement.text && (
          <div className={`w-full py-1.5 px-3 shrink-0 text-center text-xs font-black flex items-center justify-center gap-2 border-b z-40 transition-colors ${siteAnnouncement.variant === 'emerald' ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40' :
            siteAnnouncement.variant === 'rose' ? 'bg-rose-500/20 text-rose-200 border-rose-500/40' :
              siteAnnouncement.variant === 'blue' ? 'bg-blue-500/20 text-blue-200 border-blue-500/40' :
                'bg-gradient-to-r from-amber-500/25 via-amber-400/20 to-amber-500/25 text-amber-200 border-amber-400/40'
            }`}>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-white/20 text-white shrink-0">
              DUYURU
            </span>
            <span className="truncate">{siteAnnouncement.text}</span>
            {siteAnnouncement.link && (
              <a
                href={siteAnnouncement.link}
                target={siteAnnouncement.link.startsWith('http') ? '_blank' : '_self'}
                rel="noopener noreferrer"
                className="text-[11px] underline font-black hover:text-white shrink-0 ml-1"
              >
                İncele →
              </a>
            )}
          </div>
        )}

        <HomeHub
          onSelectFootball={(match) => {
            handleNavigateSection('football');
            if (match) setSelectedMatch(match);
          }}
          onSelectHorseRacing={(target) => {
            handleNavigateSection('horseRacing');
            if (target) setHorseRacingTarget({ ...target, timestamp: Date.now() });
          }}
          onSelectStocks={(target) => {
            handleNavigateSection('stocks');
            if (target === 'gold') {
              setStockExternalAction({ action: 'gold', timestamp: Date.now() });
            } else if (target) {
              setStockExternalAction({ action: 'select_symbol', symbol: target, timestamp: Date.now() });
            }
          }}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        onOpenLiveGoldModal={() => setIsLiveGoldModalOpen(true)}
        onOpenVIP={() => setIsVipModalOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
        onOpenAdminAICoPilot={() => setIsAdminAICoPilotOpen(true)}
        onOpenAIPerformance={() => {
          setAiPerformanceInitialTab('overall');
          setIsAIPerformanceOpen(true);
        }}
        onOpenShare={() => setIsShareModalOpen(true)}
        onLogout={handleLogout}
        user={currentUser}
        allMatches={weeklyMatches}
        analysesMap={matchAnalysesMap}
        aiPerformanceReport={aiPerformanceReport}
        />

        {/* Modal: Kullanıcı Giriş & Kayıt Penceresi (Ana Sayfa İçin) */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={(u) => {
            setCurrentUser(u);
            setIsAuthModalOpen(false);
            if (u.role !== 'admin' && !u.preferredInterest) {
              setIsOnboardingOpen(true);
            }
          }}
        />

        {/* Lazy Loaded On-Demand Modals (Home Hub) */}
        <React.Suspense fallback={null}>
          {isInstallModalOpen && (
            <InstallAppModal
              isOpen={isInstallModalOpen}
              onClose={() => setIsInstallModalOpen(false)}
              deferredPrompt={deferredPrompt}
              onDirectInstall={handleDirectInstall}
            />
          )}

          {isProfileModalOpen && (
            <ProfileModal
              isOpen={isProfileModalOpen}
              onClose={() => setIsProfileModalOpen(false)}
              user={currentUser}
              onUserUpdated={setCurrentUser}
              onOpenVIP={() => {
                setIsProfileModalOpen(false);
                setIsVipModalOpen(true);
              }}
              onLogout={handleLogout}
            />
          )}

          {isOnboardingOpen && (
            <OnboardingModal
              isOpen={isOnboardingOpen}
              onClose={() => setIsOnboardingOpen(false)}
              user={currentUser}
              onSelectInterest={(interest) => {
                if (interest === 'football') handleNavigateSection('football');
                else if (interest === 'horses') handleNavigateSection('horseRacing');
                else if (interest === 'stocks') handleNavigateSection('stocks');
              }}
            />
          )}

          {isVipModalOpen && (
            <VIPModal
              isOpen={isVipModalOpen}
              onClose={() => setIsVipModalOpen(false)}
              user={currentUser}
              onOpenAuth={() => {
                setIsVipModalOpen(false);
                setIsAuthModalOpen(true);
              }}
              onUserUpdated={(u) => {
                setCurrentUser(u);
              }}
            />
          )}

          {isAdminModalOpen && (
            <AdminModal
              isOpen={isAdminModalOpen}
              onClose={() => setIsAdminModalOpen(false)}
              currentUser={currentUser}
              onRefreshBulletin={handleRefreshBulletin}
              allMatches={allMatches}
              onOpenAdminAICoPilot={() => setIsAdminAICoPilotOpen(true)}
            />
          )}

          {isAdminAICoPilotOpen && (
            <AdminAICoPilotModal
              isOpen={isAdminAICoPilotOpen}
              onClose={() => setIsAdminAICoPilotOpen(false)}
              currentUser={currentUser}
              clientContext={{
                bist: (() => {
                  try {
                    const saved = localStorage.getItem('proanaliz_bist_context');
                    if (saved) return JSON.parse(saved);
                  } catch {}
                  return (window as any).__PROANALIZ_BIST_CONTEXT__ || {};
                })(),
              }}
              onShowToast={(msg) => {
                setRefreshToast(msg);
                setTimeout(() => setRefreshToast(null), 3500);
              }}
            />
          )}

          {isLiveGoldModalOpen && (
            <LiveGoldModal
              isOpen={isLiveGoldModalOpen}
              onClose={() => setIsLiveGoldModalOpen(false)}
            />
          )}

          {isAIPerformanceOpen && (
            <AIPerformanceModal
              isOpen={isAIPerformanceOpen}
              onClose={() => setIsAIPerformanceOpen(false)}
              report={aiPerformanceReport}
              initialTab={aiPerformanceInitialTab}
            />
          )}

          {isThemeModalOpen && (
            <ThemeSelectorModal
              isOpen={isThemeModalOpen}
              onClose={() => setIsThemeModalOpen(false)}
              activeTheme={activeTheme}
              onSelectTheme={handleSelectTheme}
            />
          )}

          {isShareModalOpen && (
            <ShareAppModal
              isOpen={isShareModalOpen}
              onClose={() => setIsShareModalOpen(false)}
              user={currentUser}
              onOpenAuth={() => setIsAuthModalOpen(true)}
            />
          )}
        </React.Suspense>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen text-slate-100 flex flex-col pb-20 md:pb-12 transition-colors duration-300 w-full overflow-x-clip max-w-[100vw]"
      style={{
        backgroundColor: activeSection === 'football' ? (activeTheme?.bgDark || '#0b0f19') : '#020617'
      }}
    >
      <WelcomeSplash userName={currentUser?.name} />

      {/* Toast Notification */}
      {refreshToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 bg-emerald-500 text-slate-950 px-4 py-2.5 rounded-2xl font-bold text-xs shadow-2xl animate-bounce">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{refreshToast}</span>
        </div>
      )}

      {/* Site-Wide Announcement Bar */}
      {siteAnnouncement?.enabled && siteAnnouncement.text && (
        <div className={`w-full py-2 px-3 text-center text-xs font-black flex items-center justify-center gap-2 border-b z-40 transition-colors ${siteAnnouncement.variant === 'emerald' ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40' :
          siteAnnouncement.variant === 'rose' ? 'bg-rose-500/20 text-rose-200 border-rose-500/40' :
            siteAnnouncement.variant === 'blue' ? 'bg-blue-500/20 text-blue-200 border-blue-500/40' :
              'bg-gradient-to-r from-amber-500/25 via-amber-400/20 to-amber-500/25 text-amber-200 border-amber-400/40'
          }`}>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-white/20 text-white shrink-0">
            DUYURU
          </span>
          <span className="truncate">{siteAnnouncement.text}</span>
          {siteAnnouncement.link && (
            <a
              href={siteAnnouncement.link}
              target={siteAnnouncement.link.startsWith('http') ? '_blank' : '_self'}
              rel="noopener noreferrer"
              className="text-[11px] underline font-black hover:text-white shrink-0 ml-1"
            >
              İncele →
            </a>
          )}
        </div>
      )}

      {/* Top Header with Live Refresh Trigger & Mobile Install */}
      <Header
        user={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenVIP={() => setIsVipModalOpen(true)}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
        onOpenAdminAICoPilot={() => setIsAdminAICoPilotOpen(true)}
        onLogout={handleLogout}
        onGoHome={() => {
          handleNavigateSection('home');
        }}
        activeSection={activeSection}
        onSelectSection={(sec) => {
          handleNavigateSection(sec);
        }}
        onOpenCustomAnalyzer={() => setIsCustomAnalyzerOpen(true)}
        onOpenStandings={() => setIsStandingsOpen(true)}
        onOpenAIPerformance={() => {
          setAiPerformanceInitialTab(
            activeSection === 'horseRacing' ? 'horse' : activeSection === 'stocks' ? 'stocks' : 'football'
          );
          setIsAIPerformanceOpen(true);
        }}
        onOpenShare={() => setIsShareModalOpen(true)}
        onOpenCoupons={() => setActiveTabMode('coupons')}
        onOpenInstallApp={() => setIsInstallModalOpen(true)}
        onOpenAIChat={() => setIsAIChatOpen(true)}
        onOpenLiveTV={() => handleOpenLiveTV()}
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
        isPushEnabled={isPushEnabled}
        onTogglePush={handleTogglePush}
        activeTheme={activeTheme}
        onOpenThemeModal={() => setIsThemeModalOpen(true)}
        onOpenFeedback={() => setIsFeedbackModalOpen(true)}
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

        {activeSection === 'horseRacing' ? (
          <React.Suspense fallback={<SectionLoadingFallback label="TJK Canlı At Yarışı Bülteni Yükleniyor..." />}>
            <HorseRacingView
              user={currentUser}
              onOpenVIP={() => setIsVipModalOpen(true)}
              onShowToast={(msg: string) => {
                setRefreshToast(msg);
                setTimeout(() => setRefreshToast(null), 3500);
              }}
              activeSubTab={horseRacingSubTab}
              onChangeSubTab={setHorseRacingSubTab}
              initialTarget={horseRacingTarget}
            />
          </React.Suspense>
        ) : activeSection === 'stocks' ? (
          <React.Suspense fallback={<SectionLoadingFallback label="Borsa İstanbul & Global Piyasa Verileri Yükleniyor..." />}>
            <StockMarketView
              user={currentUser}
              onOpenVIP={() => setIsVipModalOpen(true)}
              onShowToast={(msg) => {
                setRefreshToast(msg);
                setTimeout(() => setRefreshToast(null), 3500);
              }}
              onGoHome={() => handleNavigateSection('home')}
              externalAction={stockExternalAction}
            />
          </React.Suspense>
        ) : (
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

            {/* RIGHT COLUMN: Filters & Live Match Bülteni */}
            <div className="flex-1 min-w-0 w-full space-y-3 sm:space-y-4">

              {/* Filters, Search & Date Controls (Top-Level Clean Access) */}
              <Filters
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedCategory={selectedCategory}
                setSelectedCategory={(cat) => {
                  setSelectedCategory(cat);
                  if (activeTabMode !== 'upcoming') {
                    setActiveTabMode('upcoming');
                  }
                }}
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

              {/* CANLI GOL RADARI & ANLIK MOMENTUM (Displayed when there is active critical pressure) */}
              {(activeRadarAlerts.length > 0 || showRadarDemo) && (
                <div className="my-2.5 rounded-2xl bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-950 border border-rose-500/40 p-3 sm:p-3.5 shadow-xl animate-fadeIn">
                  <div className="flex items-center justify-between pb-2 border-b border-rose-500/20">
                    <div className="flex items-center space-x-2">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
                      </span>
                      <span className="text-xs sm:text-sm font-black uppercase text-white flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                        <span>Canlı Gol Radarı &amp; Momentum Baskısı</span>
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        {activeRadarAlerts.length} Maçta Kritik Baskı
                      </span>
                    </div>
                    {showRadarDemo && (
                      <button
                        type="button"
                        onClick={() => setShowRadarDemo(false)}
                        className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 cursor-pointer"
                      >
                        Kapat
                      </button>
                    )}
                  </div>

                  {/* ACTIVE ALERTS GRID */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2.5">
                    {activeRadarAlerts.map((alert) => (
                      <div
                        key={alert.match.id}
                        onClick={() => setSelectedMatch(alert.match)}
                        className="p-3 rounded-xl border border-rose-500/50 hover:border-rose-400 bg-rose-950/30 transition-all cursor-pointer hover:scale-[1.01]"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1.5">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-500 text-slate-950">
                              {alert.title}
                            </span>
                            <span className="font-mono text-xs font-bold text-rose-300">
                              {alert.minuteText}
                            </span>
                          </div>
                          <span className="font-mono font-black text-amber-300 text-xs bg-slate-900 px-1.5 py-0.5 rounded border border-amber-500/30">
                            Gol Beklentisi: %{alert.goalProbability}
                          </span>
                        </div>

                        <div className="flex items-center justify-between mt-2 font-bold text-xs sm:text-sm text-white">
                          <div className="truncate pr-2">
                            {alert.match.homeTeam.name} vs {alert.match.awayTeam.name}
                          </div>
                          <div className="font-mono font-black text-amber-400 shrink-0 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                            {alert.currentScoreText}
                          </div>
                        </div>

                        <div className="mt-1 text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                          {alert.reason}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mode Switcher when NOT searching: "Günün Maçları", "Günün Kuponları", "Biten Maçlar" */}
              {!isSearching && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-2.5 gap-2">
                  <div className="grid grid-cols-3 gap-1 sm:flex sm:items-center sm:gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => {
                        setActiveTabMode('upcoming');
                        setSelectedDate('all');
                        setSelectedCategory('all');
                      }}
                      className={`flex items-center justify-center space-x-1 sm:space-x-2 px-2 py-2 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer min-w-0 ${activeTabMode === 'upcoming'
                        ? 'bg-emerald-600 text-slate-950 font-black border-2 border-emerald-300 shadow-md shadow-emerald-950/40'
                        : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                    >
                      <Clock className={`w-3.5 sm:w-4 h-3.5 sm:h-4 shrink-0 ${activeTabMode === 'upcoming' ? 'text-slate-950 stroke-[2.5]' : 'text-emerald-400'}`} />
                      <span className="hidden sm:inline">Günün Maçları</span>
                      <span className="sm:hidden truncate">Maçlar</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold shrink-0 ${activeTabMode === 'upcoming'
                        ? 'bg-emerald-950 text-emerald-200 border border-emerald-400/40'
                        : 'bg-slate-800 text-slate-300'
                        }`}>
                        {liveFiltered.length + upcomingFiltered.length}
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTabMode('coupons');
                        setSelectedDate('all');
                        setSelectedCategory('all');
                      }}
                      className={`flex items-center justify-center space-x-1 sm:space-x-2 px-2 py-2 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer min-w-0 ${activeTabMode === 'coupons'
                        ? 'bg-amber-500 text-slate-950 font-black border-2 border-amber-300 shadow-md shadow-amber-950/40'
                        : 'bg-slate-900/60 text-slate-400 hover:text-amber-300 border border-slate-800'
                        }`}
                    >
                      <Flame className={`w-3.5 sm:w-4 h-3.5 sm:h-4 shrink-0 ${activeTabMode === 'coupons' ? 'text-slate-950 stroke-[2.5] animate-pulse' : 'text-amber-400'}`} />
                      <span className="hidden sm:inline">Günün Kuponları</span>
                      <span className="sm:hidden truncate">Kuponlar</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold shrink-0 ${activeTabMode === 'coupons'
                        ? 'bg-amber-950 text-amber-200 border border-amber-400/40'
                        : 'bg-amber-400 text-slate-950 font-black'
                        }`}>
                        3
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTabMode('finished');
                        setSelectedDate('all');
                        setSelectedCategory('all');
                      }}
                      className={`flex items-center justify-center space-x-1 sm:space-x-2 px-2 py-2 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer min-w-0 ${activeTabMode === 'finished'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black border-2 border-blue-300 shadow-lg shadow-blue-900/40'
                        : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                    >
                      <CalendarCheck className={`w-3.5 sm:w-4 h-3.5 sm:h-4 shrink-0 ${activeTabMode === 'finished' ? 'text-white stroke-[2.5]' : 'text-slate-400'}`} />
                      <span className="hidden sm:inline">Biten Maçlar</span>
                      <span className="sm:hidden truncate">Bitenler</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold shrink-0 ${activeTabMode === 'finished'
                        ? 'bg-blue-950 text-blue-200 border border-blue-400/50'
                        : 'bg-slate-800 text-slate-300'
                        }`}>
                        {finishedFiltered.length}
                      </span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                    {activeTabMode === 'upcoming' && (
                      <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 p-0.5 rounded-xl shadow-inner">
                        <button
                          type="button"
                          onClick={() => handleSetViewMode('bulletin')}
                          className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${viewMode === 'bulletin'
                            ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                            : 'text-slate-400 hover:text-white'
                            }`}
                          title="Resmi İddaa Bülteni Liste Görünümü"
                        >
                          <LayoutList className="w-3.5 h-3.5" />
                          <span>İddaa Bülteni</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetViewMode('cards')}
                          className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${viewMode === 'cards'
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
                          <FinishedMatchCard
                            key={match.id}
                            match={match}
                            now={currentTime}
                            analysis={matchAnalysesMap.get(match.id)}
                            onOpenLiveTV={handleOpenLiveTV}
                          />
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
                        <React.Suspense fallback={<SectionLoadingFallback label="Geniş Bülten Tablosu Hazırlanıyor..." />}>
                          <NesineBulletinView
                            matches={upcomingFiltered}
                            matchAnalysesMap={matchAnalysesMap}
                            onSelectMatch={(m) => setSelectedMatch(m)}
                            favorites={favorites}
                            onToggleFavorite={toggleFavorite}
                            betslipItems={betslipItems}
                            onToggleBetslip={handleToggleBetslip}
                            sortOption={sortOption}
                            selectedCategory={selectedCategory}
                            onOpenLiveTV={(m) => {
                              setLiveTVTargetMatch(m);
                              setIsLiveTVModalOpen(true);
                            }}
                          />
                        </React.Suspense>
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
                                onOpenLiveTV={handleOpenLiveTV}
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
                          <FinishedMatchCard
                            key={match.id}
                            match={match}
                            now={currentTime}
                            analysis={matchAnalysesMap.get(match.id)}
                            onOpenLiveTV={handleOpenLiveTV}
                          />
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
                            {(isAllLiveExpanded ? liveFiltered : liveFiltered.slice(0, 4)).map((match) => (
                              <div
                                key={match.id}
                                onClick={() => setSelectedMatch(match)}
                                className="cursor-pointer transform hover:scale-[1.01] transition-all"
                              >
                                <FinishedMatchCard
                                  match={match}
                                  now={currentTime}
                                  analysis={matchAnalysesMap.get(match.id)}
                                  onOpenLiveTV={handleOpenLiveTV}
                                />
                              </div>
                            ))}
                          </div>

                          {liveFiltered.length > 4 && (
                            <div className="pt-2 text-center border-t border-rose-500/20">
                              <button
                                type="button"
                                onClick={() => setIsAllLiveExpanded(!isAllLiveExpanded)}
                                className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-rose-300 text-xs font-black border border-rose-500/30 transition-all cursor-pointer shadow-sm"
                              >
                                {isAllLiveExpanded ? '▲ Daha Az Göster (İlk 4 Maç)' : `▼ Tüm Canlı Maçları Göster (+${liveFiltered.length - 4} Maç)`}
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* GÜNÜN VİTRİN KARŞILAŞMASI (HERO SHOWCASE BANNER - Yalnızca Tüm Maçlar Seçiliyken) */}
                      {heroMatch && heroAnalysis && selectedCategory === 'all' && (
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

                      {/* 🏆 GÜNÜN PROANALİZ VIP SÜPER 3'LÜ AI KOMBİNİ */}
                      {selectedCategory === 'all' && allMatches.length >= 3 && (
                        <AITripleComboCard
                          matches={allMatches}
                          analyses={matchAnalysesMap}
                          onSelectMatch={(m) => setSelectedMatch(m)}
                          onAddComboToBetslip={handleAddComboToBetslip}
                          betslipItems={betslipItems}
                        />
                      )}

                      {/* AKTİF KATEGORİ FİLTRESİ BAŞLIK ŞERİDİ (Filtrelenen Sonuçlar) */}
                      {selectedCategory !== 'all' && (
                        <div className="flex items-center justify-between p-3 mb-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-slate-900 to-slate-900 border border-emerald-500/40 text-xs shadow-lg animate-fadeIn">
                          <div className="flex items-center space-x-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="font-semibold text-slate-400">Aktif Kategori:</span>
                            <span className="font-black text-white flex items-center space-x-1">
                              <span>
                                {selectedCategory === 'value' && '🎯 Değer Bahisleri'}
                                {selectedCategory === 'banko' && '🔥 Bankolar (+%70)'}
                                {selectedCategory === 'over25' && '⚡ 2.5 Gol Üst'}
                                {selectedCategory === 'btts' && '✨ KG Var'}
                                {selectedCategory === 'htft' && '🛡️ İY/MS Sürpriz'}
                                {selectedCategory === 'favorites' && '⭐ Favoriler'}
                              </span>
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 ml-1">
                              {upcomingFiltered.length + liveFiltered.length} Karşılaşma
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedCategory('all')}
                            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                          >
                            <span>Tüm Maçları Göster</span>
                            <X className="w-3.5 h-3.5" />
                          </button>
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
                          <React.Suspense fallback={<SectionLoadingFallback label="Geniş Bülten Tablosu Hazırlanıyor..." />}>
                            <NesineBulletinView
                              matches={upcomingFiltered}
                              matchAnalysesMap={matchAnalysesMap}
                              onSelectMatch={(m) => setSelectedMatch(m)}
                              favorites={favorites}
                              onToggleFavorite={toggleFavorite}
                              betslipItems={betslipItems}
                              onToggleBetslip={handleToggleBetslip}
                              sortOption={sortOption}
                              selectedCategory={selectedCategory}
                              onOpenLiveTV={(m) => {
                                setLiveTVTargetMatch(m);
                                setIsLiveTVModalOpen(true);
                              }}
                            />
                          </React.Suspense>
                        ) : (
                          <>
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3.5">
                              {displayedUpcoming.map((match) => {
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
                                    onOpenLiveTV={handleOpenLiveTV}
                                  />
                                );
                              })}
                            </div>

                            {upcomingFiltered.length > displayedUpcoming.length && (
                              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                                <button
                                  type="button"
                                  onClick={() => setVisibleMatchesCount((prev) => prev + 36)}
                                  className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-slate-900 border border-slate-700 hover:border-emerald-500/50 hover:bg-slate-800 text-white font-black text-xs shadow-lg active:scale-95 transition-all cursor-pointer flex items-center justify-center space-x-2"
                                >
                                  <span>Daha Fazla Maç Göster (+36)</span>
                                  <span className="text-[10px] font-mono text-emerald-400 font-bold">
                                    ({displayedUpcoming.length} / {upcomingFiltered.length})
                                  </span>
                                </button>
                                {upcomingFiltered.length > displayedUpcoming.length + 36 && (
                                  <button
                                    type="button"
                                    onClick={() => setVisibleMatchesCount(upcomingFiltered.length)}
                                    className="text-xs text-slate-400 hover:text-white underline cursor-pointer py-1"
                                  >
                                    Tümünü Göster ({upcomingFiltered.length})
                                  </button>
                                )}
                              </div>
                            )}
                          </>
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
                      user={currentUser}
                      onOpenVIP={() => setIsVipModalOpen(true)}
                      onSelectMatch={(m) => setSelectedMatch(m)}
                      onViewAllMatches={() => setActiveTabMode('upcoming')}
                      onAddCouponToBetslip={handleAddCuratedCouponToBetslip}
                      onShareCoupon={(coupon) => setShareSlipCoupon(coupon)}
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
                              <FinishedMatchCard
                                key={match.id}
                                match={match}
                                now={currentTime}
                                analysis={matchAnalysesMap.get(match.id)}
                                onOpenLiveTV={handleOpenLiveTV}
                              />
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
                          <>
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                              {displayedFinished.map((match) => (
                                <FinishedMatchCard
                                  key={match.id}
                                  match={match}
                                  now={currentTime}
                                  analysis={matchAnalysesMap.get(match.id)}
                                  onOpenLiveTV={handleOpenLiveTV}
                                />
                              ))}
                            </div>

                            {finishedFiltered.length > displayedFinished.length && (
                              <div className="pt-3 flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() => setVisibleFinishedCount((prev) => prev + 30)}
                                  className="px-5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center space-x-2"
                                >
                                  <span>Daha Fazla Sonuç Göster (+30)</span>
                                  <span className="text-[10px] font-mono text-slate-400">
                                    ({displayedFinished.length} / {finishedFiltered.length})
                                  </span>
                                </button>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="p-10 text-center rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
                            <CalendarCheck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                            <h4 className="text-sm font-bold text-slate-300">Bu Filtrede Tamamlanan Maç Bulunamadı</h4>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto">
                              Seçilen lig veya tarih filtresinde tamamlanmış maç yok. Tüm ligler ve günlerdeki bitmiş maçları görmek için filtreleri sıfırlayabilirsiniz.
                            </p>
                            <button
                              onClick={() => {
                                setSelectedLeague('all');
                                setSelectedDate('all');
                                setSearchQuery('');
                              }}
                              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition-colors cursor-pointer shadow-md shadow-blue-900/40"
                            >
                              Tüm Biten Maçları Göster (Filtreleri Sıfırla)
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>

          </div>
        )}

      </main>

      {/* Modal 1: Detailed Match Analysis Modal */}
      {selectedMatch && (
        <MatchDetailModal
          match={selectedMatch}
          analysis={activeAnalysis || (selectedMatch ? matchAnalysesMap.get(selectedMatch.id) || null : null)}
          onClose={() => setSelectedMatch(null)}
          betslipItems={betslipItems}
          onToggleBetslip={handleToggleBetslip}
          onOpenBetslip={() => setIsBetslipOpen(true)}
          onOpenLiveTV={handleOpenLiveTV}
        />
      )}

      {/* Modal 6: Kupon Hesaplayıcı & Betslip Drawer (Eager for instant response) */}
      <BetslipDrawer
        items={betslipItems}
        isOpen={isBetslipOpen}
        onOpen={() => setIsBetslipOpen(true)}
        onClose={() => setIsBetslipOpen(false)}
        onRemoveItem={handleRemoveBetslipItem}
        onClearAll={handleClearBetslip}
        onConsultAI={handleConsultAIFromSlip}
        onOpenLiveTV={handleOpenLiveTV}
        onSaveToBankroll={(items, stake, totalOdds, systemConfig) => {
          saveNewSlip(items, stake, totalOdds, systemConfig);
          setSavedSlips(getSavedSlips());
        }}
      />

      {/* Canlı Gol Sesi & Bildirim Kartı - Sadece Futbol Bölümünde */}
      {activeSection === 'football' && (
        <GoalNotificationToast
          goal={activeGoalToast}
          onClose={() => setActiveGoalToast(null)}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Modal: Kullanıcı Giriş & Kayıt Penceresi (Hızlı Eager Açılış) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(u) => {
          setCurrentUser(u);
          setIsAuthModalOpen(false);
          if (u.role !== 'admin' && !u.preferredInterest) {
            setIsOnboardingOpen(true);
          }
        }}
      />

      {/* On-Demand Lazy Loaded Modals (Code-Splitting) */}
      <React.Suspense fallback={null}>
        {isCustomAnalyzerOpen && (
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
        )}

        {isStandingsOpen && (
          <StandingsModal
            isOpen={isStandingsOpen}
            onClose={() => setIsStandingsOpen(false)}
          />
        )}

        {isInstallModalOpen && (
          <InstallAppModal
            isOpen={isInstallModalOpen}
            onClose={() => setIsInstallModalOpen(false)}
            deferredPrompt={deferredPrompt}
            onDirectInstall={handleDirectInstall}
          />
        )}

        {activeSection === 'football' && isAIChatOpen && (
          <AIChatModal
            isOpen={isAIChatOpen}
            onClose={() => setIsAIChatOpen(false)}
            allMatches={weeklyMatches}
            analysesMap={matchAnalysesMap}
            currentTime={currentTime}
            onSelectMatch={(m) => setSelectedMatch(m)}
            betslipMatchIds={betslipItems.map(it => String(it.matchId))}
            onAddCouponToBetslip={handleAddAICouponToBetslip}
            onAddItemToBetslip={handleAddAIItemToBetslip}
          />
        )}

        {/* 🤖 Floating Futbol AI Kupon Robotu FAB (Hareketli & İstenen Yere Taşınabilir) */}
        {activeSection === 'football' && !isAIChatOpen && (
          <DraggableAIFab
            id="football"
            onClick={() => setIsAIChatOpen(true)}
            title="AI Kupon Robotu & Canlı Maç Asistanı"
            label="AI Kupon Robotu"
            gradientClass="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600"
            borderColorClass="border-emerald-200/70"
            shadowColorClass="shadow-emerald-500/40 hover:shadow-emerald-500/70"
          />
        )}

        {isBankrollModalOpen && (
          <BankrollTrackerModal
            isOpen={isBankrollModalOpen}
            onClose={() => setIsBankrollModalOpen(false)}
            slips={settledSlips}
            stats={bankrollStats}
            onRefreshSlips={() => {
              setSavedSlips(getSavedSlips());
              setBankrollRefreshKey(k => k + 1);
            }}
          />
        )}

        {isThemeModalOpen && (
          <ThemeSelectorModal
            isOpen={isThemeModalOpen}
            onClose={() => setIsThemeModalOpen(false)}
            activeTheme={activeTheme}
            onSelectTheme={handleSelectTheme}
          />
        )}

        {isAIPerformanceOpen && (
          <AIPerformanceModal
            isOpen={isAIPerformanceOpen}
            onClose={() => setIsAIPerformanceOpen(false)}
            report={aiPerformanceReport}
            initialTab={aiPerformanceInitialTab}
          />
        )}

        {!!shareSlipCoupon && (
          <ShareSlipModal
            isOpen={!!shareSlipCoupon}
            onClose={() => setShareSlipCoupon(null)}
            coupon={shareSlipCoupon}
          />
        )}

        {isProfileModalOpen && (
          <ProfileModal
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
            user={currentUser}
            onUserUpdated={setCurrentUser}
            onOpenVIP={() => {
              setIsProfileModalOpen(false);
              setIsVipModalOpen(true);
            }}
            onLogout={handleLogout}
          />
        )}

        {isOnboardingOpen && (
          <OnboardingModal
            isOpen={isOnboardingOpen}
            onClose={() => setIsOnboardingOpen(false)}
            user={currentUser}
            onSelectInterest={(interest) => {
              if (interest === 'football') handleNavigateSection('football');
              else if (interest === 'horses') handleNavigateSection('horseRacing');
              else if (interest === 'stocks') handleNavigateSection('stocks');
            }}
          />
        )}

        {isVipModalOpen && (
          <VIPModal
            isOpen={isVipModalOpen}
            onClose={() => setIsVipModalOpen(false)}
            user={currentUser}
            onOpenAuth={() => {
              setIsVipModalOpen(false);
              setIsAuthModalOpen(true);
            }}
            onUserUpdated={(u) => {
              setCurrentUser(u);
            }}
          />
        )}

        {isAdminModalOpen && (
          <AdminModal
            isOpen={isAdminModalOpen}
            onClose={() => setIsAdminModalOpen(false)}
            currentUser={currentUser}
            onRefreshBulletin={handleRefreshBulletin}
            allMatches={allMatches}
            onOpenAdminAICoPilot={() => setIsAdminAICoPilotOpen(true)}
          />
        )}

        {isAdminAICoPilotOpen && (
          <React.Suspense fallback={<SectionLoadingFallback label="Admin Co-Pilot Başlatılıyor..." />}>
            <AdminAICoPilotModal
              isOpen={isAdminAICoPilotOpen}
              onClose={() => setIsAdminAICoPilotOpen(false)}
              currentUser={currentUser}
              clientContext={{
                bist: (() => {
                  try {
                    const saved = localStorage.getItem('proanaliz_bist_context');
                    if (saved) return JSON.parse(saved);
                  } catch {}
                  return (window as any).__PROANALIZ_BIST_CONTEXT__ || {};
                })(),
              }}
              onShowToast={(msg) => {
                setRefreshToast(msg);
                setTimeout(() => setRefreshToast(null), 3500);
              }}
            />
          </React.Suspense>
        )}

        {isShareModalOpen && (
          <ShareAppModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            user={currentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        )}

        {isFeedbackModalOpen && (
          <FeedbackModal
            isOpen={isFeedbackModalOpen}
            onClose={() => setIsFeedbackModalOpen(false)}
            onShowToast={(msg) => {
              setRefreshToast(msg);
              setTimeout(() => setRefreshToast(null), 3500);
            }}
            userEmail={currentUser?.email}
          />
        )}

        {isLiveTVModalOpen && (
          <LiveTVModal
            isOpen={isLiveTVModalOpen}
            targetMatch={liveTVTargetMatch}
            allLiveMatches={liveFiltered}
            onSelectMatch={(m) => setLiveTVTargetMatch(m)}
            onToggleBetslip={handleToggleBetslip}
            betslipItems={betslipItems}
            onClose={() => {
              setIsLiveTVModalOpen(false);
              setLiveTVTargetMatch(null);
            }}
          />
        )}

        {isLiveGoldModalOpen && (
          <LiveGoldModal
            isOpen={isLiveGoldModalOpen}
            onClose={() => setIsLiveGoldModalOpen(false)}
          />
        )}
      </React.Suspense>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-800/80 bg-slate-950 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="flex items-center justify-center space-x-2 text-slate-300 font-bold text-sm">
            <BrainCircuit className="w-4 h-4 text-emerald-400" />
            <span>ProAnaliz AI • Otomatik İddaa, At Yarışı &amp; Borsa Analiz Platformu</span>
          </div>

          {/* Legal Compliance & Age Restriction Badges */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-black shadow-sm">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
              <span>🔞 18+ Yaş Sınırı</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Sorumlu Oyun (Responsible Gaming)</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-xs font-bold text-amber-200 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
              <span>⚠️ YATIRIM TAVSİYESİ DEĞİLDİR (YTD)</span>
            </div>
          </div>

          {/* Detailed Legal Text */}
          <div className="max-w-2xl mx-auto space-y-2 text-xs text-slate-400 leading-relaxed bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
            <p>
              <strong className="text-rose-400 font-bold">18 Yaşından Küçüklerin Dikkatine:</strong> Türkiye Cumhuriyeti kanunları ve 7258 sayılı kanun uyarınca 18 yaşından küçüklerin bahis, şans oyunları ve iddaa oynaması kesinlikle yasaktır. ProAnaliz AI hiçbir şekilde bahis oynatmaz, para toplamaz, kupon yatırmaz veya aracılık etmez.
            </p>
            <p className="text-[11px] text-slate-500 border-t border-slate-800/60 pt-2">
              Sitede yer alan oranlar, yüzdeler ve kupon kombinasyonları Dixon-Coles Poisson modelleri, TJK AGF resmi verileri ve makine öğrenimi ile üretilmiş saf istatistiki simülasyonlardır. Şans oyunları bağımlılık riski taşır, lütfen bilinçli ve bütçenizi aşmayacak şekilde sorumlu oynayınız.
            </p>
          </div>

          <div className="text-[11px] text-slate-600">
            © 2026 ProAnaliz AI • Tüm Hakları Saklıdır • Canlı Veri &amp; Olasılık Simülasyonu
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar (sm:hidden) */}
      <MobileBottomNav
        activeSection={activeSection}
        activeTabMode={activeTabMode}
        onSelectSection={(sec) => handleNavigateSection(sec)}
        onSelectFootballTab={(tab) => {
          setActiveTabMode(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenStandings={() => setIsStandingsOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenVIP={() => setIsVipModalOpen(true)}
        user={currentUser}
        betslipCount={betslipItems.length}
        onOpenBetslip={() => setIsBetslipOpen(true)}
        horseSubTab={horseRacingSubTab}
        onSelectHorseSubTab={(tab) => {
          setHorseRacingSubTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSelectStockAction={(act) => {
          setStockExternalAction({ action: act, timestamp: Date.now() });
        }}
      />

    </div>
  );
};

export default App;

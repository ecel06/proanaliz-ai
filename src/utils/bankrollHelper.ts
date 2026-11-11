// src/utils/bankrollHelper.ts
// Virtual Bankroll & Saved Slip Tracking Engine for ProAnaliz AI.

import { Match, UserBetslipItem } from '../types';
import { getMatchLiveState } from './liveMatchHelper';
import { calculateSettledSystemPayout, SavedSystemConfig } from './systemBetHelper';

export interface SavedSlip {
  id: string;
  createdAt: string;
  stake: number;
  totalOdds: number;
  potentialWin: number;
  actualPayout?: number;
  items: UserBetslipItem[];
  status: 'pending' | 'won' | 'lost';
  systemConfig?: SavedSystemConfig;
  itemStatuses?: Record<string, 'won' | 'lost' | 'pending'>;
}

export interface BankrollStats {
  initialBankroll: number;
  currentBalance: number;
  netProfit: number;
  totalSlips: number;
  wonSlips: number;
  lostSlips: number;
  pendingSlips: number;
  winRate: number;
}

const STORAGE_KEY = 'proanaliz_saved_slips';
const BANKROLL_INIT_KEY = 'proanaliz_initial_bankroll';
const DEFAULT_INITIAL_BANKROLL = 10000;

export function getInitialBankroll(): number {
  if (typeof window === 'undefined') return DEFAULT_INITIAL_BANKROLL;
  try {
    const raw = localStorage.getItem(BANKROLL_INIT_KEY);
    const parsed = Number(raw);
    return isNaN(parsed) || parsed <= 0 ? DEFAULT_INITIAL_BANKROLL : parsed;
  } catch {
    return DEFAULT_INITIAL_BANKROLL;
  }
}

export function setInitialBankroll(amount: number): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BANKROLL_INIT_KEY, String(amount));
  } catch {}
}

export function getSavedSlips(): SavedSlip[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveNewSlip(
  items: UserBetslipItem[],
  stake: number,
  totalOdds: number,
  systemConfig?: SavedSystemConfig
): SavedSlip {
  const slips = getSavedSlips();
  const potentialWin = Math.round(stake * totalOdds * 100) / 100;
  const newSlip: SavedSlip = {
    id: `SLIP-${Date.now().toString(36).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    stake,
    totalOdds,
    potentialWin,
    items,
    status: 'pending',
    ...(systemConfig ? { systemConfig } : {})
  };

  const updated = [newSlip, ...slips];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
  return newSlip;
}

export function deleteSavedSlip(id: string): void {
  const slips = getSavedSlips().filter(s => s.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slips));
  } catch {}
}

export function clearAllSavedSlips(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

function evaluateSinglePickResult(
  pickKey: string,
  match: Match | undefined
): 'won' | 'lost' | 'pending' {
  if (!match) return 'pending';
  const live = getMatchLiveState(match);
  if (!live.isFinished) return 'pending';

  const homeG = live.displayScore.home;
  const awayG = live.displayScore.away;
  const totalG = homeG + awayG;
  const htHome = live.displayScore.htHome;
  const htAway = live.displayScore.htAway;
  const hasHt = htHome !== undefined && htAway !== undefined;

  if (pickKey === 'ms1') return homeG > awayG ? 'won' : 'lost';
  if (pickKey === 'msX' || pickKey === 'ms0') return homeG === awayG ? 'won' : 'lost';
  if (pickKey === 'ms2') return awayG > homeG ? 'won' : 'lost';

  if (pickKey === 'over15') return totalG >= 2 ? 'won' : 'lost';
  if (pickKey === 'under15') return totalG <= 1 ? 'won' : 'lost';
  if (pickKey === 'over25') return totalG >= 3 ? 'won' : 'lost';
  if (pickKey === 'under25') return totalG <= 2 ? 'won' : 'lost';
  if (pickKey === 'over35') return totalG >= 4 ? 'won' : 'lost';
  if (pickKey === 'under35') return totalG <= 3 ? 'won' : 'lost';

  if (pickKey === 'bttsYes') return homeG > 0 && awayG > 0 ? 'won' : 'lost';
  if (pickKey === 'bttsNo') return homeG === 0 || awayG === 0 ? 'won' : 'lost';

  if (pickKey === 'dc_1x') return homeG >= awayG ? 'won' : 'lost';
  if (pickKey === 'dc_12') return homeG !== awayG ? 'won' : 'lost';
  if (pickKey === 'dc_x2') return awayG >= homeG ? 'won' : 'lost';

  if (pickKey === 'ht_1') return hasHt ? (htHome > htAway ? 'won' : 'lost') : 'pending';
  if (pickKey === 'ht_X') return hasHt ? (htHome === htAway ? 'won' : 'lost') : 'pending';
  if (pickKey === 'ht_2') return hasHt ? (htAway > htHome ? 'won' : 'lost') : 'pending';

  if (pickKey.startsWith('htft_')) {
    if (!hasHt) return 'pending';
    const [htCode, ftCode] = pickKey.slice(5).replace(/_/g, '/').split('/');
    const actualHt = htHome > htAway ? '1' : htHome === htAway ? 'X' : '2';
    const actualFt = homeG > awayG ? '1' : homeG === awayG ? 'X' : '2';
    return actualHt === htCode && actualFt === ftCode ? 'won' : 'lost';
  }

  return 'pending';
}

/**
 * Evaluates slips against all matches in bulletin to auto-settle results (Kombine & Sistem + all markets).
 */
export function evaluateSlipsWithMatches(slips: SavedSlip[], matches: Match[]): SavedSlip[] {
  const matchMap = new Map<string, Match>();
  matches.forEach(m => matchMap.set(String(m.id), m));

  let hasChanges = false;

  const evaluated = slips.map(slip => {
    const itemStatuses: Record<string, 'won' | 'lost' | 'pending'> = {};
    for (const item of slip.items) {
      const m = matchMap.get(String(item.matchId));
      itemStatuses[String(item.matchId)] = evaluateSinglePickResult(item.pickKey, m);
    }

    if (slip.status === 'won' || slip.status === 'lost') {
      if (!slip.itemStatuses) {
        hasChanges = true;
        return { ...slip, itemStatuses };
      }
      return slip;
    }

    if (slip.systemConfig) {
      const settled = calculateSettledSystemPayout(slip.items, slip.systemConfig, itemStatuses);
      if (settled.status !== slip.status) {
        hasChanges = true;
        return {
          ...slip,
          status: settled.status,
          actualPayout: settled.payout,
          itemStatuses
        };
      }
      return { ...slip, itemStatuses };
    }

    const vals = Object.values(itemStatuses);
    const anyLost = vals.includes('lost');
    const anyPending = vals.includes('pending');

    let newStatus: 'pending' | 'won' | 'lost' = slip.status;
    let actualPayout = slip.actualPayout;
    if (anyLost) {
      newStatus = 'lost';
      actualPayout = 0;
      hasChanges = true;
    } else if (!anyPending && slip.items.length > 0) {
      newStatus = 'won';
      actualPayout = slip.potentialWin;
      hasChanges = true;
    }

    return {
      ...slip,
      status: newStatus,
      ...(actualPayout !== undefined ? { actualPayout } : {}),
      itemStatuses
    };
  });

  if (hasChanges && typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(evaluated));
    } catch {}
  }

  return evaluated;
}

export function calculateBankrollStats(slips: SavedSlip[], customInitial?: number): BankrollStats {
  const initialBankroll = customInitial !== undefined ? customInitial : getInitialBankroll();
  const totalSlips = slips.length;
  const wonSlips = slips.filter(s => s.status === 'won').length;
  const lostSlips = slips.filter(s => s.status === 'lost').length;
  const pendingSlips = slips.filter(s => s.status === 'pending').length;

  const totalStakes = slips.reduce((acc, s) => acc + s.stake, 0);
  const totalWonReturn = slips
    .filter(s => s.status === 'won')
    .reduce((acc, s) => acc + (s.actualPayout ?? s.potentialWin), 0);

  const currentBalance = initialBankroll - totalStakes + totalWonReturn;
  const netProfit = currentBalance - initialBankroll;
  const settled = wonSlips + lostSlips;
  const winRate = settled > 0 ? Math.round((wonSlips / settled) * 100) : 0;

  return {
    initialBankroll,
    currentBalance: Math.round(currentBalance),
    netProfit: Math.round(netProfit),
    totalSlips,
    wonSlips,
    lostSlips,
    pendingSlips,
    winRate
  };
}

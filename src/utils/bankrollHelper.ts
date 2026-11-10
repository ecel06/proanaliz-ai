// src/utils/bankrollHelper.ts
// Virtual Bankroll & Saved Slip Tracking Engine for ProAnaliz AI.

import { Match, UserBetslipItem } from '../types';
import { getMatchLiveState } from './liveMatchHelper';

export interface SavedSlip {
  id: string;
  createdAt: string;
  stake: number;
  totalOdds: number;
  potentialWin: number;
  items: UserBetslipItem[];
  status: 'pending' | 'won' | 'lost';
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

export function saveNewSlip(items: UserBetslipItem[], stake: number, totalOdds: number): SavedSlip {
  const slips = getSavedSlips();
  const newSlip: SavedSlip = {
    id: `SLIP-${Date.now().toString(36).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    stake,
    totalOdds,
    potentialWin: Math.round(stake * totalOdds * 100) / 100,
    items,
    status: 'pending'
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

/**
 * Evaluates slips against all matches in bulletin to auto-settle results.
 */
export function evaluateSlipsWithMatches(slips: SavedSlip[], matches: Match[]): SavedSlip[] {
  const matchMap = new Map<string, Match>();
  matches.forEach(m => matchMap.set(String(m.id), m));

  let hasChanges = false;

  const evaluated = slips.map(slip => {
    if (slip.status === 'won' || slip.status === 'lost') return slip;

    let allWon = true;
    let anyLost = false;
    let anyPending = false;

    for (const item of slip.items) {
      const match = matchMap.get(String(item.matchId));
      if (!match) {
        anyPending = true;
        continue;
      }

      const live = getMatchLiveState(match);

      if (!live.isFinished) {
        anyPending = true;
        continue;
      }

      // Match is finished, evaluate pick
      const homeG = live.displayScore.home;
      const awayG = live.displayScore.away;
      const totalG = homeG + awayG;

      let isPickWon = false;

      if (item.pickKey === 'ms1') isPickWon = homeG > awayG;
      else if (item.pickKey === 'msX') isPickWon = homeG === awayG;
      else if (item.pickKey === 'ms2') isPickWon = awayG > homeG;
      else if (item.pickKey === 'over25') isPickWon = totalG >= 3;
      else if (item.pickKey === 'under25') isPickWon = totalG <= 2;
      else if (item.pickKey === 'bttsYes') isPickWon = homeG > 0 && awayG > 0;
      else if (item.pickKey === 'bttsNo') isPickWon = homeG === 0 || awayG === 0;
      else {
        // Fallback for general picks
        isPickWon = homeG > awayG;
      }

      if (!isPickWon) {
        anyLost = true;
        allWon = false;
        break;
      }
    }

    let newStatus: 'pending' | 'won' | 'lost' = slip.status;
    if (anyLost) {
      newStatus = 'lost';
      hasChanges = true;
    } else if (allWon && !anyPending && slip.items.length > 0) {
      newStatus = 'won';
      hasChanges = true;
    }

    return { ...slip, status: newStatus };
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
    .reduce((acc, s) => acc + s.potentialWin, 0);

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

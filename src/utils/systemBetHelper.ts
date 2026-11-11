import { UserBetslipItem } from '../types';

export interface SystemBetCalculation {
  isSystemActive: boolean;
  bankoCount: number;
  normalCount: number;
  selectedSystems: number[];
  totalColumns: number;
  columnStake: number;
  totalCost: number;
  minWin: number;
  maxWin: number;
  effectiveMaxMultiplier: number;
  systemLabel: string;
}

function nChooseK(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  const effK = Math.min(k, n - k);
  let res = 1;
  for (let i = 1; i <= effK; i++) {
    res = (res * (n - effK + i)) / i;
  }
  return Math.round(res);
}

/**
 * Sum of products of all k-sized subsets from odds array.
 * Uses elementary symmetric polynomial DP in O(n * k) time — instant even for large slips.
 */
function sumOfKProducts(odds: number[], k: number): number {
  if (k === 0) return 1;
  if (k < 0 || k > odds.length) return 0;
  const dp = new Array(k + 1).fill(0);
  dp[0] = 1;
  for (const odd of odds) {
    for (let j = k; j >= 1; j--) {
      dp[j] += dp[j - 1] * odd;
    }
  }
  return dp[k];
}

export function getAvailableSystemNumbers(normalCount: number): number[] {
  if (normalCount <= 1) return normalCount === 1 ? [1] : [];
  const nums: number[] = [];
  for (let i = 1; i <= normalCount; i++) {
    nums.push(i);
  }
  return nums;
}

export function calculateSystemBet(
  items: UserBetslipItem[],
  bankoMatchIds: string[],
  rawSelectedSystems: number[],
  columnStake: number
): SystemBetCalculation {
  const bankoItems = items.filter(it => bankoMatchIds.includes(it.matchId));
  const normalItems = items.filter(it => !bankoMatchIds.includes(it.matchId));

  const bankoCount = bankoItems.length;
  const normalCount = normalItems.length;
  const stake = Math.max(1, columnStake || 0);

  // Sanitize selected system numbers to valid [1..normalCount] or default to [normalCount] (Kombine)
  let selectedSystems = rawSelectedSystems
    .filter(s => s >= 1 && s <= normalCount)
    .filter((s, idx, arr) => arr.indexOf(s) === idx)
    .sort((a, b) => a - b);

  if (selectedSystems.length === 0) {
    selectedSystems = normalCount > 0 ? [normalCount] : [];
  }

  const bankoProduct = bankoItems.reduce((acc, it) => acc * it.odd, 1);
  const normalOdds = normalItems.map(it => it.odd);
  const sortedNormalAsc = [...normalOdds].sort((a, b) => a - b);

  let totalColumns = 0;
  let totalMaxMultiplier = 0;

  if (normalCount === 0 && bankoCount > 0) {
    totalColumns = 1;
    totalMaxMultiplier = bankoProduct;
  } else {
    for (const s of selectedSystems) {
      totalColumns += nChooseK(normalCount, s);
      totalMaxMultiplier += bankoProduct * sumOfKProducts(normalOdds, s);
    }
  }

  // Minimum win occurs when all bankos hit and only the smallest k_min normal matches hit
  let minWinMultiplier = 0;
  if (normalCount === 0 && bankoCount > 0) {
    minWinMultiplier = bankoProduct;
  } else if (selectedSystems.length > 0) {
    const minS = selectedSystems[0];
    const smallestSubsetProduct = sortedNormalAsc
      .slice(0, minS)
      .reduce((acc, o) => acc * o, 1);
    minWinMultiplier = bankoProduct * smallestSubsetProduct;
  }

  const isKombineOnly =
    bankoCount === 0 &&
    selectedSystems.length === 1 &&
    selectedSystems[0] === normalCount;

  const isSystemActive = !isKombineOnly && items.length >= 2;
  const totalCost = Number((totalColumns * stake).toFixed(2));
  const minWin = Number((stake * minWinMultiplier).toFixed(2));
  const maxWin = Number((stake * totalMaxMultiplier).toFixed(2));

  const systemLabel = isKombineOnly
    ? 'Kombine (Tek Kolon)'
    : bankoCount > 0
    ? `${bankoCount} Banko + Sistem ${selectedSystems.join('-')}`
    : `Sistem ${selectedSystems.join('-')}`;

  return {
    isSystemActive,
    bankoCount,
    normalCount,
    selectedSystems,
    totalColumns,
    columnStake: stake,
    totalCost,
    minWin,
    maxWin,
    effectiveMaxMultiplier: Number(totalMaxMultiplier.toFixed(2)),
    systemLabel
  };
}


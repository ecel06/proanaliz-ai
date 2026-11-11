import { UserBetslipItem } from '../types';

export interface SystemBetCalculation {
  isSystemActive: boolean;
  bankoCount: number;
  normalCount: number;
  selectedSystems: number[]; // Total matches per column (e.g. 2, 3, 4 like Nesine/İddaa)
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
 * Uses elementary symmetric polynomial DP in O(n * k) time.
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

/**
 * Exact Nesine / İddaa system numbers (representing total matches per column).
 * - 0 Banko on 4 matches => [1, 2, 3, 4]
 * - 1 Banko on 4 matches => [2, 3, 4] (1 Banko + 1/2/3 others)
 * - N Banko on N matches => [N]
 */
export function getAvailableSystemNumbers(totalMatches: number, bankoCount: number): number[] {
  if (totalMatches <= 0) return [];
  if (totalMatches === 1) return [1];
  const minK = bankoCount > 0 ? Math.min(totalMatches, bankoCount + 1) : 1;
  const nums: number[] = [];
  for (let k = minK; k <= totalMatches; k++) {
    nums.push(k);
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

  const totalMatches = items.length;
  const bankoCount = bankoItems.length;
  const normalCount = normalItems.length;
  const stake = Math.max(1, columnStake || 0);

  const validChoices = getAvailableSystemNumbers(totalMatches, bankoCount);
  let selectedSystems = rawSelectedSystems
    .filter(k => validChoices.includes(k))
    .filter((k, idx, arr) => arr.indexOf(k) === idx)
    .sort((a, b) => a - b);

  if (selectedSystems.length === 0) {
    selectedSystems = totalMatches > 0 ? [totalMatches] : [];
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
    for (const k of selectedSystems) {
      const nonBankoPickCount = k - bankoCount;
      totalColumns += nChooseK(normalCount, nonBankoPickCount);
      totalMaxMultiplier += bankoProduct * sumOfKProducts(normalOdds, nonBankoPickCount);
    }
  }

  let minWinMultiplier = 0;
  if (normalCount === 0 && bankoCount > 0) {
    minWinMultiplier = bankoProduct;
  } else if (selectedSystems.length > 0) {
    const minNonBankoCount = Math.max(0, selectedSystems[0] - bankoCount);
    const smallestSubsetProduct = sortedNormalAsc
      .slice(0, minNonBankoCount)
      .reduce((acc, o) => acc * o, 1);
    minWinMultiplier = bankoProduct * smallestSubsetProduct;
  }

  const isKombineOnly =
    selectedSystems.length === 1 &&
    selectedSystems[0] === totalMatches;

  const isSystemActive = !isKombineOnly && totalMatches >= 2;
  const totalCost = Number((totalColumns * stake).toFixed(2));
  const minWin = Number((stake * minWinMultiplier).toFixed(2));
  const maxWin = Number((stake * totalMaxMultiplier).toFixed(2));

  const systemLabel = isKombineOnly
    ? 'Kombine'
    : bankoCount > 0
    ? `Sistem ${selectedSystems.join('-')} (${bankoCount}B)`
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

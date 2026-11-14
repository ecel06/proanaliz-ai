// src/utils/categoryFilterHelper.ts
import { Match, MatchAnalysis } from '../types';
import { detectMatchValueBets } from './valueBetHelper';

export type CategoryFilter = 'all' | 'banko' | 'over25' | 'btts' | 'htft' | 'favorites' | 'value';

/**
 * Single source of truth for matching a match to a category filter.
 * Used identically for both badge count calculation and match list filtering
 * to ensure 100% mathematical consistency.
 */
export function matchMatchesCategory(
  match: Match,
  analysis: MatchAnalysis | null | undefined,
  category: CategoryFilter,
  favorites: string[] = []
): boolean {
  if (category === 'all') return true;
  if (category === 'favorites') return favorites.includes(match.id);
  if (!analysis) return false;

  switch (category) {
    case 'value':
      return detectMatchValueBets(match, analysis).hasValue;

    case 'banko':
      return (
        analysis.primaryPrediction.confidence >= 70 ||
        analysis.primaryPrediction.badgeType === 'banko'
      );

    case 'over25':
      return analysis.over25 >= 55 || analysis.expectedTotalGoals >= 2.50;

    case 'btts':
      return (
        analysis.bttsYes >= 55 ||
        (analysis.expectedHomeGoals >= 1.2 && analysis.expectedAwayGoals >= 1.1)
      );

    case 'htft':
      return (
        (Array.isArray(analysis.topHtFt) && (analysis.topHtFt[0]?.prob || 0) >= 35) ||
        analysis.primaryPrediction.market === 'İlk Yarı / Maç Sonucu'
      );

    default:
      return true;
  }
}

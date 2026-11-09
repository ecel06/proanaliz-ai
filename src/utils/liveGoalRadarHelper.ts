// src/utils/liveGoalRadarHelper.ts
// Real-time Goal Pressure & Momentum Radar for in-play matches

import { Match, MatchAnalysis } from '../types';
import { getMatchLiveState } from './liveMatchHelper';

export interface LiveGoalRadarAlert {
  match: Match;
  analysis?: MatchAnalysis;
  minuteText: string;
  minuteNum: number;
  currentScoreText: string;
  goalProbability: number; // e.g. 78 (%)
  urgency: 'high' | 'critical';
  title: string;
  reason: string;
}

export function detectLiveGoalRadarAlerts(
  liveMatches: Match[],
  analysesMap: Map<string, MatchAnalysis>
): LiveGoalRadarAlert[] {
  const alerts: LiveGoalRadarAlert[] = [];

  for (const match of liveMatches) {
    const liveState = getMatchLiveState(match);
    if (!liveState.isLive) continue;

    const analysis = analysesMap.get(match.id);
    const minuteStr = liveState.liveMinute || '';
    const minuteNum = parseInt(minuteStr.replace(/\D/g, ''), 10) || 50;

    const homeScore = liveState.displayScore.home ?? 0;
    const awayScore = liveState.displayScore.away ?? 0;
    const totalGoals = homeScore + awayScore;
    const scoreDiff = Math.abs(homeScore - awayScore);

    // High goal pressure triggers:
    // Window A: Late 2nd half (60' - 88') with close score (0-0, 1-0, 0-1, 1-1, 2-1, 1-2)
    // Window B: Late 1st half (35' - 45') with 0-0 or 1-0
    const isLateGame = minuteNum >= 60 && minuteNum <= 88;
    const isLateFirstHalf = minuteNum >= 35 && minuteNum <= 45;
    const isCloseScore = scoreDiff <= 1 && totalGoals <= 3;

    if ((isLateGame || isLateFirstHalf) && isCloseScore) {
      const over25Rate = analysis?.over25 || 55;
      const bttsRate = analysis?.bttsYes || 50;
      const xG = analysis?.expectedTotalGoals || 2.4;

      // Base probability computed dynamically
      let goalProb = Math.min(88, Math.round(58 + (xG * 6) + (isLateGame ? (minuteNum - 60) * 0.5 : 5)));
      if (over25Rate >= 60 || bttsRate >= 60) goalProb = Math.min(92, goalProb + 6);

      const urgency: 'high' | 'critical' = minuteNum >= 75 || goalProb >= 80 ? 'critical' : 'high';

      let reason = '';
      if (isLateGame) {
        reason = `Dakika ${minuteNum}' • Skor ${homeScore}-${awayScore} • xG ${xG.toFixed(1)} baskısıyla her iki ekip de galibiyet golü için yükleniyor.`;
      } else {
        reason = `İlk yarı son dakikaları (${minuteNum}') • Devre bitmeden gol beklentisi yüksek.`;
      }

      alerts.push({
        match,
        analysis,
        minuteText: minuteStr || `${minuteNum}'`,
        minuteNum,
        currentScoreText: `${homeScore} - ${awayScore}`,
        goalProbability: goalProb,
        urgency,
        title: urgency === 'critical' ? '🔥 KRİTİK GOL ALARMI!' : '⚡ GOL BASKISI ARTTI',
        reason
      });
    }
  }

  // Sort by highest urgency and goal probability
  alerts.sort((a, b) => b.goalProbability - a.goalProbability);

  return alerts;
}

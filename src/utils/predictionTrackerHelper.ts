// src/utils/predictionTrackerHelper.ts
// Real-time evaluation of pre-match AI predictions against live and finished scores.

export interface PredictionLiveStatus {
  label: string;
  predictionLabel: string;
  confidence: number;
  isWinning: boolean; // true = Green, false = Red
  statusBadge: 'winning' | 'losing' | 'won' | 'lost';
  statusText: string;
  scoreSummary: string;
}

export function evaluatePredictionStatus(
  predictionLabel: string,
  confidence: number,
  homeScore: number,
  awayScore: number,
  isLive: boolean,
  isFinished: boolean,
  htHome?: number,
  htAway?: number
): PredictionLiveStatus {
  const norm = predictionLabel.toLowerCase();
  const totalGoals = homeScore + awayScore;
  const isBtts = homeScore > 0 && awayScore > 0;
  const isHomeLeading = homeScore > awayScore;
  const isAwayLeading = awayScore > homeScore;
  const isTied = homeScore === awayScore;

  let isHit = false;

  // 1. Match Outcome (MS 1, MS 2, MS X, Çifte Şans)
  if (norm.includes('ms 1') || norm.includes('ev sahibi')) {
    isHit = isHomeLeading;
  } else if (norm.includes('ms 2') || norm.includes('deplasman')) {
    isHit = isAwayLeading;
  } else if (norm.includes('ms x') || norm.includes('beraberlik')) {
    isHit = isTied;
  } else if (norm.includes('1x') || (norm.includes('çifte') && norm.includes('1'))) {
    isHit = isHomeLeading || isTied;
  } else if (norm.includes('x2') || (norm.includes('çifte') && norm.includes('2'))) {
    isHit = isAwayLeading || isTied;
  } else if (norm.includes('1-2') || norm.includes('12')) {
    isHit = !isTied;
  }

  // 2. Total Goals (2.5 Üst, 2.5 Alt, 1.5 Üst, 3.5 Alt)
  else if (norm.includes('2.5') && (norm.includes('üst') || norm.includes('over'))) {
    isHit = totalGoals >= 3;
  } else if (norm.includes('2.5') && (norm.includes('alt') || norm.includes('under'))) {
    isHit = isFinished ? totalGoals < 3 : totalGoals < 3; // if live and already 3+, permanently lost
  } else if (norm.includes('1.5') && (norm.includes('üst') || norm.includes('over'))) {
    isHit = totalGoals >= 2;
  } else if (norm.includes('3.5') && (norm.includes('alt') || norm.includes('under'))) {
    isHit = totalGoals < 4;
  }

  // 3. BTTS (KG Var / KG Yok)
  else if (norm.includes('kg var') || norm.includes('karşılıklı gol var')) {
    isHit = isBtts;
  } else if (norm.includes('kg yok') || norm.includes('karşılıklı gol yok')) {
    isHit = !isBtts;
  }

  // 4. First Half Goals (İY 0.5 Üst)
  else if (norm.includes('iy') || norm.includes('ilk yarı')) {
    const htTotal = (htHome ?? 0) + (htAway ?? 0);
    isHit = htTotal >= 1 || totalGoals >= 1;
  }

  // Fallback heuristic based on confidence
  else {
    isHit = isHomeLeading;
  }

  // Determine user-friendly badge status & text
  let statusBadge: 'winning' | 'losing' | 'won' | 'lost' = 'losing';
  let statusText = '';

  if (isFinished) {
    if (isHit) {
      statusBadge = 'won';
      statusText = '✅ TAHMİN TUTTU';
    } else {
      statusBadge = 'lost';
      statusText = '❌ TAHMİN YATTI';
    }
  } else if (isLive) {
    if (isHit) {
      statusBadge = 'winning';
      statusText = '🟢 ANLIK TUTUYOR';
    } else {
      statusBadge = 'losing';
      statusText = '🔴 ŞU AN TUTMUYOR';
    }
  }

  return {
    label: predictionLabel,
    predictionLabel,
    confidence,
    isWinning: isHit,
    statusBadge,
    statusText,
    scoreSummary: `${homeScore} - ${awayScore}`
  };
}

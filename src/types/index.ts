export type MatchResult = 'W' | 'D' | 'L'; // Win, Draw, Loss

export type LeagueCategory =
  | 'all'
  | 'super-lig'
  | '1-lig'
  | 'cl'
  | 'premier-league'
  | 'la-liga'
  | 'serie-a'
  | 'bundesliga'
  | 'europe';

export interface FormMatchDetail {
  result: MatchResult; // 'W' (G), 'D' (B), 'L' (M)
  opponent?: string; // Rakip takım adı (Varsa, örn: "Konyaspor")
  score?: string; // Maç skoru (Varsa, örn: "4 - 0" veya "0 - 4")
  isHome: boolean; // İç saha (İ) mi, Deplasman (D) mı?
  weekOrDate: string; // Örn: "10. Hafta" veya "01.11.2026"
  halfTimeScore?: string; // Varsa İlk Yarı skoru (Örn: "İY: 2-0")
}

export interface TeamStats {
  id: string;
  name: string;
  shortName: string;
  badge?: string;
  rank?: number;
  form: MatchResult[]; // e.g. ['W', 'W', 'D', 'W', 'L'] (En son maç en sağda)
  recentMatches?: FormMatchDetail[]; // Son 5 maçın detaylı rakip, skor ve saha bilgisi
  avgGoalsScored: number; // İç sahada/deplasmanda maç başı atılan gol
  avgGoalsConceded: number; // İç sahada/deplasmanda maç başı yenen gol
  firstHalfGoalRate: number; // İlk yarıda gol bulma yüzdesi (0.00 - 1.00)
  firstHalfLeadingRate: number; // İlk yarıyı önde kapatma yüzdesi (0.00 - 1.00)
  avgCorners: number; // Ortalama korner sayısı
  avgCards: number; // Ortalama kart sayısı
  shotsOnTargetAvg: number; // İsabetli şut ortalaması
  cleanSheetRate: number; // Gol yememe yüzdesi (0.00 - 1.00)
  primaryColor: string;
}

export interface Match {
  id: string;
  iddaaCode?: string;
  league: string;
  leagueCategory: LeagueCategory;
  country?: string;
  countryFlag?: string;
  round: string;
  date: string;
  time: string;
  utcDate?: string;
  dayCategory?: 'today' | 'tomorrow' | 'sunday' | 'monday' | 'other' | string;
  stadium: string;
  referee?: string;
  homeTeam: TeamStats;
  awayTeam: TeamStats;
  status?: 'upcoming' | 'live' | 'finished';
  liveMinute?: string;
  currentScore?: {
    home: number;
    away: number;
  };
  finalScore?: {
    home: number;
    away: number;
    htHome?: number;
    htAway?: number;
    actualCorners?: number;
    actualCards?: number;
  };
}

export interface HtFtItem {
  code: string; // '1/1', 'X/1', '2/1', '1/X', 'X/X', '2/X', '1/2', 'X/2', '2/2'
  label: string; // 'İY 1 / MS 1'
  prob: number; // %
}

export interface PrimaryPrediction {
  label: string; // '2.5 Üst', 'MS 1', 'KG Var', 'İY 1 / MS 1' vb.
  market: string; // 'Gol Sayısı', 'Maç Sonucu', 'Karşılıklı Gol', 'İlk Yarı / Maç Sonucu'
  confidence: number; // % 78
  badgeType: 'banko' | 'guclu' | 'surpriz';
  reason: string;
}

export interface MatchAnalysis {
  matchId?: string;
  // Maç Sonucu
  ms1: number;
  msX: number;
  ms2: number;
  
  // Alt / Üst Olasılıkları
  over15: number;
  under15: number;
  over25: number;
  under25: number;
  over35: number;
  under35: number;

  // Karşılıklı Gol
  bttsYes: number;
  bttsNo: number;

  // İlk Yarı / Maç Sonucu
  htFtRanked: HtFtItem[];
  topHtFt: HtFtItem[]; // En güçlü 2 kombinasyon

  // Beklenen Değerler (Poisson Çıktıları)
  expectedHomeGoals: number;
  expectedAwayGoals: number;
  expectedTotalGoals: number;
  expectedCorners: number;
  expectedCards: number;

  // Skor Olasılıkları (Örn: 2-1 %14, 1-1 %13)
  topExactScores: { score: string; prob: number }[];

  // Karşılaştırmalı Güç Değerleri (0-100)
  homeAttackScore: number;
  awayAttackScore: number;
  homeDefenseScore: number;
  awayDefenseScore: number;
  homeHtImpactScore: number;
  awayHtImpactScore: number;

  // Ana Tahmin ve AI Değerlendirmesi
  primaryPrediction: PrimaryPrediction;
  safePrediction?: PrimaryPrediction;
  surprisePrediction?: PrimaryPrediction;
  tacticalBreakdown?: {
    overview: string;
    attackVsDefense: string;
    tempoTempo: string;
    keyRisk: string;
  };
  aiComment: string;
}


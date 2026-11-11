// src/types/horseRacing.ts

export interface RaceCourseCondition {
  type: string;
  status: string;
  weight: number;
}

export interface HippodromeWeather {
  temperature: string;
  humidity: string;
  text: string;
  type: number;
}

export interface HippodromeProgram {
  id: number;
  totalDay: number;
  place: string;
  name: string;
  code: string;
  date: string;
  dateEpoch: number;
  isForeign: boolean;
  isNightRace: boolean;
  isCompleted: boolean;
  openingHour: string;
  closingHour: string;
  beginRaceHour: string;
  beginRaceTooltipMessage: string;
  hasActiveToteBet: boolean;
  hasActiveFOBBet: boolean;
  raceCourse: RaceCourseCondition[];
  weather: HippodromeWeather | null;
}

export interface HorseLast6Entry {
  result: string;
  raceCourseType: string;
}

export interface HorseAGFEntry {
  position: number;
  percentage: number;
  isFavorite: boolean;
}

export interface HorseJockey {
  name: string;
  fullName: string;
  apprentice: boolean;
  isJockeyChanged: boolean;
  oldJockeyName: string;
}

export interface HorseRunner {
  number: number;
  name: string;
  start: number;
  age: string;
  foal: string;
  weight: number;
  overweight: number;
  weightLoss: string;
  handicap: string;
  jockey: HorseJockey;
  owner: string;
  coach: string;
  breeder: string;
  parents: {
    father: string;
    mother: string;
    fatherOfMother: string;
  };
  equipment: string;
  uniformImageURL: string;
  kgs: number;
  last20: number;
  bestGrade: {
    value: string;
    descriptionText: string;
  } | null;
  stablemate: number;
  status: boolean; // false = Koşmaz / Çıktı
  favoriteColor: string;
  last6: HorseLast6Entry[];
  agf: HorseAGFEntry[];
  ganyan: number;
  fobOdd: number | null;
  order: number;
  degree: string;
  difference: string;
  delayedExit: string;
  trainingVideo: string;
}

export interface RaceMoneyItem {
  betTypeId: number;
  betTypeName: string;
  result: string;
  prize: number;
  prizeText: string;
  totalBonuses: number;
}

export interface IkiliProbableItem {
  runner1: string;
  runner2: string;
  ganyan: number;
}

export interface RaceCard {
  number: number;
  name: string;
  typeDescription: string;
  groupName: string;
  raceCourseType: string;
  distance: string;
  hour: string;
  gender: string;
  betsStr: string;
  bets: string;
  raceCourseChanged: string;
  distanceChanged: string;
  bestGradeDescription: string;
  last800: string;
  fotoFinish: string;
  video: string;
  isUnofficialResult: boolean;
  canceled: boolean;
  status: string;
  isFinished: boolean;
  horses: HorseRunner[];
  raceMoneys: RaceMoneyItem[];
  ikiliProbables: IkiliProbableItem[];
}

export interface BetLegMarkers {
  altili1Start?: number;
  altili2Start?: number;
  besliStart?: number;
  besli2Start?: number;
  dortluStart?: number;
  uclu1Start?: number;
  uclu2Start?: number;
  yediliStart?: number;
  yediliPlaseStart?: number;
}

export interface ScratchedRaceEntry {
  raceNumber: number;
  raceName: string;
  hour: string;
  scratchedRunners: { number: number; name: string; jockeyName: string }[];
}

export interface JockeyChangeRaceEntry {
  raceNumber: number;
  raceName: string;
  hour: string;
  horses: { number: number; name: string; oldJockeyName: string; newJockeyName: string }[];
}

export interface AltiliResultSummary {
  name: string;
  totalBonuses: string;
  unitPrize: string;
  legs: {
    number: number;
    raceNo: number;
    degree: string;
    isUnofficialResult: boolean;
    winners: { horseNo: number; horseName: string; ganyan: number }[];
  }[];
}

export interface ProgramSummary {
  altiliResults: AltiliResultSummary[];
  prizes: { betTypeName: string; prize: string; totalBonuses: string }[];
}

export interface ProgramDetail {
  program: HippodromeProgram;
  betLegs: BetLegMarkers;
  races: RaceCard[];
  scratches: ScratchedRaceEntry[];
  jockeyChanges: JockeyChangeRaceEntry[];
  summary: ProgramSummary | null;
  updatedAt: string;
}

export interface HorseRacingBulletinResponse {
  success: boolean;
  programs: HippodromeProgram[];
  selectedProgramId: number | null;
  activeProgramDetail: ProgramDetail | null;
  updatedAt: string;
}

export type HorseBetGameType =
  | 'ALTILI_1'
  | 'ALTILI_2'
  | 'BESLI'
  | 'DORTLU'
  | 'UCLU_1'
  | 'UCLU_2'
  | 'YEDILI_PLASE'
  | 'GANYAN';

export interface HorseAIAnalysis {
  horseNumber: number;
  score: number; // 0-100 composite AI rating
  tag: 'BANKO' | 'ALTERNATİF' | 'SÜRPRİZ' | 'BOMBA' | 'PLASE';
  reasons: string[];
}

export interface GeneratedAltiliCoupon {
  id: string;
  title: string;
  subtitle: string;
  strategy: 'EKONOMİK' | 'İDEAL' | 'GENİŞ' | 'BANKOLU SÜRPRİZ';
  gameType: HorseBetGameType;
  startRace: number;
  legs: { legIndex: number; raceNumber: number; horses: number[]; banko?: number }[];
  totalCombinations: number;
  estimatedCost: number;
  avgConfidence: number;
}

